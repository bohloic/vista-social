'use client';

import React, { useState, useEffect } from 'react';
import { CalendarView } from '@/components/CalendarView';
import { ComposerModal } from '@/components/ComposerModal';
import { Post, SocialAccount, SocialPlatform } from '@/lib/types';
import { FormattedDate } from '@/components/FormattedDate';
import {
  Calendar,
  List,
  Filter,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileEdit,
  Trash2,
  Eye,
  Check,
} from 'lucide-react';

export default function PublishPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [platformFilter, setPlatformFilter] = useState<string>('all');
  const [composerOpen, setComposerOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const fetchPostsAndAccounts = async () => {
    try {
      const [postsRes, accsRes] = await Promise.all([
        fetch('/api/posts'),
        fetch('/api/social/connect'),
      ]);

      if (postsRes.ok) {
        const data = await postsRes.json();
        if (data.posts) setPosts(data.posts);
      }

      if (accsRes.ok) {
        const accsData = await accsRes.json();
        if (accsData.accounts) setAccounts(accsData.accounts);
      }
    } catch (err) {
      console.warn('Error loading posts/accounts:', err);
    }
  };

  useEffect(() => {
    fetchPostsAndAccounts();

    const handleUpdate = () => fetchPostsAndAccounts();
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
        setPosts((prev) => [data.post, ...prev]);
        setActionMessage('✓ Publication créée et programmée avec succès !');
        setTimeout(() => setActionMessage(null), 3500);
      }
    } catch (err) {
      console.error('Failed to save post', err);
    }
  };

  const handleUpdatePost = async (updatedPost: Post) => {
    try {
      const res = await fetch('/api/posts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedPost),
      });

      if (res.ok) {
        const data = await res.json();
        const postResult = data.post || updatedPost;
        setPosts((prev) => prev.map((p) => (p.id === updatedPost.id ? postResult : p)));
        setEditingPost(null);
        if (selectedPost?.id === updatedPost.id) {
          setSelectedPost(postResult);
        }
        setActionMessage('✓ Publication modifiée avec succès dans Supabase !');
        setTimeout(() => setActionMessage(null), 3500);
        window.dispatchEvent(new Event('posts-updated'));
      }
    } catch (err) {
      console.error('Failed to update post:', err);
    }
  };

  const handleDeletePost = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer définitivement cette publication ?')) {
      return;
    }

    try {
      const res = await fetch(`/api/posts?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setPosts((prev) => prev.filter((p) => p.id !== id));
        if (selectedPost?.id === id) {
          setSelectedPost(null);
        }
        setActionMessage('✓ Publication supprimée de la base de données.');
        setTimeout(() => setActionMessage(null), 3500);
        window.dispatchEvent(new Event('posts-updated'));
      }
    } catch (err) {
      console.error('Failed to delete post:', err);
    }
  };

  const openEditModal = (post: Post) => {
    setSelectedPost(null);
    setEditingPost(post);
    setComposerOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return {
          label: 'Publié',
          className: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30',
        };
      case 'scheduled':
        return {
          label: 'Programmé',
          className: 'bg-violet-500/15 text-violet-300 border border-violet-500/30',
        };
      case 'draft':
        return {
          label: 'Brouillon',
          className: 'bg-slate-500/15 text-slate-300 border border-slate-500/30',
        };
      case 'failed':
        return {
          label: 'Échec',
          className: 'bg-rose-500/15 text-rose-300 border border-rose-500/30',
        };
      default:
        return {
          label: status,
          className: 'bg-slate-500/15 text-slate-300 border border-slate-500/30',
        };
    }
  };

  const filteredPosts = posts.filter((post) => {
    if (platformFilter === 'all') return true;
    const matchingAccounts = accounts.filter((a) => post.target_accounts?.includes(a.id));
    return matchingAccounts.some((a) => a.platform === platformFilter);
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Calendar className="w-6 h-6 text-violet-400" />
            Planificateur &amp; Calendrier Éditorial
          </h1>
          <p className="text-xs text-slate-400">
            Organisez et automatisez votre calendrier de publication sur tous vos réseaux avec synchronisation Supabase.
          </p>
        </div>

        {/* View mode toggle & Create Button */}
        <div className="flex items-center gap-2">
          <div className="flex items-center p-1 bg-slate-900 border border-slate-800 rounded-xl shadow-xs">
            <button
              onClick={() => setViewMode('calendar')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'calendar'
                  ? 'bg-violet-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Calendrier</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-violet-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>File d&apos;attente</span>
            </button>
          </div>

          <button
            onClick={() => {
              setEditingPost(null);
              setComposerOpen(true);
            }}
            className="flex items-center gap-2 py-2 px-4 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold shadow-lg shadow-violet-600/30 active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nouveau Post</span>
          </button>
        </div>
      </div>

      {/* Action Notification Alert */}
      {actionMessage && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Filter Bar (Harmonized Dark Theme) */}
      <div className="flex flex-wrap items-center gap-2 p-3 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-sm text-slate-100">
        <span className="text-xs font-semibold text-slate-400 flex items-center gap-1 pl-2">
          <Filter className="w-3.5 h-3.5 text-violet-400" /> Filtrer par réseau :
        </span>
        {['all', 'instagram', 'linkedin', 'twitter', 'tiktok', 'facebook'].map((plat) => (
          <button
            key={plat}
            onClick={() => setPlatformFilter(plat)}
            className={`px-3 py-1 rounded-xl text-xs font-medium capitalize transition-colors cursor-pointer ${
              platformFilter === plat
                ? 'bg-violet-600 text-white font-bold shadow-sm'
                : 'text-slate-400 bg-slate-800/80 hover:bg-slate-800 hover:text-white border border-slate-700/40'
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
          accounts={accounts}
          onNewPostWithDate={() => {
            setEditingPost(null);
            setComposerOpen(true);
          }}
          onSelectPost={(post) => setSelectedPost(post)}
        />
      ) : (
        <div className="space-y-4">
          {filteredPosts.length === 0 ? (
            <div className="py-16 text-center pulse-card p-8 border-dashed border-slate-800 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-violet-500/10 text-violet-400 mx-auto flex items-center justify-center">
                <Calendar className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-white">File de publication vide</h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Vous n&apos;avez aucune publication planifiée avec ces critères. Commencez à planifier votre contenu multi-réseaux !
              </p>
              <button
                onClick={() => {
                  setEditingPost(null);
                  setComposerOpen(true);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs shadow-lg shadow-violet-600/30 transition-all hover:scale-105 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Créer une publication maintenant
              </button>
            </div>
          ) : (
            filteredPosts.map((post) => {
              const targetAccs = accounts.filter((a) =>
                post.target_accounts?.includes(a.id)
              );
              const statusInfo = getStatusBadge(post.status);

              return (
                <div
                  key={post.id}
                  className="pulse-card p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-slate-800 bg-slate-900/60"
                >
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    {post.media_urls.length > 0 ? (
                      <img
                        src={post.media_urls[0]}
                        alt="Media"
                        className="w-20 h-20 rounded-2xl object-cover shrink-0 border border-slate-800"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-2xl bg-slate-800 shrink-0 flex items-center justify-center text-xs text-slate-400 font-semibold border border-slate-700/50">
                        Texte seul
                      </div>
                    )}

                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-violet-400 inline-flex items-center gap-1" suppressHydrationWarning={true}>
                          <Clock className="w-3.5 h-3.5" />
                          <FormattedDate date={post.scheduled_for} formatType="full" />
                        </span>

                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${statusInfo.className}`}>
                          {statusInfo.label}
                        </span>

                        <div className="flex items-center gap-1 ml-auto">
                          {targetAccs.map((a) => (
                            <span
                              key={a.id}
                              className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 uppercase border border-slate-700/50"
                            >
                              {a.platform}
                            </span>
                          ))}
                        </div>
                      </div>

                      <p className="text-xs text-slate-100 leading-relaxed font-medium">
                        {post.content}
                      </p>

                      {post.first_comment && (
                        <p className="text-[10px] text-slate-400">
                          <strong className="text-slate-300">1er commentaire :</strong> {post.first_comment}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons: Preview, Edit, Delete */}
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <button
                      onClick={() => setSelectedPost(post)}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
                      title="Voir les détails"
                    >
                      <Eye className="w-3.5 h-3.5 text-violet-400" />
                      <span>Aperçu</span>
                    </button>
                    <button
                      onClick={() => openEditModal(post)}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-xl border border-violet-500/30 bg-violet-950/40 hover:bg-violet-900/60 text-violet-300 transition-colors cursor-pointer"
                      title="Modifier cette publication"
                    >
                      <FileEdit className="w-3.5 h-3.5" />
                      <span>Modifier</span>
                    </button>
                    <button
                      onClick={() => handleDeletePost(post.id)}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-xl border border-rose-500/30 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 transition-colors cursor-pointer"
                      title="Supprimer définitivement"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                      <span>Supprimer</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Selected Post Detail Modal */}
      {selectedPost && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-base text-white">
                Détails de la publication
              </h3>
              <button
                onClick={() => setSelectedPost(null)}
                className="text-slate-400 hover:text-white text-sm font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>
                  Statut :{' '}
                  <strong className={`font-bold px-2 py-0.5 rounded-full text-[10px] ${getStatusBadge(selectedPost.status).className}`}>
                    {getStatusBadge(selectedPost.status).label}
                  </strong>
                </span>
                <span suppressHydrationWarning>
                  Prévu pour : <strong className="text-white"><FormattedDate date={selectedPost.scheduled_for} formatType="datetime" /></strong>
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
                <p className="text-xs text-slate-100 leading-relaxed whitespace-pre-wrap font-medium">
                  {selectedPost.content}
                </p>
              </div>

              {selectedPost.first_comment && (
                <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800/80">
                  <p className="text-[11px] text-slate-400">
                    <strong className="text-slate-300">1er commentaire :</strong> {selectedPost.first_comment}
                  </p>
                </div>
              )}

              {selectedPost.media_urls.length > 0 && (
                <div className="rounded-xl overflow-hidden aspect-video border border-slate-800 bg-black">
                  <img src={selectedPost.media_urls[0]} alt="Media" className="w-full h-full object-cover" />
                </div>
              )}
            </div>

            {/* Modal Actions: Edit, Delete, Close */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              <button
                onClick={() => handleDeletePost(selectedPost.id)}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Supprimer</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => openEditModal(selectedPost)}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-violet-600 hover:bg-violet-500 text-white shadow-md transition-all cursor-pointer"
                >
                  <FileEdit className="w-3.5 h-3.5" />
                  <span>Modifier</span>
                </button>
                <button
                  onClick={() => setSelectedPost(null)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Composer / Edit Modal */}
      <ComposerModal
        isOpen={composerOpen}
        onClose={() => {
          setComposerOpen(false);
          setEditingPost(null);
        }}
        accounts={accounts}
        onSavePost={handleSavePost}
        editingPost={editingPost}
        onUpdatePost={handleUpdatePost}
      />
    </div>
  );
}
