'use client';

import React, { useState } from 'react';
import { INITIAL_CONVERSATIONS, INITIAL_MESSAGES, INITIAL_ACCOUNTS } from '@/lib/mockData';
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
} from 'lucide-react';

export default function InboxPage() {
  const [conversations, setConversations] = useState<InboxConversation[]>(INITIAL_CONVERSATIONS);
  const [activeConvId, setActiveConvId] = useState<string>(INITIAL_CONVERSATIONS[0].id);
  const [messages, setMessages] = useState<Record<string, InboxMessage[]>>(INITIAL_MESSAGES);
  const [replyText, setReplyText] = useState('');
  const [filterPlatform, setFilterPlatform] = useState<string>('all');

  // AI Smart Reply states
  const [aiReplies, setAiReplies] = useState<string[]>([]);
  const [aiLoading, setAiLoading] = useState(false);

  const activeConv = conversations.find((c) => c.id === activeConvId) || conversations[0];
  const activeAccount = INITIAL_ACCOUNTS.find((a) => a.id === activeConv.social_account_id);
  const activeMessages = messages[activeConv.id] || [];

  const handleSendMessage = () => {
    if (!replyText.trim()) return;

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
          sentiment: activeConv.sentiment,
          channel: activeAccount?.platform || 'Instagram',
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
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Inbox className="w-6 h-6 text-indigo-600" />
            Boîte de Réception Sociale Unifiée
          </h1>
          <p className="text-xs text-slate-500">
            Centralisez tous les messages directs, commentaires et mentions en temps réel.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 border border-emerald-200 text-center font-semibold">
            ⚡ Boîte synchronisée (Délai &lt;1 min)
          </span>
        </div>
      </div>

      {/* Split Pane: Conversation List & Chat Thread */}
      <div className="flex-1 vista-card overflow-hidden grid grid-cols-1 md:grid-cols-12">
        {/* LEFT COLUMN: Conversation Directory (4 cols) */}
        <div className="md:col-span-5 lg:col-span-4 border-r border-slate-200 dark:border-slate-800 flex flex-col h-full bg-white dark:bg-slate-900">
          {/* Search & Channel Filter */}
          <div className="p-3.5 border-b border-slate-100 dark:border-slate-800 space-y-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher une conversation..."
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
              />
            </div>
          </div>

          {/* List of Conversations */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
            {conversations.map((conv) => {
              const acc = INITIAL_ACCOUNTS.find((a) => a.id === conv.social_account_id);
              const isSelected = conv.id === activeConv.id;

              return (
                <div
                  key={conv.id}
                  onClick={() => {
                    setActiveConvId(conv.id);
                    setAiReplies([]);
                  }}
                  className={`p-3.5 cursor-pointer transition-colors flex items-start gap-3 ${
                    isSelected
                      ? 'bg-indigo-50/70 dark:bg-indigo-950/40 border-l-4 border-indigo-600'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <div className="relative shrink-0">
                    <img
                      src={conv.customer_avatar_url}
                      alt={conv.customer_name}
                      className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                    />
                    <span
                      className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white uppercase ${
                        acc?.platform === 'instagram'
                          ? 'badge-instagram'
                          : acc?.platform === 'linkedin'
                          ? 'badge-linkedin'
                          : 'badge-twitter'
                      }`}
                    >
                      {acc?.platform.slice(0, 2)}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                        {conv.customer_name}
                      </span>
                      <span className="text-[10px] text-slate-400" suppressHydrationWarning>
                        <FormattedDate date={conv.last_message_at} formatType="time" />
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-1 leading-snug">
                      {conv.last_message_preview}
                    </p>

                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                      <span
                        className={`text-[9px] font-semibold px-1.5 py-0.2 rounded-md ${
                          conv.sentiment === 'positive'
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {conv.sentiment === 'positive' ? '😊 Positif' : 'Neutre'}
                      </span>
                      {conv.tags.map((t, idx) => (
                        <span
                          key={idx}
                          className="text-[9px] font-medium px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500"
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
        <div className="md:col-span-7 lg:col-span-8 flex flex-col h-full bg-slate-50/40 dark:bg-slate-950/20">
          {/* Thread Header */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src={activeConv.customer_avatar_url}
                alt={activeConv.customer_name}
                className="w-9 h-9 rounded-full object-cover"
              />
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  {activeConv.customer_name}
                  <span className="text-xs text-slate-400 font-normal">
                    {activeConv.customer_username}
                  </span>
                </h3>
                <p className="text-[10px] text-slate-500">
                  Via {activeAccount?.account_name} ({activeAccount?.platform})
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleGenerateSmartReplies}
                disabled={aiLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-xs font-semibold shadow-md shadow-indigo-500/20 active:scale-95 transition-all"
              >
                {aiLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Gemini réfléchit...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
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
                        ? 'bg-indigo-600 text-white rounded-br-xs'
                        : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-bl-xs'
                    }`}
                  >
                    <p className="whitespace-pre-line">{msg.content}</p>
                  </div>
                  <span className="text-[9px] text-slate-400 mt-1 px-1" suppressHydrationWarning>
                    <FormattedDate date={msg.created_at} formatType="time" />
                  </span>
                </div>
              );
            })}
          </div>

          {/* AI Smart Replies Suggestions Bar */}
          {aiReplies.length > 0 && (
            <div className="px-6 py-2.5 bg-indigo-50 dark:bg-indigo-950/60 border-t border-indigo-100 dark:border-indigo-900/60 space-y-1.5 animate-in fade-in">
              <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300 flex items-center gap-1">
                <Wand2 className="w-3 h-3" /> Suggestions personnalisées Gemini (Cliquez pour insérer) :
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {aiReplies.map((reply, idx) => (
                  <button
                    key={idx}
                    onClick={() => setReplyText(reply)}
                    className="p-2 text-left rounded-xl bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 hover:border-indigo-500 text-[11px] text-slate-800 dark:text-slate-200 transition-all line-clamp-2 shadow-xs active:scale-98"
                  >
                    {reply}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Reply Box Composer */}
          <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
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
                className="flex-1 p-3 text-xs rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
              <button
                onClick={handleSendMessage}
                disabled={!replyText.trim()}
                className="p-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold transition-colors shadow-md shadow-indigo-600/30 active:scale-95"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

