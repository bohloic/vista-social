import { getAdminSupabase } from '@/lib/supabase';
import { Post } from '@/lib/types';
import { z } from 'zod';

const postCreateSchema = z.object({
  workspace_id: z.string().default('ws-default'),
  author_name: z.string().default('Pulse CM'),
  content: z.string().min(1, 'Le contenu est requis'),
  post_type: z.enum(['post', 'reel', 'story', 'carousel', 'thread', 'short', 'pin']).default('post'),
  media_urls: z.array(z.string()).default([]),
  status: z.enum(['draft', 'needs_approval', 'approved', 'scheduled', 'publishing', 'published', 'failed']).default('scheduled'),
  scheduled_for: z.string(),
  published_at: z.string().optional(),
  target_accounts: z.array(z.string()).min(1, 'Sélectionnez au moins un réseau'),
  first_comment: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export async function GET() {
  try {
    const adminClient = getAdminSupabase();
    const { data: posts, error } = await adminClient
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Could not fetch posts from Supabase:', error.message);
      return Response.json({ posts: [] });
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
      target_accounts: [],
      created_at: p.created_at,
    }));

    return Response.json({ posts: formattedPosts });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error fetching posts';
    return Response.json({ posts: [], error: message });
  }
}

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const parsed = postCreateSchema.safeParse(json);
    if (!parsed.success) {
      return Response.json({ error: parsed.error.errors[0]?.message || 'Données invalides' }, { status: 400 });
    }

    const validated = parsed.data;
    const adminClient = getAdminSupabase();

    // Check if a real workspace exists, else get the first one
    let targetWorkspaceId = validated.workspace_id;
    if (targetWorkspaceId === 'ws-default') {
      const { data: ws } = await adminClient.from('workspaces').select('id').limit(1);
      if (ws && ws.length > 0) {
        targetWorkspaceId = ws[0].id;
      }
    }

    const { data: inserted, error: insertError } = await adminClient
      .from('posts')
      .insert({
        workspace_id: targetWorkspaceId,
        author_name: validated.author_name,
        content: validated.content,
        post_type: validated.post_type,
        media_urls: validated.media_urls,
        status: validated.status,
        scheduled_for: validated.scheduled_for,
        first_comment: validated.first_comment,
        tags: validated.tags || [],
      })
      .select()
      .single();

    if (insertError || !inserted) {
      // Fallback local response
      const fallbackPost: Post = {
        id: `post-${Date.now()}`,
        created_at: new Date().toISOString(),
        ...validated,
        workspace_id: targetWorkspaceId,
      };
      return Response.json({ post: fallbackPost }, { status: 201 });
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

    return Response.json({ post }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur lors de la création du post';
    return Response.json({ error: message }, { status: 400 });
  }
}
