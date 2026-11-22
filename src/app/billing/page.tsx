'use client';

import React, { useState, useEffect } from 'react';
import { LegalModal } from '@/components/LegalModals';
import {
  CreditCard,
  CheckCircle2,
  Zap,
  ShieldCheck,
  Smartphone,
  Sparkles,
  ArrowRight,
  Loader2,
  Lock,
  Globe2,
} from 'lucide-react';

interface PlanPrice {
  amount: number;
  symbol: string;
  period: string;
}

interface Plan {
  id: string;
  name: string;
  badge: string;
  description: string;
  price: Record<string, PlanPrice>;
  features: string[];
  popular: boolean;
}

const PLANS: Plan[] = [
  {
    id: 'starter',
    name: 'Starter Solo',
    badge: 'Idéal Débutant & Créateur',
    description: 'Pour les indépendants et créateurs gérant jusqu\'à 3 réseaux sociaux.',
    price: {
      XOF: { amount: 5000, symbol: 'FCFA', period: '/mois' },
      EUR: { amount: 9, symbol: '€', period: '/mois' },
      USD: { amount: 10, symbol: '$', period: '/mois' },
    },
    features: [
      'Jusqu\'à 3 comptes sociaux connectés',
      'Planificateur & Calendrier mensuel interactif',
      'Génération de légendes IA Gemini (50/mois)',
      'Boîte de réception unifiée (DMs & Commentaires)',
      '1 Pulse Page (Link-in-bio dynamique)',
    ],
    popular: false,
  },
  {
    id: 'pro',
    name: 'Pro Community Manager',
    badge: 'Le Plus Populaire 🔥',
    description: 'Pour les CMs et PME cherchant à développer une audience engagée.',
    price: {
      XOF: { amount: 15000, symbol: 'FCFA', period: '/mois' },
      EUR: { amount: 25, symbol: '€', period: '/mois' },
      USD: { amount: 28, symbol: '$', period: '/mois' },
    },
    features: [
      'Jusqu\'à 10 comptes sociaux connectés',
      'Publications illimitées & Carrousels HD',
      'Réponses intelligentes IA Gemini illimitées',
      'Social Listening & Veille de réputation de marque',
      'Hub complet de gestion des avis clients (Google, Yelp)',
      'Pulse Pages illimitées avec thèmes avancés',
      'Export de rapports d\'audience & Analytics PDF',
    ],
    popular: true,
  },
  {
    id: 'agency',
    name: 'Agence & Entreprise',
    badge: 'Multi-Équipes & Haute Performance',
    description: 'Pour les agences digitales gérant plusieurs marques et clients.',
    price: {
      XOF: { amount: 35000, symbol: 'FCFA', period: '/mois' },
      EUR: { amount: 55, symbol: '€', period: '/mois' },
      USD: { amount: 60, symbol: '$', period: '/mois' },
    },
    features: [
      'Comptes sociaux illimités',
      'Gestion multi-espaces de travail & Rôles d\'équipe',
      'Workflow d\'approbation client avant publication',
      'IA Gemini 2.0 Flash personnalisée au ton de marque',
      'Support prioritaire WhatsApp & Mobile Money dédié',
      'Accès API développeur & Webhooks en temps réel',
    ],
    popular: false,
  },
];

const PROVIDERS = [
  { id: 'orange_money', name: 'Orange Money', icon: '🟠', code: 'CI', hint: 'Prompt USSD #144#' },
  { id: 'mtn_momo', name: 'MTN Mobile Money', icon: '🟡', code: 'CI', hint: 'Prompt USSD *133#' },
  { id: 'wave', name: 'Wave', icon: '🌊', code: 'CI', hint: 'App Wave QR' },
  { id: 'moov', name: 'Moov Money', icon: '🔵', code: 'CI', hint: 'Prompt USSD *155#' },
  { id: 'card', name: 'Carte Bancaire', icon: '💳', code: 'ALL', hint: 'Visa / Mastercard' },
];

