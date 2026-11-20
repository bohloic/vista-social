interface Bucket {
  count: number;
  resetAt: number;
}

// In-Memory Token Bucket Rate Limiter (Zero external dependencies)
const rateBuckets = new Map<string, Bucket>();

// Periodic cleanup to avoid memory leaks
const CLEANUP_INTERVAL = 60_000;
let lastCleanup = Date.now();

function purgeExpiredBuckets(now: number) {
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;
  for (const [key, bucket] of rateBuckets.entries()) {
    if (bucket.resetAt < now) {
      rateBuckets.delete(key);
    }
  }
}

export interface RateLimitOptions {
  maxTokens?: number;
  refillRate?: number;
  limit?: number;
  windowMs?: number;
}

export interface RateLimitResult {
  allowed: boolean;
  retryAfter: number;
}

/**
 * Extracts client IP from request headers safely.
 */
export function getClientIp(req: any): string {
  if (!req) return '127.0.0.1';
  try {
    const xForwardedFor = req.headers?.get ? req.headers.get('x-forwarded-for') : req.headers?.['x-forwarded-for'];
    if (xForwardedFor) {
      return String(xForwardedFor).split(',')[0].trim();
    }
    const xRealIp = req.headers?.get ? req.headers.get('x-real-ip') : req.headers?.['x-real-ip'];
    if (xRealIp) return String(xRealIp).trim();
  } catch {
    // fallback
  }
  return '127.0.0.1';
}

/**
 * Enforces per-key rate limiting (sliding window).
 * Returns { allowed, retryAfter }
 */
export function checkRateLimit(
  key: string,
  optionsOrLimit: number | RateLimitOptions = 60,
  windowMsArg = 60_000
): RateLimitResult {
  const limit = typeof optionsOrLimit === 'number'
    ? optionsOrLimit
    : (optionsOrLimit.maxTokens || optionsOrLimit.limit || 60);
  const windowMs = typeof optionsOrLimit === 'number'
    ? windowMsArg
    : (optionsOrLimit.windowMs || 60_000);

  const now = Date.now();
  purgeExpiredBuckets(now);

  let bucket = rateBuckets.get(key);

  if (!bucket || bucket.resetAt < now) {
    bucket = { count: 1, resetAt: now + windowMs };
    rateBuckets.set(key, bucket);
    return { allowed: true, retryAfter: 0 };
  }

  bucket.count += 1;
  if (bucket.count > limit) {
    const retryAfter = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
    return { allowed: false, retryAfter };
  }

  return { allowed: true, retryAfter: 0 };
}

/**
 * Resets a rate limit bucket (useful for test teardown and administrative overrides).
 */
export function resetRateLimit(key: string): void {
  rateBuckets.delete(key);
}
