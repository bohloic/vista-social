'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Mic, MessageSquare } from 'lucide-react';
import { PulseAICopilotPanel } from './PulseAICopilotPanel';

export function GlobalAICopilot() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Global Keyboard Shortcut: Alt + M opens Copilot & activates voice
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key.toLowerCase() === 'm') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Hide floating button on /chat and /inbox to prevent covering action/send buttons
  if (pathname === '/chat' || pathname?.startsWith('/inbox')) return null;

  return (
    <>
      {/* Floating Trigger Button with Keyboard Shortcut Badge */}
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="fixed bottom-4 right-4 z-40 flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white text-xs font-bold shadow-xl shadow-indigo-500/30 hover:scale-105 active:scale-95 transition-all cursor-pointer border border-white/20 select-none group"
          aria-label="Ouvrir l'Assistant Pulse Vocal (Raccourci Alt + M)"
          title="Assistant Pulse Vocal (Raccourci : Alt + M)"
        >
          <div className="relative">
            <Mic className="w-4 h-4 group-hover:scale-110 transition-transform" />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 ring-1 ring-white" />
          </div>
          <span className="hidden sm:inline">Assistant Pulse</span>
          <kbd className="hidden md:inline px-1.5 py-0.5 text-[9px] font-mono bg-white/20 text-white rounded border border-white/30">
            Alt+M
          </kbd>
          <MessageSquare className="w-3.5 h-3.5 sm:hidden" />
        </button>
      )}

      {/* Slide-over Floating Panel with Safe Clearance */}
      {open && (
        <div className="fixed bottom-4 right-4 z-50 w-[calc(100vw-2rem)] sm:w-[420px] h-[600px] max-h-[82vh] rounded-[32px] overflow-hidden border border-white/80 shadow-2xl shadow-indigo-950/20 bg-white animate-in fade-in slide-in-from-bottom-4">
          <PulseAICopilotPanel compact onClose={() => setOpen(false)} />
        </div>
      )}
    </>
  );
}
