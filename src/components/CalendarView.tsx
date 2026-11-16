'use client';

import React, { useState } from 'react';
import { Post, SocialAccount } from '@/lib/types';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
} from 'date-fns';
import { fr } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Plus, Clock, CheckCircle2, FileEdit } from 'lucide-react';

interface CalendarViewProps {
  posts: Post[];
  accounts: SocialAccount[];
  onNewPostWithDate: (date: Date) => void;
  onSelectPost: (post: Post) => void;
}

export function CalendarView({ posts, accounts, onNewPostWithDate, onSelectPost }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const getPlatformBadge = (platform: string) => {
    switch (platform) {
      case 'instagram':
        return 'bg-gradient-to-r from-amber-500 to-pink-500 text-white';
      case 'linkedin':
        return 'bg-blue-600 text-white';
      case 'twitter':
        return 'bg-slate-700 text-white';
      case 'tiktok':
        return 'bg-slate-900 border border-teal-400/40 text-teal-300';
      default:
        return 'bg-indigo-600 text-white';
    }
  };

  const scheduledCount = posts.filter((p) => p.status === 'scheduled').length;

  return (
    <div className="pulse-card p-6 shadow-sm border border-slate-800 bg-slate-900/60">
      {/* Calendar Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-800 gap-4">
        <div className="flex items-center gap-3">
          <h3 className="text-xl font-black text-white capitalize tracking-tight" suppressHydrationWarning={true}>
            {format(currentDate, 'MMMM yyyy', { locale: fr })}
          </h3>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-violet-500/15 text-violet-300 font-semibold border border-violet-500/30">
            {scheduledCount} en attente
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-200 transition-colors cursor-pointer"
          >
            Aujourd&apos;hui
          </button>
          <div className="flex items-center rounded-xl border border-slate-700 overflow-hidden bg-slate-800/80">
            <button
              onClick={() => setCurrentDate(subMonths(currentDate, 1))}
              className="p-1.5 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
              aria-label="Mois précédent"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentDate(addMonths(currentDate, 1))}
              className="p-1.5 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
              aria-label="Mois suivant"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Weekdays row */}
      <div className="grid grid-cols-7 gap-px pt-4 text-center text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
        <span>Lun</span>
        <span>Mar</span>
        <span>Mer</span>
        <span>Jeu</span>
        <span>Ven</span>
        <span>Sam</span>
        <span>Dim</span>
      </div>

      {/* Days Grid (Harmonious Dark Theme, zero pure white blinding tiles) */}
      <div className="grid grid-cols-7 gap-2">
        {days.map((day) => {
          const isSelectedMonth = isSameMonth(day, monthStart);
          const isToday = isSameDay(day, new Date());
          const dayPosts = posts.filter((p) => isSameDay(new Date(p.scheduled_for), day));

          return (
            <div
              key={day.toISOString()}
              className={`min-h-[125px] p-2 rounded-2xl border transition-all flex flex-col group relative ${
                isSelectedMonth
                  ? isToday
                    ? 'border-violet-500 bg-violet-950/20 shadow-md shadow-violet-500/10'
                    : 'border-slate-800/90 bg-slate-900/80 hover:border-violet-500/40 text-slate-100'
                  : 'border-slate-900/50 bg-slate-950/40 opacity-40'
              }`}
            >
              {/* Day Header */}
              <div className="flex items-center justify-between mb-1.5">
                <span
                  className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                    isToday
                      ? 'bg-violet-600 text-white shadow-sm font-black'
                      : 'text-slate-300 group-hover:text-white'
                  }`}
                >
                  {format(day, 'd')}
                </span>

                {/* Add post button on hover */}
                <button
                  onClick={() => onNewPostWithDate(day)}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded-lg bg-violet-600 hover:bg-violet-500 text-white transition-all shadow-sm active:scale-95 cursor-pointer"
                  title="Planifier pour ce jour"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>

              {/* Scheduled Posts in Cell */}
              <div className="flex-1 space-y-1 overflow-y-auto max-h-[85px]">
                {dayPosts.map((post) => {
                  const targetAccounts = accounts.filter((a) =>
                    post.target_accounts?.includes(a.id)
                  );

                  return (
                    <div
                      key={post.id}
                      onClick={() => onSelectPost(post)}
                      className={`p-1.5 rounded-xl text-[10px] cursor-pointer transition-all border ${
                        post.status === 'published'
                          ? 'bg-emerald-950/50 border-emerald-500/30 text-emerald-200 hover:border-emerald-500'
                          : post.status === 'draft'
                          ? 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-600'
                          : 'bg-violet-950/50 border-violet-500/30 text-violet-200 hover:border-violet-500 hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="font-semibold flex items-center gap-1 text-slate-200" suppressHydrationWarning={true}>
                          <Clock className="w-2.5 h-2.5 text-violet-400" />
                          {format(new Date(post.scheduled_for), 'HH:mm')}
                        </span>
                        <div className="flex items-center gap-0.5">
                          {targetAccounts.map((acc) => (
                            <span
                              key={acc.id}
                              className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[7px] font-bold ${getPlatformBadge(
                                acc.platform
                              )}`}
                              title={acc.account_name}
                            >
                              {acc.platform.slice(0, 2).toUpperCase()}
                            </span>
                          ))}
                        </div>
                      </div>
                      <p className="line-clamp-1 leading-snug font-medium text-[10px] text-slate-100">
                        {post.content}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
