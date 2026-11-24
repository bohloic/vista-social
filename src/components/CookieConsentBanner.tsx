'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Cookie, X, Check, ShieldCheck } from 'lucide-react';

export function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const consent = localStorage.getItem('pulsesocial_cookie_consent');
      if (!consent) {
        // Small delay so it smoothly fades in without blocking initial paint
        const timer = setTimeout(() => setVisible(true), 800);
        return () => clearTimeout(timer);
      }
    } catch {
      // ignore
    }
  }, []);

  const handleConsent = (choice: 'accepted' | 'refused') => {
    try {
      localStorage.setItem('pulsesocial_cookie_consent', choice);
    } catch {
      // ignore
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Gestion des cookies et confidentialité"
      className="fixed bottom-4 left-4 right-4 sm:left-6 sm:right-auto sm:max-w-md z-50 p-4 sm:p-5 rounded-2xl bg-slate-900/95 border border-slate-800 text-white shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-4 duration-300"
    >
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-violet-600/20 border border-violet-500/30 text-violet-400 flex items-center justify-center shrink-0 mt-0.5">
          <Cookie className="w-5 h-5" />
        </div>
        <div className="flex-1 space-y-1.5">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-xs text-white flex items-center gap-1.5">
              <span>Respect de votre vie privée</span>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            </h4>
            <button
              onClick={() => handleConsent('refused')}
              className="text-slate-400 hover:text-white p-1 rounded-md transition-colors"
              aria-label="Fermer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            Nous utilisons uniquement des cookies techniques essentiels pour maintenir votre session sécurisée, conformément aux directives de l&apos;<strong>ARTCI (Loi n° 2013-450)</strong> et au RGPD.
          </p>
          <div className="pt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleConsent('accepted')}
              className="flex-1 py-1.5 px-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Accepter</span>
            </button>
            <button
              type="button"
              onClick={() => handleConsent('refused')}
              className="py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
            >
              Refuser
            </button>
            <Link
              href="/confidentialite"
              className="text-[10px] text-violet-400 hover:underline px-1 font-medium"
            >
              En savoir plus
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
