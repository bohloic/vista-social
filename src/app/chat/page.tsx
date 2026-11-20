'use client';

import React from 'react';
import { PulseAICopilotPanel } from '@/components/PulseAICopilotPanel';
import { Sparkles, Mic, Paperclip, Zap } from 'lucide-react';

export default function ChatPage() {
  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-violet-400" />
            Assistant Exécutif &amp; Vocal PulseAI (Gemini)
          </h1>
          <p className="text-xs text-slate-400">
            Échangez à l&apos;écrit ou à la voix, joignez jusqu&apos;à 10 fichiers (images, vidéos, documents) et déléguez vos tâches sur toute la plateforme.
          </p>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-slate-300">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800">
            <Mic className="w-3 h-3 text-emerald-400" /> Vocal FR
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800">
            <Paperclip className="w-3 h-3 text-violet-400" /> 10 fichiers max
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800">
            <Zap className="w-3 h-3 text-amber-400" /> Mode Concis
          </span>
        </div>
      </div>

      <PulseAICopilotPanel />
    </div>
  );
}
