import { getAdminSupabase, checkAppInitialized } from '@/lib/supabase';
import { hashPassword, createSignedSession } from '@/lib/auth-crypto';
import { z } from 'zod';

const setupSchema = z.object({
  fullName: z.string().min(2, 'Le nom complet doit comporter au moins 2 caractères'),
  email: z.string().email('Format email invalide'),
  password: z.string().min(6, 'Le mot de passe doit comporter au moins 6 caractères'),
  workspaceName: z.string().min(2, 'Le nom de l\'espace doit comporter au moins 2 caractères'),
  timezone: z.string().default('Africa/Abidjan'),
  metaAccessToken: z.string().optional(),
  metaAccountName: z.string().optional(),
});

// GET: Check if the application has already been set up with an admin account
export async function GET() {
  const status = await checkAppInitialized();
  return Response.json({
    initialized: status.initialized,
    workspace: status.workspace,
    adminEmail: status.adminProfile ? status.adminProfile.email : null,
  });
}

// POST: First-time setup - Create Super-Admin and default Workspace
export async function POST(req: Request) {
  try {
    const existing = await checkAppInitialized();
    if (existing.initialized) {
      return Response.json(
        { error: 'L\'application est déjà initialisée avec un compte Super-Admin.' },
        { status: 400 }
      );
    }

    const body = await req.json();
    const parsed = setupSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: parsed.error.errors[0]?.message || 'Données invalides' },
        { status: 422 }
      );
    }

    const { fullName, email, password, workspaceName, timezone, metaAccessToken, metaAccountName } = parsed.data;
    const adminClient = getAdminSupabase();

    // 1. Create Workspace
    const workspaceSlug = workspaceName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '') || 'pulse-workspace';

    const { data: wsData, error: wsError } = await adminClient
      .from('workspaces')
      .insert({
        name: workspaceName,
        slug: `${workspaceSlug}-${Date.now().toString().slice(-4)}`,
        timezone: timezone || 'Africa/Abidjan',
        plan: 'enterprise',
      })
      .select()
      .single();

    if (wsError || !wsData) {
      console.error('Failed to create workspace:', wsError);
      return Response.json({ error: 'Erreur lors de la création de l\'espace de travail' }, { status: 500 });
    }

    // 2. Cryptographic Password Hashing (scrypt + random salt)
    const { hash, salt } = hashPassword(password);

    // 3. Create Super-Admin Profile (Lifetime Free access + password hash)
    const { data: userProfile, error: userError } = await adminClient
      .from('user_profiles')
      .insert({
        full_name: fullName,
        email: email.toLowerCase().trim(),
        role: 'super_admin',
        is_lifetime_free: true,
        password_hash: hash,
        salt: salt,
        workspace_id: wsData.id,
      })
      .select()
      .single();

    if (userError || !userProfile) {
      console.error('Failed to create admin profile:', userError);
      return Response.json({ error: 'Erreur lors de la création du profil administrateur' }, { status: 500 });
    }

    // 4. Link Workspace Member
    await adminClient.from('workspace_members').insert({
      workspace_id: wsData.id,
      user_id: userProfile.id,
      role: 'super_admin',
    });

    // 5. Update initialization flag in app_config
    await adminClient.from('app_config').upsert({
      key: 'is_initialized',
      value: { initialized: true, configured_at: new Date().toISOString() },
    });

    // 6. Optionally connect Meta account if token provided
    if (metaAccessToken && metaAccessToken.trim().length > 10) {
      await adminClient.from('social_accounts').insert({
        workspace_id: wsData.id,
        platform: 'instagram',
        platform_account_id: `meta-${Date.now()}`,
        account_name: metaAccountName || `${fullName} (Meta)`,
        username: `@${workspaceSlug}`,
        avatar_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80',
        access_token: metaAccessToken.trim(),
        is_connected: true,
        status: 'active',
        followers_count: 0,
      });
    }

    // 7. Generate Signed Session Token
    const sessionToken = createSignedSession({
      id: userProfile.id,
      email: userProfile.email,
      role: userProfile.role,
      workspaceId: wsData.id,
      isLifetimeFree: userProfile.is_lifetime_free,
      exp: Date.now() + 30 * 24 * 60 * 60 * 1000,
    });

    const response = Response.json(
      {
        success: true,
        message: 'PulseSocial initialisé avec succès ! Compte Super-Admin activé avec accès gratuit à vie.',
        workspace: wsData,
        profile: {
          id: userProfile.id,
          email: userProfile.email,
          fullName: userProfile.full_name,
          role: userProfile.role,
          isLifetimeFree: userProfile.is_lifetime_free,
        },
      },
      {
        status: 201,
        headers: {
          'Set-Cookie': `pulsesocial_session=${sessionToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000${
            process.env.NODE_ENV === 'production' ? '; Secure' : ''
          }`,
        },
      }
    );

    return response;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur interne du serveur';
    console.error('Setup error:', err);
    return Response.json({ error: message }, { status: 500 });
  }
}
