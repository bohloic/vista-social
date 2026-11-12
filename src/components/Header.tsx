'use client';

import React, { useState } from 'react';
import { Bell, Search, ChevronDown, Sparkles, CheckCircle2, ShieldCheck } from 'lucide-react';

interface HeaderProps {
  onOpenComposer: () => void;
  title?: string;
  subtitle?: string;
}

export function Header({ onOpenComposer, title, subtitle }: HeaderProps) {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(3);

  const notifications = [
    { id: 1, text: "Post Instagram programmé publié avec succès !", time: "Il y a 10 min", icon: CheckCircle2, color: "text-emerald-500" },
    { id: 2, text: "Nouveau message de Élodie Fontaine dans la boîte unifiée", time: "Il y a 25 min", icon: Bell, color: "text-indigo-500" },
    { id: 3, text: "Pic de mentions détecté sur TikTok (+340% ce matin)", time: "Il y a 1h", icon: Sparkles, color: "text-purple-500" }
  ];

  return (
    <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 flex items-center justify-between z-10 sticky top-0">
      {/* Page Title & Breadcrumb */}
      <div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
          {title || "Vue d'ensemble"}
        </h2>
        {subtitle && (
          <p className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
        )}
      </div>

      {/* Global Actions */}
      <div className="flex items-center gap-4">
        {/* Search Input */}
        <div className="relative hidden md:block">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher un post, un message..."
            className="pl-9 pr-4 py-1.5 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 w-64 transition-all"
          />
        </div>

        {/* Notifications Popover */}
        <div className="relative">
          <button
            onClick={() => {
              setNotificationsOpen(!notificationsOpen);
              if (unreadCount > 0) setUnreadCount(0);
            }}
            className="relative p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
            )}
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-3 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 mb-2">
                <span className="text-xs font-bold text-slate-900 dark:text-white">Notifications récentes</span>
                <span className="text-[10px] text-slate-400">Tout marquer comme lu</span>
              </div>
              <div className="space-y-2">
                {notifications.map((n) => {
                  const Icon = n.icon;
                  return (
                    <div key={n.id} className="flex items-start gap-2.5 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                      <Icon className={`w-4 h-4 shrink-0 mt-0.5 ${n.color}`} />
                      <div className="flex-1">
                        <p className="text-xs text-slate-800 dark:text-slate-200">{n.text}</p>
                        <span className="text-[10px] text-slate-400">{n.time}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Workspace Dropdown */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 text-white font-bold flex items-center justify-center text-xs shadow-md">
            SN
          </div>
          <div className="hidden sm:block text-left">
            <span className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-1">
              Studio Nova
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </span>
            <span className="text-[10px] text-emerald-500 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> Espace Vérifié
            </span>
          </div>
        </div>

        {/* Primary New Post Trigger */}
        <button
          onClick={onOpenComposer}
          className="hidden sm:flex items-center gap-2 py-1.5 px-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 active:scale-95 transition-all"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Composer</span>
        </button>
      </div>
    </header>
  );
}

