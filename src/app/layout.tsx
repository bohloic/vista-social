'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import './globals.css';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { ComposerModal } from '@/components/ComposerModal';
import { LegalModal } from '@/components/LegalModals';
import { Post } from '@/lib/types';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [composerOpen, setComposerOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [legalModalType, setLegalModalType] = useState<'privacy' | 'terms' | null>(null);
  const pathname = usePathname();
  const isSetupOrPublic = pathname?.startsWith('/setup') || pathname?.startsWith('/p/') || pathname?.startsWith('/login');

  const handleSavePost = async (newPost: Omit<Post, 'id' | 'created_at'>) => {
    try {
      await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPost),
      });
      window.dispatchEvent(new Event('posts-updated'));
    } catch (err) {
      console.error('Error saving post', err);
    }
  };

  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <title>PulseSocial - Plateforme Intelligente de Community Management &amp; Monétisation</title>
        <meta
          name="description"
          content="PulseSocial : Planificateur multi-réseaux, Boîte de réception unifiée, Assistant IA Gemini 2.0, Pulse Pages et Abonnements Mobile Money."
        />
        <meta name="theme-color" content="#07090E" />
      </head>
      <body className="min-h-screen bg-[#07090E] text-slate-100 antialiased font-sans selection:bg-violet-500 selection:text-white">
        {isSetupOrPublic ? (
          <main className="min-h-screen">{children}</main>
        ) : (
          <div className="flex min-h-screen">
            {/* Main Navigation Sidebar with Mobile Drawer support */}
            <Sidebar
              isOpen={mobileMenuOpen}
              onClose={() => setMobileMenuOpen(false)}
              onOpenComposer={() => setComposerOpen(true)}
            />

            {/* Primary Content Container */}
            <div className="flex-1 flex flex-col min-w-0">
              <Header
                onOpenComposer={() => setComposerOpen(true)}
                onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
              />
              <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">{children}</main>

              {/* Discrete Legal & Compliance Footer */}
              <footer className="px-6 py-4 border-t border-slate-900 bg-slate-950/40 text-[11px] text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
                <div>
                  <span>© 2026 PulseSocial. Conforme ARTCI (Loi n° 2013-450) &amp; RGPD.</span>
                </div>
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => setLegalModalType('privacy')}
                    className="hover:text-slate-300 transition-colors cursor-pointer"
                  >
                    Politique de Confidentialité (ARTCI / RGPD)
                  </button>
                  <button
                    type="button"
                    onClick={() => setLegalModalType('terms')}
                    className="hover:text-slate-300 transition-colors cursor-pointer"
                  >
                    CGU &amp; Fenêtre 24h WhatsApp
                  </button>
                </div>
              </footer>
            </div>

            {/* Global Legal Modal */}
            <LegalModal type={legalModalType} onClose={() => setLegalModalType(null)} />

            {/* Global Multi-Platform Post Composer */}
            <ComposerModal
              isOpen={composerOpen}
              onClose={() => setComposerOpen(false)}
              accounts={[]}
              onSavePost={handleSavePost}
            />
          </div>
        )}
      </body>
    </html>
  );
}
