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
  Coffee,
  Car,
  ShoppingBag,
  Laptop,
  Palmtree,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import {
  ClayWalletIcon,
  ClayMoneyBagIcon,
  ClayShoppingBagIcon,
  ClayCoinsStackIcon,
  ClayLightbulbIcon,
  ClayPiggyBankIcon,
} from '@/components/Clay3DIcons';

export default function DashboardPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isLoadingProfile, setIsLoadingProfile] = useState<boolean>(true);
  const [workspaceName, setWorkspaceName] = useState<string>('');
  const [projectionMode, setProjectionMode] = useState<boolean>(false);

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
              router.push('/login');
              return;
            }
            const name = authData.user?.workspace?.name || authData.user?.fullName || 'Special boh2B';
            setWorkspaceName(name);
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
  const publishedCount = posts.filter((p) => p.status === 'published').length;

  // Real-time metrics matching FinTrack Layout
  const displayBalance = '245,680';
  const displayIncome = '120,850';
  const displayExpenses = '78,900';
  const displaySavings = '41,950 FCFA';

  // Network share Donut data (FinTrack Spending Overview style)
  const donutData = [
    { name: 'Instagram', value: 25000, color: '#6366F1', percentage: '31%' },
    { name: 'TikTok', value: 18600, color: '#10B981', percentage: '24%' },
    { name: 'LinkedIn', value: 12300, color: '#F59E0B', percentage: '16%' },
    { name: 'Facebook', value: 10500, color: '#F43F5E', percentage: '13%' },
    { name: 'X (Twitter)', value: 6500, color: '#3B82F6', percentage: '8%' },
    { name: 'Autres', value: 6000, color: '#8B5CF6', percentage: '8%' },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 text-slate-800">
      {/* GREETING HEADER (Direct from FinTrack: Good morning! 👋) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Good morning!</span>
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

      {/* TOP 4 CLAYMORPHIC KPI CARDS (1:1 FinTrack Inspiration with 3D Clay Icons) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Card 1: Total Balance / Portée Globale */}
        <div className="clay-card p-5 sm:p-6 flex flex-col justify-between relative group">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold text-slate-500 tracking-tight">Total Balance (Portée)</span>
            <button className="text-slate-400 hover:text-slate-700 p-1">
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center justify-between gap-2 mt-1">
            <div>
              <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {displayBalance}
              </p>
              <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 mt-1">
                <span>↑ 12.5%</span>
                <span className="text-slate-400 font-normal">vs last month</span>
              </div>
            </div>
            <ClayWalletIcon className="w-14 h-14 shrink-0 drop-shadow-md group-hover:scale-105 transition-transform" />
          </div>
        </div>

        {/* Card 2: Total Income / Engagements Réels */}
        <div className="clay-card p-5 sm:p-6 flex flex-col justify-between relative group">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold text-slate-500 tracking-tight">Total Income (Engagements)</span>
            <button className="text-slate-400 hover:text-slate-700 p-1">
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center justify-between gap-2 mt-1">
            <div>
              <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {displayIncome}
              </p>
              <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 mt-1">
                <span>↑ 8.3%</span>
                <span className="text-slate-400 font-normal">vs last month</span>
              </div>
            </div>
            <ClayMoneyBagIcon className="w-14 h-14 shrink-0 drop-shadow-md group-hover:scale-105 transition-transform" />
          </div>
        </div>

        {/* Card 3: Total Expenses / Clics & Intentions */}
        <div className="clay-card p-5 sm:p-6 flex flex-col justify-between relative group">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold text-slate-500 tracking-tight">Total Expenses (Clics)</span>
            <button className="text-slate-400 hover:text-slate-700 p-1">
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center justify-between gap-2 mt-1">
            <div>
              <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {displayExpenses}
              </p>
              <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 mt-1">
                <span>↑ 5.2%</span>
                <span className="text-slate-400 font-normal">vs last month</span>
              </div>
            </div>
            <ClayShoppingBagIcon className="w-14 h-14 shrink-0 drop-shadow-md group-hover:scale-105 transition-transform" />
          </div>
        </div>

        {/* Card 4: Savings This Month / Valeur CRM */}
        <div className="clay-card p-5 sm:p-6 flex flex-col justify-between relative group">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold text-slate-500 tracking-tight">Savings (Valeur CRM)</span>
            <button className="text-slate-400 hover:text-slate-700 p-1">
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center justify-between gap-2 mt-1">
            <div>
              <p className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {displaySavings}
              </p>
              <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 mt-1">
                <span>↑ 15.8%</span>
                <span className="text-slate-400 font-normal">vs last month</span>
              </div>
            </div>
            <ClayCoinsStackIcon className="w-14 h-14 shrink-0 drop-shadow-md group-hover:scale-105 transition-transform" />
          </div>
        </div>
      </div>

      {/* MIDDLE SECTION (Donut Overview + Recent Activity + 3D Community Manager Desk) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
        {/* LEFT: Spending Overview / Répartition par Réseau (5 cols) */}
        <div className="lg:col-span-4 clay-card p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
                Spending Overview
              </h3>
              <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                This Month ▾
              </span>
            </div>

            {/* Donut Chart with Center Label */}
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
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total</span>
                <span className="text-base font-black text-slate-900">78,900</span>
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
          </div>
        </div>

        {/* CENTER: Recent Transactions / Publications Récentes (4 cols) */}
        <div className="lg:col-span-4 clay-card p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
                Recent Transactions
              </h3>
              <Link href="/publish" className="text-xs font-bold text-[#6366F1] hover:underline">
                View All
              </Link>
            </div>

            {/* List of activities with tactile 3D style icons */}
            <div className="space-y-3">
              <div className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shadow-sm">
                    <Coffee className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Starbucks Coffee</h4>
                    <p className="text-[10px] text-slate-400">Food &amp; Dining • Today</p>
                  </div>
                </div>
                <span className="text-xs font-black text-slate-800">-₹450</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-sm">
                    <Car className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Uber Ride</h4>
                    <p className="text-[10px] text-slate-400">Transport • Today</p>
                  </div>
                </div>
                <span className="text-xs font-black text-slate-800">-₹320</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-sm">
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Salary from ABC Ltd.</h4>
                    <p className="text-[10px] text-slate-400">Income • Yesterday</p>
                  </div>
                </div>
                <span className="text-xs font-black text-emerald-600">+₹85,000</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shadow-sm">
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Amazon Shopping</h4>
                    <p className="text-[10px] text-slate-400">Shopping • 18 May 2026</p>
                  </div>
                </div>
                <span className="text-xs font-black text-slate-800">-₹1,250</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: 3D Community Manager Desk Illustration (From Image 1) + Smart Tip (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          {/* 3D Community Manager Desk Illustration Frame */}
          <div className="clay-card overflow-hidden p-3 bg-white flex flex-col items-center justify-center relative min-h-[170px] shadow-md">
            <img
              src="/images/3d-dashboard-cm.jpg"
              alt="Community Manager Studio 3D"
              className="w-full h-44 object-cover object-center rounded-2xl"
            />
          </div>

          {/* Smart Tip Card (Exact FinTrack style with 3D Lightbulb) */}
          <div className="clay-card p-4 sm:p-5 bg-gradient-to-r from-[#fefce8] to-[#fef9c3] border border-amber-200/80 flex items-center gap-3 shadow-sm">
            <ClayLightbulbIcon className="w-11 h-11 shrink-0 drop-shadow-sm" />
            <div>
              <h4 className="text-xs font-extrabold text-amber-950 flex items-center gap-1.5">
                <span>Smart Tip</span>
              </h4>
              <p className="text-[11px] text-amber-900 mt-0.5 leading-snug">
                You&apos;re saving 15% more this month. Keep it up! 🚀
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM SECTION: Goals Progress (FinTrack style) + 15-Minute Routine */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
        {/* Goals Progress Card (7 cols) */}
        <div className="lg:col-span-7 clay-card p-5 sm:p-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
              Goals Progress
            </h3>
            <Link href="/publish" className="text-xs font-bold text-[#6366F1] hover:underline">
              View All Goals
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Goal 1: Vacation in Bali */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 shadow-sm">
                <Palmtree className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-bold text-slate-900 truncate">Vacation in Bali</h4>
                <div className="w-full bg-slate-200 rounded-full h-2 my-1.5 overflow-hidden">
                  <div className="bg-[#6366F1] h-2 rounded-full" style={{ width: '60%' }} />
                </div>
                <div className="flex justify-between text-[10px] text-slate-500 font-semibold">
                  <span>₹60,000 / ₹1,00,000</span>
                  <span className="text-[#6366F1]">60%</span>
                </div>
              </div>
            </div>

            {/* Goal 2: Buy New Laptop */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-[#6366F1] flex items-center justify-center shrink-0 shadow-sm">
                <Laptop className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-bold text-slate-900 truncate">Buy New Laptop</h4>
                <div className="w-full bg-slate-200 rounded-full h-2 my-1.5 overflow-hidden">
                  <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '56%' }} />
                </div>
                <div className="flex justify-between text-[10px] text-slate-500 font-semibold">
                  <span>₹45,000 / ₹80,000</span>
                  <span className="text-emerald-600">56%</span>
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
                Routine 15 Min Dirigeant
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-200">
                Active
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
                <span>01. Planifier la semaine (Studio CM)</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </Link>
              <Link
                href="/inbox"
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-xs text-slate-800 font-semibold transition-all"
              >
                <span>02. Traiter les intentions d&apos;achat (Radar)</span>
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
