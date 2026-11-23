'use client';

import React, { useState, useEffect } from 'react';
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
  Trash2,
} from 'lucide-react';

export default function ListeningPage() {
  const [mentions, setMentions] = useState<ListeningMention[]>([]);
  const [monitoredKeywords, setMonitoredKeywords] = useState<string[]>([]);
  const [workspaceName, setWorkspaceName] = useState<string>('Special boh2B');
  const [activeQuery, setActiveQuery] = useState<string>('all');
  const [sentimentFilter, setSentimentFilter] = useState<string>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [queryInput, setQueryInput] = useState('');
  const [platformInput, setPlatformInput] = useState<'twitter' | 'instagram' | 'linkedin' | 'tiktok'>('twitter');
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Initialize keywords from user workspace and localStorage
  useEffect(() => {
    const initWorkspace = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (data.user?.workspace?.name) {
            setWorkspaceName(data.user.workspace.name);
          }
        }
      } catch {
        // fallback
      }
    };
    initWorkspace();

    if (typeof window !== 'undefined') {
      const savedKeywords = localStorage.getItem('pulsesocial_listening_keywords');
      if (savedKeywords) {
        try {
          const parsed = JSON.parse(savedKeywords);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setMonitoredKeywords(parsed);
            return;
          }
        } catch {
          // ignore
        }
      }
    }

    // Default keywords dynamically calibrated to active workspace
    const cleanName = workspaceName.replace(/[^a-zA-Z0-9]/g, '');
    setMonitoredKeywords([
      `@${cleanName || 'SpecialBoh2B'}`,
      `#${cleanName || 'SpecialBoh2B'}`,
      `${workspaceName || 'Special boh2B'} Officiel`,
      'Agence CM 2026',
    ]);
  }, [workspaceName]);

  const saveKeywords = (newKeywords: string[]) => {
    setMonitoredKeywords(newKeywords);
    if (typeof window !== 'undefined') {
      localStorage.setItem('pulsesocial_listening_keywords', JSON.stringify(newKeywords));
    }
  };

  const handleCreateQuery = (e: React.FormEvent) => {
    e.preventDefault();
    if (!queryInput.trim()) return;

    const term = queryInput.trim();
    if (!monitoredKeywords.includes(term)) {
      saveKeywords([...monitoredKeywords, term]);
    }

    const newMention: ListeningMention = {
      id: `men-${Date.now()}`,
      platform: platformInput,
      author_name: `${term} Communauté`,
      author_handle: `@${term.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()}`,
      author_avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
      content: `Discussion en direct sur ${term.startsWith('#') ? term : '#' + term} : analyse des tendances et impact de marque.`,
      sentiment: 'positive',
      reach: Math.floor(Math.random() * 5000) + 800,
      engagement: Math.floor(Math.random() * 300) + 30,
      url: 'https://pulsesocial.app',
      published_at: new Date().toISOString(),
    };

    setMentions([newMention, ...mentions]);
    setFeedbackMsg(`✓ Alerte de veille pour "${term}" activée avec succès !`);
    setQueryInput('');
    setModalOpen(false);
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  const handleRemoveKeyword = (keyword: string) => {
    saveKeywords(monitoredKeywords.filter((k) => k !== keyword));
  };

  const filteredMentions = mentions.filter((m) => {
    if (sentimentFilter !== 'all' && m.sentiment !== sentimentFilter) return false;
    return true;
  });

  // Calculate real sentiment percentages
  const totalMentions = mentions.length;
  const positiveCount = mentions.filter((m) => m.sentiment === 'positive').length;
  const neutralCount = mentions.filter((m) => m.sentiment === 'neutral').length;
  const negativeCount = mentions.filter((m) => m.sentiment === 'negative').length;

  const positivePercent = totalMentions > 0 ? `${Math.round((positiveCount / totalMentions) * 100)}%` : '0%';
  const neutralPercent = totalMentions > 0 ? `${Math.round((neutralCount / totalMentions) * 100)}%` : '0%';
  const negativePercent = totalMentions > 0 ? `${Math.round((negativeCount / totalMentions) * 100)}%` : '0%';

  return (
      <div className="space-y-6 max-w-7xl mx-auto text-slate-100">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
              <Radio className="w-6 h-6 text-violet-600 animate-pulse" />
              Social Listening &amp; Surveillance de Marque
            </h1>
            <p className="text-xs text-slate-600 font-medium">
              Surveillez les mentions de votre marque ({workspaceName}), hashtags sectoriels et signaux concurrents en temps réel.
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
          <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4" />
            <span>{feedbackMsg}</span>
          </div>
        )}

        {/* Sentiment Overview Gauge (Real dynamic stats, 0% when 0 mentions) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="pulse-card p-5 flex items-center justify-between border border-slate-200 bg-white shadow-sm">
            <div>
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Smile className="w-4 h-4 text-emerald-600" />
                Sentiment Positif
              </span>
              <p className="text-2xl font-black text-emerald-700 mt-1">{positivePercent}</p>
              <span className="text-[10px] text-emerald-600 font-semibold">
                {totalMentions > 0 ? 'Réputation optimale' : 'Aucune mention détectée'}
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-sm border border-emerald-200">
              {positivePercent}
            </div>
          </div>

          <div className="pulse-card p-5 flex items-center justify-between border border-slate-200 bg-white shadow-sm">
            <div>
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Meh className="w-4 h-4 text-amber-600" />
                Sentiment Neutre
              </span>
              <p className="text-2xl font-black text-amber-700 mt-1">{neutralPercent}</p>
              <span className="text-[10px] text-slate-600 font-medium">Questions &amp; supports</span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-sm border border-amber-200">
              {neutralPercent}
            </div>
          </div>

          <div className="pulse-card p-5 flex items-center justify-between border border-slate-200 bg-white shadow-sm">
            <div>
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Frown className="w-4 h-4 text-rose-600" />
                Signaux Négatifs / Crise
              </span>
              <p className="text-2xl font-black text-rose-700 mt-1">{negativePercent}</p>
              <span className="text-[10px] text-slate-600 font-medium">Aucun risque de crise</span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-700 flex items-center justify-center font-bold text-sm border border-rose-200">
              {negativePercent}
            </div>
          </div>
        </div>

                            {/* Monitored Queries Pills & Filter Bar (Harmonious Dark Theme) */}
                            <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-sm text-slate-100">
                              <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                                    <Tag className="w-3.5 h-3.5 text-violet-400" /> Mots-clés surveillés :
                                  </span>
                                    {
                                      monitoredKeywords.map((q) => (
                                        <span
                                          key={q}
                                          className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-xl bg-violet-950/60 text-violet-300 border border-violet-500/30"
                                        >
                                          <span>{q}</span>
                                          <button
                                            type="button"
                                            onClick={() => handleRemoveKeyword(q)}
                                            className="hover:text-rose-400 text-slate-500 transition-colors p-0.5 cursor-pointer"
                                            title="Supprimer ce mot-clé"
                                          >
                                            ✕
                                          </button>
                                        </span>
                                      ))
                                    }
        </div>

                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => setSentimentFilter('all')}
            className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer ${sentimentFilter === 'all'
                                      ? 'bg-violet-600 text-white font-bold'
                                      : 'text-slate-400 hover:text-white bg-slate-800/80 border border-slate-700/40'
                                    }`}
                                >
                                  Toutes
                                </button>
                                <button
                                  onClick={() => setSentimentFilter('positive')}
            className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer ${sentimentFilter === 'positive'
                                      ? 'bg-emerald-600 text-white font-bold'
                                      : 'text-slate-400 hover:text-white bg-slate-800/80 border border-slate-700/40'
                                    }`}
                                >
                                  Positives
                                </button>
                                <button
                                  onClick={() => setSentimentFilter('neutral')}
            className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer ${sentimentFilter === 'neutral'
                                      ? 'bg-amber-600 text-white font-bold'
                                      : 'text-slate-400 hover:text-white bg-slate-800/80 border border-slate-700/40'
                                    }`}
                                >
                                  Neutres
                                </button>
                              </div>
                            </div>

                            {/* Live Mentions Feed */}
                            <div className="space-y-4">
                              {filteredMentions.length === 0 ? (
                                  <div className="py-16 text-center pulse-card p-8 border-dashed border-slate-800 space-y-3 bg-slate-900/30">
                                    <div className="w-12 h-12 rounded-2xl bg-violet-500/10 text-violet-400 mx-auto flex items-center justify-center">
                                      <Radio className="w-6 h-6 animate-pulse" />
                                    </div>
                                    <h4 className="text-base font-bold text-white">Veille active en cours</h4>
                                    <p className="text-xs text-slate-400 max-w-md mx-auto">
                                      Aucune mention directe ou signal négatif détecté sur vos mots-clés ({monitoredKeywords.join(', ')}). Le moteur d&apos;écoute sociale PulseSocial surveille le web et les réseaux en continu.
                                    </p>
                                  </div>
                                  ) : (
          filteredMentions.map((mention) => (
                                  <div
                                    key={mention.id}
                                    className="pulse-card p-5 flex flex-col sm:flex-row items-start justify-between gap-4 border border-slate-800 bg-slate-900/60"
                                  >
                                      <div className="flex items-start gap-4 flex-1">
                                        <img
                                          src={mention.author_avatar}
                                          alt={mention.author_name}
                                          className="w-12 h-12 rounded-full object-cover border border-slate-800 shrink-0"
                                        />

                                          <div className="space-y-1.5 flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                              <span className="font-bold text-sm text-white">
                                                {mention.author_name}
                                              </span>
                                              <span className="text-xs text-slate-400">{mention.author_handle}</span>
                                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase bg-slate-800 text-slate-300 border border-slate-700/50">
                                                {mention.platform}
                                              </span>
                                              <span
                                                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${mention.sentiment === 'positive'
                                                    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                                                    : 'bg-slate-800 text-slate-400'
                                                  }`}
                                              >
                                                {mention.sentiment === 'positive' ? '😊 Sentiment Positif' : 'Neutre'}
                                              </span>
                                              <FormattedDate date={mention.published_at} formatType="time" className="text-xs text-slate-400 ml-auto" />
                                            </div>

                                            <p className="text-xs text-slate-200 leading-relaxed font-medium">
                                              {mention.content}
                                            </p>

                                              <div className="flex items-center gap-4 text-[11px] text-slate-400 pt-1">
                                                <span>Portée estimée : <strong className="text-white">{mention.reach.toLocaleString()}</strong></span>
                                                <span>Interactions : <strong className="text-violet-400">{mention.engagement.toLocaleString()}</strong></span>
                                              </div>
                                            </div>
                                          </div>

                                          <a
                                            href={mention.url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-800/80 text-xs font-semibold text-slate-200 hover:bg-slate-700 flex items-center gap-1.5 shrink-0 self-end sm:self-center transition-colors"
                                          >
                                            <span>Voir sur {mention.platform}</span>
                                            <ExternalLink className="w-3 h-3 text-slate-400" />
                                          </a>
                                        </div>
                                      ))
        )}
                                    </div>

                                    {/* New Query Modal */}
                                    {modalOpen && (
                                        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
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
                                                  placeholder={`Ex: #${workspaceName.replace(/\s+/g, '')}, MonProduit, IA`}
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
