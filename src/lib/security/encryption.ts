import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGO = 'aes-256-gcm';
// Default fallback key for test environments & zero-config local dev (32 bytes = 64 hex characters)
const DEFAULT_DEV_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

function getKey(): Buffer {
  const raw = process.env.OAUTH_ENCRYPTION_KEY?.trim();
  if (raw && raw.length === 64) {
    return Buffer.from(raw, 'hex');
  }
  return Buffer.from(DEFAULT_DEV_KEY, 'hex');
}

/**
 * Encrypts sensitive tokens at rest using AES-256-GCM authenticated cipher.
 * Returns payload in format: iv.authTag.ciphertext (Base64)
 */
export function encryptToken(plain: string): string {
  if (!plain) return '';
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGO, getKey(), iv);
  const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString('base64')}.${authTag.toString('base64')}.${enc.toString('base64')}`;
}

/**
 * Decrypts sensitive tokens at rest using AES-256-GCM authenticated decipher.
 * Validates integrity via GCM auth tag.
 */
export function decryptToken(payload: string): string {
  if (!payload) return '';
  const parts = payload.split('.');
  if (parts.length !== 3) {
    // Legacy plaintext backward compatibility if token was not yet encrypted
    return payload;
  }
  const [ivB64, tagB64, dataB64] = parts;
  try {
    const decipher = createDecipheriv(ALGO, getKey(), Buffer.from(ivB64, 'base64'));
    decipher.setAuthTag(Buffer.from(tagB64, 'base64'));
    return Buffer.concat([decipher.update(Buffer.from(dataB64, 'base64')), decipher.final()]).toString('utf8');
  } catch {
    // If decryption fails (corrupted key or payload), fail safe
    return '';
  }
}
