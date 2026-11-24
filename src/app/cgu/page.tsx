import React from 'react';
import Link from 'next/link';
import { FileText, ArrowLeft, ShieldCheck, CreditCard, MessageSquare, AlertCircle } from 'lucide-react';

export const metadata = {
  title: 'Conditions Générales d’Utilisation — PulseSocial',
  description: 'Conditions Générales d\'Utilisation de la plateforme PulseSocial, social selling et fenêtre 24h WhatsApp Business API.',
};

export default function CGUPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="flex items-center justify-between border-b border-slate-800 pb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-bold text-violet-400 hover:text-violet-300 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Retour à l&apos;accueil</span>
          </Link>
          <span className="text-[11px] font-mono text-slate-500">Dernière révision : Novembre 2026</span>
        </div>

        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-semibold">
            <FileText className="w-3.5 h-3.5" />
            <span>Contrat B2B Social Selling &amp; SaaS</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Conditions Générales d’Utilisation (CGU)
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            Les présentes conditions régissent l&apos;accès et l&apos;utilisation des services de programmation, de community management, de génération d&apos;IA et de paiement Mobile Money proposés par PulseSocial.
          </p>
        </div>

        <div className="space-y-6 text-xs text-slate-300 leading-relaxed">
          {/* Article 1 : Objet */}
          <section className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-violet-400" />
              Article 1 — Objet des Services
            </h2>
            <p>
              PulseSocial fournit aux agences, community managers et entreprises un progiciel tout-en-un permettant :
            </p>
            <ul className="list-disc list-inside space-y-1 pl-2 text-slate-400">
              <li>La planification et publication multi-plateformes (Instagram, Facebook, LinkedIn, TikTok, X, WhatsApp).</li>
              <li>L&apos;unification de la boîte de réception (Inbox) et la gestion CRM des prospects de vente sociale.</li>
              <li>La génération de liens de paiement directs en FCFA via Mobile Money (Wave, Orange Money, MTN MoMo, Moov) et Paystack.</li>
              <li>L&apos;assistance conversationnelle par intelligence artificielle (Gemini 2.0 Flash).</li>
            </ul>
          </section>

          {/* Article 2 : WhatsApp 24h Window */}
          <section className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-emerald-400" />
              Article 2 — Respect de la Fenêtre de Messagerie 24h WhatsApp
            </h2>
            <p>
              Conformément à la politique commerciale officielle de Meta WhatsApp Cloud API, les réponses libres aux clients via PulseSocial ne peuvent être envoyées que dans une <strong>fenêtre active de 24 heures</strong> suivant le dernier message reçu de l&apos;utilisateur.
            </p>
            <p className="text-amber-300 bg-amber-500/10 p-3 rounded-xl border border-amber-500/20">
              Au-delà de cette fenêtre de 24 heures, tout message commercial non sollicité ou envoi en masse sans accord explicite préalable (opt-in) est formellement interdit pour prévenir tout risque de suspension du numéro auprès de Meta.
            </p>
          </section>

          {/* Article 3 : Transactions & Paiements Mobile Money */}
          <section className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-violet-400" />
              Article 3 — Transactions &amp; Facturation Mobile Money (XOF / FCFA)
            </h2>
            <p>
              Les règlements d&apos;abonnements et encaissements clients s&apos;effectuent en Franc CFA (XOF / FCFA) via des passerelles agréées par la BCEAO (Paystack, Wave, Orange Money, MTN MoMo).
            </p>
            <p>
              La sécurité des transactions est assurée par chiffrement TLS 1.3 de bout en bout et signature cryptographique HMAC-SHA512 des webhooks de notification. PulseSocial ne conserve aucun numéro de carte bancaire ni code secret Mobile Money.
            </p>
          </section>

          {/* Article 4 : IA Générative et Responsabilité */}
          <section className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-violet-400" />
              Article 4 — Copilote IA et Responsabilité Éditoriale
            </h2>
            <p>
              Les suggestions de légendes, réponses automatiques et prévisions de performance générées par l&apos;IA constituent des outils d&apos;aide à la décision. L&apos;utilisateur demeure le seul responsable éditorial des contenus programmés et publiés sur ses canaux officiels.
            </p>
          </section>
        </div>

        <div className="pt-6 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <p>© 2026 PulseSocial. Tous droits réservés.</p>
          <div className="flex gap-4">
            <Link href="/mentions-legales" className="hover:text-violet-400 transition-colors">Mentions Légales</Link>
            <Link href="/confidentialite" className="hover:text-violet-400 transition-colors">Confidentialité</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
