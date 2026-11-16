import { NextRequest, NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/supabase';
import { z } from 'zod';

const pulsePageSaveSchema = z.object({
  id: z.string().optional(),
  workspace_id: z.string().optional(),
  title: z.string().min(1, 'Le titre est requis'),
  slug: z.string().min(1, 'Le slug est requis'),
  bio: z.string().default(''),
  avatar_url: z.string().default(''),
  theme_config: z.record(z.any()).default({}),
  blocks: z.array(z.record(z.any())).default([]),
});

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET() {
  try {
    const supabase = getAdminSupabase();
    if (!supabase) {
      return NextResponse.json({ success: true, page: null });
    }

    const { data, error } = await supabase
      .from('pulse_pages')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.warn('GET /api/pulse-pages query error:', error.message);
      return NextResponse.json({ success: true, page: null });
    }

    return NextResponse.json({ success: true, page: data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = pulsePageSaveSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, errors: parsed.error.issues, error: parsed.error.issues[0]?.message || 'Données invalides' },
        { status: 400 }
      );
    }

    const supabase = getAdminSupabase();
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Base de données non accessible' },
        { status: 503 }
      );
    }

    const { id, workspace_id, ...pageData } = parsed.data;

    // 1. Resolve a valid workspace UUID
    let validWorkspaceId = workspace_id && UUID_REGEX.test(workspace_id) ? workspace_id : null;
    if (!validWorkspaceId) {
      const { data: ws } = await supabase.from('workspaces').select('id').limit(1).maybeSingle();
      if (ws?.id) {
        validWorkspaceId = ws.id;
      }
    }

    // 2. Check if a page exists by ID (if valid UUID) or by slug or by workspace_id
    let existingPageId: string | null = null;
    if (id && UUID_REGEX.test(id)) {
      const { data: byId } = await supabase.from('pulse_pages').select('id').eq('id', id).maybeSingle();
      if (byId?.id) existingPageId = byId.id;
    }

    if (!existingPageId && pageData.slug) {
      const { data: bySlug } = await supabase.from('pulse_pages').select('id').eq('slug', pageData.slug).maybeSingle();
      if (bySlug?.id) existingPageId = bySlug.id;
    }

    if (!existingPageId && validWorkspaceId) {
      const { data: byWs } = await supabase.from('pulse_pages').select('id').eq('workspace_id', validWorkspaceId).limit(1).maybeSingle();
      if (byWs?.id) existingPageId = byWs.id;
    }

    const payload = {
      ...pageData,
      workspace_id: validWorkspaceId,
      updated_at: new Date().toISOString(),
    };

    let resultData = null;

    if (existingPageId) {
      const { data: updated, error: updateError } = await supabase
        .from('pulse_pages')
        .update(payload)
        .eq('id', existingPageId)
        .select()
        .single();

      if (updateError) {
        console.error('Update pulse_pages error:', updateError);
        return NextResponse.json({ success: false, error: updateError.message }, { status: 500 });
      }
      resultData = updated;
    } else {
      const { data: inserted, error: insertError } = await supabase
        .from('pulse_pages')
        .insert(payload)
        .select()
        .single();

      if (insertError) {
        console.error('Insert pulse_pages error:', insertError);
        return NextResponse.json({ success: false, error: insertError.message }, { status: 500 });
      }
      resultData = inserted;
    }

    return NextResponse.json({
      success: true,
      message: 'Page Pulse mise à jour et synchronisée avec succès dans Supabase !',
      page: resultData,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur interne lors de la sauvegarde';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
