import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Allow public routes without authentication
  const isPublicRoute =
    pathname === '/login' ||
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

  // 2. Check for session cookie
  const sessionCookie = request.cookies.get('pulsesocial_session');

  if (!sessionCookie || !sessionCookie.value) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 3. Simple format check on session cookie
  try {
    const raw = Buffer.from(sessionCookie.value, 'base64').toString('utf-8');
    const { data } = JSON.parse(raw);
    const parsed = typeof data === 'string' ? JSON.parse(data) : data;

    if (parsed.exp && parsed.exp < Date.now()) {
      const loginUrl = new URL('/login', request.url);
      const response = NextResponse.redirect(loginUrl);
      response.cookies.delete('pulsesocial_session');
      return response;
    }
  } catch (err) {
    const loginUrl = new URL('/login', request.url);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete('pulsesocial_session');
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
