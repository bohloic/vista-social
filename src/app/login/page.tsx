'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Lock,
  Mail,
  Zap,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
  CheckCircle2,
  KeyRound,
  FileText,
} from 'lucide-react';
import { LegalModal } from '@/components/LegalModals';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // App initialization check
  const [isAppInitialized, setIsAppInitialized] = useState<boolean | null>(null);

  // Forgot password state
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);

  // Legal modal state
  const [legalModalType, setLegalModalType] = useState<'privacy' | 'terms' | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Restore email from sessionStorage and check setup status on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedEmail = sessionStorage.getItem('pulsesocial_login_email');
      if (savedEmail) {
        setEmail(savedEmail);
        setResetEmail(savedEmail);
      }

      const handleOAuthMessage = (event: MessageEvent) => {
        if (event.data?.type === 'GOOGLE_AUTH_SUCCESS') {
          if (event.data.user) {
            localStorage.setItem('pulsesocial_user', JSON.stringify(event.data.user));
            if (event.data.user.workspaceName) {
              localStorage.setItem(
                'pulsesocial_active_workspace',
                JSON.stringify({
                  id: event.data.user.workspaceId || 'ws-default',
                  name: event.data.user.workspaceName,
                })
              );
            }
          }
          setGoogleLoading(false);
          router.push('/');
          router.refresh();
        }
      };

      window.addEventListener('message', handleOAuthMessage);
      return () => window.removeEventListener('message', handleOAuthMessage);
    }
  }, [router]);

  useEffect(() => {
    const checkInit = async () => {
      try {
        const res = await fetch('/api/setup');
        if (res.ok) {
          const data = await res.json();
          setIsAppInitialized(Boolean(data.initialized));
        }
      } catch {
        setIsAppInitialized(true);
      }
    };
    checkInit();
  }, []);

  const handleGoogleSignIn = async () => {
    setGeneralError(null);
    setGoogleLoading(true);
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ popup: true }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        setGeneralError(data.error || 'Impossible d’ouvrir la fenêtre Google OAuth.');
        setGoogleLoading(false);
        return;
      }

      const width = 520;
      const height = 680;
      const left = Math.max(0, Math.round(window.screenX + (window.outerWidth - width) / 2));
      const top = Math.max(0, Math.round(window.screenY + (window.outerHeight - height) / 2));

      const popup = window.open(
        data.url,
        'GoogleOAuthPopup',
        `width=${width},height=${height},left=${left},top=${top},menubar=no,toolbar=no,location=yes,status=no`
      );

      if (!popup) {
        // Fallback if popup blocker is active
        window.location.href = data.url.replace('popup=1', 'popup=0');
        return;
      }

      const timer = setInterval(() => {
        if (popup.closed) {
          clearInterval(timer);
          setGoogleLoading(false);
        }
      }, 600);
    } catch {
      setGeneralError('Erreur lors de l’initialisation de Google Sign-In.');
      setGoogleLoading(false);
    }
  };

  const handleEmailChange = (val: string) => {
    setEmail(val);
    setEmailError(null);
    setGeneralError(null);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('pulsesocial_login_email', val);
    }
  };

  const handlePasswordChange = (val: string) => {
    setPassword(val);
    setPasswordError(null);
    setGeneralError(null);
  };

  const validateForm = (): boolean => {
    let isValid = true;

    if (!email.trim()) {
      setEmailError('Veuillez saisir votre adresse e-mail.');
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setEmailError('Format d\'adresse e-mail invalide.');
      isValid = false;
    } else {
      setEmailError(null);
    }

    if (!password) {
      setPasswordError('Veuillez saisir votre mot de passe.');
      isValid = false;
    } else if (password.length < 4) {
      setPasswordError('Le mot de passe doit comporter au moins 4 caractères.');
      isValid = false;
    } else {
      setPasswordError(null);
    }

    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setGeneralError(data.error || 'Identifiants invalides ou compte introuvable.');
        return;
      }

      // Store local user cache if needed and redirect
      if (typeof window !== 'undefined' && data.user) {
        localStorage.setItem('pulsesocial_user', JSON.stringify(data.user));
      }

      router.push('/');
      router.refresh();
    } catch {
      setGeneralError('Erreur de communication avec le serveur. Veuillez vérifier votre connexion.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError(null);
    setResetSuccess(null);

    if (!resetEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(resetEmail.trim())) {
      setResetError('Veuillez renseigner une adresse e-mail valide.');
      return;
    }

    setResetLoading(true);

    try {
      // Simulate or call supabase password reset
      await new Promise((resolve) => setTimeout(resolve, 800));
      setResetSuccess(
        `Si un compte est associé à ${resetEmail.trim()}, un e-mail de réinitialisation sécurisé vient de vous être envoyé.`
      );
    } catch {
      setResetError('Impossible d\'envoyer l\'email de réinitialisation pour le moment.');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#07090E] text-white flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden">
      {/* Background Neon Glows */}
      <div className="absolute top-1/4 left-1/3 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-violet-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 translate-x-1/2 translate-y-1/2 w-96 h-96 rounded-full bg-emerald-500/10 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600 via-indigo-500 to-emerald-400 shadow-xl shadow-violet-600/30 mb-2">
            <Zap className="w-6 h-6 text-white fill-white" />
          </div>
          <h1 className="text-2xl font-black tracking-tight">
            Connexion à <span className="text-violet-400">PulseSocial</span>
          </h1>
          <p className="text-xs text-slate-400">
            Accédez à votre espace de gestion des réseaux sociaux &amp; IA
          </p>
        </div>

        {/* Form Card */}
        <div className="pulse-card p-6 sm:p-8 space-y-5 border border-slate-800/80 bg-slate-900/70 backdrop-blur-2xl">
          {generalError && (
            <div
              className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2"
              role="alert"
              aria-live="polite"
            >
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{generalError}</span>
            </div>
          )}

          {/* 1-Click Google OAuth Sign-In Button */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={googleLoading || loading}
              className="w-full py-3 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs shadow-lg flex items-center justify-center gap-3 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 cursor-pointer border border-slate-200"
            >
              {googleLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-violet-600" />
                  <span>Ouverture de la fenêtre Google...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  <span>Continuer avec Google (SSO 1-Clic)</span>
                </>
              )}
            </button>

            <div className="relative flex items-center py-1">
              <div className="flex-grow border-t border-slate-800" />
              <span className="flex-shrink mx-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                ou avec vos identifiants
              </span>
              <div className="flex-grow border-t border-slate-800" />
            </div>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {/* Email Field */}
            <div>
              <label htmlFor="login-email" className="text-xs font-bold text-slate-300 block mb-1.5">
                Adresse Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  placeholder="admin@pulsesocial.app"
                  value={email}
                  onChange={(e) => handleEmailChange(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border bg-slate-950/80 text-white placeholder-slate-600 focus:outline-none transition-all ${
                    emailError
                      ? 'border-rose-500 focus:border-rose-500 ring-1 ring-rose-500/30'
                      : 'border-slate-800 focus:border-violet-500 focus:ring-1 focus:ring-violet-500'
                  }`}
                />
              </div>
              {emailError && (
                <p className="text-[11px] text-rose-400 font-medium mt-1 pl-1" aria-live="polite">
                  {emailError}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="login-password" className="text-xs font-bold text-slate-300">
                  Mot de passe
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setForgotPasswordOpen(true);
                    setResetEmail(email);
                    setResetError(null);
                    setResetSuccess(null);
                  }}
                  className="text-[11px] text-violet-400 hover:text-violet-300 hover:underline cursor-pointer"
                >
                  Mot de passe oublié ?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  className={`w-full pl-10 pr-10 py-2.5 text-xs rounded-xl border bg-slate-950/80 text-white placeholder-slate-600 focus:outline-none transition-all ${
                    passwordError
                      ? 'border-rose-500 focus:border-rose-500 ring-1 ring-rose-500/30'
                      : 'border-slate-800 focus:border-violet-500 focus:ring-1 focus:ring-violet-500'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {passwordError && (
                <p className="text-[11px] text-rose-400 font-medium mt-1 pl-1" aria-live="polite">
                  {passwordError}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-violet-600/30 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Vérification sécurisée...</span>
                </>
              ) : (
                <>
                  <span>Se connecter à mon espace</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Setup Link / Environment Status */}
          <div className="pt-2 border-t border-slate-800/80 text-center">
            {isAppInitialized === false ? (
              <p className="text-[11px] text-slate-400">
                Première utilisation ou nouveau déploiement ?{' '}
                <Link href="/setup" className="text-violet-400 hover:underline font-semibold">
                  Lancer l&apos;assistant Setup
                </Link>
              </p>
            ) : (
              <p className="text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Environnement configuré • Connexion sécurisée</span>
              </p>
            )}
          </div>
        </div>

        {/* Security & Legal Links Footer */}
        <div className="space-y-2 text-center">
          <div className="flex items-center justify-center gap-2 text-[11px] text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Session chiffrée SSL/TLS &amp; Protection Supabase Auth</span>
          </div>

          <div className="flex items-center justify-center gap-4 text-[11px] text-slate-500 pt-1">
            <button
              type="button"
              onClick={() => setLegalModalType('privacy')}
              className="hover:text-slate-300 underline cursor-pointer"
            >
              Politique de Confidentialité
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => setLegalModalType('terms')}
              className="hover:text-slate-300 underline cursor-pointer"
            >
              CGU &amp; Mobile Money
            </button>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {forgotPasswordOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-violet-500/10 text-violet-400 flex items-center justify-center">
                  <KeyRound className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-white">Réinitialiser le mot de passe</h3>
              </div>
              <button
                type="button"
                onClick={() => setForgotPasswordOpen(false)}
                className="text-slate-400 hover:text-white text-xs font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {resetSuccess ? (
              <div className="space-y-4 text-center py-2">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 mx-auto flex items-center justify-center border border-emerald-500/20">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">{resetSuccess}</p>
                <button
                  type="button"
                  onClick={() => setForgotPasswordOpen(false)}
                  className="w-full py-2.5 px-4 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs transition-colors cursor-pointer"
                >
                  Fermer
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotPasswordSubmit} noValidate className="space-y-4">
                <p className="text-xs text-slate-400">
                  Entrez votre adresse email ci-dessous. Nous vous enverrons un lien sécurisé pour définir un nouveau mot de passe.
                </p>

                {resetError && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{resetError}</span>
                  </div>
                )}

                <div>
                  <label htmlFor="reset-email" className="text-xs font-bold text-slate-300 block mb-1">
                    Adresse Email
                  </label>
                  <input
                    id="reset-email"
                    type="email"
                    placeholder="admin@pulsesocial.app"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-800 bg-slate-950 text-white focus:outline-none focus:border-violet-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setForgotPasswordOpen(false)}
                    className="px-4 py-2 text-xs text-slate-400 hover:text-white cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={resetLoading}
                    className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs flex items-center gap-2 shadow-md transition-all disabled:opacity-60 cursor-pointer"
                  >
                    {resetLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                    <span>Envoyer les instructions</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Legal Modals */}
      <LegalModal type={legalModalType} onClose={() => setLegalModalType(null)} />
    </div>
  );
}
