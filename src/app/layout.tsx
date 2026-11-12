'use client';

import React, { useState } from 'react';
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

  const handleSavePost = async (newPost: Omit<Post, 'id' | 'created_at'>) => {
    try {
      await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPost),
      });
      // Trigger a page refresh or custom event
      window.dispatchEvent(new Event('posts-updated'));
    } catch (err) {
      console.error('Error saving post', err);
    }
  };

  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <title>Vista Social - Plateforme Unifiée de Community Management</title>
        <meta
          name="description"
          content="Reconstruction complète des fonctionnalités Vista Social : Planification, Boîte de réception unifiée, Listening, Analytics, Assistant IA Gemini et Vista Pages."
        />
      </head>
      <body className="flex min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased font-sans">
        {/* Main Navigation Sidebar */}
        <Sidebar onOpenComposer={() => setComposerOpen(true)} />

        {/* Primary Content Container */}
        <div className="flex-1 flex flex-col min-w-0">
          <Header onOpenComposer={() => setComposerOpen(true)} />
          <main className="flex-1 p-6 overflow-y-auto">{children}</main>
        </div>

        {/* Global Multi-Platform Post Composer */}
        <ComposerModal
          isOpen={composerOpen}
          onClose={() => setComposerOpen(false)}
          accounts={INITIAL_ACCOUNTS}
          onSavePost={handleSavePost}
        />
      </body>
    </html>
  );
}

