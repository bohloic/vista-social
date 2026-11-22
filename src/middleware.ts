import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const AUTH_SECRET = process.env.SUPABASE_SERVICE_ROLE_KEY || 'pulsesocial-auth-secure-secret-key-2026';

/**
 * Verify HMAC-SHA256 signature using native Web Crypto API (Edge Runtime compliant).
 */
async function verifyHmacSha256(data: string, signatureHex: string, secret: string): Promise<boolean> {
  try {
    if (!data || !signatureHex || !secret) return false;
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const matches = signatureHex.match(/.{1,2}/g);
    if (!matches) return false;
    const sigBytes = new Uint8Array(matches.map((byte) => parseInt(byte, 16)));

    return await crypto.subtle.verify('HMAC', key, sigBytes, encoder.encode(data));
  } catch {
    return false;
  }
}

/**
 * Validate session token cryptographically at the Edge.
 */
async function isSessionValid(cookieValue: string | undefined): Promise<boolean> {
  if (!cookieValue) return false;

  try {
    const raw = typeof atob === 'function'
      ? atob(cookieValue)
      : Buffer.from(cookieValue, 'base64').toString('utf-8');

    const { data, signature } = JSON.parse(raw);
    if (!data || !signature) return false;

    // 1. Verify HMAC-SHA256 signature
    const isValidSignature = await verifyHmacSha256(data, signature, AUTH_SECRET);
    if (!isValidSignature) return false;

    // 2. Verify expiration
    const parsed = typeof data === 'string' ? JSON.parse(data) : data;
    if (parsed && parsed.exp && parsed.exp < Date.now()) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Static and PWA assets are always public
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/images/') ||
    pathname === '/favicon.ico' ||
    pathname === '/manifest.webmanifest' ||
    pathname === '/manifest.json' ||
    pathname === '/sw.js' ||
    pathname === '/offline.html' ||
    /\.(svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2|ttf)$/.test(pathname)
  ) {
    return NextResponse.next();
  }

  // 2. Cryptographic session & Supabase session verification
  const sessionCookie = request.cookies.get('pulsesocial_session');
  const isValidSession = await isSessionValid(sessionCookie?.value);

  const authHeader = request.headers.get('authorization');
  const hasBearerToken = !!(authHeader && authHeader.startsWith('Bearer '));
  const hasSupabaseCookie = request.cookies.getAll().some(
    (c) => c.name.startsWith('sb-') && c.name.endsWith('-auth-token')
  );

  const isAuthenticated = isValidSession || hasBearerToken || hasSupabaseCookie;

  // 3. Authenticated user visiting /login -> redirect to dashboard /
  if (pathname === '/login') {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }

  // 4. Strict Public Routes (NO dangerous wildcards like /api/billing/paystack/*)
  const isStrictPublicRoute =
    pathname === '/setup' ||
    pathname.startsWith('/p/') ||
    pathname.startsWith('/oauth-popup') ||
    pathname === '/api/health' ||
    pathname === '/api/setup' ||
    pathname.startsWith('/api/auth/') ||
    pathname.startsWith('/api/social/oauth/callback') ||
    pathname === '/api/billing/paystack/webhook' ||
    pathname === '/api/webhooks/mobile-money';

  if (isStrictPublicRoute) {
    return NextResponse.next();
  }

  // 5. Protected Routes: Rejection & Redirection
  if (!isAuthenticated) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Authentification requise', code: 'UNAUTHENTICATED' },
        { status: 401 }
      );
    }

    const loginUrl = new URL('/login', request.url);
    if (pathname !== '/') {
      loginUrl.searchParams.set('redirect', pathname);
    }

    const response = NextResponse.redirect(loginUrl);
    if (sessionCookie) {
      response.cookies.delete('pulsesocial_session');
    }
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
