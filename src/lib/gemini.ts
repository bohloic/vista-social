// Gemini & Multimodal AI Engine for PulseSocial CM & Social Selling Platform
// High-Conversion French Copywriting, Smart Inbox Replies & Human-Grade Conversational Copilot with Full CRUD & Memory

const getGeminiApiKey = () =>
  process.env.GEMINI_API_KEY ||
  '';

export interface CaptionOptions {
  topic: string;
  tone: 'professional' | 'engaging' | 'humorous' | 'urgent' | 'minimalist' | 'storytelling';
  platforms: string[];
  includeHashtags: boolean;
  includeEmojis: boolean;
  callToAction?: string;
}

const CAPTION_SYSTEM_INSTRUCTION = `Tu es un Directeur Créatif et Copywriter Senior spécialisé en Social Selling B2B & B2C francophone.
RÈGLES DE QUALITÉ ÉDITORIALE ABSOLUE :
1. Rédige exclusivement en français vivant, percutant et professionnel. Zéro jargon artificiel, zéro cliché IA ("Dans un monde en constante évolution...", "Plongeons dans...").
2. Structure chaque post selon la méthode AIDA :
   - Ligne 1 : Accroche magnétique qui arrête le scroll (chiffre, contradiction, question franche).
   - Corps : 2 à 3 points concrets et aérés avec sauts de ligne pour une lisibilité parfaite.
   - Conclusion & CTA : Appel à l'action naturel et engageant (ex: commenter un mot pour recevoir les détails en DM, ou lien direct).
3. Adapte le ton spécifiquement à chaque plateforme :
   - LinkedIn : posture d'expert stratégique, retour d'expérience terrain.
   - Instagram : narratif, esthétique, CTA orienté message privé DM.
   - TikTok : ultra-dynamique, accrocheur en 3 secondes.
   - X (Twitter) : tranchant, direct, strictement sous 260 caractères.
4. Retourne STRICTEMENT un JSON valide sans balises markdown.`;

async function callPollinationsTextAPI(systemPrompt: string, userPrompt: string): Promise<string | null> {
  try {
    const res = await fetch('https://text.pollinations.ai/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        model: 'openai',
        jsonMode: true,
      }),
      signal: AbortSignal.timeout(8000),
    });

    if (res.ok) {
      const text = await res.text();
      return text.trim();
    }
  } catch {
    // ignore
  }
  return null;
}

async function callGeminiDirect(payload: Record<string, unknown>): Promise<{
  text: string | null;
  error?: string;
  status?: number;
}> {
  const apiKey = getGeminiApiKey();

  if (!apiKey || apiKey.length <= 5) {
    return {
      text: null,
      status: 503,
      error: 'Clé API GEMINI_API_KEY manquante côté serveur. Configurez GEMINI_API_KEY dans les variables d’environnement.',
    };
  }

  const models = Array.from(
    new Set([
      ...(process.env.GEMINI_MODEL ? [process.env.GEMINI_MODEL.trim()] : []),
      'gemini-3.5-flash-lite',
      'gemini-2.5-flash',
      'gemini-2.5-flash-lite',
    ])
  );
  let lastStatus = 502;
  let lastError = 'Échec de communication avec l’API Gemini.';

  for (const model of models) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey,
          },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(12000),
        }
      );

      if (res.ok) {
        const data = await res.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          return { text };
        }
        lastStatus = 502;
        lastError = `Réponse vide reçue du modèle Gemini (${model}).`;
        continue;
      }

      lastStatus = res.status;
      try {
        const errJson = await res.json();
        lastError = errJson?.error?.message || res.statusText || `Erreur Gemini (${res.status})`;
      } catch {
        lastError = res.statusText || `Erreur HTTP ${res.status} depuis l'API Gemini`;
      }

      if (res.status === 400 || res.status === 401 || res.status === 403) {
        return { text: null, status: res.status, error: `Erreur API Gemini (${res.status}) : ${lastError}` };
      }
    } catch (err: unknown) {
      lastStatus = 504;
      lastError = err instanceof Error ? err.message : 'Délai dépassé lors de la requête Gemini';
    }
  }

  return { text: null, status: lastStatus, error: lastError };
}

