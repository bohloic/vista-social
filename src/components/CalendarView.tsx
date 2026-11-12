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
        return 'badge-instagram';
      case 'linkedin':
        return 'badge-linkedin';
      case 'twitter':
        return 'badge-twitter';
      case 'tiktok':
        return 'badge-tiktok';
      default:
        return 'badge-facebook';
    }
  };

  return (
    <div className="vista-card p-6 shadow-sm">
      {/* Calendar Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-100 dark:border-slate-800 gap-4">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white capitalize" suppressHydrationWarning={true}>
            {format(currentDate, 'MMMM yyyy', { locale: fr })}
          </h3>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-semibold border border-indigo-200 dark:border-indigo-800">
            {posts.filter((p) => p.status === 'scheduled').length} en attente
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
          >
            Aujourd&apos;hui
          </button>
          <div className="flex items-center rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <button
              onClick={() => setCurrentDate(subMonths(currentDate, 1))}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
              aria-label="Mois précédent"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentDate(addMonths(currentDate, 1))}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
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

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-2">
        {days.map((day, dayIdx) => {
          const isSelectedMonth = isSameMonth(day, monthStart);
          const isToday = isSameDay(day, new Date());
          const dayPosts = posts.filter((p) => isSameDay(new Date(p.scheduled_for), day));

          return (
            <div
              key={day.toISOString()}
              className={`min-h-[125px] p-2 rounded-2xl border transition-all flex flex-col group relative ${
                isSelectedMonth
                  ? isToday
                    ? 'border-indigo-500 bg-indigo-50/20 dark:bg-indigo-950/20 shadow-sm'
                    : 'border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-slate-300'
                  : 'border-transparent bg-slate-50/40 dark:bg-slate-900/20 opacity-40'
              }`}
            >
              {/* Day Header */}
              <div className="flex items-center justify-between mb-1.5">
                <span
                  className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                    isToday
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {format(day, 'd')}
                </span>

                {/* Add post button on hover */}
                <button
                  onClick={() => onNewPostWithDate(day)}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-sm active:scale-95"
                  title="Planifier pour ce jour"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>

              {/* Scheduled Posts in Cell */}
              <div className="flex-1 space-y-1 overflow-y-auto max-h-[85px]">
                {dayPosts.map((post) => {
                  const targetAccounts = accounts.filter((a) =>
                    post.target_accounts.includes(a.id)
                  );

                  return (
                    <div
                      key={post.id}
                      onClick={() => onSelectPost(post)}
                      className={`p-1.5 rounded-xl text-[10px] cursor-pointer transition-all border ${
                        post.status === 'published'
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                          : post.status === 'draft'
                          ? 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600'
                          : 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200 hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="font-semibold flex items-center gap-1" suppressHydrationWarning={true}>
                          <Clock className="w-2.5 h-2.5" />
                          {format(new Date(post.scheduled_for), 'HH:mm')}
                        </span>
                        <div className="flex items-center gap-0.5">
                          {targetAccounts.map((acc) => (
                            <span
                              key={acc.id}
                              className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[7px] font-bold ${getPlatformBadge(
                                acc.platform
                              )}`}
                            >
                              {acc.platform.slice(0, 2)}
                            </span>
                          ))}
                        </div>
                      </div>
                      <p className="line-clamp-1 leading-snug font-medium text-[10px]">
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

