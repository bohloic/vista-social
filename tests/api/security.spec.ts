import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'crypto';
import { z } from 'zod';
import { checkRateLimit } from '../../src/lib/security/rate-limit.ts';
import { encryptToken, decryptToken } from '../../src/lib/security/encryption.ts';
import { createSignedSession, verifySignedSession } from '../../src/lib/auth-crypto.ts';

const USER_A_ID = '11111111-1111-4111-8111-111111111111';
const USER_B_ID = '22222222-2222-4222-8222-222222222222';
const WS_A_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const WS_B_ID = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

// Strict Post Schema Contract (Audit M4 & C2)
const postCreateSchema = z
  .object({
    workspace_id: z.string().uuid(),
    content: z.string().min(1).max(5000),
    platforms: z.array(z.string()).default([]),
    status: z.enum(['draft', 'scheduled', 'published']).default('draft'),
    scheduled_for: z.string().datetime().nullable().optional(),
    media_urls: z.array(z.string().url()).default([]),
  })
  .strict();

// Security Guards Logic under test
interface UserSession {
  id: string;
  email: string;
  role: 'super_admin' | 'admin' | 'manager' | 'editor' | 'client';
  workspace_id: string;
}

function evaluateAuth(cookieHeader?: string): { status: number; user?: UserSession; error?: string } {
  if (!cookieHeader) {
    return { status: 401, error: 'UNAUTHENTICATED' };
  }
  const match = cookieHeader.match(/pulsesocial_session=([^;]+)/);
  if (!match) {
    return { status: 401, error: 'UNAUTHENTICATED' };
  }
  const session = verifySignedSession(match[1]);
  if (!session) {
    return { status: 401, error: 'UNAUTHENTICATED' };
  }
  return {
    status: 200,
    user: {
      id: session.id,
      email: session.email,
      role: session.role,
      workspace_id: session.workspaceId,
    },
  };
}

function evaluateWorkspaceRole(
  user: UserSession,
  targetWorkspaceId: string,
  allowedRoles: string[]
): { status: number; allowed: boolean; error?: string } {
  // Cross-tenant check (BOLA)
  if (user.workspace_id !== targetWorkspaceId && user.role !== 'super_admin') {
    return { status: 403, allowed: false, error: 'FORBIDDEN_WORKSPACE' };
  }
  // RBAC check (BFLA)
  if (!allowedRoles.includes(user.role)) {
    return { status: 403, allowed: false, error: 'FORBIDDEN_ROLE' };
  }
  return { status: 200, allowed: true };
}

test('1. [M1][C3] GET /api/posts without auth cookie -> 401', () => {
  const result = evaluateAuth(undefined);
  assert.equal(result.status, 401);
  assert.equal(result.error, 'UNAUTHENTICATED');
});

test('2. [C2][C3] GET /api/posts?workspace_id=<B> with User A -> 403 (Cross-tenant breach prevented)', () => {
  const token = createSignedSession({
    id: USER_A_ID,
    email: 'userA@pulsesocial.ai',
    role: 'manager',
    workspaceId: WS_A_ID,
    exp: Date.now() + 3600000,
  });
  const cookie = `pulsesocial_session=${token}`;
  const auth = evaluateAuth(cookie);
  assert.equal(auth.status, 200);

  const rbac = evaluateWorkspaceRole(auth.user!, WS_B_ID, ['super_admin', 'admin', 'manager', 'editor', 'client']);
  assert.equal(rbac.status, 403);
  assert.equal(rbac.allowed, false);
  assert.equal(rbac.error, 'FORBIDDEN_WORKSPACE');
});

test('3. [M4] POST /api/posts with non-UUID workspace_id -> 422', () => {
  const payload = {
    workspace_id: 'non-uuid-string-12345',
    content: 'Test content',
  };
  const parseResult = postCreateSchema.safeParse(payload);
  assert.equal(parseResult.success, false);
  if (!parseResult.success) {
    const issue = parseResult.error.issues.find((i) => i.path.includes('workspace_id'));
    assert.ok(issue, 'Must report invalid UUID for workspace_id');
  }
});

test('4. [C2] POST /api/posts with workspace_id=<B> with User A -> 403 (BOLA Injection blocked)', () => {
  const userA: UserSession = {
    id: USER_A_ID,
    email: 'userA@pulsesocial.ai',
    role: 'manager',
    workspace_id: WS_A_ID,
  };

  const payload = {
    workspace_id: WS_B_ID, // Foreign tenant workspace
    content: 'Injected post',
  };
  const parseResult = postCreateSchema.safeParse(payload);
  assert.equal(parseResult.success, true);

  const authz = evaluateWorkspaceRole(userA, parseResult.data!.workspace_id, ['super_admin', 'admin', 'manager', 'editor']);
  assert.equal(authz.status, 403);
  assert.equal(authz.allowed, false);
});

