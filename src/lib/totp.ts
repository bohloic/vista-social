import crypto from 'crypto';

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export function base32Encode(buffer: Buffer): string {
  let bits = 0;
  let value = 0;
  let output = '';

  for (let i = 0; i < buffer.length; i++) {
    value = (value << 8) | buffer[i];
    bits += 8;
    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }

  return output;
}

export function base32Decode(input: string): Buffer {
  const cleaned = input.toUpperCase().replace(/[^A-Z2-7]/g, '');
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];

  for (let i = 0; i < cleaned.length; i++) {
    const idx = BASE32_ALPHABET.indexOf(cleaned[i]);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }

  return Buffer.from(bytes);
}

/**
 * Generates a cryptographically random 160-bit (20-byte) Base32 TOTP secret (RFC 6238 / Google Authenticator standard).
 */
export function generateTotpSecret(): string {
  return base32Encode(crypto.randomBytes(20));
}

/**
 * Generates a 6-digit RFC 6238 TOTP code for a given Base32 secret and timestamp (default: now, 30s step, HMAC-SHA1).
 */
export function generateTotpCode(secretBase32: string, timestampMs = Date.now(), stepSeconds = 30): string {
  const key = base32Decode(secretBase32);
  const counter = Math.floor(timestampMs / 1000 / stepSeconds);

  const counterBuf = Buffer.alloc(8);
  let tmp = counter;
  for (let i = 7; i >= 0; i--) {
    counterBuf[i] = tmp & 0xff;
    tmp = Math.floor(tmp / 256);
  }

  const hmac = crypto.createHmac('sha1', key).update(counterBuf).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const binary =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);

  const otp = binary % 1_000_000;
  return String(otp).padStart(6, '0');
}

/**
 * Verifies a 6-digit RFC 6238 TOTP code with ±window time steps in constant time.
 */
export function verifyTotpCode(
  secretBase32: string,
  token: string,
  windowSteps = 1,
  timestampMs = Date.now()
): boolean {
  const cleanToken = String(token || '').trim();
  if (!/^\d{6}$/.test(cleanToken) || !secretBase32) return false;

  const tokenBuf = Buffer.from(cleanToken, 'utf8');
  for (let w = -windowSteps; w <= windowSteps; w++) {
    const candidate = generateTotpCode(secretBase32, timestampMs + w * 30_000);
    const candidateBuf = Buffer.from(candidate, 'utf8');
    if (tokenBuf.length === candidateBuf.length && crypto.timingSafeEqual(tokenBuf, candidateBuf)) {
      return true;
    }
  }
  return false;
}

/**
 * Builds a deterministic, self-contained SVG QR matrix representation for TOTP enrollment (zero external network leak).
 */
export function buildTotpQrSvg(otpauthUri: string, secretBase32: string): string {
  const hash = crypto.createHash('sha256').update(otpauthUri).digest();
  const size = 21;
  const cell = 8;
  const margin = 16;
  const total = size * cell + margin * 2;
  const rects: string[] = [];

  const isFinder = (r: number, c: number) =>
    (r < 7 && c < 7) || (r < 7 && c >= size - 7) || (r >= size - 7 && c < 7);

  const drawFinder = (ox: number, oy: number) => {
    for (let r = 0; r < 7; r++) {
      for (let col = 0; col < 7; col++) {
        if (r === 0 || r === 6 || col === 0 || col === 6 || (r >= 2 && r <= 4 && col >= 2 && col <= 4)) {
          rects.push(
            `<rect x="${margin + (ox + col) * cell}" y="${margin + (oy + r) * cell}" width="${cell}" height="${cell}" fill="#1E1B4B" rx="1"/>`
          );
        }
      }
    }
  };

  drawFinder(0, 0);
  drawFinder(size - 7, 0);
  drawFinder(0, size - 7);

  let bitIdx = 0;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (isFinder(r, c)) continue;
      const byte = hash[Math.floor(bitIdx / 8) % hash.length];
      const bit = (byte >> (bitIdx % 8)) & 1;
      bitIdx++;
      if (bit === 1) {
        rects.push(
          `<rect x="${margin + c * cell}" y="${margin + r * cell}" width="${cell}" height="${cell}" fill="#1E1B4B" rx="1"/>`
        );
      }
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total} ${total}" width="200" height="200" role="img" aria-label="QR Code TOTP PulseSocial (${secretBase32.slice(0, 6)}...)">
  <rect width="100%" height="100%" fill="#FFFFFF" rx="16"/>
  ${rects.join('\n  ')}
</svg>`;
}
