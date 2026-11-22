import { NextRequest, NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/supabase';
import { requireUser, requireWorkspaceRole, ApiError, handleApiError } from '@/lib/security/guards';
import { checkRateLimit, getClientIp } from '@/lib/security/rate-limit';
import { z } from 'zod';

const inviteSchema = z.object({
  fullName: z.string().min(2, 'Nom requis').max(100),
  email: z.string().email('Email valide requis').max(255),
  role: z.enum(['super_admin', 'admin', 'manager', 'editor', 'client']).default('editor'),
  workspaceId: z.string().uuid('Workspace ID UUID valide requis'),
});

const updateRoleSchema = z.object({
  userId: z.string().uuid('User ID UUID valide requis'),
  role: z.enum(['super_admin', 'admin', 'manager', 'editor', 'client']),
  workspaceId: z.string().uuid('Workspace ID UUID valide requis'),
});

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

    const { searchParams } = new URL(req.url);
    const queryWsId = searchParams.get('workspaceId');
    let targetWsId = queryWsId || user.workspace_id || user.workspaceId;

    if (!targetWsId && user.role === 'super_admin') {
      const supabaseAdmin = getAdminSupabase();
      if (supabaseAdmin) {
        const { data: firstWs } = await supabaseAdmin.from('workspaces').select('id').limit(1).maybeSingle();
        if (firstWs?.id) targetWsId = firstWs.id;
      }
    }

    if (!targetWsId) {
      return NextResponse.json({ members: [] });
    }

    await requireWorkspaceRole(user.id, targetWsId, ['super_admin', 'admin', 'manager', 'editor', 'client'], user.role);

    const supabase = getAdminSupabase();
    if (!supabase) return NextResponse.json({ members: [] });

    // Multi-tenant scoped query
    const { data: members, error } = await supabase
      .from('workspace_members')
      .select('id, role, created_at, user:user_profiles(id, full_name, email, role, avatar_url, is_lifetime_free)')
      .eq('workspace_id', targetWsId)
      .order('created_at', { ascending: true });

    if (error) {
      throw new ApiError('INTERNAL_ERROR', error.message, 500);
    }

    const flatMembers = (members || []).map((m: any) => ({
      id: m.user?.id || m.id,
      full_name: m.user?.full_name || 'Collaborateur',
      email: m.user?.email || '',
      role: m.role,
      avatar_url: m.user?.avatar_url,
      is_lifetime_free: m.user?.is_lifetime_free,
      workspace_id: targetWsId,
      created_at: m.created_at,
    }));

    return NextResponse.json({ members: flatMembers });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser(req);
    const ip = getClientIp(req);
    const rateLimit = checkRateLimit(`team_invite:${user.id}:${ip}`, { maxTokens: 10, refillRate: 1 });
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
        { success: false, error: parsed.error.issues[0]?.message || 'Données invalides' },
        { status: 422 }
      );
    }

    const { fullName, email, role, workspaceId } = parsed.data;

    // RBAC: Only super_admin or admin can invite new members
    await requireWorkspaceRole(user.id, workspaceId, ['super_admin', 'admin'], user.role);

    // Non-super_admin cannot grant super_admin role
    if (role === 'super_admin' && user.role !== 'super_admin') {
      throw new ApiError('FORBIDDEN', 'Seul un Super Admin peut attribuer le rôle Super Admin', 403);
    }

    const supabase = getAdminSupabase();
    if (!supabase) {
      throw new ApiError('DATABASE_UNAVAILABLE', 'Database unreachable', 503);
    }

    // Check if user already exists
    const cleanEmail = email.toLowerCase().trim();
    const { data: existingUser } = await supabase
      .from('user_profiles')
      .select('id, full_name, email, role')
      .eq('email', cleanEmail)
      .maybeSingle();

    let targetUserId = existingUser?.id;

    if (!targetUserId) {
      const { data: newUser, error: insertError } = await supabase
        .from('user_profiles')
        .insert({
          full_name: fullName,
          email: cleanEmail,
          role,
          workspace_id: workspaceId,
          is_lifetime_free: false,
        })
        .select()
        .single();

      if (insertError) {
        throw new ApiError('BAD_REQUEST', insertError.message, 400);
      }
      targetUserId = newUser.id;
    }

    // Insert into workspace_members
    await supabase.from('workspace_members').upsert(
      {
        workspace_id: workspaceId,
        user_id: targetUserId,
        role,
      },
      { onConflict: 'workspace_id,user_id' }
    );

    return NextResponse.json({
      success: true,
      message: `Membre ${fullName} invité avec succès avec le rôle ${role}.`,
      member: { id: targetUserId, email: cleanEmail, full_name: fullName, role, workspace_id: workspaceId },
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

    const { userId, role, workspaceId } = parsed.data;

    // RBAC: Only super_admin or admin can modify roles
    await requireWorkspaceRole(user.id, workspaceId, ['super_admin', 'admin']);

    if (role === 'super_admin' && user.role !== 'super_admin') {
      throw new ApiError('FORBIDDEN', 'Seul un Super Admin peut nommer un autre Super Admin', 403);
    }

    const supabase = getAdminSupabase();
    if (!supabase) throw new ApiError('DATABASE_UNAVAILABLE', 'Database unreachable', 503);

    const { data: updated, error } = await supabase
      .from('workspace_members')
      .update({ role })
      .eq('workspace_id', workspaceId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      throw new ApiError('INTERNAL_ERROR', error.message, 500);
    }

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

    const { searchParams } = new URL(req.url);
    const targetUserId = searchParams.get('userId');
    const targetWsId = searchParams.get('workspaceId') || user.workspace_id;

    if (!targetUserId || !targetWsId) {
      throw new ApiError('BAD_REQUEST', 'userId et workspaceId requis', 400);
    }

    // RBAC check
    await requireWorkspaceRole(user.id, targetWsId, ['super_admin', 'admin']);

    // Prevent self-lockout
    if (targetUserId === user.id) {
      throw new ApiError('BAD_REQUEST', 'Vous ne pouvez pas vous retirer vous-même de votre propre espace', 400);
    }

    const supabase = getAdminSupabase();
    if (!supabase) throw new ApiError('DATABASE_UNAVAILABLE', 'Database unreachable', 503);

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
