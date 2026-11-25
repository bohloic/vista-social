import { NextRequest, NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/supabase';
import { requireUser, requireWorkspaceRole, ApiError, handleApiError } from '@/lib/security/guards';
import { checkRateLimit, getClientIp } from '@/lib/security/rate-limit';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const DEFAULT_THEME_CONFIG = {
  bg_gradient: 'from-violet-950 via-slate-950 to-indigo-950',
  button_bg: 'rgba(255, 255, 255, 0.08)',
  button_border: 'rgba(139, 92, 246, 0.3)',
  font_family: 'sans-serif',
};

const pulsePageSaveSchema = z.object({
  id: z.string().optional(),
  workspace_id: z.string().optional(),
  title: z.string().min(1, 'Le titre est requis').max(120),
  slug: z.string().min(1, 'Le slug est requis').max(80).regex(/^[a-z0-9_-]+$/i, 'Slug invalide'),
  bio: z.string().max(500).default(''),
  avatar_url: z.string().default('/logo.svg'),
  theme_config: z.record(z.any()).default(DEFAULT_THEME_CONFIG),
  blocks: z.array(z.record(z.any())).max(50).default([]),
});

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function normalizePulsePageRow(row: Record<string, any> | null) {
  if (!row) return null;
  const rawAvatar = typeof row.avatar_url === 'string' ? row.avatar_url : '';
  const avatar_url =
    !rawAvatar || rawAvatar.includes('images.unsplash.com') ? '/logo.svg' : rawAvatar;

  const theme_config =
    row.theme_config && typeof row.theme_config === 'object' && row.theme_config.bg_gradient
      ? row.theme_config
      : row.social_links && typeof row.social_links === 'object' && row.social_links.bg_gradient
      ? row.social_links
      : DEFAULT_THEME_CONFIG;

  const blocks = Array.isArray(row.blocks)
    ? row.blocks
    : Array.isArray(row.links)
    ? row.links
    : [];

  return {
    ...row,
    avatar_url,
    theme_config,
    blocks,
  };
}

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
      return NextResponse.json({ success: true, page: normalizePulsePageRow(data) });
    }

    // Authenticated dashboard view
    const user = await requireUser(req);
    let targetWsId =
      queryWsId && UUID_REGEX.test(queryWsId)
        ? queryWsId
        : user.workspace_id || user.workspaceId;

    if ((!targetWsId || !UUID_REGEX.test(targetWsId)) && user.role === 'super_admin') {
      const { data: firstWs } = await supabase.from('workspaces').select('id').limit(1).maybeSingle();
      if (firstWs?.id) targetWsId = firstWs.id;
    }

    if (!targetWsId || !UUID_REGEX.test(targetWsId)) {
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

    return NextResponse.json({ success: true, page: normalizePulsePageRow(data) });
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

    const { id, workspace_id, theme_config, blocks, ...pageData } = parsed.data;

    const supabase = getAdminSupabase();
    if (!supabase) {
      throw new ApiError('DATABASE_UNAVAILABLE', 'Base de données non accessible', 503);
    }

    let targetWsId =
      workspace_id && UUID_REGEX.test(workspace_id)
        ? workspace_id
        : user.workspace_id || user.workspaceId;

    if (!targetWsId || !UUID_REGEX.test(targetWsId)) {
      const { data: firstWs } = await supabase.from('workspaces').select('id').limit(1).maybeSingle();
      if (firstWs?.id) targetWsId = firstWs.id;
    }

    if (!targetWsId || !UUID_REGEX.test(targetWsId)) {
      throw new ApiError('VALIDATION_ERROR', 'Aucun espace de travail valide associé à votre session', 422);
    }

    // RBAC: super_admin, admin, manager, or editor required to create/update pulse pages
    await requireWorkspaceRole(user.id, targetWsId, ['super_admin', 'admin', 'manager', 'editor'], user.role);

    let existingPageId: string | null = null;
    if (id && UUID_REGEX.test(id)) {
      const { data: byId } = await supabase.from('pulse_pages').select('id, workspace_id').eq('id', id).maybeSingle();
      if (byId?.id && byId.workspace_id === targetWsId) existingPageId = byId.id;
    }

    if (!existingPageId && pageData.slug) {
      const { data: bySlug } = await supabase.from('pulse_pages').select('id, workspace_id').eq('slug', pageData.slug).maybeSingle();
      if (bySlug?.id) {
        if (bySlug.workspace_id !== targetWsId) {
          throw new ApiError('CONFLICT', 'Ce slug est déjà utilisé par un autre espace de travail', 409);
        }
        existingPageId = bySlug.id;
      }
    }

    const dbPayload = {
      title: pageData.title,
      slug: pageData.slug,
      bio: pageData.bio,
      avatar_url:
        !pageData.avatar_url || pageData.avatar_url.includes('images.unsplash.com')
          ? '/logo.svg'
          : pageData.avatar_url,
      theme: typeof theme_config?.bg_gradient === 'string' ? theme_config.bg_gradient : 'default',
      links: Array.isArray(blocks) ? blocks : [],
      social_links: theme_config || DEFAULT_THEME_CONFIG,
      is_published: true,
      workspace_id: targetWsId,
      updated_at: new Date().toISOString(),
    };

    let resultData = null;

    if (existingPageId) {
      const { data: updated, error: updateError } = await supabase
        .from('pulse_pages')
        .update(dbPayload)
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
        .insert(dbPayload)
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
      page: normalizePulsePageRow(resultData),
    });
  } catch (err) {
    return handleApiError(err);
  }
}
