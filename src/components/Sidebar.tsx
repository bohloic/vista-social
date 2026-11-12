'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Calendar,
  Inbox,
  BarChart3,
  Radio,
  Star,
  Globe2,
  Settings,
  PlusCircle,
  Sparkles,
} from 'lucide-react';

interface SidebarProps {
  onOpenComposer?: () => void;
}

const navItems = [
  { href: '/', label: 'Tableau de bord', icon: LayoutDashboard },
  { href: '/publish', label: 'Planificateur', icon: Calendar, badge: 'Smart' },
  { href: '/inbox', label: 'Boîte de réception', icon: Inbox, badge: '3' },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/listening', label: 'Listening & Veille', icon: Radio },
  { href: '/reviews', label: 'Avis Clients', icon: Star },
  { href: '/vista-pages', label: 'Vista Pages (Bio)', icon: Globe2, badge: 'New' },
  { href: '/settings', label: 'Paramètres & Comptes', icon: Settings },
];

export function Sidebar({ onOpenComposer }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-slate-900 text-slate-200 min-h-screen flex flex-col border-r border-slate-800 shrink-0 select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20">
            V
          </div>
          <div>
            <h1 className="font-bold text-base text-white tracking-tight flex items-center gap-1.5">
              Vista Social <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300">CM Pro</span>
            </h1>
            <p className="text-xs text-slate-400">Studio Nova Agency</p>
          </div>
        </div>
      </div>

      {/* Primary Action Button */}
      <div className="p-4">
        <button
          onClick={onOpenComposer}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium text-sm shadow-lg shadow-indigo-600/30 transition-all duration-200 active:scale-[0.98]"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Nouveau Post</span>
          <Sparkles className="w-3.5 h-3.5 text-yellow-300 animate-pulse ml-auto" />
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-2 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-indigo-600/15 text-indigo-400 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    item.badge === 'Smart'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : item.badge === 'New'
                      ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                      : 'bg-indigo-500 text-white'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Connected Accounts Quick Bar */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
          <span>Réseaux connectés</span>
          <span className="text-emerald-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            5 actifs
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-6 h-6 rounded-full badge-instagram flex items-center justify-center text-[10px] font-bold">IG</span>
          <span className="w-6 h-6 rounded-full badge-linkedin flex items-center justify-center text-[10px] font-bold">in</span>
          <span className="w-6 h-6 rounded-full badge-twitter flex items-center justify-center text-[10px] font-bold">X</span>
          <span className="w-6 h-6 rounded-full badge-tiktok flex items-center justify-center text-[10px] font-bold">TT</span>
          <span className="w-6 h-6 rounded-full badge-facebook flex items-center justify-center text-[10px] font-bold">fb</span>
        </div>
      </div>
    </aside>
  );
}