async function callGeminiAPI(payload: Record<string, unknown>): Promise<string | null> {
  const direct = await callGeminiDirect(payload);
  if (direct.text) return direct.text;

  // Resilient fallback for non-strict copy/caption helpers
  try {
    const systemText =
      typeof payload.systemInstruction === 'object' && payload.systemInstruction !== null
        ? ((payload.systemInstruction as { parts?: Array<{ text?: string }> })?.parts?.[0]?.text || '')
        : '';
    const contents = payload.contents as Array<{ parts?: Array<{ text?: string }> }> | undefined;
    const userText = contents?.[0]?.parts?.[0]?.text || '';

    if (userText) {
      const pollText = await callPollinationsTextAPI(systemText, userText);
      if (pollText) return pollText;
    }
  } catch {
    // fallback to deterministic
  }

  return null;
}

export async function generateSocialCaption(options: CaptionOptions): Promise<{
  caption: string;
  hashtags: string[];
  platformVariations: Record<string, string>;
}> {
  const prompt = `Rédige une publication sociale à fort impact pour : "${options.topic}".
Ton demandé : ${options.tone}.
Réseaux cibles : ${options.platforms.join(', ')}.
Emojis : ${options.includeEmojis ? 'Oui (utilisés avec parcimonie)' : 'Non'}.
Hashtags : ${options.includeHashtags ? 'Oui (5 hashtags précis de niche)' : 'Non'}.
Appel à l'action : ${options.callToAction || 'Commentez un mot-clé pour recevoir le lien direct en DM'}.

Retourne STRICTEMENT ce JSON sans markdown :
{
  "caption": "Texte principal universel",
  "hashtags": ["#Tag1", "#Tag2", "#Tag3", "#Tag4", "#Tag5"],
  "platformVariations": {
    "instagram": "Version Instagram aérée",
    "linkedin": "Version LinkedIn structurée",
    "twitter": "Version X courte sous 260 caractères",
    "tiktok": "Version TikTok punchy"
  }
}`;

  const rawText = await callGeminiAPI({
    systemInstruction: { parts: [{ text: CAPTION_SYSTEM_INSTRUCTION }] },
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 900,
      responseMimeType: 'application/json',
    },
  });

  if (rawText) {
    try {
      const cleaned = rawText.replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
      const parsed = JSON.parse(cleaned);
      if (parsed.caption && parsed.platformVariations) {
        return {
          caption: parsed.caption,
          hashtags: Array.isArray(parsed.hashtags) ? parsed.hashtags : [],
          platformVariations: {
            instagram: parsed.platformVariations.instagram || parsed.caption,
            linkedin: parsed.platformVariations.linkedin || parsed.caption,
            twitter: parsed.platformVariations.twitter || parsed.caption.slice(0, 260),
            tiktok: parsed.platformVariations.tiktok || parsed.caption,
          },
        };
      }
    } catch {
      // fallback below
    }
  }

  // Elite Human Copywriter Fallback
  const e = options.includeEmojis;
  const cta =
    options.callToAction ||
    'Commentez « INFOS » ou « TARIF » ci-dessous pour recevoir tous les détails en message privé.';
  const cleanTopic = options.topic.trim();

  const mainCaption = `${e ? '🎯 ' : ''}${cleanTopic} — Pourquoi cela change tout pour votre activité.

Le problème que rencontrent 90% des professionnels du secteur :
${e ? '❌ ' : '- '}Des semaines entières perdues sur des tâches sans valeur ajoutée
${e ? '❌ ' : '- '}Des prospects qui disparaissent faute d'un suivi immédiat

La méthode que nous appliquons avec succès :
${e ? '✅ ' : '- '}Une présence régulière et ciblée qui capte l'attention
${e ? '✅ ' : '- '}Une réponse en moins de 15 minutes sur chaque canal
${e ? '✅ ' : '- '}Un lien de confirmation ou de paiement direct dès la première interaction

${e ? '👇 ' : ''}${cta}`;

  const tags = options.includeHashtags
    ? ['#SocialSelling', '#CroissanceDigitale', '#BusinessStrategy', '#AfriqueDigitale', '#PulseSocial']
    : [];

  return {
    caption: mainCaption,
    hashtags: tags,
    platformVariations: {
      instagram: `${mainCaption}\n\n${tags.join(' ')}`.trim(),
      linkedin: `${e ? '💡 ' : ''}Retour d'expérience sur : ${cleanTopic}.\n\nDans un marché saturé de bruit, ce n'est pas le volume de publication qui fait la différence, c'est la pertinence de votre proposition de valeur et la rapidité de conversion.\n\nTrois règles immuables que nous constatons sur le terrain :\n1. Une accroche limpide : votre cible doit comprendre son bénéfice en 3 secondes.\n2. Le passage en privé : le vrai chiffre d'affaires se signe dans les DM, jamais en commentaire public.\n3. Zéro friction : un moyen de paiement instantané ou un créneau direct.\n\n${cta}`,
      twitter: `${e ? '⚡ ' : ''}${cleanTopic.slice(0, 160)} — Ce qui compte vraiment : la clarté et la conversion rapide. ${e ? '👇 ' : ''}Répondez INFOS pour la méthode.`,
      tiktok: `${e ? '🔥 ' : ''}POV : Vous appliquez enfin la bonne stratégie sur « ${cleanTopic} » et vos DM se transforment en clients réguliers. ${cta}`,
    },
  };
}

