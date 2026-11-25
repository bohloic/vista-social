'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, ShieldCheck, RefreshCw, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';

export default function VerifyEmailPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const fromQuery = params.get('email');
      const fromStorage = sessionStorage.getItem('pulsesocial_login_email');
      setEmail(fromQuery || fromStorage || '');
    } catch {
      // ignore
    }
  }, []);

  const handleResend = async () => {
    if (!email.trim()) {
      setError('Veuillez saisir votre adresse e-mail.');
      return;
    }
    setResending(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send', email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || 'Impossible de renvoyer le code.');
      } else {
        setMessage(data.message || 'Un nouveau code à 6 chiffres a été envoyé.');
      }
    } catch {
      setError('Erreur réseau.');
    } finally {
      setResending(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || code.trim().length !== 6) {
      setError('Veuillez saisir votre e-mail et le code à 6 chiffres.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify', email: email.trim(), code: code.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || 'Code invalide ou expiré.');
      } else {
        setMessage('Adresse e-mail confirmée ! Redirection...');
        setTimeout(() => router.push('/'), 1000);
      }
    } catch {
      setError('Erreur réseau.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#e3dcfa] via-[#fceae8] to-[#dfd6f7] flex items-center justify-center p-4 text-slate-800">
      <div className="w-full max-w-md bg-white rounded-3xl p-7 sm:p-8 shadow-2xl border border-violet-100 space-y-5">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-violet-100 text-[#7C3AED] flex items-center justify-center mx-auto shadow-xs">
            <Mail className="w-6 h-6" />
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
            Vérification de votre Email
          </h1>
          <p className="text-xs text-slate-500">
            Saisissez le code OTP à 6 chiffres envoyé à votre adresse professionnelle pour activer votre accès.
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {message && (
          <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{message}</span>
          </div>
        )}

        <form onSubmit={handleVerify} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Adresse e-mail</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="contact@monentreprise.ci"
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 text-xs text-slate-900 focus:outline-none focus:border-[#7C3AED]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Code OTP à 6 chiffres</label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              required
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              placeholder="123456"
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 text-center font-mono text-lg font-black tracking-[0.35em] text-slate-900 focus:outline-none focus:border-[#7C3AED]"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-2xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-bold text-xs shadow-lg shadow-violet-500/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{loading ? 'Vérification...' : 'Valider le code'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          <button
            type="button"
            onClick={handleResend}
            disabled={resending}
            className="text-[#7C3AED] hover:underline font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
            <span>{resending ? 'Envoi...' : 'Renvoyer le code'}</span>
          </button>

          <Link href="/login" className="text-slate-500 hover:text-slate-800 font-semibold">
            Retour à la connexion
          </Link>
        </div>
      </div>
    </div>
  );
}
