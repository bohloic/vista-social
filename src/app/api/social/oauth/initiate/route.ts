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

const COMPOSIO_TOOLKIT_MAP: Record<string, string> = {
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

    // 1. If COMPOSIO_API_KEY is configured, call Composio v3 Hosted OAuth 2.0 API
    if (apiKey && apiKey.length > 8) {
      try {
        const toolkitSlug = COMPOSIO_TOOLKIT_MAP[platform] || platform;
        const headers = {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        };

        // Step A: Find or create Composio v3 auth_config for the toolkit
        let authConfigId: string | undefined;
        const listConfigsRes = await fetch(
          `https://backend.composio.dev/api/v3/auth_configs?toolkit_slug=${encodeURIComponent(toolkitSlug)}`,
          { headers }
        );

        if (listConfigsRes.ok) {
          const listData = await listConfigsRes.json();
          const items = listData?.items || listData?.data || [];
          if (Array.isArray(items) && items.length > 0) {
            authConfigId = items[0].id;
          }
        }

        if (!authConfigId && listConfigsRes.status !== 401) {
          const createConfigRes = await fetch('https://backend.composio.dev/api/v3/auth_configs', {
            method: 'POST',
            headers,
            body: JSON.stringify({
              toolkit: { slug: toolkitSlug },
              auth_config: {
                type: 'use_composio_managed_auth',
                name: `PulseSocial_${toolkitSlug}`,
              },
            }),
          });
          if (createConfigRes.ok) {
            const createdConfig = await createConfigRes.json();
            authConfigId = createdConfig?.auth_config?.id || createdConfig?.id;
          }
        }

        // Step B: Create Connected Account OAuth link in Composio v3
        if (authConfigId) {
          const connectRes = await fetch('https://backend.composio.dev/api/v3/connected_accounts', {
            method: 'POST',
            headers,
            body: JSON.stringify({
              auth_config: { id: authConfigId },
              connection: {
                user_id: workspaceId || 'pulsesocial-default',
                callback_url: callbackUrl,
              },
            }),
          });

          if (connectRes.ok) {
            const connectData = await connectRes.json();
            const redirectUrl =
              connectData?.redirect_url ||
              connectData?.redirectUrl ||
              connectData?.connectionData?.val?.redirectUrl;

            if (redirectUrl) {
              return NextResponse.json({
                success: true,
                redirectUrl,
                connectionId: connectData?.id || connectData?.connectedAccountId,
                mode: 'composio_v3_live',
              });
            }
          }
        }
      } catch {
        // Fallback to hosted OAuth window below
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
