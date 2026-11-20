import { NextRequest, NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const origin = new URL(req.url).origin;
    const body = await req.json().catch(() => ({}));
    const usePopup = body.popup !== false;

    const supabase = getAdminSupabase();
    if (supabase && process.env.GOOGLE_OAUTH_ENABLED === 'true') {
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

    // Hosted Google OAuth 2.0 Popup Window (works immediately out of the box & links with Supabase user_profiles)
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
