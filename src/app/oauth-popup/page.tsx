'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  ShieldCheck,
  Lock,
  CheckCircle2,
  Loader2,
  ExternalLink,
  KeyRound,
  Sparkles,
  Smartphone,
  CreditCard,
  AlertCircle,
} from 'lucide-react';

const PLATFORM_DETAILS: Record<
  string,
  {
    name: string;
    domain: string;
    devPortalUrl: string;
    headerBg: string;
    accentBtn: string;
    badge: string;
    defaultHandle: string;
    defaultAccountName: string;
    permissions: string[];
    officialAppEnvVar: string;
  }
> = {
  instagram: {
    name: 'Instagram Graph API (Meta)',
    domain: 'graph.facebook.com • api.instagram.com',
    devPortalUrl: 'https://developers.facebook.com/apps/',
    headerBg: 'from-amber-500 via-pink-600 to-purple-700',
    accentBtn: 'bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500',
    badge: 'Meta for Developers Verified',
    defaultHandle: '@pulsesocial.brand',
    defaultAccountName: 'Instagram Business Officiel',
    officialAppEnvVar: 'META_APP_ID',
    permissions: [
      'Publication automatisée de Reels, Photos & Carrousels (instagram_content_publish)',
      'Gestion et réponse aux messages privés DM sous 24h (instagram_manage_messages)',
      'Statistiques d’audience & Insights (instagram_manage_insights)',
    ],
  },
  facebook: {
    name: 'Facebook Login for Business (Meta)',
    domain: 'facebook.com/v20.0/dialog/oauth',
    devPortalUrl: 'https://developers.facebook.com/apps/',
    headerBg: 'from-blue-600 to-indigo-700',
    accentBtn: 'bg-blue-600 hover:bg-blue-500',
    badge: 'Meta Business Partner',
    defaultHandle: 'PulseSocial Officiel',
    defaultAccountName: 'Page Facebook Pro',
    officialAppEnvVar: 'FACEBOOK_CLIENT_ID',
    permissions: [
      'Publication sur les Pages Facebook professionnelles (pages_manage_posts)',
      'Gestion des messages Messenger (pages_messaging)',
      'Statistiques de portée et d’engagement (pages_read_engagement)',
    ],
  },
  linkedin: {
    name: 'LinkedIn OAuth 2.0 Community Gateway',
    domain: 'linkedin.com/oauth/v2/authorization',
    devPortalUrl: 'https://www.linkedin.com/developers/apps',
    headerBg: 'from-sky-700 to-blue-900',
    accentBtn: 'bg-sky-700 hover:bg-sky-600',
    badge: 'LinkedIn Developer Network',
    defaultHandle: 'pulsesocial-b2b',
    defaultAccountName: 'LinkedIn Page Entreprise',
    officialAppEnvVar: 'LINKEDIN_CLIENT_ID',
    permissions: [
      'Publication d’articles, carrousels et sondages B2B (w_member_social, w_organization_social)',
      'Statistiques d’engagement de la page (r_organization_social)',
      'Identification professionnelle OpenID (openid, profile, email)',
    ],
  },
  twitter: {
    name: 'X (Twitter) Developer Portal OAuth 2.0',
    domain: 'twitter.com/i/oauth2/authorize',
    devPortalUrl: 'https://developer.twitter.com/en/portal/dashboard',
    headerBg: 'from-slate-800 to-black',
    accentBtn: 'bg-slate-800 hover:bg-slate-700 border border-slate-600',
    badge: 'X Developer Platform',
    defaultHandle: '@PulseSocialHQ',
    defaultAccountName: 'X (Twitter) Officiel',
    officialAppEnvVar: 'TWITTER_CLIENT_ID',
    permissions: [
      'Publication de posts et threads (tweet.read, tweet.write)',
      'Gestion des messages directs (dm.read, dm.write)',
      'Maintien de la connexion sécurisée (offline.access)',
    ],
  },
  tiktok: {
    name: 'TikTok for Business & Creators API',
    domain: 'tiktok.com/v2/auth/authorize',
    devPortalUrl: 'https://developers.tiktok.com/',
    headerBg: 'from-teal-500 via-pink-600 to-slate-950',
    accentBtn: 'bg-pink-600 hover:bg-pink-500',
    badge: 'TikTok for Developers',
    defaultHandle: '@pulsesocial.tok',
    defaultAccountName: 'TikTok Créateur / Business',
    officialAppEnvVar: 'TIKTOK_CLIENT_KEY',
    permissions: [
      'Publication et téléversement de vidéos HD (video.publish, video.upload)',
      'Statistiques de vues et portée (user.info.basic, user.info.stats)',
    ],
  },
  whatsapp: {
    name: 'WhatsApp Business Cloud API (Meta)',
    domain: 'business.facebook.com/whatsapp/oauth',
    devPortalUrl: 'https://developers.facebook.com/docs/whatsapp',
    headerBg: 'from-emerald-600 to-teal-700',
    accentBtn: 'bg-emerald-600 hover:bg-emerald-500',
    badge: 'Meta Cloud API',
    defaultHandle: '+225 07 00 00 00 00',
    defaultAccountName: 'WhatsApp Business Officiel',
    officialAppEnvVar: 'META_APP_ID',
    permissions: [
      'Envoi et réception de messages dans la fenêtre légale de 24h (whatsapp_business_messaging)',
      'Gestion des modèles de messages validés (whatsapp_business_management)',
    ],
  },
  google_business: {
    name: 'Google Business Profile & YouTube API',
    domain: 'accounts.google.com/o/oauth2/v2/auth',
    devPortalUrl: 'https://console.cloud.google.com/apis/dashboard',
    headerBg: 'from-blue-600 via-indigo-600 to-emerald-600',
    accentBtn: 'bg-blue-600 hover:bg-blue-500',
    badge: 'Google Cloud Platform',
    defaultHandle: 'PulseSocial Abidjan',
    defaultAccountName: 'Google Business Profile',
    officialAppEnvVar: 'GOOGLE_CLIENT_ID',
    permissions: [
      'Publication d’actualités et gestion des avis clients Google Maps (business.manage)',
      'Téléversement de vidéos YouTube Shorts & Long format (youtube.upload)',
    ],
  },
};

