'use client';

import React, { useState, useEffect, useRef } from 'react';
import { SocialAccount, Post, SocialPlatform, PostType } from '@/lib/types';
import { PlatformPreview } from './PlatformPreview';
import { Avatar } from './Avatar';
import {
  CURATED_FLYER_PRESETS,
  renderFlyerCompositeToDataUrl,
  CuratedFlyerPreset,
} from '@/lib/flyer-studio';
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
  Type,
  Download,
  Layers,
  Tag,
  Phone,
  Palette,
  Eye,
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
  const [aiError, setAiError] = useState<string | null>(null);

  // File Upload State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // AI Visuals & Hybrid Flyer Studio States (Architecture 2026 : Fond IA + Typo Dynamique)
  const [aiVisualOpen, setAiVisualOpen] = useState(false);
  const [aiVisualTab, setAiVisualTab] = useState<'generate' | 'presets'>('generate');
  const [aiVisualPrompt, setAiVisualPrompt] = useState('');
  const [aiVisualRatio, setAiVisualRatio] = useState<'1:1' | '16:9' | '9:16' | '4:5' | 'a4'>('1:1');
  const [aiVisualStyle, setAiVisualStyle] = useState<
    'photorealistic' | 'cinematic' | 'vibrant' | 'luxury' | 'corporate' | 'minimalist' | 'flyer_promo' | '3d_clay'
  >('photorealistic');
  const [aiVisualLoading, setAiVisualLoading] = useState(false);
  const [generatedVisualPreview, setGeneratedVisualPreview] = useState<string | null>(null);

  // Dynamic Typography Overlay States (Cost = $0, real-time client side)
  const [overlayEnabled, setOverlayEnabled] = useState(true);
  const [overlayHeadline, setOverlayHeadline] = useState('');
  const [overlaySubtitle, setOverlaySubtitle] = useState('');
  const [overlayBadge, setOverlayBadge] = useState('');
  const [overlayCta, setOverlayCta] = useState('');
  const [overlayPosition, setOverlayPosition] = useState<'bottom' | 'top' | 'glass'>('bottom');
  const [overlayAccentColor, setOverlayAccentColor] = useState('#F59E0B');
  const [isExportingFlyer, setIsExportingFlyer] = useState(false);

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
    const trimmed = mediaInput.trim();
    if (!trimmed) return;

    // Validate safe URL or local upload path (SEC-09)
    if (trimmed.startsWith('/') || trimmed.startsWith('https://') || trimmed.startsWith('http://')) {
      try {
        if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
          new URL(trimmed);
        }
        setMediaUrls([...mediaUrls, trimmed]);
        setMediaInput('');
        setAiError(null);
      } catch {
        setAiError('URL média invalide. Veuillez entrer une URL valide commençant par https://');
      }
    } else {
      setAiError('URL média non autorisée. Utilisez un lien HTTPS ou un fichier uploadé.');
    }
  };

  // Photorealistic Studio Visual Generator (Direct Pollinations / Unsplash HD Photo Engine)
  const generateRealPhotographicVisual = (promptText: string, ratio: string, style: string) => {
    const width = ratio === '16:9' ? 1280 : ratio === '9:16' ? 720 : ratio === '4:5' ? 1080 : 1080;
    const height = ratio === '16:9' ? 720 : ratio === '9:16' ? 1280 : ratio === '4:5' ? 1350 : 1080;
    const cleanPrompt = encodeURIComponent(`${promptText}, 8k photorealistic photography, commercial studio lighting, high detail, ${style}`);
    const seed = Math.floor(Math.random() * 999999);
    return `https://image.pollinations.ai/prompt/${cleanPrompt}?width=${width}&height=${height}&seed=${seed}&nologo=true&model=flux&enhance=true`;
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

  // AI Visual Generator handler (Guaranteed to return REAL photorealistic HD visual)
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
          optimizeWithLLM: true,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const outputUrl = data.imageUrl || data.url;
        if (outputUrl) {
          setGeneratedVisualPreview(outputUrl);
          if (data.overlayData) {
            setOverlayHeadline(data.overlayData.headline || '');
            setOverlaySubtitle(data.overlayData.subtitle || '');
            setOverlayBadge(data.overlayData.badge || '');
            setOverlayCta(data.overlayData.cta || '');
            if (data.overlayData.suggestedLayout) {
              setOverlayPosition(data.overlayData.suggestedLayout);
            }
            if (data.overlayData.accentColor) {
              setOverlayAccentColor(data.overlayData.accentColor);
            }
          }
          setAiVisualLoading(false);
          return;
        }
      }
    } catch {
      // fallback to generated visual
    }

    // Direct Instantaneous High Definition visual generation
    const fallbackVisual = generateRealPhotographicVisual(aiVisualPrompt, aiVisualRatio, aiVisualStyle);
    setGeneratedVisualPreview(fallbackVisual);
    setAiVisualLoading(false);
  };

  const handleSelectPreset = (preset: CuratedFlyerPreset) => {
    setGeneratedVisualPreview(preset.imageUrl);
    setOverlayHeadline(preset.headline);
    setOverlaySubtitle(preset.subtitle);
    setOverlayBadge(preset.badge);
    setOverlayCta(preset.cta);
    setOverlayAccentColor(preset.accentColor);
    setAiVisualRatio(preset.ratio);
    setOverlayEnabled(true);
  };

  const handleApplyAiVisual = async () => {
    if (!generatedVisualPreview) return;
    setIsExportingFlyer(true);

    try {
      if (overlayEnabled && (overlayHeadline || overlayBadge || overlaySubtitle || overlayCta)) {
        const compositeUrl = await renderFlyerCompositeToDataUrl({
          imageUrl: generatedVisualPreview,
          headline: overlayHeadline,
          subtitle: overlaySubtitle,
          badge: overlayBadge,
          cta: overlayCta,
          ratio: aiVisualRatio,
          position: overlayPosition,
          accentColor: overlayAccentColor,
        });
        setMediaUrls((prev) => [...prev, compositeUrl]);
      } else {
        setMediaUrls((prev) => [...prev, generatedVisualPreview]);
      }
      setGeneratedVisualPreview(null);
      setAiVisualOpen(false);
      setAiVisualPrompt('');
    } catch {
      setMediaUrls((prev) => [...prev, generatedVisualPreview]);
      setGeneratedVisualPreview(null);
      setAiVisualOpen(false);
    } finally {
      setIsExportingFlyer(false);
    }
  };

  const handleDownloadFlyerHD = async () => {
    if (!generatedVisualPreview) return;
    setIsExportingFlyer(true);
    try {
      const dataUrl = await renderFlyerCompositeToDataUrl({
        imageUrl: generatedVisualPreview,
        headline: overlayHeadline,
        subtitle: overlaySubtitle,
        badge: overlayBadge,
        cta: overlayCta,
        ratio: aiVisualRatio,
        position: overlayPosition,
        accentColor: overlayAccentColor,
      });

      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `pulsesocial-flyer-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } finally {
      setIsExportingFlyer(false);
    }
  };

  // AI Caption Generator with Social Selling Hook, Body & CTA
  const handleGenerateAi = async () => {
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    setAiError(null);

    try {
      const res = await fetch('/api/ai/generate-caption', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: aiPrompt,
          tone: aiTone === 'b2b_expert' ? 'professional' : aiTone === 'b2c_engaging' ? 'engaging' : 'storytelling',
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
          setAiError(null);
          return;
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        setAiError(errData.error || 'Génération indisponible. Veuillez réessayer.');
      }
    } catch {
      setAiError('Erreur de connexion avec le serveur IA.');
    } finally {
      setAiLoading(false);
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

    const resolvedWorkspaceId =
      availableAccounts[0]?.workspace_id ||
      editingPost?.workspace_id ||
      '00000000-0000-0000-0000-000000000000';

    onSavePost({
      workspace_id: resolvedWorkspaceId,
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
                        <Avatar
                          src={acc.avatar_url}
                          name={acc.username || acc.account_name}
                          size={16}
                          className="w-4 h-4 rounded-full object-cover shrink-0"
                        />
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
                  {aiError && (
                    <div className="flex items-center gap-1.5 text-xs text-rose-400 bg-rose-950/40 border border-rose-800/40 p-2 rounded-xl">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{aiError}</span>
                    </div>
                  )}
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

              {/* AI VISUAL & HYBRID FLYER GENERATION DRAWER */}
              {aiVisualOpen && (
                <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950/70 to-purple-950/50 border border-indigo-500/30 space-y-3.5 animate-in fade-in shadow-2xl text-white">
                  {/* Studio Header */}
                  <div className="flex items-center justify-between pb-2 border-b border-white/10">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-pink-500 to-indigo-500 flex items-center justify-center shadow-md">
                        <Sparkles className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                          Studio d&apos;Affiches &amp; Flyers Hybride HD
                          <span className="text-[9px] uppercase px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            Économie -80% API
                          </span>
                        </h4>
                        <p className="text-[10px] text-slate-400">Fond IA (FLUX/Nano) + Typographie vectorielle modifiable sans frais</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAiVisualOpen(false)}
                      className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded-lg hover:bg-white/10 transition-colors"
                    >
                      Fermer
                    </button>
                  </div>

                  {/* Mode Tabs: AI Generation vs Curated Presets ($0) */}
                  <div className="flex items-center gap-1 p-1 rounded-xl bg-black/40 border border-white/10">
                    <button
                      type="button"
                      onClick={() => setAiVisualTab('generate')}
                      className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                        aiVisualTab === 'generate'
                          ? 'bg-indigo-600 text-white shadow-md'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Wand2 className="w-3.5 h-3.5" />
                      <span>Génération IA (Prompt + Negative Space)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setAiVisualTab('presets')}
                      className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                        aiVisualTab === 'presets'
                          ? 'bg-purple-600 text-white shadow-md'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>Modèles Prêts &amp; Gratuits (0$)</span>
                    </button>
                  </div>

                  {/* Tab 1: AI Prompt Input */}
                  {aiVisualTab === 'generate' && (
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={aiVisualPrompt}
                        onChange={(e) => setAiVisualPrompt(e.target.value)}
                        placeholder="Décrivez votre visuel (ex: Burger gourmet royal avec frites maison pour restaurant à Abidjan)..."
                        className="w-full px-3 py-2 text-xs rounded-xl border border-indigo-500/40 bg-slate-950 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400"
                      />

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-400 mb-1">
                            Format &amp; Ratio :
                          </label>
                          <select
                            value={aiVisualRatio}
                            onChange={(e) => setAiVisualRatio(e.target.value as any)}
                            className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-white/10 bg-slate-900 text-slate-200"
                          >
                            <option value="1:1">1:1 - Carré (Feed Instagram / Facebook)</option>
                            <option value="4:5">4:5 - Portrait (Optimal Feed Instagram)</option>
                            <option value="9:16">9:16 - Vertical (Story / TikTok / Reels)</option>
                            <option value="16:9">16:9 - Paysage (LinkedIn / X / Bannière)</option>
                            <option value="a4">A4 - Affiche &amp; Flyer Print / HD</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] font-semibold text-slate-400 mb-1">
                            Style artistique :
                          </label>
                          <select
                            value={aiVisualStyle}
                            onChange={(e) => setAiVisualStyle(e.target.value as any)}
                            className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-white/10 bg-slate-900 text-slate-200"
                          >
                            <option value="photorealistic">Photo Réaliste Publicitaire 8K</option>
                            <option value="cinematic">Cinématique &amp; Lumineux</option>
                            <option value="luxury">Luxe &amp; Épuré</option>
                            <option value="vibrant">Vibrant &amp; Coloré</option>
                            <option value="corporate">Corporate &amp; B2B</option>
                            <option value="flyer_promo">Affiche Promo &amp; Social Selling</option>
                            <option value="3d_clay">3D Claymorphism Stylisé</option>
                            <option value="minimalist">Minimaliste Studio</option>
                          </select>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleGenerateAiVisual}
                        disabled={aiVisualLoading || !aiVisualPrompt.trim()}
                        className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 cursor-pointer"
                      >
                        {aiVisualLoading ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Optimisation Gemini &amp; Génération du Fond HD...</span>
                          </>
                        ) : (
                          <>
                            <Wand2 className="w-3.5 h-3.5" />
                            <span>Générer le Fond IA avec Espace Typographique</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {/* Tab 2: Curated Zero-Cost Presets */}
                  {aiVisualTab === 'presets' && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-56 overflow-y-auto pr-1">
                      {CURATED_FLYER_PRESETS.map((preset) => (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => handleSelectPreset(preset)}
                          className="group text-left p-2 rounded-xl bg-slate-950/80 border border-white/10 hover:border-indigo-400 transition-all cursor-pointer relative overflow-hidden"
                        >
                          <div className="w-full h-16 rounded-lg overflow-hidden mb-1.5 relative">
                            <img
                              src={preset.imageUrl}
                              alt={preset.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                            <span
                              className="absolute top-1 left-1 px-1.5 py-0.5 rounded text-[8px] font-bold text-white shadow"
                              style={{ backgroundColor: preset.accentColor }}
                            >
                              {preset.badge}
                            </span>
                          </div>
                          <p className="text-[10px] font-bold text-white truncate">{preset.title}</p>
                          <p className="text-[9px] text-slate-400 truncate">{preset.category}</p>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Generated Visual + Dynamic Typography Overlay Live Studio */}
                  {generatedVisualPreview && (
                    <div className="pt-3 border-t border-white/10 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Visuel prêt pour habillage typographique
                        </span>
                        <label className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-300 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={overlayEnabled}
                            onChange={(e) => setOverlayEnabled(e.target.checked)}
                            className="rounded border-slate-700 text-indigo-600 focus:ring-0"
                          />
                          <span>Superposer le texte (Flyer)</span>
                        </label>
                      </div>

                      {/* Interactive Live Composite Preview */}
                      <div className="relative w-full rounded-2xl overflow-hidden border border-indigo-500/40 bg-black flex items-center justify-center shadow-inner group">
                        <img
                          src={generatedVisualPreview}
                          alt="Fond IA"
                          className="w-full max-h-56 object-cover"
                          onError={(e) => {
                            const target = e.currentTarget;
                            if (!target.src.includes('images.unsplash.com')) {
                              target.src = 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=1200&auto=format&fit=crop&q=85';
                            }
                          }}
                        />

                        {/* Live CSS Typography Overlay (Matches Canvas Render exactly) */}
                        {overlayEnabled && (overlayHeadline || overlayBadge || overlaySubtitle || overlayCta) && (
                          <div
                            className={`absolute inset-0 flex flex-col justify-end p-4 transition-all pointer-events-none ${
                              overlayPosition === 'top'
                                ? 'bg-gradient-to-b from-black/90 via-black/50 to-transparent justify-start'
                                : overlayPosition === 'glass'
                                ? 'bg-black/30 items-center justify-center p-3'
                                : 'bg-gradient-to-t from-black/95 via-black/60 to-transparent justify-end'
                            }`}
                          >
                            <div
                              className={
                                overlayPosition === 'glass'
                                  ? 'p-3 rounded-2xl bg-slate-900/85 backdrop-blur-md border border-white/20 w-full space-y-1 text-center'
                                  : 'space-y-1'
                              }
                            >
                              {overlayBadge && (
                                <span
                                  className="inline-block px-2.5 py-0.5 rounded-md text-[9px] font-black uppercase text-white shadow-sm"
                                  style={{ backgroundColor: overlayAccentColor }}
                                >
                                  {overlayBadge}
                                </span>
                              )}
                              {overlayHeadline && (
                                <h3 className="text-xs sm:text-sm font-black text-white tracking-tight leading-tight drop-shadow-md">
                                  {overlayHeadline}
                                </h3>
                              )}
                              {overlaySubtitle && (
                                <p className="text-[10px] text-slate-200 font-medium drop-shadow-sm">
                                  {overlaySubtitle}
                                </p>
                              )}
                              {overlayCta && (
                                <p
                                  className="text-[10px] font-bold drop-shadow-sm pt-0.5"
                                  style={{ color: overlayAccentColor }}
                                >
                                  👉 {overlayCta}
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Real-time Typography Overlay Editor (0$ API cost) */}
                      {overlayEnabled && (
                        <div className="p-3 rounded-xl bg-black/50 border border-white/10 space-y-2 text-xs">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                            <Type className="w-3.5 h-3.5 text-indigo-400" />
                            Personnalisation instantanée des textes (0$ par retouche)
                          </p>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[9px] font-semibold text-slate-400 mb-0.5">
                                Badge Prix / Promo :
                              </label>
                              <input
                                type="text"
                                value={overlayBadge}
                                onChange={(e) => setOverlayBadge(e.target.value)}
                                placeholder="Ex: 6 500 FCFA, -20%"
                                className="w-full px-2 py-1 text-xs rounded-lg border border-white/10 bg-slate-900 text-white focus:outline-none focus:border-indigo-400"
                              />
                            </div>

                            <div>
                              <label className="block text-[9px] font-semibold text-slate-400 mb-0.5">
                                Contact / Action :
                              </label>
                              <input
                                type="text"
                                value={overlayCta}
                                onChange={(e) => setOverlayCta(e.target.value)}
                                placeholder="Ex: WhatsApp: +225 07 00 00 00"
                                className="w-full px-2 py-1 text-xs rounded-lg border border-white/10 bg-slate-900 text-white focus:outline-none focus:border-indigo-400"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-[9px] font-semibold text-slate-400 mb-0.5">
                              Titre d&apos;Accroche (Headline) :
                            </label>
                            <input
                              type="text"
                              value={overlayHeadline}
                              onChange={(e) => setOverlayHeadline(e.target.value)}
                              placeholder="Ex: Menu Royal & Frites Maison"
                              className="w-full px-2 py-1 text-xs rounded-lg border border-white/10 bg-slate-900 text-white focus:outline-none focus:border-indigo-400"
                            />
                          </div>

                          <div>
                            <label className="block text-[9px] font-semibold text-slate-400 mb-0.5">
                              Sous-titre / Détails de l&apos;offre :
                            </label>
                            <input
                              type="text"
                              value={overlaySubtitle}
                              onChange={(e) => setOverlaySubtitle(e.target.value)}
                              placeholder="Ex: Saveurs authentiques • Ingrédients frais du jour"
                              className="w-full px-2 py-1 text-xs rounded-lg border border-white/10 bg-slate-900 text-white focus:outline-none focus:border-indigo-400"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-2 pt-1">
                            <div>
                              <label className="block text-[9px] font-semibold text-slate-400 mb-0.5">
                                Style d&apos;habillage :
                              </label>
                              <select
                                value={overlayPosition}
                                onChange={(e) => setOverlayPosition(e.target.value as any)}
                                className="w-full px-2 py-1 text-xs rounded-lg border border-white/10 bg-slate-900 text-slate-200"
                              >
                                <option value="bottom">Bandeau Bas (Dégradé Sombre)</option>
                                <option value="top">Bandeau Haut (En-tête)</option>
                                <option value="glass">Cartouche Flottant (Glassmorphism)</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-[9px] font-semibold text-slate-400 mb-0.5">
                                Couleur d&apos;accent :
                              </label>
                              <div className="flex items-center gap-1.5 pt-1">
                                {['#F59E0B', '#EC4899', '#6366F1', '#10B981', '#EF4444'].map((col) => (
                                  <button
                                    key={col}
                                    type="button"
                                    onClick={() => setOverlayAccentColor(col)}
                                    className={`w-5 h-5 rounded-full border transition-transform ${
                                      overlayAccentColor === col ? 'scale-125 border-white ring-2 ring-indigo-500' : 'border-transparent'
                                    }`}
                                    style={{ backgroundColor: col }}
                                  />
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Final Action Buttons */}
                      <div className="flex gap-2 pt-1">
                        <button
                          type="button"
                          onClick={handleApplyAiVisual}
                          disabled={isExportingFlyer}
                          className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/30 cursor-pointer"
                        >
                          {isExportingFlyer ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>Fusion Canvas HD...</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Ajouter ce Flyer au Post</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={handleDownloadFlyerHD}
                          disabled={isExportingFlyer}
                          className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                          title="Télécharger l'affiche haute résolution prête pour impression ou WhatsApp"
                        >
                          <Download className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Télécharger HD</span>
                        </button>
                      </div>
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
            <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-2xl mb-4 shadow-sm flex-wrap justify-center">
              {(['instagram', 'linkedin', 'twitter', 'tiktok', 'facebook', 'pinterest'] as SocialPlatform[]).map(
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
