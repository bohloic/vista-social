'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShieldCheck, Lock, KeyRound, ArrowRight, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export default function LoginMfaPage() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [factorId, setFactorId] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [needsEnrollment, setNeedsEnrollment] = useState(false);
  const [enrolledQr, setEnrolledQr] = useState<string | null>(null);
  const [enrolledSecret, setEnrolledSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/auth/mfa', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data) {
          setChecking(false);
          return;
        }
        const verifiedFactor = (data.factors || []).find((f: any) => f.status === 'verified');
        if (verifiedFactor) {
          setFactorId(verifiedFactor.id);
          setNeedsEnrollment(false);
        } else {
          setNeedsEnrollment(true);
        }
        setChecking(false);
      })
      .catch(() => setChecking(false));
  }, []);

  const handleStartEnrollment = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/mfa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'enroll',
          factorType: 'totp',
          friendlyName: 'PulseSocial Authenticator',
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || 'Impossible de démarrer l’enrôlement TOTP.');
      } else {
        setFactorId(data.id);
        setEnrolledQr(data.totp?.qr_code || null);
        setEnrolledSecret(data.totp?.secret || null);
      }
    } catch {
      setError('Erreur réseau.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim().length !== 6) {
      setError('Veuillez saisir le code Authenticator à 6 chiffres.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      if (factorId) {
        await fetch('/api/auth/mfa', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'challenge', factorId }),
        });
      }

      const res = await fetch('/api/auth/mfa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'verify',
          factorId,
          code: code.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || 'Code TOTP invalide.');
      } else {
        setSuccess('Double authentification (AAL2) validée ! Redirection...');
        setTimeout(() => {
          router.push('/');
          router.refresh();
        }, 600);
      }
    } catch {
      setError('Erreur lors de la validation MFA.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#e3dcfa] via-[#fceae8] to-[#dfd6f7] flex items-center justify-center p-4 text-slate-800">
      <div className="w-full max-w-md bg-white rounded-3xl p-7 sm:p-8 shadow-2xl border border-violet-100 space-y-5">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-violet-100 text-[#7C3AED] flex items-center justify-center mx-auto shadow-xs">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
            Sécurité Renforcée AAL2 (TOTP)
          </span>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
            Double Authentification (2FA)
          </h1>
          <p className="text-xs text-slate-500">
            {needsEnrollment && !enrolledSecret
              ? 'Configurez votre application Google Authenticator ou Authy pour protéger votre espace.'
              : 'Saisissez le code temporaire à 6 chiffres généré par votre application Authenticator.'}
          </p>
        </div>

        {error && (
          <div role="alert" className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {checking ? (
          <div className="py-8 flex flex-col items-center justify-center gap-2 text-xs text-slate-500">
            <Loader2 className="w-6 h-6 animate-spin text-[#7C3AED]" />
            <span>Vérification du niveau d&apos;assurance MFA...</span>
          </div>
        ) : needsEnrollment && !enrolledSecret ? (
          <div className="space-y-3">
            <button
              type="button"
              data-testid="mfa-enroll-btn"
              onClick={handleStartEnrollment}
              disabled={loading}
              className="w-full py-3.5 rounded-2xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-bold text-xs shadow-lg shadow-violet-500/25 flex items-center justify-center gap-2 cursor-pointer"
            >
              <KeyRound className="w-4 h-4" />
              <span>{loading ? 'Génération...' : 'Configurer Google Authenticator (TOTP)'}</span>
            </button>
            <Link
              href="/"
              className="block text-center text-xs text-slate-500 hover:text-slate-800 font-semibold pt-2"
            >
              Accéder au tableau de bord
            </Link>
          </div>
        ) : (
          <form onSubmit={handleVerifyCode} className="space-y-4">
            {enrolledQr && enrolledSecret && (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col items-center space-y-2 text-center">
                <div
                  data-testid="mfa-qr-svg"
                  className="p-2 bg-white rounded-2xl border border-slate-200 shadow-xs"
                  dangerouslySetInnerHTML={{ __html: enrolledQr }}
                />
                <p className="text-[11px] text-slate-600 font-medium">
                  Clé secrète manuelle :
                </p>
                <code
                  data-testid="mfa-totp-secret"
                  className="px-3 py-1 rounded-lg bg-violet-100 text-[#1E1B4B] font-mono text-xs font-bold select-all"
                >
                  {enrolledSecret}
                </code>
              </div>
            )}

            <div>
              <label htmlFor="mfa-totp-input" className="block text-xs font-bold text-slate-700 mb-1">
                Code Authenticator à 6 chiffres
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="mfa-totp-input"
                  data-testid="mfa-totp-input"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 text-center font-mono text-lg font-black tracking-[0.35em] text-slate-900 focus:outline-none focus:border-[#7C3AED]"
                />
              </div>
            </div>

            <button
              type="submit"
              data-testid="mfa-verify-submit"
              disabled={loading}
              className="w-full py-3.5 rounded-2xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-bold text-xs shadow-lg shadow-violet-500/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <span>{loading ? 'Validation AAL2...' : 'Vérifier et déverrouiller'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
