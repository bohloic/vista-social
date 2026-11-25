import { NextRequest, NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/supabase';
import { encryptToken } from '@/lib/security/encryption';
import { requireUser, requireWorkspaceRole, ApiError, handleApiError } from '@/lib/security/guards';
import { checkRateLimit, getClientIp } from '@/lib/security/rate-limit';
import {
  listComposioConnectedAccounts,
  revokeComposioConnectedAccount,
  syncComposioAccountsToSupabase,
} from '@/lib/composio';

export const dynamic = 'force-dynamic';

const isUuid = (val?: string) =>
  typeof val === 'string' &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser(req);
    const ip = getClientIp(req);
    const rl = checkRateLimit(`composio_accounts_get:${user.id}:${ip}`, {
      maxTokens: 40,
      refillRate: 4,
    });
    if (!rl.allowed) {
      return NextResponse.json(
        { success: false, error: 'Trop de requêtes', retryAfter: rl.retryAfter },
        { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } }
      );
    }

    const workspaceId = user.workspaceId || user.workspace_id;
    const supabase = getAdminSupabase();

    if (workspaceId && isUuid(workspaceId)) {
      await requireWorkspaceRole(
        user.id,
        workspaceId,
        ['super_admin', 'admin', 'manager', 'editor', 'client'],
        user.role
      );
    }

    const activeAccounts = await listComposioConnectedAccounts(user.id, ['ACTIVE']);
    const syncResult = await syncComposioAccountsToSupabase({
      supabase,
      userId: user.id,
      workspaceId,
      encryptTokenFn: encryptToken,
      accounts: activeAccounts,
    });

    return NextResponse.json({
      success: true,
      accounts: syncResult.accounts,
      activeToolkits: syncResult.activeToolkits,
    });
  } catch (err: unknown) {
    return handleApiError(err);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await requireUser(req);
    const { searchParams } = new URL(req.url);
    const connectedAccountId = searchParams.get('connectedAccountId') || '';
    const dbId = searchParams.get('id') || '';

    if (!connectedAccountId && (!dbId || !isUuid(dbId))) {
      throw new ApiError('BAD_REQUEST', 'connectedAccountId ou id UUID requis', 400);
    }

    const supabase = getAdminSupabase();
    let workspaceId = user.workspaceId || user.workspace_id;
    let targetComposioId = connectedAccountId;

    if (supabase && dbId && isUuid(dbId)) {
      const { data: row } = await supabase
        .from('social_accounts')
        .select('id, workspace_id, platform_account_id, metadata')
        .eq('id', dbId)
        .maybeSingle();

      if (!row) {
        throw new ApiError('NOT_FOUND', 'Compte introuvable', 404);
      }

      workspaceId = row.workspace_id;
      const meta = (row.metadata || {}) as Record<string, unknown>;
      if (!targetComposioId) {
        targetComposioId =
          typeof meta.composio_connection_id === 'string'
            ? meta.composio_connection_id
            : String(row.platform_account_id || '');
      }
    }

    if (workspaceId && isUuid(workspaceId)) {
      await requireWorkspaceRole(user.id, workspaceId, ['super_admin', 'admin', 'manager'], user.role);
    }

    let revoked = false;
    if (targetComposioId) {
      revoked = await revokeComposioConnectedAccount(user.id, targetComposioId);
    }

    if (supabase && workspaceId) {
      if (dbId && isUuid(dbId)) {
        await supabase.from('social_accounts').delete().eq('id', dbId).eq('workspace_id', workspaceId);
      } else if (targetComposioId) {
        await supabase
          .from('social_accounts')
          .delete()
          .eq('workspace_id', workspaceId)
          .eq('platform_account_id', targetComposioId);
      }
    }

    return NextResponse.json({
      success: true,
      revokedOnComposio: revoked,
      message: 'Compte révoqué et déconnecté avec succès.',
    });
  } catch (err: unknown) {
    return handleApiError(err);
  }
}
