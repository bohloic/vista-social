import { NextRequest, NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/supabase';
import { encryptToken } from '@/lib/security/encryption';
import { requireUser, requireWorkspaceRole } from '@/lib/security/guards';
import {
  appendQueryParams,
  composioToolkitToPlatform,
  listComposioConnectedAccounts,
  resolveAppOrigin,
  sanitizeNextPath,
  syncComposioAccountsToSupabase,
  verifyComposioAccountOwnership,
} from '@/lib/composio';

export const dynamic = 'force-dynamic';

const isUuid = (val?: string) =>
  typeof val === 'string' &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);

export async function GET(req: NextRequest) {
  const origin = resolveAppOrigin(req);
  const { searchParams } = new URL(req.url);

  const rawNext = searchParams.get('next');
  const safeNext = sanitizeNextPath(rawNext, '/settings');
  const toolkitParam = (searchParams.get('toolkit') || '').toLowerCase().trim();
  const platformParam =
    (searchParams.get('platform') || (toolkitParam ? composioToolkitToPlatform(toolkitParam) : '')).toLowerCase().trim();
  const connectedAccountId =
    searchParams.get('connected_account_id') ||
    searchParams.get('connectedAccountId') ||
    searchParams.get('connectionId') ||
    '';
  const statusParam = (searchParams.get('status') || '').toLowerCase().trim();
  const errorParam = searchParams.get('error') || searchParams.get('error_description') || '';

  // 1. Verify authenticated Supabase session (user.id); if absent, redirect to /login
  let user;
  try {
    user = await requireUser(req);
  } catch {
    const loginTarget = `${origin}/login?redirect=${encodeURIComponent(
      safeNext === '/settings' ? '/settings?tab=accounts' : safeNext
    )}`;
    return NextResponse.redirect(loginTarget, { status: 302 });
  }

  // 2. Handle explicit provider cancellation / error cleanly via dashboard redirect
  if (errorParam || statusParam === 'failed' || statusParam === 'error') {
    const errRedirect = appendQueryParams(origin, safeNext, {
      ...(safeNext === '/settings' ? { tab: 'accounts' } : {}),
      composio_error: errorParam || 'oauth_failed',
      toolkit: platformParam || toolkitParam || 'composio',
    });
    return NextResponse.redirect(errRedirect, { status: 302 });
  }

  // 3. Verify connectedAccountId ownership against authenticated user.id (Anti-BOLA)
  let verifiedPlatform = platformParam || toolkitParam;
  try {
    if (connectedAccountId) {
      const ownership = await verifyComposioAccountOwnership(user.id, connectedAccountId);
      if (ownership.mismatch) {
        const mismatchRedirect = appendQueryParams(origin, safeNext, {
          ...(safeNext === '/settings' ? { tab: 'accounts' } : {}),
          composio_error: 'ownership_mismatch',
        });
        return NextResponse.redirect(mismatchRedirect, { status: 302 });
      }
      if (ownership.account?.platform) {
        verifiedPlatform = ownership.account.platform;
      }
    }

    // 4. Resolve workspace_id from session / profile and synchronize all ACTIVE Composio accounts
    const supabase = getAdminSupabase();
    let workspaceId = user.workspaceId || user.workspace_id;
    if (!workspaceId && supabase) {
      const { data: prof } = await supabase
        .from('user_profiles')
        .select('workspace_id')
        .eq('id', user.id)
        .maybeSingle();
      if (prof?.workspace_id) {
        workspaceId = prof.workspace_id;
      } else {
        const { data: firstWs } = await supabase.from('workspaces').select('id').limit(1).maybeSingle();
        if (firstWs?.id) workspaceId = firstWs.id;
      }
    }

    if (workspaceId && isUuid(workspaceId)) {
      await requireWorkspaceRole(
        user.id,
        workspaceId,
        ['super_admin', 'admin', 'manager', 'editor'],
        user.role
      );
    }

    const activeAccounts = await listComposioConnectedAccounts(user.id, ['ACTIVE']);
    if (supabase && workspaceId) {
      await syncComposioAccountsToSupabase({
        supabase,
        userId: user.id,
        workspaceId,
        encryptTokenFn: encryptToken,
        accounts: activeAccounts,
      });
    }
  } catch {
    // Non-blocking sync error: still redirect cleanly to dashboard with status info
  }

  const successRedirect = appendQueryParams(origin, safeNext, {
    ...(safeNext === '/settings' ? { tab: 'accounts' } : {}),
    connected: verifiedPlatform || 'composio',
  });

  return NextResponse.redirect(successRedirect, { status: 302 });
}
