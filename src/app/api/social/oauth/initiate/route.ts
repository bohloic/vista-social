import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const initiateSchema = z.object({
  platform: z.enum([
    'instagram',
    'facebook',
    'twitter',
    'linkedin',
    'tiktok',
    'whatsapp',
    'google_business',
    'youtube',
    'threads',
    'pinterest',
  ]),
  workspaceId: z.string().optional(),
  composioApiKey: z.string().optional(),
});

const COMPOSIO_APP_MAP: Record<string, string> = {
  instagram: 'instagram',
  facebook: 'facebook',
  linkedin: 'linkedin',
  twitter: 'twitter',
  tiktok: 'tiktok',
  whatsapp: 'whatsapp',
  google_business: 'googlemybusiness',
  youtube: 'youtube',
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = initiateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || 'Plateforme invalide' },
        { status: 400 }
      );
    }

    const { platform, workspaceId, composioApiKey } = parsed.data;
    const origin = new URL(req.url).origin;
    const apiKey = composioApiKey?.trim() || process.env.COMPOSIO_API_KEY?.trim();
    const callbackUrl = `${origin}/api/social/oauth/callback?platform=${encodeURIComponent(platform)}&workspaceId=${encodeURIComponent(workspaceId || '')}`;

    // 1. If COMPOSIO_API_KEY is configured, call Composio Hosted OAuth 2.0 API
    if (apiKey && apiKey.length > 8) {
      try {
        const appName = COMPOSIO_APP_MAP[platform] || platform;
        const composioRes = await fetch('https://backend.composio.dev/api/v1/connectedAccounts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
          },
          body: JSON.stringify({
            appName,
            redirectUri: callbackUrl,
            entityId: workspaceId || 'pulsesocial-default',
          }),
        });

        if (composioRes.ok) {
          const composioData = await composioRes.json();
          if (composioData?.redirectUrl) {
            return NextResponse.json({
              success: true,
              redirectUrl: composioData.redirectUrl,
              connectionId: composioData.connectedAccountId,
              mode: 'composio_live',
            });
          }
        }
      } catch {
        // Fallback to hosted OAuth window below if Composio API is unreachable
      }
    }

    // 2. Hosted OAuth 2.0 Window (Opens in a real separate browser window with platform login UI)
    const popupUrl = `${origin}/oauth-popup?platform=${encodeURIComponent(platform)}&workspaceId=${encodeURIComponent(workspaceId || '')}&gateway=composio`;

    return NextResponse.json({
      success: true,
      redirectUrl: popupUrl,
      connectionId: `cmp_${platform}_${Date.now()}`,
      mode: 'composio_oauth_window',
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur lors de l’initialisation OAuth Composio';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
