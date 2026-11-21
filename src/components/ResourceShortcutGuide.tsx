'use client';

import React from 'react';
import { Mic, Paperclip, Search, Plus, X, ShieldAlert, CheckCircle2, Command } from 'lucide-react';

interface ResourceShortcutGuideProps {
  isOpen: boolean;
  onClose: () => void;
  resourceType?: 'microphone' | 'all' | 'file';
}

export function ResourceShortcutGuide({
  isOpen,
  onClose,
  resourceType = 'microphone',
}: ResourceShortcutGuideProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md clay-card bg-white p-6 rounded-[28px] shadow-2xl border border-slate-200/80 text-slate-800 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-[#6366F1] flex items-center justify-center shadow-xs">
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">
                Raccourcis &amp; Autorisations
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                Accès direct au Microphone et aux Outils
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            aria-label="Fermer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Primary Shortcut Banner */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-indigo-50 to-violet-50 border border-indigo-200/70 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
              <Mic className="w-4 h-4 text-[#6366F1]" /> Activer le Microphone
            </span>
            <div className="flex items-center gap-1">
              <kbd className="px-2 py-1 text-xs font-black font-mono bg-white text-indigo-900 rounded-lg border border-indigo-200 shadow-xs">
                Alt
              </kbd>
              <span className="text-xs text-indigo-400 font-bold">+</span>
              <kbd className="px-2 py-1 text-xs font-black font-mono bg-white text-indigo-900 rounded-lg border border-indigo-200 shadow-xs">
                M
              </kbd>
            </div>
          </div>
          <p className="text-[11px] text-indigo-800 leading-snug">
            Appuyez sur <strong className="font-bold">Alt + M</strong> (ou <strong className="font-bold">⌥ + M</strong> sur Mac) depuis n&apos;importe quelle page pour démarrer ou couper la dictée vocale instantanément.
          </p>
        </div>

        {/* Other Essential Shortcuts */}
        <div className="space-y-2 text-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            Autres Raccourcis Disponibles
          </span>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-700 font-medium flex items-center gap-2">
                <Plus className="w-3.5 h-3.5 text-violet-500" /> Nouveau Post (Composer)
              </span>
              <kbd className="px-1.5 py-0.5 text-[11px] font-mono bg-white text-slate-800 rounded border border-slate-200 font-bold shadow-xs">
                Alt + P
              </kbd>
            </div>
            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-700 font-medium flex items-center gap-2">
                <Paperclip className="w-3.5 h-3.5 text-emerald-500" /> Joindre Fichiers (Max 10)
              </span>
              <kbd className="px-1.5 py-0.5 text-[11px] font-mono bg-white text-slate-800 rounded border border-slate-200 font-bold shadow-xs">
                Alt + U
              </kbd>
            </div>
            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-700 font-medium flex items-center gap-2">
                <Search className="w-3.5 h-3.5 text-amber-500" /> Recherche Rapide
              </span>
              <kbd className="px-1.5 py-0.5 text-[11px] font-mono bg-white text-slate-800 rounded border border-slate-200 font-bold shadow-xs">
                Alt + K
              </kbd>
            </div>
          </div>
        </div>

        {/* Browser Permission Steps */}
        <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-1.5 text-xs text-amber-950">
          <span className="font-extrabold flex items-center gap-1.5 text-[11px] text-amber-900">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-600" /> Si le micro ne s&apos;active pas :
          </span>
          <ol className="list-decimal list-inside space-y-1 text-[11px] text-amber-900/90 leading-tight">
            <li>Cliquez sur l&apos;icône de réglages / cadenas à gauche de l&apos;URL (<code className="font-mono bg-white/70 px-1 rounded">https://...</code>)</li>
            <li>Basculez l&apos;option <strong>Microphone</strong> sur <strong>Autoriser</strong></li>
            <li>Recommencez en pressant <strong>Alt + M</strong></li>
          </ol>
        </div>

        {/* Action Button */}
        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
        >
          Compris, continuer
        </button>
      </div>
    </div>
  );
}
