import { getAdminSupabase } from '@/lib/supabase';

export const SUPPORTED_AUTH_PROVIDERS = ['google', 'facebook', 'apple'] as const;
export type AuthOAuthProvider = (typeof SUPPORTED_AUTH_PROVIDERS)[number];

export function isSupportedAuthProvider(val: string): val is AuthOAuthProvider {
  return (SUPPORTED_AUTH_PROVIDERS as readonly string[]).includes(val);
}

const isUuid = (val?: string | null): val is string =>
  typeof val === 'string' &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);

const ADMIN_EMAILS = process.env.ADMIN_EMAILS
  ? process.env.ADMIN_EMAILS.split(',').map((e) => e.trim().toLowerCase()).filter(Boolean)
  : [];

const isAdminEmail = (email: string) => {
  const clean = email.toLowerCase().trim();
  return ADMIN_EMAILS.some((adm) => clean === adm);
};

export async function checkSupabaseProviderEnabled(
  provider: AuthOAuthProvider
): Promise<boolean | null> {
  const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim();
  const supabaseAnonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim();
  if (!supabaseUrl || !supabaseAnonKey) return null;

  try {
    const res = await fetch(`${supabaseUrl}/auth/v1/settings`, {
      headers: { apikey: supabaseAnonKey },
      signal: AbortSignal.timeout(4000),
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const settings = (await res.json()) as { external?: Record<string, boolean> };
    if (!settings?.external || typeof settings.external[provider] !== 'boolean') {
      return null;
    }
    return Boolean(settings.external[provider]);
  } catch {
    return null;
  }
}

export interface PersistedOAuthUser {
  id: string;
  email: string;
  fullName: string;
  role: string;
  isLifetimeFree: boolean;
  workspaceId: string;
  workspaceName: string;
  avatarUrl: string;
  authProvider: AuthOAuthProvider;
  persisted: boolean;
}

export async function resolveOrCreateOAuthUser(params: {
  email?: string | null;
  fullName?: string | null;
  avatarUrl?: string | null;
  provider: AuthOAuthProvider;
  authUserId?: string | null;
}): Promise<PersistedOAuthUser> {
  const provider = params.provider;
  const rawEmail = (params.email || '').toLowerCase().trim();
  // Apple/Facebook privacy relay fallback using verified Supabase authUserId
  const cleanEmail =
    rawEmail ||
    (params.authUserId
      ? `${provider}-${params.authUserId}@oauth.pulsesocial.local`
      : `${provider}-${Date.now()}@oauth.pulsesocial.local`);
  const displayName =
    (params.fullName || '').trim() ||
    cleanEmail.split('@')[0] ||
    `Utilisateur ${provider}`;
  const avatar = (params.avatarUrl || '').trim();

  const isAdmin = isAdminEmail(cleanEmail);
  const defaultRole = isAdmin ? 'super_admin' : 'client';
  const isLifetimeFree = isAdmin;
  const initialPlan = isAdmin ? 'agency' : 'starter';

  const fallbackUser: PersistedOAuthUser = {
    id: isUuid(params.authUserId) ? params.authUserId : `${provider}-${Date.now()}`,
    email: cleanEmail,
    fullName: displayName,
    role: defaultRole,
    isLifetimeFree,
    workspaceId: 'ws-default',
    workspaceName: `Espace ${displayName}`,
    avatarUrl: avatar,
    authProvider: provider,
    persisted: false,
  };

  const supabase = getAdminSupabase();
  if (!supabase) return fallbackUser;

  try {
    // 1. Check if user profile already exists by email (or authUserId)
    let { data: existingProfile } = await supabase
      .from('user_profiles')
      .select('id, email, full_name, role, is_lifetime_free, workspace_id, avatar_url, workspaces(name)')
      .eq('email', cleanEmail)
      .maybeSingle();

    if (!existingProfile && isUuid(params.authUserId)) {
      const byIdRes = await supabase
        .from('user_profiles')
        .select('id, email, full_name, role, is_lifetime_free, workspace_id, avatar_url, workspaces(name)')
        .eq('id', params.authUserId)
        .maybeSingle();
      existingProfile = byIdRes.data;
    }

    if (existingProfile) {
      let wsId = existingProfile.workspace_id as string | null;
      const wsObj = existingProfile.workspaces as
        | { name?: string }
        | Array<{ name?: string }>
        | null;
      let wsName =
        (Array.isArray(wsObj) ? wsObj[0]?.name : wsObj?.name) || `Espace ${displayName}`;

      if (!wsId) {
        const { data: createdWs } = await supabase
          .from('workspaces')
          .insert({
            name: `Espace ${existingProfile.full_name || displayName}`,
            slug: `ws-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            plan: isAdmin ? 'agency' : 'starter',
          })
          .select('id, name')
          .maybeSingle();
        if (createdWs?.id) {
          wsId = createdWs.id;
          wsName = createdWs.name;
          await supabase
            .from('user_profiles')
            .update({ workspace_id: wsId, updated_at: new Date().toISOString() })
            .eq('id', existingProfile.id);
        }
      }

      if (wsId) {
        try {
          await supabase.from('workspace_members').upsert(
            {
              workspace_id: wsId,
              user_id: existingProfile.id,
              role: existingProfile.role || defaultRole,
            },
            { onConflict: 'workspace_id,user_id' }
          );
        } catch {
          // non-blocking
        }
      }

      return {
        id: existingProfile.id,
        email: existingProfile.email,
        fullName: existingProfile.full_name || displayName,
        role: existingProfile.role || defaultRole,
        isLifetimeFree: existingProfile.is_lifetime_free ?? isLifetimeFree,
        workspaceId: wsId || 'ws-default',
        workspaceName: wsName,
        avatarUrl: existingProfile.avatar_url || avatar,
        authProvider: provider,
        persisted: true,
      };
    }

    // 2. Create dedicated workspace for new OAuth user
    let wsId: string | null = null;
    let wsName = `Espace ${displayName}`;
    const { data: createdWs } = await supabase
      .from('workspaces')
      .insert({
        name: wsName,
        slug: `ws-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        plan: initialPlan,
      })
      .select('id, name')
      .maybeSingle();

    if (createdWs?.id) {
      wsId = createdWs.id;
      wsName = createdWs.name;
    } else {
      const { data: existingWs } = await supabase
        .from('workspaces')
        .select('id, name')
        .limit(1)
        .maybeSingle();
      if (existingWs?.id) {
        wsId = existingWs.id;
        wsName = existingWs.name;
      }
    }

    // 3. Insert user profile (prefer Supabase Auth UUID, retry without id if constraint differs)
    const baseInsert = {
      email: cleanEmail,
      full_name: displayName,
      role: defaultRole,
      is_lifetime_free: isLifetimeFree,
      workspace_id: wsId,
      avatar_url: avatar || null,
    };

    let createdUser = null;
    if (isUuid(params.authUserId)) {
      const withIdRes = await supabase
        .from('user_profiles')
        .insert({ id: params.authUserId, ...baseInsert })
        .select('id, email, full_name, role, is_lifetime_free, workspace_id, avatar_url')
        .maybeSingle();
      createdUser = withIdRes.data;
    }

    if (!createdUser) {
      const withoutIdRes = await supabase
        .from('user_profiles')
        .insert(baseInsert)
        .select('id, email, full_name, role, is_lifetime_free, workspace_id, avatar_url')
        .maybeSingle();
      createdUser = withoutIdRes.data;
    }

    if (createdUser) {
      if (wsId) {
        try {
          await supabase.from('workspace_members').upsert(
            {
              workspace_id: wsId,
              user_id: createdUser.id,
              role: createdUser.role || defaultRole,
            },
            { onConflict: 'workspace_id,user_id' }
          );
        } catch {
          // non-blocking
        }
      }

      return {
        id: createdUser.id,
        email: createdUser.email,
        fullName: createdUser.full_name || displayName,
        role: createdUser.role || defaultRole,
        isLifetimeFree: createdUser.is_lifetime_free ?? isLifetimeFree,
        workspaceId: createdUser.workspace_id || wsId || 'ws-default',
        workspaceName: wsName,
        avatarUrl: createdUser.avatar_url || avatar,
        authProvider: provider,
        persisted: true,
      };
    }
  } catch (err) {
    console.warn('OAuth user persistence error:', err);
  }

  return fallbackUser;
}
