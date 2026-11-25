'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { InboxConversation, InboxMessage, SocialPlatform, CRMProspect } from '@/lib/types';
import { Avatar } from '@/components/Avatar';
import { FormattedDate } from '@/components/FormattedDate';
import {
  Inbox,
  Send,
  Sparkles,
  Search,
  Filter,
  CheckCircle,
  Tag,
  Clock,
  ThumbsUp,
  MessageCircle,
  User,
  Wand2,
  Loader2,
  CheckCircle2,
  Flame,
  CreditCard,
  Calendar,
  ExternalLink,
  Copy,
  Briefcase,
  ShoppingBag,
  ArrowRight,
  Plus,
  ShieldCheck,
  Check,
  DollarSign,
  Phone,
  AlertCircle,
} from 'lucide-react';

const INITIAL_DEMO_CONVERSATIONS: InboxConversation[] = [
  {
    id: 'conv-1',
    workspace_id: 'default',
    social_account_id: 'wa-1',
    platform: 'whatsapp',
    customer_name: 'Amadou Diallo',
    customer_username: '+225 07 48 12 90 33',
    customer_avatar_url: '/logo.svg',
    status: 'open',
    sentiment: 'positive',
    tags: ['Achat Immédiat', 'Wave'],
    last_message_preview: 'Bonjour, je veux commander 3 packs de votre offre Pro avec livraison à Plateau. Comment je paie par Wave ?',
    last_message_at: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    unread_count: 1,
    lead_score: 94,
    intent: 'hot_lead',
    deal_value: 150000,
    phone: '+2250748129033',
    window_expires_at: new Date(Date.now() + 1000 * 60 * 60 * 18).toISOString(),
  },
  {
    id: 'conv-2',
    workspace_id: 'default',
    social_account_id: 'li-1',
    platform: 'linkedin',
    customer_name: 'Sarah Bamba',
    customer_username: 'sarah-bamba-cmo',
    customer_avatar_url: '/logo.svg',
    status: 'open',
    sentiment: 'positive',
    tags: ['B2B Décideur', 'Corporate'],
    last_message_preview: 'Bonjour, nous cherchons une agence pour piloter les comptes de notre groupe agroalimentaire. Avez-vous une plaquette tarifaire ?',
    last_message_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    unread_count: 1,
    lead_score: 88,
    intent: 'b2b_decision_maker',
    deal_value: 350000,
    phone: '+2250501223344',
  },
  {
    id: 'conv-3',
    workspace_id: 'default',
    social_account_id: 'ig-1',
    platform: 'instagram',
    customer_name: 'Kevin Koffi',
    customer_username: '@kevin.koffi_ci',
    customer_avatar_url: '/logo.svg',
    status: 'open',
    sentiment: 'neutral',
    tags: ['Commande B2C', 'Instagram'],
    last_message_preview: 'Prix du polo noir taille L svp ? Vous livrez à Yopougon dès demain ?',
    last_message_at: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
    unread_count: 0,
    lead_score: 79,
    intent: 'b2c_order',
    deal_value: 45000,
    phone: '+2250102030405',
    window_expires_at: new Date(Date.now() + 1000 * 60 * 60 * 11).toISOString(),
  },
  {
    id: 'conv-4',
    workspace_id: 'default',
    social_account_id: 'tk-1',
    platform: 'tiktok',
    customer_name: 'Aïssata Touré',
    customer_username: '@aissata_style',
    customer_avatar_url: '/logo.svg',
    status: 'open',
    sentiment: 'positive',
    tags: ['Tendance TikTok'],
    last_message_preview: 'J\'ai vu votre vidéo démo, la qualité a l\'air top ! C\'est disponible tout de suite ?',
    last_message_at: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
    unread_count: 0,
    lead_score: 65,
    intent: 'hot_lead',
    deal_value: 25000,
  },
];

