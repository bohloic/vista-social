// Gemini AI Engine for PulseSocial CM & Social Selling Platform
// Supports High-Conversion Social Captions, Smart Replies, and Concise Multimodal Voice Copilot

const getGeminiApiKey = () =>
  process.env.GEMINI_API_KEY ||
  process.env.NEXT_PUBLIC_GEMINI_API_KEY ||
  '';

export interface CaptionOptions {
  topic: string;
  tone: 'professional' | 'engaging' | 'humorous' | 'urgent' | 'minimalist' | 'storytelling';
  platforms: string[];
  includeHashtags: boolean;
  includeEmojis: boolean;
  callToAction?: string;
}

const CAPTION_SYSTEM_INSTRUCTION = `Tu es un Directeur Créatif et Copywriter Senior spécialisé en Social Selling B2B & B2C francophone (Europe & Afrique de l'Ouest).
RÈGLES DE QUALITÉ ÉDITORIALE :
1. Rédige exclusivement en français naturel, percutant et professionnel (zéro phrase générique ou cliché).
2. Structure chaque post selon la méthode AIDA / PAS :
   - Accroche puissante sur la 1ère ligne (scroll-stopper).
   - Corps aéré avec sauts de ligne et 2-3 points de valeur concrets.
   - Appel à l'action (CTA) orienté conversion Social Selling (ex: commenter un mot-clé pour recevoir les détails en DM ou réserver un créneau).
3. Adapte le style natif à chaque réseau :
   - LinkedIn : posture d'expert B2B, retour d'expérience, question ouverte stratégique.
   - Instagram : visuel, storytelling rapide, sauts de ligne propres, CTA DM.
   - TikTok : dynamique, court, style créateur viral.
   - X (Twitter) : ultra-percutant, strictement < 260 caractères.
4. Retourne UNIQUEMENT un JSON valide strict sans balises markdown.`;

async function callGeminiAPI(payload: Record<string, unknown>): Promise<string | null> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) return null;

  const models = ['gemini-2.0-flash', 'gemini-1.5-flash'];
  for (const model of models) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );

      if (res.ok) {
        const data = await res.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return text;
      }
    } catch {
      // try next model
    }
  }
  return null;
}

export async function generateSocialCaption(options: CaptionOptions): Promise<{
  caption: string;
  hashtags: string[];
  platformVariations: Record<string, string>;
}> {
  const prompt = `Rédige une publication sociale à fort taux de conversion sur le sujet : "${options.topic}".
Ton demandé : ${options.tone}.
Réseaux cibles : ${options.platforms.join(', ')}.
Emojis : ${options.includeEmojis ? 'Oui (dosés avec élégance)' : 'Non'}.
Hashtags : ${options.includeHashtags ? 'Oui (5 hashtags stratégiques de niche)' : 'Non'}.
Appel à l'action souhaité : ${options.callToAction || 'Inciter à commenter un mot-clé pour recevoir les infos en message privé (DM)'}.

Retourne STRICTEMENT ce format JSON :
{
  "caption": "Texte principal complet avec accroche, valeur ajoutée et CTA",
  "hashtags": ["#Tag1", "#Tag2", "#Tag3", "#Tag4", "#Tag5"],
  "platformVariations": {
    "instagram": "Version optimisée Instagram avec accroche et CTA DM",
    "linkedin": "Version experte B2B LinkedIn structurée et crédible",
    "twitter": "Version concise et percutante < 260 caractères",
    "tiktok": "Version courte et virale pour TikTok"
  }
}`;

  const rawText = await callGeminiAPI({
    systemInstruction: { parts: [{ text: CAPTION_SYSTEM_INSTRUCTION }] },
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.72,
      maxOutputTokens: 900,
      responseMimeType: 'application/json',
    },
  });

  if (rawText) {
    try {
      const cleaned = rawText.replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
      const parsed = JSON.parse(cleaned);
      if (parsed?.caption) return parsed;
    } catch {
      // fallback below
    }
  }

  // High-quality structured French Social Selling fallback
  const e = options.includeEmojis;
  const cta =
    options.callToAction ||
    'Commentez « INFOS » ou « TARIF » ci-dessous pour recevoir tous les détails en DM.';
  const cleanTopic = options.topic.trim();

  const mainCaption = `${e ? '🎯 ' : ''}${cleanTopic} — Ce qui change vraiment la donne aujourd'hui.

La plupart des professionnels passent à côté d'un levier simple mais décisif :
${e ? '✅ ' : '- '}Une exécution plus rapide et structurée
${e ? '✅ ' : '- '}Des résultats mesurables dès la première semaine
${e ? '✅ ' : '- '}Une expérience client fluide du premier contact à l'encaissement

${e ? '👇 ' : ''}${cta}`;

  const tags = options.includeHashtags
    ? ['#SocialSelling', '#CroissanceDigitale', '#Strategie', '#Business', '#PulseSocial']
    : [];

  return {
    caption: mainCaption,
    hashtags: tags,
    platformVariations: {
      instagram: `${mainCaption}\n\n${tags.join(' ')}`.trim(),
      linkedin: `${e ? '💡 ' : ''}Retour terrain sur : ${cleanTopic}.\n\nAprès avoir observé des dizaines d'équipes, un constat s'impose : la régularité et la clarté de l'offre battent toujours le volume brut.\n\n3 axes immédiats à activer :\n1. Clarifier votre promesse en 1 phrase\n2. Transformer chaque commentaire qualifié en discussion privée\n3. Simplifier la prise de décision avec un lien direct\n\n${cta}`,
      twitter: `${e ? '⚡ ' : ''}${cleanTopic.slice(0, 170)} — Passez à l'action sans friction. ${e ? '👇 ' : ''}Commentez INFOS pour le détail.`,
      tiktok: `${e ? '🔥 ' : ''}POV : Vous optimisez enfin « ${cleanTopic} » et vos prospects viennent directement en DM. ${cta}`,
    },
  };
}

