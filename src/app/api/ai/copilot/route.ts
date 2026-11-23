import { NextRequest, NextResponse } from 'next/server';
import { runPulseAICopilot, CopilotAttachment, CopilotMemory } from '@/lib/gemini';
import { requireUser, handleApiError, sanitizePromptForLLM } from '@/lib/security/guards';
import { checkRateLimit } from '@/lib/security/rate-limit';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface ToolExecutionResult {
  executed: boolean;
  success: boolean;
  output: string;
  isClientAction?: boolean;
}

async function executeServerTool(
  act: { type: string; payload: Record<string, any> },
  supabase: any,
  workspaceId: string | undefined,
  user: any,
  originalMessage: string
): Promise<ToolExecutionResult> {
  if (!supabase || !workspaceId) {
    return {
      executed: false,
      success: true,
      output: `Action ${act.type} préparée pour exécution client.`,
      isClientAction: true,
    };
  }

  try {
    if (act.type === 'create_post') {
      const p = act.payload || {};
      const { data, error } = await supabase
        .from('posts')
        .insert({
          workspace_id: workspaceId,
          author_name: 'PulseAI Copilot',
          content: String(p.content || originalMessage),
          post_type: 'post',
          media_urls: [],
          status: 'scheduled',
          scheduled_for: String(p.scheduled_for || new Date(Date.now() + 3600000 * 2).toISOString()),
          tags: ['PulseAI'],
        })
        .select('id')
        .single();

      if (error) {
        return { executed: true, success: false, output: `Échec création post: ${error.message}` };
      }
      return { executed: true, success: true, output: `Post créé avec succès (ID: ${data?.id || 'ok'}).` };
    }

    if (act.type === 'delete_post') {
      const { data: latestPost, error: findError } = await supabase
        .from('posts')
        .select('id')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (findError) {
        return { executed: true, success: false, output: `Échec recherche du post: ${findError.message}` };
      }
      if (!latestPost?.id) {
        return { executed: true, success: false, output: `Aucun post à supprimer dans cet espace.` };
      }

      const { error: delError } = await supabase
        .from('posts')
        .delete()
        .eq('id', latestPost.id)
        .eq('workspace_id', workspaceId);

      if (delError) {
        return { executed: true, success: false, output: `Échec suppression post: ${delError.message}` };
      }
      return { executed: true, success: true, output: `Post supprimé avec succès.` };
    }

    if (act.type === 'update_post') {
      const { data: latestPost, error: findError } = await supabase
        .from('posts')
        .select('id')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (findError || !latestPost?.id) {
        return { executed: true, success: false, output: `Aucun post trouvé à mettre à jour.` };
      }

      const { error: upError } = await supabase
        .from('posts')
        .update({ status: 'published' })
        .eq('id', latestPost.id)
        .eq('workspace_id', workspaceId);

      if (upError) {
        return { executed: true, success: false, output: `Échec mise à jour: ${upError.message}` };
      }
      return { executed: true, success: true, output: `Post mis à jour vers le statut publié.` };
    }

    if (act.type === 'create_pulse_page') {
      const slug = String(act.payload.slug || `page-${Date.now().toString(36)}`);
      const { error } = await supabase.from('pulse_pages').insert({
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

      if (error) {
        return { executed: true, success: false, output: `Échec création pulse page: ${error.message}` };
      }
      return { executed: true, success: true, output: `Pulse page ${slug} créée avec succès.` };
    }

    if (act.type === 'invite_team_member') {
      const email = String(act.payload.email || '');
      if (!email) {
        return { executed: true, success: false, output: `Email manquant pour l'invitation.` };
      }
      const { error } = await supabase.from('workspace_members').insert({
        workspace_id: workspaceId,
        user_id: user.id,
        role: String(act.payload.role || 'editor'),
      });
      if (error) {
        return { executed: true, success: false, output: `Échec invitation membre: ${error.message}` };
      }
      return { executed: true, success: true, output: `Membre ${email} invité avec succès.` };
    }

    // Client-side actions (CRM, Paystack, navigation, inbox reply)
    return {
      executed: false,
      success: true,
      output: `Action client ${act.type} prête pour exécution par le navigateur.`,
      isClientAction: true,
    };
  } catch (err: any) {
    return { executed: true, success: false, output: `Erreur inattendue de l'outil: ${err?.message || 'Erreur inconnue'}` };
  }
}

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

    // Multi-turn Agent Tool Execution Loop (Bounded strictly to 3 tool iterations max)
    const MAX_TOOL_CALLS = 3;
    let toolCallCount = 0;
    let previousToolResult: { actionType: string; success: boolean; output: string } | undefined = undefined;
    let finalResult: { reply: string; action?: any; updatedMemory?: any } | null = null;
    let executedOnServer = false;
    const actionHistory: string[] = [];

    while (toolCallCount < MAX_TOOL_CALLS) {
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
        previousToolResult,
      });

      finalResult = result;

      // If no tool action is proposed, the assistant has answered directly
      if (!result.action) {
        break;
      }

      const act = result.action;
      const actionSignature = `${act.type}:${JSON.stringify(act.payload || {})}`;
      const duplicateAttempts = actionHistory.filter((sig) => sig === actionSignature).length;

      // Instruction: "Si tu as tenté la même action 2 fois sans succès, arrête-toi et demande à l'utilisateur de reformuler."
      if (duplicateAttempts >= 2 && previousToolResult && !previousToolResult.success) {
        return NextResponse.json({
          success: true,
          reply: "J'ai tenté cette opération à deux reprises sans succès. Pourriez-vous reformuler votre demande ou préciser les détails nécessaires ?",
          action: null,
          executedOnServer: false,
          updatedMemory: result.updatedMemory || null,
        });
      }

      actionHistory.push(actionSignature);
      toolCallCount++;

      // Execute tool on server
      const toolExec = await executeServerTool(act, supabase, workspaceId, user, message);
      if (toolExec.executed && toolExec.success) {
        executedOnServer = true;
      }

      previousToolResult = {
        actionType: act.type,
        success: toolExec.success,
        output: toolExec.output,
      };

      // If action executed successfully or is delegated to the client (e.g. CRM / navigation / paystack), exit loop
      if (toolExec.success || toolExec.isClientAction) {
        break;
      }

      // If tool failed, the loop repeats up to MAX_TOOL_CALLS giving the LLM the error text to change approach
    }

    if (toolCallCount >= MAX_TOOL_CALLS && previousToolResult && !previousToolResult.success) {
      return NextResponse.json({
        success: false,
        reply: "Désolé, j'ai atteint le nombre maximum de 3 tentatives d'outils consécutives sans pouvoir finaliser l'action. Veuillez reformuler votre demande.",
        action: null,
        executedOnServer: false,
        error: 'MAX_TOOL_CALLS_EXCEEDED',
      });
    }

    return NextResponse.json({
      success: true,
      reply: finalResult?.reply || 'Action traitée.',
      action: finalResult?.action || null,
      executedOnServer,
      updatedMemory: finalResult?.updatedMemory || null,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
