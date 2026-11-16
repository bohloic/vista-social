'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  Plus,
  ShieldCheck,
  CreditCard,
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
  { name: 'Lun', engagements: 120, reach: 1800 },
  { name: 'Mar', engagements: 340, reach: 3200 },
  { name: 'Mer', engagements: 490, reach: 4100 },
  { name: 'Jeu', engagements: 680, reach: 5600 },
  { name: 'Ven', engagements: 950, reach: 7200 },
  { name: 'Sam', engagements: 1100, reach: 8900 },
  { name: 'Dim', engagements: 1450, reach: 11200 },
];

export default function DashboardPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [workspaceName, setWorkspaceName] = useState<string>('PulseSocial Studio');

  useEffect(() => {
    // 1. Verify initialization status and authentication
    const checkSetupAndAuth = async () => {
      try {
        const res = await fetch('/api/setup');
        if (res.ok) {
          const data = await res.json();
          if (!data.initialized) {
            router.push('/setup');
            return;
          }

          // If initialized, check authentication
          const authRes = await fetch('/api/auth/me');
          if (authRes.ok) {
            const authData = await authRes.json();
            if (!authData.authenticated) {
              router.push('/login');
              return;
            }
            if (authData.user?.workspace?.name) {
              setWorkspaceName(authData.user.workspace.name);
            }
          }
        }
      } catch (err) {
        console.warn('Setup & auth check failed:', err);
      }
    };

    // 2. Fetch real posts & accounts
    const fetchData = async () => {
      try {
        const [postsRes, accsRes] = await Promise.all([
          fetch('/api/posts'),
          fetch('/api/social/connect'),
        ]);

        if (postsRes.ok) {
          const data = await postsRes.json();
          if (data.posts) setPosts(data.posts);
        }

        if (accsRes.ok) {
          const accsData = await accsRes.json();
          if (accsData.accounts) setAccounts(accsData.accounts);
        }
      } catch (err) {
        console.warn('Failed to fetch data from API:', err);
      } finally {
        setLoading(false);
      }
    };

    checkSetupAndAuth();
    fetchData();

    const handleUpdate = () => fetchData();
    window.addEventListener('posts-updated', handleUpdate);
    return () => window.removeEventListener('posts-updated', handleUpdate);
  }, [router]);

  const totalFollowers = accounts.reduce((acc, curr) => acc + (curr.followers_count || 0), 0);
  const scheduledCount = posts.filter((p) => p.status === 'scheduled').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-violet-950 via-slate-900 to-indigo-950 border border-violet-500/20 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-2xl">
        <div className="relative z-10 max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 backdrop-blur-md text-xs font-semibold text-violet-300 mb-1 border border-violet-500/20">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>PulseSocial CM Engine • Propulsé par Gemini AI</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Bonjour {workspaceName} 👋
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            Votre plateforme de gestion unifiée est opérationnelle. <strong>{scheduledCount} publication{scheduledCount > 1 ? 's' : ''}</strong> {scheduledCount > 1 ? 'sont programmées' : 'programmée'} avec synchronisation PostgreSQL en temps réel.
          </p>
        </div>
        <div className="absolute -right-12 -bottom-12 w-64 h-64 rounded-full bg-violet-600/15 blur-3xl pointer-events-none" />
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Audience */}
        <div className="pulse-card p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400">Audience Connectée</span>
            <div className="w-8 h-8 rounded-xl bg-violet-500/10 text-violet-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-white">
            {totalFollowers > 0 ? totalFollowers.toLocaleString('fr-FR') : '0'}
          </p>
          <div className="flex items-center gap-1.5 mt-2 text-xs font-semibold text-slate-400">
            <Link href="/settings" className="hover:text-violet-400 flex items-center gap-1 text-[11px] text-violet-400">
              + Connecter des réseaux sociaux →
            </Link>
          </div>
        </div>

        {/* Card 2: Scheduled Posts */}
        <div className="pulse-card p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400">Posts Programmés</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-white">
            {scheduledCount} post{scheduledCount > 1 ? 's' : ''}
          </p>
          <div className="flex items-center gap-1.5 mt-2 text-xs font-semibold text-emerald-400">
            <Clock className="w-3.5 h-3.5" />
            <span>{scheduledCount > 0 ? 'File active' : 'File prête pour diffusion'}</span>
          </div>
        </div>

        {/* Card 3: Inbox Messages */}
        <div className="pulse-card p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400">Boîte Unifiée</span>
            <div className="w-8 h-8 rounded-xl bg-pink-500/10 text-pink-400 flex items-center justify-center">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-white">
            0 conversation
          </p>
          <div className="flex items-center gap-1.5 mt-2 text-xs font-semibold text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Synchronisation webhook active</span>
          </div>
        </div>

        {/* Card 4: Monetization / Billing status */}
        <div className="pulse-card p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400">Statut Compte</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-black text-emerald-400">
            Accès Illimité
          </p>
          <div className="flex items-center gap-1.5 mt-2 text-xs font-semibold text-slate-400">
            <CreditCard className="w-3.5 h-3.5 text-violet-400" />
            <Link href="/billing" className="hover:text-emerald-400 text-[11px] text-slate-300">
              Mobile Money activé →
            </Link>
          </div>
        </div>
      </div>

      {/* Main Grid: Upcoming Content + Performance Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Upcoming Posts Pipeline (7 cols) */}
        <div className="lg:col-span-7 pulse-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-violet-400" />
                Pipeline des Publications
              </h3>
              <Link
                href="/publish"
                className="text-xs font-semibold text-violet-400 hover:text-violet-300 flex items-center gap-1"
              >
                Planificateur & Calendrier →
              </Link>
            </div>

            {posts.length === 0 ? (
              <div className="py-10 px-4 text-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/30 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-violet-500/10 text-violet-400 mx-auto flex items-center justify-center">
                  <Calendar className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-white">Aucun post programmé</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Votre file d&apos;attente est prête. Rédigez votre première publication multi-plateformes avec l&apos;aide de l&apos;IA Gemini.
                  </p>
                </div>
                <Link
                  href="/publish"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs shadow-lg shadow-violet-600/30 transition-all hover:scale-105"
                >
                  <Plus className="w-4 h-4" />
                  Créer ma première publication
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {posts.slice(0, 3).map((post) => (
                  <div
                    key={post.id}
                    className="p-3.5 rounded-2xl border border-slate-800 bg-slate-900/40 hover:border-violet-500/50 transition-all flex gap-3.5 items-start"
                  >
                    {post.media_urls && post.media_urls.length > 0 ? (
                      <img
                        src={post.media_urls[0]}
                        alt="Media"
                        className="w-16 h-16 rounded-xl object-cover shrink-0 border border-slate-800"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-slate-800 shrink-0 flex items-center justify-center text-xs text-slate-400">
                        Texte
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-semibold text-violet-400 inline-flex items-center gap-1" suppressHydrationWarning={true}>
                          <Clock className="w-3 h-3" />
                          <FormattedDate date={post.scheduled_for} formatType="datetime" />
                        </span>
                        <div className="flex items-center gap-1">
                          {post.target_accounts.map((accId) => (
                            <span
                              key={accId}
                              className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 uppercase"
                            >
                              {accId.replace('acc-', '')}
                            </span>
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-slate-200 line-clamp-2 leading-relaxed">
                        {post.content}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-800 mt-4 flex items-center justify-between text-xs text-slate-400">
            <span>Synchronisation Supabase PostgreSQL active</span>
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> En ligne
            </span>
          </div>
        </div>

        {/* Right: Weekly Reach & Engagement Chart (5 cols) */}
        <div className="lg:col-span-5 pulse-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <div>
                <h3 className="font-bold text-base text-white">
                  Portée & Engagements
                </h3>
                <p className="text-xs text-slate-400">Projection d&apos;audience PulseSocial</p>
              </div>
              <Link
                href="/analytics"
                className="text-xs font-semibold text-violet-400 hover:text-violet-300"
              >
                Détails →
              </Link>
            </div>

            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analyticsSummaryData}>
                  <defs>
                    <linearGradient id="colorReach" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#07090e',
                      borderRadius: '0.75rem',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: '#ffffff',
                      fontSize: '12px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="reach"
                    stroke="#8b5cf6"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorReach)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-4 border-t border-slate-800 text-center">
            <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
              <span className="text-[10px] text-slate-400 block">Portée Prévisionnelle</span>
              <span className="text-sm font-bold text-white">35,800 vues</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
              <span className="text-[10px] text-slate-400 block">Taux d&apos;Engagement</span>
              <span className="text-sm font-bold text-violet-400">14.2%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Access to Core Modules */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
        <Link
          href="/publish"
          className="pulse-card p-5 hover:border-violet-400 transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-violet-500/10 text-violet-400 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-white">Planificateur</h4>
              <p className="text-xs text-slate-400">Publication multi-réseaux</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-500 group-hover:translate-x-1 transition-transform" />
        </Link>

        <Link
          href="/inbox"
          className="pulse-card p-5 hover:border-pink-400 transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-pink-500/10 text-pink-400 flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-white">Boîte Unifiée</h4>
              <p className="text-xs text-slate-400">DMs & Commentaires</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-500 group-hover:translate-x-1 transition-transform" />
        </Link>

        <Link
          href="/pulse-pages"
          className="pulse-card p-5 hover:border-emerald-400 transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Globe2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-white">Pulse Pages</h4>
              <p className="text-xs text-slate-400">Link-in-Bio créateurs</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-500 group-hover:translate-x-1 transition-transform" />
        </Link>

        <Link
          href="/billing"
          className="pulse-card p-5 hover:border-amber-400 transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-white">Mobile Money</h4>
              <p className="text-xs text-slate-400">Orange, MTN, Wave, Moov</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-500 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </div>
  );
}