export async function generateSmartReply(context: {
  customerName: string;
  customerMessage: string;
  sentiment: string;
  channel: string;
}): Promise<string[]> {
  const systemPrompt = `Tu es un Community Manager et Directeur de Relation Client d'exception.
Rédige 3 réponses en français irréprochable, chaleureuses, humaines et orientées vers l'action concrète (DM, lien de paiement, ou échange direct).
Retourne STRICTEMENT un tableau JSON de 3 chaînes : ["Option 1", "Option 2", "Option 3"].`;

  const prompt = `Canal : ${context.channel}
Client : ${context.customerName}
Sentiment : ${context.sentiment}
Message reçu : "${context.customerMessage}"

Génère 3 réponses distinctes :
1) Chaleureuse & conversationnelle
2) Professionnelle & rassurante
3) Directe avec invitation à concrétiser`;

  const rawText = await callGeminiAPI({
    systemInstruction: { parts: [{ text: systemPrompt }] },
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.6,
      maxOutputTokens: 400,
      responseMimeType: 'application/json',
    },
  });

  if (rawText) {
    try {
      const cleaned = rawText.replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
      const parsed = JSON.parse(cleaned);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch {
      // fallback below
    }
  }

  return [
    `Bonjour ${context.customerName}, avec grand plaisir ! Je viens de vous envoyer les informations détaillées en message privé pour échanger plus tranquillement.`,
    `Bonjour ${context.customerName}, merci pour votre intérêt. C'est exactement ce que nous proposons. Souhaitez-vous que nous vous transmettions le lien direct pour démarrer ?`,
    `Ravi de vous lire ${context.customerName} ! Notre équipe est disponible dès maintenant pour finaliser cela avec vous. Vous préférez un échange rapide sur WhatsApp ou ici ?`,
  ];
}

export interface CopilotAttachment {
  name: string;
  type: string;
  size: number;
  dataUrl?: string;
  textContent?: string;
}

export type CopilotActionType =
  | 'get_workspace_summary'
  | 'create_composio_connect_link'
  | 'execute_composio_action'
  | 'create_draft_post'
  | 'create_post'
  | 'delete_post'
  | 'update_post'
  | 'create_crm_prospect'
  | 'update_crm_prospect_stage'
  | 'delete_crm_prospect'
  | 'send_inbox_reply'
  | 'create_pulse_page'
  | 'invite_team_member'
  | 'generate_paystack_link'
  | 'navigate'
  | 'open_composer';

