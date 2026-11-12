'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { INITIAL_VISTA_PAGE } from '@/lib/mockData';
import { VistaPage, VistaPageBlock } from '@/lib/types';
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
} from 'lucide-react';

const THEME_PRESETS = [
  {
    name: 'Violet Aurora',
    gradient: 'from-slate-950 via-purple-950 to-indigo-950',
    btnBg: 'rgba(255, 255, 255, 0.08)',
    border: 'rgba(255, 255, 255, 0.18)',
  },
  {
    name: 'Midnight Slate',
    gradient: 'from-slate-900 to-slate-950',
    btnBg: 'rgba(255, 255, 255, 0.1)',
    border: 'rgba(255, 255, 255, 0.15)',
  },
  {
    name: 'Emerald Lush',
    gradient: 'from-slate-950 via-emerald-950 to-teal-950',
    btnBg: 'rgba(255, 255, 255, 0.08)',
    border: 'rgba(52, 211, 153, 0.25)',
  },
  {
    name: 'Sunset Rose',
    gradient: 'from-slate-950 via-rose-950 to-purple-950',
    btnBg: 'rgba(255, 255, 255, 0.08)',
    border: 'rgba(244, 63, 94, 0.25)',
  },
];

export default function VistaPagesBuilder() {
  const [page, setPage] = useState<VistaPage>(INITIAL_VISTA_PAGE);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleAddBlock = () => {
    const newBlock: VistaPageBlock = {
      id: `blk-${Date.now()}`,
      type: 'link',
      title: 'Nouveau lien personnalisé',
      url: 'https://',
      subtitle: 'Description courte du lien',
      is_active: true,
    };
    setPage({ ...page, blocks: [...page.blocks, newBlock] });
  };

  const handleUpdateBlock = (id: string, updates: Partial<VistaPageBlock>) => {
    setPage({
      ...page,
      blocks: page.blocks.map((b) => (b.id === id ? { ...b, ...updates } : b)),
    });
  };

  const handleDeleteBlock = (id: string) => {
    setPage({
      ...page,
      blocks: page.blocks.filter((b) => b.id !== id),
    });
  };

  const handleSave = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Globe2 className="w-6 h-6 text-indigo-600" />
            Vista Page (Constructeur Link-in-Bio)
          </h1>
          <p className="text-xs text-slate-500">
            Créez une micro-page d&apos;atterrissage personnalisée pour vos bios Instagram, TikTok & X.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={`/p/${page.slug}`}
            target="_blank"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-50 shadow-xs transition-colors"
          >
            <span>Voir la page en ligne</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </Link>

          <button
            onClick={handleSave}
            className="flex items-center gap-2 py-2 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 active:scale-95 transition-all"
          >
            {savedSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                <span>Enregistré !</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Enregistrer</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Analytics Summary for Vista Page */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="vista-card p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center">
            <Eye className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-semibold block">Vues Totales</span>
            <span className="text-xl font-black text-slate-900 dark:text-white">
              {page.views_count.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="vista-card p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center">
            <MousePointerClick className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-semibold block">Clics sur Liens</span>
            <span className="text-xl font-black text-purple-600">
              {page.clicks_count.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="vista-card p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-semibold block">Taux de Clic (CTR)</span>
            <span className="text-xl font-black text-emerald-500">
              {((page.clicks_count / page.views_count) * 100).toFixed(1)}%
            </span>
          </div>
        </div>
      </div>

      {/* Editor & Live Mobile Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT: Builder Controls (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Identity & Bio */}
          <div className="vista-card p-6 space-y-4">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Identité de votre Vista Page
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nom affiché :
                </label>
                <input
                  type="text"
                  value={page.title}
                  onChange={(e) => setPage({ ...page, title: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Identifiant URL (Slug) :
                </label>
                <div className="flex items-center text-xs text-slate-400 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 bg-slate-50 dark:bg-slate-800">
                  <span>/p/</span>
                  <input
                    type="text"
                    value={page.slug}
                    onChange={(e) => setPage({ ...page, slug: e.target.value })}
                    className="bg-transparent text-slate-900 dark:text-white font-semibold focus:outline-none flex-1 ml-0.5"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Bio & Slogan :
              </label>
              <textarea
                value={page.bio}
                onChange={(e) => setPage({ ...page, bio: e.target.value })}
                rows={2}
                className="w-full p-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 leading-relaxed"
              />
            </div>
          </div>

          {/* Theme Chooser */}
          <div className="vista-card p-6 space-y-4">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Thème Visuel & Palette
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {THEME_PRESETS.map((t) => (
                <button
                  key={t.name}
                  onClick={() =>
                    setPage({
                      ...page,
                      theme_config: {
                        ...page.theme_config,
                        preset: t.name,
                        bg_gradient: t.gradient,
                        button_bg: t.btnBg,
                        button_border: t.border,
                      },
                    })
                  }
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    page.theme_config.preset === t.name
                      ? 'border-indigo-600 ring-2 ring-indigo-500/30 shadow-md'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-400'
                  }`}
                >
                  <div className={`w-full h-8 rounded-xl bg-gradient-to-tr ${t.gradient} mb-2 shadow-inner`} />
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">
                    {t.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Blocks Manager */}
          <div className="vista-card p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Liens & Boutons d&apos;Action
              </h3>
              <button
                onClick={handleAddBlock}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 text-xs font-semibold hover:bg-indigo-100 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Ajouter un lien</span>
              </button>
            </div>

            <div className="space-y-3">
              {page.blocks.map((block) => (
                <div
                  key={block.id}
                  className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/60 space-y-2 relative group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Bloc Lien
                    </span>
                    <button
                      onClick={() => handleDeleteBlock(block.id)}
                      className="text-slate-400 hover:text-rose-500 transition-colors p-1"
                      title="Supprimer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <input
                    type="text"
                    value={block.title || ''}
                    onChange={(e) => handleUpdateBlock(block.id, { title: e.target.value })}
                    placeholder="Titre du bouton (ex: Réserver un appel)"
                    className="w-full px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={block.url || ''}
                      onChange={(e) => handleUpdateBlock(block.id, { url: e.target.value })}
                      placeholder="https://..."
                      className="w-full px-3 py-1 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                    />
                    <input
                      type="text"
                      value={block.subtitle || ''}
                      onChange={(e) => handleUpdateBlock(block.id, { subtitle: e.target.value })}
                      placeholder="Sous-titre descriptif (optionnel)"
                      className="w-full px-3 py-1 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT: Live Phone Simulator (5 cols) */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <div className="sticky top-20 w-full max-w-[340px] bg-black border-4 border-slate-800 rounded-[40px] p-3 shadow-2xl overflow-hidden aspect-[9/18.5] flex flex-col">
            {/* Phone Notch */}
            <div className="w-24 h-4 bg-slate-900 rounded-full mx-auto mb-2 shrink-0" />

            {/* Simulated Link-in-Bio Canvas */}
            <div
              className={`flex-1 rounded-[30px] p-5 flex flex-col items-center text-center overflow-y-auto bg-gradient-to-b ${page.theme_config.bg_gradient} text-white space-y-4`}
            >
              {/* Profile Avatar */}
              <div className="w-20 h-20 rounded-full p-1 border-2 border-white/40 overflow-hidden shadow-xl mt-2 shrink-0">
                <img
                  src={page.avatar_url}
                  alt={page.title}
                  className="w-full h-full object-cover rounded-full"
                />
              </div>

              <div>
                <h4 className="font-extrabold text-base leading-tight">{page.title}</h4>
                <p className="text-[11px] text-white/80 whitespace-pre-line mt-1 leading-snug">
                  {page.bio}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="w-full space-y-2.5 pt-2">
                {page.blocks.map((block) => (
                  <div
                    key={block.id}
                    className="w-full p-3 rounded-2xl text-center border backdrop-blur-md shadow-sm transition-transform active:scale-98 cursor-pointer"
                    style={{
                      backgroundColor: page.theme_config.button_bg,
                      borderColor: page.theme_config.button_border,
                    }}
                  >
                    <p className="font-bold text-xs leading-tight">{block.title}</p>
                    {block.subtitle && (
                      <p className="text-[9px] text-white/70 mt-0.5 leading-tight">
                        {block.subtitle}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              <div className="pt-4 mt-auto text-[9px] text-white/40 font-semibold tracking-widest uppercase">
                Propulsé par Vista Social
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

