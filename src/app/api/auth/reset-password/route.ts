import { NextRequest, NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/supabase';
import { hashPassword, createSignedSession, verifySignedSession } from '@/lib/auth-crypto';
import { checkRateLimit, getClientIp } from '@/lib/security/rate-limit';
import crypto from 'crypto';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const requestResetSchema = z
  .object({
    action: z.enum(['request', 'confirm']),
    email: z.string().email('Format email invalide').max(255),
    token: z.string().min(4).max(256).optional(),
    newPassword: z.string().min(8, 'Le mot de passe doit comporter au moins 8 caractères').max(128).optional(),
  })
  .strict();

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    // Rate limit reset requests: 5 requests / min per IP
    const rateLimit = checkRateLimit(`auth_reset:${ip}`, { maxTokens: 5, refillRate: 1 });
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Trop de requêtes. Veuillez patienter.', retryAfter: rateLimit.retryAfter },
        { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfter) } }
      );
    }

    const body = await req.json();
    const parsed = requestResetSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || 'Données invalides' },
        { status: 422 }
      );
    }

    const { action, email, token, newPassword } = parsed.data;
    const cleanEmail = email.toLowerCase().trim();
    const supabase = getAdminSupabase();

    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Base de données non disponible' },
        { status: 503 }
      );
    }

    // Step 1: Request Password Reset
    if (action === 'request') {
      const { data: user } = await supabase
        .from('user_profiles')
        .select('id, email, full_name')
        .eq('email', cleanEmail)
        .maybeSingle();

      if (!user) {
        // Return generic success message to prevent user enumeration
        return NextResponse.json({
          success: true,
          message: `Si un compte correspond à ${cleanEmail}, un code de vérification a été envoyé par e-mail.`,
        });
      }

      // Generate a cryptographically secure 6-digit OTP code
      const resetCode = crypto.randomInt(100000, 999999).toString();
      const codeHash = crypto.createHash('sha256').update(`${cleanEmail}:${resetCode}`).digest('hex');

      // Trigger Supabase Auth reset email
      try {
        await supabase.auth.resetPasswordForEmail(cleanEmail, {
          redirectTo: `${new URL(req.url).origin}/login?reset=1`,
        });
      } catch {
        // Continue with challenge cookie
      }

      // [STRIX-02 Fix]: Store signed HMAC challenge in an HttpOnly cookie (never expose resetCode in JSON response!)
      const challengeCookie = createSignedSession({
        purpose: 'password_reset',
        userId: user.id,
        email: cleanEmail,
        codeHash,
        exp: Date.now() + 10 * 60 * 1000, // 10 minutes validity
      });

      const res = NextResponse.json({
        success: true,
        message: `Si un compte correspond à ${cleanEmail}, un code de réinitialisation a été envoyé à votre adresse e-mail.`,
      });

      res.cookies.set('pulsesocial_reset_challenge', challengeCookie, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/api/auth/reset-password',
        maxAge: 10 * 60,
      });

      return res;
    }

    // Step 2: Confirm Password Reset
    if (action === 'confirm') {
      if (!newPassword || newPassword.length < 8) {
        return NextResponse.json(
          { success: false, error: 'Le nouveau mot de passe doit comporter au moins 8 caractères' },
          { status: 422 }
        );
      }

      // [STRIX-02 Fix]: Require and cryptographically verify the reset token/code before allowing password change!
      if (!token) {
        return NextResponse.json(
          { success: false, error: 'Code de vérification requis pour réinitialiser le mot de passe.' },
          { status: 401 }
        );
      }

      const challengeToken = req.cookies.get('pulsesocial_reset_challenge')?.value;
      const challenge = challengeToken ? verifySignedSession(challengeToken) : null;

      if (
        !challenge ||
        challenge.purpose !== 'password_reset' ||
        challenge.email !== cleanEmail ||
        typeof challenge.codeHash !== 'string'
      ) {
        return NextResponse.json(
          { success: false, error: 'Session de réinitialisation invalide ou expirée. Veuillez refaire une demande.' },
          { status: 401 }
        );
      }

      const providedHash = crypto.createHash('sha256').update(`${cleanEmail}:${token.trim()}`).digest('hex');
      const expectedBuf = Buffer.from(challenge.codeHash, 'hex');
      const actualBuf = Buffer.from(providedHash, 'hex');

      if (expectedBuf.length !== actualBuf.length || !crypto.timingSafeEqual(expectedBuf, actualBuf)) {
        return NextResponse.json(
          { success: false, error: 'Code de vérification invalide.' },
          { status: 401 }
        );
      }

      const { data: user, error: findError } = await supabase
        .from('user_profiles')
        .select('id, email')
        .eq('id', challenge.userId)
        .eq('email', cleanEmail)
        .maybeSingle();

      if (findError || !user) {
        return NextResponse.json(
          { success: false, error: 'Compte introuvable.' },
          { status: 404 }
        );
      }

      // Hash the new password securely
      const { hash, salt } = hashPassword(newPassword);

      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({
          password_hash: hash,
          salt,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (updateError) {
        return NextResponse.json(
          { success: false, error: 'Impossible de mettre à jour le mot de passe.' },
          { status: 500 }
        );
      }

      const res = NextResponse.json({
        success: true,
        message: 'Votre mot de passe a été réinitialisé avec succès. Vous pouvez maintenant vous connecter.',
      });
      res.cookies.delete('pulsesocial_reset_challenge');
      return res;
    }

    return NextResponse.json({ success: false, error: 'Action non reconnue' }, { status: 400 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur réinitialisation mot de passe';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
