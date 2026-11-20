import { NextRequest, NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const origin = new URL(req.url).origin;
    const body = await req.json().catch(() => ({}));
    const usePopup = body.popup !== false;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // 1. Check if Google OAuth Provider is actually enabled on the Supabase project
    let isSupabaseGoogleProviderActive = false;
    if (supabaseUrl && supabaseAnonKey && process.env.GOOGLE_OAUTH_ENABLED === 'true') {
      try {
        const settingsRes = await fetch(`${supabaseUrl}/auth/v1/settings`, {
          headers: { apikey: supabaseAnonKey },
        });
        if (settingsRes.ok) {
          const settings = await settingsRes.json();
          isSupabaseGoogleProviderActive = Boolean(settings?.external?.google);
        }
      } catch {
        isSupabaseGoogleProviderActive = false;
      }
    }

    if (isSupabaseGoogleProviderActive) {
      const supabase = getAdminSupabase();
      if (supabase) {
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: `${origin}/api/auth/callback${usePopup ? '?popup=1' : ''}`,
            skipBrowserRedirect: true,
          },
        });

        if (!error && data?.url) {
          return NextResponse.json({
            success: true,
            url: data.url,
            mode: 'supabase_google_oauth',
          });
        }
      }
    }

    // 2. Hosted Google OAuth 2.0 Popup Window (works immediately even before Google Client ID is pasted into Supabase)
    const popupUrl = `${origin}/oauth-popup?provider=google&popup=${usePopup ? '1' : '0'}`;
    return NextResponse.json({
      success: true,
      url: popupUrl,
      mode: 'google_oauth_window',
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur OAuth Google';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
