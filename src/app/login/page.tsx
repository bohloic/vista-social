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
  UserPlus,
  LogIn,
  User,
} from 'lucide-react';
import { LegalModal } from '@/components/LegalModals';
import { ClayPadlockIcon, ClayPottedPlantIcon } from '@/components/Clay3DIcons';

export default function LoginPage() {
  const router = useRouter();
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [fullName, setFullName] = useState('');
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
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [resetStep, setResetStep] = useState<'request' | 'confirm'>('request');
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
        window.location.href = data.url.replace('popup=1', 'popup=0');
        return;
      }

      let timer: NodeJS.Timeout | null = null;
      let elapsed = 0;
      timer = setInterval(async () => {
        elapsed += 600;
        let isClosed = false;
        try {
          // Safe try-catch to prevent Cross-Origin-Opener-Policy blocking
          isClosed = Boolean(popup && popup.closed);
        } catch {
          // Cross-Origin-Opener-Policy policy catch
        }

        if (isClosed || elapsed >= 180000) {
          if (timer) clearInterval(timer);
          try {
            const verifyRes = await fetch('/api/auth/google/verify', { method: 'POST' });
            if (verifyRes.ok) {
              const verifyData = await verifyRes.json();
              if (verifyData.success && verifyData.user) {
                localStorage.setItem('pulsesocial_user', JSON.stringify(verifyData.user));
                if (verifyData.user.workspaceName) {
                  localStorage.setItem(
                    'pulsesocial_active_workspace',
                    JSON.stringify({
                      id: verifyData.user.workspaceId || 'ws-default',
                      name: verifyData.user.workspaceName,
                    })
                  );
                }
                setGoogleLoading(false);
                router.push('/');
                router.refresh();
                return;
              }
            }
          } catch {
            // ignore
          }
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
    if (emailError) {
      if (!val.trim()) {
        setEmailError('L’adresse email est requise.');
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim())) {
        setEmailError('Format d’email invalide.');
      } else {
        setEmailError(null);
      }
    }
  };

  const handlePasswordChange = (val: string) => {
    setPassword(val);
    if (passwordError) {
      if (!val) {
        setPasswordError('Le mot de passe est requis.');
      } else if (val.length < 6) {
        setPasswordError('Le mot de passe doit comporter au moins 6 caractères.');
      } else {
        setPasswordError(null);
      }
    }
  };

  const validateForm = () => {
    let isValid = true;
    if (!email.trim()) {
      setEmailError('L’adresse email est requise.');
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setEmailError('Format d’email invalide.');
      isValid = false;
    } else {
      setEmailError(null);
    }

    if (!password) {
      setPasswordError('Le mot de passe est requis.');
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError('Le mot de passe doit comporter au moins 6 caractères.');
      isValid = false;
    } else {
      setPasswordError(null);
    }

    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);

    if (!validateForm()) return;
    setLoading(true);

    try {
      const endpoint = authMode === 'register' ? '/api/auth/register' : '/api/auth/login';
      const payload = authMode === 'register'
        ? { email: email.trim(), password, fullName: fullName.trim() || undefined }
        : { email: email.trim(), password };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setGeneralError(data.error || 'Identifiants invalides ou compte introuvable.');
        return;
      }

      if (typeof window !== 'undefined' && data.user) {
        localStorage.setItem('pulsesocial_user', JSON.stringify(data.user));
        if (data.user.workspaceName) {
          localStorage.setItem(
            'pulsesocial_active_workspace',
            JSON.stringify({
              id: data.user.workspaceId || 'ws-default',
              name: data.user.workspaceName,
            })
          );
        }
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
      if (resetStep === 'request') {
        const res = await fetch('/api/auth/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'request', email: resetEmail.trim() }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          setResetError(data.error || 'Impossible de réinitialiser le mot de passe.');
          return;
        }
        setResetSuccess(data.message || 'Code envoyé.');
        setResetStep('confirm');
      } else {
        if (!newPassword || newPassword.length < 6) {
          setResetError('Le nouveau mot de passe doit comporter au moins 6 caractères.');
          return;
        }
        const res = await fetch('/api/auth/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'confirm',
            email: resetEmail.trim(),
            token: resetCode.trim(),
            newPassword,
          }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          setResetError(data.error || 'Erreur lors de la mise à jour du mot de passe.');
          return;
        }
        setResetSuccess('Mot de passe mis à jour avec succès ! Vous pouvez vous connecter.');
        setTimeout(() => {
          setForgotPasswordOpen(false);
          setResetStep('request');
        }, 1500);
      }
    } catch {
      setResetError('Erreur réseau lors de la demande de réinitialisation.');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-[#e3dcfa] via-[#fceae8] to-[#dfd6f7] text-slate-800 flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden">
      {/* Background Floating Clay Accents & Soft Lighting */}
      <div className="absolute top-1/4 left-1/3 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-violet-400/20 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 translate-x-1/2 translate-y-1/2 w-96 h-96 rounded-full bg-pink-400/20 blur-[130px] pointer-events-none" />

      {/* Main Container with 3D Mascot & Card */}
      <div className="w-full max-w-sm sm:max-w-md relative z-10 flex flex-col items-center">
        {/* 3D Character Illustration (Direct inspiration from Image 2: Girl with purple hoodie & phone) */}
        <div className="relative -mb-10 z-20 w-44 sm:w-52 h-36 sm:h-44 flex items-end justify-center">
          <div className="w-full h-full rounded-t-[40px] overflow-hidden drop-shadow-2xl flex items-end justify-center">
            <img
              src="/images/3d-login-character.jpg"
              alt="Mascotte 3D PulseSocial"
              className="w-full h-full object-cover object-top scale-110"
            />
          </div>
          {/* Floating 3D Icons around character */}
          <div className="absolute -left-6 top-6 w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#c4b5fd] to-[#fbcfe8] shadow-md flex items-center justify-center text-white animate-bounce duration-1000">
            <User className="w-5 h-5 text-white" />
          </div>
          <div className="absolute -right-6 top-8 animate-pulse">
            <ClayPadlockIcon className="w-11 h-11 drop-shadow-md" />
          </div>
        </div>

        {/* 3D Claymorphic Login Card */}
        <div className="w-full bg-white/95 backdrop-blur-md rounded-[36px] p-7 sm:p-9 shadow-[0_25px_70px_-15px_rgba(130,100,180,0.22)] border border-white space-y-5 relative">
          {/* Decorative side potted plants on desktop */}
          <div className="hidden lg:block absolute -left-16 bottom-2 pointer-events-none">
            <ClayPottedPlantIcon className="w-14 h-14 drop-shadow-md" />
          </div>
          <div className="hidden lg:block absolute -right-16 bottom-2 pointer-events-none">
            <ClayPottedPlantIcon className="w-14 h-14 drop-shadow-md" />
          </div>

          {/* Card Header */}
          <div className="text-center pt-3 space-y-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {authMode === 'login' ? 'Bon retour parmi nous !' : 'Créer un Compte'}
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              {authMode === 'login' ? 'Connectez-vous à votre espace' : 'Rejoignez PulseSocial dès aujourd’hui'}
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex bg-slate-100/90 p-1 rounded-full border border-slate-200/80 shadow-inner">
            <button
              type="button"
              onClick={() => {
                setAuthMode('login');
                setGeneralError(null);
              }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-full transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                authMode === 'login'
                  ? 'clay-btn-gradient text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Se connecter</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('register');
                setGeneralError(null);
              }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-full transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                authMode === 'register'
                  ? 'clay-btn-gradient text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>S&apos;inscrire</span>
            </button>
          </div>

          {generalError && (
            <div
              className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2"
              role="alert"
              aria-live="polite"
            >
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{generalError}</span>
            </div>
          )}

          {/* Authentication Form */}
          <form onSubmit={handleSubmit} noValidate className="space-y-3.5">
            {/* Full Name for Registration */}
            {authMode === 'register' && (
              <div className="relative">
                <User className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Nom complet ou Agence"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 text-xs rounded-full bg-[#f8fafc] border border-slate-200/90 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#a855f7] focus:bg-white transition-all shadow-inner"
                />
              </div>
            )}

            {/* Email Field */}
            <div>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  placeholder="Email ou nom d'utilisateur"
                  value={email}
                  onChange={(e) => handleEmailChange(e.target.value)}
                  className={`w-full pl-11 pr-4 py-3 text-xs rounded-full bg-[#f8fafc] text-slate-800 placeholder-slate-400 focus:outline-none transition-all shadow-inner ${
                    emailError
                      ? 'border border-rose-400 ring-1 ring-rose-400/30'
                      : 'border border-slate-200/90 focus:border-[#a855f7] focus:bg-white'
                  }`}
                />
              </div>
              {emailError && (
                <p className="text-[11px] text-rose-500 font-medium mt-1 pl-4" aria-live="polite">
                  {emailError}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={authMode === 'register' ? 'new-password' : 'current-password'}
                  placeholder="Mot de passe"
                  value={password}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  className={`w-full pl-11 pr-11 py-3 text-xs rounded-full bg-[#f8fafc] text-slate-800 placeholder-slate-400 focus:outline-none transition-all shadow-inner ${
                    passwordError
                      ? 'border border-rose-400 ring-1 ring-rose-400/30'
                      : 'border border-slate-200/90 focus:border-[#a855f7] focus:bg-white'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {passwordError && (
                <p className="text-[11px] text-rose-500 font-medium mt-1 pl-4" aria-live="polite">
                  {passwordError}
                </p>
              )}
            </div>

            {/* Forgot password link */}
            {authMode === 'login' && (
              <div className="flex justify-end pr-2">
                <button
                  type="button"
                  onClick={() => {
                    setForgotPasswordOpen(true);
                    setResetEmail(email);
                    setResetStep('request');
                    setResetError(null);
                    setResetSuccess(null);
                  }}
                  className="text-[11px] font-semibold text-[#8b5cf6] hover:text-[#7c3aed] transition-colors cursor-pointer"
                >
                  Mot de passe oublié ?
                </button>
              </div>
            )}

            {/* Gradient Claymorphism Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="clay-btn-gradient w-full py-3.5 px-6 rounded-full text-white font-bold text-xs shadow-lg shadow-purple-500/25 flex items-center justify-center gap-2 hover:opacity-95 transition-all active:scale-[0.98] disabled:opacity-60 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Validation en cours...</span>
                </>
              ) : (
                <>
                  <span>{authMode === 'login' ? 'Se connecter' : 'S’inscrire maintenant'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Social Logins Divider (Image 2 style) */}
          <div className="space-y-3 pt-1">
            <div className="relative flex items-center justify-center">
              <div className="flex-grow border-t border-slate-200" />
              <span className="flex-shrink mx-3 text-[11px] font-medium text-slate-400">
                ou continuer avec
              </span>
              <div className="flex-grow border-t border-slate-200" />
            </div>

            {/* 3 Circular Elevated 3D Buttons (Google, Apple, Facebook) */}
            <div className="flex items-center justify-center gap-4 pt-1">
              {/* Google Button */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={googleLoading || loading}
                title="Continuer avec Google"
                className="clay-social-btn w-12 h-12 flex items-center justify-center cursor-pointer"
              >
                {googleLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-violet-600" />
                ) : (
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
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
                )}
              </button>

              {/* Apple Button */}
              <button
                type="button"
                onClick={() => setGeneralError('Connexion Apple bientôt disponible dans votre région.')}
                title="Continuer avec Apple"
                className="clay-social-btn w-12 h-12 flex items-center justify-center cursor-pointer text-slate-900"
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.89c.66-.82 1.11-1.96.99-3.1-.96.04-2.12.64-2.8 1.44-.59.69-1.11 1.84-.97 2.96 1.08.08 2.12-.48 2.78-1.3z" />
                </svg>
              </button>

              {/* Facebook Button */}
              <button
                type="button"
                onClick={() => setGeneralError('Connexion Facebook en cours d’authentification.')}
                title="Continuer avec Facebook"
                className="clay-social-btn w-12 h-12 flex items-center justify-center cursor-pointer text-[#1877F2]"
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Footer toggle: Don't have an account? Sign Up */}
          <div className="pt-2 text-center">
            <p className="text-xs text-slate-500 font-medium">
              {authMode === 'login' ? (
                <>
                  Pas encore de compte ?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('register');
                      setGeneralError(null);
                    }}
                    className="font-bold text-[#6366F1] hover:underline cursor-pointer"
                  >
                    S&apos;inscrire
                  </button>
                </>
              ) : (
                <>
                  Déjà un compte ?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('login');
                      setGeneralError(null);
                    }}
                    className="font-bold text-[#6366F1] hover:underline cursor-pointer"
                  >
                    Se connecter
                  </button>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Legal & Security links below card */}
        <div className="mt-4 flex items-center justify-center gap-3 sm:gap-4 text-[11px] text-slate-500 flex-wrap">
          <Link href="/mentions-legales" className="hover:text-slate-800 underline">
            Mentions Légales
          </Link>
          <span>•</span>
          <Link href="/confidentialite" className="hover:text-slate-800 underline">
            Confidentialité (ARTCI)
          </Link>
          <span>•</span>
          <Link href="/cgu" className="hover:text-slate-800 underline">
            CGU &amp; Mobile Money
          </Link>
        </div>
      </div>

      {/* Forgot Password Modal (Claymorphism White Card) */}
      {forgotPasswordOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-white border border-white rounded-[32px] p-6 sm:p-8 shadow-2xl space-y-4 text-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-violet-50 text-[#8b5cf6] flex items-center justify-center">
                  <KeyRound className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-slate-900">Réinitialisation du mot de passe</h3>
              </div>
              <button
                type="button"
                onClick={() => setForgotPasswordOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-xs font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {resetSuccess && resetStep === 'confirm' && (
              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                <span>{resetSuccess}</span>
              </div>
            )}

            {resetError && (
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{resetError}</span>
              </div>
            )}

            <form onSubmit={handleForgotPasswordSubmit} noValidate className="space-y-4">
              <div>
                <label htmlFor="reset-email" className="text-xs font-bold text-slate-700 block mb-1">
                  Votre Adresse Email
                </label>
                <input
                  id="reset-email"
                  type="email"
                  placeholder="contact@monentreprise.ci"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  disabled={resetStep === 'confirm'}
                  className="w-full px-4 py-2.5 text-xs rounded-full border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:border-[#8b5cf6] focus:bg-white shadow-inner disabled:opacity-60"
                />
              </div>

              {resetStep === 'confirm' && (
                <div>
                  <label htmlFor="reset-new-password" className="text-xs font-bold text-slate-700 block mb-1">
                    Nouveau mot de passe
                  </label>
                  <div className="relative">
                    <input
                      id="reset-new-password"
                      type={showNewPassword ? 'text' : 'password'}
                      placeholder="Minimum 6 caractères"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-4 py-2.5 pr-10 text-xs rounded-full border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:border-[#8b5cf6] focus:bg-white shadow-inner"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                    >
                      {showNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setForgotPasswordOpen(false)}
                  className="px-4 py-2 text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={resetLoading}
                  className="clay-btn-gradient px-4 py-2 rounded-full text-white font-bold text-xs flex items-center gap-2 shadow-md transition-all disabled:opacity-60 cursor-pointer"
                >
                  {resetLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  <span>
                    {resetStep === 'request' ? 'Vérifier mon compte' : 'Enregistrer le nouveau mot de passe'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Legal Modals */}
      <LegalModal type={legalModalType} onClose={() => setLegalModalType(null)} />
    </div>
  );
}
