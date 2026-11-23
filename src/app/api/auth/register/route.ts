import { NextRequest, NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/supabase';
import { hashPassword, createSignedSession } from '@/lib/auth-crypto';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const registerSchema = z.object({
  email: z.string().email('Format email invalide'),
  password: z.string().min(6, 'Le mot de passe doit comporter au moins 6 caractères'),
  fullName: z.string().min(2, 'Le nom doit comporter au moins 2 caractères').optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || 'Données invalides' },
        { status: 400 }
      );
    }

    const { email, password, fullName } = parsed.data;
    const cleanEmail = email.toLowerCase().trim();
    const supabase = getAdminSupabase();

    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Base de données non disponible' },
        { status: 503 }
      );
    }

    // 1. Check if user already exists
    const { data: existingUser } = await supabase
      .from('user_profiles')
      .select('id, email')
      .eq('email', cleanEmail)
      .maybeSingle();

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'Un compte existe déjà avec cette adresse e-mail. Veuillez vous connecter.' },
        { status: 409 }
      );
    }

    // 2. Hash password with scrypt + salt
    const { hash, salt } = hashPassword(password);

    // 3. Create or assign client workspace
    const userDisplayName = fullName?.trim() || cleanEmail.split('@')[0];
    const { data: workspace } = await supabase
      .from('workspaces')
      .insert({
        name: `Espace ${userDisplayName}`,
        slug: `ws-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        plan: 'starter', // Standard user default: starter plan requiring upgrade for unlimited features
      })
      .select('id, name')
      .maybeSingle();

    const workspaceId = workspace?.id || null;
    const workspaceName = workspace?.name || `Espace ${userDisplayName}`;

    // 4. Create user profile with strictly NON-ADMIN client role
    const profilePayload: Record<string, any> = {
      email: cleanEmail,
      full_name: userDisplayName,
      role: 'client', // Strictly standard client / user (requires subscription for unlimited access)
      is_lifetime_free: false, // Standard client does NOT have lifetime free access
      password_hash: hash,
      salt,
    };
    if (workspaceId) {
      profilePayload.workspace_id = workspaceId;
    }

    const { data: createdUser, error: insertError } = await supabase
      .from('user_profiles')
      .insert(profilePayload)
      .select('id, email, full_name, role, is_lifetime_free, workspace_id')
      .single();

    if (insertError || !createdUser) {
      console.error('Registration profile creation error:', insertError);
      return NextResponse.json(
        { success: false, error: insertError?.message || 'Impossible de créer le compte utilisateur dans la base de données.' },
        { status: 500 }
      );
    }

    // Link workspace member if workspace exists
    if (workspaceId) {
      try {
        await supabase.from('workspace_members').insert({
          workspace_id: workspaceId,
          user_id: createdUser.id,
          role: 'client',
        });
      } catch {
        // ignore member link if table not present
      }
    }

    // 5. Create signed session
    const sessionToken = createSignedSession({
      id: createdUser.id,
      email: createdUser.email,
      role: 'client',
      workspaceId: createdUser.workspace_id,
      isLifetimeFree: false,
      exp: Date.now() + 30 * 24 * 60 * 60 * 1000,
    });

    const response = NextResponse.json({
      success: true,
      message: 'Compte créé avec succès',
      user: {
        id: createdUser.id,
        email: createdUser.email,
        fullName: createdUser.full_name,
        role: 'client',
        isLifetimeFree: false,
        workspaceId: createdUser.workspace_id,
        workspaceName,
      },
    });

    response.cookies.set({
      name: 'pulsesocial_session',
      value: sessionToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60,
    });

    return response;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur inscription';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
