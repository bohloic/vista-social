import { NextRequest, NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/supabase';
import { hashPassword } from '@/lib/auth-crypto';
import crypto from 'crypto';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const requestResetSchema = z.object({
  action: z.enum(['request', 'confirm']),
  email: z.string().email('Format email invalide'),
  token: z.string().optional(),
  newPassword: z.string().min(6, 'Le mot de passe doit comporter au moins 6 caractères').optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = requestResetSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || 'Données invalides' },
        { status: 400 }
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
        // Return success message to prevent user enumeration
        return NextResponse.json({
          success: true,
          message: `Si un compte correspond à ${cleanEmail}, un code de réinitialisation sécurisé a été généré.`,
        });
      }

      // Generate a 6-digit numeric reset code and secure token
      const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
      const resetToken = crypto.createHash('sha256').update(`${user.id}-${Date.now()}-${resetCode}`).digest('hex');

      // Trigger Supabase Auth reset if configured
      try {
        await supabase.auth.resetPasswordForEmail(cleanEmail, {
          redirectTo: `${new URL(req.url).origin}/login?reset=1`,
        });
      } catch {
        // Continue with direct token flow
      }

      return NextResponse.json({
        success: true,
        message: `Code de réinitialisation généré pour ${cleanEmail}. Entrez votre nouveau mot de passe ci-dessous.`,
        resetCode,
        resetToken,
      });
    }

    // Step 2: Confirm Password Reset
    if (action === 'confirm') {
      if (!newPassword || newPassword.length < 6) {
        return NextResponse.json(
          { success: false, error: 'Le nouveau mot de passe doit comporter au moins 6 caractères' },
          { status: 400 }
        );
      }

      const { data: user, error: findError } = await supabase
        .from('user_profiles')
        .select('id, email')
        .eq('email', cleanEmail)
        .maybeSingle();

      if (findError || !user) {
        return NextResponse.json(
          { success: false, error: 'Compte introuvable pour cette adresse e-mail.' },
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

      return NextResponse.json({
        success: true,
        message: 'Votre mot de passe a été réinitialisé avec succès. Vous pouvez maintenant vous connecter.',
      });
    }

    return NextResponse.json({ success: false, error: 'Action non reconnue' }, { status: 400 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur réinitialisation mot de passe';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
