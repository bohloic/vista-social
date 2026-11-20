import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

function walk(dir) {
  let files = [];
  try {
    for (const f of fs.readdirSync(dir)) {
      const full = path.join(dir, f);
      if (f === 'node_modules' || f === '.next' || f === '.git' || f === 'dist') continue;
      const stat = fs.statSync(full);
      if (stat.isDirectory()) files = files.concat(walk(full));
      else files.push(full);
    }
  } catch (e) {}
  return files;
}

const allFiles = walk('.');

// 1. SQL files
const sqlFiles = allFiles.filter((f) => f.endsWith('.sql'));

// 2. API Routes
const apiRoutes = allFiles.filter((f) => f.replace(/\\/g, '/').match(/src\/app\/api\/.*route\.ts$/));

// 3. Server Actions
const serverActions = allFiles.filter((f) => {
  if (!f.endsWith('.ts') && !f.endsWith('.tsx') && !f.endsWith('.js') && !f.endsWith('.mjs')) return false;
  const content = fs.readFileSync(f, 'utf8');
  return content.includes("'use server'") || content.includes('"use server"');
});

// 4. Supabase Client occurrences
const supabaseUsage = [];
for (const f of allFiles) {
  if (!f.endsWith('.ts') && !f.endsWith('.tsx') && !f.endsWith('.js') && !f.endsWith('.mjs')) continue;
  const content = fs.readFileSync(f, 'utf8');
  const hits = [];
  if (content.includes('getAdminSupabase')) hits.push('getAdminSupabase');
  if (content.includes('service_role') || content.includes('SERVICE_ROLE')) hits.push('service_role');
  if (content.includes('createClient')) hits.push('createClient');
  if (content.includes('auth.getUser')) hits.push('auth.getUser');
  if (content.includes('auth.getSession')) hits.push('auth.getSession');
  if (content.includes('cookies()')) hits.push('cookies()');
  if (hits.length) supabaseUsage.push({ file: f.replace(/\\/g, '/'), hits });
}

// 5. Env variables
const envVars = new Set();
for (const f of allFiles) {
  if (!f.endsWith('.ts') && !f.endsWith('.tsx') && !f.endsWith('.js') && !f.endsWith('.mjs')) continue;
  const content = fs.readFileSync(f, 'utf8');
  const matches = content.matchAll(/process\.env\.([A-Z0-9_]+)/g);
  for (const m of matches) envVars.add(m[1]);
}

// 6. Zod Schemas
const zodUsage = [];
for (const f of allFiles) {
  if (!f.endsWith('.ts') && !f.endsWith('.tsx')) continue;
  const content = fs.readFileSync(f, 'utf8');
  if (content.includes('z.object') || content.includes('z.string') || content.includes('z.any')) {
    zodUsage.push(f.replace(/\\/g, '/'));
  }
}

// 7. Components reading IDs
const idReaders = [];
for (const f of allFiles) {
  if (!f.replace(/\\/g, '/').startsWith('src/app') && !f.replace(/\\/g, '/').startsWith('src/components')) continue;
  const content = fs.readFileSync(f, 'utf8');
  if (
    content.includes('workspace_id') ||
    content.includes('workspaceId') ||
    content.includes('lead_id') ||
    content.includes('post_id') ||
    content.includes('postId')
  ) {
    idReaders.push(f.replace(/\\/g, '/'));
  }
}

// Output summary as JSON
const result = {
  sqlFiles,
  apiRoutes: apiRoutes.map((f) => f.replace(/\\/g, '/')),
  serverActions: serverActions.map((f) => f.replace(/\\/g, '/')),
  supabaseUsage,
  envVars: Array.from(envVars).sort(),
  zodUsage,
  idReaders,
};

fs.writeFileSync('scripts/inventory_result.json', JSON.stringify(result, null, 2));
console.log('Inventory saved to scripts/inventory_result.json');
console.log(`Summary: ${sqlFiles.length} SQL, ${apiRoutes.length} API routes, ${serverActions.length} Server Actions, ${supabaseUsage.length} Supabase files, ${envVars.size} Env vars.`);
