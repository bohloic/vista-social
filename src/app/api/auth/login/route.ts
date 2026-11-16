import { NextRequest, NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/supabase';
import { verifyPassword, createSignedSession } from '@/lib/auth-crypto';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('Format email invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || 'Données invalides' },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;
    const supabase = getAdminSupabase();

    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Base de données non disponible' },
        { status: 503 }
      );
    }

    // 1. Verify user in user_profiles
    const { data: user, error } = await supabase
      .from('user_profiles')
      .select('*, workspaces(*)')
      .eq('email', email.toLowerCase().trim())
      .maybeSingle();

    if (error || !user) {
      return NextResponse.json(
        { success: false, error: 'Identifiant ou compte introuvable.' },
        { status: 401 }
      );
    }

    // 2. Cryptographic Password Verification
    if (user.password_hash && user.salt) {
      const isValid = verifyPassword(password, user.password_hash, user.salt);
      if (!isValid) {
        return NextResponse.json(
          { success: false, error: 'Mot de passe incorrect.' },
          { status: 401 }
        );
      }
    } else {
      // If legacy account without hash, require initial setup
      return NextResponse.json(
        { success: false, error: 'Compte non configuré. Veuillez effectuer le Setup initial.' },
        { status: 401 }
      );
    }

    // 3. Create cryptographically signed session token
    const sessionToken = createSignedSession({
      id: user.id,
      email: user.email,
      role: user.role,
      workspaceId: user.workspace_id,
      isLifetimeFree: user.is_lifetime_free,
      exp: Date.now() + 30 * 24 * 60 * 60 * 1000,
    });

    const response = NextResponse.json({
      success: true,
      message: 'Connexion réussie',
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        isLifetimeFree: user.is_lifetime_free,
        workspaceId: user.workspace_id,
      },
    });

    response.cookies.set({
      name: 'pulsesocial_session',
      value: sessionToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    return response;
  } catch (err) {
    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
