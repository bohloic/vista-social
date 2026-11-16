import crypto from 'crypto';

const AUTH_SECRET = process.env.SUPABASE_SERVICE_ROLE_KEY || 'pulsesocial-auth-secure-secret-key-2026';

/**
 * Hash a password securely using scrypt with random salt.
 */
export function hashPassword(password: string): { hash: string; salt: string } {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, 64);
  return {
    hash: derivedKey.toString('hex'),
    salt,
  };
}

/**
 * Verify password against stored scrypt hash in constant time (anti-timing attacks).
 */
export function verifyPassword(password: string, storedHash: string, salt: string): boolean {
  if (!password || !storedHash || !salt) return false;
  try {
    const derivedKey = crypto.scryptSync(password, salt, 64);
    const keyBuffer = Buffer.from(derivedKey.toString('hex'), 'hex');
    const hashBuffer = Buffer.from(storedHash, 'hex');

    if (keyBuffer.length !== hashBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(keyBuffer, hashBuffer);
  } catch (err) {
    return false;
  }
}

/**
 * Sign session data with HMAC-SHA256.
 */
export function createSignedSession(payload: Record<string, any>): string {
  const data = JSON.stringify(payload);
  const signature = crypto.createHmac('sha256', AUTH_SECRET).update(data).digest('hex');
  return Buffer.from(JSON.stringify({ data, signature })).toString('base64');
}

/**
 * Verify HMAC-SHA256 session token and check expiration.
 */
export function verifySignedSession(token: string): Record<string, any> | null {
  try {
    const raw = Buffer.from(token, 'base64').toString('utf-8');
    const { data, signature } = JSON.parse(raw);

    const expectedSignature = crypto.createHmac('sha256', AUTH_SECRET).update(data).digest('hex');
    const expectedBuf = Buffer.from(expectedSignature, 'hex');
    const actualBuf = Buffer.from(signature, 'hex');

    if (expectedBuf.length !== actualBuf.length || !crypto.timingSafeEqual(expectedBuf, actualBuf)) {
      return null;
    }

    const parsed = JSON.parse(data);
    if (parsed.exp && parsed.exp < Date.now()) {
      return null;
    }

    return parsed;
  } catch (err) {
    return null;
  }
}

/**
 * Generate CSRF token for request protection.
 */
export function generateCsrfToken(): string {
  return crypto.randomBytes(32).toString('hex');
}
