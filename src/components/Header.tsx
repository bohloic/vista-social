'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
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
  Menu,
  X,
  Calendar,
  Globe2,
  MessageSquare,
  BarChart3,
  Radio,
  Star,
  Briefcase,
} from 'lucide-react';

interface HeaderProps {
  onOpenComposer: () => void;
  onToggleMobileMenu?: () => void;
  title?: string;
  subtitle?: string;
}

interface UserProfileState {
  fullName: string;
  email: string;
  role: string;
  workspaceName: string;
}

const PAGE_METADATA: Record<string, { title: string; subtitle: string }> = {
  '/': {
    title: 'Tableau de bord',
    subtitle: 'Vue d’ensemble des performances et publications',
  },
  '/chat': {
    title: 'Chat IA & Copilote Vocal',
    subtitle: 'Assistant exécutif Gemini (Voix, 10 fichiers max, actions directes)',
  },
  '/publish': {
    title: 'Planificateur & Calendrier',
    subtitle: 'Programmation et automatisation multi-réseaux',
  },
  '/inbox': {
    title: 'Boîte de réception & Radar',
    subtitle: 'Détection d’intentions d’achat et conversations clients unifiées',
  },
  '/crm': {
    title: 'Pipeline de Vente & Mini-CRM',
    subtitle: 'Suivi des prospects chauds, devis et clôtures de paiements Mobile Money',
  },
  '/analytics': {
    title: 'Analyses & Performances',
    subtitle: 'Impact cross-canal, croissance et taux d’engagement',
  },
  '/listening': {
    title: 'Listening & Veille',
    subtitle: 'Surveillance de marque et alertes sectorielles en direct',
  },
  '/reviews': {
    title: 'Avis Clients',
    subtitle: 'Gestion des avis Google, Yelp, Facebook et e-réputation',
  },
  '/pulse-pages': {
    title: 'Pulse Pages (Bio)',
    subtitle: 'Constructeur de micro-pages d’atterrissage pour créateurs',
  },
  '/billing': {
    title: 'Abonnement & Mobile Money',
    subtitle: 'Facturation Orange Money, MTN MoMo, Wave et Moov',
  },
  '/settings': {
    title: 'Paramètres & Comptes',
    subtitle: 'Gestion des réseaux connectés, rôles d’équipe et clés API',
  },
};

const SEARCH_ITEMS = [
  { label: 'Planificateur de publications', href: '/publish', icon: Calendar, category: 'Module' },
  { label: 'Boîte de réception unifiée & Radar', href: '/inbox', icon: MessageSquare, category: 'Module' },
  { label: 'Pipeline de Vente & Mini-CRM', href: '/crm', icon: Briefcase, category: 'Module' },
  { label: 'Rapports d’audience & Analytics', href: '/analytics', icon: BarChart3, category: 'Module' },
  { label: 'Surveillance de marque & Listening', href: '/listening', icon: Radio, category: 'Module' },
  { label: 'Avis clients & E-réputation', href: '/reviews', icon: Star, category: 'Module' },
  { label: 'Pulse Pages (Link-in-Bio)', href: '/pulse-pages', icon: Globe2, category: 'Module' },
  { label: 'Paiements Mobile Money', href: '/billing', icon: CreditCard, category: 'Facturation' },
  { label: 'Comptes réseaux sociaux', href: '/settings', icon: Settings, category: 'Paramètres' },
];

