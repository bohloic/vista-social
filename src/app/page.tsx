'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { INITIAL_POSTS, INITIAL_ACCOUNTS, INITIAL_CONVERSATIONS, INITIAL_MENTIONS } from '@/lib/mockData';
import { Post, SocialAccount } from '@/lib/types';
import { FormattedDate } from '@/components/FormattedDate';
import {
  Users,
  Calendar,
  MessageSquare,
  Sparkles,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  TrendingUp,
  Globe2,
  ChevronRight,
  Radio,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const analyticsSummaryData = [
  { name: 'Lun', engagements: 3400, reach: 24000 },
  { name: 'Mar', engagements: 4200, reach: 29000 },
  { name: 'Mer', engagements: 3800, reach: 27500 },
  { name: 'Jeu', engagements: 5100, reach: 35000 },
  { name: 'Ven', engagements: 6400, reach: 48000 },
  { name: 'Sam', engagements: 5900, reach: 41000 },
  { name: 'Dim', engagements: 7200, reach: 52000 },
];

export default function DashboardPage() {
  const [posts, setPosts] = useState<Post[]>(INITIAL_POSTS);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const res = await fetch('/api/posts');
        if (res.ok) {
          const data = await res.json();
          if (data.posts) setPosts(data.posts);
        }
      } catch (err) {
        console.warn('Using local posts fallback');
      }
    };
    fetchPosts();

    const handleUpdate = () => fetchPosts();
    window.addEventListener('posts-updated', handleUpdate);
    return () => window.removeEventListener('posts-updated', handleUpdate);
  }, []);

  const totalFollowers = INITIAL_ACCOUNTS.reduce((acc, curr) => acc + curr.followers_count, 0);
  const scheduledCount = posts.filter((p) => p.status === 'scheduled').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-xl">
        <div className="relative z-10 max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold text-indigo-200 mb-1 border border-white/15">
            <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
            <span>Vista Social CM Engine • Propulsé par Gemini AI</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Bonjour Studio Nova 👋
          </h1>
          <p className="text-sm text-indigo-200 leading-relaxed">
            Vos 5 réseaux sociaux sont synchronisés. <strong>{scheduledCount} publications</strong> sont prêtes pour diffusion et <strong>3 messages</strong> attendent votre réponse dans la boîte unifiée.
          </p>
        </div>
        <div className="absolute -right-12 -bottom-12 w-64 h-64 rounded-full bg-purple-500/20 blur-3xl pointer-events-none" />
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Audience */}
        <div className="vista-card p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500">Audience Totale</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">
            {totalFollowers.toLocaleString('fr-FR')}
          </p>
          <div className="flex items-center gap-1.5 mt-2 text-xs font-semibold text-emerald-500">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>+12.4% ce mois</span>
          </div>
        </div>

        {/* Card 2: Scheduled Posts */}
        <div className="vista-card p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500">Posts Programmés</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">
            {scheduledCount} posts
          </p>
          <div className="flex items-center gap-1.5 mt-2 text-xs font-semibold text-slate-400">
            <Clock className="w-3.5 h-3.5" />
            <span>Prochain dans ~4h</span>
          </div>
        </div>

        {/* Card 3: Inbox Messages */}
        <div className="vista-card p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500">Boîte Unifiée</span>
            <div className="w-8 h-8 rounded-xl bg-pink-50 dark:bg-pink-950/60 text-pink-600 flex items-center justify-center">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">
            3 conversations
          </p>
          <div className="flex items-center gap-1.5 mt-2 text-xs font-semibold text-indigo-500">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
            <span>Réponse moyenne : &lt;15 min</span>
          </div>
        </div>

        {/* Card 4: Sentiment Score */}
        <div className="vista-card p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500">Score de Réputation</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
              <Radio className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">
            88% Positif
          </p>
          <div className="flex items-center gap-1.5 mt-2 text-xs font-semibold text-emerald-500">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Listening & Veille active</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Upcoming Content + Performance Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Upcoming Posts Pipeline (7 cols) */}
        <div className="lg:col-span-7 vista-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-600" />
                Pipeline des Prochaines Publications
              </h3>
              <Link
                href="/publish"
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
              >
                Voir le calendrier complet →
              </Link>
            </div>

            <div className="space-y-3">
              {posts.slice(0, 3).map((post) => {
                const targetAccs = INITIAL_ACCOUNTS.filter((a) =>
                  post.target_accounts.includes(a.id)
                );

                return (
                  <div
                    key={post.id}
                    className="p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 hover:border-indigo-300 transition-all flex gap-3.5 items-start"
                  >
                    {post.media_urls.length > 0 ? (
                      <img
                        src={post.media_urls[0]}
                        alt="Media"
                        className="w-16 h-16 rounded-xl object-cover shrink-0 border border-slate-200 dark:border-slate-700"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-slate-200 dark:bg-slate-800 shrink-0 flex items-center justify-center text-xs text-slate-400">
                        Texte
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1" suppressHydrationWarning>
                          <Clock className="w-3 h-3" />
                          <FormattedDate date={post.scheduled_for} formatType="datetime" />
                        </span>
                        <div className="flex items-center gap-1">
                          {targetAccs.map((acc) => (
                            <span
                              key={acc.id}
                              className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 uppercase"
                            >
                              {acc.platform}
                            </span>
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-slate-800 dark:text-slate-200 line-clamp-2 leading-relaxed">
                        {post.content}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 mt-4 flex items-center justify-between text-xs text-slate-500">
            <span>Synchronisation automatique active</span>
            <span className="text-emerald-500 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> File d&apos;attente optimisée
            </span>
          </div>
        </div>

        {/* Right: Weekly Reach & Engagement Chart (5 cols) */}
        <div className="lg:col-span-5 vista-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Portée & Engagements
                </h3>
                <p className="text-xs text-slate-400">7 derniers jours cumulés</p>
              </div>
              <Link
                href="/analytics"
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
              >
                Détails →
              </Link>
            </div>

            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analyticsSummaryData}>
                  <defs>
                    <linearGradient id="colorReach" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderRadius: '0.75rem',
                      border: 'none',
                      color: '#ffffff',
                      fontSize: '12px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="reach"
                    stroke="#6366f1"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorReach)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
            <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50">
              <span className="text-[10px] text-slate-400 block">Portée Totale</span>
              <span className="text-sm font-bold text-slate-900 dark:text-white">256,500</span>
            </div>
            <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50">
              <span className="text-[10px] text-slate-400 block">Engagements</span>
              <span className="text-sm font-bold text-indigo-600">36,000 (14%)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Access to Core Modules */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
        <Link
          href="/inbox"
          className="vista-card p-5 hover:border-indigo-400 transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">Boîte de réception unifiée</h4>
              <p className="text-xs text-slate-500">Répondez aux DMs et commentaires</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
        </Link>

        <Link
          href="/listening"
          className="vista-card p-5 hover:border-purple-400 transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center">
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">Social Listening & Veille</h4>
              <p className="text-xs text-slate-500">Mentions de marque & concurrents</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
        </Link>

        <Link
          href="/vista-pages"
          className="vista-card p-5 hover:border-pink-400 transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-pink-50 dark:bg-pink-950/60 text-pink-600 flex items-center justify-center">
              <Globe2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">Vista Page (Link in Bio)</h4>
              <p className="text-xs text-slate-500">Page d&apos;atterrissage pour créateurs</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </div>
  );
}

