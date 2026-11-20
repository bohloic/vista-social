import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

console.log('🔍 Exécution du scanner de secrets et d\'intégrité d\'environnement...');

let errorsCount = 0;

// 1. Check for committed or tracked .env files
try {
  const trackedFiles = execSync('git ls-files', { encoding: 'utf-8' }).split('\n');
  const forbiddenEnvFiles = trackedFiles.filter((f) => {
    const base = path.basename(f.trim());
    return base.startsWith('.env') && base !== '.env.example';
  });

  if (forbiddenEnvFiles.length > 0) {
    console.error('❌ ERREUR: Fichiers .env sensibles suivis dans Git :', forbiddenEnvFiles);
    errorsCount++;
  } else {
    console.log('✅ Aucun fichier .env sensible tracké par Git.');
  }
} catch (err) {
  console.warn('⚠️ Impossible d\'exécuter git ls-files :', err.message);
}

// 2. Scan tracked source code for dangerous hardcoded secrets or patterns
const DANGEROUS_PATTERNS = [
  /-----BEGIN (?:RSA |EC )?PRIVATE KEY-----/,
  /sk_live_[0-9a-zA-Z]{24,}/,
  /NEXT_PUBLIC_.*(?:SERVICE_ROLE|SECRET_KEY|PRIVATE|ENCRYPTION)/i,
];

function scanDirectory(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (['node_modules', '.next', '.git', 'dist', 'coverage'].includes(entry.name)) continue;
      scanDirectory(fullPath);
    } else if (entry.isFile()) {
      if (!/\.(tsx?|jsx?|mjs|json|sql|env)$/.test(entry.name)) continue;
      // Skip test mocks or inventory scripts
      if (fullPath.includes('tests') || fullPath.includes('check-secrets.mjs')) continue;

      const content = fs.readFileSync(fullPath, 'utf-8');
      for (const pattern of DANGEROUS_PATTERNS) {
        if (pattern.test(content)) {
          console.error(`❌ ERREUR: Motif de secret suspect détecté dans ${fullPath} (${pattern})`);
          errorsCount++;
        }
      }
    }
  }
}

scanDirectory(path.join(process.cwd(), 'src'));

if (errorsCount > 0) {
  console.error(`\n❌ Échec du contrôle de sécurité : ${errorsCount} violation(s) détectée(s).`);
  process.exit(1);
} else {
  console.log('✅ Contrôle des secrets : 100% CONFORME, aucune fuite détectée.\n');
  process.exit(0);
}
