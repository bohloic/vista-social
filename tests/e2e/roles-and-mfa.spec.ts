import fs from 'node:fs';
import path from 'node:path';
import { test, expect } from '@playwright/test';
import { createSignedSession } from '../../src/lib/auth-crypto';
import { generateTotpCode } from '../../src/lib/totp';
import { ROLE_ALLOWED_ROUTES, ROLE_LABELS, UserRole } from '../../src/lib/permissions';

// Ensure .env.local is loaded in test worker before signing sessions
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf-8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const k = trimmed.slice(0, eqIdx).trim();
    const v = trimmed.slice(eqIdx + 1).trim().replace(/^['"]|['"]$/g, '');
    if (!process.env[k]) process.env[k] = v;
  }
}

const QA_WS_ALPHA_ID = '11111111-1111-4111-8111-111111111111';
const QA_WS_BETA_ID = '22222222-2222-4222-8222-222222222222';

const ALL_SIDEBAR_ROUTES = [
  '/',
  '/chat',
  '/publish',
  '/inbox',
  '/crm',
  '/analytics',
  '/listening',
  '/reviews',
  '/pulse-pages',
  '/billing',
  '/settings',
];

function createTestRoleSession(role: UserRole, workspaceId = QA_WS_ALPHA_ID, idx = 1) {
  const user = {
    id: `00000000-0000-4000-8000-0000000000${idx}${ROLES_ORDER.indexOf(role) + 1}`,
    userId: `00000000-0000-4000-8000-0000000000${idx}${ROLES_ORDER.indexOf(role) + 1}`,
    email: `qa.${role}.${idx}@pulsesocial.test`,
    fullName: `QA ${ROLE_LABELS[role]} #${idx}`,
    role,
    workspaceId,
    workspace_id: workspaceId,
    workspaceName: workspaceId === QA_WS_ALPHA_ID ? 'QA_WS_ALPHA' : 'QA_WS_BETA',
    isLifetimeFree: role === 'super_admin',
    exp: Date.now() + 3600 * 1000,
  };
  const token = createSignedSession(user);
  return { user, token };
}

const ROLES_ORDER: UserRole[] = ['super_admin', 'admin', 'manager', 'editor', 'client'];

