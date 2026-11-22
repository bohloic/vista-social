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
  CreditCard,
  Zap,
  LogOut,
  X,
  Briefcase,
  Layers,
} from 'lucide-react';
import { ClayPiggyBankIcon } from '@/components/Clay3DIcons';

interface SidebarProps {
  onOpenComposer?: () => void;
  isOpen?: boolean;
  onClose?: () => void;
}

const navItems = [
  { href: '/', label: 'Tableau de bord', icon: LayoutDashboard },
  { href: '/chat', label: 'Copilote Vocal Pulse', icon: Layers, badge: 'Vocal' },
  { href: '/publish', label: 'Planificateur', icon: Calendar, badge: 'Smart' },
  { href: '/inbox', label: 'Boîte de réception', icon: Inbox },
  { href: '/crm', label: 'Pipeline CRM', icon: Briefcase, badge: 'Kanban' },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/listening', label: 'Listening & Veille', icon: Radio },
  { href: '/reviews', label: 'Avis Clients', icon: Star },
  { href: '/pulse-pages', label: 'Pulse Pages (Bio)', icon: Globe2 },
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
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden transition-opacity animate-in fade-in"
          aria-hidden="true"
        />
      )}

      {/* Main Sidebar Container (Claymorphism Pure White) */}
      <aside
        className={`bg-white text-slate-700 min-h-screen flex flex-col border-r border-slate-200/90 shadow-[0_10px_35px_rgba(118,97,163,0.06)] shrink-0 select-none z-50 transition-transform duration-300 ease-in-out ${
          isOpen
            ? 'fixed inset-y-0 left-0 w-72 shadow-2xl translate-x-0'
            : 'hidden lg:flex lg:w-64 lg:static lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#6366F1] via-[#7C3AED] to-[#A855F7] flex items-center justify-center font-black text-white shadow-md shadow-indigo-500/25">
              <Zap className="w-5 h-5 fill-white" />
            </div>
            <div>
              <h1 className="font-extrabold text-base text-slate-900 tracking-tight flex items-center gap-1.5">
                <span>Pulse</span>
                <span className="text-[#6366F1]">Social</span>
                <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-200">
                  PRO
                </span>
              </h1>
              <p className="text-[11px] text-slate-500 font-medium">Community Management</p>
            </div>
          </div>

          {/* Close button visible only on mobile drawer */}
          <button
            type="button"
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 lg:hidden cursor-pointer"
            aria-label="Fermer le menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Primary Action Button (Smooth Claymorphism Gradient) */}
        <div className="p-4">
          <button
            onClick={() => {
              if (onOpenComposer) onOpenComposer();
              if (onClose) onClose();
            }}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-[#6366F1] hover:bg-[#4F46E5] text-white font-bold text-xs shadow-lg shadow-indigo-500/25 transition-all duration-300 active:scale-[0.98] cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Nouveau Post</span>
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
                className={`min-h-[44px] flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-[#6366F1] text-white shadow-md shadow-indigo-500/25'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : item.badge === 'Smart'
                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                        : item.badge === 'Vocal'
                        ? 'bg-purple-50 text-purple-600 border border-purple-200'
                        : item.badge === 'FCFA'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-indigo-50 text-indigo-600 border border-indigo-200'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* 3D Goal Card (Direct inspiration from FinTrack: Save more, Achieve more!) */}
        <div className="p-4 mx-3 mb-3 rounded-2xl bg-gradient-to-br from-[#7C3AED] via-[#6366F1] to-[#4F46E5] text-white shadow-lg shadow-indigo-500/20 relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div className="space-y-1 max-w-[130px]">
              <p className="text-[11px] font-bold text-indigo-100 uppercase tracking-wider">Objectif Mensuel</p>
              <h4 className="text-xs font-extrabold leading-tight">Augmentez votre portée</h4>
              <p className="text-[10px] text-indigo-200 leading-tight">Campagnes multi-réseaux</p>
            </div>
            <ClayPiggyBankIcon className="w-12 h-12 shrink-0 drop-shadow-md" />
          </div>
          <button
            onClick={() => {
              if (onOpenComposer) onOpenComposer();
            }}
            className="mt-3 w-full py-1.5 px-3 rounded-xl bg-white text-[#6366F1] hover:bg-indigo-50 text-[11px] font-bold shadow-sm transition-colors text-center cursor-pointer"
          >
            Créer un Post
          </button>
        </div>

        {/* Footer System Status & Logout */}
        <div className="p-4 border-t border-slate-100 space-y-2">
          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-slate-700 font-semibold">Pulse Engine v2.0</span>
            </div>
            <span className="text-indigo-600 font-semibold text-[10px]">100% En Ligne</span>
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
            className="w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 transition-all cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>
    </>
  );
}
