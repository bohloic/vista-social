import React from 'react';
import Link from 'next/link';
import { ShieldCheck, ArrowLeft, Building2, MapPin, Mail, Server, Scale } from 'lucide-react';

export const metadata = {
  title: 'Mentions Légales — PulseSocial',
  description: 'Informations légales et réglementaires de la plateforme PulseSocial (Côte d\'Ivoire / UEMOA).',
};

export default function MentionsLegalesPage() {
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
          <span className="text-[11px] font-mono text-slate-500">Mise à jour : Novembre 2026</span>
        </div>

        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-semibold">
            <Scale className="w-3.5 h-3.5" />
            <span>Cadre Réglementaire ARTCI &amp; UEMOA</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Mentions Légales
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            Conformément aux dispositions de la législation en vigueur en République de Côte d&apos;Ivoire, notamment la Loi n° 2013-450 du 19 juin 2013 relative à la protection des données à caractère personnel et la Loi n° 2013-546 relative aux transactions électroniques.
          </p>
        </div>

        <div className="space-y-6 text-xs text-slate-300 leading-relaxed">
          {/* Éditeur */}
          <section className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-violet-400" />
              1. Éditeur de la Plateforme
            </h2>
            <div className="space-y-1 text-slate-300">
              <p><strong className="text-white">Dénomination :</strong> PulseSocial PRO</p>
              <p><strong className="text-white">Statut :</strong> Projet technologique en cours d&apos;immatriculation au RCCM d&apos;Abidjan</p>
              <p className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" /><strong className="text-white">Siège d&apos;exploitation :</strong> Abidjan, Côte d&apos;Ivoire</p>
              <p className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" /><strong className="text-white">Contact support &amp; DPO :</strong> support@pulsesocial.app</p>
            </div>
          </section>

          {/* Hébergement */}
          <section className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Server className="w-4 h-4 text-violet-400" />
              2. Hébergement &amp; Infrastructure Cloud
            </h2>
            <div className="space-y-1 text-slate-300">
              <p><strong className="text-white">Hébergeur Cloud Principal :</strong> Vercel Inc.</p>
              <p><strong className="text-white">Adresse :</strong> 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis</p>
              <p><strong className="text-white">Plateforme de Données :</strong> Supabase Inc. (PostgreSQL managé avec chiffrement au repos AES-256)</p>
            </div>
          </section>

          {/* Données personnelles & ARTCI */}
          <section className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              3. Protection des Données Personnelles (Loi n° 2013-450)
            </h2>
            <p>
              PulseSocial applique des protocoles stricts de protection des données conformément aux recommandations de l&apos;Autorité de Régulation des Télécommunications/TIC de Côte d&apos;Ivoire (<strong>ARTCI</strong>) et aux standards internationaux (RGPD).
            </p>
            <p>
              Les jetons d&apos;authentification des réseaux sociaux connectés sont chiffrés avec l&apos;algorithme AES-256-GCM. Aucune donnée confidentielle ou mot de passe de compte social n&apos;est accessible en clair ou stocké sur les terminaux clients.
            </p>
            <p>
              Vous disposez d&apos;un droit d&apos;accès, de rectification, de portabilité et de suppression de vos données personnelles sur simple demande adressée à : <span className="text-violet-400 font-mono">support@pulsesocial.app</span>.
            </p>
          </section>

          {/* Propriété intellectuelle */}
          <section className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Scale className="w-4 h-4 text-violet-400" />
              4. Propriété Intellectuelle
            </h2>
            <p>
              L&apos;ensemble des éléments constituant l&apos;interface logicielle PulseSocial (code source, algorithmes, identité visuelle, logos 3D, bases de données) est protégé par le droit de la propriété intellectuelle. Toute reproduction non autorisée constitue une contrefaçon sanctionnée par la loi.
            </p>
          </section>
        </div>

        <div className="pt-6 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <p>© 2026 PulseSocial. Tous droits réservés.</p>
          <div className="flex gap-4">
            <Link href="/cgu" className="hover:text-violet-400 transition-colors">CGU</Link>
            <Link href="/confidentialite" className="hover:text-violet-400 transition-colors">Confidentialité</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