export default function BillingPage() {
  const [currency, setCurrency] = useState<'XOF' | 'EUR' | 'USD'>('XOF');
  const [selectedPlan, setSelectedPlan] = useState<string>('pro');
  const [selectedProvider, setSelectedProvider] = useState<string>('orange_money');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [workspaceId, setWorkspaceId] = useState<string>('');
  const [legalModalType, setLegalModalType] = useState<'rgpd' | 'cgu' | null>(null);
  const [paymentResult, setPaymentResult] = useState<{
    success: boolean;
    message: string;
    instruction?: string;
    ref?: string;
  } | null>(null);

  const activePlanObj = PLANS.find((p) => p.id === selectedPlan) || PLANS[1];
  const activePrice = activePlanObj.price[currency];

  useEffect(() => {
    try {
      const saved = localStorage.getItem('pulsesocial_active_workspace');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.id) setWorkspaceId(parsed.id);
      }
    } catch {
      // ignore
    }

    const handlePaystackMessage = (event: MessageEvent) => {
      if (event.data?.type === 'PAYSTACK_PAYMENT_SUCCESS') {
        setPaymentResult({
          success: true,
          message: `Paiement Paystack (${Number(event.data.amount || activePrice.amount).toLocaleString('fr-FR')} ${event.data.currency || currency}) validé ! Votre abonnement PulseSocial est actif.`,
          instruction: 'Transaction certifiée via le guichet officiel Paystack Côte d’Ivoire.',
          ref: event.data.reference,
        });
        setLoading(false);
      }
    };

    window.addEventListener('message', handlePaystackMessage);
    return () => window.removeEventListener('message', handlePaystackMessage);
  }, [activePrice.amount, currency]);

  const handleOpenCheckout = (planId: string) => {
    setSelectedPlan(planId);
    setPaymentResult(null);
    setCheckoutModalOpen(true);
  };

  const handleProcessPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setPaymentResult(null);

    try {
      let paystackSecretKey: string | undefined;
      try {
        const savedTokens = localStorage.getItem('pulsesocial_manual_tokens');
        if (savedTokens) {
          paystackSecretKey = JSON.parse(savedTokens).paystackSecretKey;
        }
      } catch {
        // ignore
      }

      const res = await fetch('/api/billing/paystack/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId: workspaceId || undefined,
          plan: selectedPlan,
          provider: selectedProvider,
          phoneNumber: phoneNumber.trim() || '+2250700000000',
          currency,
          amount: activePrice.amount,
          paystackSecretKey,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.authorization_url) {
        throw new Error(data.error || 'Erreur lors de l’initialisation Paystack');
      }

      const width = 540;
      const height = 720;
      const left = Math.max(0, Math.round(window.screenX + (window.outerWidth - width) / 2));
      const top = Math.max(0, Math.round(window.screenY + (window.outerHeight - height) / 2));

      const popup = window.open(
        data.authorization_url,
        'PaystackCheckoutPopup',
        `width=${width},height=${height},left=${left},top=${top},menubar=no,toolbar=no,location=yes,status=yes`
      );

      if (!popup) {
        window.location.href = data.authorization_url;
        return;
      }

      const timer = setInterval(() => {
        if (popup.closed) {
          clearInterval(timer);
          setLoading(false);
        }
      }, 600);
    } catch (err: unknown) {
      setPaymentResult({
        success: false,
        message: err instanceof Error ? err.message : 'Échec de l’ouverture Paystack',
      });
      setLoading(false);
    }
  };

  return (
    <div className="space-y-10 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4 pt-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-violet-950/60 border border-violet-800/40 text-violet-300 text-xs font-semibold shadow-inner">
          <Zap className="w-3.5 h-3.5 text-violet-400 fill-violet-400" />
          <span>Abonnements & Monétisation PulseSocial</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-slate-50 tracking-tight">
          Tarification Adaptée & Paiement{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-amber-300 to-emerald-400">
            Mobile Money
          </span>
        </h1>

        <p className="text-sm text-slate-600 font-medium leading-relaxed">
          Activez votre abonnement en direct avec Orange Money, MTN MoMo, Wave ou Carte Bancaire. 
          Les devises s&apos;adaptent automatiquement à vos clients.
        </p>

        {/* Currency Switcher */}
        <div className="inline-flex items-center p-1 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
          <button
            onClick={() => setCurrency('XOF')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              currency === 'XOF'
                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            🇨🇮 FCFA (XOF)
          </button>
          <button
            onClick={() => setCurrency('EUR')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              currency === 'EUR'
                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            🇪🇺 Euros (€)
          </button>
          <button
            onClick={() => setCurrency('USD')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              currency === 'USD'
                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            🇺🇸 Dollars ($)
          </button>
        </div>
      </div>

      {/* Pricing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 pt-4">
        {PLANS.map((plan) => {
          const priceObj = plan.price[currency];
          const isPop = plan.popular;

          return (
            <div
              key={plan.id}
              className={`rounded-3xl p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 relative ${
                isPop
                  ? 'bg-gradient-to-b from-slate-900/90 via-violet-950/20 to-slate-900/90 border-2 border-violet-500/60 shadow-2xl shadow-violet-500/20 scale-[1.02]'
                  : 'bg-slate-900/50 backdrop-blur-xl border border-slate-800/80 hover:border-slate-700'
              }`}
            >
              {isPop && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-[11px] font-extrabold uppercase tracking-wider shadow-lg shadow-violet-600/40">
                  {plan.badge}
                </div>
              )}

              <div>
                <div className="mb-4">
                  <span className="text-xs font-bold text-violet-400 uppercase tracking-wider">
                    {plan.name}
                  </span>
                  <p className="text-xs text-slate-400 mt-1 leading-snug">
                    {plan.description}
                  </p>
                </div>

                {/* Price Display */}
                <div className="flex items-baseline gap-1 my-6">
                  <span className="text-3xl sm:text-4xl font-black text-white">
                    {priceObj.amount.toLocaleString()}
                  </span>
                  <span className="text-sm font-semibold text-slate-300">
                    {priceObj.symbol}
                  </span>
                  <span className="text-xs text-slate-400">{priceObj.period}</span>
                </div>

                {/* Feature List */}
                <ul className="space-y-3 pt-2 mb-8">
                  {plan.features.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-300 leading-relaxed">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={() => handleOpenCheckout(plan.id)}
                className={`w-full py-3.5 px-4 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-95 ${
                  isPop
                    ? 'bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-xl shadow-violet-600/30'
                    : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
                }`}
              >
                <span>Choisir la formule {plan.name}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Admin Notice Banner */}
      <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Compte Super-Admin Privilégié</h3>
            <p className="text-xs text-slate-400">
              En tant que propriétaire administrateur, votre accès est permanent, illimité et 100% gratuit.
            </p>
          </div>
        </div>
        <span className="px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-800/40 text-emerald-300 text-xs font-bold">
          Pass Gratuit à Vie Actif
        </span>
      </div>

      {/* Checkout Modal */}
      {checkoutModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-[#0B0F17] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>Souscrire :</span>
                  <span className="text-violet-400">{activePlanObj.name}</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Montant : <strong className="text-white">{activePrice.amount.toLocaleString()} {activePrice.symbol}</strong> {activePrice.period}
                </p>
              </div>
              <button
                onClick={() => setCheckoutModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center text-xs"
              >
                ✕
              </button>
            </div>

            {paymentResult ? (
              <div className="py-6 text-center space-y-4">
                <div
                  className={`w-14 h-14 rounded-full mx-auto flex items-center justify-center ${
                    paymentResult.success
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : 'bg-red-500/20 text-red-400 border border-red-500/40'
                  }`}
                >
                  {paymentResult.success ? <CheckCircle2 className="w-8 h-8" /> : <Lock className="w-8 h-8" />}
                </div>

                <h4 className="text-base font-bold text-white">{paymentResult.message}</h4>
                {paymentResult.instruction && (
                  <p className="text-xs text-amber-300 bg-amber-950/40 p-3 rounded-xl border border-amber-800/30">
                    📲 {paymentResult.instruction}
                  </p>
                )}
                {paymentResult.ref && (
                  <p className="text-[11px] font-mono text-slate-400">
                    Réf transaction : {paymentResult.ref}
                  </p>
                )}

                <button
                  onClick={() => setCheckoutModalOpen(false)}
                  className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all"
                >
                  Fermer
                </button>
              </div>
            ) : (
              <form onSubmit={handleProcessPayment} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2">
                    Moyen de Paiement Mobile Money & Carte
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {PROVIDERS.map((prov) => (
                      <button
                        key={prov.id}
                        type="button"
                        onClick={() => setSelectedProvider(prov.id)}
                        className={`p-3 rounded-2xl border text-left flex items-center gap-2.5 transition-all ${
                          selectedProvider === prov.id
                            ? 'bg-violet-950/60 border-violet-500 text-white shadow-md shadow-violet-950'
                            : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-900'
                        }`}
                      >
                        <span className="text-xl">{prov.icon}</span>
                        <div>
                          <div className="text-xs font-bold leading-tight">{prov.name}</div>
                          <div className="text-[10px] text-slate-500">{prov.hint}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Numéro de Téléphone (Orange / MTN / Wave / Moov)
                  </label>
                  <div className="relative">
                    <Smartphone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="tel"
                      required
                      placeholder="+225 07 00 00 00 00"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-violet-500 transition-all font-mono"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Un prompt de confirmation USSD sécurisé sera transmis à votre téléphone.
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all active:scale-[0.98] cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Génération de la transaction...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-yellow-300" />
                        <span>Valider le paiement de {activePrice.amount.toLocaleString()} {activePrice.symbol}</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="text-[11px] text-slate-500 text-center flex items-center justify-center gap-2 pt-1 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setLegalModalType('cgu')}
                    className="hover:underline hover:text-slate-300 cursor-pointer"
                  >
                    Conditions & Mobile Money (FCFA)
                  </button>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={() => setLegalModalType('rgpd')}
                    className="hover:underline hover:text-slate-300 cursor-pointer"
                  >
                    Confidentialité RGPD
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Page Footer Legal Links */}
      <div className="text-center pt-8 border-t border-slate-800/80">
        <p className="text-xs text-slate-500">
          PulseSocial est une plateforme SaaS souveraine hébergée en Europe et conforme aux réglementations de paiement CEMAC/UEMOA.
        </p>
        <div className="flex items-center justify-center gap-4 mt-2 text-xs text-slate-400">
          <button
            type="button"
            onClick={() => setLegalModalType('cgu')}
            className="hover:underline hover:text-violet-400 cursor-pointer"
          >
            CGU & Mentions Légales Mobile Money
          </button>
          <span>•</span>
          <button
            type="button"
            onClick={() => setLegalModalType('rgpd')}
            className="hover:underline hover:text-violet-400 cursor-pointer"
          >
            Politique de Confidentialité & RGPD
          </button>
        </div>
      </div>

      {/* Legal Modals */}
      {legalModalType && (
        <LegalModal type={legalModalType} onClose={() => setLegalModalType(null)} />
      )}
    </div>
  );
}
