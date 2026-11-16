'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import './globals.css';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { ComposerModal } from '@/components/ComposerModal';
import { INITIAL_ACCOUNTS } from '@/lib/mockData';
import { Post } from '@/lib/types';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [composerOpen, setComposerOpen] = useState(false);
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
        <title>PulseSocial - Plateforme Intelligente de Community Management & Monétisation</title>
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
            {/* Main Navigation Sidebar */}
            <Sidebar onOpenComposer={() => setComposerOpen(true)} />

            {/* Primary Content Container */}
            <div className="flex-1 flex flex-col min-w-0">
              <Header onOpenComposer={() => setComposerOpen(true)} />
              <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">{children}</main>
            </div>

            {/* Global Multi-Platform Post Composer */}
            <ComposerModal
              isOpen={composerOpen}
              onClose={() => setComposerOpen(false)}
              accounts={INITIAL_ACCOUNTS}
              onSavePost={handleSavePost}
            />
          </div>
        )}
      </body>
    </html>
  );
}
