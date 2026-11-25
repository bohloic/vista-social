import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const KNOWN_AUTH_COOKIES = [
  'pulsesocial_session',
  'pulsesocial_mfa_factors',
  'pulsesocial_email_otp',
  'pulsesocial_email_verified',
  'pulsesocial_oauth_state',
];

function buildLogoutResponse(req: NextRequest): NextResponse {
  const response = NextResponse.json(
    {
      success: true,
      message: 'Déconnexion effectuée avec succès. Tous les cookies ont été purgés.',
    },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Clear-Site-Data': '"cookies", "storage"',
      },
    }
  );

  const cookieNames = new Set<string>(KNOWN_AUTH_COOKIES);
  for (const c of req.cookies.getAll()) {
    if (c.name) cookieNames.add(c.name);
  }

  const isProd = process.env.NODE_ENV === 'production';

  for (const name of cookieNames) {
    response.cookies.set({
      name,
      value: '',
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
      expires: new Date(0),
    });
  }

  return response;
}

export async function POST(req: NextRequest) {
  return buildLogoutResponse(req);
}

export async function GET(req: NextRequest) {
  return buildLogoutResponse(req);
}
