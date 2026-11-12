'use client';

import React from 'react';
import { SocialPlatform } from '@/lib/types';
import { Heart, MessageCircle, Send, Bookmark, ThumbsUp, Share2, Repeat2, Music } from 'lucide-react';

interface PlatformPreviewProps {
  platform: SocialPlatform;
  content: string;
  mediaUrls: string[];
  firstComment?: string;
  accountName?: string;
  username?: string;
  avatarUrl?: string;
}

export function PlatformPreview({
  platform,
  content,
  mediaUrls,
  firstComment,
  accountName = 'Studio Nova',
  username = '@studionova.agency',
  avatarUrl = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80',
}: PlatformPreviewProps) {
  const displayContent = content || "Votre contenu apparaîtra ici en temps réel...";
  const displayMedia = mediaUrls.length > 0 ? mediaUrls[0] : null;

  return (
    <div className="w-full flex flex-col items-center">
      {/* Device frame container */}
      <div className="w-full max-w-[360px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xl overflow-hidden text-slate-900 dark:text-white text-xs">
        {/* Device Status Bar */}
        <div className="bg-slate-100 dark:bg-slate-800/80 px-4 py-1.5 flex justify-between items-center text-[10px] text-slate-500 font-medium border-b border-slate-200 dark:border-slate-700/50">
          <span>9:41</span>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-400 dark:bg-slate-500" />
            <span className="text-[10px]">5G</span>
            <span>100%</span>
          </div>
        </div>

        {/* INSTAGRAM PREVIEW */}
        {platform === 'instagram' && (
          <div className="p-3 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img src={avatarUrl} alt={accountName} className="w-7 h-7 rounded-full object-cover ring-2 ring-pink-500 p-0.5" />
                <div>
                  <p className="font-bold text-[11px] leading-tight">{username.replace('@', '')}</p>
                  <p className="text-[9px] text-slate-400">Paris, France</p>
                </div>
              </div>
              <span className="text-slate-400 font-bold">•••</span>
            </div>

            {/* Media */}
            <div className="w-full aspect-square bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden flex items-center justify-center border border-slate-200 dark:border-slate-700/60">
              {displayMedia ? (
                <img src={displayMedia} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center p-4 text-slate-400">
                  <span className="text-2xl block mb-1">📸</span>
                  <span>Aucun média sélectionné</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-3">
                <Heart className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                <MessageCircle className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                <Send className="w-4 h-4 text-slate-700 dark:text-slate-300" />
              </div>
              <Bookmark className="w-4 h-4 text-slate-700 dark:text-slate-300" />
            </div>

            {/* Caption */}
            <div className="space-y-1">
              <p className="font-semibold text-[10px]">1,489 J&apos;aime</p>
              <p className="text-[11px] leading-relaxed">
                <span className="font-bold mr-1.5">{username.replace('@', '')}</span>
                <span className="whitespace-pre-line text-slate-800 dark:text-slate-200">{displayContent}</span>
              </p>
              {firstComment && (
                <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-500">
                  <span className="font-semibold text-slate-700 dark:text-slate-300 mr-1.5">1er commentaire:</span>
                  <span>{firstComment}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* LINKEDIN PREVIEW */}
        {platform === 'linkedin' && (
          <div className="p-3.5 space-y-2.5">
            <div className="flex items-center gap-2.5">
              <img src={avatarUrl} alt={accountName} className="w-8 h-8 rounded-full object-cover" />
              <div>
                <p className="font-bold text-[11px] leading-tight flex items-center gap-1">
                  {accountName}
                  <span className="text-[9px] text-slate-400 font-normal">• 1er</span>
                </p>
                <p className="text-[9px] text-slate-500 dark:text-slate-400">Agence Conseil & Stratégie Social Media</p>
                <p className="text-[8px] text-slate-400">À l&apos;instant • 🌐</p>
              </div>
            </div>

            <p className="text-[11px] leading-relaxed whitespace-pre-line text-slate-800 dark:text-slate-200">
              {displayContent}
            </p>

            {displayMedia && (
              <div className="w-full aspect-video rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
                <img src={displayMedia} alt="Media preview" className="w-full h-full object-cover" />
              </div>
            )}

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-around text-slate-500 text-[10px]">
              <span className="flex items-center gap-1 hover:text-indigo-600"><ThumbsUp className="w-3.5 h-3.5" /> J&apos;aime</span>
              <span className="flex items-center gap-1 hover:text-indigo-600"><MessageCircle className="w-3.5 h-3.5" /> Commenter</span>
              <span className="flex items-center gap-1 hover:text-indigo-600"><Repeat2 className="w-3.5 h-3.5" /> Republier</span>
              <span className="flex items-center gap-1 hover:text-indigo-600"><Send className="w-3.5 h-3.5" /> Envoyer</span>
            </div>
          </div>
        )}

        {/* TWITTER / X PREVIEW */}
        {platform === 'twitter' && (
          <div className="p-3.5 space-y-2.5">
            <div className="flex items-start gap-2.5">
              <img src={avatarUrl} alt={accountName} className="w-8 h-8 rounded-full object-cover shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-bold text-[11px] text-slate-900 dark:text-white">{accountName}</span>
                  <span className="text-[10px] text-slate-400">{username}</span>
                  <span className="text-[9px] text-slate-400">• il y a 1m</span>
                </div>
                <p className="text-[11px] leading-relaxed mt-1 whitespace-pre-line text-slate-800 dark:text-slate-200">
                  {displayContent}
                </p>

                {displayMedia && (
                  <div className="w-full aspect-video rounded-xl overflow-hidden mt-2 border border-slate-200 dark:border-slate-700">
                    <img src={displayMedia} alt="Tweet media" className="w-full h-full object-cover" />
                  </div>
                )}

                <div className="flex items-center justify-between text-slate-400 text-[10px] mt-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="flex items-center gap-1"><MessageCircle className="w-3.5 h-3.5" /> 12</span>
                  <span className="flex items-center gap-1"><Repeat2 className="w-3.5 h-3.5" /> 34</span>
                  <span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5" /> 182</span>
                  <span className="flex items-center gap-1"><Share2 className="w-3.5 h-3.5" /></span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TIKTOK PREVIEW */}
        {platform === 'tiktok' && (
          <div className="relative aspect-[9/16] bg-slate-950 text-white rounded-2xl overflow-hidden flex flex-col justify-between p-3">
            {displayMedia ? (
              <img src={displayMedia} alt="TikTok Media" className="absolute inset-0 w-full h-full object-cover opacity-85" />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-950" />
            )}

            {/* TikTok Header */}
            <div className="relative z-10 flex justify-center gap-4 text-xs font-semibold pt-1">
              <span className="text-slate-400">Abonnements</span>
              <span className="text-white border-b-2 border-white pb-0.5">Pour toi</span>
            </div>

            {/* Right side actions */}
            <div className="relative z-10 self-end flex flex-col items-center gap-3 mr-1 text-[10px]">
              <div className="w-8 h-8 rounded-full border border-white overflow-hidden">
                <img src={avatarUrl} alt="TikTok Avatar" className="w-full h-full object-cover" />
              </div>
              <div className="flex flex-col items-center">
                <Heart className="w-5 h-5 text-white" />
                <span className="font-semibold">24.5k</span>
              </div>
              <div className="flex flex-col items-center">
                <MessageCircle className="w-5 h-5 text-white" />
                <span className="font-semibold">312</span>
              </div>
              <div className="flex flex-col items-center">
                <Bookmark className="w-5 h-5 text-white" />
                <span className="font-semibold">1.8k</span>
              </div>
              <div className="flex flex-col items-center">
                <Share2 className="w-5 h-5 text-white" />
                <span className="font-semibold">Partager</span>
              </div>
            </div>

            {/* TikTok Bottom caption & sound */}
            <div className="relative z-10 space-y-1.5 text-left bg-gradient-to-t from-black/80 via-black/40 to-transparent p-2 rounded-xl">
              <p className="font-bold text-[11px]">{username}</p>
              <p className="text-[10px] text-slate-200 line-clamp-3">{displayContent}</p>
              <div className="flex items-center gap-1.5 text-[9px] text-slate-300">
                <Music className="w-3 h-3 animate-spin" />
                <span>Son original - Studio Nova Agency • Trending Sound</span>
              </div>
            </div>
          </div>
        )}

        {/* FACEBOOK PREVIEW */}
        {platform === 'facebook' && (
          <div className="p-3.5 space-y-2.5">
            <div className="flex items-center gap-2">
              <img src={avatarUrl} alt={accountName} className="w-8 h-8 rounded-full object-cover" />
              <div>
                <p className="font-bold text-[11px] text-slate-900 dark:text-white">{accountName}</p>
                <p className="text-[9px] text-slate-400">À l&apos;instant • 👥 Public</p>
              </div>
            </div>

            <p className="text-[11px] leading-relaxed whitespace-pre-line text-slate-800 dark:text-slate-200">
              {displayContent}
            </p>

            {displayMedia && (
              <div className="w-full aspect-video rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
                <img src={displayMedia} alt="Facebook media" className="w-full h-full object-cover" />
              </div>
            )}

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-around text-slate-500 text-[10px]">
              <span className="flex items-center gap-1 hover:text-blue-600"><ThumbsUp className="w-3.5 h-3.5" /> J&apos;aime</span>
              <span className="flex items-center gap-1 hover:text-blue-600"><MessageCircle className="w-3.5 h-3.5" /> Commenter</span>
              <span className="flex items-center gap-1 hover:text-blue-600"><Share2 className="w-3.5 h-3.5" /> Partager</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

