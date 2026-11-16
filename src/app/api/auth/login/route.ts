import { NextRequest, NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/supabase';
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

    const { email } = parsed.data;
    const supabase = getAdminSupabase();

    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Base de données non disponible' },
        { status: 503 }
      );
    }

    // Verify user in user_profiles
    const { data: user, error } = await supabase
      .from('user_profiles')
      .select('*, workspaces(*)')
      .eq('email', email.toLowerCase().trim())
      .maybeSingle();

    if (error || !user) {
      return NextResponse.json(
        { success: false, error: 'Identifiants invalides ou compte introuvable.' },
        { status: 401 }
      );
    }

    // Create session cookie
    const sessionToken = Buffer.from(
      JSON.stringify({
        id: user.id,
        email: user.email,
        role: user.role,
        workspaceId: user.workspace_id,
        isLifetimeFree: user.is_lifetime_free,
        exp: Date.now() + 30 * 24 * 60 * 60 * 1000,
      })
    ).toString('base64');

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
