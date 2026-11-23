'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { ReviewItem, SocialAccount } from '@/lib/types';
import { FormattedDate } from '@/components/FormattedDate';
import Link from 'next/link';
import {
  Star,
  Sparkles,
  MessageCircle,
  CheckCircle2,
  Filter,
  Send,
  Loader2,
  Wand2,
  PlusCircle,
  Share2,
  Building2,
  ArrowRight,
} from 'lucide-react';

const PROJECTED_REVIEWS: ReviewItem[] = [
  {
    id: 'proj-1',
    workspace_id: 'ws-default',
    author_name: 'Marie Dubois',
    rating: 5,
    review_text: 'Accueil irréprochable et prestation au top ! Les équipes sont à l\'écoute et très réactives.',
    platform: 'google',
    review_date: new Date(Date.now() - 3600000 * 4).toISOString(),
    sentiment: 'positive',
  },
  {
    id: 'proj-2',
    workspace_id: 'ws-default',
    author_name: 'Alexandre Morel',
    rating: 4,
    review_text: 'Très satisfait de l\'expérience globale, même si le délai de livraison était légèrement supérieur aux prévisions.',
    platform: 'trustpilot',
    review_date: new Date(Date.now() - 3600000 * 24).toISOString(),
    sentiment: 'neutral',
  },
  {
    id: 'proj-3',
    workspace_id: 'ws-default',
    author_name: 'Kouassi Jean',
    rating: 5,
    review_text: 'Service client exceptionnel, solution rapide et efficace. Je recommande les yeux fermés !',
    platform: 'facebook',
    review_date: new Date(Date.now() - 3600000 * 48).toISOString(),
    sentiment: 'positive',
  },
];

