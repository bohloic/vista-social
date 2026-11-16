import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Check for session cookie
  const sessionCookie = request.cookies.get('pulsesocial_session');
  let isValidSession = false;

  if (sessionCookie && sessionCookie.value) {
    try {
      const raw = Buffer.from(sessionCookie.value, 'base64').toString('utf-8');
      const { data } = JSON.parse(raw);
      const parsed = typeof data === 'string' ? JSON.parse(data) : data;
      if (parsed && (!parsed.exp || parsed.exp >= Date.now())) {
        isValidSession = true;
      }
    } catch {
      isValidSession = false;
    }
  }

  // 2. Redirect authenticated users away from /login to dashboard /
  if (pathname === '/login') {
    if (isValidSession) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }

  // 3. Allow public routes without authentication
  const isPublicRoute =
    pathname === '/setup' ||
    pathname.startsWith('/p/') ||
    pathname.startsWith('/api/auth/') ||
    pathname === '/api/setup' ||
    pathname === '/api/health' ||
    pathname.startsWith('/_next') ||
    pathname.includes('.');

  if (isPublicRoute) {
    return NextResponse.next();
  }

  // 4. Protect all other routes (/, /publish, /inbox, /analytics, /listening, /reviews, /pulse-pages, /billing, /settings, /api/...)
  if (!isValidSession) {
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
