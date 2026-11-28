import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { resolveAppOrigin, sanitizeNextPath } from '@/lib/composio';
import { checkSupabaseProviderEnabled } from '@/lib/oauth-user';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const origin = resolveAppOrigin(req);
    const body = await req.json().catch(() => ({}));
    const usePopup = body?.popup === true;
    const safeNext = sanitizeNextPath(body?.next, '/');

    const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim();
    const supabaseAnonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim();

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { success: false, error: 'Configuration Supabase Auth manquante.' },
        { status: 503 }
      );
    }

    const googleEnabled = await checkSupabaseProviderEnabled('google');
    if (googleEnabled === false) {
      return NextResponse.json(
        {
          success: false,
          code: 'PROVIDER_NOT_CONFIGURED',
          error:
            "Le fournisseur Google n'est pas encore activé dans Supabase → Authentication → Providers.",
        },
        { status: 400 }
      );
    }

    const pendingCookies: Array<{ name: string; value: string; options?: Record<string, unknown> }> = [];
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          pendingCookies.push(...cookiesToSet);
        },
      },
    });

    const redirectTo = `${origin}/api/auth/callback?provider=google&next=${encodeURIComponent(safeNext)}${usePopup ? '&popup=1' : ''}`;
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        skipBrowserRedirect: true,
        scopes: 'openid email profile',
      },
    });

    if (error || !data?.url) {
      return NextResponse.json(
        {
          success: false,
          error: error?.message || "Impossible d'initialiser l'authentification Google Supabase.",
        },
        { status: 502 }
      );
    }

    const res = NextResponse.json({
      success: true,
      url: data.url,
      mode: 'supabase_google_oauth',
    });

    for (const c of pendingCookies) {
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
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur OAuth Google';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
