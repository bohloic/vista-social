'use client';

import React from 'react';
import { PulseAICopilotPanel } from '@/components/PulseAICopilotPanel';
import { Sparkles, Mic, Paperclip, Zap } from 'lucide-react';

export default function ChatPage() {
  return (
    <div className="space-y-4 max-w-5xl mx-auto pb-16 pt-4 sm:pt-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-[#6366F1] shrink-0" />
            <span>Assistant Exécutif &amp; Vocal PulseAI (Gemini)</span>
          </h1>
          <p className="text-xs text-slate-600 font-medium leading-relaxed whitespace-normal">
            Pilotez vos publications, votre CRM et vos liens Mobile Money par écrit ou à la voix (jusqu&apos;à 10 fichiers joints).
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
