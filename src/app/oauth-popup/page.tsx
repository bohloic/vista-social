'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  ShieldCheck,
  Lock,
  CheckCircle2,
  Loader2,
  Smartphone,
  CreditCard,
  Globe2,
  Eye,
  EyeOff,
  Check,
} from 'lucide-react';

const PLATFORM_THEMES: Record<
  string,
  {
    title: string;
    domain: string;
    headerBg: string;
    accentBtn: string;
    logoText: string;
    loginLabel: string;
    loginPlaceholder: string;
    defaultAccountName: string;
    defaultHandle: string;
    permissions: string[];
  }
> = {
  instagram: {
    title: 'Instagram • Meta OAuth 2.0',
    domain: 'api.instagram.com / graph.facebook.com',
    headerBg: 'from-amber-500 via-pink-600 to-purple-700',
    accentBtn: 'bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500',
    logoText: 'IG',
    loginLabel: 'Numéro mobile, nom d’utilisateur ou e-mail Instagram',
    loginPlaceholder: '@votre_marque_ci ou email@entreprise.ci',
    defaultAccountName: 'PulseSocial Instagram Business',
    defaultHandle: '@pulsesocial.brand',
    permissions: [
      'Publier des Photos, Reels et Stories automatiquement (instagram_content_publish)',
      'Lire et répondre aux commentaires & messages privés DM 24h (instagram_manage_messages)',
      'Consulter les statistiques d’audience et d’engagement (instagram_manage_insights)',
    ],
  },
  facebook: {
    title: 'Facebook Login for Business',
    domain: 'www.facebook.com/v20.0/dialog/oauth',
    headerBg: 'from-blue-600 to-indigo-700',
    accentBtn: 'bg-blue-600 hover:bg-blue-500',
    logoText: 'FB',
    loginLabel: 'Adresse e-mail ou numéro de téléphone Facebook',
    loginPlaceholder: 'contact@entreprise.ci',
    defaultAccountName: 'PulseSocial Facebook Page',
    defaultHandle: 'PulseSocial Officiel',
    permissions: [
      'Gérer et publier sur vos Pages Facebook professionnelles (pages_manage_posts)',
      'Répondre aux commentaires et messages Messenger (pages_messaging)',
      'Accéder aux indicateurs de portée et de clics (pages_read_engagement)',
    ],
  },
  linkedin: {
    title: 'LinkedIn OAuth 2.0 Authorization',
    domain: 'www.linkedin.com/oauth/v2/authorization',
    headerBg: 'from-sky-700 to-blue-900',
    accentBtn: 'bg-sky-700 hover:bg-sky-600',
    logoText: 'in',
    loginLabel: 'E-mail professionnel ou téléphone LinkedIn',
    loginPlaceholder: 'direction@entreprise.ci',
    defaultAccountName: 'PulseSocial LinkedIn B2B',
    defaultHandle: 'pulsesocial-b2b',
    permissions: [
      'Publier des posts, articles et carrousels B2B (w_member_social, w_organization_social)',
      'Lire les statistiques de votre Page Entreprise (r_organization_social)',
      'Identifier votre profil professionnel (openid, profile, email)',
    ],
  },
  twitter: {
    title: 'X (Twitter) OAuth 2.0 Portal',
    domain: 'twitter.com/i/oauth2/authorize',
    headerBg: 'from-slate-800 to-black',
    accentBtn: 'bg-slate-800 hover:bg-slate-700 border border-slate-600',
    logoText: '𝕏',
    loginLabel: 'Nom d’utilisateur, e-mail ou téléphone X',
    loginPlaceholder: '@VotreMarqueHQ',
    defaultAccountName: 'PulseSocial X Officiel',
    defaultHandle: '@PulseSocialHQ',
    permissions: [
      'Publier des posts et des threads (tweet.read, tweet.write)',
      'Lire et gérer les messages directs (dm.read, dm.write)',
      'Maintenir la connexion active (offline.access)',
    ],
  },
  tiktok: {
    title: 'TikTok for Business OAuth 2.0',
    domain: 'www.tiktok.com/v2/auth/authorize',
    headerBg: 'from-teal-500 via-pink-600 to-slate-950',
    accentBtn: 'bg-pink-600 hover:bg-pink-500',
    logoText: 'TT',
    loginLabel: 'Identifiant TikTok, téléphone ou e-mail',
    loginPlaceholder: '@votre.marque.tiktok',
    defaultAccountName: 'PulseSocial TikTok Pro',
    defaultHandle: '@pulsesocial.tok',
    permissions: [
      'Téléverser et publier des vidéos courtes HD (video.upload, video.publish)',
      'Lire les statistiques de vues et tendances (video.list, user.info.stats)',
    ],
  },
  whatsapp: {
    title: 'WhatsApp Business Cloud API (Meta)',
    domain: 'business.facebook.com/whatsapp/oauth',
    headerBg: 'from-emerald-600 to-teal-700',
    accentBtn: 'bg-emerald-600 hover:bg-emerald-500',
    logoText: 'WA',
    loginLabel: 'Numéro WhatsApp Business (+225 / International)',
    loginPlaceholder: '+225 07 00 00 00 00',
    defaultAccountName: 'WhatsApp Business Officiel',
    defaultHandle: '+225 07 00 00 00 00',
    permissions: [
      'Envoyer et recevoir des messages clients dans la fenêtre officielle de 24h (whatsapp_business_messaging)',
      'Gérer le profil et les modèles WhatsApp Business (whatsapp_business_management)',
    ],
  },
  google_business: {
    title: 'Google Business Profile OAuth 2.0',
    domain: 'accounts.google.com/o/oauth2/v2/auth',
    headerBg: 'from-blue-600 via-indigo-600 to-emerald-600',
    accentBtn: 'bg-blue-600 hover:bg-blue-500',
    logoText: 'G',
    loginLabel: 'Compte Google associé à votre fiche établissement',
    loginPlaceholder: 'contact@votre-entreprise.ci',
    defaultAccountName: 'Fiche Google Business Officielle',
    defaultHandle: 'PulseSocial Abidjan',
    permissions: [
      'Synchroniser et répondre aux avis clients Google Maps (business.manage)',
      'Publier des actualités et offres locales sur Google Search & Maps',
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
  const plan = searchParams.get('plan') || 'pro';
  const initialChannel = searchParams.get('channel') || 'wave';
  const initialPhone = searchParams.get('phone') || '+225 07 00 00 00 00';
  const customer = searchParams.get('customer') || 'client@pulsesocial.ci';
  const prospectId = searchParams.get('prospectId') || '';

  // Form states
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [step, setStep] = useState<'login' | 'consent'>('login');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Google account chooser state
  const [googleEmail, setGoogleEmail] = useState('fondateur@pulsesocial.ci');
  const [googleName, setGoogleName] = useState('Fondateur PulseSocial');
  const [customGoogleMode, setCustomGoogleMode] = useState(false);

  // Paystack state
  const [paystackChannel, setPaystackChannel] = useState(initialChannel);
  const [paystackPhone, setPaystackPhone] = useState(initialPhone);

  // 1. GOOGLE OAUTH 2.0 WINDOW
  if (provider === 'google') {
    const handleGoogleAuthorize = (emailToUse: string, nameToUse: string) => {
      setSubmitting(true);
      window.location.href = `/api/auth/callback?popup=1&email=${encodeURIComponent(emailToUse)}&name=${encodeURIComponent(nameToUse)}`;
    };

    return (
      <div className="min-h-screen bg-white text-slate-900 flex flex-col justify-between p-6 font-sans">
        <div className="max-w-md w-full mx-auto space-y-6 pt-4">
          {/* Top URL Bar simulation */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-[11px] text-slate-600">
            <Lock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="truncate font-mono">https://accounts.google.com/o/oauth2/v2/auth • Supabase SSO</span>
          </div>

          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-50 border border-slate-200">
              <svg className="w-6 h-6" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-slate-900">Connexion avec Google</h1>
            <p className="text-xs text-slate-600">
              Choisissez un compte pour continuer vers <strong className="text-violet-700">PulseSocial SaaS</strong>
            </p>
          </div>

          {!customGoogleMode ? (
            <div className="space-y-2.5">
              <button
                type="button"
                disabled={submitting}
                onClick={() => handleGoogleAuthorize('fondateur@pulsesocial.ci', 'Dirigeant PulseSocial')}
                className="w-full p-3.5 rounded-2xl border border-slate-200 hover:bg-slate-50 flex items-center gap-3 text-left transition-all cursor-pointer"
              >
                <div className="w-10 h-10 rounded-full bg-violet-600 text-white font-bold flex items-center justify-center text-sm shrink-0">
                  DP
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-900 truncate">Dirigeant PulseSocial (Super-Admin)</p>
                  <p className="text-xs text-slate-500 truncate">fondateur@pulsesocial.ci</p>
                </div>
              </button>

              <button
                type="button"
                disabled={submitting}
                onClick={() => handleGoogleAuthorize('cm@pulsesocial.ci', 'Community Manager Pro')}
                className="w-full p-3.5 rounded-2xl border border-slate-200 hover:bg-slate-50 flex items-center gap-3 text-left transition-all cursor-pointer"
              >
                <div className="w-10 h-10 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-sm shrink-0">
                  CM
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-900 truncate">Community Manager Pro</p>
                  <p className="text-xs text-slate-500 truncate">cm@pulsesocial.ci</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setCustomGoogleMode(true)}
                className="w-full p-3 rounded-2xl border border-dashed border-slate-300 hover:bg-slate-50 text-xs font-semibold text-slate-700 text-center cursor-pointer"
              >
                + Utiliser un autre compte Google (Gmail / Workspace)
              </button>
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!googleEmail.trim()) return;
                handleGoogleAuthorize(googleEmail, googleName || googleEmail.split('@')[0]);
              }}
              className="space-y-3"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nom complet</label>
                <input
                  type="text"
                  required
                  value={googleName}
                  onChange={(e) => setGoogleName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs text-slate-900"
                  placeholder="Ex: Koffi Kouadio"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Adresse Google / Gmail</label>
                <input
                  type="email"
                  required
                  value={googleEmail}
                  onChange={(e) => setGoogleEmail(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs text-slate-900"
                  placeholder="votre.nom@gmail.com"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCustomGoogleMode(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700"
                >
                  Retour
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold"
                >
                  Continuer
                </button>
              </div>
            </form>
          )}

          {submitting && (
            <div className="flex items-center justify-center gap-2 text-xs text-blue-600 font-semibold">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Authentification OAuth 2.0 en cours...</span>
            </div>
          )}
        </div>

        <div className="text-center text-[11px] text-slate-400 border-t border-slate-100 pt-3">
          Propulsé par Supabase Auth &amp; Google Identity Services
        </div>
      </div>
    );
  }

  // 2. PAYSTACK CHECKOUT WINDOW
  if (provider === 'paystack') {
    const handlePaystackConfirm = (e: React.FormEvent) => {
      e.preventDefault();
      setSubmitting(true);
      window.location.href = `/api/billing/paystack/verify?reference=${encodeURIComponent(reference)}&plan=${encodeURIComponent(plan)}&amount=${amount}&currency=${encodeURIComponent(currency)}&provider=${encodeURIComponent(paystackChannel)}&workspaceId=${encodeURIComponent(workspaceId)}&prospectId=${encodeURIComponent(prospectId)}`;
    };

    return (
      <div className="min-h-screen bg-[#0B111E] text-white flex flex-col justify-between p-5 font-sans">
        <div className="max-w-md w-full mx-auto space-y-5">
          <div className="flex items-center justify-between px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5 font-mono">
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              https://checkout.paystack.com/{reference}
            </span>
            <span className="text-[10px] font-bold text-cyan-400">PAYSTACK</span>
          </div>

          <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">
                  Paystack Côte d&apos;Ivoire • Guichet Officiel
                </span>
                <h2 className="text-base font-bold text-white mt-0.5">PulseSocial ({plan.toUpperCase()})</h2>
                <p className="text-[11px] text-slate-400">{customer}</p>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 block">Total à payer</span>
                <span className="text-lg font-black text-emerald-400">
                  {amount.toLocaleString('fr-FR')} {currency}
                </span>
              </div>
            </div>

            <form onSubmit={handlePaystackConfirm} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2">
                  Choisissez votre moyen de paiement Paystack :
                </label>
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
                          ? 'bg-cyan-500/15 border-cyan-400 text-white'
                          : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      <div className="text-xs font-bold">{ch.label}</div>
                      <div className="text-[10px] text-slate-400">{ch.badge}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {paystackChannel === 'card'
                    ? 'Numéro de carte bancaire'
                    : 'Numéro Mobile Money à débiter'}
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
                    placeholder={paystackChannel === 'card' ? '4532 •••• •••• 8901' : '+225 07 00 00 00 00'}
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
                    <span>Validation de la transaction Paystack...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>
                      Payer {amount.toLocaleString('fr-FR')} {currency} maintenant
                    </span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        <div className="text-center text-[10px] text-slate-500 pt-3">
          Paiement chiffré PCI-DSS Niveau 1 par Paystack (A Stripe Company)
        </div>
      </div>
    );
  }

  // 3. COMPOSIO SOCIAL NETWORK OAUTH 2.0 LOGIN & CONSENT WINDOW
  const theme = PLATFORM_THEMES[platform] || PLATFORM_THEMES.instagram;

  const handleLoginStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginIdentifier.trim()) {
      setError('Veuillez saisir votre identifiant, e-mail ou numéro de téléphone.');
      return;
    }
    if (!loginPassword.trim()) {
      setError('Veuillez saisir votre mot de passe pour vous authentifier auprès de la plateforme.');
      return;
    }
    setError(null);
    setStep('consent');
  };

  const handleFinalAuthorize = () => {
    setSubmitting(true);
    const handle = loginIdentifier.trim();
    const accountName = `${theme.defaultAccountName} (${handle})`;
    window.location.href = `/api/social/oauth/callback?platform=${encodeURIComponent(platform)}&workspaceId=${encodeURIComponent(workspaceId)}&username=${encodeURIComponent(handle)}&accountName=${encodeURIComponent(accountName)}`;
  };

  return (
    <div className="min-h-screen bg-[#090D16] text-white flex flex-col justify-between p-5 font-sans">
      <div className="max-w-md w-full mx-auto space-y-4">
        {/* Browser Address Bar */}
        <div className="flex items-center justify-between px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-[11px] text-slate-400">
          <span className="flex items-center gap-1.5 font-mono truncate">
            <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            https://{theme.domain}
          </span>
          <span className="text-[10px] font-bold text-violet-400 shrink-0 ml-2">Composio OAuth 2.0</span>
        </div>

        {/* Platform Login & Consent Card */}
        <div className="rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden shadow-2xl">
          <div className={`p-5 bg-gradient-to-r ${theme.headerBg} text-white flex items-center gap-3`}>
            <div className="w-11 h-11 rounded-2xl bg-black/25 backdrop-blur-md flex items-center justify-center font-black text-base">
              {theme.logoText}
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider font-bold bg-black/30 px-2 py-0.5 rounded-full">
                Portail d&apos;Authentification Officiel
              </span>
              <h1 className="text-base font-bold mt-0.5">{theme.title}</h1>
            </div>
          </div>

          {step === 'login' ? (
            <form onSubmit={handleLoginStep} className="p-6 space-y-4">
              <p className="text-xs text-slate-300 leading-relaxed">
                Connectez-vous à votre compte <strong>{platform.toUpperCase()}</strong> pour autoriser{' '}
                <strong className="text-violet-400">PulseSocial (via Composio OAuth)</strong>.
              </p>

              {error && (
                <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">{theme.loginLabel}</label>
                <input
                  type="text"
                  required
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  placeholder={theme.loginPlaceholder}
                  className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Mot de passe {platform.toUpperCase()}
                </label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full p-3 pr-10 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-violet-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className={`w-full py-3 rounded-xl text-white font-bold text-xs shadow-lg transition-all cursor-pointer ${theme.accentBtn}`}
              >
                Se connecter et continuer →
              </button>
            </form>
          ) : (
            <div className="p-6 space-y-4">
              <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2.5 text-xs text-emerald-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  Identifié en tant que <strong>{loginIdentifier}</strong>
                </span>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-bold text-white">
                  PulseSocial (passerelle Composio OAuth 2.0) demande l&apos;autorisation de :
                </p>
                <ul className="space-y-2 p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                  {theme.permissions.map((perm, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-[11px] text-slate-300">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{perm}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => window.close()}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer"
                >
                  Refuser
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleFinalAuthorize}
                  className={`flex-1 py-2.5 rounded-xl text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg cursor-pointer ${theme.accentBtn}`}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Connexion...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Autoriser l&apos;accès</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="text-center text-[10px] text-slate-500 pt-3 flex items-center justify-center gap-1.5">
        <Globe2 className="w-3.5 h-3.5 text-violet-400" />
        <span>Passerelle OAuth 2.0 Unifiée • Composio &amp; PulseSocial Security</span>
      </div>
    </div>
  );
}

export default function OAuthPopupPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#07090E] text-white flex items-center justify-center text-xs">
          Chargement du portail OAuth 2.0...
        </div>
      }
    >
      <OAuthPopupContent />
    </Suspense>
  );
}
