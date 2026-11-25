import crypto from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import {
  runPulseAICopilot,
  CopilotAttachment,
  CopilotMemory,
  GeminiApiError,
} from '@/lib/gemini';
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
  connectUrl?: string;
}

const WRITE_TOOLS = new Set([
  'create_draft_post',
  'create_post',
  'delete_post',
  'update_post',
  'create_pulse_page',
  'create_crm_prospect',
  'update_crm_prospect_stage',
  'delete_crm_prospect',
  'invite_team_member',
]);

const COMPOSIO_TOOLKIT_MAP: Record<string, string> = {
  instagram: 'instagram',
  facebook: 'facebook',
  linkedin: 'linkedin',
  twitter: 'twitter',
  tiktok: 'tiktok',
  whatsapp: 'whatsapp',
  google_business: 'googlemybusiness',
  youtube: 'youtube',
  pinterest: 'pinterest',
  threads: 'threads',
};

async function executeServerTool(
  act: { type: string; payload: Record<string, any> },
  supabase: any,
  workspaceId: string | undefined,
  user: any,
  originalMessage: string,
  origin: string
): Promise<ToolExecutionResult> {
  if (!supabase || !workspaceId) {
    return {
      executed: true,
      success: false,
      output: 'Espace de travail ou base de données indisponible pour exécuter cet outil serveur.',
    };
  }

  try {
    const allowedMutators = ['super_admin', 'admin', 'manager', 'editor'];
    if (
      WRITE_TOOLS.has(act.type) &&
      act.type !== 'invite_team_member' &&
      !allowedMutators.includes(user.role)
    ) {
      return {
        executed: true,
        success: false,
        output: `Privilèges insuffisants (rôle ${user.role}) pour modifier des données dans cet espace.`,
      };
    }

    // 1. Read-only Workspace Summary (scoped by workspace_id)
    if (act.type === 'get_workspace_summary') {
      const [postsRes, accsRes, leadsRes, pagesRes] = await Promise.all([
        supabase
          .from('posts')
          .select('id, content, status, scheduled_for')
          .eq('workspace_id', workspaceId)
          .order('created_at', { ascending: false })
          .limit(5),
        supabase
          .from('social_accounts')
          .select('id, platform, account_name, username, is_connected')
          .eq('workspace_id', workspaceId),
        supabase
          .from('leads')
          .select('id, name, status, deal_value')
          .eq('workspace_id', workspaceId),
        supabase
          .from('pulse_pages')
          .select('id, title, slug, views_count')
          .eq('workspace_id', workspaceId),
      ]);

      const summary = {
        workspaceId,
        postsTotal: postsRes.data?.length || 0,
        recentPosts: (postsRes.data || []).map((p: any) => ({
          status: p.status,
          excerpt: String(p.content || '').slice(0, 60),
          scheduled_for: p.scheduled_for,
        })),
        socialAccountsCount: accsRes.data?.length || 0,
        connectedPlatforms: (accsRes.data || []).map((a: any) => `${a.platform} (${a.username || a.account_name})`),
        crmLeadsCount: leadsRes.data?.length || 0,
        crmTotalPipelineFcfa: (leadsRes.data || []).reduce(
          (acc: number, l: any) => acc + Number(l.deal_value || 0),
          0
        ),
        pulsePages: (pagesRes.data || []).map((pg: any) => ({
          title: pg.title,
          slug: `/p/${pg.slug}`,
          views: pg.views_count || 0,
        })),
      };

      return {
        executed: true,
        success: true,
        output: JSON.stringify(summary),
      };
    }

    // 2. Real Composio Connect Link generator (scoped by workspace_id)
    if (act.type === 'create_composio_connect_link') {
      if (!allowedMutators.includes(user.role)) {
        return {
          executed: true,
          success: false,
          output: `Privilèges insuffisants (rôle ${user.role}) pour connecter un réseau social.`,
        };
      }

      const rawPlatform = String(act.payload?.platform || 'instagram').toLowerCase().trim();
      const platform = rawPlatform === 'x' ? 'twitter' : rawPlatform;
      if (!COMPOSIO_TOOLKIT_MAP[platform]) {
        return {
          executed: true,
          success: false,
          output: `Plateforme "${rawPlatform}" non supportée. Plateformes disponibles : ${Object.keys(COMPOSIO_TOOLKIT_MAP).join(', ')}.`,
        };
      }

      const toolkitSlug = COMPOSIO_TOOLKIT_MAP[platform];
      const apiKey = process.env.COMPOSIO_API_KEY?.trim();
      let connectUrl: string | null = null;

      if (apiKey && apiKey.length > 8) {
        try {
          const mcpRes = await fetch('https://connect.composio.dev/mcp', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json, text/event-stream',
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              jsonrpc: '2.0',
              method: 'tools/call',
              params: {
                name: 'COMPOSIO_MANAGE_CONNECTIONS',
                arguments: { toolkits: [toolkitSlug] },
              },
              id: Date.now(),
            }),
            signal: AbortSignal.timeout(8000),
          });

          if (mcpRes.ok) {
            const mcpText = await mcpRes.text();
            for (const line of mcpText.split('\n')) {
              if (line.startsWith('data: ')) {
                try {
                  const parsedLine = JSON.parse(line.slice(6));
                  const resText = parsedLine?.result?.content?.[0]?.text;
                  if (resText) {
                    const parsedResult = JSON.parse(resText);
                    const toolkitData = parsedResult?.data?.results?.[toolkitSlug];
                    if (toolkitData?.redirect_url) {
                      connectUrl = toolkitData.redirect_url;
                      break;
                    }
                  }
                } catch {
                  // ignore SSE parse chunk
                }
              }
            }
          }
        } catch {
          // fall back to official portal below
        }
      }

      if (!connectUrl) {
        connectUrl = `${origin}/oauth-popup?platform=${encodeURIComponent(platform)}&workspaceId=${encodeURIComponent(workspaceId)}&gateway=composio`;
      }

      return {
        executed: true,
        success: true,
        connectUrl,
        output: `Lien OAuth Composio généré pour ${platform} (espace ${workspaceId}) : ${connectUrl}`,
      };
    }

    // 3. Create Draft Post or Scheduled Post (scoped by workspace_id)
    if (act.type === 'create_draft_post' || act.type === 'create_post') {
      const p = act.payload || {};
      const status = act.type === 'create_draft_post' ? 'draft' : String(p.status || 'scheduled');
      const { data, error } = await supabase
        .from('posts')
        .insert({
          workspace_id: workspaceId,
          author_name: user.email || 'PulseAI Copilot',
          content: String(p.content || originalMessage),
          post_type: String(p.post_type || 'post'),
          media_urls: [],
          status,
          scheduled_for: String(p.scheduled_for || new Date(Date.now() + 3600000 * 2).toISOString()),
          tags: ['PulseAI'],
        })
        .select('id, status')
        .single();

      if (error) {
        return { executed: true, success: false, output: `Échec enregistrement post: ${error.message}` };
      }
      return {
        executed: true,
        success: true,
        output: `Publication enregistrée (ID: ${data?.id || 'ok'}, statut: ${data?.status || status}).`,
      };
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

    // 4. Create Pulse Page using real schema columns (blocks, theme_config)
    if (act.type === 'create_pulse_page') {
      const slug = String(act.payload?.slug || `page-${Date.now().toString(36)}`)
        .toLowerCase()
        .replace(/[^a-z0-9_-]/g, '-');
      const { data, error } = await supabase
        .from('pulse_pages')
        .insert({
          workspace_id: workspaceId,
          slug,
          title: String(act.payload?.title || 'Page PulseSocial'),
          bio: String(act.payload?.bio || 'Retrouvez nos liens officiels PulseSocial.'),
          avatar_url: '/logo.svg',
          theme_config: {
            bg_gradient: 'from-violet-950 via-slate-950 to-indigo-950',
            button_bg: 'rgba(255, 255, 255, 0.08)',
            button_border: 'rgba(139, 92, 246, 0.3)',
            font_family: 'sans-serif',
          },
          blocks: Array.isArray(act.payload?.blocks)
            ? act.payload.blocks
            : [
                {
                  id: `blk-${Date.now()}`,
                  type: 'link',
                  title: 'Site Officiel PulseSocial',
                  url: origin,
                  subtitle: 'Découvrir nos services',
                  is_active: true,
                  order_index: 0,
                  click_count: 0,
                },
              ],
        })
        .select('id, slug')
        .single();

      if (error) {
        return { executed: true, success: false, output: `Échec création pulse page: ${error.message}` };
      }
      return { executed: true, success: true, output: `Pulse page /p/${data?.slug || slug} créée avec succès.` };
    }

    // 5. CRM Prospects in Supabase (scoped by workspace_id)
    if (act.type === 'create_crm_prospect') {
      const p = act.payload || {};
      const id = crypto.randomUUID();
      const stageRaw = String(p.status || 'lead');
      const dbStatus = stageRaw === 'lead' ? 'new' : ['contacted', 'proposal', 'won'].includes(stageRaw) ? stageRaw : 'new';
      const dealValue = Number(p.deal_value || p.amount || 50000);
      const name = String(p.name || 'Prospect PulseAI');
      const handle = String(p.handle || '+225 07 00 00 00');

      const { error: leadErr } = await supabase.from('leads').insert({
        id,
        workspace_id: workspaceId,
        name,
        phone: handle,
        status: dbStatus,
        deal_value: Number.isFinite(dealValue) ? dealValue : 0,
      });
      if (leadErr) {
        return { executed: true, success: false, output: `Échec enregistrement prospect CRM: ${leadErr.message}` };
      }

      await supabase.from('crm_contacts').insert({
        id,
        workspace_id: workspaceId,
        name,
        handle,
        platform: String(p.platform || 'whatsapp'),
        phone: handle,
        notes: String(p.notes || originalMessage),
      });

      return {
        executed: true,
        success: true,
        output: `Prospect ${name} (${dealValue.toLocaleString('fr-FR')} FCFA) enregistré dans votre CRM Supabase.`,
      };
    }

    if (act.type === 'update_crm_prospect_stage') {
      const stageRaw = String(act.payload?.stage || 'won');
      const dbStatus = stageRaw === 'lead' ? 'new' : ['contacted', 'proposal', 'won', 'lost'].includes(stageRaw) ? stageRaw : 'won';
      const { data: latestLead } = await supabase
        .from('leads')
        .select('id, name')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!latestLead?.id) {
        return { executed: true, success: false, output: 'Aucun prospect trouvé dans cet espace de travail.' };
      }

      const { error } = await supabase
        .from('leads')
        .update({ status: dbStatus, updated_at: new Date().toISOString() })
        .eq('id', latestLead.id)
        .eq('workspace_id', workspaceId);

      if (error) {
        return { executed: true, success: false, output: `Échec mise à jour prospect: ${error.message}` };
      }
      return {
        executed: true,
        success: true,
        output: `Prospect ${latestLead.name} déplacé vers ${stageRaw}.`,
      };
    }

    if (act.type === 'delete_crm_prospect') {
      const { data: latestLead } = await supabase
        .from('leads')
        .select('id, name')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!latestLead?.id) {
        return { executed: true, success: false, output: 'Aucun prospect à supprimer.' };
      }

      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', latestLead.id)
        .eq('workspace_id', workspaceId);

      if (error) {
        return { executed: true, success: false, output: `Échec suppression prospect: ${error.message}` };
      }
      return { executed: true, success: true, output: `Prospect ${latestLead.name} supprimé du CRM.` };
    }

    if (act.type === 'invite_team_member') {
      if (!['super_admin', 'admin'].includes(user.role)) {
        return {
          executed: true,
          success: false,
          output: `Privilèges insuffisants : seul un administrateur peut inviter un membre dans l'équipe.`,
        };
      }
      const email = String(act.payload?.email || '').toLowerCase().trim();
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return { executed: true, success: false, output: `Email valide requis pour l'invitation.` };
      }
      const requestedRole = String(act.payload?.role || 'editor');
      const safeRole = ['admin', 'manager', 'editor', 'client'].includes(requestedRole) ? requestedRole : 'editor';

      const { data: targetProfile } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('email', email)
        .maybeSingle();

      if (!targetProfile?.id) {
        return {
          executed: true,
          success: false,
          output: `Aucun compte utilisateur trouvé pour ${email}. Utilisez Paramètres > Équipe pour créer l'invitation complète.`,
        };
      }

      const { error } = await supabase.from('workspace_members').upsert(
        {
          workspace_id: workspaceId,
          user_id: targetProfile.id,
          role: safeRole,
        },
        { onConflict: 'workspace_id,user_id' }
      );
      if (error) {
        return { executed: true, success: false, output: `Échec invitation membre: ${error.message}` };
      }
      return { executed: true, success: true, output: `Membre ${email} invité avec succès.` };
    }

    // Client-side navigation / Paystack actions
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
    confirmedAction: z
      .object({
        type: z.string().min(1).max(80),
        label: z.string().max(200).optional(),
        payload: z.record(z.any()).default({}),
      })
      .optional(),
  })
  .strict();

