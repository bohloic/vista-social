import { NextRequest, NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/supabase';
import { z } from 'zod';

const inviteSchema = z.object({
  fullName: z.string().min(2, 'Nom requis'),
  email: z.string().email('Email valide requis'),
  role: z.enum(['super_admin', 'admin', 'manager', 'editor', 'client']).default('editor'),
  workspaceId: z.string().optional(),
});

const updateRoleSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(['super_admin', 'admin', 'manager', 'editor', 'client']),
});

export async function GET() {
  try {
    const supabase = getAdminSupabase();
    if (!supabase) return NextResponse.json({ members: [] });

    const { data: users, error } = await supabase
      .from('user_profiles')
      .select('id, full_name, email, role, avatar_url, is_lifetime_free, created_at, workspace_id')
      .order('created_at', { ascending: true });

    if (error) {
      return NextResponse.json({ members: [] });
    }

    return NextResponse.json({ members: users || [] });
  } catch (err) {
    return NextResponse.json({ members: [] });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = inviteSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || 'Données invalides' },
        { status: 400 }
      );
    }

    const { fullName, email, role, workspaceId } = parsed.data;
    const supabase = getAdminSupabase();

    if (!supabase) {
      return NextResponse.json({ success: false, error: 'Database unreachable' }, { status: 503 });
    }

    // Resolve workspace
    let wsId = workspaceId;
    if (!wsId) {
      const { data: ws } = await supabase.from('workspaces').select('id').limit(1).maybeSingle();
      if (ws) wsId = ws.id;
    }

    // Insert user profile
    const { data: newUser, error: insertError } = await supabase
      .from('user_profiles')
      .insert({
        full_name: fullName,
        email: email.toLowerCase().trim(),
        role,
        workspace_id: wsId,
        is_lifetime_free: false,
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({ success: false, error: insertError.message }, { status: 400 });
    }

    // Insert into workspace_members
    if (wsId) {
      await supabase.from('workspace_members').insert({
        workspace_id: wsId,
        user_id: newUser.id,
        role,
      });
    }

    return NextResponse.json({
      success: true,
      message: `Membre ${fullName} invité avec succès avec le rôle ${role}.`,
      member: newUser,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur invitation';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = updateRoleSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || 'Données invalides' },
        { status: 400 }
      );
    }

    const { userId, role } = parsed.data;
    const supabase = getAdminSupabase();

    if (!supabase) return NextResponse.json({ success: false, error: 'Database unreachable' }, { status: 503 });

    const { data: updated, error } = await supabase
      .from('user_profiles')
      .update({ role, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    // Also update workspace_members
    await supabase.from('workspace_members').update({ role }).eq('user_id', userId);

    return NextResponse.json({
      success: true,
      message: 'Rôle mis à jour avec succès.',
      member: updated,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur mise à jour';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID requis' }, { status: 400 });
    }

    const supabase = getAdminSupabase();
    if (!supabase) return NextResponse.json({ success: false, error: 'Database unreachable' }, { status: 503 });

    const { error } = await supabase.from('user_profiles').delete().eq('id', userId);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Membre retiré avec succès.' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur suppression';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
