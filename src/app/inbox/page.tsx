'use client';

import React, { useState, useEffect } from 'react';
import { InboxConversation, InboxMessage } from '@/lib/types';
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
} from 'lucide-react';

export default function InboxPage() {
  const [conversations, setConversations] = useState<InboxConversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Record<string, InboxMessage[]>>({});
  const [replyText, setReplyText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // AI Smart Reply states
  const [aiReplies, setAiReplies] = useState<string[]>([]);
  const [aiLoading, setAiLoading] = useState(false);

  const activeConv = conversations.find((c) => c.id === activeConvId) || conversations[0] || null;
  const activeMessages = activeConv ? messages[activeConv.id] || [] : [];

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

    setMessages({
      ...messages,
      [activeConv.id]: [...activeMessages, newMsg],
    });
    setReplyText('');
    setAiReplies([]);
  };

  const handleGenerateSmartReplies = async () => {
    if (!activeConv) return;
    const lastInbound = [...activeMessages].reverse().find((m) => m.direction === 'inbound');
    if (!lastInbound) return;

    setAiLoading(true);
    try {
      const res = await fetch('/api/ai/smart-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: activeConv.customer_name,
          customerMessage: lastInbound.content,
          sentiment: activeConv.sentiment || 'neutral',
          channel: 'Instagram',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.replies) {
          setAiReplies(data.replies);
        }
      }
    } catch (err) {
      console.error('Failed to generate smart replies', err);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto h-[calc(100vh-8rem)] flex flex-col">
      {/* Inbox Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Inbox className="w-6 h-6 text-violet-400" />
            Boîte de Réception Sociale Unifiée
          </h1>
          <p className="text-xs text-slate-400">
            Centralisez tous les messages directs, commentaires et mentions en temps réel.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-center font-semibold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Synchronisation Webhook Active
          </span>
        </div>
      </div>

      {/* Split Pane or Empty State */}
      {conversations.length === 0 ? (
        <div className="flex-1 pulse-card p-12 flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-violet-500/10 border border-violet-500/20 text-violet-400 flex items-center justify-center">
            <Inbox className="w-8 h-8" />
          </div>
          <div className="space-y-2 max-w-md">
            <h3 className="text-lg font-bold text-white">Boîte de réception à jour !</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Vous n&apos;avez aucun message, DM ou commentaire en attente. Dès qu&apos;un client ou prospect interagit sur vos comptes connectés (Instagram, Facebook, X, TikTok, LinkedIn), la conversation apparaîtra ici avec des suggestions de réponses instantanées générées par Gemini.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold bg-emerald-500/10 px-4 py-2 rounded-xl border border-emerald-500/20">
            <CheckCircle2 className="w-4 h-4" />
            <span>0 conversation non lue • Écoute en continu</span>
          </div>
        </div>
      ) : (
        <div className="flex-1 pulse-card overflow-hidden grid grid-cols-1 md:grid-cols-12">
          {/* LEFT COLUMN: Conversation Directory (4 cols) */}
          <div className="md:col-span-5 lg:col-span-4 border-r border-slate-800 flex flex-col h-full bg-slate-900/60">
            <div className="p-3.5 border-b border-slate-800 space-y-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher une conversation..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-slate-800/80 border border-slate-700 text-white focus:outline-none focus:border-violet-500"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60">
              {conversations.map((conv) => {
                const isSelected = activeConv && conv.id === activeConv.id;

                return (
                  <div
                    key={conv.id}
                    onClick={() => {
                      setActiveConvId(conv.id);
                      setAiReplies([]);
                    }}
                    className={`p-3.5 cursor-pointer transition-colors flex items-start gap-3 ${
                      isSelected
                        ? 'bg-violet-950/40 border-l-4 border-violet-500'
                        : 'hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="relative shrink-0">
                      <img
                        src={conv.customer_avatar_url}
                        alt={conv.customer_name}
                        className="w-10 h-10 rounded-full object-cover border border-slate-700"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="font-bold text-xs text-white truncate">
                          {conv.customer_name}
                        </span>
                        <FormattedDate date={conv.last_message_at} formatType="time" className="text-[10px] text-slate-400" />
                      </div>

                      <p className="text-[11px] text-slate-300 line-clamp-1 leading-snug">
                        {conv.last_message_preview}
                      </p>

                      <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                        <span
                          className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-md ${
                            conv.sentiment === 'positive'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {conv.sentiment === 'positive' ? '😊 Positif' : 'Neutre'}
                        </span>
                        {conv.tags && conv.tags.map((t, idx) => (
                          <span
                            key={idx}
                            className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-slate-800 text-slate-400"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* RIGHT COLUMN: Active Chat Thread (8 cols) */}
          {activeConv ? (
            <div className="md:col-span-7 lg:col-span-8 flex flex-col h-full bg-slate-950/40">
              {/* Thread Header */}
              <div className="p-4 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={activeConv.customer_avatar_url}
                    alt={activeConv.customer_name}
                    className="w-9 h-9 rounded-full object-cover"
                  />
                  <div>
                    <h3 className="font-bold text-sm text-white flex items-center gap-2">
                      {activeConv.customer_name}
                      <span className="text-xs text-slate-400 font-normal">
                        {activeConv.customer_username}
                      </span>
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleGenerateSmartReplies}
                    disabled={aiLoading}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold shadow-md shadow-violet-600/20 active:scale-95 transition-all"
                  >
                    {aiLoading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Gemini réfléchit...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
                        <span>Réponses Intelligentes IA</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Thread Messages Stream */}
              <div className="flex-1 p-6 overflow-y-auto space-y-4">
                {activeMessages.map((msg) => {
                  const isOutbound = msg.direction === 'outbound';

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isOutbound ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[75%] p-3.5 rounded-2xl text-xs leading-relaxed shadow-sm ${
                          isOutbound
                            ? 'bg-violet-600 text-white rounded-br-xs'
                            : 'bg-slate-800 text-white border border-slate-700 rounded-bl-xs'
                        }`}
                      >
                        <p className="whitespace-pre-line">{msg.content}</p>
                      </div>
                      <FormattedDate date={msg.created_at} formatType="time" className="text-[9px] text-slate-400 mt-1 px-1 block" />
                    </div>
                  );
                })}
              </div>

              {/* AI Smart Replies Suggestions Bar */}
              {aiReplies.length > 0 && (
                <div className="px-6 py-2.5 bg-violet-950/40 border-t border-violet-900/60 space-y-1.5 animate-in fade-in">
                  <span className="text-[10px] font-bold text-violet-300 flex items-center gap-1">
                    <Wand2 className="w-3 h-3" /> Suggestions personnalisées Gemini (Cliquez pour insérer) :
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {aiReplies.map((reply, idx) => (
                      <button
                        key={idx}
                        onClick={() => setReplyText(reply)}
                        className="p-2 text-left rounded-xl bg-slate-900 border border-violet-800 hover:border-violet-500 text-[11px] text-slate-200 transition-all line-clamp-2 shadow-xs active:scale-98"
                      >
                        {reply}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Reply Box Composer */}
              <div className="p-4 bg-slate-900/80 border-t border-slate-800">
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
                    className="flex-1 p-3 text-xs rounded-2xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!replyText.trim()}
                    className="p-3 rounded-2xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-semibold transition-colors shadow-md shadow-violet-600/30 active:scale-95"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
