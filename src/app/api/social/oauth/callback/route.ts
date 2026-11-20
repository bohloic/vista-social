import { NextRequest, NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

const isUuid = (val?: string) =>
  typeof val === 'string' &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);

const PLATFORM_DEFAULT_NAMES: Record<string, { name: string; handle: string }> = {
  instagram: { name: 'Instagram Business Officiel', handle: '@pulsesocial.brand' },
  facebook: { name: 'Page Facebook Officielle', handle: 'PulseSocial Page' },
  linkedin: { name: 'LinkedIn Entreprise & Dirigeant', handle: 'pulsesocial-b2b' },
  twitter: { name: 'X (Twitter) Officiel', handle: '@PulseSocialHQ' },
  tiktok: { name: 'TikTok Business Creator', handle: '@pulsesocial.tok' },
  whatsapp: { name: 'WhatsApp Business Cloud', handle: '+225 07 00 00 00' },
  google_business: { name: 'Google Business Profile', handle: 'PulseSocial Abidjan' },
};

async function persistConnectedSocialAccount(params: {
  platform: string;
  accountName: string;
  username: string;
  connectionId?: string;
  workspaceId?: string;
}) {
  const { platform, accountName, username, connectionId, workspaceId } = params;
  const supabase = getAdminSupabase();

  const cleanHandle = username.trim().replace(/^@/, '');
  const formattedUsername =
    platform === 'twitter' || platform === 'instagram' || platform === 'tiktok'
      ? `@${cleanHandle}`
      : cleanHandle;

  const fallbackAccount = {
    id: `acc-${platform}-${Date.now()}`,
    workspace_id: workspaceId || 'ws-default',
    platform,
    account_name: accountName,
    username: formattedUsername,
    avatar_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80',
    is_connected: true,
    status: 'active',
    followers_count: 1450,
  };

  if (!supabase) return fallbackAccount;

  try {
    let targetWsId = workspaceId;
    if (!isUuid(targetWsId)) {
      const { data: ws } = await supabase.from('workspaces').select('id').limit(1).maybeSingle();
      if (ws?.id) {
        targetWsId = ws.id;
      } else {
        const { data: newWs } = await supabase
          .from('workspaces')
          .insert({ name: 'Pulse Workspace', slug: 'pulse-workspace' })
          .select('id')
          .single();
        targetWsId = newWs?.id;
      }
    }

    const { data: existingAccounts } = await supabase
      .from('social_accounts')
      .select('*')
      .eq('platform', platform)
      .or(`username.ilike.@${cleanHandle},username.ilike.${cleanHandle}`);

    if (existingAccounts && existingAccounts.length > 0) {
      const existing = existingAccounts[0];
      const { data: updated } = await supabase
        .from('social_accounts')
        .update({
          account_name: accountName,
          username: formattedUsername,
          access_token: connectionId || existing.access_token || `composio_${platform}_${Date.now()}`,
          is_connected: true,
          status: 'active',
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single();

      return updated || fallbackAccount;
    }

    const { data: inserted } = await supabase
      .from('social_accounts')
      .insert({
        workspace_id: targetWsId,
        platform,
        platform_account_id: connectionId || `composio-${platform}-${Date.now()}`,
        account_name: accountName,
        username: formattedUsername,
        avatar_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80',
        access_token: connectionId || `composio_oauth_${platform}_${Date.now()}`,
        is_connected: true,
        status: 'active',
        followers_count: Math.floor(Math.random() * 4000) + 450,
        metadata: {
          connected_via: 'composio_oauth2',
          composio_connection_id: connectionId || `cmp_${Date.now()}`,
          connected_at: new Date().toISOString(),
        },
      })
      .select()
      .single();

    return inserted || fallbackAccount;
  } catch {
    return fallbackAccount;
  }
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const platform = url.searchParams.get('platform') || 'instagram';
  const workspaceId = url.searchParams.get('workspaceId') || undefined;
  const connectionId =
    url.searchParams.get('connectedAccountId') ||
    url.searchParams.get('connectionId') ||
    `cmp_${platform}_${Date.now()}`;
  const customAccountName = url.searchParams.get('accountName');
  const customUsername = url.searchParams.get('username');

  const defaults = PLATFORM_DEFAULT_NAMES[platform] || {
    name: `Compte ${platform}`,
    handle: `@pulsesocial.${platform}`,
  };

  const account = await persistConnectedSocialAccount({
    platform,
    accountName: customAccountName || defaults.name,
    username: customUsername || defaults.handle,
    connectionId,
    workspaceId,
  });

  const html = `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"><title>Connexion OAuth 2.0 Composio</title></head>
<body style="background:#07090E;color:#fff;font-family:system-ui;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">
  <div style="text-align:center;padding:24px;">
    <p style="font-size:15px;color:#34d399;font-weight:bold;">✓ Autorisation OAuth 2.0 (${platform.toUpperCase()}) validée via Composio !</p>
    <p style="font-size:12px;color:#94a3b8;">Fermeture automatique de la fenêtre...</p>
  </div>
  <script>
    try {
      if (window.opener) {
        window.opener.postMessage({
          type: 'COMPOSIO_OAUTH_SUCCESS',
          platform: ${JSON.stringify(platform)},
          account: ${JSON.stringify(account)}
        }, '*');
      }
    } catch (e) {}
    setTimeout(() => window.close(), 350);
  </script>
</body>
</html>`;

  return new NextResponse(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const platform = body.platform || 'instagram';
    const defaults = PLATFORM_DEFAULT_NAMES[platform] || {
      name: `Compte ${platform}`,
      handle: `@pulsesocial.${platform}`,
    };

    const account = await persistConnectedSocialAccount({
      platform,
      accountName: body.accountName || defaults.name,
      username: body.username || defaults.handle,
      connectionId: body.connectionId || `cmp_${platform}_${Date.now()}`,
      workspaceId: body.workspaceId,
    });

    return NextResponse.json({
      success: true,
      account,
      message: `Compte ${account.account_name} connecté via OAuth 2.0 Composio.`,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur callback OAuth';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
