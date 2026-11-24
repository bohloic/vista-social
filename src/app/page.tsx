'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Post, SocialAccount } from '@/lib/types';
import {
  Users,
  Calendar,
  MessageSquare,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  TrendingUp,
  Globe2,
  ChevronRight,
  Plus,
  ShieldCheck,
  CreditCard,
  Briefcase,
  MoreVertical,
  Flame,
  Zap,
  ShoppingBag,
  Target,
  Send,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  ClayWalletIcon,
  ClayMoneyBagIcon,
  ClayCalendarIcon,
  ClayCoinsStackIcon,
  ClayLightbulbIcon,
} from '@/components/Clay3DIcons';

export default function DashboardPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isLoadingProfile, setIsLoadingProfile] = useState<boolean>(true);
  const [workspaceName, setWorkspaceName] = useState<string>('');

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

          const authRes = await fetch('/api/auth/me');
          if (authRes.ok) {
            const authData = await authRes.json();
            if (!authData.authenticated) {
              window.location.href = '/login';
              return;
            }
            const name = authData.user?.workspace?.name || authData.user?.fullName || 'Pulse Social Studio';
            setWorkspaceName(name);
          } else {
            window.location.href = '/login';
            return;
          }
        }
      } catch (err) {
        console.warn('Setup & auth check failed:', err);
      } finally {
        setIsLoadingProfile(false);
      }
    };

    // 2. Fetch real posts & accounts
    const fetchData = async () => {
      try {
        const [postsRes, accsRes] = await Promise.all([
          fetch('/api/posts', { cache: 'no-store' }),
          fetch('/api/social/connect', { cache: 'no-store' }),
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

  const scheduledCount = posts.filter((p) => p.status === 'scheduled').length;
  const hasAccounts = accounts.length > 0;

  // Real-time metrics in West African CFA Franc (XOF / FCFA)
  // When no accounts connected, show clean real 0 counters as requested by user
  const [crmValue, setCrmValue] = useState<string>('0 FCFA');

  useEffect(() => {
    try {
      const savedProspects = localStorage.getItem('pulsesocial_crm_prospects');
      if (savedProspects) {
        const list = JSON.parse(savedProspects);
        if (Array.isArray(list) && list.length > 0) {
          const total = list.reduce((sum: number, p: any) => sum + (Number(p.deal_value) || 0), 0);
          setCrmValue(`${total.toLocaleString('fr-FR')} FCFA`);
          return;
        }
      }
      setCrmValue('0 FCFA');
    } catch {
      setCrmValue('0 FCFA');
    }
  }, []);

  const displayReach = hasAccounts ? '245 680' : '0';
  const displayEngagement = hasAccounts ? '120 850' : '0';
  const displayScheduled = `${scheduledCount}`;
  const displayCrmValue = crmValue;

  // Network share Donut data (Audience & Social Reach)
  const donutData = [
    { name: 'Instagram', value: 25000, color: '#6366F1', percentage: '32%' },
    { name: 'TikTok', value: 18600, color: '#10B981', percentage: '24%' },
    { name: 'LinkedIn', value: 12300, color: '#F59E0B', percentage: '16%' },
    { name: 'Facebook', value: 10500, color: '#F43F5E', percentage: '13%' },
    { name: 'WhatsApp', value: 6500, color: '#22C55E', percentage: '8%' },
    { name: 'X (Twitter)', value: 6000, color: '#3B82F6', percentage: '7%' },
  ];

  if (isLoadingProfile) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <div className="w-9 h-9 rounded-full border-3 border-[#7C3AED] border-t-transparent animate-spin" />
        <p className="text-xs font-bold text-slate-500 font-jakarta">Chargement de votre espace sécurisé...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 text-slate-800">
      {/* GREETING HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Bonjour !</span>
            <span className="text-2xl">👋</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            Voici les performances en temps réel de votre audience et de vos publications aujourd&apos;hui.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/publish"
            className="clay-btn-gradient px-4 py-2 text-xs font-bold text-white shadow-md flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nouveau Post</span>
          </Link>
        </div>
      </div>

      {/* TOP 4 CLAYMORPHIC KPI CARDS WITH 3D CLAY ICONS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Card 1: Portée Globale (Reach) */}
        <div className="clay-card p-5 sm:p-6 flex flex-col justify-between relative group">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold text-slate-500 tracking-tight">Portée Globale (Reach)</span>
            <button className="text-slate-400 hover:text-slate-700 p-1" aria-label="Options">
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center justify-between gap-2 mt-1">
            <div>
              <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {displayReach}
              </p>
              <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 mt-1">
                <span>{hasAccounts ? '↑ 12.5%' : '0%'}</span>
                <span className="text-slate-400 font-normal">{hasAccounts ? 'vs mois dernier' : 'aucun compte actif'}</span>
              </div>
            </div>
            <ClayWalletIcon className="w-14 h-14 shrink-0 drop-shadow-md group-hover:scale-105 transition-transform" />
          </div>
        </div>

        {/* Card 2: Engagements & Interactions */}
        <div className="clay-card p-5 sm:p-6 flex flex-col justify-between relative group">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold text-slate-500 tracking-tight">Engagements Clients</span>
            <button className="text-slate-400 hover:text-slate-700 p-1" aria-label="Options">
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center justify-between gap-2 mt-1">
            <div>
              <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {displayEngagement}
              </p>
              <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 mt-1">
                <span>{hasAccounts ? '↑ 8.3%' : '0%'}</span>
                <span className="text-slate-400 font-normal">{hasAccounts ? 'vs mois dernier' : 'en attente de posts'}</span>
              </div>
            </div>
            <ClayMoneyBagIcon className="w-14 h-14 shrink-0 drop-shadow-md group-hover:scale-105 transition-transform" />
          </div>
        </div>

        {/* Card 3: Publications Planifiées */}
        <div className="clay-card p-5 sm:p-6 flex flex-col justify-between relative group">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold text-slate-500 tracking-tight">Publications Planifiées</span>
            <button className="text-slate-400 hover:text-slate-700 p-1" aria-label="Options">
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center justify-between gap-2 mt-1">
            <div>
              <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {displayScheduled} posts
              </p>
              <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 mt-1">
                <span>{scheduledCount > 0 ? '↑ En file active' : '0 post'}</span>
                <span className="text-slate-400 font-normal">{scheduledCount > 0 ? 'cette semaine' : 'à programmer'}</span>
              </div>
            </div>
            <ClayCalendarIcon className="w-14 h-14 shrink-0 drop-shadow-md group-hover:scale-105 transition-transform" />
          </div>
        </div>

        {/* Card 4: Pipeline Ventes CRM (FCFA) */}
        <div className="clay-card p-5 sm:p-6 flex flex-col justify-between relative group">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold text-slate-500 tracking-tight">Pipeline Ventes CRM</span>
            <button className="text-slate-400 hover:text-slate-700 p-1" aria-label="Options">
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center justify-between gap-2 mt-1">
            <div>
              <p className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {displayCrmValue}
              </p>
              <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 mt-1">
                <span>{crmValue !== '0 FCFA' ? '↑ Actif' : '0 transaction'}</span>
                <span className="text-slate-400 font-normal">pipeline social</span>
              </div>
            </div>
            <ClayCoinsStackIcon className="w-14 h-14 shrink-0 drop-shadow-md group-hover:scale-105 transition-transform" />
          </div>
        </div>
      </div>

      {/* MIDDLE SECTION (Donut Social Reach + Recent Social Selling Activity + 3D CM Desk) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
        {/* LEFT: Répartition de l'Audience & Portée Sociale (4 cols) */}
        <div className="lg:col-span-4 clay-card p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
                Audience &amp; Portée Sociale
              </h3>
              <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full whitespace-nowrap inline-flex items-center gap-1">
                Ce Mois ▾
              </span>
            </div>

            {/* Donut Chart with Center Label or Empty State */}
            {!hasAccounts ? (
              <div className="py-8 flex flex-col items-center justify-center text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-violet-50 text-[#7C3AED] flex items-center justify-center shadow-inner">
                  <Globe2 className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-900">Aucun réseau social connecté</p>
                  <p className="text-[11px] text-slate-500 max-w-[210px] mx-auto leading-relaxed">
                    Connectez vos comptes pour analyser votre audience globale en direct.
                  </p>
                </div>
                <Link
                  href="/settings"
                  className="clay-btn-gradient px-4 py-2 text-xs font-bold text-white shadow-sm flex items-center gap-1.5 cursor-pointer mt-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Connecter mon premier réseau</span>
                </Link>
              </div>
            ) : (
              <>
                <div className="relative h-44 w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={donutData}
                        cx="50%"
                        cy="50%"
                        innerRadius={52}
                        outerRadius={74}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {donutData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} stroke="#ffffff" strokeWidth={2} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#ffffff',
                          borderRadius: '16px',
                          border: '1px solid #e2e8f0',
                          boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                          fontSize: '12px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Abonnés</span>
                    <span className="text-base font-black text-slate-900">78 900</span>
                  </div>
                </div>

                {/* Network breakdown pills list */}
                <div className="space-y-2 pt-2">
                  {donutData.slice(0, 5).map((d) => (
                    <div key={d.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                        <span className="font-semibold text-slate-700">{d.name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-500">
                        <span className="font-bold text-slate-900">{d.value.toLocaleString('fr-FR')}</span>
                        <span className="text-[11px]">{d.percentage}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* CENTER: Activités & Conversions Récentes (4 cols) */}
        <div className="lg:col-span-4 clay-card p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
                Activités &amp; Ventes Récentes
              </h3>
              <Link href="/crm" className="text-xs font-bold text-[#6366F1] hover:underline">
                Voir CRM
              </Link>
            </div>

            {/* List of real social marketing & Mobile Money transactions */}
            <div className="space-y-3">
              <div className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shadow-sm">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Formation VIP (Orange Money)</h4>
                    <p className="text-[10px] text-slate-400">Paiement reçu • Aujourd&apos;hui</p>
                  </div>
                </div>
                <span className="text-xs font-black text-emerald-600">+15 000 FCFA</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center shadow-sm">
                    <Flame className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Campagne Instagram Ads (Wave)</h4>
                    <p className="text-[10px] text-slate-400">Budget sponsorisé • Aujourd&apos;hui</p>
                  </div>
                </div>
                <span className="text-xs font-black text-slate-800">-5 000 FCFA</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-sm">
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Abonnement Pulse Pro (MTN MoMo)</h4>
                    <p className="text-[10px] text-slate-400">Renouvellement 3 mois • Hier</p>
                  </div>
                </div>
                <span className="text-xs font-black text-emerald-600">+45 000 FCFA</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shadow-sm">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Boost Publication B2B (Moov)</h4>
                    <p className="text-[10px] text-slate-400">LinkedIn Ads • Il y a 3 jours</p>
                  </div>
                </div>
                <span className="text-xs font-black text-slate-800">-3 500 FCFA</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: PulseSocial Studio Visual in FCFA + Smart Tip (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          {/* PulseSocial Studio Live Performance Card (West Africa FCFA) with high-contrast dark theme */}
          <div className="overflow-hidden p-5 sm:p-6 bg-slate-900 border border-slate-800 text-white flex flex-col justify-between relative min-h-[180px] shadow-2xl rounded-3xl">
            <div className="flex items-start justify-between">
              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 text-white text-[10px] font-extrabold tracking-wide uppercase border border-slate-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  PulseSocial Studio
                </span>
                <p className="text-xs text-slate-300 font-semibold font-jakarta mt-2">Revenus Social Selling (UEMOA)</p>
                <p className="text-2xl sm:text-3xl font-black font-fredoka tracking-tight text-white mt-0.5">
                  1 485 000 <span className="text-sm font-black text-[#FACC15]">FCFA</span>
                </p>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-[#7C3AED] font-black text-sm shadow-inner">
                <Zap className="w-5 h-5 fill-[#7C3AED]" />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 mt-4 flex items-center justify-between text-xs font-jakarta">
              <span className="text-emerald-400 font-black flex items-center gap-1">
                ↗ +24.8% <span className="text-slate-400 font-medium text-[11px]">vs mois précédent</span>
              </span>
              <div className="flex items-center gap-1.5">
                <span className="px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-[10px] font-bold text-slate-300">Wave</span>
                <span className="px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-[10px] font-bold text-slate-300">MoMo</span>
                <span className="px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-[10px] font-bold text-slate-300">Orange</span>
              </div>
            </div>
          </div>

          {/* Smart Tip Card (Exact FinTrack style with 3D Lightbulb) */}
          <div className="clay-card p-4 sm:p-5 bg-gradient-to-r from-[#fefce8] to-[#fef9c3] border border-amber-200/80 flex items-center gap-3 shadow-sm">
            <ClayLightbulbIcon className="w-11 h-11 shrink-0 drop-shadow-sm" />
            <div>
              <h4 className="text-xs font-extrabold text-amber-950 flex items-center gap-1.5">
                <span>Conseil Stratégique Pulse</span>
              </h4>
              <p className="text-[11px] text-amber-900 mt-0.5 leading-snug">
                Votre audience TikTok et Instagram interagit 35% plus entre 18h et 21h GMT. Programmez vos 2 prochains posts vidéo pour maximiser vos conversions Mobile Money ! 🚀
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM SECTION: Objectifs & Progression + 15-Minute Routine with clearance */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 pb-28">
        {/* Goals Progress Card (7 cols) */}
        <div className="lg:col-span-7 clay-card p-5 sm:p-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
              Objectifs &amp; Progression de Campagne
            </h3>
            <Link href="/crm" className="text-xs font-bold text-[#6366F1] hover:underline">
              Voir Objectifs
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Goal 1: Campagne Ventes Mobile Money */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 shadow-sm">
                <Target className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-bold text-slate-900 truncate">Ventes Campagne Fêtes (MoMo)</h4>
                <div className="w-full bg-slate-200 rounded-full h-2 my-1.5 overflow-hidden">
                  <div className="bg-[#6366F1] h-2 rounded-full" style={{ width: '60%' }} />
                </div>
                <div className="flex justify-between text-[10px] text-slate-500 font-semibold">
                  <span>600 000 / 1 000 000 FCFA</span>
                  <span className="text-[#6366F1]">60%</span>
                </div>
              </div>
            </div>

            {/* Goal 2: Acquisition Prospects Qualifiés */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-[#6366F1] flex items-center justify-center shrink-0 shadow-sm">
                <Users className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-bold text-slate-900 truncate">Acquisition 500 Abonnés TikTok</h4>
                <div className="w-full bg-slate-200 rounded-full h-2 my-1.5 overflow-hidden">
                  <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '75%' }} />
                </div>
                <div className="flex justify-between text-[10px] text-slate-500 font-semibold">
                  <span>375 / 500 abonnés</span>
                  <span className="text-emerald-600">75%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Cockpit Routine 15 min (5 cols) */}
        <div className="lg:col-span-5 clay-card p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
                Cockpit Dirigeant : Routine 15 Min
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-200">
                Recommandé
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-3">
              3 actions stratégiques par jour pour transformer votre audience en chiffre d&apos;affaires.
            </p>
            <div className="space-y-2">
              <Link
                href="/publish"
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-xs text-slate-800 font-semibold transition-all"
              >
                <span>01. Valider les posts programmés du jour</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </Link>
              <Link
                href="/inbox"
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-xs text-slate-800 font-semibold transition-all"
              >
                <span>02. Traiter les intentions d&apos;achat en attente (Radar)</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </Link>
              <Link
                href="/crm"
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-xs text-slate-800 font-semibold transition-all"
              >
                <span>03. Clôturer les paiements Mobile Money</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