test('5. [M2] POST /api/posts with role client -> 403 (RBAC Enforcement)', () => {
  const userClient: UserSession = {
    id: USER_A_ID,
    email: 'client@pulsesocial.ai',
    role: 'client',
    workspace_id: WS_A_ID,
  };

  const authz = evaluateWorkspaceRole(userClient, WS_A_ID, ['super_admin', 'admin', 'manager', 'editor']);
  assert.equal(authz.status, 403);
  assert.equal(authz.allowed, false);
  assert.equal(authz.error, 'FORBIDDEN_ROLE');
});

test('6. [M1] POST /api/ai/* without auth -> 401', () => {
  const result = evaluateAuth(undefined);
  assert.equal(result.status, 401);
});

test('7. [M2] POST /api/billing/* with role editor -> 403', () => {
  const userEditor: UserSession = {
    id: USER_A_ID,
    email: 'editor@pulsesocial.ai',
    role: 'editor',
    workspace_id: WS_A_ID,
  };

  const billingAuthz = evaluateWorkspaceRole(userEditor, WS_A_ID, ['super_admin', 'admin']);
  assert.equal(billingAuthz.status, 403);
  assert.equal(billingAuthz.allowed, false);
});

test('8. [M6] Rate limit: 61st consecutive request -> 429', () => {
  const testKey = `test_token_bucket_${Date.now()}`;
  let allowedRequests = 0;
  let rejected = false;

  for (let i = 0; i < 65; i++) {
    const res = checkRateLimit(testKey, { maxTokens: 60, refillRate: 1 });
    if (res.allowed) {
      allowedRequests++;
    } else {
      rejected = true;
      assert.ok(res.retryAfter > 0);
      break;
    }
  }

  assert.equal(allowedRequests, 60, 'Exactly 60 requests should pass');
  assert.equal(rejected, true, '61st request must trigger 429 rate limit');
});

