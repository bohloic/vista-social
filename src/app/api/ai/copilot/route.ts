import { NextRequest, NextResponse } from 'next/server';
import { runPulseAICopilot, CopilotAttachment, CopilotMemory } from '@/lib/gemini';
import { requireUser, handleApiError, sanitizePromptForLLM } from '@/lib/security/guards';
import { checkRateLimit } from '@/lib/security/rate-limit';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const attachmentSchema = z.object({
  name: z.string().max(200),
  type: z.string().max(100),
  size: z.number().max(10 * 1024 * 1024, 'Taille max 10 Mo par fichier'),
  dataUrl: z.string().optional(),
  textContent: z.string().max(10000).optional(),
});

const copilotRequestSchema = z
  .object({
    message: z.string().min(1, 'Message requis').max(5000, 'Message trop long'),
    history: z
      .array(
        z.object({
          role: z.enum(['user', 'assistant']),
          content: z.string().max(5000),
        })
      )
      .default([]),
    currentPath: z.string().default('/'),
    attachments: z.array(attachmentSchema).max(10, 'Maximum 10 fichiers par envoi').default([]),
    memory: z
      .object({
        userPreferences: z.array(z.string()).optional(),
        brandSummary: z.string().optional(),
        keyEntities: z.record(z.string()).optional(),
        notes: z.array(z.string()).optional(),
      })
      .optional(),
    clientStats: z
      .object({
        crmCount: z.number().optional(),
        workspaceName: z.string().optional(),
      })
      .optional(),
  })
  .strict();

export async function POST(req: NextRequest) {
  try {
    const { user, supabase } = await requireUser(req);
    checkRateLimit(`ai:${user.id}`, 10, 60_000);

    const body = await req.json();
    const parsed = copilotRequestSchema.parse(body);

    const { message, history, currentPath, attachments, memory, clientStats } = parsed;

    // Gather live project stats concisely
    let postsCount = 0;
    let accountsCount = 0;
    let workspaceId: string | undefined = user.workspaceId;

    if (supabase) {
      try {
        const [postsRes, accsRes, wsRes] = await Promise.all([
          supabase.from('posts').select('id', { count: 'exact', head: true }),
          supabase.from('social_accounts').select('id', { count: 'exact', head: true }),
          workspaceId ? Promise.resolve({ data: { id: workspaceId } }) : supabase.from('workspaces').select('id').limit(1).maybeSingle(),
        ]);
        postsCount = postsRes.count || 0;
        accountsCount = accsRes.count || 0;
        if (!workspaceId && wsRes.data?.id) workspaceId = wsRes.data.id;
      } catch {
        // non-blocking
      }
    }

    const sanitizedMessage = sanitizePromptForLLM(message);

    const result = await runPulseAICopilot({
      message: sanitizedMessage,
      history,
      currentPath,
      attachments: attachments as CopilotAttachment[],
      memory: memory as CopilotMemory | undefined,
      projectStats: {
        postsCount,
        accountsCount,
        crmCount: clientStats?.crmCount || 0,
        workspaceName: clientStats?.workspaceName || 'PulseSocial',
      },
    });

    let executedOnServer = false;

    // Server-side CRUD Execution on Supabase (scoped strictly to user workspace)
    if (result.action && supabase && workspaceId) {
      const act = result.action;
      try {
        if (act.type === 'create_post') {
          const p = act.payload;
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
        } else if (act.type === 'delete_post') {
          const { data: latestPost } = await supabase
            .from('posts')
            .select('id')
            .eq('workspace_id', workspaceId)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (latestPost?.id) {
            await supabase.from('posts').delete().eq('id', latestPost.id).eq('workspace_id', workspaceId);
            executedOnServer = true;
          }
        } else if (act.type === 'update_post') {
          const { data: latestPost } = await supabase
            .from('posts')
            .select('id')
            .eq('workspace_id', workspaceId)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (latestPost?.id) {
            await supabase.from('posts').update({ status: 'published' }).eq('id', latestPost.id).eq('workspace_id', workspaceId);
            executedOnServer = true;
          }
        } else if (act.type === 'create_pulse_page') {
          const slug = String(act.payload.slug || `page-${Date.now().toString(36)}`);
          await supabase.from('pulse_pages').insert({
            workspace_id: workspaceId,
            slug,
            title: String(act.payload.title || 'Page PulseSocial'),
            theme: String(act.payload.theme || 'violet'),
            is_published: true,
            links: [
              { label: 'Site Officiel', url: 'https://pulsesocial.ci' },
              { label: 'WhatsApp Direct', url: 'https://wa.me/22507000000' },
            ],
          });
          executedOnServer = true;
        } else if (act.type === 'invite_team_member') {
          const email = String(act.payload.email || '');
          if (email) {
            await supabase.from('workspace_members').insert({
              workspace_id: workspaceId,
              user_id: user.id,
              role: String(act.payload.role || 'editor'),
            });
            executedOnServer = true;
          }
        }
      } catch (err) {
        console.warn('Server CRUD execution warning:', err);
      }
    }

    return NextResponse.json({
      success: true,
      reply: result.reply,
      action: result.action || null,
      executedOnServer,
      updatedMemory: result.updatedMemory || null,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
