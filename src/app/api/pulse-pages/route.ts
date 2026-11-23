import { NextRequest, NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/supabase';
import { requireUser, requireWorkspaceRole, ApiError, handleApiError } from '@/lib/security/guards';
import { checkRateLimit, getClientIp } from '@/lib/security/rate-limit';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const pulsePageSaveSchema = z.object({
  id: z.string().uuid().optional(),
  workspace_id: z.string().uuid(),
  title: z.string().min(1, 'Le titre est requis').max(120),
  slug: z.string().min(1, 'Le slug est requis').max(80).regex(/^[a-z0-9_-]+$/i, 'Slug invalide'),
  bio: z.string().max(500).default(''),
  avatar_url: z.string().url().or(z.string().startsWith('/')).default(''),
  theme_config: z.record(z.any()).default({}),
  blocks: z.array(z.record(z.any())).max(50).default([]),
});

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get('slug');
    const queryWsId = searchParams.get('workspaceId');

    const supabase = getAdminSupabase();
    if (!supabase) {
      return NextResponse.json({ success: true, page: null });
    }

    // Public view by slug
    if (slug) {
      const { data, error } = await supabase
        .from('pulse_pages')
        .select('id, workspace_id, title, slug, bio, theme, avatar_url, links, social_links, is_published, created_at, updated_at')
        .eq('slug', slug)
        .maybeSingle();

      if (error) {
        return NextResponse.json({ success: true, page: null });
      }
      return NextResponse.json({ success: true, page: data });
    }

    // Authenticated dashboard view
    const user = await requireUser(req);
    let targetWsId = (queryWsId && UUID_REGEX.test(queryWsId)) ? queryWsId : (user.workspace_id || user.workspaceId);

    if (!targetWsId && user.role === 'super_admin') {
      const { data: firstWs } = await supabase.from('workspaces').select('id').limit(1).maybeSingle();
      if (firstWs?.id) targetWsId = firstWs.id;
    }

    if (!targetWsId) {
      return NextResponse.json({ success: true, page: null });
    }

    await requireWorkspaceRole(user.id, targetWsId, ['super_admin', 'admin', 'manager', 'editor', 'client'], user.role);

    const { data, error } = await supabase
      .from('pulse_pages')
      .select('id, workspace_id, title, slug, bio, theme, avatar_url, links, social_links, is_published, created_at, updated_at')
      .eq('workspace_id', targetWsId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ success: true, page: null });
    }

    return NextResponse.json({ success: true, page: data });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser(req);
    const ip = getClientIp(req);
    const rateLimit = checkRateLimit(`pulse_pages_post:${user.id}:${ip}`, { maxTokens: 20, refillRate: 2 });
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded', retryAfter: rateLimit.retryAfter },
        { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfter) } }
      );
    }

    const body = await req.json();
    const parsed = pulsePageSaveSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, errors: parsed.error.issues, error: parsed.error.issues[0]?.message || 'Données invalides' },
        { status: 422 }
      );
    }

    const { id, workspace_id, ...pageData } = parsed.data;

    // RBAC: super_admin, admin, manager, or editor required to create/update pulse pages
    await requireWorkspaceRole(user.id, workspace_id, ['super_admin', 'admin', 'manager', 'editor']);

    const supabase = getAdminSupabase();
    if (!supabase) {
      throw new ApiError('DATABASE_UNAVAILABLE', 'Base de données non accessible', 503);
    }

    let existingPageId: string | null = null;
    if (id) {
      const { data: byId } = await supabase.from('pulse_pages').select('id, workspace_id').eq('id', id).maybeSingle();
      if (byId?.id && byId.workspace_id === workspace_id) existingPageId = byId.id;
    }

    if (!existingPageId && pageData.slug) {
      const { data: bySlug } = await supabase.from('pulse_pages').select('id, workspace_id').eq('slug', pageData.slug).maybeSingle();
      if (bySlug?.id) {
        if (bySlug.workspace_id !== workspace_id) {
          throw new ApiError('CONFLICT', 'Ce slug est déjà utilisé par un autre espace de travail', 409);
        }
        existingPageId = bySlug.id;
      }
    }

    const payload = {
      ...pageData,
      workspace_id,
      updated_at: new Date().toISOString(),
    };

    let resultData = null;

    if (existingPageId) {
      const { data: updated, error: updateError } = await supabase
        .from('pulse_pages')
        .update(payload)
        .eq('id', existingPageId)
        .select('id, workspace_id, title, slug, bio, theme, avatar_url, links, social_links, is_published, created_at, updated_at')
        .single();

      if (updateError) {
        throw new ApiError('INTERNAL_ERROR', updateError.message, 500);
      }
      resultData = updated;
    } else {
      const { data: inserted, error: insertError } = await supabase
        .from('pulse_pages')
        .insert(payload)
        .select('id, workspace_id, title, slug, bio, theme, avatar_url, links, social_links, is_published, created_at, updated_at')
        .single();

      if (insertError) {
        throw new ApiError('INTERNAL_ERROR', insertError.message, 500);
      }
      resultData = inserted;
    }

    return NextResponse.json({
      success: true,
      message: 'Page Pulse mise à jour et synchronisée avec succès dans Supabase !',
      page: resultData,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
