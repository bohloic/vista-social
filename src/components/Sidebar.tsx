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
  CreditCard,
  Zap,
  LogOut,
  X,
  Briefcase,
} from 'lucide-react';

interface SidebarProps {
  onOpenComposer?: () => void;
  isOpen?: boolean;
  onClose?: () => void;
}

const navItems = [
  { href: '/', label: 'Tableau de bord', icon: LayoutDashboard },
  { href: '/chat', label: 'Chat IA (PulseAI)', icon: Sparkles, badge: 'Vocal' },
  { href: '/publish', label: 'Planificateur', icon: Calendar, badge: 'Smart' },
  { href: '/inbox', label: 'Boîte de réception', icon: Inbox },
  { href: '/crm', label: 'Pipeline CRM', icon: Briefcase, badge: 'Kanban' },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/listening', label: 'Listening & Veille', icon: Radio },
  { href: '/reviews', label: 'Avis Clients', icon: Star },
  { href: '/pulse-pages', label: 'Pulse Pages (Bio)', icon: Globe2, badge: 'IA' },
  { href: '/billing', label: 'Abonnement & MoMo', icon: CreditCard, badge: 'FCFA' },
  { href: '/settings', label: 'Paramètres & Comptes', icon: Settings },
];

export function Sidebar({ onOpenComposer, isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();

  const handleLinkClick = () => {
    if (onClose) onClose();
  };

  return (
    <>
      {/* Mobile Backdrop overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden transition-opacity animate-in fade-in"
          aria-hidden="true"
        />
      )}

      {/* Main Sidebar Container */}
      <aside
        className={`bg-[#090C14] text-slate-200 min-h-screen flex flex-col border-r border-slate-800/80 shrink-0 select-none z-50 transition-transform duration-300 ease-in-out ${
          isOpen
            ? 'fixed inset-y-0 left-0 w-72 shadow-2xl translate-x-0'
            : 'hidden lg:flex lg:w-64 lg:static lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-600 via-indigo-500 to-emerald-400 flex items-center justify-center font-black text-white shadow-lg shadow-violet-600/30">
              <Zap className="w-5 h-5 fill-white" />
            </div>
            <div>
              <h1 className="font-black text-base text-white tracking-tight flex items-center gap-1.5">
                <span>Pulse</span>
                <span className="text-violet-400">Social</span>
                <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
                  PRO
                </span>
              </h1>
              <p className="text-[11px] text-slate-400">Plateforme CM &amp; IA</p>
            </div>
          </div>

          {/* Close button visible only on mobile drawer */}
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 lg:hidden cursor-pointer"
            aria-label="Fermer le menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Primary Action Button */}
        <div className="p-4">
          <button
            onClick={() => {
              if (onOpenComposer) onOpenComposer();
              if (onClose) onClose();
            }}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-violet-600/30 transition-all duration-300 active:scale-[0.98] cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Nouveau Post</span>
            <Sparkles className="w-3.5 h-3.5 text-yellow-300 animate-pulse ml-auto" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={handleLinkClick}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-violet-600/20 text-violet-300 border border-violet-500/30 shadow-inner'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-violet-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                      item.badge === 'Smart'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : item.badge === 'IA'
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                        : item.badge === 'FCFA'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-violet-600 text-white'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer System Status & Logout */}
        <div className="p-4 border-t border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-slate-300 font-semibold">Pulse Engine v2.0</span>
            </div>
            <span className="text-violet-400 font-mono text-[10px]">100% Réel</span>
          </div>

          <button
            onClick={async () => {
              try {
                await fetch('/api/auth/logout', { method: 'POST' });
                if (typeof window !== 'undefined') {
                  localStorage.removeItem('pulsesocial_user');
                  window.location.href = '/login';
                }
              } catch {
                window.location.href = '/login';
              }
            }}
            className="w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>
    </>
  );
}
