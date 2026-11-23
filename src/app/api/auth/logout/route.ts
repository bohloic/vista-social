import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST() {
  const response = NextResponse.json({
    success: true,
    message: 'Déconnexion effectuée avec succès.',
  });

  // Clear session cookie
  response.cookies.set({
    name: 'pulsesocial_session',
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });

  return response;
}
