import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createSignedSession, verifySignedSession } from '@/lib/auth-crypto';
import {
  AuthOAuthProvider,
  isSupportedAuthProvider,
  resolveOrCreateOAuthUser,
} from '@/lib/oauth-user';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    // 1. Check existing signed PulseSocial cookie first
    const sessionCookie = req.cookies.get('pulsesocial_session')?.value;
    if (sessionCookie) {
      const verified = verifySignedSession(sessionCookie);
      if (verified?.email) {
        const providerRaw = String(verified.authProvider || 'google').toLowerCase();
        const provider: AuthOAuthProvider = isSupportedAuthProvider(providerRaw)
          ? providerRaw
          : 'google';
        const userRecord = await resolveOrCreateOAuthUser({
          email: verified.email,
          provider,
          authUserId: verified.id || verified.userId,
        });
        return NextResponse.json({ success: true, user: userRecord });
      }
    }

    // 2. Otherwise verify Supabase SSR Auth cookie
    const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim();
    const supabaseAnonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim();
    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { success: false, error: 'Configuration Supabase manquante.' },
        { status: 503 }
      );
    }

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll() {
          // read-only verification
        },
      },
    });

    const { data, error } = await supabase.auth.getUser();
    if (error || !data?.user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Aucune session Google active détectée. Veuillez vous authentifier.',
        },
        { status: 401 }
      );
    }

    const rawProv = String(data.user.app_metadata?.provider || 'google').toLowerCase();
    const provider: AuthOAuthProvider = isSupportedAuthProvider(rawProv) ? rawProv : 'google';
    const userRecord = await resolveOrCreateOAuthUser({
      email: data.user.email,
      fullName:
        data.user.user_metadata?.full_name ||
        data.user.user_metadata?.name ||
        data.user.email?.split('@')[0],
      avatarUrl: data.user.user_metadata?.avatar_url || data.user.user_metadata?.picture || '',
      provider,
      authUserId: data.user.id,
    });

    const signedToken = createSignedSession({
      id: userRecord.id,
      userId: userRecord.id,
      email: userRecord.email,
      role: userRecord.role,
      workspaceId: userRecord.workspaceId,
      isLifetimeFree: userRecord.isLifetimeFree,
      authProvider: provider,
      exp: Date.now() + 30 * 24 * 60 * 60 * 1000,
    });

    const res = NextResponse.json({
      success: true,
      user: userRecord,
    });

    res.cookies.set({
      name: 'pulsesocial_session',
      value: signedToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    });

    return res;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur de vérification OAuth';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
