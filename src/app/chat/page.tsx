'use client';

import React from 'react';
import { PulseAICopilotPanel } from '@/components/PulseAICopilotPanel';
import { Sparkles, Mic, Paperclip, Zap } from 'lucide-react';

export default function ChatPage() {
  return (
    <div className="space-y-4 max-w-5xl mx-auto pb-12 pt-2 sm:pt-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-[#6366F1]" />
            Assistant Exécutif &amp; Vocal PulseAI (Gemini)
          </h1>
          <p className="text-xs text-slate-600 font-medium">
            Échangez à l&apos;écrit ou à la voix, joignez jusqu&apos;à 10 fichiers (images, vidéos, documents) et déléguez vos tâches sur toute la plateforme.
          </p>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-slate-700">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-slate-200/80 shadow-xs font-bold text-slate-800">
            <Mic className="w-3.5 h-3.5 text-emerald-600" />
            <span>Vocal FR</span>
            <kbd className="px-1.5 py-0.5 text-[9px] font-mono bg-slate-100 text-slate-700 rounded border border-slate-300">
              Alt+M
            </kbd>
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white border border-slate-200/80 shadow-xs text-slate-700 font-medium">
            <Paperclip className="w-3 h-3 text-[#6366F1]" /> 10 fichiers
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white border border-slate-200/80 shadow-xs text-amber-700 font-medium">
            <Zap className="w-3 h-3 text-amber-500" /> Actions Directes
          </span>
        </div>
      </div>

      <PulseAICopilotPanel />
    </div>
  );
}
