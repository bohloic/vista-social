import React from 'react';
import Link from 'next/link';
import { ShieldCheck, ArrowLeft, Lock, Database, Key, CheckCircle2 } from 'lucide-react';

export const metadata = {
  title: 'Politique de Confidentialité — PulseSocial',
  description: 'Politique de confidentialité et de protection des données personnelles de PulseSocial (ARTCI / RGPD).',
};

export default function ConfidentialitePage() {
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
          <span className="text-[11px] font-mono text-slate-500">Conformité ARTCI &amp; RGPD • Nov 2026</span>
        </div>

        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Protection des Données Personnelles</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Politique de Confidentialité
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            PulseSocial s&apos;engage fermement à garantir la confidentialité, l&apos;intégrité et la sécurité de vos données professionnelles et de celles de vos prospects, conformément à la Loi ivoirienne n° 2013-450 et aux principes du RGPD.
          </p>
        </div>

        <div className="space-y-6 text-xs text-slate-300 leading-relaxed">
          {/* Section 1 : Sécurité des Tokens */}
          <section className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-400" />
              1. Chiffrement et Isolation des Clés OAuth
            </h2>
            <p>
              Les jetons d&apos;accès délivrés par Meta, LinkedIn, TikTok, Google et X sont chiffrés au repos à l&apos;aide d&apos;un algorithme cryptographique robuste <strong>AES-256-GCM</strong>.
            </p>
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 space-y-1">
              <p className="font-semibold text-white flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Zéro stockage en clair dans le navigateur
              </p>
              <p className="text-[11px] text-slate-400">
                Aucune clé secrète de paiement (Paystack) ni clé API (Composio) n&apos;est accessible dans l&apos;inspecteur du navigateur ni stockée dans le LocalStorage de votre poste. Toutes les requêtes sensibles sont signées sur nos serveurs d&apos;Edge computing.
              </p>
            </div>
          </section>

          {/* Section 2 : Données collectées */}
          <section className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Database className="w-4 h-4 text-violet-400" />
              2. Données Traitées
            </h2>
            <p>Nous traitons uniquement les informations indispensables à l&apos;exécution du service :</p>
            <ul className="list-disc list-inside space-y-1 pl-2 text-slate-400">
              <li>Identité de l&apos;utilisateur : nom complet, adresse email professionnelle, nom d&apos;espace de travail.</li>
              <li>Métadonnées sociales : identifiants publics des comptes connectés, statistiques d&apos;audience agrégées.</li>
              <li>Données CRM de vente : noms et coordonnées de prospects renseignés volontairement dans le CRM social.</li>
              <li>Données de facturation : historique des transactions Mobile Money (référence opérateur, statut, montant).</li>
            </ul>
          </section>

          {/* Section 3 : Cookies */}
          <section className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Key className="w-4 h-4 text-violet-400" />
              3. Gestion des Cookies &amp; Traçabilité
            </h2>
            <p>
              PulseSocial utilise exclusivement des cookies techniques sécurisés (cookie de session chiffré <code className="text-emerald-400 font-mono">pulsesocial_session</code> configuré en <code className="text-slate-300 font-mono">HttpOnly; Secure; SameSite=Lax</code>). Aucun cookie de ciblage publicitaire tiers n&apos;est injecté à votre insu.
            </p>
          </section>

          {/* Section 4 : Durées de conservation des données */}
          <section className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-400" />
              4. Durées de conservation des données
            </h2>
            <p>
              Conformément à la Loi ivoirienne n° 2013-450 (ARTCI) et à l&apos;article 5 du RGPD, vos données personnelles sont conservées pour une durée strictement limitée aux finalités pour lesquelles elles sont traitées :
            </p>
            <ul className="list-disc list-inside space-y-1.5 pl-2 text-slate-300">
              <li>
                <strong className="text-white">Données de compte et d&apos;espace de travail :</strong> conservées pendant toute la durée de la relation contractuelle active, puis supprimées ou anonymisées définitivement sous <strong>30 jours</strong> après la clôture du compte.
              </li>
              <li>
                <strong className="text-white">Jetons OAuth des réseaux sociaux :</strong> chiffrés en AES-256-GCM pendant l&apos;utilisation et <strong>révoqués / purgés immédiatement</strong> dès la déconnexion d&apos;un réseau social par l&apos;utilisateur.
              </li>
              <li>
                <strong className="text-white">Factures et transactions Mobile Money / Paystack :</strong> conservées pendant <strong>10 ans</strong> conformément aux obligations légales et comptables en vigueur dans l&apos;espace OHADA.
              </li>
              <li>
                <strong className="text-white">Journaux de sécurité et traces d&apos;accès (Logs) :</strong> conservés pendant <strong>12 mois</strong> à des fins d&apos;audit de sécurité et de prévention des intrusions.
              </li>
            </ul>
          </section>

          {/* Section 5 : Exercice des droits */}
          <section className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              5. Vos Droits &amp; Contact DPO
            </h2>
            <p>
              Conformément à la Loi n° 2013-450, vous disposez d&apos;un droit d&apos;accès, de rectification et de suppression intégrale de vos données. Pour exercer ce droit ou demander la suppression définitive de votre espace de travail :
            </p>
            <p className="font-mono text-emerald-400 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
              Email DPO : support@pulsesocial.app
            </p>
          </section>
        </div>

        <div className="pt-6 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <p>© 2026 PulseSocial. Tous droits réservés.</p>
          <div className="flex gap-4">
            <Link href="/mentions-legales" className="hover:text-violet-400 transition-colors">Mentions Légales</Link>
            <Link href="/cgu" className="hover:text-violet-400 transition-colors">CGU</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
