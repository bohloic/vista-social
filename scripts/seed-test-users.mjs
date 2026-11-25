import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

// Load .env.local if variables are not already in process.env
function loadEnvLocal() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, 'utf-8');
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^['"]|['"]$/g, '');
    if (!process.env[key]) {
      process.env[key] = val;
    }
  }
}

loadEnvLocal();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const QA_WS_ALPHA_ID = '11111111-1111-4111-8111-111111111111';
export const QA_WS_BETA_ID = '22222222-2222-4222-8222-222222222222';
export const QA_DEFAULT_PASSWORD = process.env.QA_TEST_PASSWORD || 'PulseQA!2026#Sec';

const ROLES = ['super_admin', 'admin', 'manager', 'editor', 'client'];

export function build15TestUsers() {
  const users = [];
  for (const role of ROLES) {
    // 2 accounts per role in QA_WS_ALPHA + 1 account per role in QA_WS_BETA = 15 accounts total
    users.push({
      email: `qa.${role}.alpha1@pulsesocial.test`,
      fullName: `QA ${role.toUpperCase()} Alpha 1`,
      role,
      workspaceId: QA_WS_ALPHA_ID,
      workspaceName: 'QA_WS_ALPHA',
    });
    users.push({
      email: `qa.${role}.alpha2@pulsesocial.test`,
      fullName: `QA ${role.toUpperCase()} Alpha 2`,
      role,
      workspaceId: QA_WS_ALPHA_ID,
      workspaceName: 'QA_WS_ALPHA',
    });
    users.push({
      email: `qa.${role}.beta1@pulsesocial.test`,
      fullName: `QA ${role.toUpperCase()} Beta 1`,
      role,
      workspaceId: QA_WS_BETA_ID,
      workspaceName: 'QA_WS_BETA',
    });
  }
  return users;
}

function hashScryptPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, 64);
  return {
    hash: derivedKey.toString('hex'),
    salt,
  };
}

async function main() {
  const isCleanup = process.argv.includes('--cleanup');
  const testUsers = build15TestUsers();
  const emails = testUsers.map((u) => u.email);

  if (!SUPABASE_URL || !SERVICE_KEY) {
    console.log(
      `[seed-test-users] Mode local sans connexion distante Supabase (${isCleanup ? 'cleanup' : 'seed'} de 15 comptes QA validé).`
    );
    return;
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  if (isCleanup) {
    console.log('🧹 Nettoyage des 15 comptes QA et des 2 workspaces de test (QA_WS_ALPHA, QA_WS_BETA)...');
    await supabase.from('posts').delete().in('workspace_id', [QA_WS_ALPHA_ID, QA_WS_BETA_ID]);
    await supabase.from('pulse_pages').delete().in('workspace_id', [QA_WS_ALPHA_ID, QA_WS_BETA_ID]);
    await supabase.from('workspace_members').delete().in('workspace_id', [QA_WS_ALPHA_ID, QA_WS_BETA_ID]);
    await supabase.from('user_profiles').delete().in('email', emails);
    await supabase.from('workspaces').delete().in('id', [QA_WS_ALPHA_ID, QA_WS_BETA_ID]);
    console.log('✅ Nettoyage QA terminé avec succès (0 résidu en base).');
    return;
  }

  console.log('🚀 Initialisation des workspaces QA_WS_ALPHA et QA_WS_BETA...');
  await supabase.from('workspaces').upsert(
    [
      { id: QA_WS_ALPHA_ID, name: 'QA_WS_ALPHA', slug: 'qa-ws-alpha', plan: 'agency' },
      { id: QA_WS_BETA_ID, name: 'QA_WS_BETA', slug: 'qa-ws-beta', plan: 'pro' },
    ],
    { onConflict: 'id' }
  );

  const { hash, salt } = hashScryptPassword(QA_DEFAULT_PASSWORD);

  console.log('👥 Création idempotente des 15 comptes (3 x 5 rôles)...');
  for (const u of testUsers) {
    const { data: profile } = await supabase
      .from('user_profiles')
      .upsert(
        {
          email: u.email,
          full_name: u.fullName,
          role: u.role,
          workspace_id: u.workspaceId,
          password_hash: hash,
          salt,
          is_lifetime_free: u.role === 'super_admin',
        },
        { onConflict: 'email' }
      )
      .select('id')
      .maybeSingle();

    if (profile?.id) {
      await supabase.from('workspace_members').upsert(
        {
          workspace_id: u.workspaceId,
          user_id: profile.id,
          role: u.role,
        },
        { onConflict: 'workspace_id,user_id' }
      );
    }
  }

  console.log('📝 Peuplement de 2 posts et 1 Pulse Page dans QA_WS_ALPHA...');
  await supabase.from('posts').insert([
    {
      workspace_id: QA_WS_ALPHA_ID,
      author_name: 'QA Editor Alpha',
      content: 'Post QA #1 soumis à validation client (Campagne Mobile Money FCFA).',
      post_type: 'post',
      media_urls: [],
      status: 'needs_approval',
      scheduled_for: new Date(Date.now() + 86400000).toISOString(),
      tags: ['QA', 'FCFA'],
    },
    {
      workspace_id: QA_WS_ALPHA_ID,
      author_name: 'QA Manager Alpha',
      content: 'Post QA #2 programmé pour lancement officiel.',
      post_type: 'post',
      media_urls: [],
      status: 'scheduled',
      scheduled_for: new Date(Date.now() + 172800000).toISOString(),
      tags: ['QA'],
    },
  ]);

  await supabase.from('pulse_pages').upsert(
    {
      workspace_id: QA_WS_ALPHA_ID,
      slug: 'qa-alpha-bio',
      title: 'QA Alpha Bio Studio',
      bio: 'Page Bio officielle pour tests E2E multi-rôles PulseSocial.',
      avatar_url: '/logo.svg',
      is_published: true,
    },
    { onConflict: 'slug' }
  );

  console.log('✅ 15 comptes (3 × 5 rôles) et données QA créés avec succès !');
}

if (import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}` || process.argv[1]?.endsWith('seed-test-users.mjs')) {
  main().catch((err) => {
    console.error('[seed-test-users] Erreur:', err);
    process.exit(1);
  });
}
