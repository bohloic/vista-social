'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Sparkles, MessageSquare } from 'lucide-react';
import { PulseAICopilotPanel } from './PulseAICopilotPanel';

export function GlobalAICopilot() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Hide floating button when already on dedicated /chat page
  if (pathname === '/chat') return null;

  return (
    <>
      {/* Floating Trigger Button */}
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="fixed bottom-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-emerald-500 text-white text-xs font-black shadow-2xl shadow-violet-600/40 hover:scale-105 active:scale-95 transition-all cursor-pointer border border-white/10"
          aria-label="Ouvrir l'assistant vocal PulseAI"
        >
          <Sparkles className="w-4 h-4 animate-pulse" />
          <span className="hidden sm:inline">PulseAI Vocal</span>
          <MessageSquare className="w-3.5 h-3.5 sm:hidden" />
        </button>
      )}

      {/* Slide-over Floating Panel */}
      {open && (
        <div className="fixed bottom-4 right-4 z-50 w-[calc(100vw-2rem)] sm:w-[420px] h-[600px] max-h-[82vh] rounded-3xl overflow-hidden border border-violet-500/40 shadow-2xl shadow-black/80 animate-in fade-in slide-in-from-bottom-4">
          <PulseAICopilotPanel compact onClose={() => setOpen(false)} />
        </div>
      )}
    </>
  );
}
