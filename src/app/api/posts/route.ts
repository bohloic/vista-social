import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireUser, requireWorkspaceRole, handleApiError, ApiError } from '@/lib/security/guards';
import { checkRateLimit } from '@/lib/security/rate-limit';
import { Post } from '@/lib/types';

export const dynamic = 'force-dynamic';

const postCreateSchema = z
  .object({
    workspace_id: z.string().uuid('workspace_id doit être un UUID valide'),
    author_name: z.string().min(1).default('Pulse CM'),
    content: z.string().min(1, 'Le contenu est requis').max(5000, 'Contenu trop volumineux'),
    post_type: z.enum(['post', 'reel', 'story', 'carousel', 'thread', 'short', 'pin']).default('post'),
    media_urls: z.array(z.string().url('URL média invalide')).default([]),
    status: z
      .enum(['draft', 'needs_approval', 'approved', 'scheduled', 'publishing', 'published', 'failed'])
      .default('scheduled'),
    scheduled_for: z.string().min(1, 'Date de programmation requise'),
    published_at: z.string().optional(),
    target_accounts: z.array(z.string()).min(1, 'Sélectionnez au moins un compte social'),
    first_comment: z.string().max(2000).optional(),
    tags: z.array(z.string()).default([]),
  })
  .strict();

const postUpdateSchema = z
  .object({
    id: z.string().uuid('Identifiant du post invalide (UUID requis)'),
    content: z.string().min(1).max(5000).optional(),
    post_type: z.enum(['post', 'reel', 'story', 'carousel', 'thread', 'short', 'pin']).optional(),
    media_urls: z.array(z.string().url()).optional(),
    status: z
      .enum(['draft', 'needs_approval', 'approved', 'scheduled', 'publishing', 'published', 'failed'])
      .optional(),
    scheduled_for: z.string().optional(),
    first_comment: z.string().max(2000).optional(),
    target_accounts: z.array(z.string()).optional(),
    tags: z.array(z.string()).optional(),
  })
  .strict();