const INITIAL_DEMO_MESSAGES: Record<string, InboxMessage[]> = {
  'conv-1': [
    {
      id: 'm-1-1',
      conversation_id: 'conv-1',
      direction: 'inbound',
      message_type: 'dm',
      content: 'Bonjour ! J\'ai vu votre publication sur le pack entreprise avec les outils d\'automatisation.',
      created_at: new Date(Date.now() - 1000 * 60 * 40).toISOString(),
    },
    {
      id: 'm-1-2',
      conversation_id: 'conv-1',
      direction: 'inbound',
      message_type: 'dm',
      content: 'Bonjour, je veux commander 3 packs de votre offre Pro avec livraison à Plateau. Comment je paie par Wave ?',
      created_at: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    },
  ],
  'conv-2': [
    {
      id: 'm-2-1',
      conversation_id: 'conv-2',
      direction: 'inbound',
      message_type: 'dm',
      content: 'Bonjour, nous cherchons une agence pour piloter les comptes de notre groupe agroalimentaire. Avez-vous une plaquette tarifaire ?',
      created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    },
  ],
  'conv-3': [
    {
      id: 'm-3-1',
      conversation_id: 'conv-3',
      direction: 'inbound',
      message_type: 'dm',
      content: 'Prix du polo noir taille L svp ? Vous livrez à Yopougon dès demain ?',
      created_at: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
    },
  ],
  'conv-4': [
    {
      id: 'm-4-1',
      conversation_id: 'conv-4',
      direction: 'inbound',
      message_type: 'dm',
      content: 'J\'ai vu votre vidéo démo, la qualité a l\'air top ! C\'est disponible tout de suite ?',
      created_at: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
    },
  ],
};

