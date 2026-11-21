'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Mic, MessageSquare } from 'lucide-react';
import { PulseAICopilotPanel } from './PulseAICopilotPanel';

export function GlobalAICopilot() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Hide floating button when already on dedicated /chat page
  if (pathname === '/chat') return null;

  return (
    <>
      {/* Floating Trigger Button (Tactile Claymorphic Pill) */}
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="fixed bottom-20 sm:bottom-6 right-5 sm:right-6 z-40 flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white text-xs font-bold shadow-xl shadow-indigo-500/30 hover:scale-105 active:scale-95 transition-all cursor-pointer border border-white/20"
          aria-label="Ouvrir l'Assistant Pulse Vocal"
        >
          <Mic className="w-4 h-4" />
          <span className="hidden sm:inline">Assistant Pulse</span>
          <MessageSquare className="w-3.5 h-3.5 sm:hidden" />
        </button>
      )}

      {/* Slide-over Floating Panel */}
      {open && (
        <div className="fixed bottom-4 right-4 z-50 w-[calc(100vw-2rem)] sm:w-[420px] h-[600px] max-h-[82vh] rounded-[32px] overflow-hidden border border-white/80 shadow-2xl shadow-indigo-950/20 bg-white animate-in fade-in slide-in-from-bottom-4">
          <PulseAICopilotPanel compact onClose={() => setOpen(false)} />
        </div>
      )}
    </>
  );
}
