import { NextResponse } from 'next/server';
import { INITIAL_POSTS } from '@/lib/mockData';
import { Post } from '@/lib/types';
import { z } from 'zod';

// In-memory runtime persistence
let postsStore: Post[] = [...INITIAL_POSTS];

const postCreateSchema = z.object({
  workspace_id: z.string().default('ws-default'),
  author_name: z.string().default('Lead CM'),
  content: z.string().min(1),
  post_type: z.enum(['post', 'reel', 'story', 'carousel', 'thread', 'short', 'pin']).default('post'),
  media_urls: z.array(z.string()).default([]),
  status: z.enum(['draft', 'needs_approval', 'approved', 'scheduled', 'publishing', 'published', 'failed']).default('scheduled'),
  scheduled_for: z.string(),
  published_at: z.string().optional(),
  target_accounts: z.array(z.string()).min(1),
  first_comment: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export async function GET() {
  return NextResponse.json({ posts: postsStore });
}

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const validated = postCreateSchema.parse(json);

    const newPost: Post = {
      id: `post-${Date.now()}`,
      created_at: new Date().toISOString(),
      ...validated,
    };

    postsStore = [newPost, ...postsStore];
    return NextResponse.json({ post: newPost }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Invalid payload' }, { status: 400 });
  }
}