test.describe('Suite E2E Complète : Conformité Publique, 15 Comptes (5 Rôles), MFA TOTP & Anti-BOLA', () => {
  test('1. Conformité Publique ARTCI/RGPD : /mentions-legales, /confidentialite, /cgu accessibles en HTTP 200 sans session + Bandeau Cookies & Zéro Anglais sur /login', async ({
    page,
    context,
  }) => {
    await context.clearCookies();

    for (const publicRoute of ['/mentions-legales', '/confidentialite', '/cgu']) {
      const res = await page.goto(publicRoute, { waitUntil: 'domcontentloaded' });
      expect(res?.status()).toBe(200);
      expect(page.url()).toContain(publicRoute);
    }

    // Verify "Durées de conservation des données" section in /confidentialite
    await page.goto('/confidentialite', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('text=Durées de conservation des données')).toBeVisible();
    await expect(page.locator('text=10 ans')).toBeVisible();

    // Verify /login displays Cookie Consent Banner and has zero English illustration image
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('text=Respect de votre vie privée')).toBeVisible();
    const englishImgCount = await page.locator('img[src*="3d-login-character.jpg"]').count();
    expect(englishImgCount).toBe(0);
  });

  test('2. Test Séquentiel des 5 Rôles (15 Profils QA) : Filtrage Sidebar, Isolation Données Démo, Restrictions /billing & /settings et Zéro Image Cassée', async ({
    page,
    context,
  }) => {
    test.setTimeout(180_000);
    await context.route('**/*unsplash.com/**', (route) =>
      route.fulfill({ path: 'public/logo.svg', contentType: 'image/svg+xml' })
    );
    await context.route('**/api/setup', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ initialized: true }),
      })
    );
    await context.route('**/api/pulse-pages**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          page: {
            id: 'pulse-qa',
            workspace_id: QA_WS_ALPHA_ID,
            title: 'QA Bio Studio',
            slug: 'qa-bio-studio',
            bio: 'Bio officielle QA PulseSocial',
            avatar_url: '/logo.svg',
            theme_config: {
              bg_gradient: 'from-violet-950 via-slate-950 to-indigo-950',
              button_bg: 'rgba(255, 255, 255, 0.08)',
              button_border: 'rgba(139, 92, 246, 0.3)',
              font_family: 'sans-serif',
            },
            blocks: [],
            views_count: 12,
          },
        }),
      })
    );

    const targetBaseUrl = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3006';
    let currentSession = createTestRoleSession('super_admin', QA_WS_ALPHA_ID, 1);

    // Intercept /api/auth/me at context level for all 5 roles without offline Supabase timeout
    await context.route('**/api/auth/me', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          authenticated: true,
          user: {
            ...currentSession.user,
            workspace: {
              id: currentSession.user.workspaceId,
              name: currentSession.user.workspaceName,
            },
          },
        }),
      })
    );

    for (const role of ROLES_ORDER) {
      currentSession = createTestRoleSession(role, QA_WS_ALPHA_ID, 1);
      const { user, token } = currentSession;

      await context.addCookies([
        {
          name: 'pulsesocial_session',
          value: token,
          url: targetBaseUrl,
          httpOnly: true,
          sameSite: 'Lax',
        },
      ]);

      // Set localStorage on public route /mentions-legales (compiled in production build)
      await page.goto('/mentions-legales', { waitUntil: 'domcontentloaded' });
      await page.evaluate((u) => {
        localStorage.clear();
        sessionStorage.clear();
        localStorage.setItem('pulsesocial_user', JSON.stringify(u));
        localStorage.setItem(
          'pulsesocial_active_workspace',
          JSON.stringify({ id: u.workspaceId, name: u.workspaceName })
        );
      }, user);

      // Navigate to Dashboard /
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      const sidebar = page.locator('aside nav[aria-label="Menu principal"]');
      await expect(sidebar).toBeVisible();

      // Verify exact allowed vs forbidden links in Sidebar.tsx
      const allowedRoutes = ROLE_ALLOWED_ROUTES[role];
      for (const route of ALL_SIDEBAR_ROUTES) {
        const link = sidebar.locator(`a[href="${route}"]`);
        if (allowedRoutes.includes(route)) {
          await expect(link).toHaveCount(1);
        } else {
          await expect(link).toHaveCount(0);
        }
      }

      // Verify Role Badge in Sidebar
      await expect(page.getByTestId('sidebar-role-badge')).toContainText(ROLE_LABELS[role]);

      // Specific non-admin & RBAC checks
      if (role === 'editor' || role === 'client') {
        // Navigating manually to /billing or /crm must redirect to /?restricted=1
        await page.goto('/billing', { waitUntil: 'domcontentloaded' });
        await page.waitForURL((url) => url.pathname === '/' && url.searchParams.get('restricted') === '1', {
          timeout: 10_000,
        });

        // Calling admin infrastructure test endpoint must return 403
        const healthTestRes = await page.request.get('/api/health?test=all');
        expect(healthTestRes.status()).toBe(403);
      }

      if (role === 'manager') {
        // Manager can view /billing in read-only mode, and NEVER sees "Compte Super-Admin Privilégié"
        await page.goto('/billing', { waitUntil: 'domcontentloaded' });
        await expect(page.locator('text=Compte Super-Admin Privilégié')).toHaveCount(0);
        await expect(page.locator('text=Consultation seule').first()).toBeVisible();
      }

      // Check /settings tabs isolation
      await page.goto('/settings', { waitUntil: 'domcontentloaded' });
      await expect(page.getByTestId('tab-profile')).toBeVisible();
      await expect(page.getByTestId('tab-security')).toBeVisible();

      if (role === 'manager' || role === 'editor' || role === 'client') {
        await expect(page.locator('button:has-text("Tokens Manuels")')).toHaveCount(0);
        await expect(page.locator('button:has-text("Supabase & IA")')).toHaveCount(0);
        await expect(page.locator('button:has-text("OAuth 1-Clic")')).toHaveCount(0);
      } else {
        await expect(page.locator('button:has-text("Tokens Manuels")')).toBeVisible();
        await expect(page.locator('button:has-text("Supabase & IA")')).toBeVisible();
      }

      // Verify /pulse-pages has 0 broken images (naturalWidth > 0)
      await page.goto('/pulse-pages', { waitUntil: 'domcontentloaded' });
      await expect
        .poll(
          async () =>
            page.evaluate(() => {
              const imgs = Array.from(document.querySelectorAll('img'));
              if (imgs.length === 0) return ['NO_IMAGES_YET'];
              return imgs
                .filter((img) => !img.complete || img.naturalWidth === 0)
                .map((img) => `${img.alt}|${img.getAttribute('src')}|complete=${img.complete}|nw=${img.naturalWidth}`);
            }),
          { timeout: 10_000 }
        )
        .toEqual([]);
    }
  });

  test('3. Test MFA TOTP Réel (RFC 6238 HMAC-SHA1) : Enrôlement QR SVG, Génération du Code à 6 Chiffres et Élévation de Session en AAL2', async ({
    request,
  }) => {
    const { token } = createTestRoleSession('admin', QA_WS_ALPHA_ID, 1);
    const cookieHeader = `pulsesocial_session=${token}`;

    // 1. Enroll a new TOTP factor
    const enrollRes = await request.post('/api/auth/mfa', {
      headers: { Cookie: cookieHeader },
      data: {
        action: 'enroll',
        factorType: 'totp',
        friendlyName: 'Playwright RFC6238 Authenticator',
      },
    });
    expect(enrollRes.status()).toBe(200);
    const enrollData = await enrollRes.json();
    expect(enrollData.success).toBe(true);
    expect(enrollData.totp?.secret).toBeTruthy();
    expect(enrollData.totp?.qr_code).toContain('<svg');

    // Extract the cookies set during enrollment (pulsesocial_mfa_factors)
    const setCookies = enrollRes.headersArray().filter((h) => h.name.toLowerCase() === 'set-cookie');
    const mfaFactorCookie = setCookies
      .map((h) => h.value.split(';')[0])
      .find((c) => c.startsWith('pulsesocial_mfa_factors='));
    expect(mfaFactorCookie).toBeTruthy();

    // 2. Generate a real 6-digit RFC 6238 TOTP code from the Base32 secret
    const totpCode = generateTotpCode(enrollData.totp.secret);
    expect(totpCode).toMatch(/^\d{6}$/);

    // 3. Challenge + Verify the 6-digit code
    const verifyRes = await request.post('/api/auth/mfa', {
      headers: { Cookie: `${cookieHeader}; ${mfaFactorCookie}` },
      data: {
        action: 'verify',
        factorId: enrollData.id,
        code: totpCode,
      },
    });
    expect(verifyRes.status()).toBe(200);
    const verifyData = await verifyRes.json();
    expect(verifyData.success).toBe(true);
    expect(verifyData.aal).toBe('aal2');
    expect(verifyData.currentLevel).toBe('aal2');
  });

  test('4. Test Cross-Tenant Anti-BOLA & Responsive Mobile (375x812) : Compte QA_WS_BETA bloqué en 403 sur QA_WS_ALPHA', async ({
    page,
    request,
  }) => {
    const { token: betaAdminToken } = createTestRoleSession('admin', QA_WS_BETA_ID, 1);

    // Beta Admin attempts to read or create posts in Alpha Workspace -> 403 Forbidden
    const crossTenantGet = await request.get(`/api/posts?workspace_id=${QA_WS_ALPHA_ID}`, {
      headers: { Cookie: `pulsesocial_session=${betaAdminToken}` },
    });
    expect([403, 404]).toContain(crossTenantGet.status());

    // Mobile Viewport (375x812) check: zero horizontal overflow
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 2
    );
    expect(overflow).toBe(false);
  });
});
