'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { PulsePage, PulsePageBlock } from '@/lib/types';
import {
  Globe2,
  Plus,
  Trash2,
  ExternalLink,
  Eye,
  MousePointerClick,
  Sparkles,
  Save,
  CheckCircle2,
  Smartphone,
  RefreshCw,
  Upload,
} from 'lucide-react';

const THEME_PRESETS = [
  {
    name: 'Violet Nebula',
    gradient: 'from-violet-950 via-slate-950 to-indigo-950',
    btnBg: 'rgba(255, 255, 255, 0.08)',
    border: 'rgba(139, 92, 246, 0.3)',
  },
  {
    name: 'Obsidian Pure',
    gradient: 'from-slate-950 to-black',
    btnBg: 'rgba(255, 255, 255, 0.06)',
    border: 'rgba(255, 255, 255, 0.12)',
  },
  {
    name: 'Emerald Aurora',
    gradient: 'from-emerald-950 via-slate-950 to-teal-950',
    btnBg: 'rgba(255, 255, 255, 0.08)',
    border: 'rgba(16, 185, 129, 0.3)',
  },
  {
    name: 'Sunset Magenta',
    gradient: 'from-fuchsia-950 via-slate-950 to-rose-950',
    btnBg: 'rgba(255, 255, 255, 0.08)',
    border: 'rgba(244, 63, 94, 0.3)',
  },
];

