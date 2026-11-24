'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Fredoka, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { ComposerModal } from '@/components/ComposerModal';
import { LegalModal } from '@/components/LegalModals';
import { GlobalAICopilot } from '@/components/GlobalAICopilot';
import { CookieConsentBanner } from '@/components/CookieConsentBanner';
import { Post } from '@/lib/types';

const fredoka = Fredoka({
  subsets: ['latin'],
  variable: '--font-fredoka',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [composerOpen, setComposerOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [legalModalType, setLegalModalType] = useState<'privacy' | 'terms' | null>(null);
  const pathname = usePathname();
  const isSetupOrPublic =
    pathname?.startsWith('/setup') ||
    pathname?.startsWith('/p/') ||
    pathname?.startsWith('/login') ||
    pathname?.startsWith('/mentions-legales') ||
    pathname?.startsWith('/cgu') ||
    pathname?.startsWith('/confidentialite') ||
    pathname?.startsWith('/oauth-popup');

  // Client-side authentication guard for protected routes
  useEffect(() => {
    if (isSetupOrPublic) return;
    fetch('/api/auth/me')
      .then((res) => {
        if (!res.ok) {
          window.location.href = '/login';
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data && !data.authenticated) {
          window.location.href = '/login';
        }
      })
      .catch(() => {
        // network or server offline
      });
  }, [pathname, isSetupOrPublic]);

  // Register PWA Service Worker & Global Alt+P shortcut
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.warn('PWA Service Worker registration skipped:', err);
      });
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      // Alt + P opens Composer Modal
      if (e.altKey && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        setComposerOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSavePost = async (newPost: Omit<Post, 'id' | 'created_at'>) => {
    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPost),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Erreur lors de l’enregistrement de la publication');
      }
      window.dispatchEvent(new Event('posts-updated'));
      return true;
    } catch (err) {
      console.error('Error saving post', err);
      throw err;
    }
  };

  return (
    <html lang="fr" className={`${fredoka.variable} ${plusJakartaSans.variable}`} suppressHydrationWarning>
      <head>
        <title>PulseSocial - Plateforme Intelligente de Community Management &amp; Monétisation</title>
        <meta
          name="description"
          content="PulseSocial : Planificateur multi-réseaux, Boîte de réception unifiée, Assistant IA Gemini 2.0, Pulse Pages et Abonnements Mobile Money."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, viewport-fit=cover" />
        <meta name="theme-color" content="#F5F3FF" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="PulseSocial" />
        <link rel="manifest" href="/manifest.webmanifest" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body className={`${plusJakartaSans.className} min-h-screen bg-[#F5F3FF] text-[#1E1B4B] antialiased font-jakarta selection:bg-[#7C3AED] selection:text-white`}>
        {isSetupOrPublic ? (
          <main className="min-h-screen">{children}</main>
        ) : (
          <div className="flex min-h-screen bg-[#F5F3FF]">
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
              <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-24 overflow-y-auto">{children}</main>

              {/* Discrete Legal & Compliance Footer with safe clearance for floating assistant */}
              <footer className="px-6 pr-24 sm:pr-60 pb-20 sm:pb-4 py-4 border-t border-slate-200/80 bg-white/95 text-[11px] text-slate-600 flex flex-col sm:flex-row items-center justify-between gap-2">
                <div>
                  <span className="font-medium">© 2026 PulseSocial. Conforme ARTCI (Loi n° 2013-450) &amp; RGPD.</span>
                </div>
                <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
                  <Link
                    href="/mentions-legales"
                    className="hover:text-violet-700 font-semibold transition-colors text-slate-600"
                  >
                    Mentions Légales
                  </Link>
                  <Link
                    href="/confidentialite"
                    className="hover:text-violet-700 font-semibold transition-colors text-slate-600"
                  >
                    Confidentialité (ARTCI / RGPD)
                  </Link>
                  <Link
                    href="/cgu"
                    className="hover:text-violet-700 font-semibold transition-colors text-slate-600"
                  >
                    CGU &amp; WhatsApp 24h
                  </Link>
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

            {/* Global Voice & Multimodal AI Copilot accessible everywhere */}
            <GlobalAICopilot />

            {/* Cookie Consent Banner (ARTCI & RGPD compliance) */}
            <CookieConsentBanner />
          </div>
        )}
      </body>
    </html>
  );
}
