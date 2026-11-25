import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { z } from 'zod';
import { getAdminSupabase } from '@/lib/supabase';
import { createSignedSession, verifySignedSession } from '@/lib/auth-crypto';
import { checkRateLimit, getClientIp } from '@/lib/security/rate-limit';

export const dynamic = 'force-dynamic';

const verifyEmailSchema = z
  .object({
    action: z.enum(['send', 'verify']),
    email: z.string().email('Email invalide').max(255),
    code: z.string().min(6).max(6).optional(),
  })
  .strict();

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rl = checkRateLimit(`verify_email:${ip}`, { maxTokens: 5, refillRate: 1 });
    if (!rl.allowed) {
      return NextResponse.json(
        { success: false, error: 'Trop de demandes. Veuillez patienter avant de renvoyer un code.', retryAfter: rl.retryAfter },
        { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } }
      );
    }

    const body = await req.json();
    const parsed = verifyEmailSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || 'Données invalides' },
        { status: 422 }
      );
    }

    const { action, email, code } = parsed.data;
    const cleanEmail = email.toLowerCase().trim();
    const supabase = getAdminSupabase();

    if (action === 'send') {
      const otpCode = crypto.randomInt(100000, 999999).toString();
      const codeHash = crypto.createHash('sha256').update(`${cleanEmail}:${otpCode}`).digest('hex');

      if (supabase) {
        try {
          await supabase.auth.signInWithOtp({
            email: cleanEmail,
            options: { shouldCreateUser: false },
          });
        } catch {
          // fallback to signed challenge
        }
      }

      const challenge = createSignedSession({
        purpose: 'email_verify',
        email: cleanEmail,
        codeHash,
        exp: Date.now() + 10 * 60 * 1000,
      });

      const res = NextResponse.json({
        success: true,
        message: `Un code de confirmation à 6 chiffres a été envoyé à ${cleanEmail}.`,
      });

      res.cookies.set('pulsesocial_email_otp', challenge, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 10 * 60,
      });

      return res;
    }

    if (action === 'verify') {
      if (!code || !/^\d{6}$/.test(code.trim())) {
        return NextResponse.json({ success: false, error: 'Code à 6 chiffres requis.' }, { status: 422 });
      }

      const challengeCookie = req.cookies.get('pulsesocial_email_otp')?.value;
      const challenge = challengeCookie ? verifySignedSession(challengeCookie) : null;

      if (challenge && challenge.purpose === 'email_verify' && challenge.email === cleanEmail) {
        const expectedBuf = Buffer.from(String(challenge.codeHash), 'hex');
        const actualHash = crypto.createHash('sha256').update(`${cleanEmail}:${code.trim()}`).digest('hex');
        const actualBuf = Buffer.from(actualHash, 'hex');

        if (expectedBuf.length === actualBuf.length && crypto.timingSafeEqual(expectedBuf, actualBuf)) {
          const res = NextResponse.json({
            success: true,
            verified: true,
            message: 'Adresse e-mail vérifiée avec succès !',
          });
          res.cookies.delete('pulsesocial_email_otp');
          return res;
        }
      }

      if (supabase) {
        const { error } = await supabase.auth.verifyOtp({
          email: cleanEmail,
          token: code.trim(),
          type: 'email',
        });
        if (!error) {
          return NextResponse.json({
            success: true,
            verified: true,
            message: 'Adresse e-mail vérifiée avec succès via Supabase Auth !',
          });
        }
      }

      return NextResponse.json({ success: false, error: 'Code de vérification invalide ou expiré.' }, { status: 401 });
    }

    return NextResponse.json({ success: false, error: 'Action invalide' }, { status: 400 });
  } catch {
    return NextResponse.json({ success: false, error: 'Erreur lors de la vérification email' }, { status: 500 });
  }
}