const DEFAULT_PAGE: PulsePage = {
  id: 'pulse-default',
  workspace_id: 'ws-default',
  title: 'PulseSocial Creator Studio',
  slug: 'pulse-studio',
  bio: 'Accédez à toutes mes ressources exclusives, services et liens officiels en un seul clic.',
  avatar_url: '/logo.svg',
  theme_config: {
    bg_gradient: 'from-violet-950 via-slate-950 to-indigo-950',
    button_bg: 'rgba(255, 255, 255, 0.08)',
    button_border: 'rgba(139, 92, 246, 0.3)',
    font_family: 'sans-serif',
  },
  blocks: [
    {
      id: 'blk-1',
      type: 'link',
      title: '✨ Découvrir la plateforme PulseSocial',
      url: '/',
      subtitle: 'Gestion des réseaux sociaux avec IA Gemini',
      is_active: true,
      order_index: 0,
      click_count: 0,
    },
    {
      id: 'blk-2',
      type: 'link',
      title: '📱 Forfaits & Abonnements Mobile Money',
      url: '/billing',
      subtitle: 'Orange Money, MTN MoMo, Wave, Moov',
      is_active: true,
      order_index: 1,
      click_count: 0,
    },
  ],
  views_count: 0,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

function sanitizePulsePageState(raw: any): PulsePage {
  if (!raw || typeof raw !== 'object') return DEFAULT_PAGE;
  return {
    ...DEFAULT_PAGE,
    ...raw,
    avatar_url:
      !raw.avatar_url || String(raw.avatar_url).includes('images.unsplash.com')
        ? '/logo.svg'
        : raw.avatar_url,
    theme_config:
      raw.theme_config && typeof raw.theme_config === 'object' && raw.theme_config.bg_gradient
        ? raw.theme_config
        : raw.social_links && typeof raw.social_links === 'object' && raw.social_links.bg_gradient
        ? raw.social_links
        : DEFAULT_PAGE.theme_config,
    blocks: Array.isArray(raw.blocks)
      ? raw.blocks
      : Array.isArray(raw.links)
      ? raw.links
      : DEFAULT_PAGE.blocks,
  };
}

export default function PulsePagesBuilder() {
  const [page, setPage] = useState<PulsePage>(DEFAULT_PAGE);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load from Supabase with localStorage & sessionStorage draft fallback
  useEffect(() => {
    // 1. Check for unsaved draft first
    if (typeof window !== 'undefined') {
      const draft = sessionStorage.getItem('pulsesocial_page_draft');
      if (draft) {
        try {
          const parsed = JSON.parse(draft);
          if (parsed && parsed.title) {
            setPage(sanitizePulsePageState(parsed));
          }
        } catch {
          // ignore draft parse error
        }
      }
    }

    // 2. Fetch official data from Supabase
    const fetchPage = async () => {
      try {
        const res = await fetch('/api/pulse-pages');
        if (res.ok) {
          const data = await res.json();
          if (data.page) {
            const normalizedPage = sanitizePulsePageState(data.page);
            setPage(normalizedPage);
            if (typeof window !== 'undefined') {
              localStorage.setItem('pulsesocial_page_saved', JSON.stringify(normalizedPage));
            }
            return;
          }
        }
      } catch (err) {
        console.warn('Could not fetch existing pulse page, checking local fallback:', err);
      }

      // 3. Fallback to localStorage saved page
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('pulsesocial_page_saved');
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (parsed && parsed.title) {
              setPage(sanitizePulsePageState(parsed));
            }
          } catch {
            // ignore
          }
        }
      }
    };

    fetchPage();
  }, []);

  // Update page helper that also persists to sessionStorage draft
  const updatePage = (updated: PulsePage) => {
    const clean = sanitizePulsePageState(updated);
    setPage(clean);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('pulsesocial_page_draft', JSON.stringify(clean));
    }
  };

  const handleAddBlock = () => {
    const newBlock: PulsePageBlock = {
      id: `blk-${Date.now()}`,
      type: 'link',
      title: 'Nouveau lien personnalisé',
      url: 'https://',
      subtitle: 'Description courte du lien',
      is_active: true,
      order_index: page.blocks.length,
      click_count: 0,
    };
    updatePage({ ...page, blocks: [...page.blocks, newBlock] });
  };

  const handleUpdateBlock = (id: string, updates: Partial<PulsePageBlock>) => {
    updatePage({
      ...page,
      blocks: page.blocks.map((b) => (b.id === id ? { ...b, ...updates } : b)),
    });
  };

  const handleDeleteBlock = (id: string) => {
    updatePage({
      ...page,
      blocks: page.blocks.filter((b) => b.id !== id),
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/pulse-pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(page),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Erreur lors de la sauvegarde dans Supabase');
      }

      if (data.page) {
        const normalized = sanitizePulsePageState(data.page);
        setPage(normalized);
        if (typeof window !== 'undefined') {
          localStorage.setItem('pulsesocial_page_saved', JSON.stringify(normalized));
          sessionStorage.setItem('pulsesocial_page_draft', JSON.stringify(normalized));
        }
      }

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4000);
    } catch (err: unknown) {
      console.error('Failed to save Pulse Page:', err);
      const msg = err instanceof Error ? err.message : 'Échec de la sauvegarde';
      setErrorMessage(msg);
      // In case of error, still guarantee local persistence
      if (typeof window !== 'undefined') {
        localStorage.setItem('pulsesocial_page_saved', JSON.stringify(page));
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <Globe2 className="w-6 h-6 text-violet-600" />
            Pulse Pages (Constructeur Link-in-Bio)
          </h1>
          <p className="text-xs text-slate-600 font-medium">
            Créez une micro-page d&apos;atterrissage personnalisée pour vos bios Instagram, TikTok &amp; X avec suivi d&apos;audience en direct.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={`/p/${page.slug}`}
            target="_blank"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-violet-200 bg-white text-xs font-bold text-violet-700 hover:bg-violet-50 hover:border-violet-300 shadow-xs transition-colors"
          >
            <Eye className="w-4 h-4 text-violet-600" />
            Aperçu Public
            <ExternalLink className="w-3 h-3 text-violet-500" />
          </Link>

          <button
            onClick={handleSave}
            disabled={saving}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-white font-bold text-xs shadow-lg transition-all ${savedSuccess
              ? 'bg-emerald-600 shadow-emerald-600/30'
              : 'bg-violet-600 hover:bg-violet-500 shadow-violet-600/30'
              }`}
          >
            {saving ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : savedSuccess ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {savedSuccess ? 'Enregistré dans Supabase !' : saving ? 'Sauvegarde...' : 'Sauvegarder'}
          </button>
        </div>
      </div>

      {/* Success / Error notification banner */}
      {savedSuccess && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Vos modifications ont été synchronisées et enregistrées avec succès dans Supabase !</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-700 text-xs flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <span className="font-bold text-rose-700">Attention :</span>
            <span>{errorMessage} (Sauvegarde locale garantie dans votre navigateur)</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-xs text-rose-600 hover:text-rose-900"
          >
            ✕
          </button>
        </div>
      )}

      {/* Analytics Summary for Pulse Page */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="pulse-card p-4 flex items-center gap-4 border border-slate-200 bg-white shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center">
            <Eye className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-600">Vues Totales</span>
            <p className="text-xl font-black text-slate-900">{page.views_count || 0}</p>
          </div>
        </div>

        <div className="pulse-card p-4 flex items-center gap-4 border border-slate-200 bg-white shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <MousePointerClick className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-600">Clics sur les Liens</span>
            <p className="text-xl font-black text-slate-900">
              {page.blocks.reduce((acc, curr) => acc + (curr.click_count || 0), 0)}
            </p>
          </div>
        </div>

        <div className="pulse-card p-4 flex items-center gap-4 border border-slate-200 bg-white shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-pink-100 text-pink-700 flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-600">Taux de Clic (CTR)</span>
            <p className="text-xl font-black text-slate-900">
              {page.views_count && page.views_count > 0
                ? `${Math.round((page.blocks.reduce((a, b) => a + (b.click_count || 0), 0) / page.views_count) * 100)}%`
                : '0%'}
            </p>
          </div>
        </div>
      </div>

      {/* Builder Layout: Left Controls + Right Live Mobile Simulation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Configuration & Blocks (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Identity & Bio */}
          <div className="pulse-card p-6 space-y-4 border border-slate-200 bg-white shadow-sm">
            <h2 className="font-bold text-sm text-slate-900">
              Identité de votre Pulse Page
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Titre de la Page
                </label>
                <input
                  type="text"
                  value={page.title}
                  onChange={(e) => updatePage({ ...page, title: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 focus:outline-none focus:border-violet-500 font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Identifiant URL (Slug)
                </label>
                <div className="flex items-center text-xs rounded-xl border border-slate-300 bg-slate-50 overflow-hidden">
                  <span className="px-2.5 py-2 text-slate-600 bg-slate-100 border-r border-slate-300 font-bold">
                    /p/
                  </span>
                  <input
                    type="text"
                    value={page.slug}
                    onChange={(e) => updatePage({ ...page, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                    className="flex-1 p-2 bg-transparent text-slate-900 font-medium focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Biographie / Description courte
              </label>
              <textarea
                rows={2}
                value={page.bio}
                onChange={(e) => updatePage({ ...page, bio: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 focus:outline-none focus:border-violet-500 font-medium"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Photo de Profil / Avatar
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={page.avatar_url}
                  onChange={(e) => updatePage({ ...page, avatar_url: e.target.value })}
                  placeholder="https://... ou importer une photo"
                  className="flex-1 text-xs p-2.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 focus:outline-none focus:border-violet-500 font-mono"
                />
                <label className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-violet-700 hover:bg-violet-600 text-white border border-violet-700 text-xs font-bold cursor-pointer transition-colors shrink-0 shadow-xs">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Importer photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                          if (ev.target?.result) {
                            updatePage({ ...page, avatar_url: ev.target.result as string });
                          }
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Theme Presets */}
          <div className="pulse-card p-6 space-y-4 border border-slate-200 bg-white shadow-sm">
            <h2 className="font-bold text-sm text-slate-900">Thèmes & Ambiances Visuelles</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {THEME_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() =>
                    updatePage({
                      ...page,
                      theme_config: {
                        ...page.theme_config,
                        bg_gradient: preset.gradient,
                        button_bg: preset.btnBg,
                        button_border: preset.border,
                      },
                    })
                  }
                  className={`p-3 rounded-2xl border text-left transition-all ${page.theme_config.bg_gradient === preset.gradient
                    ? 'border-violet-600 ring-2 ring-violet-500/30'
                    : 'border-slate-200 hover:border-slate-400 bg-slate-50/50'
                    }`}
                >
                  <div
                    className={`h-10 rounded-xl bg-gradient-to-br ${preset.gradient} mb-2 border border-black/10`}
                  />
                  <span className="text-[11px] font-bold text-slate-800 block truncate">
                    {preset.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Links & Blocks List */}
          <div className="pulse-card p-6 space-y-4 border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-sm text-slate-900">
                Liens & Boutons d&apos;Action ({page.blocks.length})
              </h2>
              <button
                onClick={handleAddBlock}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Ajouter un lien
              </button>
            </div>

            <div className="space-y-3">
              {page.blocks.map((block) => (
                <div
                  key={block.id}
                  className="p-4 rounded-2xl border border-slate-800 bg-slate-900/40 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-violet-400">
                      Bouton de Redirection
                    </span>
                    <button
                      onClick={() => handleDeleteBlock(block.id)}
                      className="text-slate-500 hover:text-rose-400 p-1 rounded-lg transition-colors"
                      title="Supprimer ce lien"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Texte du bouton..."
                      value={block.title}
                      onChange={(e) =>
                        handleUpdateBlock(block.id, { title: e.target.value })
                      }
                      className="text-xs p-2 rounded-xl border border-slate-800 bg-slate-900/60 text-white focus:outline-none focus:border-violet-500"
                    />
                    <input
                      type="text"
                      placeholder="https://..."
                      value={block.url || ''}
                      onChange={(e) =>
                        handleUpdateBlock(block.id, { url: e.target.value })
                      }
                      className="text-xs p-2 rounded-xl border border-slate-800 bg-slate-900/60 text-white focus:outline-none focus:border-violet-500"
                    />
                  </div>

                  <input
                    type="text"
                    placeholder="Sous-titre ou description courte (optionnel)..."
                    value={block.subtitle || ''}
                    onChange={(e) =>
                      handleUpdateBlock(block.id, { subtitle: e.target.value })
                    }
                    className="w-full text-xs p-2 rounded-xl border border-slate-800 bg-slate-900/60 text-white focus:outline-none focus:border-violet-500"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Live Interactive Smartphone Mockup (5 cols) */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <div className="flex items-center gap-2 mb-3 text-xs font-semibold text-slate-400">
            <Smartphone className="w-4 h-4 text-violet-400" />
            <span>Simulateur Mobile en Direct</span>
          </div>

          {/* Smartphone Frame */}
          <div className="w-[320px] h-[640px] rounded-[42px] border-[6px] border-slate-800 bg-slate-950 p-3 shadow-2xl relative flex flex-col overflow-hidden">
            {/* Notch */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-4 bg-slate-800 rounded-full z-20" />

            {/* Simulated Public Pulse Page Screen */}
            <div
              className={`w-full h-full rounded-[32px] bg-gradient-to-b ${page.theme_config.bg_gradient} text-white flex flex-col items-center justify-between p-5 pt-8 overflow-y-auto select-none`}
            >
              <div className="w-full flex flex-col items-center text-center space-y-4">
                {/* Avatar */}
                <div className="w-20 h-20 rounded-full p-1 border-2 border-white/40 overflow-hidden shadow-xl shrink-0 bg-slate-900 flex items-center justify-center">
                  <img
                    src={
                      !page.avatar_url || page.avatar_url.includes('images.unsplash.com')
                        ? '/logo.svg'
                        : page.avatar_url
                    }
                    alt={page.title}
                    onError={(e) => {
                      const img = e.currentTarget as HTMLImageElement;
                      if (!img.src.endsWith('/logo.svg')) img.src = '/logo.svg';
                    }}
                    className="w-full h-full object-cover rounded-full"
                  />
                </div>

                {/* Title & Bio */}
                <div className="space-y-1">
                  <h3 className="font-extrabold text-sm text-white">{page.title}</h3>
                  <p className="text-[11px] text-white/85 line-clamp-3 leading-snug">
                    {page.bio}
                  </p>
                </div>

                {/* Social Quick Bar */}
                <div className="flex items-center gap-2 pt-1">
                  <div className="w-7 h-7 rounded-full bg-white/15 hover:bg-white/25 border border-white/20 flex items-center justify-center text-[10px] font-bold text-white transition-transform cursor-pointer" title="Instagram">
                    IG
                  </div>
                  <div className="w-7 h-7 rounded-full bg-white/15 hover:bg-white/25 border border-white/20 flex items-center justify-center text-[10px] font-bold text-white transition-transform cursor-pointer" title="LinkedIn">
                    in
                  </div>
                  <div className="w-7 h-7 rounded-full bg-white/15 hover:bg-white/25 border border-white/20 flex items-center justify-center text-[10px] font-bold text-white transition-transform cursor-pointer" title="WhatsApp">
                    WA
                  </div>
                </div>

                {/* Rendered Action Blocks */}
                <div className="w-full space-y-2 pt-2">
                  {page.blocks.map((block) => (
                    <div
                      key={block.id}
                      className="w-full p-3 rounded-xl border backdrop-blur-md shadow-xs text-center transition-transform hover:scale-[1.02]"
                      style={{
                        backgroundColor: page.theme_config.button_bg,
                        borderColor: page.theme_config.button_border,
                      }}
                    >
                      <span className="font-bold text-xs block leading-tight">
                        {block.title}
                      </span>
                      {block.subtitle && (
                        <span className="text-[9px] text-white/70 block mt-0.5 leading-snug">
                          {block.subtitle}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Simulated Footer */}
              <div className="pt-4 text-center">
                <span className="text-[9px] text-white/60 font-medium">
                  Propulsé par PulseSocial Engine
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