export async function generateSmartReply(context: {
  customerName: string;
  customerMessage: string;
  sentiment: string;
  channel: string;
}): Promise<string[]> {
  const systemPrompt = `Tu es un expert en Relation Client et Social Selling francophone.
Rédige 3 réponses courtes (2 à 3 phrases max chacune), chaleureuses, professionnelles et orientées conversion (invitation en DM, lien de paiement ou prise de RDV si intention d'achat).
Retourne STRICTEMENT un tableau JSON de 3 chaînes : ["Option 1", "Option 2", "Option 3"].`;

  const prompt = `Canal : ${context.channel}
Client : ${context.customerName}
Sentiment détecté : ${context.sentiment}
Message client : "${context.customerMessage}"

Génère 3 options distinctes :
1) Chaleureuse & Orientée DM
2) Directe & Professionnelle (Expert)
3) Orientée Clôture / Passage à l'action`;

  const rawText = await callGeminiAPI({
    systemInstruction: { parts: [{ text: systemPrompt }] },
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.55,
      maxOutputTokens: 450,
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
    `Bonjour ${context.customerName}, merci pour votre message ! Je viens de vous envoyer tous les détails et tarifs en message privé pour avancer rapidement.`,
    `Bonjour ${context.customerName}, ravi d'échanger avec vous. Voici les informations clés concernant votre demande — souhaitez-vous que je vous transmette le lien de réservation ou de paiement ?`,
    `Merci ${context.customerName} ! Notre équipe est disponible immédiatement pour finaliser cela avec vous. Préférez-vous un échange rapide sur WhatsApp ou un lien direct ?`,
  ];
}

export interface CopilotAttachment {
  name: string;
  type: string;
  size: number;
  dataUrl?: string; // base64 data URL for images or text preview
  textContent?: string;
}

export interface CopilotAction {
  type: 'create_post' | 'create_crm_prospect' | 'generate_paystack_link' | 'navigate' | 'open_composer';
  label: string;
  payload: Record<string, unknown>;
}

export async function runPulseAICopilot(params: {
  message: string;
  history: Array<{ role: 'user' | 'assistant'; content: string }>;
  currentPath: string;
  attachments: CopilotAttachment[];
  projectStats: {
    postsCount: number;
    accountsCount: number;
    crmCount: number;
    workspaceName: string;
  };
}): Promise<{ reply: string; action?: CopilotAction }> {
  const systemInstruction = `Tu es PulseAI, l'assistant exécutif vocal et textuel intégré à PulseSocial.
RÈGLES STRICTES (ECONOMIE DE TOKENS) :
1. Sois ULTRA-CONCIS, précis et pragmatique (2 à 5 phrases maximum, ou 3 puces courtes). Zéro formule de politesse longue, zéro remplissage.
2. Parle en français clair, naturel à l'oral (adapté à la synthèse vocale).
3. Tu connais toute la plateforme PulseSocial :
   - "/" (Tableau de bord & Routine 15 min)
   - "/publish" (Planificateur, Calendrier IA sectoriel, Compositeur IA)
   - "/inbox" (Radar à Prospects IA, Fenêtre 24h Meta/WhatsApp, Script LinkedIn 1-clic)
   - "/crm" (Pipeline Kanban 4 colonnes + liens Paystack/Wave/Orange Money & Cal.com)
   - "/analytics" (KPIs 7/30/90j & Export PDF)
   - "/reviews" (Avis Google/Facebook + réponses IA)
   - "/pulse-pages" (Link-in-Bio)
   - "/billing" (Abonnements Paystack FCFA)
   - "/settings" (OAuth 2.0 Composio 1-clic, Tokens Manuels, Cal.com, Test Supabase)
4. Si l'utilisateur te demande d'EXÉCUTER une tâche (créer/programmer un post, ajouter un prospect CRM, générer un lien Paystack, aller sur une page, ouvrir le compositeur), renseigne le champ "action" dans le JSON.
5. Si l'utilisateur envoie des fichiers (images, vidéos, documents), analyse-les directement et réponds de manière utile et concise.

FORMAT DE RÉPONSE STRICTEMENT JSON (sans markdown) :
{
  "reply": "Ta réponse concise en français",
  "action": null OU {
    "type": "create_post" | "create_crm_prospect" | "generate_paystack_link" | "navigate" | "open_composer",
    "label": "Libellé court de l'action exécutée",
    "payload": { ... }
  }
}

Exemples de payload :
- create_post: { "content": "...", "post_type": "post", "scheduled_for": "ISO_DATE" }
- create_crm_prospect: { "name": "...", "platform": "whatsapp", "handle": "+225...", "deal_value": 50000, "notes": "..." }
- generate_paystack_link: { "amount": 15000, "currency": "XOF", "customerName": "...", "provider": "wave" }
- navigate: { "path": "/crm" }
- open_composer: {}`;

  const contextSummary = `[CONTEXTE] Page actuelle: ${params.currentPath} | Workspace: ${params.projectStats.workspaceName} | Posts: ${params.projectStats.postsCount} | Comptes sociaux: ${params.projectStats.accountsCount} | Prospects CRM: ${params.projectStats.crmCount}`;

  const parts: Array<Record<string, unknown>> = [
    { text: `${contextSummary}\n\nHistorique récent:\n${params.history.slice(-6).map((h) => `${h.role === 'user' ? 'Utilisateur' : 'PulseAI'}: ${h.content}`).join('\n')}\n\nDemande actuelle: ${params.message}` },
  ];

  // Attach up to 10 multimodal files
  const safeAttachments = (params.attachments || []).slice(0, 10);
  for (const file of safeAttachments) {
    if (file.type.startsWith('image/') && file.dataUrl && file.dataUrl.includes('base64,')) {
      const base64Data = file.dataUrl.split('base64,')[1];
      parts.push({
        inlineData: {
          mimeType: file.type,
          data: base64Data,
        },
      });
    } else {
      parts.push({
        text: `[Fichier joint: ${file.name} (${file.type}, ${Math.round(file.size / 1024)} Ko)${file.textContent ? ` — Extrait: ${file.textContent.slice(0, 600)}` : ''}]`,
      });
    }
  }

  const rawText = await callGeminiAPI({
    systemInstruction: { parts: [{ text: systemInstruction }] },
    contents: [{ role: 'user', parts }],
    generationConfig: {
      temperature: 0.4,
      maxOutputTokens: 500,
      responseMimeType: 'application/json',
    },
  });

  if (rawText) {
    try {
      const cleaned = rawText.replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
      const parsed = JSON.parse(cleaned);
      if (parsed?.reply) {
        return {
          reply: parsed.reply,
          action: parsed.action || undefined,
        };
      }
    } catch {
      return { reply: rawText.slice(0, 500) };
    }
  }

  // Deterministic intelligent command router fallback (concise & functional even if Gemini key hits quota)
  const lower = params.message.toLowerCase();
  const filesNote =
    safeAttachments.length > 0
      ? ` (${safeAttachments.length} fichier${safeAttachments.length > 1 ? 's' : ''} reçu${safeAttachments.length > 1 ? 's' : ''} : ${safeAttachments.map((f) => f.name).join(', ')})`
      : '';

  if (lower.includes('crée un post') || lower.includes('publie') || lower.includes('programme un post') || lower.includes('rédige un post')) {
    const topic = params.message.replace(/crée un post|programme un post|publie|rédige un post|sur|pour/gi, '').trim() || 'Notre nouvelle offre PulseSocial';
    const content = `🎯 ${topic}\n\nPassez à la vitesse supérieure avec une stratégie claire et mesurable.\n👇 Commentez « INFOS » pour recevoir tous les détails en DM ! #SocialSelling #PulseSocial`;
    return {
      reply: `Post créé et programmé sur "${topic}"${filesNote}. Vous pouvez le consulter dans le Planificateur.`,
      action: {
        type: 'create_post',
        label: 'Post programmé dans Supabase',
        payload: {
          content,
          post_type: 'post',
          scheduled_for: new Date(Date.now() + 2 * 3600 * 1000).toISOString(),
        },
      },
    };
  }

  if (lower.includes('ajoute un prospect') || lower.includes('nouveau prospect') || lower.includes('crée un prospect') || lower.includes('dans le crm')) {
    const amountMatch = params.message.match(/(\d[\d\s]{2,})/);
    const amount = amountMatch ? Number(amountMatch[1].replace(/\s/g, '')) : 75000;
    return {
      reply: `Prospect ajouté dans le Pipeline CRM (${amount.toLocaleString('fr-FR')} FCFA)${filesNote}.`,
      action: {
        type: 'create_crm_prospect',
        label: 'Prospect ajouté au Kanban CRM',
        payload: {
          name: 'Nouveau Prospect PulseAI',
          platform: 'whatsapp',
          handle: '+225 07 00 00 00',
          deal_value: amount,
          notes: params.message,
        },
      },
    };
  }

  if (lower.includes('lien de paiement') || lower.includes('paystack') || lower.includes('encaisser') || lower.includes('facturer')) {
    const amountMatch = params.message.match(/(\d[\d\s]{2,})/);
    const amount = amountMatch ? Number(amountMatch[1].replace(/\s/g, '')) : 15000;
    return {
      reply: `Lien Paystack généré pour ${amount.toLocaleString('fr-FR')} FCFA (Wave / Orange Money / Carte). Cliquez sur le bouton ci-dessous pour l'ouvrir.`,
      action: {
        type: 'generate_paystack_link',
        label: `Ouvrir Paystack (${amount.toLocaleString('fr-FR')} FCFA)`,
        payload: { amount, currency: 'XOF', provider: 'wave', customerName: 'Client PulseSocial' },
      },
    };
  }

  if (lower.includes('ouvre') || lower.includes('va sur') || lower.includes('aller sur') || lower.includes('affiche')) {
    const routes: Array<{ keys: string[]; path: string; name: string }> = [
      { keys: ['crm', 'pipeline', 'kanban'], path: '/crm', name: 'Pipeline CRM' },
      { keys: ['inbox', 'boîte', 'radar', 'message'], path: '/inbox', name: 'Boîte de réception & Radar' },
      { keys: ['publish', 'planificateur', 'calendrier'], path: '/publish', name: 'Planificateur' },
      { keys: ['analytics', 'statistique', 'rapport'], path: '/analytics', name: 'Analytics' },
      { keys: ['settings', 'paramètre', 'oauth', 'token'], path: '/settings', name: 'Paramètres & Comptes' },
      { keys: ['billing', 'abonnement', 'facturation'], path: '/billing', name: 'Abonnement & Paystack' },
      { keys: ['avis', 'review'], path: '/reviews', name: 'Avis Clients' },
      { keys: ['bio', 'pulse page'], path: '/pulse-pages', name: 'Pulse Pages' },
    ];
    for (const r of routes) {
      if (r.keys.some((k) => lower.includes(k))) {
        return {
          reply: `Redirection vers ${r.name}.`,
          action: { type: 'navigate', label: `Ouverture de ${r.name}`, payload: { path: r.path } },
        };
      }
    }
  }

  return {
    reply: `Bien reçu${filesNote}. Sur ${params.currentPath}, vous avez ${params.projectStats.postsCount} post(s), ${params.projectStats.accountsCount} compte(s) connecté(s) et ${params.projectStats.crmCount} prospect(s) CRM. Demandez-moi par exemple : « Crée un post sur… », « Ajoute un prospect CRM de 50000 FCFA », « Génère un lien Paystack de 15000 FCFA » ou « Ouvre le CRM ».`,
  };
}
