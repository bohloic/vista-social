'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Bell,
  Search,
  ChevronDown,
  Sparkles,
  CheckCircle2,
  ShieldCheck,
  CreditCard,
  Zap,
  LogOut,
  Settings,
  User,
} from 'lucide-react';

interface HeaderProps {
  onOpenComposer: () => void;
  title?: string;
  subtitle?: string;
}

interface UserProfileState {
  fullName: string;
  email: string;
  role: string;
  workspaceName: string;
}

export function Header({ onOpenComposer, title, subtitle }: HeaderProps) {
  const router = useRouter();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(1);
  const [user, setUser] = useState<UserProfileState>({
    fullName: 'Super-Admin',
    email: 'admin@pulsesocial.app',
    role: 'super_admin',
    workspaceName: 'Pulse Studio',
  });

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 1. Fetch active user info
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated && data.user) {
            setUser({
              fullName: data.user.fullName || 'Super-Admin',
              email: data.user.email || 'admin@pulsesocial.app',
              role: data.user.role || 'super_admin',
              workspaceName: data.user.workspace?.name || 'Pulse Studio',
            });
          }
        }
      } catch (err) {
        console.warn('Could not load user profile in header');
      }
    };
    fetchUser();

    // 2. Click outside listener
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      if (typeof window !== 'undefined') {
        localStorage.removeItem('pulsesocial_user');
        window.location.href = '/login';
      }
    } catch (err) {
      console.error('Logout error:', err);
      window.location.href = '/login';
    }
  };

  const notifications = [
    {
      id: 1,
      text: 'Plateforme PulseSocial connectée à votre base Supabase temps réel.',
      time: 'Actif',
      icon: CheckCircle2,
      color: 'text-emerald-400',
    },
    {
      id: 2,
      text: 'Paiements Mobile Money (Orange, MTN, Wave, Moov) prêts pour la monétisation.',
      time: 'Disponible',
      icon: CreditCard,
      color: 'text-violet-400',
    },
  ];

  const initials = user.fullName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase() || 'PS';

  return (
    <header className="h-16 border-b border-slate-800/80 bg-[#090C14]/80 backdrop-blur-xl px-6 flex items-center justify-between z-30 sticky top-0 selection:bg-violet-500 selection:text-white">
      {/* Page Title & Breadcrumb */}
      <div>
        <h2 className="text-base sm:text-lg font-black text-white leading-tight flex items-center gap-2">
          <span>{title || "Tableau de bord"}</span>
        </h2>
        {subtitle && (
          <p className="text-[11px] text-slate-400 hidden sm:block">{subtitle}</p>
        )}
      </div>

      {/* Global Actions */}
      <div className="flex items-center gap-3.5">
        {/* Search Input */}
        <div className="relative hidden md:block">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Rechercher publications, analytics..."
            className="pl-9 pr-4 py-1.5 text-xs rounded-xl bg-slate-900/60 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 w-56 transition-all"
          />
        </div>

        {/* Mobile Money Direct CTA */}
        <Link
          href="/billing"
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-950/60 hover:bg-violet-900/60 border border-violet-800/40 text-violet-300 text-xs font-bold transition-all shadow-sm"
        >
          <CreditCard className="w-3.5 h-3.5 text-amber-400" />
          <span>Mobile Money</span>
        </Link>

        {/* Notifications Popover */}
        <div className="relative">
          <button
            onClick={() => {
              setNotificationsOpen(!notificationsOpen);
              if (unreadCount > 0) setUnreadCount(0);
            }}
            className="relative p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors cursor-pointer"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-violet-500 animate-ping" />
            )}
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-slate-900/95 backdrop-blur-2xl border border-slate-800 rounded-2xl shadow-2xl p-3 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-2">
                <span className="text-xs font-bold text-white">Notifications Système</span>
                <span className="text-[10px] text-slate-500">En direct</span>
              </div>
              <div className="space-y-2">
                {notifications.map((n) => {
                  const Icon = n.icon;
                  return (
                    <div
                      key={n.id}
                      className="flex items-start gap-2.5 p-2 rounded-xl hover:bg-slate-800/60 transition-colors"
                    >
                      <Icon className={`w-4 h-4 shrink-0 mt-0.5 ${n.color}`} />
                      <div className="flex-1">
                        <p className="text-xs text-slate-200">{n.text}</p>
                        <span className="text-[10px] text-slate-500">{n.time}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* User Profile & Logout Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            className="flex items-center gap-2.5 pl-3 border-l border-slate-800 hover:opacity-90 transition-opacity cursor-pointer"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white font-black flex items-center justify-center text-xs shadow-md shadow-violet-600/20">
              {initials}
            </div>
            <div className="hidden sm:block text-left">
              <span className="text-xs font-bold text-white flex items-center gap-1">
                {user.fullName}
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </span>
              <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-semibold">
                <ShieldCheck className="w-3 h-3" /> Accès à vie
              </span>
            </div>
          </button>

          {profileDropdownOpen && (
            <div className="absolute right-0 mt-3 w-64 bg-slate-900/95 backdrop-blur-2xl border border-slate-800 rounded-2xl shadow-2xl p-2.5 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="p-2.5 border-b border-slate-800/80 mb-1.5 space-y-0.5">
                <p className="font-bold text-xs text-white leading-tight">{user.fullName}</p>
                <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
                <div className="pt-1 flex items-center gap-1.5">
                  <span className="text-[9px] uppercase font-bold px-1.5 py-0.2 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                    Super-Admin
                  </span>
                  <span className="text-[9px] text-slate-500">
                    {user.workspaceName}
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <Link
                  href="/settings"
                  onClick={() => setProfileDropdownOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors"
                >
                  <Settings className="w-3.5 h-3.5 text-violet-400" />
                  <span>Paramètres & Tokens API</span>
                </Link>

                <Link
                  href="/billing"
                  onClick={() => setProfileDropdownOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors"
                >
                  <CreditCard className="w-3.5 h-3.5 text-amber-400" />
                  <span>Abonnements & Mobile Money</span>
                </Link>

                <div className="pt-1 border-t border-slate-800/80 mt-1">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Déconnexion sécurisée</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
