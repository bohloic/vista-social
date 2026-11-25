import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireUser, requireWorkspaceRole, handleApiError } from '@/lib/security/guards';
import {
  buildComposioCallbackUrl,
  ComposioApiError,
  createComposioConnectLink,
  isComposioConfigured,
  resolveAppOrigin,
} from '@/lib/composio';

export const dynamic = 'force-dynamic';

const initiateSchema = z
  .object({
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
  })
  .strict();

// Official Direct OAuth 2.0 URLs for each provider (if custom client IDs are configured)
function getDirectPlatformOAuthUrl(platform: string, callbackUrl: string): string | null {
  const metaAppId = process.env.META_APP_ID || process.env.FACEBOOK_CLIENT_ID;
  const linkedinClientId = process.env.LINKEDIN_CLIENT_ID;
  const twitterClientId = process.env.TWITTER_CLIENT_ID;
  const tiktokClientKey = process.env.TIKTOK_CLIENT_KEY;
  const googleClientId = process.env.GOOGLE_CLIENT_ID;
  const pinterestAppId = process.env.PINTEREST_APP_ID;

  switch (platform) {
    case 'facebook':
    case 'instagram':
    case 'whatsapp':
    case 'threads':
      if (metaAppId) {
        const scopes = 'pages_show_list,pages_read_engagement,pages_manage_posts,instagram_basic,instagram_content_publish';
        return `https://www.facebook.com/v20.0/dialog/oauth?client_id=${encodeURIComponent(metaAppId)}&redirect_uri=${encodeURIComponent(callbackUrl)}&scope=${encodeURIComponent(scopes)}&response_type=code`;
      }
      break;

    case 'linkedin':
      if (linkedinClientId) {
        const scopes = 'openid profile email w_member_social';
        return `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${encodeURIComponent(linkedinClientId)}&redirect_uri=${encodeURIComponent(callbackUrl)}&scope=${encodeURIComponent(scopes)}`;
      }
      break;

    case 'twitter':
      if (twitterClientId) {
        const scopes = 'tweet.read tweet.write users.read offline.access';
        return `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=${encodeURIComponent(twitterClientId)}&redirect_uri=${encodeURIComponent(callbackUrl)}&scope=${encodeURIComponent(scopes)}&state=pulsesocial&code_challenge=challenge&code_challenge_method=plain`;
      }
      break;

    case 'tiktok':
      if (tiktokClientKey) {
        const scopes = 'user.info.basic,video.publish,video.upload';
        return `https://www.tiktok.com/v2/auth/authorize/?client_key=${encodeURIComponent(tiktokClientKey)}&scope=${encodeURIComponent(scopes)}&response_type=code&redirect_uri=${encodeURIComponent(callbackUrl)}`;
      }
      break;

    case 'youtube':
    case 'google_business':
      if (googleClientId) {
        const scopes = 'https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/business.manage openid email';
        return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(googleClientId)}&redirect_uri=${encodeURIComponent(callbackUrl)}&response_type=code&scope=${encodeURIComponent(scopes)}&access_type=offline&prompt=consent`;
      }
      break;

    case 'pinterest':
      if (pinterestAppId) {
        const scopes = 'boards:read,pins:read,pins:write';
        return `https://www.pinterest.com/oauth/?client_id=${encodeURIComponent(pinterestAppId)}&redirect_uri=${encodeURIComponent(callbackUrl)}&response_type=code&scope=${encodeURIComponent(scopes)}`;
      }
      break;
  }

  return null;
}

const COMPOSIO_TOOLKIT_MAP: Record<string, string> = {
  instagram: 'instagram',
  facebook: 'facebook',
  linkedin: 'linkedin',
  twitter: 'twitter',
  tiktok: 'tiktok',
  whatsapp: 'whatsapp',
  google_business: 'googlemybusiness',
  youtube: 'youtube',
  pinterest: 'pinterest',
  threads: 'threads',
};

export async function POST(req: NextRequest) {
  try {
    // [STRIX-05 Fix]: Enforce authentication and workspace ownership
    const user = await requireUser(req);
    const body = await req.json();
    const parsed = initiateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || 'Plateforme invalide' },
        { status: 400 }
      );
    }

    const { platform, workspaceId: requestedWsId } = parsed.data;
    const isUuid =
      typeof requestedWsId === 'string' &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(requestedWsId);
    const workspaceId = isUuid ? requestedWsId : (user.workspaceId || user.workspace_id);

    if (workspaceId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(workspaceId)) {
      await requireWorkspaceRole(user.id, workspaceId, ['super_admin', 'admin', 'manager', 'editor'], user.role);
    }

    const origin = resolveAppOrigin(req);
    const callbackUrl = `${origin}/api/social/oauth/callback?platform=${encodeURIComponent(platform)}&workspaceId=${encodeURIComponent(workspaceId || '')}`;

    // 1. Direct custom developer credentials (if explicitly configured by the user)
    const directPlatformUrl = getDirectPlatformOAuthUrl(platform, callbackUrl);
    if (directPlatformUrl) {
      return NextResponse.json({
        success: true,
        redirectUrl: directPlatformUrl,
        mode: 'official_platform_direct_redirect',
      });
    }

    // 2. Multi-Tenant 1-Click OAuth via Composio v3/v3.1 Connect Links (userId = Supabase user.id + callbackUrl)
    if (isComposioConfigured()) {
      const toolkitSlug = COMPOSIO_TOOLKIT_MAP[platform] || platform;
      try {
        const composioCallback = buildComposioCallbackUrl(origin, {
          next: '/settings',
          toolkit: toolkitSlug,
          platform,
        });
        const link = await createComposioConnectLink({
          userId: user.id,
          platformOrToolkit: platform,
          callbackUrl: composioCallback,
        });
        return NextResponse.json({
          success: true,
          redirectUrl: link.redirectUrl,
          connectedAccountId: link.connectedAccountId,
          mode: 'composio_connect_managed',
        });
      } catch (composioErr: unknown) {
        if (composioErr instanceof ComposioApiError) {
          return NextResponse.json(
            {
              success: false,
              error: composioErr.message,
              code: composioErr.code,
            },
            { status: composioErr.status }
          );
        }
        console.warn('Composio v3 Connect Link error:', composioErr);
      }
    }

    // 3. Fallback to Official Integration Portal
    const popupUrl = `${origin}/oauth-popup?platform=${encodeURIComponent(platform)}&workspaceId=${encodeURIComponent(workspaceId || '')}&gateway=official`;

    return NextResponse.json({
      success: true,
      redirectUrl: popupUrl,
      connectionId: `cmp_${platform}_${Date.now()}`,
      mode: 'official_portal',
    });
  } catch (err: unknown) {
    return handleApiError(err);
  }
}
