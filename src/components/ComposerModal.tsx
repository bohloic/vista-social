'use client';

import React, { useState } from 'react';
import { SocialAccount, Post, SocialPlatform, PostType } from '@/lib/types';
import { PlatformPreview } from './PlatformPreview';
import {
  X,
  Sparkles,
  Calendar,
  Clock,
  Image as ImageIcon,
  Send,
  Check,
  Hash,
  AlertCircle,
  Wand2,
  Loader2,
} from 'lucide-react';

interface ComposerModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: SocialAccount[];
  onSavePost: (post: Omit<Post, 'id' | 'created_at'>) => void;
}

export function ComposerModal({ isOpen, onClose, accounts, onSavePost }: ComposerModalProps) {
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([accounts[0]?.id || 'acc-ig-1']);
  const [content, setContent] = useState('');
  const [firstComment, setFirstComment] = useState('');
  const [postType, setPostType] = useState<PostType>('post');
  const [mediaUrls, setMediaUrls] = useState<string[]>([
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
  ]);
  const [mediaInput, setMediaInput] = useState('');
  const [scheduledDate, setScheduledDate] = useState(() => {
    const d = new Date();
    d.setHours(d.getHours() + 2);
    return d.toISOString().slice(0, 16);
  });
  const [activePreviewPlatform, setActivePreviewPlatform] = useState<SocialPlatform>('instagram');

  // AI Assistant States
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiTone, setAiTone] = useState<'engaging' | 'professional' | 'humorous' | 'urgent' | 'storytelling'>('engaging');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiDrawerOpen, setAiDrawerOpen] = useState(false);

  if (!isOpen) return null;

  const toggleAccount = (id: string) => {
    if (selectedAccounts.includes(id)) {
      if (selectedAccounts.length > 1) {
        setSelectedAccounts(selectedAccounts.filter((a) => a !== id));
      }
    } else {
      setSelectedAccounts([...selectedAccounts, id]);
      const acc = accounts.find((a) => a.id === id);
      if (acc) setActivePreviewPlatform(acc.platform);
    }
  };

  const handleAddMedia = () => {
    if (mediaInput.trim()) {
      setMediaUrls([...mediaUrls, mediaInput.trim()]);
      setMediaInput('');
    }
  };

  const handleGenerateAi = async () => {
    if (!aiPrompt.trim()) return;
    setAiLoading(true);

    try {
      const res = await fetch('/api/ai/generate-caption', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: aiPrompt,
          tone: aiTone,
          platforms: [activePreviewPlatform],
          includeHashtags: true,
          includeEmojis: true,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.caption) {
          setContent(data.caption);
        }
        if (data.hashtags && data.hashtags.length > 0) {
          setFirstComment(data.hashtags.join(' '));
        }
      }
    } catch (err) {
      console.error('Failed to generate caption with AI', err);
    } finally {
      setAiLoading(false);
      setAiDrawerOpen(false);
    }
  };

  const handlePublishOrSchedule = (isImmediate: boolean) => {
    if (!content.trim() && mediaUrls.length === 0) return;

    onSavePost({
      workspace_id: 'ws-default',
      author_name: 'Lead Community Manager',
      content,
      post_type: postType,
      media_urls: mediaUrls,
      status: isImmediate ? 'published' : 'scheduled',
      scheduled_for: isImmediate ? new Date().toISOString() : new Date(scheduledDate).toISOString(),
      published_at: isImmediate ? new Date().toISOString() : undefined,
      first_comment: firstComment.trim() ? firstComment.trim() : undefined,
      target_accounts: selectedAccounts,
      tags: ['Vista Social Sync'],
    });

    onClose();
  };

  // Character limit calculation for X / Twitter
  const isTwitterSelected = selectedAccounts.some(
    (id) => accounts.find((a) => a.id === id)?.platform === 'twitter'
  );
  const twitterCharsLeft = 280 - content.length;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="w-full max-w-5xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-600/10 text-indigo-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white leading-tight">
                Compositeur Multi-Réseaux
              </h3>
              <p className="text-xs text-slate-500">
                Créez, prévisualisez et programmez sur tous vos canaux en simultané.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Split view Editor & Live Device Simulator */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-y-auto">
          {/* LEFT: Composer Controls */}
          <div className="lg:col-span-7 p-6 space-y-5 border-r border-slate-200 dark:border-slate-800">
            {/* Account Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                1. Sélectionner les réseaux cibles :
              </label>
              <div className="flex flex-wrap gap-2">
                {accounts.map((acc) => {
                  const isSelected = selectedAccounts.includes(acc.id);
                  return (
                    <button
                      key={acc.id}
                      onClick={() => toggleAccount(acc.id)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${isSelected
                          ? 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-500 text-indigo-700 dark:text-indigo-300 shadow-sm'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 opacity-60 hover:opacity-100'
                        }`}
                    >
                      <img src={acc.avatar_url} alt={acc.account_name} className="w-4 h-4 rounded-full object-cover" />
                      <span>{acc.username}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Post Format Selector */}
            <div className="flex items-center gap-2 pt-1">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Format :</span>
              {(['post', 'reel', 'story', 'carousel'] as PostType[]).map((fmt) => (
                <button
                  key={fmt}
                  onClick={() => setPostType(fmt)}
                  className={`px-2.5 py-1 text-xs rounded-lg font-medium capitalize transition-colors ${postType === fmt
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                      : 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200'
                    }`}
                >
                  {fmt}
                </button>
              ))}
            </div>

            {/* AI Assistant Banner */}
            <div className="bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 border border-indigo-500/20 rounded-2xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-900 dark:text-indigo-300 flex items-center gap-1.5">
                  <Wand2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  Assistant IA Gemini
                </span>
                <button
                  onClick={() => setAiDrawerOpen(!aiDrawerOpen)}
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
                >
                  {aiDrawerOpen ? 'Fermer' : 'Générer avec Gemini →'}
                </button>
              </div>

              {aiDrawerOpen && (
                <div className="space-y-2 pt-2 animate-in fade-in">
                  <input
                    type="text"
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="Ex: Annonce de notre webinaire gratuit sur le Social Media ROI..."
                    className="w-full px-3 py-2 text-xs rounded-xl border border-indigo-200 dark:border-indigo-900 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                  <div className="flex items-center gap-2">
                    <select
                      value={aiTone}
                      onChange={(e) => setAiTone(e.target.value as any)}
                      className="px-2.5 py-1.5 text-xs rounded-xl border border-indigo-200 dark:border-indigo-900 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300"
                    >
                      <option value="engaging">Tonalité Engageante</option>
                      <option value="professional">Professionnelle / B2B</option>
                      <option value="humorous">Humour / Tendance</option>
                      <option value="urgent">Urgence / Offre Flash</option>
                      <option value="storytelling">Storytelling</option>
                    </select>

                    <button
                      onClick={handleGenerateAi}
                      disabled={aiLoading || !aiPrompt.trim()}
                      className="flex-1 py-1.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      {aiLoading ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Rédaction par Gemini...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Générer Légende & Hashtags</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Content Textarea */}
            <div>
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Légende du post :
                </label>
                {isTwitterSelected && (
                  <span
                    className={`font-semibold ${twitterCharsLeft < 0 ? 'text-red-500' : 'text-slate-400'
                      }`}
                  >
                    X : {twitterCharsLeft} car. restants
                  </span>
                )}
              </div>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={5}
                placeholder="Rédigez votre message captivant ici..."
                className="w-full p-3.5 text-xs rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 leading-relaxed transition-all"
              />
            </div>

            {/* First Comment field (for Instagram & LinkedIn) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                <Hash className="w-3.5 h-3.5 text-slate-400" />
                Premier commentaire automatique (Hashtags) :
              </label>
              <input
                type="text"
                value={firstComment}
                onChange={(e) => setFirstComment(e.target.value)}
                placeholder="#marketing #socialmedia #growth #paris"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            {/* Media URLs Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                <ImageIcon className="w-3.5 h-3.5 text-slate-400" />
                Médias & Visuels :
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={mediaInput}
                  onChange={(e) => setMediaInput(e.target.value)}
                  placeholder="Collez l'URL d'une image ou vidéo..."
                  className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
                <button
                  onClick={handleAddMedia}
                  className="px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-xs font-semibold text-slate-800 dark:text-white transition-colors"
                >
                  Ajouter
                </button>
              </div>

              {mediaUrls.length > 0 && (
                <div className="flex gap-2 mt-2 overflow-x-auto pb-1">
                  {mediaUrls.map((url, idx) => (
                    <div key={idx} className="relative group w-14 h-14 rounded-xl overflow-hidden border border-slate-300 shrink-0">
                      <img src={url} alt="Media" className="w-full h-full object-cover" />
                      <button
                        onClick={() => setMediaUrls(mediaUrls.filter((_, i) => i !== idx))}
                        className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Date & Time Picker */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-3">
              <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
              <div className="flex-1">
                <label className="block text-[11px] font-semibold text-slate-500 mb-0.5">
                  Date et heure de publication :
                </label>
                <input
                  type="datetime-local"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              <div className="text-right">
                <span className="text-[10px] text-emerald-500 font-medium block">
                  ⚡ Heure optimale détectée
                </span>
                <span className="text-[10px] text-slate-400">18:30 (Pic d&apos;audience)</span>
              </div>
            </div>
          </div>

          {/* RIGHT: Live Platform Preview Simulator */}
          <div className="lg:col-span-5 p-6 bg-slate-50/70 dark:bg-slate-950/40 flex flex-col items-center">
            {/* Preview Platform Switcher */}
            <div className="flex items-center gap-1.5 p-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl mb-4 shadow-sm">
              {(['instagram', 'linkedin', 'twitter', 'tiktok', 'facebook'] as SocialPlatform[]).map(
                (p) => (
                  <button
                    key={p}
                    onClick={() => setActivePreviewPlatform(p)}
                    className={`px-2.5 py-1 rounded-xl text-xs font-semibold capitalize transition-all ${activePreviewPlatform === p
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                      }`}
                  >
                    {p === 'twitter' ? 'X' : p}
                  </button>
                )
              )}
            </div>

            {/* Pixel-perfect Preview component */}
            <PlatformPreview
              platform={activePreviewPlatform}
              content={content}
              mediaUrls={mediaUrls}
              firstComment={firstComment}
              accountName="Studio Nova"
              username="@studionova.agency"
            />
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            Annuler
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={() => handlePublishOrSchedule(true)}
              className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 rounded-xl transition-all shadow-sm"
            >
              Publier maintenant
            </button>
            <button
              onClick={() => handlePublishOrSchedule(false)}
              className="flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-lg shadow-indigo-600/30 active:scale-95 transition-all"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Programmer le Post</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

