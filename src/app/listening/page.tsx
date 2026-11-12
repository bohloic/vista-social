'use client';

import React, { useState } from 'react';
import { INITIAL_MENTIONS } from '@/lib/mockData';
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
} from 'lucide-react';

export default function ListeningPage() {
  const [mentions, setMentions] = useState<ListeningMention[]>(INITIAL_MENTIONS);
  const [activeQuery, setActiveQuery] = useState<string>('all');
  const [sentimentFilter, setSentimentFilter] = useState<string>('all');

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
          onClick={() => alert('Ajout d&apos;une nouvelle alerte de veille')}
          className="flex items-center gap-2 py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 active:scale-95 transition-all self-start sm:self-center"
        >
          <Plus className="w-4 h-4" />
          <span>Nouvelle Requête de Veille</span>
        </button>
      </div>

      {/* Sentiment Overview Gauge */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="vista-card p-5 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
              <Smile className="w-4 h-4 text-emerald-500" />
              Sentiment Positif
            </span>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">82.4%</p>
            <span className="text-[10px] text-emerald-500 font-semibold">+4% vs semaine passée</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center font-bold text-sm">
            82%
          </div>
        </div>

        <div className="vista-card p-5 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
              <Meh className="w-4 h-4 text-amber-500" />
              Sentiment Neutre
            </span>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">14.2%</p>
            <span className="text-[10px] text-slate-400 font-medium">Questions & supports</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center font-bold text-sm">
            14%
          </div>
        </div>

        <div className="vista-card p-5 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
              <Frown className="w-4 h-4 text-rose-500" />
              Signaux Négatifs / Crise
            </span>
            <p className="text-2xl font-black text-rose-600 mt-1">3.4%</p>
            <span className="text-[10px] text-emerald-500 font-medium">Aucun risque de crise</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center font-bold text-sm">
            3%
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
        {filteredMentions.map((mention) => (
          <div
            key={mention.id}
            className="vista-card p-5 flex flex-col sm:flex-row items-start justify-between gap-4"
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
                  <span className="text-xs text-slate-400 ml-auto" suppressHydrationWarning>
                    <FormattedDate date={mention.published_at} formatType="time" />
                  </span>
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
        ))}
      </div>
    </div>
  );
}