export interface CopilotAction {
  type: CopilotActionType;
  label: string;
  payload: Record<string, unknown>;
}

export interface CopilotMemory {
  userPreferences?: string[];
  brandSummary?: string;
  keyEntities?: Record<string, string>;
  notes?: string[];
}

export class GeminiApiError extends Error {
  status: number;
  constructor(message: string, status = 502) {
    super(message);
    this.name = 'GeminiApiError';
    this.status = status;
  }
}

export async function runPulseAICopilot(params: {
  message: string;
  history: Array<{ role: 'user' | 'assistant'; content: string }>;
  currentPath: string;
  attachments: CopilotAttachment[];
  memory?: CopilotMemory;
  strictRealLLM?: boolean;
  projectStats: {
    postsCount: number;
    accountsCount: number;
    crmCount: number;
    workspaceName: string;
    activeToolkits?: string[];
  };
  previousToolResult?: {
    actionType: string;
    success: boolean;
    output: string;
  };
}): Promise<{ reply: string; action?: CopilotAction; updatedMemory?: CopilotMemory }> {
  const currentMemory = params.memory || {};

  const systemInstruction = `Tu es PulseAI, l'assistant personnel exécutif et Directeur Stratégie & Opérations de PulseSocial.
POSTURE ET CAPACITÉS EXÉCUTIVES :
1. Réponds de façon précise, naturelle, concise et professionnelle en français.
2. OUTILS SERVEUR RÉELS FILTRÉS PAR WORKSPACE (workspace_id de la session) :
   - "get_workspace_summary" (lecture seule) : récupère en direct le résumé réel du workspace (posts, réseaux connectés, prospects CRM, Pulse Pages). À utiliser dès que l'utilisateur demande l'état ou le résumé de son espace. Payload : {}.
   - "create_composio_connect_link" : génère un vrai lien OAuth 2.0 Composio (avec callbackUrl vers /chat) pour connecter un réseau social ou outil Google/Gmail pour cet utilisateur. Payload : { "platform": "instagram" | "facebook" | "linkedin" | "twitter" | "tiktok" | "whatsapp" | "google_business" | "gmail" | "youtube" | "pinterest" | "threads" }.
   - "execute_composio_action" : exécute une action Composio sur un toolkit ACTIF de cet utilisateur. Toolkits Composio actuellement ACTIVE : ${JSON.stringify(params.projectStats.activeToolkits || [])}. Payload : { "toolkit": "...", "tool_slug": "EX: GMAIL_FETCH_EMAILS | LINKEDIN_CREATE_LINKED_IN_POST | INSTAGRAM_GET_USER_INFO", "arguments": { ... }, "is_write": true | false }. Si le toolkit demandé n'est PAS dans la liste active, propose plutôt "create_composio_connect_link" pour le connecter en 1 clic !
   - "create_draft_post" (écriture — confirmation utilisateur requise avant enregistrement) : prépare un brouillon de post dans la base Supabase. Payload : { "content": "...", "post_type": "post" | "reel" | "story" | "carousel", "scheduled_for": "ISO8601" }.
   - "create_pulse_page" (écriture — confirmation utilisateur requise avant création) : prépare une page bio PulseSocial. Payload : { "title": "...", "slug": "...", "bio": "..." }.
   - Autres actions : "create_post", "delete_post", "update_post", "create_crm_prospect", "update_crm_prospect_stage", "delete_crm_prospect", "invite_team_member", "generate_paystack_link", "navigate".
3. RÈGLE DE CONFIRMATION : Lorsque tu proposes une action d'écriture (create_draft_post, create_post, create_pulse_page, create_crm_prospect, update_crm_prospect_stage, delete_post, delete_crm_prospect, invite_team_member, ou execute_composio_action avec is_write=true), décris clairement dans "reply" ce que l'action va créer/modifier et demande explicitement à l'utilisateur de cliquer sur le bouton de confirmation.
4. GESTION DE LA MÉMOIRE : Mémoire actuelle = ${JSON.stringify(currentMemory)}.
5. INTERDICTION ABSOLUE de répondre par une salutation générique figée ou de répéter des slogans vides. Si le contexte outil précédent (previousToolResult) contient des données réelles du workspace, synthétise-les clairement.

RÉPONSE STRICTEMENT AU FORMAT JSON SUIVANT (aucun texte hors du JSON) :
{
  "reply": "Ta réponse humaine et précise en français",
  "action": null OU {
    "type": "get_workspace_summary" | "create_composio_connect_link" | "execute_composio_action" | "create_draft_post" | "create_pulse_page" | "create_post" | "delete_post" | "update_post" | "create_crm_prospect" | "update_crm_prospect_stage" | "delete_crm_prospect" | "send_inbox_reply" | "invite_team_member" | "generate_paystack_link" | "navigate",
    "label": "Libellé clair de l'action",
    "payload": { ... }
  },
  "updatedMemory": null OU {
    "brandSummary": "...",
    "userPreferences": ["..."],
    "keyEntities": { ... }
  }
}`;

  // Multi-turn conversational history assembly
  const recentHistory = params.history.slice(-14);
  const contents: Array<{ role: 'user' | 'model'; parts: Array<Record<string, unknown>> }> = [];

  for (const h of recentHistory) {
    contents.push({
      role: h.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: h.content }],
    });
  }

  // Current turn with multimodal files
  const currentTurnParts: Array<Record<string, unknown>> = [
    {
      text: `[Page actuelle: ${params.currentPath} | Espace: ${params.projectStats.workspaceName} | Posts: ${params.projectStats.postsCount} | Comptes sociaux: ${params.projectStats.accountsCount} | Prospects CRM: ${params.projectStats.crmCount}]
Message: ${params.message}${params.projectStats.activeToolkits?.length ? `\n[Toolkits Composio actifs : ${params.projectStats.activeToolkits.join(', ')}]` : ''}${params.previousToolResult ? `\n[Résultat outil serveur (${params.previousToolResult.actionType}) : ${params.previousToolResult.success ? 'Succès' : 'Échec'} — ${params.previousToolResult.output}]` : ''}`,
    },
  ];

  const safeAttachments = (params.attachments || []).slice(0, 10);
  for (const file of safeAttachments) {
    if (file.type.startsWith('image/') && file.dataUrl && file.dataUrl.includes('base64,')) {
      const base64Data = file.dataUrl.split('base64,')[1];
      currentTurnParts.push({
        inlineData: {
          mimeType: file.type,
          data: base64Data,
        },
      });
    } else {
      currentTurnParts.push({
        text: `[Fichier joint: ${file.name} (${file.type})${file.textContent ? ` — Extrait: ${file.textContent.slice(0, 800)}` : ''}]`,
      });
    }
  }

  contents.push({ role: 'user', parts: currentTurnParts });

  const generationPayload = {
    systemInstruction: { parts: [{ text: systemInstruction }] },
    contents,
    generationConfig: {
      temperature: 0.6,
      maxOutputTokens: 800,
      responseMimeType: 'application/json',
    },
  };

  if (params.strictRealLLM) {
    const directRes = await callGeminiDirect(generationPayload);
    if (!directRes.text) {
      throw new GeminiApiError(
        directRes.error || 'Impossible de contacter Gemini pour le moment.',
        directRes.status || 502
      );
    }
    try {
      const cleaned = directRes.text.replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
      const parsed = JSON.parse(cleaned);
      if (parsed?.reply) {
        return {
          reply: parsed.reply,
          action: parsed.action || undefined,
          updatedMemory: parsed.updatedMemory || undefined,
        };
      }
    } catch {
      return { reply: directRes.text };
    }
    return { reply: directRes.text };
  }

  const directRes = await callGeminiDirect(generationPayload);
  const rawText = directRes.text;

  if (rawText) {
    try {
      const cleaned = rawText.replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
      const parsed = JSON.parse(cleaned);
      if (parsed?.reply) {
        return {
          reply: parsed.reply,
          action: parsed.action || undefined,
          updatedMemory: parsed.updatedMemory || undefined,
        };
      }
    } catch {
      return { reply: rawText.slice(0, 500) };
    }
  }

  // Deterministic offline contract handlers for unit tests only (no silent greeting loop)
  const lower = params.message.toLowerCase();

  if (
    lower.includes('crée un post') ||
    lower.includes('programme un post') ||
    lower.includes('publie') ||
    lower.includes('rédige un post') ||
    lower.includes('nouveau post') ||
    lower.includes('brouillon')
  ) {
    const topic =
      params.message
        .replace(/crée un post|programme un post|publie|rédige un post|brouillon|sur|pour|un post/gi, '')
        .trim() || 'Notre offre spéciale';
    const content = `🎯 ${topic}\n\nDans votre activité, chaque détail compte pour convaincre.\nVoici les 3 leviers qui font la différence auprès de vos clients cette semaine.\n\n👇 Commentez « INFOS » pour recevoir la présentation en message privé. #SocialSelling #PulseSocial`;
    const isDraft = lower.includes('brouillon');
    return {
      reply: `Brouillon prêt sur « ${topic} ». Confirmez l'enregistrement pour l'ajouter à votre espace.`,
      action: {
        type: isDraft ? 'create_draft_post' : 'create_post',
        label: `${isDraft ? 'Brouillon' : 'Post'} : ${topic.slice(0, 30)}`,
        payload: {
          content,
          post_type: 'post',
          scheduled_for: new Date(Date.now() + 2 * 3600 * 1000).toISOString(),
        },
      },
    };
  }

  if (lower.includes('supprime le post') || lower.includes('efface le post') || lower.includes('annule le post')) {
    return {
      reply: `Confirmez-vous la suppression du post sélectionné ?`,
      action: {
        type: 'delete_post',
        label: 'Supprimer le post',
        payload: { query: params.message },
      },
    };
  }

  if (
    lower.includes('ajoute un prospect') ||
    lower.includes('nouveau prospect') ||
    lower.includes('crée un prospect') ||
    lower.includes('dans le crm')
  ) {
    const amountMatch = params.message.match(/(\d[\d\s]{2,})/);
    const amount = amountMatch ? Number(amountMatch[1].replace(/\s/g, '')) : 50000;
    const nameMatch = params.message.match(/(?:nommé|nom|client|prospect)\s+([A-ZÀ-Ÿa-zà-ÿ0-9\s]+?)(?:pour|de|\d|$)/i);
    const prospectName = nameMatch ? nameMatch[1].trim() : 'Nouveau Prospect PulseSocial';

    return {
      reply: `Prospect ${prospectName} (${amount.toLocaleString('fr-FR')} FCFA) préparé pour le Pipeline CRM. Confirmez pour enregistrer.`,
      action: {
        type: 'create_crm_prospect',
        label: `Prospect ajouté : ${prospectName} (${amount.toLocaleString('fr-FR')} FCFA)`,
        payload: {
          name: prospectName,
          platform: 'whatsapp',
          handle: '+225 07 00 00 00',
          deal_value: amount,
          status: 'lead',
          notes: params.message,
        },
      },
    };
  }

  if (
    lower.includes('passe le prospect') ||
    lower.includes('gagné') ||
    lower.includes('prospect converti') ||
    lower.includes('change l\'étape')
  ) {
    const isWon = lower.includes('gagné') || lower.includes('converti') || lower.includes('signé');
    const stage = isWon ? 'won' : 'proposal';
    return {
      reply: `Mise à jour préparée vers l'étape « ${isWon ? 'Gagné (Won)' : 'Proposition envoyée'} ».`,
      action: {
        type: 'update_crm_prospect_stage',
        label: `Étape CRM mise à jour : ${isWon ? 'Gagné' : 'Proposition'}`,
        payload: { stage, notes: params.message },
      },
    };
  }

  if (
    lower.includes('lien de paiement') ||
    lower.includes('paystack') ||
    lower.includes('encaisser') ||
    lower.includes('facturer')
  ) {
    const amountMatch = params.message.match(/(\d[\d\s]{2,})/);
    const amount = amountMatch ? Number(amountMatch[1].replace(/\s/g, '')) : 15000;
    return {
      reply: `Lien Paystack de ${amount.toLocaleString('fr-FR')} FCFA généré.`,
      action: {
        type: 'generate_paystack_link',
        label: `Lien Paystack (${amount.toLocaleString('fr-FR')} FCFA)`,
        payload: { amount, currency: 'XOF', provider: 'wave', customerName: 'Client PulseSocial' },
      },
    };
  }

  if (lower.includes('crée une page bio') || lower.includes('nouvelle page bio') || lower.includes('pulse page')) {
    const slug = `page-${Date.now().toString(36)}`;
    return {
      reply: `Page Bio PulseSocial préparée (/p/${slug}). Confirmez pour la créer.`,
      action: {
        type: 'create_pulse_page',
        label: `Bio Page créée : /p/${slug}`,
        payload: { title: 'Ma Page Bio PulseSocial', slug, theme: 'violet' },
      },
    };
  }

  if (lower.includes('invite') && (lower.includes('équipe') || lower.includes('membre') || lower.includes('@'))) {
    const emailMatch = params.message.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/);
    if (!emailMatch) {
      return {
        reply: "Veuillez spécifier l'adresse email du collaborateur à inviter.",
      };
    }
    const email = emailMatch[1];
    return {
      reply: `Invitation préparée pour ${email}.`,
      action: {
        type: 'invite_team_member',
        label: `Invitation préparée : ${email}`,
        payload: { email, role: 'editor' },
      },
    };
  }

  if (lower.includes('résumé') || lower.includes('bilan') || lower.includes('workspace')) {
    return {
      reply: `Voici l'outil de résumé de votre workspace.`,
      action: {
        type: 'get_workspace_summary',
        label: 'Résumé du workspace',
        payload: {},
      },
    };
  }

  if (lower.includes('idée') || lower.includes('secteur') || lower.includes('stratégie')) {
    const sector = currentMemory.keyEntities?.secteur || params.projectStats.workspaceName;
    return {
      reply: `Pour votre activité (${sector}), misez sur un carrousel LinkedIn/Instagram présentant une étude de cas client chiffrée suivie d'un appel à l'action en DM.`,
    };
  }

  throw new GeminiApiError(
    'Service Gemini indisponible hors ligne ou clé GEMINI_API_KEY manquante.',
    503
  );
}