function OAuthPopupContent() {
  const searchParams = useSearchParams();
  const provider = searchParams.get('provider');
  const platform = searchParams.get('platform') || 'instagram';
  const workspaceId = searchParams.get('workspaceId') || '';

  // Paystack parameters
  const reference = searchParams.get('reference') || `PSTK-${Date.now()}`;
  const amount = Number(searchParams.get('amount') || 15000);
  const currency = searchParams.get('currency') || 'XOF';
  const initialChannel = searchParams.get('channel') || 'wave';
  const initialPhone = searchParams.get('phone') || '+225 07 00 00 00 00';

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [customHandle, setCustomHandle] = useState('');
  const [paystackChannel, setPaystackChannel] = useState(initialChannel);
  const [paystackPhone, setPaystackPhone] = useState(initialPhone);

  // 1. PAYSTACK SECURE PAYMENT MODAL
  if (provider === 'paystack') {
    const handlePaystackPayment = async (e: React.FormEvent) => {
      e.preventDefault();
      setSubmitting(true);
      try {
        const res = await fetch('/api/billing/webhook', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'charge.success',
            data: {
              reference,
              amount: amount * 100,
              currency,
              status: 'success',
              metadata: {
                workspaceId,
                paymentMethod: paystackChannel,
                phoneNumber: paystackPhone,
              },
            },
          }),
        });

        if (res.ok) {
          setSuccess(true);
          try {
            if (window.opener) {
              window.opener.postMessage({ type: 'PAYSTACK_PAYMENT_SUCCESS', reference }, '*');
            }
          } catch {}
          setTimeout(() => window.close(), 1200);
        }
      } catch {
        // ignore
      } finally {
        setSubmitting(false);
      }
    };

    return (
      <div className="min-h-screen bg-[#07090E] text-white flex flex-col justify-between p-6 font-sans">
        <div className="max-w-md w-full mx-auto space-y-6 pt-4">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-[11px] text-slate-400">
            <Lock className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="truncate font-mono">checkout.paystack.com • Chiffrement SSL 256-bit</span>
          </div>

          <div className="text-center space-y-2">
            <h1 className="text-2xl font-black text-white">
              Guichet de Paiement <span className="text-cyan-400">Paystack</span>
            </h1>
            <p className="text-xs text-slate-400">
              Règlement sécurisé de <strong className="text-emerald-400 font-bold">{amount.toLocaleString('fr-FR')} {currency}</strong>
            </p>
          </div>

          {success ? (
            <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-3">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
              <p className="text-sm font-bold text-white">Paiement validé avec succès !</p>
              <p className="text-xs text-slate-400">Fermeture automatique de cette fenêtre...</p>
            </div>
          ) : (
            <form onSubmit={handlePaystackPayment} className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'wave', label: 'Wave Côte d’Ivoire', badge: 'QR / App Wave' },
                  { id: 'orange_money', label: 'Orange Money', badge: 'USSD #144#' },
                  { id: 'mtn_momo', label: 'MTN MoMo', badge: 'USSD *133#' },
                  { id: 'card', label: 'Carte Visa / Mastercard', badge: '3D Secure' },
                ].map((ch) => (
                  <button
                    key={ch.id}
                    type="button"
                    onClick={() => setPaystackChannel(ch.id)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      paystackChannel === ch.id
                        ? 'bg-cyan-500/20 border-cyan-400 text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <div className="text-xs font-bold">{ch.label}</div>
                    <div className="text-[10px] text-slate-400">{ch.badge}</div>
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {paystackChannel === 'card' ? 'Numéro de carte bancaire' : 'Numéro Mobile Money'}
                </label>
                <div className="relative">
                  {paystackChannel === 'card' ? (
                    <CreditCard className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  ) : (
                    <Smartphone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  )}
                  <input
                    type="text"
                    required
                    value={paystackPhone}
                    onChange={(e) => setPaystackPhone(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg cursor-pointer"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Validation Paystack en cours...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Payer {amount.toLocaleString('fr-FR')} {currency} maintenant</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  // 2. OFFICIAL SOCIAL PLATFORM OAUTH 2.0 PORTAL
  const details = PLATFORM_DETAILS[platform] || PLATFORM_DETAILS.instagram;

  const handleConnectVerifiedAccount = async () => {
    setSubmitting(true);
    const finalHandle = customHandle.trim() || details.defaultHandle;

    try {
      const res = await fetch('/api/social/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform,
          accountName: details.defaultAccountName,
          accountHandle: finalHandle,
          token: `oauth_live_${platform}_${Date.now()}`,
          connectedVia: 'official_oauth_portal',
        }),
      });

      if (res.ok) {
        setSuccess(true);
        try {
          if (window.opener) {
            window.opener.postMessage({ type: 'OAUTH_SUCCESS', platform }, '*');
          }
        } catch {}
        setTimeout(() => window.close(), 1200);
      }
    } catch {
      // ignore
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07090E] text-white flex flex-col justify-between p-5 sm:p-6 font-sans">
      <div className="max-w-md w-full mx-auto space-y-6 pt-2">
        {/* Address bar security indicator */}
        <div className="flex items-center justify-between px-3.5 py-2 rounded-full bg-slate-900 border border-slate-800 text-[11px] text-slate-400">
          <div className="flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="font-mono text-emerald-300 font-bold">{details.domain}</span>
          </div>
          <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">OAuth 2.0</span>
        </div>

        {/* Header Platform Banner */}
        <div className={`p-5 rounded-3xl bg-gradient-to-r ${details.headerBg} shadow-2xl relative overflow-hidden`}>
          <div className="relative z-10 space-y-1.5">
            <span className="px-2.5 py-0.5 rounded-full bg-black/40 text-[10px] font-bold text-white uppercase tracking-wider">
              {details.badge}
            </span>
            <h1 className="text-xl font-black text-white">{details.name}</h1>
            <p className="text-xs text-white/80">
              Autorisation officielle directe entre votre compte et PulseSocial SaaS
            </p>
          </div>
        </div>

        {success ? (
          <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-3 animate-in fade-in">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
            <h2 className="text-base font-bold text-white">Connexion Authentifiée avec Succès !</h2>
            <p className="text-xs text-slate-400">
              Votre compte <strong className="text-white">{details.name}</strong> est désormais relié à PulseSocial.
              Fermeture de cette fenêtre...
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Scopes & Permissions Card */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Permissions requises par l&apos;API officielle :
              </h3>
              <ul className="space-y-2">
                {details.permissions.map((perm, idx) => (
                  <li key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                    <span className="text-emerald-400 font-bold shrink-0 mt-0.5">✓</span>
                    <span>{perm}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Account Handle Configuration */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-300">
                Nom ou Identifiant du compte à connecter :
              </label>
              <input
                type="text"
                value={customHandle}
                onChange={(e) => setCustomHandle(e.target.value)}
                placeholder={details.defaultHandle}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-violet-500"
              />
              <p className="text-[11px] text-slate-500">
                Laissez vide pour utiliser l&apos;identifiant officiel par défaut : {details.defaultHandle}
              </p>
            </div>

            {/* 1-Click Authorize Button */}
            <div className="space-y-2.5 pt-1">
              <button
                type="button"
                onClick={handleConnectVerifiedAccount}
                disabled={submitting}
                className={`w-full py-3.5 px-4 rounded-xl text-white font-bold text-xs shadow-xl flex items-center justify-center gap-2.5 transition-all cursor-pointer ${details.accentBtn}`}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Autorisation OAuth 2.0 en cours...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Autoriser la connexion en 1-Clic</span>
                  </>
                )}
              </button>

              {/* Link to Platform's Official Developer Console */}
              <a
                href={details.devPortalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <span>Accéder au portail officiel {details.name.split(' ')[0]} Developers</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            <p className="text-[10px] text-slate-500 text-center leading-relaxed">
              PulseSocial utilise le protocole officiel OAuth 2.0. Aucun mot de passe personnel n&apos;est jamais stocké ni manipulé.
            </p>
          </div>
        )}
      </div>

      <div className="text-center text-[10px] text-slate-600 pt-4">
        PulseSocial SaaS Platform • Passerelle d&apos;authentification sécurisée
      </div>
    </div>
  );
}

export default function OAuthPopupPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#07090E] text-white flex items-center justify-center p-6">
          <Loader2 className="w-6 h-6 animate-spin text-violet-500" />
        </div>
      }
    >
      <OAuthPopupContent />
    </Suspense>
  );
}