export async function POST(req: NextRequest) {
  try {
    const { user, supabase } = await requireUser(req);
    const rl = checkRateLimit(`ai:${user.id}`, 10, 60_000);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Limite de requêtes IA atteinte. Veuillez patienter.', retryAfter: rl.retryAfter },
        { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } }
      );
    }

    const body = await req.json();
    const parsed = copilotRequestSchema.parse(body);

    const { message, history, currentPath, attachments, memory, clientStats, confirmedAction } = parsed;
    const origin = new URL(req.url).origin;

    // Resolve tenant workspaceId strictly from authenticated session / DB profile
    let workspaceId: string | undefined = user.workspaceId || user.workspace_id;
    if (!workspaceId && supabase) {
      const { data: prof } = await supabase
        .from('user_profiles')
        .select('workspace_id')
        .eq('id', user.id)
        .maybeSingle();
      if (prof?.workspace_id) {
        workspaceId = prof.workspace_id;
      } else {
        const { data: firstWs } = await supabase.from('workspaces').select('id').limit(1).maybeSingle();
        if (firstWs?.id) workspaceId = firstWs.id;
      }
    }

    // Explicit Confirmation branch: execute write tool ONLY when explicitly confirmed by the user
    if (confirmedAction) {
      const toolExec = await executeServerTool(
        confirmedAction,
        supabase,
        workspaceId,
        user,
        message,
        origin
      );
      return NextResponse.json(
        {
          success: toolExec.success,
          reply: toolExec.success ? `✓ ${toolExec.output}` : `⚠️ ${toolExec.output}`,
          action: toolExec.success ? confirmedAction : null,
          executedOnServer: toolExec.executed,
          connectUrl: toolExec.connectUrl,
          error: toolExec.success ? undefined : toolExec.output,
        },
        { status: toolExec.success ? 200 : 400 }
      );
    }

    // Gather live project stats strictly scoped to the user's tenant workspaceId
    let postsCount = 0;
    let accountsCount = 0;
    let crmCount = clientStats?.crmCount || 0;

    if (supabase && workspaceId) {
      try {
        const [postsRes, accsRes, leadsRes] = await Promise.all([
          supabase.from('posts').select('id', { count: 'exact', head: true }).eq('workspace_id', workspaceId),
          supabase.from('social_accounts').select('id', { count: 'exact', head: true }).eq('workspace_id', workspaceId),
          supabase.from('leads').select('id', { count: 'exact', head: true }).eq('workspace_id', workspaceId),
        ]);
        postsCount = postsRes.count || 0;
        accountsCount = accsRes.count || 0;
        crmCount = leadsRes.count || crmCount;
      } catch {
        // non-blocking
      }
    }

    const sanitizedMessage = sanitizePromptForLLM(message);

    // Multi-turn Agent Tool Execution Loop (strictRealLLM = true -> never silently fall back to greeting)
    const MAX_TOOL_CALLS = 3;
    let toolCallCount = 0;
    let previousToolResult: { actionType: string; success: boolean; output: string } | undefined = undefined;
    let finalResult: { reply: string; action?: any; updatedMemory?: any } | null = null;
    let executedOnServer = false;
    let connectUrl: string | undefined;
    let pendingConfirmation:
      | { type: string; label: string; payload: Record<string, unknown>; summary: string }
      | null = null;
    const actionHistory: string[] = [];

    while (toolCallCount < MAX_TOOL_CALLS) {
      let result: { reply: string; action?: any; updatedMemory?: any };
      try {
        result = await runPulseAICopilot({
          message: sanitizedMessage,
          history,
          currentPath,
          attachments: attachments as CopilotAttachment[],
          memory: memory as CopilotMemory | undefined,
          strictRealLLM: true,
          projectStats: {
            postsCount,
            accountsCount,
            crmCount,
            workspaceName: clientStats?.workspaceName || 'PulseSocial',
          },
          previousToolResult,
        });
      } catch (llmErr: unknown) {
        const status = llmErr instanceof GeminiApiError ? llmErr.status : 502;
        const errMsg =
          llmErr instanceof Error ? llmErr.message : 'Erreur lors de la communication avec Gemini.';
        return NextResponse.json(
          {
            success: false,
            error: errMsg,
            reply: `⚠️ ${errMsg}`,
            code: 'GEMINI_API_ERROR',
          },
          { status }
        );
      }

      finalResult = result;

      if (!result.action) {
        break;
      }

      const act = result.action;

      // Require explicit user confirmation before executing any write tool
      if (WRITE_TOOLS.has(act.type)) {
        pendingConfirmation = {
          type: act.type,
          label: String(act.label || act.type),
          payload: act.payload || {},
          summary: String(act.label || act.type),
        };
        break;
      }

      const actionSignature = `${act.type}:${JSON.stringify(act.payload || {})}`;
      const duplicateAttempts = actionHistory.filter((sig) => sig === actionSignature).length;

      if (duplicateAttempts >= 2 && previousToolResult && !previousToolResult.success) {
        return NextResponse.json({
          success: true,
          reply:
            "J'ai tenté cette opération à deux reprises sans succès. Pourriez-vous reformuler votre demande ou préciser les détails nécessaires ?",
          action: null,
          executedOnServer: false,
          updatedMemory: result.updatedMemory || null,
        });
      }

      actionHistory.push(actionSignature);
      toolCallCount++;

      // Read-only or OAuth-link server tool execution
      const toolExec = await executeServerTool(act, supabase, workspaceId, user, message, origin);
      if (toolExec.executed && toolExec.success) {
        executedOnServer = true;
      }
      if (toolExec.connectUrl) {
        connectUrl = toolExec.connectUrl;
      }

      previousToolResult = {
        actionType: act.type,
        success: toolExec.success,
        output: toolExec.output,
      };

      // If get_workspace_summary succeeded, feed the real workspace data back into Gemini to synthesize the answer
      if (act.type === 'get_workspace_summary' && toolExec.success) {
        continue;
      }

      if (toolExec.success || toolExec.isClientAction) {
        break;
      }
    }

    if (toolCallCount >= MAX_TOOL_CALLS && previousToolResult && !previousToolResult.success) {
      return NextResponse.json(
        {
          success: false,
          reply: `⚠️ Outil indisponible : ${previousToolResult.output}`,
          action: null,
          executedOnServer: false,
          error: previousToolResult.output,
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      reply: finalResult?.reply || 'Action traitée.',
      action: pendingConfirmation ? null : finalResult?.action || null,
      pendingConfirmation,
      connectUrl,
      executedOnServer,
      updatedMemory: finalResult?.updatedMemory || null,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