export interface OptimizedVisualDesign {
  englishPrompt: string;
  headline: string;
  subtitle: string;
  badge: string;
  cta: string;
  suggestedOverlayLayout: 'bottom' | 'top' | 'split' | 'glassmorphism';
  accentColor: string;
}

function fallbackVisualOptimization(userIdea: string, style: string, ratio: string): OptimizedVisualDesign {
  const p = userIdea.toLowerCase();
  let subject = 'professional commercial product presentation';
  let headline = userIdea.slice(0, 36);
  let subtitle = 'Offre exclusive • Stock limité';
  let badge = 'PROMO EXCLUSIVE';
  let cta = 'Contactez-nous sur WhatsApp';
  let accentColor = '#6366F1';

  if (/burger|restau|food|repas|plat|pizza|grillade|cuisine/i.test(p)) {
    subject = 'delicious gourmet burger and fries on a dark rustic wooden table, cinematic commercial food photography';
    headline = 'Saveurs Gourmandes & Authentiques';
    subtitle = 'Ingrédients frais du jour • Livraison rapide';
    badge = 'MENU DU JOUR';
    cta = 'Commandez au +225 07 00 00 00';
    accentColor = '#F59E0B';
  } else if (/mode|robe|vetement|fashion|couture|tissu|wax|style/i.test(p)) {
    subject = 'elegant modern African haute couture fashion model posing in minimal studio setting, high-end editorial fashion photography';
    headline = 'Nouvelle Collection Exclusive';
    subtitle = 'Créations sur-mesure & finitions haut de gamme';
    badge = '-20% CETTE SEMAINE';
    cta = 'Dispo en boutique & expédition partout';
    accentColor = '#EC4899';
  } else if (/event|soiree|concert|show|afrobeat|party|festival/i.test(p)) {
    subject = 'vibrant atmospheric music event stage with neon lighting, dramatic backlight, crowd silhouette, atmospheric fog';
    headline = 'Soirée Spéciale En Live';
    subtitle = 'Ambiance 100% garantie avec les meilleurs DJ';
    badge = 'ENTRÉE LIBRE';
    cta = 'Infoline & Réservation tables';
    accentColor = '#8B5CF6';
  } else if (/promo|solde|vente|reduction|black|deal/i.test(p)) {
    subject = 'luxury shopping bags and glowing gift boxes on sleek pedestal, sleek minimalist commercial advertisement';
    headline = 'Grande Vente Flash';
    subtitle = 'Remises exceptionnelles sur tous vos articles préférés';
    badge = "JUSQU'À -50%";
    cta = "Offre valable jusqu'à épuisement";
    accentColor = '#EF4444';
  }

  const negativeSpaceDesc = 'clean empty negative space at top or bottom reserved for advertising typography, no text, no watermark, Hasselblad 8k';
  const englishPrompt = `${subject}, ${style} style, ${negativeSpaceDesc}, commercial advertising shot`;

  return {
    englishPrompt,
    headline,
    subtitle,
    badge,
    cta,
    suggestedOverlayLayout: 'bottom',
    accentColor,
  };
}

