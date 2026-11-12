'use client';

import React, { useState } from 'react';
import { INITIAL_ACCOUNTS, INITIAL_POSTS } from '@/lib/mockData';
import {
  BarChart3,
  TrendingUp,
  Users,
  Eye,
  Heart,
  Download,
  Calendar,
  Share2,
  ArrowUpRight,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

const growthData = [
  { date: '01 Nov', Instagram: 22100, LinkedIn: 13400, TikTok: 42000 },
  { date: '03 Nov', Instagram: 22600, LinkedIn: 13600, TikTok: 43500 },
  { date: '05 Nov', Instagram: 23100, LinkedIn: 13800, TikTok: 45000 },
  { date: '07 Nov', Instagram: 23500, LinkedIn: 13950, TikTok: 46200 },
  { date: '09 Nov', Instagram: 24000, LinkedIn: 14100, TikTok: 47600 },
  { date: '11 Nov', Instagram: 24500, LinkedIn: 14200, TikTok: 48900 },
];

const channelEngagementData = [
  { channel: 'Instagram', engagements: 14800, rate: '4.8%' },
  { channel: 'TikTok', engagements: 28400, rate: '7.2%' },
  { channel: 'LinkedIn', engagements: 8900, rate: '3.9%' },
  { channel: 'X / Twitter', engagements: 3400, rate: '2.1%' },
  { channel: 'Facebook', engagements: 6100, rate: '1.9%' },
];

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-indigo-600" />
            Analyses & Rapports de Performance
          </h1>
          <p className="text-xs text-slate-500">
            Suivi consolidé de l&apos;impact cross-canal, taux d&apos;engagement et croissance d&apos;audience.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Time range selector */}
          <div className="flex items-center p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
            {(['7d', '30d', '90d'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setTimeRange(r)}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                  timeRange === r
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {r === '7d' ? '7 Jours' : r === '30d' ? '30 Jours' : '90 Jours'}
              </button>
            ))}
          </div>

          <button
            onClick={() => alert('Génération du rapport PDF consolidé en cours...')}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-800 dark:text-slate-200 text-xs font-semibold shadow-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-indigo-600" />
            <span>Exporter PDF</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="vista-card p-5">
          <span className="text-xs font-semibold text-slate-500">Impressions Totales</span>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">1,489,200</p>
          <span className="text-xs text-emerald-500 font-semibold flex items-center gap-1 mt-1">
            <ArrowUpRight className="w-3 h-3" /> +18.2% vs période précédente
          </span>
        </div>

        <div className="vista-card p-5">
          <span className="text-xs font-semibold text-slate-500">Taux d&apos;engagement Moyen</span>
          <p className="text-2xl font-black text-indigo-600 mt-1">4.65%</p>
          <span className="text-xs text-emerald-500 font-semibold flex items-center gap-1 mt-1">
            <ArrowUpRight className="w-3 h-3" /> +0.8% d&apos;optimisation
          </span>
        </div>

        <div className="vista-card p-5">
          <span className="text-xs font-semibold text-slate-500">Total Clics sur Liens</span>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">32,450</p>
          <span className="text-xs text-emerald-500 font-semibold flex items-center gap-1 mt-1">
            <ArrowUpRight className="w-3 h-3" /> +24% via Vista Pages
          </span>
        </div>

        <div className="vista-card p-5">
          <span className="text-xs font-semibold text-slate-500">Nouveaux Abonnés Net</span>
          <p className="text-2xl font-black text-purple-600 mt-1">+6,780</p>
          <span className="text-xs text-slate-400 font-semibold flex items-center gap-1 mt-1">
            TikTok (+4.2k) en tête
          </span>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Audience Growth Evolution (7 cols) */}
        <div className="lg:col-span-7 vista-card p-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Évolution de l&apos;Audience par Réseau
              </h3>
              <p className="text-xs text-slate-400">Croissance nette des abonnés</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-pink-500" /> Instagram</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-600" /> LinkedIn</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-cyan-400" /> TikTok</span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={growthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '0.75rem',
                    color: '#ffffff',
                    fontSize: '12px',
                  }}
                />
                <Line type="monotone" dataKey="TikTok" stroke="#22d3ee" strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="Instagram" stroke="#ec4899" strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="LinkedIn" stroke="#2563eb" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Engagements by Platform (5 cols) */}
        <div className="lg:col-span-5 vista-card p-6">
          <div className="pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Engagements par Plateforme
            </h3>
            <p className="text-xs text-slate-400">Interactions & Taux d&apos;engagement</p>
          </div>

          <div className="space-y-4">
            {channelEngagementData.map((item) => (
              <div key={item.channel} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{item.channel}</span>
                  <span className="font-bold text-indigo-600">{item.engagements.toLocaleString()} ({item.rate})</span>
                </div>
                <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-600 rounded-full"
                    style={{ width: `${Math.min(100, (item.engagements / 30000) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Performing Publications Table */}
      <div className="vista-card p-6">
        <div className="pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
          <h3 className="font-bold text-base text-slate-900 dark:text-white">
            Classement des Meilleurs Posts (Top Engagements)
          </h3>
          <p className="text-xs text-slate-400">Performances triées par résonance d&apos;audience</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                <th className="pb-3">Publication</th>
                <th className="pb-3">Type</th>
                <th className="pb-3">Portée</th>
                <th className="pb-3">J&apos;aime</th>
                <th className="pb-3">Commentaires</th>
                <th className="pb-3">Taux</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {INITIAL_POSTS.map((post, idx) => (
                <tr key={post.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 pr-4 max-w-sm">
                    <div className="flex items-center gap-3">
                      {post.media_urls[0] && (
                        <img src={post.media_urls[0]} alt="" className="w-10 h-10 rounded-xl object-cover shrink-0" />
                      )}
                      <p className="line-clamp-2 text-slate-800 dark:text-slate-200 font-medium">
                        {post.content}
                      </p>
                    </div>
                  </td>
                  <td className="py-3.5 capitalize font-semibold text-slate-600 dark:text-slate-400">{post.post_type}</td>
                  <td className="py-3.5 font-bold text-slate-900 dark:text-white">{(45000 - idx * 8000).toLocaleString()}</td>
                  <td className="py-3.5 text-slate-600 dark:text-slate-400">{(2400 - idx * 500).toLocaleString()}</td>
                  <td className="py-3.5 text-slate-600 dark:text-slate-400">{182 - idx * 40}</td>
                  <td className="py-3.5 font-bold text-emerald-500">{(6.8 - idx * 0.9).toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

