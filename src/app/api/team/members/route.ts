import crypto from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/supabase';
import { requireUser, requireWorkspaceRole, ApiError, handleApiError } from '@/lib/security/guards';
import { checkRateLimit, getClientIp } from '@/lib/security/rate-limit';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isUuid = (val?: string | null): val is string => Boolean(val && UUID_REGEX.test(val));

const inviteSchema = z.object({
  fullName: z.string().min(2, 'Nom requis (min. 2 caractères)').max(100),
  email: z.string().email('Email valide requis').max(255),
  role: z.enum(['super_admin', 'admin', 'manager', 'editor', 'client']).default('editor'),
  workspaceId: z.string().optional(),
  workspace_id: z.string().optional(),
});

const updateRoleSchema = z.object({
  userId: z.string().uuid('User ID UUID valide requis'),
  role: z.enum(['super_admin', 'admin', 'manager', 'editor', 'client']),
  workspaceId: z.string().optional(),
  workspace_id: z.string().optional(),
});

async function resolveTargetWorkspaceId(
  explicitWsId: string | undefined | null,
  user: { id: string; role?: string; workspace_id?: string; workspaceId?: string },
  supabase: ReturnType<typeof getAdminSupabase>
): Promise<string | null> {
  if (isUuid(explicitWsId)) return explicitWsId;
  if (isUuid(user.workspace_id)) return user.workspace_id;
  if (isUuid(user.workspaceId)) return user.workspaceId;

  if (supabase) {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('workspace_id')
      .eq('id', user.id)
      .maybeSingle();
    if (isUuid(profile?.workspace_id)) {
      return profile.workspace_id;
    }

    const { data: memberRow } = await supabase
      .from('workspace_members')
      .select('workspace_id')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle();
    if (isUuid(memberRow?.workspace_id)) {
      return memberRow.workspace_id;
    }

    const { data: firstWs } = await supabase.from('workspaces').select('id').limit(1).maybeSingle();
    if (isUuid(firstWs?.id)) {
      return firstWs.id;
    }
  }

  return null;
}

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser(req);
    const ip = getClientIp(req);
    const rateLimit = checkRateLimit(`team_get:${user.id}:${ip}`, { maxTokens: 60, refillRate: 5 });
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded', retryAfter: rateLimit.retryAfter },
        { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfter) } }
      );
    }

    const supabase = getAdminSupabase();
    const { searchParams } = new URL(req.url);
    const queryWsId = searchParams.get('workspaceId') || searchParams.get('workspace_id');
    const targetWsId = await resolveTargetWorkspaceId(queryWsId, user, supabase);

    if (!targetWsId || !supabase) {
      return NextResponse.json({ members: [] });
    }

    await requireWorkspaceRole(user.id, targetWsId, ['super_admin', 'admin', 'manager', 'editor', 'client'], user.role);

    // 1. Query workspace_members
    const { data: members, error } = await supabase
      .from('workspace_members')
      .select('id, role, created_at, user:user_profiles(id, full_name, email, role, avatar_url, is_lifetime_free)')
      .eq('workspace_id', targetWsId)
      .order('created_at', { ascending: true });

    if (error) {
      throw new ApiError('INTERNAL_ERROR', error.message, 500);
    }

    const byUserId = new Map<string, any>();

    for (const m of members || []) {
      const u: any = Array.isArray(m.user) ? m.user[0] : m.user;
      const uid = u?.id || m.id;
      byUserId.set(uid, {
        id: uid,
        full_name: u?.full_name || 'Collaborateur',
        email: u?.email || '',
        role: m.role || u?.role || 'editor',
        avatar_url: u?.avatar_url,
        is_lifetime_free: u?.is_lifetime_free,
        workspace_id: targetWsId,
        created_at: m.created_at,
      });
    }

    // 2. Also include user_profiles directly attached to this workspace
    const { data: directProfiles } = await supabase
      .from('user_profiles')
      .select('id, full_name, email, role, avatar_url, is_lifetime_free, created_at')
      .eq('workspace_id', targetWsId)
      .order('created_at', { ascending: true });

    for (const p of directProfiles || []) {
      if (!byUserId.has(p.id)) {
        byUserId.set(p.id, {
          id: p.id,
          full_name: p.full_name || 'Collaborateur',
          email: p.email || '',
          role: p.role || 'admin',
          avatar_url: p.avatar_url,
          is_lifetime_free: p.is_lifetime_free,
          workspace_id: targetWsId,
          created_at: p.created_at,
        });
      }
    }

    return NextResponse.json({ members: Array.from(byUserId.values()) });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser(req);
    const ip = getClientIp(req);
    const rateLimit = checkRateLimit(`team_invite:${user.id}:${ip}`, { maxTokens: 20, refillRate: 2 });
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded', retryAfter: rateLimit.retryAfter },
        { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfter) } }
      );
    }

    const body = await req.json();
    const parsed = inviteSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || 'Données invalides', issues: parsed.error.issues },
        { status: 422 }
      );
    }

    const supabase = getAdminSupabase();
    if (!supabase) {
      throw new ApiError('DATABASE_UNAVAILABLE', 'Database unreachable', 503);
    }

    const { fullName, email, role, workspaceId, workspace_id } = parsed.data;
    const targetWsId = await resolveTargetWorkspaceId(workspaceId || workspace_id, user, supabase);

    if (!targetWsId) {
      throw new ApiError(422, 'MISSING_WORKSPACE', 'Aucun espace de travail actif trouvé pour votre compte.');
    }

    // RBAC: Only super_admin or admin can invite new members
    await requireWorkspaceRole(user.id, targetWsId, ['super_admin', 'admin'], user.role);

    // Non-super_admin cannot grant super_admin role
    if (role === 'super_admin' && user.role !== 'super_admin') {
      throw new ApiError('FORBIDDEN', 'Seul un Super Admin peut attribuer le rôle Super Admin', 403);
    }

    // Check if user already exists in user_profiles
    const cleanEmail = email.toLowerCase().trim();
    const { data: existingUser } = await supabase
      .from('user_profiles')
      .select('id, full_name, email, role')
      .eq('email', cleanEmail)
      .maybeSingle();

    let targetUserId = existingUser?.id;

    if (!targetUserId) {
      // 1. Create or locate in Supabase Auth so user_profiles foreign key to auth.users(id) succeeds
      try {
        const tempPassword = `Pulse!${crypto.randomBytes(12).toString('hex')}9A`;
        const { data: createdAuth, error: authErr } = await supabase.auth.admin.createUser({
          email: cleanEmail,
          password: tempPassword,
          email_confirm: true,
          user_metadata: {
            full_name: fullName,
            role,
            workspace_id: targetWsId,
          },
        });

        if (!authErr && createdAuth?.user?.id) {
          targetUserId = createdAuth.user.id;
        } else {
          const { data: listData } = await supabase.auth.admin.listUsers({ page: 1, perPage: 200 });
          const foundAuth = listData?.users?.find((u) => u.email?.toLowerCase() === cleanEmail);
          if (foundAuth?.id) {
            targetUserId = foundAuth.id;
          }
        }
      } catch {
        // Fallback if auth.admin is unavailable
      }

      if (!targetUserId) {
        targetUserId = crypto.randomUUID();
      }

      const { data: newUser, error: insertError } = await supabase
        .from('user_profiles')
        .upsert(
          {
            id: targetUserId,
            full_name: fullName,
            email: cleanEmail,
            role,
            workspace_id: targetWsId,
            is_lifetime_free: false,
          },
          { onConflict: 'id' }
        )
        .select('id, full_name, email, role, workspace_id')
        .single();

      if (insertError) {
        throw new ApiError('BAD_REQUEST', insertError.message, 400);
      }
      targetUserId = newUser.id;
    } else {
      // Update existing profile's role & workspace if needed
      await supabase
        .from('user_profiles')
        .update({ role, full_name: fullName })
        .eq('id', targetUserId);
    }

    // Upsert into workspace_members
    await supabase.from('workspace_members').upsert(
      {
        workspace_id: targetWsId,
        user_id: targetUserId,
        role,
      },
      { onConflict: 'workspace_id,user_id' }
    );

    return NextResponse.json({
      success: true,
      message: `Membre ${fullName} invité avec succès avec le rôle ${role}.`,
      member: { id: targetUserId, email: cleanEmail, full_name: fullName, role, workspace_id: targetWsId },
    });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await requireUser(req);
    const ip = getClientIp(req);
    const rateLimit = checkRateLimit(`team_patch:${user.id}:${ip}`, { maxTokens: 20, refillRate: 2 });
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded', retryAfter: rateLimit.retryAfter },
        { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfter) } }
      );
    }

    const body = await req.json();
    const parsed = updateRoleSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || 'Données invalides' },
        { status: 422 }
      );
    }

    const supabase = getAdminSupabase();
    if (!supabase) throw new ApiError('DATABASE_UNAVAILABLE', 'Database unreachable', 503);

    const { userId, role, workspaceId, workspace_id } = parsed.data;
    const targetWsId = await resolveTargetWorkspaceId(workspaceId || workspace_id, user, supabase);

    if (!targetWsId) {
      throw new ApiError(422, 'MISSING_WORKSPACE', 'Aucun espace de travail actif trouvé');
    }

    // RBAC: Only super_admin or admin can modify roles
    await requireWorkspaceRole(user.id, targetWsId, ['super_admin', 'admin'], user.role);

    if (role === 'super_admin' && user.role !== 'super_admin') {
      throw new ApiError('FORBIDDEN', 'Seul un Super Admin peut nommer un autre Super Admin', 403);
    }

    const { data: updated, error } = await supabase
      .from('workspace_members')
      .upsert(
        {
          workspace_id: targetWsId,
          user_id: userId,
          role,
        },
        { onConflict: 'workspace_id,user_id' }
      )
      .select('id, workspace_id, user_id, role, created_at')
      .single();

    if (error) {
      throw new ApiError('INTERNAL_ERROR', error.message, 500);
    }

    await supabase
      .from('user_profiles')
      .update({ role })
      .eq('id', userId)
      .eq('workspace_id', targetWsId);

    return NextResponse.json({
      success: true,
      message: 'Rôle mis à jour avec succès.',
      member: updated,
    });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await requireUser(req);
    const ip = getClientIp(req);
    const rateLimit = checkRateLimit(`team_delete:${user.id}:${ip}`, { maxTokens: 10, refillRate: 1 });
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded', retryAfter: rateLimit.retryAfter },
        { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfter) } }
      );
    }

    const supabase = getAdminSupabase();
    if (!supabase) throw new ApiError('DATABASE_UNAVAILABLE', 'Database unreachable', 503);

    const { searchParams } = new URL(req.url);
    const targetUserId = searchParams.get('userId');
    const explicitWsId = searchParams.get('workspaceId') || searchParams.get('workspace_id');
    const targetWsId = await resolveTargetWorkspaceId(explicitWsId, user, supabase);

    if (!targetUserId || !targetWsId) {
      throw new ApiError('BAD_REQUEST', 'userId et workspaceId requis', 400);
    }

    // RBAC check
    await requireWorkspaceRole(user.id, targetWsId, ['super_admin', 'admin'], user.role);

    // Prevent self-lockout
    if (targetUserId === user.id) {
      throw new ApiError('BAD_REQUEST', 'Vous ne pouvez pas vous retirer vous-même de votre propre espace', 400);
    }

    const { error } = await supabase
      .from('workspace_members')
      .delete()
      .eq('workspace_id', targetWsId)
      .eq('user_id', targetUserId);

    if (error) {
      throw new ApiError('INTERNAL_ERROR', error.message, 500);
    }

    return NextResponse.json({ success: true, message: 'Membre retiré avec succès.' });
  } catch (err) {
    return handleApiError(err);
  }
}
