'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  ShieldCheck,
  Building2,
  KeyRound,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Lock,
  Globe2,
  Zap,
  AlertCircle,
} from 'lucide-react';

export default function SetupWizardPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [checking, setChecking] = useState(true);
  const [alreadyInitialized, setAlreadyInitialized] = useState(false);
  const [adminEmail, setAdminEmail] = useState<string | null>(null);

  // Form states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [workspaceName, setWorkspaceName] = useState('Pulse Media Studio');
  const [timezone, setTimezone] = useState('Africa/Abidjan');
  const [metaAccessToken, setMetaAccessToken] = useState('');
  const [metaAccountName, setMetaAccountName] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Check if already initialized
    async function checkStatus() {
      try {
        const res = await fetch('/api/setup');
        const data = await res.json();
        if (data.initialized) {
          setAlreadyInitialized(true);
          if (data.adminEmail) {
            setAdminEmail(data.adminEmail);
          }
        }
      } catch (err) {
        console.warn('Status check failed:', err);
      } finally {
        setChecking(false);
      }
    }
    checkStatus();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          email,
          password,
          workspaceName,
          timezone,
          metaAccessToken: metaAccessToken.trim() || undefined,
          metaAccountName: metaAccountName.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erreur lors de l\'initialisation');
      }

      if (typeof window !== 'undefined' && data.profile) {
        localStorage.setItem('pulsesocial_user', JSON.stringify(data.profile));
      }
      setSuccess(true);
      setTimeout(() => {
        window.location.href = '/';
      }, 1500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-[#07090E] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
          <span className="text-xs text-slate-400 font-medium tracking-wide">
            Vérification de l&apos;environnement PulseSocial...
          </span>
        </div>
      </div>
    );
  }

  if (alreadyInitialized) {
    return (
      <div className="min-h-screen bg-[#07090E] text-slate-100 flex items-center justify-center p-4 relative overflow-hidden">
        <div className="max-w-md w-full relative z-10 pulse-card p-8 border border-slate-800 bg-slate-900/80 backdrop-blur-2xl text-center space-y-5">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-400 mx-auto flex items-center justify-center border border-emerald-500/20 shadow-xl shadow-emerald-500/10">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-black text-white">Environnement déjà configuré</h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              L&apos;environnement PulseSocial est déjà configuré avec un compte Super-Admin actif{adminEmail ? ` (${adminEmail})` : ''}.
            </p>
            <p className="text-xs text-slate-400">
              Veuillez vous connecter directement pour accéder à votre espace de travail.
            </p>
          </div>
          <Link
            href="/login"
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-violet-600/30 flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
          >
            <span>Se connecter à PulseSocial</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07090E] text-slate-100 flex items-center justify-center p-4 relative overflow-hidden selection:bg-violet-500 selection:text-white">
      {/* Background ambient neon glows */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-violet-600/15 rounded-full blur-[128px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-indigo-600/15 rounded-full blur-[128px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-[160px] pointer-events-none" />

      <div className="max-w-xl w-full relative z-10">
        {/* Logo & Headline */}
        <div className="text-center mb-8 space-y-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-violet-950/60 border border-violet-800/40 text-violet-300 text-xs font-semibold mb-2 shadow-inner">
            <Zap className="w-3.5 h-3.5 text-violet-400 fill-violet-400" />
            <span>Initialisation Unique de PulseSocial</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white flex items-center justify-center gap-2">
            <span>Pulse</span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-indigo-300 to-emerald-400">
              Social
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
            Configurez votre compte unique Super-Admin et votre premier espace de travail pour lancer votre plateforme en production.
          </p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-between mb-8 px-4">
          <div className="flex items-center gap-2">
            <span
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                step >= 1
                  ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/30'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              1
            </span>
            <span className="text-xs font-semibold text-slate-300 hidden sm:inline">Super-Admin</span>
          </div>
          <div className={`h-0.5 flex-1 mx-3 ${step >= 2 ? 'bg-violet-600' : 'bg-slate-800'}`} />
          <div className="flex items-center gap-2">
            <span
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                step >= 2
                  ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/30'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              2
            </span>
            <span className="text-xs font-semibold text-slate-300 hidden sm:inline">Espace & Région</span>
          </div>
          <div className={`h-0.5 flex-1 mx-3 ${step >= 3 ? 'bg-violet-600' : 'bg-slate-800'}`} />
          <div className="flex items-center gap-2">
            <span
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                step === 3
                  ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/30'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              3
            </span>
            <span className="text-xs font-semibold text-slate-300 hidden sm:inline">Réseaux</span>
          </div>
        </div>

        {/* Glass Card */}
        <div className="bg-slate-900/60 backdrop-blur-2xl border border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/80 relative">
          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-red-950/60 border border-red-800/60 text-red-300 text-xs flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-red-400 animate-ping" />
              <span>{error}</span>
            </div>
          )}

          {success ? (
            <div className="text-center py-10 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center border border-emerald-500/30 animate-bounce">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-white">Plateforme Initialisée !</h2>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Votre compte Super-Admin avec accès à vie gratuit a été créé. Redirection vers votre tableau de bord...
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {/* STEP 1: Admin Profile */}
              {step === 1 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="flex items-center gap-2 mb-2 text-violet-400">
                    <ShieldCheck className="w-5 h-5" />
                    <h2 className="text-base font-bold text-white">Création du Compte Super-Admin</h2>
                  </div>
                  <p className="text-xs text-slate-400 mb-4">
                    Ce compte unique aura tous les privilèges, accès à vie gratuit et contrôle sur la monétisation.
                  </p>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Nom complet</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Responsable Digital (Directeur CM)"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-slate-950/60 border border-slate-800 text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Adresse Email</label>
                    <input
                      type="email"
                      required
                      placeholder="admin@pulsesocial.app"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-slate-950/60 border border-slate-800 text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Mot de Passe Sécurisé</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        type="password"
                        required
                        minLength={6}
                        placeholder="••••••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950/60 border border-slate-800 text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all"
                      />
                    </div>
                  </div>

                  <div className="pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        if (!fullName.trim() || !email.trim() || password.length < 6) {
                          setError('Veuillez renseigner un nom, email valide et mot de passe de 6 caractères minimum.');
                          return;
                        }
                        setError(null);
                        setStep(2);
                      }}
                      className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-violet-600/30 transition-all active:scale-[0.98]"
                    >
                      <span>Continuer : Espace de Travail</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: Workspace Setup */}
              {step === 2 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="flex items-center gap-2 mb-2 text-violet-400">
                    <Building2 className="w-5 h-5" />
                    <h2 className="text-base font-bold text-white">Espace de Travail & Localisation</h2>
                  </div>
                  <p className="text-xs text-slate-400 mb-4">
                    Configurez votre organisation par défaut pour regrouper vos clients, publications et paiements.
                  </p>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Nom de l&apos;Espace</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Pulse Social Côte d'Ivoire"
                      value={workspaceName}
                      onChange={(e) => setWorkspaceName(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-slate-950/60 border border-slate-800 text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Fuseau Horaire de Publication</label>
                    <div className="relative">
                      <Globe2 className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                      <select
                        value={timezone}
                        onChange={(e) => setTimezone(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950/60 border border-slate-800 text-white text-xs focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all"
                      >
                        <option value="Africa/Abidjan">Africa/Abidjan (GMT+0, Côte d&apos;Ivoire)</option>
                        <option value="Africa/Dakar">Africa/Dakar (GMT+0, Sénégal)</option>
                        <option value="Africa/Douala">Africa/Douala (GMT+1, Cameroun)</option>
                        <option value="Europe/Paris">Europe/Paris (GMT+1)</option>
                        <option value="UTC">UTC Standard</option>
                      </select>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-violet-950/30 border border-violet-800/30 text-[11px] text-violet-300 leading-relaxed">
                    ✨ <strong>Monétisation Active :</strong> Le module Mobile Money (Orange Money, MTN MoMo, Wave, Moov) sera activé sur cet espace avec support des devises <strong>XOF (FCFA)</strong>, <strong>EUR (€)</strong> et <strong>USD ($)</strong>.
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="w-1/3 py-3 px-4 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all"
                    >
                      Retour
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (!workspaceName.trim()) {
                          setError('Veuillez spécifier un nom d\'espace.');
                          return;
                        }
                        setError(null);
                        setStep(3);
                      }}
                      className="w-2/3 py-3.5 px-4 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-violet-600/30 transition-all active:scale-[0.98]"
                    >
                      <span>Continuer : Réseaux Sociaux</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: Social Account Connection (Optional) */}
              {step === 3 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="flex items-center gap-2 mb-2 text-violet-400">
                    <KeyRound className="w-5 h-5" />
                    <h2 className="text-base font-bold text-white">Connexion des Réseaux Réels</h2>
                  </div>
                  <p className="text-xs text-slate-400 mb-3">
                    Vous pouvez insérer dès maintenant votre jeton Meta (Instagram / Facebook) ou cliquer sur &quot;Terminer&quot; pour le faire plus tard dans les Paramètres.
                  </p>

                  <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-pink-500" />
                        Meta / Instagram & Facebook Graph Token
                      </span>
                      <span className="text-[10px] text-emerald-400 font-semibold px-2 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-800/40">
                        Optionnel
                      </span>
                    </div>

                    <div>
                      <input
                        type="text"
                        placeholder="Nom du compte (ex: Ma Marque Instagram)"
                        value={metaAccountName}
                        onChange={(e) => setMetaAccountName(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-violet-500 mb-2"
                      />
                      <textarea
                        rows={2}
                        placeholder="Collez ici votre Token Graph API généré (ou laissez vide)"
                        value={metaAccessToken}
                        onChange={(e) => setMetaAccessToken(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-violet-500 font-mono text-[11px]"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      disabled={loading}
                      className="w-1/3 py-3 px-4 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all"
                    >
                      Retour
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-2/3 py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-600 hover:from-emerald-400 hover:to-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all active:scale-[0.98]"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Initialisation en cours...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 text-yellow-300" />
                          <span>Finaliser & Ouvrir PulseSocial</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
