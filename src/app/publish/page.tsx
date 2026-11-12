'use client';

import React, { useState, useEffect } from 'react';
import { CalendarView } from '@/components/CalendarView';
import { ComposerModal } from '@/components/ComposerModal';
import { INITIAL_POSTS, INITIAL_ACCOUNTS } from '@/lib/mockData';
import { Post, SocialPlatform } from '@/lib/types';
import { FormattedDate } from '@/components/FormattedDate';
import {
  Calendar,
  List,
  Filter,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Share2,
} from 'lucide-react';

export default function PublishPage() {
  const [posts, setPosts] = useState<Post[]>(INITIAL_POSTS);
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [platformFilter, setPlatformFilter] = useState<string>('all');
  const [composerOpen, setComposerOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const res = await fetch('/api/posts');
        if (res.ok) {
          const data = await res.json();
          if (data.posts) setPosts(data.posts);
        }
      } catch (err) {
        console.warn('Fallback to local posts');
      }
    };
    fetchPosts();

    const handleUpdate = () => fetchPosts();
    window.addEventListener('posts-updated', handleUpdate);
    return () => window.removeEventListener('posts-updated', handleUpdate);
  }, []);

  const handleSavePost = async (newPost: Omit<Post, 'id' | 'created_at'>) => {
    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPost),
      });
      if (res.ok) {
        const data = await res.json();
        setPosts([data.post, ...posts]);
      }
    } catch (err) {
      console.error('Failed to save post', err);
    }
  };

  const filteredPosts = posts.filter((post) => {
    if (platformFilter === 'all') return true;
    const accounts = INITIAL_ACCOUNTS.filter((a) => post.target_accounts.includes(a.id));
    return accounts.some((a) => a.platform === platformFilter);
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Calendar className="w-6 h-6 text-indigo-600" />
            Planificateur & Calendrier Editorial
          </h1>
          <p className="text-xs text-slate-500">
            Organisez et automatisez votre calendrier de publication sur tous vos réseaux.
          </p>
        </div>

        {/* View mode toggle & Create Button */}
        <div className="flex items-center gap-2">
          <div className="flex items-center p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
            <button
              onClick={() => setViewMode('calendar')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'calendar'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Calendrier</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'list'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>File d&apos;attente</span>
            </button>
          </div>

          <button
            onClick={() => setComposerOpen(true)}
            className="flex items-center gap-2 py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Nouveau Post</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-2 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
        <span className="text-xs font-semibold text-slate-500 flex items-center gap-1 pl-2">
          <Filter className="w-3.5 h-3.5" /> Filtrer par réseau :
        </span>
        {['all', 'instagram', 'linkedin', 'twitter', 'tiktok', 'facebook'].map((plat) => (
          <button
            key={plat}
            onClick={() => setPlatformFilter(plat)}
            className={`px-3 py-1 rounded-xl text-xs font-medium capitalize transition-colors ${
              platformFilter === plat
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                : 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200'
            }`}
          >
            {plat === 'all' ? 'Tous les réseaux' : plat === 'twitter' ? 'X' : plat}
          </button>
        ))}
      </div>

      {/* Main Content: Calendar vs Queue List */}
      {viewMode === 'calendar' ? (
        <CalendarView
          posts={filteredPosts}
          accounts={INITIAL_ACCOUNTS}
          onNewPostWithDate={(date) => setComposerOpen(true)}
          onSelectPost={(post) => setSelectedPost(post)}
        />
      ) : (
        <div className="space-y-4">
          {filteredPosts.map((post) => {
            const targetAccs = INITIAL_ACCOUNTS.filter((a) =>
              post.target_accounts.includes(a.id)
            );

            return (
              <div
                key={post.id}
                className="vista-card p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-4 flex-1">
                  {post.media_urls.length > 0 ? (
                    <img
                      src={post.media_urls[0]}
                      alt="Media"
                      className="w-20 h-20 rounded-2xl object-cover shrink-0 border border-slate-200 dark:border-slate-700"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-2xl bg-slate-100 dark:bg-slate-800 shrink-0 flex items-center justify-center text-xs text-slate-400 font-semibold">
                      Texte seul
                    </div>
                  )}

                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1" suppressHydrationWarning>
                        <Clock className="w-3.5 h-3.5" />
                        <FormattedDate date={post.scheduled_for} formatType="full" />
                      </span>

                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                          post.status === 'published'
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                            : 'bg-indigo-50 text-indigo-600 border border-indigo-200'
                        }`}
                      >
                        {post.status}
                      </span>

                      <div className="flex items-center gap-1 ml-auto">
                        {targetAccs.map((a) => (
                          <span
                            key={a.id}
                            className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 uppercase"
                          >
                            {a.platform}
                          </span>
                        ))}
                      </div>
                    </div>

                    <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed">
                      {post.content}
                    </p>

                    {post.first_comment && (
                      <p className="text-[10px] text-slate-400">
                        <strong>1er commentaire :</strong> {post.first_comment}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    onClick={() => setSelectedPost(post)}
                    className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
                  >
                    Aperçu
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Selected Post Detail Modal */}
      {selectedPost && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Détails de la publication
              </h3>
              <button
                onClick={() => setSelectedPost(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Statut : <strong className="capitalize text-indigo-600">{selectedPost.status}</strong></span>
                <span suppressHydrationWarning>Prévu pour : <strong><FormattedDate date={selectedPost.scheduled_for} formatType="datetime" /></strong></span>
              </div>

              <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                {selectedPost.content}
              </p>

              {selectedPost.media_urls.length > 0 && (
                <div className="rounded-xl overflow-hidden aspect-video border border-slate-200">
                  <img src={selectedPost.media_urls[0]} alt="Media" className="w-full h-full object-cover" />
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedPost(null)}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Composer Modal */}
      <ComposerModal
        isOpen={composerOpen}
        onClose={() => setComposerOpen(false)}
        accounts={INITIAL_ACCOUNTS}
        onSavePost={handleSavePost}
      />
    </div>
  );
}

