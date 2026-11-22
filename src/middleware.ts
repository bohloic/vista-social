import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const AUTH_SECRET = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

/**
 * Origin validation for strict API CORS compliance [Action 6]
 * Strictly rejects wildcard '*' on authenticated endpoints.
 */
function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;
  try {
    const url = new URL(origin);
    const host = url.hostname;
    // Production domain
    if (host === 'vista-social-app.vercel.app') return true;
    // Vercel Preview domains
    if (host.endsWith('.vercel.app') && (host.startsWith('vista-social-') || host.includes('bohloic'))) return true;
    // Local development (port 3000 only)
    if (origin === 'http://localhost:3000' || origin === 'http://127.0.0.1:3000') return true;
    return false;
  } catch {
    return false;
  }
}

function applyCorsHeaders(response: NextResponse, origin: string | null): NextResponse {
  if (origin && isAllowedOrigin(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('Vary', 'Origin');
  }
  return response;
}

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
  if (!cookieValue || !AUTH_SECRET) return false;

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
  const origin = request.headers.get('origin');

  // Handle CORS preflight for /api/*
  if (pathname.startsWith('/api/') && request.method === 'OPTIONS') {
    if (origin && isAllowedOrigin(origin)) {
      return new NextResponse(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': origin,
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
          'Access-Control-Allow-Credentials': 'true',
          'Access-Control-Max-Age': '86400',
          'Vary': 'Origin',
        },
      });
    }
    return NextResponse.json({ error: 'Origin non autorisée', code: 'CORS_FORBIDDEN' }, { status: 403 });
  }

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

  // 2. Cryptographic session verification
  const sessionCookie = request.cookies.get('pulsesocial_session');
  const isValidSession = await isSessionValid(sessionCookie?.value);

  const authHeader = request.headers.get('authorization');
  const hasBearerToken = !!(authHeader && authHeader.startsWith('Bearer '));

  // Only consider authenticated if a verified cryptographic session or Bearer token is present
  const isAuthenticated = isValidSession || hasBearerToken;

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
    const res = NextResponse.next();
    if (pathname.startsWith('/api/')) {
      return applyCorsHeaders(res, origin);
    }
    return res;
  }

  // 5. Protected Routes: Rejection & Redirection
  if (!isAuthenticated) {
    if (pathname.startsWith('/api/')) {
      const errRes = NextResponse.json(
        { error: 'Authentification requise', code: 'UNAUTHENTICATED' },
        { status: 401 }
      );
      return applyCorsHeaders(errRes, origin);
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

  const res = NextResponse.next();
  if (pathname.startsWith('/api/')) {
    return applyCorsHeaders(res, origin);
  }
  return res;
}

export const config = {
  matcher: [
    '/',
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
