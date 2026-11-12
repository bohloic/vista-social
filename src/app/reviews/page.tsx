'use client';

import React, { useState } from 'react';
import { INITIAL_REVIEWS } from '@/lib/mockData';
import { ReviewItem } from '@/lib/types';
import { FormattedDate } from '@/components/FormattedDate';
import {
  Star,
  Sparkles,
  MessageCircle,
  CheckCircle2,
  Filter,
  Send,
  Loader2,
  Wand2,
} from 'lucide-react';

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<ReviewItem[]>(INITIAL_REVIEWS);
  const [ratingFilter, setRatingFilter] = useState<number | 'all'>('all');
  const [replyInputs, setReplyInputs] = useState<Record<string, string>>({});
  const [loadingAi, setLoadingAi] = useState<Record<string, boolean>>({});

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
          channel: `${review.platform} Review (${review.rating}/5 étoiles)`,
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

    setReviews(
      reviews.map((r) =>
        r.id === id
          ? {
              ...r,
              response_text: text.trim(),
              responded_at: new Date().toISOString(),
            }
          : r
      )
    );
    setReplyInputs({ ...replyInputs, [id]: '' });
  };

  const filteredReviews = reviews.filter((r) => {
    if (ratingFilter !== 'all' && r.rating !== ratingFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Star className="w-6 h-6 text-yellow-400 fill-yellow-400" />
            Gestion des Avis & Réputation Locale
          </h1>
          <p className="text-xs text-slate-500">
            Centralisez et répondez aux avis Google Business, Yelp, Trustpilot et Facebook.
          </p>
        </div>

        <div className="flex items-center gap-3 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
          <div className="text-center">
            <span className="text-2xl font-black text-slate-900 dark:text-white leading-none block">
              4.8
            </span>
            <div className="flex items-center gap-0.5 justify-center mt-0.5">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3 h-3 text-yellow-400 fill-yellow-400" />
              ))}
            </div>
          </div>
          <div className="text-xs text-slate-400 border-l border-slate-200 dark:border-slate-800 pl-3">
            <strong className="text-slate-800 dark:text-slate-200 block">142 avis au total</strong>
            <span>98% de taux de réponse</span>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-2 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
        <span className="text-xs font-semibold text-slate-500 flex items-center gap-1 pl-2">
          <Filter className="w-3.5 h-3.5" /> Note :
        </span>
        <button
          onClick={() => setRatingFilter('all')}
          className={`px-3 py-1 rounded-xl text-xs font-semibold ${
            ratingFilter === 'all'
              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
              : 'text-slate-600'
          }`}
        >
          Tous les avis
        </button>
        {[5, 4, 3, 2, 1].map((stars) => (
          <button
            key={stars}
            onClick={() => setRatingFilter(stars)}
            className={`flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-semibold ${
              ratingFilter === stars
                ? 'bg-indigo-600 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>{stars}</span>
            <Star className="w-3 h-3 fill-current" />
          </button>
        ))}
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {filteredReviews.map((review) => (
          <div key={review.id} className="vista-card p-6 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-700 dark:text-slate-300 text-sm shrink-0">
                  {review.author_name.slice(0, 2).toUpperCase()}
                </div>

                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm text-slate-900 dark:text-white">
                      {review.author_name}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600">
                      {review.platform}
                    </span>
                    <span className="text-xs text-slate-400" suppressHydrationWarning>
                      <FormattedDate date={review.review_date} formatType="date" />
                    </span>
                  </div>

                  {/* Rating Stars */}
                  <div className="flex items-center gap-1 mt-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${
                          i < review.rating
                            ? 'text-yellow-400 fill-yellow-400'
                            : 'text-slate-200 dark:text-slate-700'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {review.response_text && (
                <span className="text-xs text-emerald-500 font-semibold flex items-center gap-1">
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
                <span className="text-xs font-bold text-indigo-900 dark:text-indigo-300" suppressHydrationWarning>
                  Réponse de Studio Nova (<FormattedDate date={review.responded_at || ''} formatType="date" />) :
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
                    className="flex-1 p-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <button
                    onClick={() => handleGenerateAiResponse(review)}
                    disabled={loadingAi[review.id]}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 text-xs font-semibold hover:bg-purple-100 transition-colors"
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
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold transition-colors shadow-sm"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Publier la réponse</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