export async function GET(req: NextRequest) {
  try {
    const { user, supabase } = await requireUser(req);
    const { searchParams } = new URL(req.url);
    let rawWorkspaceId = searchParams.get('workspace_id') || user.workspaceId || user.workspace_id;

    if (!rawWorkspaceId && user.role === 'super_admin' && supabase) {
      const { data: firstWs } = await supabase.from('workspaces').select('id').limit(1).maybeSingle();
      if (firstWs?.id) {
        rawWorkspaceId = firstWs.id;
      }
    }

    if (!rawWorkspaceId) {
      throw new ApiError(400, 'MISSING_WORKSPACE_ID', 'Le paramètre workspace_id est obligatoire');
    }

    const parsedWs = z.string().uuid('workspace_id invalide (format UUID attendu)').safeParse(rawWorkspaceId);
    if (!parsedWs.success) {
      throw new ApiError(422, 'INVALID_WORKSPACE_ID', 'workspace_id invalide');
    }
    const workspaceId = parsedWs.data;

    // Enforce workspace membership & role check [C3, M1, M2]
    await requireWorkspaceRole(
      supabase,
      user.id,
      workspaceId,
      ['super_admin', 'admin', 'manager', 'editor', 'client'],
      user.role
    );

    if (!supabase) {
      return NextResponse.json({ posts: [], pagination: { total: 0, limit: 50, offset: 0 } });
    }

    const limit = Math.min(Number(searchParams.get('limit') || 50), 100);
    const offset = Math.max(Number(searchParams.get('offset') || 0), 0);

    const { data: posts, error, count } = await supabase
      .from('posts')
      .select('*', { count: 'exact' })
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new ApiError(500, 'DATABASE_ERROR', 'Impossible de récupérer les posts');
    }

    const formattedPosts: Post[] = (posts || []).map((p: any) => ({
      id: p.id,
      workspace_id: p.workspace_id,
      author_name: p.author_name || 'Pulse CM',
      content: p.content,
      post_type: p.post_type,
      media_urls: p.media_urls || [],
      status: p.status,
      scheduled_for: p.scheduled_for || p.created_at,
      published_at: p.published_at,
      tags: p.tags || [],
      first_comment: p.first_comment,
      target_accounts: p.target_accounts || [],
      created_at: p.created_at,
    }));

    return NextResponse.json({
      posts: formattedPosts,
      pagination: { total: count ?? formattedPosts.length, limit, offset },
    });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user, supabase } = await requireUser(req);

    // Enforce Rate Limiting: 30 requests/min per user [M6]
    const rl = checkRateLimit(`post:${user.id}`, 30, 60_000);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Limite de requêtes atteinte. Veuillez patienter.', retryAfter: rl.retryAfter },
        { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } }
      );
    }

    const body = await req.json();
    if (
      (!body?.workspace_id || body.workspace_id === '00000000-0000-0000-0000-000000000000') &&
      (user.workspaceId || user.workspace_id)
    ) {
      body.workspace_id = user.workspaceId || user.workspace_id;
    }
    const validated = postCreateSchema.parse(body);

    // Enforce workspace membership and non-client role [C2, M1, M2]
    await requireWorkspaceRole(
      supabase,
      user.id,
      validated.workspace_id,
      ['super_admin', 'admin', 'manager', 'editor'],
      user.role
    );

    if (!supabase) {
      const fallbackPost: Post = {
        id: `post-${Date.now()}`,
        created_at: new Date().toISOString(),
        ...validated,
      };
      return NextResponse.json({ post: fallbackPost }, { status: 201 });
    }

    const { data: inserted, error: insertError } = await supabase
      .from('posts')
      .insert({
        workspace_id: validated.workspace_id,
        author_name: validated.author_name,
        content: validated.content,
        post_type: validated.post_type,
        media_urls: validated.media_urls,
        status: validated.status,
        scheduled_for: validated.scheduled_for,
        first_comment: validated.first_comment,
        tags: validated.tags || [],
      })
      .select('id, workspace_id, author_name, content, post_type, media_urls, status, scheduled_for, tags, first_comment, created_at')
      .single();

    if (insertError || !inserted) {
      throw new ApiError(500, 'POST_CREATION_FAILED', 'Échec de création du post en base de données');
    }

    const post: Post = {
      id: inserted.id,
      workspace_id: inserted.workspace_id,
      author_name: inserted.author_name,
      content: inserted.content,
      post_type: inserted.post_type,
      media_urls: inserted.media_urls || [],
      status: inserted.status,
      scheduled_for: inserted.scheduled_for,
      tags: inserted.tags || [],
      first_comment: inserted.first_comment,
      target_accounts: validated.target_accounts,
      created_at: inserted.created_at,
    };

    return NextResponse.json({ post }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { user, supabase } = await requireUser(req);
    const rl = checkRateLimit(`post:${user.id}`, 30, 60_000);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Limite de requêtes atteinte. Veuillez patienter.', retryAfter: rl.retryAfter },
        { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } }
      );
    }

    const body = await req.json();
    const validated = postUpdateSchema.parse(body);

    if (!supabase) {
      return NextResponse.json({ post: validated, success: true });
    }

    // Verify post exists and user has role on the post's workspace
    const { data: existingPost } = await supabase
      .from('posts')
      .select('id, workspace_id')
      .eq('id', validated.id)
      .maybeSingle();

    if (!existingPost) {
      throw new ApiError(404, 'POST_NOT_FOUND', 'Publication introuvable');
    }

    const { id, ...updates } = validated;
    const updateKeys = Object.keys(updates);
    const isClientApprovalOnly =
      updateKeys.length === 1 &&
      updateKeys[0] === 'status' &&
      ['approved', 'draft', 'needs_approval'].includes(String(updates.status));

    const allowedUpdateRoles: ('super_admin' | 'admin' | 'manager' | 'editor' | 'client')[] = isClientApprovalOnly
      ? ['super_admin', 'admin', 'manager', 'editor', 'client']
      : ['super_admin', 'admin', 'manager', 'editor'];

    await requireWorkspaceRole(
      supabase,
      user.id,
      existingPost.workspace_id,
      allowedUpdateRoles,
      user.role
    );
    const { data: updated, error } = await supabase
      .from('posts')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('id, workspace_id, author_name, content, post_type, media_urls, status, scheduled_for, tags, first_comment, created_at, updated_at')
      .single();

    if (error) {
      throw new ApiError(500, 'POST_UPDATE_FAILED', 'Impossible de mettre à jour la publication');
    }

    return NextResponse.json({ post: updated, success: true });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { user, supabase } = await requireUser(req);
    const rl = checkRateLimit(`post:${user.id}`, 30, 60_000);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Limite de requêtes atteinte. Veuillez patienter.', retryAfter: rl.retryAfter },
        { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } }
      );
    }

    const { searchParams } = new URL(req.url);
    let id = searchParams.get('id');

    if (!id) {
      try {
        const body = await req.json();
        id = body.id;
      } catch {
        // query param only
      }
    }

    const parsedId = z.string().uuid('ID de post invalide').safeParse(id);
    if (!parsedId.success) {
      throw new ApiError(422, 'INVALID_POST_ID', 'ID de publication invalide');
    }

    if (!supabase) {
      return NextResponse.json({ success: true, message: 'Publication supprimée avec succès' });
    }

    const { data: existingPost } = await supabase
      .from('posts')
      .select('id, workspace_id')
      .eq('id', parsedId.data)
      .maybeSingle();

    if (!existingPost) {
      throw new ApiError(404, 'POST_NOT_FOUND', 'Publication introuvable');
    }

    await requireWorkspaceRole(
      supabase,
      user.id,
      existingPost.workspace_id,
      ['super_admin', 'admin', 'manager', 'editor'],
      user.role
    );

    const { error } = await supabase.from('posts').delete().eq('id', parsedId.data);
    if (error) {
      throw new ApiError(500, 'POST_DELETION_FAILED', 'Échec de suppression de la publication');
    }

    return NextResponse.json({ success: true, message: 'Publication supprimée avec succès' });
  } catch (err) {
    return handleApiError(err);
  }
}