export default function ReviewsPage() {
  const [realReviews, setRealReviews] = useState<ReviewItem[]>([]);
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [projectionMode, setProjectionMode] = useState<boolean>(false);
  const [ratingFilter, setRatingFilter] = useState<number | 'all'>('all');
  const [replyInputs, setReplyInputs] = useState<Record<string, string>>({});
  const [loadingAi, setLoadingAi] = useState<Record<string, boolean>>({});
  const [workspaceName, setWorkspaceName] = useState<string>('Votre Établissement');

  useEffect(() => {
    // 1. Load active workspace name
    try {
      const saved = localStorage.getItem('pulsesocial_active_workspace');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.name) setWorkspaceName(parsed.name);
      }
      const savedReviews = localStorage.getItem('pulsesocial_reviews_list');
      if (savedReviews) {
        setRealReviews(JSON.parse(savedReviews));
      }
    } catch {
      // ignore
    }

    // 2. Fetch connected social accounts to inspect review channels
    const fetchAccounts = async () => {
      try {
        const res = await fetch('/api/social/connect');
        if (res.ok) {
          const data = await res.json();
          if (data.accounts) setAccounts(data.accounts);
        }
      } catch {
        // ignore
      }
    };
    fetchAccounts();
  }, []);

  const saveReviews = (updated: ReviewItem[]) => {
    setRealReviews(updated);
    try {
      localStorage.setItem('pulsesocial_reviews_list', JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const activeReviews = projectionMode ? PROJECTED_REVIEWS : realReviews;

  const handleSimulateReview = () => {
    const samples = [
      {
        author: 'Sarah Kouamé',
        rating: 5,
        text: 'Expérience remarquable, prise en charge immédiate et conseils très professionnels.',
        platform: 'google' as const,
        sentiment: 'positive' as const,
      },
      {
        author: 'Julien Leroy',
        rating: 4,
        text: 'Bonne qualité de service, plateforme intuitive et ergonomique.',
        platform: 'trustpilot' as const,
        sentiment: 'neutral' as const,
      },
      {
        author: 'Aminata Touré',
        rating: 5,
        text: 'Bravo pour la réactivité sur les réseaux sociaux ! Je recommande sans hésitation.',
        platform: 'facebook' as const,
        sentiment: 'positive' as const,
      },
    ];
    const pick = samples[Math.floor(Math.random() * samples.length)];
    const newRev: ReviewItem = {
      id: 'rev_' + Date.now(),
      workspace_id: 'ws-default',
      author_name: pick.author,
      rating: pick.rating,
      review_text: pick.text,
      platform: pick.platform,
      review_date: new Date().toISOString(),
      sentiment: pick.sentiment,
    };
    saveReviews([newRev, ...realReviews]);
  };

  const handleGenerateAiResponse = async (review: ReviewItem) => {
    setLoadingAi({ ...loadingAi, [review.id]: true });
    try {
      const res = await fetch('/api/ai/smart-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: review.author_name,
          customerMessage: review.review_text,
          sentiment: review.sentiment,
          channel: `${review.platform.toUpperCase()} Review (${review.rating}/5 étoiles)`,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.replies && data.replies[0]) {
          setReplyInputs({ ...replyInputs, [review.id]: data.replies[0] });
        }
      }
    } catch (err) {
      console.error('Failed to generate review response', err);
    } finally {
      setLoadingAi({ ...loadingAi, [review.id]: false });
    }
  };

  const handleSendResponse = (id: string) => {
    const text = replyInputs[id];
    if (!text || !text.trim()) return;

    const updated = activeReviews.map((r) =>
      r.id === id
        ? {
          ...r,
          response_text: text.trim(),
          responded_at: new Date().toISOString(),
        }
        : r
    );
    if (!projectionMode) {
      saveReviews(updated);
    }
    setReplyInputs({ ...replyInputs, [id]: '' });
  };

  const totalReviews = activeReviews.length;
  const avgRating = projectionMode
    ? '4.8'
    : totalReviews > 0
    ? (activeReviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews).toFixed(1)
    : '0.0';

  const respondedCount = activeReviews.filter((r) => !!r.response_text).length;
  const responseRate = projectionMode
    ? 98
    : totalReviews > 0
    ? Math.round((respondedCount / totalReviews) * 100)
    : 0;

  const filteredReviews = activeReviews.filter((r) => {
    if (ratingFilter !== 'all' && r.rating !== ratingFilter) return false;
    return true;
  });

  const hasGoogle = accounts.some((a) => a.platform === 'google_business');
  const hasFacebook = accounts.some((a) => a.platform === 'facebook');

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black font-fredoka text-[#1E1B4B] flex items-center gap-2">
            <Star className="w-6 h-6 text-[#FACC15] fill-[#FACC15]" />
            Gestion des Avis &amp; Réputation Locale
          </h1>
          <p className="text-xs text-slate-600 font-medium font-jakarta">
            Centralisez et répondez aux avis Google Business, Yelp, Trustpilot et Facebook pour {workspaceName}.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Projection / Real Toggle (In accord with / and /analytics) */}
          <button
            type="button"
            onClick={() => setProjectionMode(!projectionMode)}
            className="px-3 py-1.5 text-xs font-semibold font-jakarta rounded-xl bg-white border border-violet-100 text-[#1E1B4B] hover:bg-violet-50 transition-colors cursor-pointer shadow-sm"
          >
            {projectionMode ? 'Afficher données réelles' : 'Simuler projection IA'}
          </button>

          {!projectionMode && (
            <button
              onClick={handleSimulateReview}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold font-jakarta bg-[#7C3AED] hover:bg-[#6D28D9] text-white shadow-md shadow-violet-600/25 transition-all cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>+ Simuler / Importer un avis client (Google / Facebook)</span>
            </button>
          )}

          <div className="flex items-center gap-3 p-3 bg-white border border-violet-100 rounded-2xl shadow-sm">
            <div className="text-center">
              <span className="text-2xl font-black font-fredoka text-[#1E1B4B] leading-none block">
                {avgRating}
              </span>
              <div className="flex items-center gap-0.5 justify-center mt-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-3 h-3 ${Number(avgRating) > i
                      ? 'text-[#FACC15] fill-[#FACC15]'
                      : 'text-slate-200'
                      }`}
                  />
                ))}
              </div>
            </div>
            <div className="text-xs text-slate-500 font-jakarta border-l border-violet-100 pl-3">
              <strong className="text-[#1E1B4B] block font-jakarta">
                {projectionMode ? '142 avis au total' : `${totalReviews} avis au total`}
              </strong>
              <span>{responseRate}% de taux de réponse</span>
            </div>
          </div>
        </div>
      </div>

      {/* Connected Channels Hub Bar */}
      <div className="p-3.5 rounded-2xl bg-white border border-violet-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-sm font-jakarta">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-slate-500 font-semibold flex items-center gap-1.5">
            <Share2 className="w-3.5 h-3.5 text-[#7C3AED]" />
            Canaux surveillés :
          </span>
          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
            hasGoogle
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-slate-100 text-slate-500 border border-slate-200'
          }`}>
            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Google Business ({hasGoogle ? 'Connecté' : 'Non lié'})
          </span>
          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
            hasFacebook
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-slate-100 text-slate-500 border border-slate-200'
          }`}>
            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Facebook Pages ({hasFacebook ? 'Connecté' : 'Non lié'})
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-500 border border-slate-200">
            Trustpilot (Webhook)
          </span>
        </div>

        <Link
          href="/settings"
          className="text-[#7C3AED] hover:text-[#6D28D9] font-bold text-[11px] flex items-center gap-1 shrink-0"
        >
          <span>Gérer les comptes sociaux</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-2 p-3 bg-white border border-violet-100 rounded-2xl shadow-sm overflow-x-auto text-[#1E1B4B] font-jakarta">
        <span className="text-xs font-semibold text-slate-500 flex items-center gap-1 pl-2">
          <Filter className="w-3.5 h-3.5" /> Note :
        </span>
        <button
          onClick={() => setRatingFilter('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold font-jakarta transition-all cursor-pointer ${ratingFilter === 'all'
            ? 'bg-[#7C3AED] text-white shadow-sm'
            : 'text-slate-600 hover:bg-violet-50'
            }`}
        >
          Tous les avis ({totalReviews})
        </button>
        {[5, 4, 3, 2, 1].map((stars) => {
          const countForStar = activeReviews.filter((r) => r.rating === stars).length;
          return (
            <button
              key={stars}
              onClick={() => setRatingFilter(stars)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold font-jakarta transition-all cursor-pointer ${ratingFilter === stars
                ? 'bg-[#7C3AED] text-white shadow-sm'
                : 'text-slate-600 hover:bg-violet-50'
                }`}
            >
              <span>{stars}</span>
              <Star className="w-3 h-3 fill-current text-[#FACC15]" />
              <span className="text-[10px] opacity-70">({countForStar})</span>
            </button>
          );
        })}
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {filteredReviews.length === 0 ? (
          <div className="py-16 text-center pulse-card p-8 border-dashed border-slate-700/60 space-y-3 bg-slate-900/40">
            <div className="w-12 h-12 rounded-2xl bg-violet-500/10 text-violet-400 mx-auto flex items-center justify-center">
              <Star className="w-6 h-6 text-yellow-400 fill-yellow-400" />
            </div>
            <h4 className="text-base font-bold text-white">
              {totalReviews === 0
                ? 'Aucun avis client pour le moment'
                : `Aucun avis avec la note de ${ratingFilter} étoiles`}
            </h4>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              {totalReviews === 0
                ? "Dès que vos clients déposeront un avis sur vos fiches Google Business, Trustpilot ou Facebook connectées, vous recevrez une alerte avec proposition de réponse générée par l'IA Gemini. Vous pouvez également cliquer sur 'Simuler projection IA' pour tester la modération intelligente."
                : 'Modifiez votre filtre pour afficher les autres avis de vos clients.'}
            </p>
          </div>
        ) : (
          filteredReviews.map((review) => (
            <div key={review.id} className="pulse-card p-6 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-full bg-violet-500/10 border border-violet-500/20 flex items-center justify-center font-bold text-violet-400 text-sm shrink-0">
                    {review.author_name.slice(0, 2).toUpperCase()}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-slate-900 dark:text-white">
                        {review.author_name}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/60">
                        {review.platform}
                      </span>
                      <FormattedDate date={review.review_date} formatType="date" className="text-xs text-slate-400" />
                    </div>

                    {/* Rating Stars */}
                    <div className="flex items-center gap-1 mt-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${i < review.rating
                            ? 'text-yellow-400 fill-yellow-400'
                            : 'text-slate-200 dark:text-slate-700'
                            }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {review.response_text && (
                  <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                    <CheckCircle2 className="w-4 h-4" /> Répondu
                  </span>
                )}
              </div>

              {/* Review Body */}
              <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed pl-13">
                &quot;{review.review_text}&quot;
              </p>

              {/* Response Section */}
              {review.response_text ? (
                <div className="ml-13 p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/60 space-y-1">
                  <span className="text-xs font-bold text-indigo-900 dark:text-indigo-300" suppressHydrationWarning={true}>
                    Réponse de {workspaceName} (<FormattedDate date={review.responded_at || ''} formatType="date" />) :
                  </span>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                    {review.response_text}
                  </p>
                </div>
              ) : (
                <div className="ml-13 space-y-3 pt-2">
                  <div className="flex gap-2">
                    <textarea
                      value={replyInputs[review.id] || ''}
                      onChange={(e) =>
                        setReplyInputs({ ...replyInputs, [review.id]: e.target.value })
                      }
                      rows={2}
                      placeholder="Rédigez votre réponse officielle..."
                      className="flex-1 p-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/30"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => handleGenerateAiResponse(review)}
                      disabled={loadingAi[review.id]}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 text-xs font-semibold hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors"
                    >
                      {loadingAi[review.id] ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Rédaction IA...</span>
                        </>
                      ) : (
                        <>
                          <Wand2 className="w-3.5 h-3.5" />
                          <span>Générer réponse IA Gemini</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleSendResponse(review.id)}
                      disabled={!replyInputs[review.id]?.trim()}
                      className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-xs font-semibold transition-colors shadow-sm"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Publier la réponse</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
