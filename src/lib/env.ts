import { z } from 'zod';

const clientEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('NEXT_PUBLIC_SUPABASE_URL doit être une URL valide'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'NEXT_PUBLIC_SUPABASE_ANON_KEY requis'),
});

const serverEnvSchema = clientEnvSchema.extend({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'SUPABASE_SERVICE_ROLE_KEY requis sur le serveur').optional(),
  OAUTH_ENCRYPTION_KEY: z
    .string()
    .length(64, 'OAUTH_ENCRYPTION_KEY doit comporter exactement 64 caractères hexadécimaux (32 octets)')
    .regex(/^[0-9a-fA-F]+$/, 'OAUTH_ENCRYPTION_KEY doit être au format hexadécimal')
    .optional(),
  SESSION_SECRET: z.string().min(16).optional(),
  PAYSTACK_SECRET_KEY: z.string().startsWith('sk_').optional(),
  GEMINI_API_KEY: z.string().min(1).optional(),
  COMPOSIO_API_KEY: z.string().min(1).optional(),
});

/**
 * Validates that no sensitive secret keys are exposed under NEXT_PUBLIC_* prefixes.
 * Fails fast on application startup if a leak is detected.
 */
function assertNoSecretLeaks(): void {
  const forbiddenPatterns = [
    'SERVICE_ROLE',
    'PRIVATE_KEY',
    'SECRET_KEY',
    'OAUTH_ENCRYPTION',
    'SESSION_SECRET',
  ];

  for (const key of Object.keys(process.env)) {
    if (key.startsWith('NEXT_PUBLIC_')) {
      const upper = key.toUpperCase();
      for (const pattern of forbiddenPatterns) {
        if (upper.includes(pattern)) {
          throw new Error(
            `CRITICAL SECURITY FAULT: Variable sensible détectée sous préfixe public: ${key}. Supprimez ce préfixe immédiatement.`
          );
        }
      }
    }
  }
}

// Perform leak detection immediately upon module evaluation
assertNoSecretLeaks();

export const env = {
  get isServer() {
    return typeof window === 'undefined';
  },
  validate() {
    if (typeof window === 'undefined') {
      const parsed = serverEnvSchema.safeParse(process.env);
      if (!parsed.success) {
        console.warn('⚠️ Avertissement configuration environnement serveur :', parsed.error.format());
      }
      return parsed;
    } else {
      const parsed = clientEnvSchema.safeParse({
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      });
      if (!parsed.success) {
        console.error('❌ Erreur configuration client :', parsed.error.format());
      }
      return parsed;
    }
  },
};