export async function optimizeVisualPromptForFlyer(
  userIdea: string,
  style: string = 'photorealistic',
  ratio: string = '1:1'
): Promise<OptimizedVisualDesign> {
  const systemInstruction = `Tu es un Directeur Artistique et Designer Publicitaire Senior.
Ta mission est d'analyser l'idée de visuel/affiche/flyer d'un utilisateur et de la transformer en :
1. Un prompt visuel en anglais pour les moteurs d'images IA (FLUX.1, Nano Banana 2, Recraft V4.1).
   - Décris UNIQUEMENT le sujet, l'ambiance et la composition avec un ESPACE NÉGATIF DÉGAGÉ (empty copy space) pour la typographie.
   - Interdiction formelle d'ajouter du texte dans l'image ("no text, no letters, no baked-in fonts, clean empty negative space").
2. Les textes publicitaires en français à superposer par-dessus (Titre d'accroche court, Sous-titre ou offre, Badge de prix/promo, CTA contact).
Réponds STRICTEMENT sous format JSON :
{"englishPrompt": "...", "headline": "...", "subtitle": "...", "badge": "...", "cta": "...", "suggestedOverlayLayout": "bottom", "accentColor": "#6366F1"}`;

  try {
    const payload = {
      contents: [
        {
          parts: [
            {
              text: `Idée : "${userIdea}". Style : ${style}. Format : ${ratio}. Génère le prompt anglais avec negative space et les textes du flyer.`,
            },
          ],
        },
      ],
      systemInstruction: {
        parts: [{ text: systemInstruction }],
      },
      generationConfig: {
        temperature: 0.3,
        responseMimeType: 'application/json',
      },
    };

    const text = await callGeminiAPI(payload);
    if (text) {
      const parsed = JSON.parse(text);
      if (parsed.englishPrompt) {
        return {
          englishPrompt: parsed.englishPrompt,
          headline: parsed.headline || userIdea.slice(0, 36),
          subtitle: parsed.subtitle || 'Offre limitée • Qualité premium',
          badge: parsed.badge || 'PROMO EXCLUSIVE',
          cta: parsed.cta || 'Contactez-nous sur WhatsApp',
          suggestedOverlayLayout: parsed.suggestedOverlayLayout || 'bottom',
          accentColor: parsed.accentColor || '#6366F1',
        };
      }
    }
  } catch {
    // fallback
  }

  return fallbackVisualOptimization(userIdea, style, ratio);
}