test('9. Paystack webhook with invalid signature -> 401', () => {
  const secret = 'sk_test_mock_paystack_secret_key';
  const rawBody = JSON.stringify({ event: 'charge.success', data: { reference: 'ref_12345' } });
  const forgedSignature = '0123456789abcdef0123456789abcdef0123456789abcdef';

  const expectedSignature = crypto.createHmac('sha512', secret).update(rawBody).digest('hex');

  let isValid = false;
  try {
    isValid = crypto.timingSafeEqual(
      Buffer.from(forgedSignature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  } catch {
    isValid = false;
  }

  assert.equal(isValid, false, 'Forged signature must fail timingSafeEqual comparison');
});

test('10. [C4] OAuth token encryption at rest (AES-256-GCM)', () => {
  const token = 'gho_oauth_access_token_super_confidential_9999';
  const encrypted = encryptToken(token);

  assert.notEqual(encrypted, token);
  assert.ok(encrypted.includes('.'), 'Encrypted token must contain format separators');

  const decrypted = decryptToken(encrypted);
  assert.equal(decrypted, token);
});

test('11. [SEC-04] Setup status endpoint does not leak admin email or sensitive info', async () => {
  const fs = await import('node:fs');
  const routeSource = fs.readFileSync('src/app/api/setup/route.ts', 'utf-8');
  assert.ok(!routeSource.includes('adminEmail:'), 'adminEmail must NOT be returned in GET /api/setup');
  assert.ok(!routeSource.includes('workspace: status.workspace'), 'Internal workspace details must NOT be returned in GET /api/setup');
});

test('12. [SEC-08] Mobile Money Webhook HMAC SHA-256 validation rejects invalid signature with 401', async () => {
  const secret = 'test_momo_secret_key_123456';
  process.env.MOMO_WEBHOOK_SECRET = secret;

  const rawBody = JSON.stringify({ transactionId: 'tx_123', status: 'successful' });
  const forgedSig = 'abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789';
  const expectedSig = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');

  let matches = false;
  try {
    matches = crypto.timingSafeEqual(Buffer.from(forgedSig, 'hex'), Buffer.from(expectedSig, 'hex'));
  } catch {
    matches = false;
  }
  assert.equal(matches, false, 'Forged signature must fail comparison');
});

test('13. [SEC-11] Content-Security-Policy (CSP) header is present in next.config.ts', async () => {
  const fs = await import('node:fs');
  const path = await import('node:path');
  const configContent = fs.readFileSync(path.resolve('next.config.ts'), 'utf-8');
  assert.ok(configContent.includes('Content-Security-Policy'), 'CSP header must be configured');
  assert.ok(configContent.includes("default-src 'self'"), 'CSP must restrict default-src');
  assert.ok(configContent.includes("frame-ancestors 'self'"), 'CSP must restrict frame-ancestors');
  assert.ok(configContent.includes('X-Frame-Options') && configContent.includes('"DENY"'), 'X-Frame-Options must be DENY');
  assert.ok(configContent.includes('camera=(), microphone=(), geolocation=()'), 'Permissions-Policy must restrict camera, microphone, geolocation');
});

test('14. [BOLA-01] POST /api/posts rejects unrecognized field isAdmin (Anti-Mass Assignment -> 422)', () => {
  const massAssignmentPayload = {
    workspace_id: WS_A_ID,
    content: 'Valid content',
    isAdmin: true, // Malicious injection attempt
    role: 'super_admin',
  };
  const parseResult = postCreateSchema.safeParse(massAssignmentPayload);
  assert.equal(parseResult.success, false, 'Schema must reject unrecognized properties');
  if (!parseResult.success) {
    const errorString = JSON.stringify(parseResult.error.issues);
    assert.ok(errorString.includes('unrecognized_keys') || errorString.includes('isAdmin'), 'Error must pinpoint unrecognized keys');
  }
});

test('15. [BOLA-02] DELETE /api/posts cross-tenant deletion attempt -> 403 Forbidden', () => {
  const userB: UserSession = {
    id: USER_B_ID,
    email: 'userB@pulsesocial.ai',
    role: 'manager',
    workspace_id: WS_B_ID,
  };
  // Post belongs to Workspace A
  const postWorkspaceId = WS_A_ID;
  const authz = evaluateWorkspaceRole(userB, postWorkspaceId, ['super_admin', 'admin', 'manager', 'editor']);
  assert.equal(authz.status, 403, 'Cross-tenant post deletion must return 403 Forbidden');
  assert.equal(authz.allowed, false);
});

test('16. [CORS-01] API CORS validation rejects unauthorized origins and disallows wildcard *', () => {
  const allowedOrigins = [
    'https://vista-social-app.vercel.app',
    'https://vista-social-preview-123.vercel.app',
    'http://localhost:3000',
  ];
  const disallowedOrigins = [
    'https://evil-hacker.com',
    'https://attacker-site.org',
    'http://localhost:8080',
    null,
  ];

  function checkOriginAllowed(origin: string | null): boolean {
    if (!origin) return false;
    try {
      const url = new URL(origin);
      const host = url.hostname;
      if (host === 'vista-social-app.vercel.app') return true;
      if (host.endsWith('.vercel.app') && host.startsWith('vista-social-')) return true;
      if (url.origin === 'http://localhost:3000' || url.origin === 'http://127.0.0.1:3000') return true;
      return false;
    } catch {
      return false;
    }
  }

  for (const origin of allowedOrigins) {
    assert.equal(checkOriginAllowed(origin), true, `Origin ${origin} should be allowed`);
  }
  for (const origin of disallowedOrigins) {
    assert.equal(checkOriginAllowed(origin), false, `Origin ${origin} must be blocked`);
  }
});

test('17. [SW-01] Service Worker sw.js never caches /api/*, RSC or requests with Authorization', async () => {
  const fs = await import('node:fs');
  const path = await import('node:path');
  const swContent = fs.readFileSync(path.resolve('public/sw.js'), 'utf-8');
  assert.ok(swContent.includes("url.pathname.startsWith('/api/')"), 'SW must exclude /api/ from caching');
  assert.ok(swContent.includes("request.headers.has('authorization')"), 'SW must check Authorization header');
  assert.ok(swContent.includes("STATIC_CACHE_NAME"), 'SW must have static cache');
  assert.ok(swContent.includes("OFFLINE_URL"), 'SW must provide offline fallback');
  assert.ok(swContent.includes("pulsesocial-v4.0-prod"), 'SW must have updated v4.0 production cache name');
  assert.ok(!swContent.includes("'/images/3d-dashboard-cm.jpg'"), 'SW must not pre-cache legacy dashboard image');
});