export function Header({ onOpenComposer, onToggleMobileMenu, title: propTitle, subtitle: propSubtitle }: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname() || '/';

  const [activeDropdown, setActiveDropdown] = useState<'notifications' | 'profile' | 'search' | null>(null);
  const [unreadCount, setUnreadCount] = useState(1);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [user, setUser] = useState<UserProfileState | null>(null);

  // Search input state
  const [searchQuery, setSearchQuery] = useState('');

  const headerRef = useRef<HTMLDivElement>(null);

  // Automatically derive page title & subtitle from pathname
  const currentMeta = PAGE_METADATA[pathname] || {
    title: propTitle || 'Tableau de bord',
    subtitle: propSubtitle || 'Plateforme PulseSocial',
  };

  const currentTitle = propTitle || currentMeta.title;
  const currentSubtitle = propSubtitle || currentMeta.subtitle;

  // 1. Fetch user on mount
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated && data.user) {
            setUser({
              fullName: data.user.fullName || 'Admin',
              email: data.user.email || 'admin@pulsesocial.app',
              role: data.user.role || 'super_admin',
              workspaceName: data.user.workspace?.name || 'Pulse Studio',
            });
          }
        }
      } catch (err) {
        console.warn('Could not load user profile in header:', err);
      } finally {
        setIsLoadingUser(false);
      }
    };
    fetchUser();
  }, []);

  // 2. Click outside listener to close dropdowns
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 3. Reset open dropdowns on pathname change
  useEffect(() => {
    setActiveDropdown(null);
    setSearchQuery('');
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      if (typeof window !== 'undefined') {
        localStorage.removeItem('pulsesocial_user');
        window.location.href = '/login';
      }
    } catch {
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
      text: 'Paiements Mobile Money (Orange, MTN, Wave, Moov) prêts pour la facturation.',
      time: 'Disponible',
      icon: CreditCard,
      color: 'text-violet-400',
    },
  ];

  const initials = user?.fullName
    ? user.fullName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase()
    : 'PS';

  const filteredSearchResults = SEARCH_ITEMS.filter((item) =>
    item.label.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (filteredSearchResults.length > 0) {
        router.push(filteredSearchResults[0].href);
        setActiveDropdown(null);
      }
    }
  };

  return (
    <header
      ref={headerRef}
      className="h-16 border-b border-slate-200/80 bg-white/95 backdrop-blur-xl px-4 sm:px-6 flex items-center justify-between z-30 sticky top-0 select-none text-slate-800 shadow-[0_2px_15px_rgba(0,0,0,0.02)]"
    >
      {/* Left: Mobile Hamburger & Page Title */}
      <div className="flex items-center gap-3 min-w-0">
        {/* Mobile Hamburger Button */}
        <button
          type="button"
          onClick={onToggleMobileMenu}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 lg:hidden cursor-pointer"
          aria-label="Ouvrir le menu de navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="min-w-0">
          <h2 className="text-sm sm:text-base lg:text-lg font-black text-slate-900 leading-tight flex items-center gap-2 truncate">
            <span>{currentTitle}</span>
          </h2>
          {currentSubtitle && (
            <p className="text-[11px] text-slate-500 hidden sm:block truncate">{currentSubtitle}</p>
          )}
        </div>
      </div>

      {/* Right: Global Actions & Dropdowns */}
      <div className="flex items-center gap-2 sm:gap-3.5">
        {/* Active Search Input with Auto-complete Dropdown (Claymorphism Pill) */}
        <div className="relative hidden md:block">
          <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher un post, un réseau, une page..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setActiveDropdown(e.target.value.trim() ? 'search' : null);
            }}
            onFocus={() => {
              if (searchQuery.trim()) setActiveDropdown('search');
            }}
            onKeyDown={handleSearchKeyDown}
            className="pl-9 pr-4 py-2 text-xs rounded-full bg-slate-100/90 border border-slate-200/80 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#6366F1] focus:bg-white w-64 lg:w-80 transition-all shadow-inner"
          />

          {/* Search Dropdown Results */}
          {activeDropdown === 'search' && (
            <div className="absolute left-0 mt-2 w-80 bg-white border border-slate-200 rounded-2xl shadow-xl p-2 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                Résultats suggérés
              </div>
              <div className="space-y-1 mt-1 max-h-60 overflow-y-auto">
                {filteredSearchResults.length === 0 ? (
                  <p className="p-3 text-xs text-slate-400 text-center">Aucun résultat trouvé pour &quot;{searchQuery}&quot;</p>
                ) : (
                  filteredSearchResults.map((item, idx) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={idx}
                        href={item.href}
                        onClick={() => setActiveDropdown(null)}
                        className="flex items-center justify-between p-2 rounded-xl text-xs hover:bg-slate-50 text-slate-700 hover:text-slate-900 transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon className="w-3.5 h-3.5 text-[#6366F1] shrink-0" />
                          <span>{item.label}</span>
                        </div>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 uppercase">
                          {item.category}
                        </span>
                      </Link>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Mobile Money Direct CTA */}
        <Link
          href="/billing"
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 text-xs font-bold transition-all shadow-sm"
        >
          <CreditCard className="w-3.5 h-3.5 text-amber-500" />
          <span>Mobile Money</span>
        </Link>

        {/* Notifications Popover (Claymorphic Circular Pill Button) */}
        <div className="relative">
          <button
            onClick={() => {
              setActiveDropdown(activeDropdown === 'notifications' ? null : 'notifications');
              if (unreadCount > 0) setUnreadCount(0);
            }}
            className={`relative w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer ${
              activeDropdown === 'notifications'
                ? 'bg-slate-200 text-slate-900'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900'
            }`}
            aria-label="Notifications Système"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
            )}
          </button>

          {activeDropdown === 'notifications' && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-2xl shadow-xl p-3 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
                <span className="text-xs font-bold text-slate-800">Notifications Système</span>
                <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> En direct
                </span>
              </div>
              <div className="space-y-2">
                {notifications.map((n) => {
                  const Icon = n.icon;
                  return (
                    <div
                      key={n.id}
                      className="flex items-start gap-2.5 p-2 rounded-xl hover:bg-slate-50 transition-colors"
                    >
                      <Icon className={`w-4 h-4 shrink-0 mt-0.5 text-emerald-600`} />
                      <div className="flex-1">
                        <p className="text-xs text-slate-700">{n.text}</p>
                        <span className="text-[10px] text-slate-400">{n.time}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* User Profile & Logout Dropdown (FinTrack 3D Avatar) */}
        <div className="relative">
          <button
            onClick={() => setActiveDropdown(activeDropdown === 'profile' ? null : 'profile')}
            className={`flex items-center gap-2.5 pl-2 sm:pl-3 border-l border-slate-200 hover:opacity-90 transition-opacity cursor-pointer ${
              activeDropdown === 'profile' ? 'opacity-100' : ''
            }`}
          >
            {isLoadingUser ? (
              <div className="w-9 h-9 rounded-full bg-slate-200 animate-pulse border border-slate-300" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#6366F1] via-[#8B5CF6] to-[#EC4899] text-white font-black flex items-center justify-center text-xs shadow-md shadow-indigo-500/25 ring-2 ring-white">
                {initials}
              </div>
            )}

            <div className="hidden sm:block text-left">
              {isLoadingUser ? (
                <div className="space-y-1">
                  <div className="w-20 h-3 bg-slate-200 rounded animate-pulse" />
                  <div className="w-14 h-2 bg-slate-200 rounded animate-pulse" />
                </div>
              ) : (
                <>
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                    {user?.fullName || 'Super-Admin'}
                    <ChevronDown className="w-3 h-3 text-slate-400" />
                  </span>
                  <span className="text-[10px] text-emerald-600 flex items-center gap-1 font-semibold">
                    <ShieldCheck className="w-3 h-3 text-emerald-500" /> Accès à vie
                  </span>
                </>
              )}
            </div>
          </button>

          {activeDropdown === 'profile' && user && (
            <div className="absolute right-0 mt-3 w-64 bg-white border border-slate-200 rounded-2xl shadow-xl p-2.5 z-50 animate-in fade-in slide-in-from-top-2 text-slate-800">
              <div className="p-2.5 border-b border-slate-100 mb-1.5 space-y-0.5">
                <p className="font-bold text-xs text-slate-900 leading-tight">{user.fullName}</p>
                <p className="text-[10px] text-slate-500 truncate">{user.email}</p>
                <div className="pt-1 flex items-center gap-1.5">
                  <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {user.role === 'super_admin' ? 'Super-Admin' : user.role}
                  </span>
                  <span className="text-[9px] text-slate-500">
                    {user.workspaceName}
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <Link
                  href="/settings"
                  onClick={() => setActiveDropdown(null)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition-colors"
                >
                  <Settings className="w-3.5 h-3.5 text-[#6366F1]" />
                  <span>Paramètres &amp; Tokens API</span>
                </Link>

                <Link
                  href="/billing"
                  onClick={() => setActiveDropdown(null)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition-colors"
                >
                  <CreditCard className="w-3.5 h-3.5 text-amber-500" />
                  <span>Abonnements &amp; Mobile Money</span>
                </Link>

                <div className="pt-1 border-t border-slate-100 mt-1">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
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
