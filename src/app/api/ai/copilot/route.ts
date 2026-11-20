import { NextRequest, NextResponse } from 'next/server';
import { runPulseAICopilot, CopilotAttachment } from '@/lib/gemini';
import { getAdminSupabase } from '@/lib/supabase';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const attachmentSchema = z.object({
  name: z.string(),
  type: z.string(),
  size: z.number(),
  dataUrl: z.string().optional(),
  textContent: z.string().optional(),
});

const copilotRequestSchema = z.object({
  message: z.string().min(1, 'Message requis'),
  history: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string(),
      })
    )
    .default([]),
  currentPath: z.string().default('/'),
  attachments: z.array(attachmentSchema).max(10, 'Maximum 10 fichiers par envoi').default([]),
  clientStats: z
    .object({
      crmCount: z.number().optional(),
      workspaceName: z.string().optional(),
    })
    .optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = copilotRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || 'Requête invalide' },
        { status: 400 }
      );
    }

    const { message, history, currentPath, attachments, clientStats } = parsed.data;
    const supabase = getAdminSupabase();

    // Gather live project stats concisely
    let postsCount = 0;
    let accountsCount = 0;
    let workspaceId: string | undefined;

    if (supabase) {
      try {
        const [postsRes, accsRes, wsRes] = await Promise.all([
          supabase.from('posts').select('id', { count: 'exact', head: true }),
          supabase.from('social_accounts').select('id', { count: 'exact', head: true }),
          supabase.from('workspaces').select('id').limit(1).maybeSingle(),
        ]);
        postsCount = postsRes.count || 0;
        accountsCount = accsRes.count || 0;
        workspaceId = wsRes.data?.id;
      } catch {
        // non-blocking
      }
    }

    const result = await runPulseAICopilot({
      message,
      history,
      currentPath,
      attachments: attachments as CopilotAttachment[],
      projectStats: {
        postsCount,
        accountsCount,
        crmCount: clientStats?.crmCount || 0,
        workspaceName: clientStats?.workspaceName || 'PulseSocial',
      },
    });

    let executedOnServer = false;

    // If AI decided to create a post, execute it directly in Supabase
    if (result.action?.type === 'create_post' && supabase && workspaceId) {
      try {
        const p = result.action.payload;
        await supabase.from('posts').insert({
          workspace_id: workspaceId,
          author_name: 'PulseAI Copilot',
          content: String(p.content || message),
          post_type: 'post',
          media_urls: [],
          status: 'scheduled',
          scheduled_for: String(p.scheduled_for || new Date(Date.now() + 3600000 * 2).toISOString()),
          tags: ['PulseAI'],
        });
        executedOnServer = true;
      } catch {
        // non-blocking
      }
    }

    return NextResponse.json({
      success: true,
      reply: result.reply,
      action: result.action || null,
      executedOnServer,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur serveur PulseAI';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
