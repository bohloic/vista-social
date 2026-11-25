import { createClient } from '@supabase/supabase-js';
import { Post, SocialAccount, UserProfile, Workspace } from './types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ljpslbcouvyyzzvxxfme.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_9tZP7svzC1kUyde_aceUzQ_taHn8E7Y';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Browser / Public Supabase Client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export function getBrowserSupabase() {
  return supabase;
}

// Admin Supabase Client (Server-side privileged operations)
export function getAdminSupabase() {
  const key = supabaseServiceRoleKey || supabaseAnonKey;
  return createClient(supabaseUrl, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

// Check if PulseSocial is initialized (has at least 1 admin profile)
export async function checkAppInitialized(): Promise<{
  initialized: boolean;
  adminProfile?: UserProfile | null;
  workspace?: Workspace | null;
}> {
  try {
    const adminClient = getAdminSupabase();
    const { data: users, error: userErr } = await adminClient
      .from('user_profiles')
      .select('*')
      .limit(1);

    if (userErr) {
      // If Supabase network is unreachable (e.g., offline sandbox or transient network error), fail-safe to initialized: true
      return { initialized: true, adminProfile: null, workspace: null };
    }

    if (!users || users.length === 0) {
      return { initialized: false, adminProfile: null, workspace: null };
    }

    const admin = users[0] as UserProfile;
    const { data: workspaces } = await adminClient
      .from('workspaces')
      .select('*')
      .limit(1);

    const ws = workspaces && workspaces.length > 0 ? (workspaces[0] as Workspace) : null;
    return { initialized: true, adminProfile: admin, workspace: ws };
  } catch (err) {
    console.error('Error checking app initialization status:', err);
    return { initialized: true, adminProfile: null, workspace: null };
  }
}
