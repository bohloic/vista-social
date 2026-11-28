import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { getAdminSupabase } from '@/lib/supabase';
import { createSignedSession } from '@/lib/auth-crypto';
import { safeJsonForScript } from '@/lib/security/guards';
import { resolveAppOrigin, sanitizeNextPath } from '@/lib/composio';
import {
  AuthOAuthProvider,
  isSupportedAuthProvider,
  resolveOrCreateOAuthUser,
} from '@/lib/oauth-user';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const origin = resolveAppOrigin(req);
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const popup = url.searchParams.get('popup') === '1';
  const safeNext = sanitizeNextPath(url.searchParams.get('next'), '/');
  const rawProvParam = (url.searchParams.get('provider') || '').toLowerCase().trim();
  const oauthError = url.searchParams.get('error') || url.searchParams.get('error_description');

  if (oauthError) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(oauthError)}&provider=${encodeURIComponent(rawProvParam || 'oauth')}`,
      { status: 302 }
    );
  }

  // [STRIX-01 Fix]: Strictly require a real OAuth authorization code. Never trust raw email query params.
  if (!code) {
    return NextResponse.redirect(
      `${origin}/login?error=auth_cancelled&provider=${encodeURIComponent(rawProvParam || 'oauth')}`,
      { status: 302 }
    );
  }

  const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim();
  const supabaseAnonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim();
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.redirect(`${origin}/login?error=database_unavailable`, { status: 302 });
  }

  try {
    const pendingCookies: Array<{ name: string; value: string; options?: Record<string, unknown> }> = [];
    const ssrSupabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          pendingCookies.push(...cookiesToSet);
        },
      },
    });

    const { data, error } = await ssrSupabase.auth.exchangeCodeForSession(code);
    if (error || !data?.user) {
      return NextResponse.redirect(
        `${origin}/login?error=oauth_exchange_failed&provider=${encodeURIComponent(rawProvParam || 'oauth')}`,
        { status: 302 }
      );
    }

    const detectedProvider = String(
      rawProvParam || data.user.app_metadata?.provider || 'google'
    ).toLowerCase();
    const provider: AuthOAuthProvider = isSupportedAuthProvider(detectedProvider)
      ? detectedProvider
      : 'google';

    const meta = (data.user.user_metadata || {}) as Record<string, unknown>;
    const email = (data.user.email || '').toLowerCase().trim();
    const fullName =
      (typeof meta.full_name === 'string' && meta.full_name) ||
      (typeof meta.name === 'string' && meta.name) ||
      (email ? email.split('@')[0] : `Utilisateur ${provider}`);
    const avatarUrl =
      (typeof meta.avatar_url === 'string' && meta.avatar_url) ||
      (typeof meta.picture === 'string' && meta.picture) ||
      '';

    const userRecord = await resolveOrCreateOAuthUser({
      email,
      fullName,
      avatarUrl,
      provider,
      authUserId: data.user.id,
    });

    const sessionToken = createSignedSession({
      id: userRecord.id,
      userId: userRecord.id,
      email: userRecord.email,
      role: userRecord.role,
      workspaceId: userRecord.workspaceId,
      isLifetimeFree: userRecord.isLifetimeFree,
      authProvider: provider,
      exp: Date.now() + 30 * 24 * 60 * 60 * 1000,
    });

    if (popup) {
      const html = `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"><title>Authentification réussie</title></head>
<body style="background:#07090E;color:#fff;font-family:system-ui;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">
  <div style="text-align:center;">
    <p style="font-size:14px;color:#34d399;font-weight:bold;">✓ Connexion validée. Redirection en cours...</p>
  </div>
  <script>
    try {
      if (window.opener) {
        window.opener.postMessage({
          type: 'GOOGLE_AUTH_SUCCESS',
          user: ${safeJsonForScript(userRecord)}
        }, window.location.origin);
      }
    } catch (e) {}
    setTimeout(() => { window.close(); }, 300);
  </script>
</body>
</html>`;
      const res = new NextResponse(html, {
        status: 200,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
      for (const c of pendingCookies) {
        res.cookies.set(c.name, c.value, {
          ...(c.options || {}),
          path: (c.options?.path as string | undefined) || '/',
        });
      }
      res.cookies.set('pulsesocial_session', sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60,
      });
      return res;
    }

    const redirectUrl = new URL(safeNext, origin);
    const redirectRes = NextResponse.redirect(redirectUrl, { status: 302 });
    for (const c of pendingCookies) {
      redirectRes.cookies.set(c.name, c.value, {
        ...(c.options || {}),
        path: (c.options?.path as string | undefined) || '/',
      });
    }
    redirectRes.cookies.set('pulsesocial_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60,
    });
    return redirectRes;
  } catch {
    return NextResponse.redirect(
      `${origin}/login?error=oauth_failed&provider=${encodeURIComponent(rawProvParam || 'oauth')}`,
      { status: 302 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const accessToken = typeof body?.accessToken === 'string' ? body.accessToken.trim() : '';

    // [STRIX-01 Fix]: Never mint a session from an unverified email in POST /api/auth/callback.
    // Require a valid Supabase OAuth access_token verified server-side.
    if (!accessToken) {
      return NextResponse.json(
        { success: false, error: 'Jeton OAuth requis pour la validation de session.' },
        { status: 401 }
      );
    }

    const supabase = getAdminSupabase();
    if (!supabase) {
      return NextResponse.json({ success: false, error: 'Service indisponible' }, { status: 503 });
    }

    const { data: authData, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !authData?.user) {
      return NextResponse.json(
        { success: false, error: 'Jeton OAuth invalide ou expiré.' },
        { status: 401 }
      );
    }

    const rawProv = String(authData.user.app_metadata?.provider || 'google').toLowerCase();
    const provider: AuthOAuthProvider = isSupportedAuthProvider(rawProv) ? rawProv : 'google';
    const meta = (authData.user.user_metadata || {}) as Record<string, unknown>;
    const email = (authData.user.email || '').toLowerCase().trim();
    const fullName =
      (typeof meta.full_name === 'string' && meta.full_name) ||
      (typeof meta.name === 'string' && meta.name) ||
      (email ? email.split('@')[0] : `Utilisateur ${provider}`);
    const avatarUrl =
      (typeof meta.avatar_url === 'string' && meta.avatar_url) ||
      (typeof meta.picture === 'string' && meta.picture) ||
      '';

    const userRecord = await resolveOrCreateOAuthUser({
      email,
      fullName,
      avatarUrl,
      provider,
      authUserId: authData.user.id,
    });

    const sessionToken = createSignedSession({
      id: userRecord.id,
      userId: userRecord.id,
      email: userRecord.email,
      role: userRecord.role,
      workspaceId: userRecord.workspaceId,
      isLifetimeFree: userRecord.isLifetimeFree,
      authProvider: provider,
      exp: Date.now() + 30 * 24 * 60 * 60 * 1000,
    });

    const res = NextResponse.json({ success: true, user: userRecord });
    res.cookies.set('pulsesocial_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60,
    });
    return res;
  } catch {
    return NextResponse.json({ success: false, error: 'Erreur callback OAuth' }, { status: 500 });
  }
}
