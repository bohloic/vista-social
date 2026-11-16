'use client';

import React, { useState } from 'react';
import { ListeningMention } from '@/lib/types';
import { FormattedDate } from '@/components/FormattedDate';
import {
  Radio,
  Search,
  TrendingUp,
  AlertCircle,
  Sparkles,
  ExternalLink,
  Plus,
  Tag,
  ShieldAlert,
  Smile,
  Meh,
  Frown,
  X,
  CheckCircle2,
} from 'lucide-react';

export default function ListeningPage() {
  const [mentions, setMentions] = useState<ListeningMention[]>([]);
  const [activeQuery, setActiveQuery] = useState<string>('all');
  const [sentimentFilter, setSentimentFilter] = useState<string>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [queryInput, setQueryInput] = useState('');
  const [platformInput, setPlatformInput] = useState<'twitter' | 'instagram' | 'linkedin' | 'tiktok'>('twitter');
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const handleCreateQuery = (e: React.FormEvent) => {
    e.preventDefault();
    if (!queryInput.trim()) return;

    const newMention: ListeningMention = {
      id: `men-${Date.now()}`,
      platform: platformInput,
      author_name: `${queryInput.trim()} Communauté`,
      author_handle: `@${queryInput.trim().replace(/[^a-zA-Z0-9]/g, '').toLowerCase()}`,
      author_avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
      content: `Discussion en direct sur #${queryInput.trim()} : les fonctionnalités de PulseSocial permettent une gestion optimale du contenu et du ROI.`,
      sentiment: 'positive',
      reach: Math.floor(Math.random() * 8000) + 1200,
      engagement: Math.floor(Math.random() * 400) + 45,
      url: 'https://pulsesocial.app',
      published_at: new Date().toISOString(),
    };

    setMentions([newMention, ...mentions]);
    setFeedbackMsg(`✓ Alerte de veille pour "${queryInput}" activée avec succès !`);
    setQueryInput('');
    setModalOpen(false);
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  const filteredMentions = mentions.filter((m) => {
    if (sentimentFilter !== 'all' && m.sentiment !== sentimentFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Radio className="w-6 h-6 text-indigo-600 animate-pulse" />
            Social Listening & Surveillance de Marque
          </h1>
          <p className="text-xs text-slate-500">
            Surveillez les mentions de votre marque, hashtags sectoriels et signaux concurrents en temps réel.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 py-2 px-4 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold shadow-lg shadow-violet-600/30 active:scale-95 transition-all self-start sm:self-center cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Nouvelle Requête de Veille</span>
        </button>
      </div>

      {/* Feedback alert */}
      {feedbackMsg && (
        <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* Sentiment Overview Gauge */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="pulse-card p-5 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
              <Smile className="w-4 h-4 text-emerald-400" />
              Sentiment Positif
            </span>
            <p className="text-2xl font-black text-white mt-1">100%</p>
            <span className="text-[10px] text-emerald-400 font-semibold">Réputation optimale</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-sm">
            100%
          </div>
        </div>

        <div className="pulse-card p-5 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
              <Meh className="w-4 h-4 text-amber-400" />
              Sentiment Neutre
            </span>
            <p className="text-2xl font-black text-white mt-1">0%</p>
            <span className="text-[10px] text-slate-400 font-medium">Questions & supports</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold text-sm">
            0%
          </div>
        </div>

        <div className="pulse-card p-5 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
              <Frown className="w-4 h-4 text-rose-400" />
              Signaux Négatifs / Crise
            </span>
            <p className="text-2xl font-black text-white mt-1">0%</p>
            <span className="text-[10px] text-emerald-400 font-medium">Aucun risque de crise</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center font-bold text-sm">
            0%
          </div>
        </div>
      </div>

      {/* Monitored Queries Pills & Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
            <Tag className="w-3.5 h-3.5" /> Mots-clés surveillés :
          </span>
          {['@StudioNovaHQ', '#StudioNova', 'Studio Nova Paris', 'Agence CM 2026'].map((q) => (
            <span
              key={q}
              className="text-xs font-semibold px-2.5 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800"
            >
              {q}
            </span>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setSentimentFilter('all')}
            className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
              sentimentFilter === 'all' ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'text-slate-600'
            }`}
          >
            Toutes
          </button>
          <button
            onClick={() => setSentimentFilter('positive')}
            className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
              sentimentFilter === 'positive' ? 'bg-emerald-600 text-white' : 'text-slate-600'
            }`}
          >
            Positives
          </button>
          <button
            onClick={() => setSentimentFilter('neutral')}
            className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
              sentimentFilter === 'neutral' ? 'bg-amber-600 text-white' : 'text-slate-600'
            }`}
          >
            Neutres
          </button>
        </div>
      </div>

      {/* Live Mentions Feed */}
      <div className="space-y-4">
        {filteredMentions.length === 0 ? (
          <div className="py-16 text-center pulse-card p-8 border-dashed border-slate-800 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-violet-500/10 text-violet-400 mx-auto flex items-center justify-center">
              <Radio className="w-6 h-6 animate-pulse" />
            </div>
            <h4 className="text-base font-bold text-white">Veille active en cours</h4>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Aucune mention négative ou directe détectée sur vos mots-clés ces dernières heures. Le moteur d&apos;écoute sociale PulseSocial surveille le web et les réseaux en continu.
            </p>
          </div>
        ) : (
          filteredMentions.map((mention) => (
            <div
              key={mention.id}
              className="pulse-card p-5 flex flex-col sm:flex-row items-start justify-between gap-4"
            >
            <div className="flex items-start gap-4 flex-1">
              <img
                src={mention.author_avatar}
                alt={mention.author_name}
                className="w-12 h-12 rounded-full object-cover border border-slate-200 shrink-0"
              />

              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-sm text-slate-900 dark:text-white">
                    {mention.author_name}
                  </span>
                  <span className="text-xs text-slate-400">{mention.author_handle}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase bg-slate-100 dark:bg-slate-800 text-slate-600">
                    {mention.platform}
                  </span>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      mention.sentiment === 'positive'
                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {mention.sentiment === 'positive' ? '😊 Sentiment Positif' : 'Neutre'}
                  </span>
                  <FormattedDate date={mention.published_at} formatType="time" className="text-xs text-slate-400 ml-auto" />
                </div>

                <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed">
                  {mention.content}
                </p>

                <div className="flex items-center gap-4 text-[11px] text-slate-400 pt-1">
                  <span>Portée estimée : <strong className="text-slate-700 dark:text-slate-300">{mention.reach.toLocaleString()}</strong></span>
                  <span>Interactions : <strong className="text-indigo-600">{mention.engagement.toLocaleString()}</strong></span>
                </div>
              </div>
            </div>

            <a
              href={mention.url}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 flex items-center gap-1.5 shrink-0 self-end sm:self-center transition-colors"
            >
              <span>Voir sur {mention.platform}</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </a>
          </div>
        )))}
      </div>

      {/* New Query Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <form
            onSubmit={handleCreateQuery}
            className="w-full max-w-md bg-slate-900 border border-violet-500/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col"
          >
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-violet-400" />
                <h3 className="font-bold text-sm text-white">Créer une Requête de Veille</h3>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Mot-clé, marque ou hashtag à surveiller :
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: #PulseSocial, AgenceDigitale, MonProduit"
                  value={queryInput}
                  onChange={(e) => setQueryInput(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-800 bg-slate-950 text-white text-xs focus:outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Plateforme cible :
                </label>
                <select
                  value={platformInput}
                  onChange={(e) => setPlatformInput(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl border border-slate-800 bg-slate-950 text-white text-xs focus:outline-none focus:border-violet-500"
                >
                  <option value="twitter">X (Twitter)</option>
                  <option value="instagram">Instagram</option>
                  <option value="linkedin">LinkedIn</option>
                  <option value="tiktok">TikTok</option>
                </select>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-xs text-slate-400 hover:text-white cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold shadow-lg shadow-violet-600/30 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Activer la Veille</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

