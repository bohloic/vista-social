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

    // 1. Check if native Google OAuth Provider is enabled on the Supabase project
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

    // 2. Automated Google Sign-In via Composio Connect MCP Gateway
    // Uses official Google/Gmail Managed Auth link
    const composioApiKey = process.env.COMPOSIO_API_KEY?.trim();
    if (composioApiKey && composioApiKey.length > 8) {
      try {
        const mcpRes = await fetch('https://connect.composio.dev/mcp', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json, text/event-stream',
            'Authorization': `Bearer ${composioApiKey}`,
          },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'tools/call',
            params: {
              name: 'COMPOSIO_MANAGE_CONNECTIONS',
              arguments: {
                toolkits: ['gmail'],
              },
            },
            id: Date.now(),
          }),
          signal: AbortSignal.timeout(8000),
        });

        if (mcpRes.ok) {
          const mcpText = await mcpRes.text();
          let redirectUrl: string | null = null;
          for (const line of mcpText.split('\n')) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                const resText = data?.result?.content?.[0]?.text;
                if (resText) {
                  const parsedResult = JSON.parse(resText);
                  const gmailData = parsedResult?.data?.results?.['gmail'];
                  if (gmailData?.redirect_url) {
                    redirectUrl = gmailData.redirect_url;
                  }
                }
              } catch {
                // Ignore parse errors on SSE chunks
              }
            }
          }

          if (redirectUrl) {
            return NextResponse.json({
              success: true,
              url: redirectUrl,
              mode: 'composio_google_oauth',
            });
          }
        }
      } catch (err) {
        console.warn('Composio Google OAuth warning:', err);
      }
    }

    // 3. Fallback to developer integration modal
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
