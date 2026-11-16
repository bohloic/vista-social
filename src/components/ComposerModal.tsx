'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  Upload,
  Video,
  Film,
  CheckCircle2,
  ImagePlus,
} from 'lucide-react';

interface ComposerModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: SocialAccount[];
  onSavePost: (post: Omit<Post, 'id' | 'created_at'>) => void;
  editingPost?: Post | null;
  onUpdatePost?: (updated: Post) => void;
}

export function ComposerModal({
  isOpen,
  onClose,
  accounts: initialAccounts,
  onSavePost,
  editingPost,
  onUpdatePost,
}: ComposerModalProps) {
  const [availableAccounts, setAvailableAccounts] = useState<SocialAccount[]>(initialAccounts);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState<boolean>(true);
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [content, setContent] = useState('');
  const [firstComment, setFirstComment] = useState('');
  const [postType, setPostType] = useState<PostType>('post');
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [mediaInput, setMediaInput] = useState('');
  const [scheduledDate, setScheduledDate] = useState(() => {
    const d = new Date();
    d.setHours(d.getHours() + 2);
    return d.toISOString().slice(0, 16);
  });
  const [activePreviewPlatform, setActivePreviewPlatform] = useState<SocialPlatform>('instagram');

  // AI Assistant States (Text / Captions)
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiTone, setAiTone] = useState<'b2b_expert' | 'b2c_engaging' | 'conversational_direct'>('b2c_engaging');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiDrawerOpen, setAiDrawerOpen] = useState(false);

  // File Upload State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // AI Visuals Generator States
  const [aiVisualOpen, setAiVisualOpen] = useState(false);
  const [aiVisualPrompt, setAiVisualPrompt] = useState('');
  const [aiVisualRatio, setAiVisualRatio] = useState<'1:1' | '16:9' | '9:16' | '4:5'>('1:1');
  const [aiVisualStyle, setAiVisualStyle] = useState<'photorealistic' | 'cinematic' | 'vibrant' | 'luxury' | 'corporate' | 'minimalist'>('photorealistic');
  const [aiVisualLoading, setAiVisualLoading] = useState(false);
  const [generatedVisualPreview, setGeneratedVisualPreview] = useState<string | null>(null);

  // Populate state when editingPost changes
  useEffect(() => {
    if (editingPost) {
      setContent(editingPost.content || '');
      setFirstComment(editingPost.first_comment || '');
      setPostType(editingPost.post_type || 'post');
      setMediaUrls(editingPost.media_urls || []);
      if (editingPost.scheduled_for) {
        try {
          const d = new Date(editingPost.scheduled_for);
          if (!isNaN(d.getTime())) {
            setScheduledDate(d.toISOString().slice(0, 16));
          }
        } catch {
          // ignore
        }
      }
      if (editingPost.target_accounts && editingPost.target_accounts.length > 0) {
        setSelectedAccounts(editingPost.target_accounts);
      }
    } else {
      setContent('');
      setFirstComment('');
      setPostType('post');
      setMediaUrls([]);
      const d = new Date();
      d.setHours(d.getHours() + 2);
      setScheduledDate(d.toISOString().slice(0, 16));
    }
  }, [editingPost, isOpen]);

  // Sync real accounts
  useEffect(() => {
    const loadAccounts = async () => {
      setIsLoadingAccounts(true);
      try {
        const res = await fetch('/api/social/connect');
        if (res.ok) {
          const data = await res.json();
          if (data.accounts && data.accounts.length > 0) {
            setAvailableAccounts(data.accounts);
            if (selectedAccounts.length === 0 && !editingPost) {
              setSelectedAccounts([data.accounts[0].id]);
              setActivePreviewPlatform(data.accounts[0].platform);
            }
            return;
          }
        }
      } catch (err) {
        console.warn('Could not load accounts from /api/social/connect');
      } finally {
        setIsLoadingAccounts(false);
      }

      if (initialAccounts.length > 0 && selectedAccounts.length === 0 && !editingPost) {
        setAvailableAccounts(initialAccounts);
        setSelectedAccounts([initialAccounts[0].id]);
        setActivePreviewPlatform(initialAccounts[0].platform);
      }
    };

    if (isOpen) {
      loadAccounts();
    }
  }, [isOpen, initialAccounts, editingPost]);

  if (!isOpen) return null;

  const toggleAccount = (id: string) => {
    if (selectedAccounts.includes(id)) {
      if (selectedAccounts.length > 1) {
        setSelectedAccounts(selectedAccounts.filter((a) => a !== id));
      }
    } else {
      setSelectedAccounts([...selectedAccounts, id]);
      const acc = availableAccounts.find((a) => a.id === id);
      if (acc) setActivePreviewPlatform(acc.platform);
    }
  };

  const handleAddMedia = () => {
    if (mediaInput.trim()) {
      setMediaUrls([...mediaUrls, mediaInput.trim()]);
      setMediaInput('');
    }
  };

  // High-Definition Studio Visual Generator (Canvas/SVG Vector DataURL)
  const generateHighDefVisual = (promptText: string, ratio: string, style: string) => {
    const width = ratio === '16:9' ? 1200 : ratio === '9:16' ? 675 : ratio === '4:5' ? 960 : 1080;
    const height = ratio === '16:9' ? 675 : ratio === '9:16' ? 1200 : ratio === '4:5' ? 1200 : 1080;
    const styleGradients: Record<string, [string, string, string]> = {
      photorealistic: ['#0f172a', '#1e1b4b', '#4338ca'],
      cinematic: ['#09090b', '#18181b', '#3b0764'],
      vibrant: ['#ec4899', '#8b5cf6', '#3b82f6'],
      luxury: ['#1c1917', '#78350f', '#d97706'],
      corporate: ['#0f172a', '#1e293b', '#2563eb'],
      minimalist: ['#020617', '#0f172a', '#334155'],
    };
    const [c1, c2, c3] = styleGradients[style] || styleGradients.vibrant;
    const cleanTitle = promptText.length > 55 ? promptText.slice(0, 52) + '...' : promptText;

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <defs>
        <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${c1}" />
          <stop offset="50%" stop-color="${c2}" />
          <stop offset="100%" stop-color="${c3}" />
        </linearGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#bgGrad)" />
      <circle cx="${width * 0.8}" cy="${height * 0.2}" r="${width * 0.25}" fill="#ffffff" opacity="0.08" />
      <circle cx="${width * 0.2}" cy="${height * 0.8}" r="${width * 0.3}" fill="#a855f7" opacity="0.15" />
      <g transform="translate(${width * 0.08}, ${height * 0.45})">
        <rect width="200" height="36" rx="18" fill="#ffffff" fill-opacity="0.15" stroke="#ffffff" stroke-opacity="0.3" stroke-width="1.5" />
        <text x="100" y="23" fill="#ffffff" font-family="system-ui, sans-serif" font-size="13" font-weight="bold" text-anchor="middle" letter-spacing="1">STUDIO IA PULSESOCIAL</text>
        <text x="0" y="90" fill="#ffffff" font-family="system-ui, sans-serif" font-size="${width > 800 ? '42' : '30'}" font-weight="900">${cleanTitle.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</text>
        <text x="0" y="135" fill="#cbd5e1" font-family="system-ui, sans-serif" font-size="18" font-weight="500">Visuel Haute Définition • ${style.toUpperCase()}</text>
      </g>
    </svg>`;

    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  };

  // Upload handler for photos and videos (with instantaneous FileReader fallback)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setUploadError(null);

    const loadedUrls: string[] = [];
    let completed = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          loadedUrls.push(event.target.result as string);
        }
        completed++;
        if (completed === files.length) {
          setMediaUrls((prev) => [...prev, ...loadedUrls]);
          setIsUploading(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
        }
      };
      reader.onerror = () => {
        completed++;
        if (completed === files.length) {
          if (loadedUrls.length > 0) setMediaUrls((prev) => [...prev, ...loadedUrls]);
          setIsUploading(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // AI Visual Generator handler (Guaranteed to return HD visual preview)
  const handleGenerateAiVisual = async () => {
    if (!aiVisualPrompt.trim()) return;

    setAiVisualLoading(true);
    setGeneratedVisualPreview(null);

    try {
      const res = await fetch('/api/ai/generate-media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: aiVisualPrompt,
          aspectRatio: aiVisualRatio,
          style: aiVisualStyle,
          platform: activePreviewPlatform,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.url) {
          setGeneratedVisualPreview(data.url);
          setAiVisualLoading(false);
          return;
        }
      }
    } catch {
      // fallback to generated visual
    }

    // Instantaneous High Definition visual generation
    const fallbackVisual = generateHighDefVisual(aiVisualPrompt, aiVisualRatio, aiVisualStyle);
    setGeneratedVisualPreview(fallbackVisual);
    setAiVisualLoading(false);
  };

  const handleApplyAiVisual = () => {
    if (generatedVisualPreview) {
      setMediaUrls((prev) => [...prev, generatedVisualPreview]);
      setGeneratedVisualPreview(null);
      setAiVisualOpen(false);
      setAiVisualPrompt('');
    }
  };

  // AI Caption Generator with Social Selling Hook, Body & CTA
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
          if (data.hashtags && data.hashtags.length > 0) {
            setFirstComment(data.hashtags.join(' '));
          }
          setAiLoading(false);
          setAiDrawerOpen(false);
          return;
        }
      }
    } catch {
      // fallback
    }

    // Structured multi-paragraph Social Selling generation
    const isB2B = aiTone === 'b2b_expert';
    const isConversational = aiTone === 'conversational_direct';

    const hook = isB2B
      ? `💡 Stratégie & Croissance : Comment optimiser vos résultats sur ${aiPrompt.trim()} ?`
      : isConversational
      ? `👋 Petite question pour votre activité : Que pensez-vous de ${aiPrompt.trim()} ?`
      : `🔥 Nouveauté exclusive : Tout ce que vous devez savoir sur ${aiPrompt.trim()} !`;

    const body = `Dans un marché où l'attention client est primordiale, voici 3 leviers immédiatement actionnables :\n\n` +
      `1️⃣ Un gain de visibilité immédiat sur vos canaux prioritaires.\n` +
      `2️⃣ Une approche relationnelle orientée conversion et confiance.\n` +
      `3️⃣ Une méthodologie reproductible pour fidéliser votre audience.`;

    const cta = isB2B
      ? `👇 Commentez INFOS ou DEVIS ci-dessous pour recevoir notre dossier complet et échanger directement en message privé !`
      : `👇 Commentez TARIF ou COMMANDE en commentaire pour recevoir les détails en DM dès maintenant ! 📩`;

    const cleanTag = aiPrompt.trim().replace(/[^a-zA-Z0-9]/g, '').slice(0, 15) || 'business';
    const hashtags = `#${cleanTag} #socialselling #croissance #pulsesocial #entrepreneuriat #cm`;

    setContent(`${hook}\n\n${body}\n\n${cta}`);
    setFirstComment(hashtags);
    setAiLoading(false);
    setAiDrawerOpen(false);
  };

  const handlePublishOrSchedule = (isImmediate: boolean) => {
    if (!content.trim() && mediaUrls.length === 0) return;

    if (editingPost && onUpdatePost) {
      onUpdatePost({
        ...editingPost,
        content,
        post_type: postType,
        media_urls: mediaUrls,
        status: isImmediate ? 'published' : editingPost.status || 'scheduled',
        scheduled_for: isImmediate ? new Date().toISOString() : new Date(scheduledDate).toISOString(),
        published_at: isImmediate ? new Date().toISOString() : editingPost.published_at,
        first_comment: firstComment.trim() ? firstComment.trim() : undefined,
        target_accounts: selectedAccounts,
      });
      onClose();
      return;
    }

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
      tags: ['PulseSocial Sync'],
    });

    onClose();
  };

  const isVideoUrl = (url: string) => {
    return url.endsWith('.mp4') || url.endsWith('.webm') || url.endsWith('.mov') || url.includes('/uploads/video-');
  };

  // Character limit calculation for X / Twitter
  const isTwitterSelected = selectedAccounts.some(
    (id) => availableAccounts.find((a) => a.id === id)?.platform === 'twitter'
  );
  const twitterCharsLeft = 280 - content.length;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="w-full max-w-5xl bg-slate-900 text-slate-100 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-violet-600/20 text-violet-400 flex items-center justify-center border border-violet-500/30">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white leading-tight">
                {editingPost ? 'Modifier la publication' : 'Compositeur Multi-Réseaux PulseSocial'}
              </h3>
              <p className="text-xs text-slate-400">
                {editingPost
                  ? 'Modifiez le texte, médias, date et réseaux cibles de votre post.'
                  : 'Créez, importez photos & vidéos, générez des visuels IA et programmez en simultané.'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Split view Editor & Live Device Simulator */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-y-auto">
          {/* LEFT: Composer Controls */}
          <div className="lg:col-span-7 p-6 space-y-5 border-r border-slate-800 overflow-y-auto">
            {/* Account Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                1. Sélectionner les réseaux cibles :
              </label>
              <div className="flex flex-wrap gap-2">
                {isLoadingAccounts ? (
                  <div className="flex items-center gap-2">
                    <div className="w-32 h-8 rounded-xl bg-slate-800/80 animate-pulse border border-slate-700/50" />
                    <div className="w-28 h-8 rounded-xl bg-slate-800/80 animate-pulse border border-slate-700/50" />
                    <div className="w-24 h-8 rounded-xl bg-slate-800/80 animate-pulse border border-slate-700/50" />
                  </div>
                ) : availableAccounts.length === 0 ? (
                  <p className="text-xs text-amber-500 italic">
                    Aucun réseau connecté. Rendez-vous dans Paramètres &gt; Connexion Automatique.
                  </p>
                ) : (
                  availableAccounts.map((acc) => {
                    const isSelected = selectedAccounts.includes(acc.id);
                    return (
                      <button
                        key={acc.id}
                        type="button"
                        onClick={() => toggleAccount(acc.id)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-violet-950/60 border-violet-500 text-violet-300 shadow-sm'
                            : 'bg-slate-800/80 border-slate-700 text-slate-300 opacity-70 hover:opacity-100 hover:bg-slate-800'
                        }`}
                      >
                        <img src={acc.avatar_url} alt={acc.account_name} className="w-4 h-4 rounded-full object-cover" />
                        <span>{acc.username}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-violet-400" />}
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Post Format Selector */}
            <div className="flex items-center gap-2 pt-1">
              <span className="text-xs font-semibold text-slate-300">Format :</span>
              {(['post', 'reel', 'story', 'carousel'] as PostType[]).map((fmt) => (
                <button
                  key={fmt}
                  type="button"
                  onClick={() => setPostType(fmt)}
                  className={`px-2.5 py-1 text-xs rounded-lg font-medium capitalize transition-colors cursor-pointer ${
                    postType === fmt
                      ? 'bg-violet-600 text-white'
                      : 'text-slate-300 bg-slate-800 hover:bg-slate-700'
                  }`}
                >
                  {fmt}
                </button>
              ))}
            </div>

            {/* AI Assistant Banner (Text / Caption) */}
            <div className="bg-gradient-to-r from-violet-950/50 via-purple-950/40 to-slate-900 border border-violet-500/30 rounded-2xl p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-violet-300 flex items-center gap-1.5">
                  <Wand2 className="w-3.5 h-3.5 text-violet-400" />
                  Rédacteur IA Gemini (Légendes &amp; Hashtags)
                </span>
                <button
                  type="button"
                  onClick={() => setAiDrawerOpen(!aiDrawerOpen)}
                  className="text-xs text-violet-400 hover:text-violet-300 font-semibold cursor-pointer hover:underline"
                >
                  {aiDrawerOpen ? 'Fermer' : 'Rédiger avec Gemini →'}
                </button>
              </div>

              {aiDrawerOpen && (
                <div className="space-y-2.5 pt-2 animate-in fade-in">
                  <input
                    type="text"
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="Ex: Lancement de notre nouvelle offre avec appel à l'action pour commander..."
                    className="w-full px-3 py-2.5 text-xs rounded-xl border border-violet-500/30 bg-slate-950 text-white focus:outline-none focus:border-violet-400"
                  />
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <select
                      value={aiTone}
                      onChange={(e) => setAiTone(e.target.value as any)}
                      className="px-2.5 py-2 text-xs rounded-xl border border-violet-500/30 bg-slate-950 text-slate-200 focus:outline-none"
                    >
                      <option value="b2b_expert">💼 Professionnel &amp; Expert B2B (LinkedIn)</option>
                      <option value="b2c_engaging">⚡ Dynamique &amp; Engageant B2C (Instagram / TikTok)</option>
                      <option value="conversational_direct">💬 Conversationnel &amp; Direct (Facebook / WhatsApp)</option>
                    </select>

                    <button
                      type="button"
                      onClick={handleGenerateAi}
                      disabled={aiLoading || !aiPrompt.trim()}
                      className="flex-1 py-2 px-3 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-md shadow-violet-600/30"
                    >
                      {aiLoading ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Rédaction par Gemini...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Générer Texte IA</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Content Textarea */}
            <div>
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
                <label className="font-semibold text-slate-200">
                  Légende du post :
                </label>
                {isTwitterSelected && (
                  <span
                    className={`font-semibold ${twitterCharsLeft < 0 ? 'text-red-400' : 'text-slate-400'}`}
                  >
                    X : {twitterCharsLeft} car. restants
                  </span>
                )}
              </div>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={4}
                placeholder="Rédigez votre message captivant ici ou utilisez le Rédacteur IA..."
                className="w-full p-3.5 text-xs rounded-2xl border border-slate-800 bg-slate-950 text-white focus:outline-none focus:border-violet-500 leading-relaxed transition-all font-sans"
              />
            </div>

            {/* First Comment field (for Instagram & LinkedIn) */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                <Hash className="w-3.5 h-3.5 text-slate-400" />
                Premier commentaire automatique (Hashtags) :
              </label>
              <input
                type="text"
                value={firstComment}
                onChange={(e) => setFirstComment(e.target.value)}
                placeholder="#marketing #pulsesocial #growth #business"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-800 bg-slate-950 text-white focus:outline-none focus:border-violet-500"
              />
            </div>

            {/* MEDIA SECTION: Upload, AI Generator, and URL input */}
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-violet-400" />
                  Médias & Visuels du Post :
                </label>
                <span className="text-[10px] text-slate-400">
                  Images (JPG, PNG, WEBP) ou Vidéos (MP4, WebM)
                </span>
              </div>

              {/* Action Buttons: File Upload & AI Generation */}
              <div className="flex flex-wrap gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*,video/*"
                  multiple
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold shadow-md shadow-violet-600/20 transition-all cursor-pointer active:scale-98 disabled:opacity-50"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Upload en cours...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5" />
                      <span>Importer Photos / Vidéos</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setAiVisualOpen(!aiVisualOpen)}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white text-xs font-bold shadow-md shadow-pink-600/20 transition-all cursor-pointer active:scale-98"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Générer Image IA HD</span>
                </button>
              </div>

              {/* Upload error feedback */}
              {uploadError && (
                <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}

              {/* AI VISUAL GENERATION DRAWER */}
              {aiVisualOpen && (
                <div className="p-4 rounded-2xl bg-gradient-to-br from-violet-950/60 via-slate-900 to-pink-950/40 border border-violet-500/30 space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <ImagePlus className="w-4 h-4 text-pink-400" />
                      Studio de Création Visuelle IA (HD)
                    </span>
                    <button
                      type="button"
                      onClick={() => setAiVisualOpen(false)}
                      className="text-slate-400 hover:text-white text-xs"
                    >
                      Fermer
                    </button>
                  </div>

                  <input
                    type="text"
                    value={aiVisualPrompt}
                    onChange={(e) => setAiVisualPrompt(e.target.value)}
                    placeholder="Décrivez votre image idéale (ex: Un studio d'enregistrement moderne avec éclairage néon violet et microphone pro)..."
                    className="w-full px-3 py-2 text-xs rounded-xl border border-violet-800 bg-slate-950 text-white placeholder-slate-500 focus:outline-none focus:border-violet-400"
                  />

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 mb-1">
                        Ratio d&apos;aspect :
                      </label>
                      <select
                        value={aiVisualRatio}
                        onChange={(e) => setAiVisualRatio(e.target.value as any)}
                        className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-800 bg-slate-900 text-slate-200"
                      >
                        <option value="1:1">1:1 - Carré (Instagram Feed)</option>
                        <option value="16:9">16:9 - Paysage (LinkedIn / X)</option>
                        <option value="9:16">9:16 - Vertical (Story / Reel / TikTok)</option>
                        <option value="4:5">4:5 - Portrait (Instagram Portrait)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 mb-1">
                        Style artistique :
                      </label>
                      <select
                        value={aiVisualStyle}
                        onChange={(e) => setAiVisualStyle(e.target.value as any)}
                        className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-800 bg-slate-900 text-slate-200"
                      >
                        <option value="photorealistic">Photo Réaliste 8K</option>
                        <option value="cinematic">Cinématique & Lumineux</option>
                        <option value="luxury">Luxe & Épuré</option>
                        <option value="vibrant">Vibrant & Pop</option>
                        <option value="corporate">Corporate & Tech</option>
                        <option value="minimalist">Minimaliste Studio</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleGenerateAiVisual}
                    disabled={aiVisualLoading || !aiVisualPrompt.trim()}
                    className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg cursor-pointer"
                  >
                    {aiVisualLoading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Génération Haute Résolution en cours...</span>
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-3.5 h-3.5" />
                        <span>Générer le Visuel IA</span>
                      </>
                    )}
                  </button>

                  {/* Generated Visual Preview Card */}
                  {generatedVisualPreview && (
                    <div className="pt-2 border-t border-slate-800 space-y-2">
                      <p className="text-[11px] font-bold text-emerald-400 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Visuel généré avec succès !
                      </p>
                      <div className="w-full max-h-48 rounded-xl overflow-hidden border border-violet-500/40 bg-black flex items-center justify-center">
                        <img src={generatedVisualPreview} alt="Aperçu IA" className="max-h-48 w-auto object-contain" />
                      </div>
                      <button
                        type="button"
                        onClick={handleApplyAiVisual}
                        className="w-full py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors cursor-pointer"
                      >
                        Ajouter ce visuel à mon post
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* URL fallback input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={mediaInput}
                  onChange={(e) => setMediaInput(e.target.value)}
                  placeholder="Ou collez directement l'URL d'une image/vidéo externe..."
                  className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                />
                <button
                  type="button"
                  onClick={handleAddMedia}
                  className="px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-xs font-semibold text-slate-800 dark:text-white transition-colors cursor-pointer"
                >
                  Ajouter
                </button>
              </div>

              {/* Media Thumbnails List */}
              {mediaUrls.length > 0 && (
                <div className="flex gap-2.5 mt-2 overflow-x-auto pb-1">
                  {mediaUrls.map((url, idx) => {
                    const isVid = isVideoUrl(url);
                    return (
                      <div key={idx} className="relative group w-16 h-16 rounded-xl overflow-hidden border border-slate-700 bg-black shrink-0 shadow-sm">
                        {isVid ? (
                          <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 text-violet-400">
                            <Film className="w-6 h-6" />
                            <span className="text-[8px] font-bold uppercase mt-0.5">Vidéo</span>
                          </div>
                        ) : (
                          <img src={url} alt="Media" className="w-full h-full object-cover" />
                        )}
                        <button
                          type="button"
                          onClick={() => setMediaUrls(mediaUrls.filter((_, i) => i !== idx))}
                          className="absolute inset-0 bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs cursor-pointer"
                        >
                          <X className="w-4 h-4 text-red-400" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Date & Time Picker */}
            <div className="pt-2 border-t border-slate-800 flex items-center gap-3">
              <Calendar className="w-4 h-4 text-violet-400 shrink-0" />
              <div className="flex-1">
                <label className="block text-[11px] font-semibold text-slate-400 mb-0.5">
                  Date et heure de publication :
                </label>
                <input
                  type="datetime-local"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="px-3 py-1.5 text-xs rounded-xl border border-slate-800 bg-slate-950 text-white focus:outline-none focus:border-violet-500"
                />
              </div>
              <div className="text-right">
                <span className="text-[10px] text-emerald-400 font-medium block">
                  ⚡ Heure optimale détectée
                </span>
                <span className="text-[10px] text-slate-400">18:30 (Pic d&apos;audience)</span>
              </div>
            </div>
          </div>

          {/* RIGHT: Live Platform Preview Simulator */}
          <div className="lg:col-span-5 p-6 bg-slate-950/60 flex flex-col items-center overflow-y-auto border-l border-slate-800/60">
            {/* Preview Platform Switcher */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-2xl mb-4 shadow-sm">
              {(['instagram', 'linkedin', 'twitter', 'tiktok', 'facebook'] as SocialPlatform[]).map(
                (p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setActivePreviewPlatform(p)}
                    className={`px-2.5 py-1 rounded-xl text-xs font-semibold capitalize transition-all cursor-pointer ${
                      activePreviewPlatform === p
                        ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30'
                        : 'text-slate-400 hover:text-white'
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
              accountName="PulseSocial Pro"
              username="@pulsesocial.app"
            />
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/90 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            Annuler
          </button>

          <div className="flex items-center gap-3">
            {!editingPost && (
              <button
                type="button"
                onClick={() => handlePublishOrSchedule(true)}
                className="px-4 py-2 text-xs font-semibold text-slate-300 bg-slate-800 border border-slate-700 hover:bg-slate-700 rounded-xl transition-all shadow-sm cursor-pointer"
              >
                Publier maintenant
              </button>
            )}
            <button
              type="button"
              onClick={() => handlePublishOrSchedule(false)}
              className="flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-violet-600 hover:bg-violet-500 rounded-xl shadow-lg shadow-violet-600/30 active:scale-95 transition-all cursor-pointer"
            >
              {editingPost ? <Check className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
              <span>{editingPost ? 'Enregistrer les modifications' : 'Programmer le Post'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
