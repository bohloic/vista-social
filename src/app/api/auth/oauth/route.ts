import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { resolveAppOrigin, sanitizeNextPath } from '@/lib/composio';
import {
  AuthOAuthProvider,
  checkSupabaseProviderEnabled,
  isSupportedAuthProvider,
} from '@/lib/oauth-user';

export const dynamic = 'force-dynamic';

interface CapturedCookie {
  name: string;
  value: string;
  options?: Record<string, unknown>;
}

const PROVIDER_SCOPES: Record<AuthOAuthProvider, string | undefined> = {
  google: 'openid email profile',
  facebook: 'email,public_profile',
  apple: 'name email',
};

const PROVIDER_LABELS: Record<AuthOAuthProvider, string> = {
  google: 'Google',
  facebook: 'Facebook',
  apple: 'Apple',
};

function attachCookies(res: NextResponse, cookies: CapturedCookie[]) {
  for (const c of cookies) {
    res.cookies.set(c.name, c.value, {
      ...(c.options || {}),
      path: (c.options?.path as string | undefined) || '/',
      sameSite: (c.options?.sameSite as 'lax' | 'strict' | 'none' | undefined) || 'lax',
      httpOnly: c.options?.httpOnly !== undefined ? Boolean(c.options.httpOnly) : true,
      secure:
        c.options?.secure !== undefined
          ? Boolean(c.options.secure)
          : process.env.NODE_ENV === 'production',
    });
  }
  return res;
}

async function startOAuthFlow(
  req: NextRequest,
  provider: AuthOAuthProvider,
  safeNext: string,
  usePopup = false
): Promise<
  | { ok: true; url: string; pendingCookies: CapturedCookie[] }
  | { ok: false; code: string; error: string; status: number }
> {
  const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim();
  const supabaseAnonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim();

  if (!supabaseUrl || !supabaseAnonKey) {
    return {
      ok: false,
      code: 'SUPABASE_NOT_CONFIGURED',
      error: 'Configuration Supabase Auth manquante côté serveur.',
      status: 503,
    };
  }

  const providerEnabled = await checkSupabaseProviderEnabled(provider);
  if (providerEnabled === false) {
    return {
      ok: false,
      code: 'PROVIDER_NOT_CONFIGURED',
      error: `La connexion ${PROVIDER_LABELS[provider]} n'est pas encore activée dans Supabase → Authentication → Providers.`,
      status: 400,
    };
  }

  const origin = resolveAppOrigin(req);
  const callbackQuery = new URLSearchParams({
    provider,
    next: safeNext,
    ...(usePopup ? { popup: '1' } : {}),
  });
  const redirectTo = `${origin}/api/auth/callback?${callbackQuery.toString()}`;

  const pendingCookies: CapturedCookie[] = [];
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return req.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const item of cookiesToSet) {
          pendingCookies.push(item);
        }
      },
    },
  });

  const scopes = PROVIDER_SCOPES[provider];
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo,
      skipBrowserRedirect: true,
      ...(scopes ? { scopes } : {}),
    },
  });

  if (error || !data?.url) {
    return {
      ok: false,
      code: 'OAUTH_INIT_FAILED',
      error: error?.message || `Impossible d'initialiser la connexion ${PROVIDER_LABELS[provider]}.`,
      status: 502,
    };
  }

  return { ok: true, url: data.url, pendingCookies };
}

export async function GET(req: NextRequest) {
  const origin = resolveAppOrigin(req);
  const { searchParams } = new URL(req.url);
  const rawProvider = (searchParams.get('provider') || '').toLowerCase().trim();
  const safeNext = sanitizeNextPath(searchParams.get('next'), '/');

  if (!isSupportedAuthProvider(rawProvider)) {
    return NextResponse.redirect(`${origin}/login?error=unsupported_provider`, { status: 302 });
  }

  const result = await startOAuthFlow(req, rawProvider, safeNext, false);
  if (!result.ok) {
    const loginErrUrl = `${origin}/login?error=${encodeURIComponent(
      result.code === 'PROVIDER_NOT_CONFIGURED' ? 'provider_not_configured' : 'oauth_init_failed'
    )}&provider=${encodeURIComponent(rawProvider)}`;
    return NextResponse.redirect(loginErrUrl, { status: 302 });
  }

  const res = NextResponse.redirect(result.url, { status: 302 });
  return attachCookies(res, result.pendingCookies);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const rawProvider = String(body?.provider || '').toLowerCase().trim();
    const safeNext = sanitizeNextPath(body?.next, '/');
    const usePopup = body?.popup === true;

    if (!isSupportedAuthProvider(rawProvider)) {
      return NextResponse.json(
        { success: false, error: 'Fournisseur OAuth non supporté (google, facebook, apple).' },
        { status: 400 }
      );
    }

    const result = await startOAuthFlow(req, rawProvider, safeNext, usePopup);
    if (!result.ok) {
      return NextResponse.json(
        { success: false, code: result.code, error: result.error },
        { status: result.status }
      );
    }

    const res = NextResponse.json({
      success: true,
      url: result.url,
      provider: rawProvider,
      mode: 'supabase_oauth_pkce',
    });
    return attachCookies(res, result.pendingCookies);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur OAuth';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
