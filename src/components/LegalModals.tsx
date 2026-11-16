'use client';

import React from 'react';
import { ShieldCheck, FileText, X, CheckCircle2, Lock, CreditCard } from 'lucide-react';

interface LegalModalProps {
  type: 'privacy' | 'terms' | 'rgpd' | 'cgu' | null;
  onClose: () => void;
}

export function LegalModal({ type, onClose }: LegalModalProps) {
  if (!type) return null;

  const normalizedType = type === 'rgpd' ? 'privacy' : type === 'cgu' ? 'terms' : type;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-2.5">
            {normalizedType === 'privacy' ? (
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                <ShieldCheck className="w-5 h-5" />
              </div>
            ) : (
              <div className="w-9 h-9 rounded-xl bg-violet-500/10 text-violet-400 flex items-center justify-center border border-violet-500/20">
                <FileText className="w-5 h-5" />
              </div>
            )}
            <div>
              <h3 className="font-bold text-base text-white">
                {normalizedType === 'privacy'
                  ? 'Politique de Confidentialité & Protection des Données (RGPD)'
                  : 'Conditions Générales d’Utilisation & Paiements Mobile Money'}
              </h3>
              <p className="text-[11px] text-slate-400">
                Dernière mise à jour : 16 Novembre 2026 • Plateforme PulseSocial
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Fermer la fenêtre"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs text-slate-300 leading-relaxed">
          {normalizedType === 'privacy' ? (
            <>
              <section className="space-y-1.5">
                <h4 className="font-bold text-sm text-white flex items-center gap-2">
                  <Lock className="w-4 h-4 text-emerald-400" />
                  1. Chiffrement et Sécurité des Jetons OAuth
                </h4>
                <p>
                  PulseSocial applique un principe de sécurité zero-knowledge : les jetons d’accès aux plateformes tierces
                  (Meta Graph API, X / Twitter API v2, LinkedIn OAuth 2.0, TikTok for Business) sont stockés dans une
                  base PostgreSQL infogérée par Supabase dotée d’un chiffrement au repos (AES-256) et en transit (TLS 1.3).
                  Aucun jeton brut n&apos;est exposé à des tiers non autorisés.
                </p>
              </section>

              <section className="space-y-1.5">
                <h4 className="font-bold text-sm text-white flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  2. Non-Revente &amp; Non-Exploitation des Données
                </h4>
                <p>
                  Vos publications, fichiers médias, statistiques de performance, messages de la boîte de réception
                  et avis clients demeurent votre propriété exclusive. PulseSocial ne vend, ne loue, ni ne partage
                  aucune donnée personnelle ou commerciale à des régies publicitaires.
                </p>
              </section>

              <section className="space-y-1.5">
                <h4 className="font-bold text-sm text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  3. Utilisation de l&apos;Intelligence Artificielle (Google Gemini 2.0)
                </h4>
                <p>
                  Les requêtes soumises à l&apos;assistant de rédaction IA (génération de légendes, réécriture, analyse de
                  sentiment) sont transmises via l&apos;API sécurisée de Google Gemini avec désactivation de l&apos;entraînement
                  sur les données des clients professionnels.
                </p>
              </section>

              <section className="space-y-1.5">
                <h4 className="font-bold text-sm text-white">4. Vos Droits d&apos;Accès, Rectification &amp; Conformité ARTCI / RGPD</h4>
                <p>
                  Conformément aux normes RGPD et à la <strong>Loi n° 2013-450 relative à la protection des données à caractère personnel régie par l&apos;ARTCI en République de Côte d&apos;Ivoire</strong>,
                  vous disposez d&apos;un droit strict d&apos;accès, d&apos;opposition, de rectification et de suppression de vos données.
                  Vous pouvez à tout moment exporter vos données et révoquer vos jetons d&apos;accès depuis les Paramètres.
                </p>
              </section>
            </>
          ) : (
            <>
              <section className="space-y-1.5">
                <h4 className="font-bold text-sm text-white flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-amber-400" />
                  1. Facturation &amp; Paiements Mobile Money (Afrique de l&apos;Ouest &amp; Centrale)
                </h4>
                <p>
                  Les abonnements professionnels PulseSocial sont facturés en Francs CFA (XOF). Les paiements sont traités
                  instantanément via les opérateurs agréés : <strong>Orange Money, MTN Mobile Money, Wave et Moov Money</strong>.
                  La validation s&apos;effectue par push USSD sécurisé sur votre téléphone mobile avec authentification PIN à 2 facteurs.
                </p>
              </section>

              <section className="space-y-1.5">
                <h4 className="font-bold text-sm text-white">2. Activation Immédiate &amp; Accès aux Fonctionnalités Pro</h4>
                <p>
                  Dès la confirmation de la transaction par l&apos;opérateur Mobile Money, votre espace de travail est
                  automatiquement crédité et vos quotas (publications illimitées, synchronisation multi-comptes, IA Gemini)
                  sont débloqués en temps réel.
                </p>
              </section>

              <section className="space-y-1.5">
                <h4 className="font-bold text-sm text-white">3. Règles d&apos;Utilisation Acceptable, Fenêtre 24h Meta/WhatsApp &amp; Anti-Scraping</h4>
                <p>
                  L&apos;utilisateur s&apos;engage à respecter les politiques d&apos;utilisation des plateformes partenaires.
                  Conformément aux directives de Meta et WhatsApp Business Cloud API, les réponses directes aux prospects respectent
                  la <strong>fenêtre de messagerie client de 24 heures</strong> consécutive au dernier message entrant de l&apos;utilisateur.
                  PulseSocial applique une <strong>politique stricte anti-scraping</strong> : aucune extraction automatisée, scraping web
                  ou siphonage non autorisé de données publiques n&apos;est toléré. Toutes les interactions s&apos;opèrent exclusivement
                  via les endpoints officiels et autorisés des éditeurs tiers.
                </p>
              </section>

              <section className="space-y-1.5">
                <h4 className="font-bold text-sm text-white">4. Support Client &amp; Litiges</h4>
                <p>
                  Notre équipe de support technique est joignable à tout moment à l&apos;adresse <strong>support@pulsesocial.app</strong>.
                  En cas d&apos;erreur de facturation ou de double débit Mobile Money, un remboursement ou avoir est traité sous 48 heures ouvrées.
                </p>
              </section>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-950/80 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs shadow-md transition-colors cursor-pointer"
          >
            J&apos;ai compris et j&apos;accepte
          </button>
        </div>
      </div>
    </div>
  );
}