export default function InboxPage() {
  const [conversations, setConversations] = useState<InboxConversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Record<string, InboxMessage[]>>({});
  const [replyText, setReplyText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Filters: Channel & Intent
  const [channelFilter, setChannelFilter] = useState<string>('all');
  const [intentFilter, setIntentFilter] = useState<string>('all');

  // AI Smart Reply states
  const [aiReplies, setAiReplies] = useState<string[]>([]);
  const [aiLoading, setAiLoading] = useState(false);

  // Quick Action Modals / Toasts
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<number>(150000);
  const [paymentOperator, setPaymentOperator] = useState<string>('wave');
  const [paymentCurrency, setPaymentCurrency] = useState<string>('XOF');
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [copiedScript, setCopiedScript] = useState(false);

  // Initialize from localStorage or default
  useEffect(() => {
    try {
      const savedConvs = localStorage.getItem('pulsesocial_inbox_conversations');
      const savedMsgs = localStorage.getItem('pulsesocial_inbox_messages');

      if (savedConvs) {
        const parsed = JSON.parse(savedConvs);
        setConversations(parsed);
        if (parsed.length > 0) setActiveConvId(parsed[0].id);
      } else {
        setConversations(INITIAL_DEMO_CONVERSATIONS);
        setActiveConvId(INITIAL_DEMO_CONVERSATIONS[0].id);
        localStorage.setItem('pulsesocial_inbox_conversations', JSON.stringify(INITIAL_DEMO_CONVERSATIONS));
      }

      if (savedMsgs) {
        setMessages(JSON.parse(savedMsgs));
      } else {
        setMessages(INITIAL_DEMO_MESSAGES);
        localStorage.setItem('pulsesocial_inbox_messages', JSON.stringify(INITIAL_DEMO_MESSAGES));
      }
    } catch (e) {
      setConversations(INITIAL_DEMO_CONVERSATIONS);
      setMessages(INITIAL_DEMO_MESSAGES);
      setActiveConvId(INITIAL_DEMO_CONVERSATIONS[0].id);
    }
  }, []);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ type, message: msg });
    setTimeout(() => setToast(null), 4000);
  };

  const handleSendMessage = () => {
    if (!activeConv || !replyText.trim()) return;

    const newMsg: InboxMessage = {
      id: `msg-${Date.now()}`,
      conversation_id: activeConv.id,
      direction: 'outbound',
      message_type: 'dm',
      content: replyText.trim(),
      created_at: new Date().toISOString(),
    };

    const updated = {
      ...messages,
      [activeConv.id]: [...activeMessages, newMsg],
    };

    setMessages(updated);
    try {
      localStorage.setItem('pulsesocial_inbox_messages', JSON.stringify(updated));
    } catch (err) {
      console.warn(err);
    }

    setReplyText('');
    setAiReplies([]);
    showToast('✓ Message envoyé au prospect !');
  };

  // Simulate a new Hot Lead
  const handleSimulateLead = () => {
    const randomNames = ['Mamadou Koné', 'Fatou Cissé', 'Christian Kouassi', 'Esther Gnagne'];
    const randomName = randomNames[Math.floor(Math.random() * randomNames.length)];
    const newId = `conv-${Date.now()}`;

    const newLead: InboxConversation = {
      id: newId,
      workspace_id: 'default',
      social_account_id: 'wa-auto',
      platform: 'whatsapp',
      customer_name: randomName,
      customer_username: '+225 07 ' + Math.floor(10000000 + Math.random() * 90000000),
      customer_avatar_url: '/logo.svg',
      status: 'open',
      sentiment: 'positive',
      tags: ['Prospect Chaud 🔥', 'WhatsApp'],
      last_message_preview: 'Bonjour ! Je suis intéressé par votre offre. Pouvez-vous m\'envoyer votre lien Wave pour finaliser ?',
      last_message_at: new Date().toISOString(),
      unread_count: 1,
      lead_score: 96,
      intent: 'hot_lead',
      deal_value: 120000,
      phone: '+2250700000000',
      window_expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
    };

    const newMsg: InboxMessage = {
      id: `msg-sim-${Date.now()}`,
      conversation_id: newId,
      direction: 'inbound',
      message_type: 'dm',
      content: 'Bonjour ! Je suis intéressé par votre offre. Pouvez-vous m\'envoyer votre lien Wave pour finaliser ?',
      created_at: new Date().toISOString(),
    };

    const updatedConvs = [newLead, ...conversations];
    const updatedMsgs = { ...messages, [newId]: [newMsg] };

    setConversations(updatedConvs);
    setMessages(updatedMsgs);
    setActiveConvId(newId);

    try {
      localStorage.setItem('pulsesocial_inbox_conversations', JSON.stringify(updatedConvs));
      localStorage.setItem('pulsesocial_inbox_messages', JSON.stringify(updatedMsgs));
    } catch (e) {
      console.warn(e);
    }

    showToast(`🔥 Nouveau prospect chaud simulé : ${randomName} (Score: 96%)`);
  };

  // Dispatch to CRM (Real Supabase persistence via /api/crm/prospects, toast only after HTTP 200/201)
  const handleSendToCRM = async () => {
    if (!activeConv) return;

    try {
      const res = await fetch('/api/crm/prospects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: activeConv.customer_name,
          platform: (activeConv.platform || 'whatsapp') as SocialPlatform,
          handle: activeConv.customer_username,
          avatar_url: activeConv.customer_avatar_url,
          deal_value: activeConv.deal_value || 75000,
          currency: 'FCFA',
          status: 'contacted',
          lead_score: activeConv.lead_score || 85,
          notes: `Issu du Radar à Prospects PulseSocial. Dernier message : "${activeConv.last_message_preview}"`,
          phone: activeConv.phone,
          inbox_conversation_id: activeConv.id,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if ((res.status === 200 || res.status === 201) && data.success) {
        window.dispatchEvent(new Event('crm-updated'));
        showToast(`✓ ${activeConv.customer_name} enregistré dans le Pipeline CRM Supabase !`, 'success');
      } else {
        showToast(data.error || `Échec d'enregistrement dans le CRM (${res.status})`, 'error');
      }
    } catch (e) {
      console.error('Error saving to CRM', e);
      showToast('Erreur réseau lors de l’envoi vers le CRM Supabase.', 'error');
    }
  };

  // Insert Payment Link (Paystack Official Checkout URL)
  const handleInsertPaymentLink = () => {
    const formattedAmount = paymentAmount.toLocaleString();
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://vista-social-app.vercel.app';
    const ref = `PSTK-${activeConv?.id || Date.now()}`;
    const link = `${origin}/oauth-popup?provider=paystack&reference=${encodeURIComponent(ref)}&amount=${paymentAmount}&currency=${encodeURIComponent(paymentCurrency)}&plan=commande_social_selling&channel=${encodeURIComponent(paymentOperator)}&customer=${encodeURIComponent(activeConv?.customer_name || 'Client')}`;
    const insertText = `🛒 Voici votre lien sécurisé de paiement Paystack • ${paymentOperator.toUpperCase()} (${formattedAmount} ${paymentCurrency}) :\n${link}\n\nValidation automatique instantanée dès réception !`;

    setReplyText((prev) => (prev ? `${prev}\n\n${insertText}` : insertText));
    setPaymentModalOpen(false);
    showToast(`✓ Lien de paiement Paystack (${paymentOperator.toUpperCase()}) inséré !`);
  };

  // Insert Cal.com appointment link (configured in /settings)
  const handleInsertCalLink = () => {
    let calUrl = 'https://cal.com/pulsesocial/rdv-15min';
    try {
      const saved = localStorage.getItem('pulsesocial_manual_tokens');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.calComUrl && parsed.calComUrl.trim()) calUrl = parsed.calComUrl.trim();
      }
    } catch {
      // ignore
    }
    const calText = `📅 Je vous invite à réserver un créneau de 15 min directement dans mon agenda pour échanger :\n${calUrl}`;
    setReplyText((prev) => (prev ? `${prev}\n\n${calText}` : calText));
    showToast('✓ Lien de rendez-vous Cal.com inséré !');
  };

  // 1-Click Copy Human Script for LinkedIn
  const handleCopyLinkedInScript = () => {
    const script = replyText.trim() || `Bonjour ${activeConv?.customer_name},\n\nMerci pour votre intérêt pour nos solutions. Pour répondre précisément à vos besoins, voici notre grille tarifaire et nos études de cas récentes.\n\nSeriez-vous disponible pour un court appel de cadrage de 10 minutes cette semaine ?\n\nBien cordialement,\nL'équipe PulseSocial`;
    navigator.clipboard.writeText(script);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 3000);
    showToast('📋 Script commercial copié dans le presse-papier ! Collez-le directement dans LinkedIn.');
  };

  // Filter conversations
  const filteredConversations = conversations.filter((conv) => {
    // Channel filter
    if (channelFilter !== 'all' && conv.platform !== channelFilter) return false;

    // Intent filter
    if (intentFilter === 'hot') {
      if ((conv.lead_score || 0) < 75) return false;
    } else if (intentFilter === 'b2b') {
      if (conv.intent !== 'b2b_decision_maker' && conv.platform !== 'linkedin') return false;
    } else if (intentFilter === 'b2c') {
      if (conv.intent !== 'b2c_order' && conv.platform !== 'instagram' && conv.platform !== 'tiktok') return false;
    } else if (intentFilter === '24h') {
      if (!conv.window_expires_at) return false;
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        conv.customer_name.toLowerCase().includes(q) ||
        conv.customer_username.toLowerCase().includes(q) ||
        conv.last_message_preview.toLowerCase().includes(q)
      );
    }

    return true;
  });

  // Derive active conversation strictly from filtered conversations (SEC-13)
  const activeConv =
    filteredConversations.find((c) => c.id === activeConvId) ||
    (filteredConversations.length > 0 ? filteredConversations[0] : null);
  const activeMessages = activeConv ? messages[activeConv.id] || [] : [];

  return (
    <div className="space-y-4 max-w-7xl mx-auto h-[calc(100vh-8rem)] flex flex-col">
      {/* Toast Notification */}
      {toast && (
        <div
          role={toast.type === 'error' ? 'alert' : 'status'}
          className={`fixed top-5 right-5 z-50 p-4 rounded-2xl text-white font-bold text-xs shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-4 ${
            toast.type === 'error' ? 'bg-rose-600' : 'bg-emerald-600'
          }`}
        >
          {toast.type === 'error' ? (
            <AlertCircle className="w-4 h-4 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          )}
          <span>{toast.message}</span>
          {toast.type === 'success' && (
            <Link
              href="/crm"
              className="ml-2 underline text-[11px] bg-emerald-700/60 px-2 py-0.5 rounded hover:bg-emerald-700"
            >
              Voir CRM →
            </Link>
          )}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <Flame className="w-6 h-6 text-amber-500" />
            Radar à Prospects &amp; Assistant Prospecteur (Social Selling)
          </h1>
          <p className="text-xs text-slate-600 font-medium">
            Détectez les intentions d&apos;achat en temps réel, qualifiez avec l&apos;IA et convertissez via WhatsApp, LinkedIn et liens de paiement.
          </p>
        </div>

        {process.env.NODE_ENV === 'development' && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSimulateLead}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 hover:opacity-90 text-slate-950 font-black text-xs shadow-lg shadow-orange-500/20 active:scale-95 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Simuler un Prospect Chaud</span>
            </button>
          </div>
        )}
      </div>

      {/* Filter Bar: Channels + Intents */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-slate-900/90 border border-slate-800 rounded-2xl text-xs">
        {/* Channel Filters */}
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
          <span className="text-[11px] font-bold text-slate-400 px-2 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-violet-400" /> Canal :
          </span>
          {[
            { id: 'all', label: 'Tous' },
            { id: 'whatsapp', label: 'WhatsApp', color: 'text-emerald-400' },
            { id: 'instagram', label: 'Instagram', color: 'text-pink-400' },
            { id: 'linkedin', label: 'LinkedIn', color: 'text-sky-400' },
            { id: 'facebook', label: 'Facebook', color: 'text-blue-400' },
            { id: 'tiktok', label: 'TikTok', color: 'text-teal-400' },
          ].map((ch) => (
            <button
              key={ch.id}
              onClick={() => setChannelFilter(ch.id)}
              className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors cursor-pointer ${channelFilter === ch.id
                ? 'bg-violet-600 text-white'
                : 'bg-slate-800/80 text-slate-400 hover:text-white'
                }`}
            >
              {ch.label}
            </button>
          ))}
        </div>

        {/* Intent Filters */}
        <div className="flex items-center gap-1">
          <span className="text-[11px] font-bold text-slate-400 px-2 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Filtres d&apos;Intention :
          </span>
          {[
            { id: 'all', label: 'Tous' },
            { id: 'hot', label: '🔥 Chauds ≥ 75%' },
            { id: 'b2b', label: '💼 B2B' },
            { id: 'b2c', label: '🛍️ B2C' },
            { id: '24h', label: '⏱️ Fenêtre 24h' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setIntentFilter(f.id)}
              className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors cursor-pointer ${intentFilter === f.id
                ? 'bg-amber-500 text-slate-950 font-black'
                : 'bg-slate-800/80 text-slate-400 hover:text-white'
                }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Split Layout: Left Radar Directory, Right Prospector Assistant */}
      <div className="flex-1 pulse-card overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-0">
        {/* LEFT PANE: Leads Directory (4 cols) */}
        <div className="md:col-span-5 lg:col-span-4 border-r border-slate-800 flex flex-col h-full bg-slate-900/60">
          <div className="p-3 border-b border-slate-800 space-y-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher par nom, canal ou mot-clé..."
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-slate-800/80 border border-slate-700 text-white focus:outline-none focus:border-violet-500"
              />
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-400 px-1">
              <span>{filteredConversations.length} prospects détectés</span>
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Radar IA Actif
              </span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60">
            {filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 space-y-2">
                <Inbox className="w-8 h-8 text-slate-600 mx-auto" />
                <p>Aucun prospect ne correspond à ces critères.</p>
                {process.env.NODE_ENV === 'development' && (
                  <button
                    type="button"
                    onClick={handleSimulateLead}
                    className="px-3 py-1.5 rounded-lg bg-violet-600 text-white text-[11px] font-bold"
                  >
                    Simuler un Prospect
                  </button>
                )}
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const isSelected = activeConv && conv.id === activeConv.id;
                const score = conv.lead_score || 50;

                return (
                  <div
                    key={conv.id}
                    onClick={() => {
                      setActiveConvId(conv.id);
                      setAiReplies([]);
                    }}
                    className={`p-3.5 cursor-pointer transition-colors flex items-start gap-3 ${isSelected
                      ? 'bg-violet-950/50 border-l-4 border-violet-500'
                      : 'hover:bg-slate-800/40'
                      }`}
                  >
                    <div className="relative shrink-0">
                      <Avatar
                        src={conv.customer_avatar_url}
                        name={conv.customer_name}
                        size={40}
                        className="ring-2 ring-slate-800"
                      />
                      <span className="absolute -bottom-1 -right-1 text-[10px] px-1 py-0.2 rounded-full bg-slate-900 border border-slate-700">
                        {conv.platform === 'whatsapp' ? '💬' : conv.platform === 'linkedin' ? '💼' : conv.platform === 'instagram' ? '📸' : '📱'}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="font-bold text-xs text-white truncate">
                          {conv.customer_name}
                        </span>
                        {/* Score Badge */}
                        <span
                          className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${score >= 80
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : score >= 65
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-slate-800 text-slate-400'
                            }`}
                        >
                          {score >= 80 ? `🔥 ${score}%` : `⚡ ${score}%`}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-300 line-clamp-2 leading-snug">
                        {conv.last_message_preview}
                      </p>

                      <div className="flex items-center gap-1.5 mt-2 flex-wrap text-[10px]">
                        {conv.window_expires_at && (
                          <span className="inline-flex items-center gap-1 font-bold px-1.5 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
                            <Clock className="w-2.5 h-2.5" /> 24h Ouverte
                          </span>
                        )}
                        {conv.deal_value && (
                          <span className="font-bold text-violet-300 bg-violet-950/50 px-1.5 py-0.5 rounded border border-violet-800/40">
                            {conv.deal_value.toLocaleString()} FCFA
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT PANE: Active Chat & Assistant Prospecteur (8 cols) */}
        {filteredConversations.length > 0 && activeConv && filteredConversations.some((c) => c.id === activeConv.id) ? (
          <div className="md:col-span-7 lg:col-span-8 flex flex-col h-full bg-slate-950/40">
            {/* Prospector Header with Deal Value & CRM Dispatch */}
            <div className="p-4 border-b border-slate-800 bg-slate-900/80 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Avatar
                  src={activeConv.customer_avatar_url}
                  name={activeConv.customer_name}
                  size={40}
                  className="ring-2 ring-violet-500/30"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-white">{activeConv.customer_name}</h3>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-800 text-violet-300 border border-slate-700">
                      {activeConv.platform || 'whatsapp'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                    <span>{activeConv.customer_username}</span>
                    <span>•</span>
                    <span className="text-amber-400 font-bold">
                      Intention : {activeConv.lead_score || 85}% ({activeConv.intent === 'hot_lead' ? 'Achat Chaud' : activeConv.intent === 'b2b_decision_maker' ? 'B2B Décideur' : 'Commande Directe'})
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons: Dispatch to CRM & Cal.com */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSendToCRM}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold shadow-md shadow-violet-600/30 transition-all cursor-pointer"
                >
                  <Briefcase className="w-3.5 h-3.5" />
                  <span>➡️ Envoyer au Pipeline CRM</span>
                </button>
              </div>
            </div>

            {/* Compliance Banner */}
            <div className="px-4 py-2 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-[11px]">
              {activeConv.platform === 'linkedin' ? (
                <div className="flex items-center justify-between w-full">
                  <span className="text-sky-300 flex items-center gap-1.5 font-medium">
                    <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
                    <strong>Mode LinkedIn 1-Clic Humain :</strong> Préparez le script ici et copiez-le d&apos;un clic dans LinkedIn pour respecter 100% des conditions de service.
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyLinkedInScript}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-600/20 hover:bg-sky-600/40 text-sky-300 font-bold border border-sky-500/30 cursor-pointer"
                  >
                    {copiedScript ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedScript ? 'Copié !' : '📋 Copier le Script'}</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-emerald-300">
                  <Clock className="w-3.5 h-3.5 text-emerald-400" />
                  <span>
                    <strong>Fenêtre Client 24h Meta / WhatsApp Active :</strong> Réponses directes et illimitées autorisées sans coût de modèle.
                  </span>
                </div>
              )}
            </div>

            {/* Messages Thread */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3">
              {activeMessages.map((msg) => {
                const isOutbound = msg.direction === 'outbound';
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isOutbound ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[80%] p-3.5 rounded-2xl text-xs leading-relaxed shadow-sm ${isOutbound
                        ? 'bg-violet-600 text-white rounded-br-xs'
                        : 'bg-slate-800 text-white border border-slate-700 rounded-bl-xs'
                        }`}
                    >
                      <p className="whitespace-pre-line">{msg.content}</p>
                    </div>
                    <FormattedDate
                      date={msg.created_at}
                      formatType="time"
                      className="text-[10px] text-slate-200 font-bold mt-1 px-1 block tracking-tight"
                    />
                  </div>
                );
              })}
            </div>

            {/* Social Selling Quick Actions Toolset */}
            <div className="p-3 bg-slate-900/90 border-t border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <Wand2 className="w-3.5 h-3.5 text-amber-400" />
                  Assistant Commercial IA &amp; Liens Rapides :
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentModalOpen(true)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 font-bold border border-emerald-500/30 cursor-pointer"
                  >
                    <CreditCard className="w-3 h-3" />
                    <span>Lien Paiement Mobile Money</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleInsertCalLink}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 font-bold border border-violet-500/30 cursor-pointer"
                  >
                    <Calendar className="w-3 h-3" />
                    <span>RDV Cal.com</span>
                  </button>
                </div>
              </div>

              {/* 3 Instant Social Selling Response Suggestions */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {[
                  {
                    title: '1. Proposition & Tarif',
                    text: `Bonjour ${activeConv.customer_name} ! Notre offre complète s'élève à ${(activeConv.deal_value || 75000).toLocaleString()} FCFA avec accompagnement garanti et livraison immédiate. Souhaitez-vous que je vous transmette le lien de paiement direct ?`,
                  },
                  {
                    title: '2. Objection & Rassurance',
                    text: `Bonjour ${activeConv.customer_name}, nous comprenons parfaitement votre exigence. Plus de 1 200 clients nous font confiance chaque mois et nous garantissons une assistance réactive 7j/7. Nous pouvons convenir d'un court créneau d'évaluation si vous préférez !`,
                  },
                  {
                    title: '3. Clôture & Expédition',
                    text: `Parfait ! Votre commande est prête à être validée. Vous pouvez procéder au règlement sécurisé via notre lien Wave / Orange Money direct pour un traitement prioritaire dès aujourd'hui.`,
                  },
                ].map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setReplyText(item.text)}
                    className="p-2 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-violet-500 text-left transition-all cursor-pointer group"
                  >
                    <span className="font-bold text-[10px] text-amber-300 block mb-0.5 group-hover:text-amber-200">
                      {item.title}
                    </span>
                    <span className="text-[10px] text-slate-300 line-clamp-2 leading-tight">
                      {item.text}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Reply Composer with safe right padding for Assistant Pulse */}
            <div className="p-3 bg-slate-900 border-t border-slate-800 pr-24 sm:pr-32">
              <div className="flex gap-2 items-end">
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  rows={2}
                  placeholder={`Répondre à ${activeConv.customer_name}... (Entrée pour envoyer)`}
                  className="flex-1 p-2.5 text-xs rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-violet-500"
                />

                {activeConv.platform === 'linkedin' ? (
                  <button
                    type="button"
                    onClick={handleCopyLinkedInScript}
                    className="p-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-md transition-colors cursor-pointer flex items-center gap-1.5"
                    title="Copier le message pour le coller dans LinkedIn"
                  >
                    <Copy className="w-4 h-4" />
                    <span className="hidden sm:inline">Copier</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSendMessage}
                    disabled={!replyText.trim()}
                    className="p-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-semibold transition-colors shadow-md shadow-violet-600/30 active:scale-95 cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="md:col-span-7 lg:col-span-8 flex flex-col items-center justify-center h-full p-8 text-center text-slate-500 bg-slate-950/20 border border-slate-800/40 rounded-2xl">
            <Inbox className="w-12 h-12 text-slate-600 mb-3" />
            <h4 className="font-bold text-slate-300 text-sm">Aucun prospect correspondant</h4>
            <p className="text-xs text-slate-500 max-w-sm mt-1">
              Modifiez vos filtres ou réinitialisez la recherche pour afficher d&apos;autres conversations.
            </p>
          </div>
        )}
      </div>

      {/* Payment Link Generator Modal */}
      {paymentModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-emerald-500/40 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-400" />
                Générateur de Lien de Paiement Sécurisé
              </h3>
              <button
                type="button"
                onClick={() => setPaymentModalOpen(false)}
                className="text-slate-400 hover:text-white text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-bold block mb-1">Opérateur de Paiement :</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'wave', label: 'Wave Money' },
                    { id: 'orange', label: 'Orange Money' },
                    { id: 'cinetpay', label: 'CinetPay' },
                    { id: 'paystack', label: 'Paystack' },
                    { id: 'stripe', label: 'Stripe' },
                  ].map((op) => (
                    <button
                      key={op.id}
                      type="button"
                      onClick={() => setPaymentOperator(op.id)}
                      className={`p-2 rounded-xl text-center font-bold text-[11px] border transition-colors cursor-pointer ${paymentOperator === op.id
                        ? 'bg-emerald-600 text-white border-emerald-500'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
                        }`}
                    >
                      {op.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">Montant à encaisser :</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(Number(e.target.value))}
                    className="flex-1 p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white font-bold text-sm focus:outline-none focus:border-emerald-500"
                  />
                  <select
                    value={paymentCurrency}
                    onChange={(e) => setPaymentCurrency(e.target.value)}
                    className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white font-bold text-xs"
                  >
                    <option value="XOF">FCFA</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="USD">USD ($)</option>
                  </select>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/40 text-[11px] text-emerald-300">
                Lien généré pour <strong>{activeConv?.customer_name}</strong> avec notification push USSD instantanée dès règlement.
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setPaymentModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleInsertPaymentLink}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md cursor-pointer"
              >
                Insérer le Lien de Paiement
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
