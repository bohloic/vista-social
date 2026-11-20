# SECURITY INVENTORY — VISTA-SOCIAL AUDIT BASELINE

- **Date d'inventaire** : 2026-11-20
- **Branche d'audit & durcissement** : `fix/security-hardening`
- **Tag de restauration baseline** : `baseline-before-security-audit-20261120-224100`
- **Statut Git initial** : `clean` (commit de référence `6bba5d9` sur `main`)

---

## 1. Schéma Supabase & Tables Détectées (`supabase_schema.sql`)

| Table PostgreSQL | RLS Actif Initial | Colonnes Critiques & Clés Étrangères | Faille Associée |
| :--- | :---: | :--- | :--- |
| `public.app_config` | ❌ NON | `key`, `value` (JSONB) | C1 |
| `public.workspaces` | ❌ NON | `id` (UUID), `name`, `slug`, `plan` | C1 |
| `public.user_profiles` | ❌ NON | `id` (UUID), `email`, `role`, `workspace_id`, `password_hash` | C1, M2 |
| `public.workspace_members` | ❌ NON | `workspace_id` (FK), `user_id` (FK), `role` | C1, M2 |
| `public.social_accounts` | ❌ NON | `workspace_id` (FK), `platform`, `access_token`, `refresh_token` | C1, C4 |
| `public.posts` | ❌ NON | `workspace_id` (FK), `content`, `status`, `scheduled_for` | C1, C2, C3 |
| `public.post_targets` | ❌ NON | `post_id` (FK), `social_account_id` (FK) | C1 |
| `public.inbox_conversations` | ❌ NON | `workspace_id` (FK), `social_account_id` (FK) | C1 |
| `public.inbox_messages` | ❌ NON | `conversation_id` (FK), `content` | C1 |
| `public.listening_queries` | ❌ NON | `workspace_id` (FK), `search_terms` | C1 |
| `public.listening_mentions` | ❌ NON | `workspace_id` (FK), `query_id` (FK) | C1 |
| `public.reviews` | ❌ NON | `workspace_id` (FK), `rating`, `review_text` | C1 |
| `public.pulse_pages` | ❌ NON | `workspace_id` (FK), `slug`, `theme_config`, `blocks` | C1 |
| `public.subscriptions` | ❌ NON | `workspace_id` (FK), `plan`, `amount`, `status` | C1 |
| `public.mobile_money_transactions` | ❌ NON | `workspace_id` (FK), `transaction_ref`, `phone_number`, `amount` | C1 |
| `public.leads` *(virtuel/CRM)* | ❌ NON | `workspace_id` (FK), `status`, `deal_value` | C1, Y1 |
| `public.crm_contacts` *(virtuel/CRM)* | ❌ NON | `workspace_id` (FK), `owner_id` (FK), `handle` | C1, Y1 |
| `public.interactions` *(virtuel/CRM)* | ❌ NON | `workspace_id` (FK), `created_at` | C1, Y1 |

---

## 2. Inventaire Exhaustif des Routes API (`src/app/api/**/route.ts`)

Total de **25 endpoints API** répertoriés :

1. `src/app/api/ai/copilot/route.ts` (POST) — Copilot conversationnel & actions
2. `src/app/api/ai/generate-caption/route.ts` (POST) — Génération IA de posts
3. `src/app/api/ai/generate-media/route.ts` (POST) — Génération d'images IA
4. `src/app/api/ai/smart-reply/route.ts` (POST) — Réponses intelligentes IA
5. `src/app/api/auth/callback/route.ts` (GET) — Callback OAuth Supabase
6. `src/app/api/auth/google/route.ts` (POST) — OAuth Google Composio/Supabase
7. `src/app/api/auth/google/verify/route.ts` (POST) — Vérification Google Connect
8. `src/app/api/auth/login/route.ts` (POST) — Connexion locale
9. `src/app/api/auth/logout/route.ts` (POST) — Déconnexion session
10. `src/app/api/auth/me/route.ts` (GET) — Profil utilisateur courant
11. `src/app/api/auth/register/route.ts` (POST) — Inscription nouvel utilisateur
12. `src/app/api/auth/reset-password/route.ts` (POST) — Mot de passe oublié
13. `src/app/api/billing/mobile-money/checkout/route.ts` (POST) — Init paiement Mobile Money
14. `src/app/api/billing/paystack/initialize/route.ts` (POST) — Init paiement Paystack
15. `src/app/api/billing/paystack/verify/route.ts` (GET/POST) — Callback/Vérification Paystack
16. `src/app/api/billing/plans/route.ts` (GET) — Liste des offres et forfaits
17. `src/app/api/health/route.ts` (GET) — Diagnostics et santé du système
18. `src/app/api/posts/route.ts` (GET, POST, PUT, DELETE) — CRUD des publications
19. `src/app/api/pulse-pages/route.ts` (GET, POST, PUT, DELETE) — CRUD des Bio-Pages
20. `src/app/api/setup/route.ts` (GET, POST) — Installation Super-Admin
21. `src/app/api/social/connect/route.ts` (GET, POST, DELETE) — Gestion des comptes sociaux
22. `src/app/api/social/oauth/callback/route.ts` (GET/POST) — Callback OAuth réseaux
23. `src/app/api/social/oauth/initiate/route.ts` (POST) — Initialisation OAuth Composio
24. `src/app/api/team/members/route.ts` (GET, POST, DELETE) — Gestion de l'équipe
25. `src/app/api/upload/route.ts` (POST) — Upload de fichiers média

---

## 3. Server Actions (`'use server'`)

- **0 Server Action** déclarée dans le code applicatif client/serveur (Next.js App Router utilise actuellement des API Route Handlers REST).

---

## 4. Occurrences de Clients & Méthodes Supabase

Fichiers utilisant `getAdminSupabase()` (`service_role`) :
- `src/lib/supabase.ts` (définition de `getAdminSupabase`)
- `src/app/api/posts/route.ts` (C2, C3)
- `src/app/api/social/connect/route.ts` (C4)
- `src/app/api/social/oauth/callback/route.ts` (C4)
- `src/app/api/team/members/route.ts`
- `src/app/api/pulse-pages/route.ts`
- `src/app/api/billing/paystack/verify/route.ts`
- `src/app/api/billing/mobile-money/checkout/route.ts`
- `src/app/api/auth/register/route.ts`
- `src/app/api/auth/login/route.ts`
- `src/app/api/auth/reset-password/route.ts`
- `src/app/api/auth/me/route.ts`
- `src/app/api/auth/google/verify/route.ts`
- `src/app/api/auth/callback/route.ts`
- `src/app/api/setup/route.ts`
- `src/app/api/ai/copilot/route.ts`

---

## 5. Variables d'Environnement Détectées (`process.env.*`)

- `ADMIN_EMAILS`
- `COMPOSIO_API_KEY`
- `FACEBOOK_CLIENT_ID`
- `GEMINI_API_KEY`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_OAUTH_ENABLED`
- `JWT_SECRET`
- `LINKEDIN_CLIENT_ID`
- `META_APP_ID`
- `NEXT_PUBLIC_APP_NAME`
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_GEMINI_API_KEY`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `OAUTH_ENCRYPTION_KEY` *(à introduire pour C4)*
- `PAYSTACK_SECRET_KEY`
- `PINTEREST_APP_ID`
- `SUPABASE_SERVICE_ROLE_KEY`
- `TIKTOK_CLIENT_KEY`
- `TWITTER_CLIENT_ID`

---

## 6. Utilisation des Schémas Zod

- Zod 3.24.2 est utilisé dans la plupart des routes API, mais certains schémas manquaient de contraintes strictes (`workspace_id` en simple `z.string()`, `scheduled_for` sans format datetime ISO, absence de validation anti-mass assignment).

---

## 7. Composants Lisant des Identifiants (`workspace_id`, etc.)

- `src/app/settings/page.tsx` (`pulsesocial_active_workspace`)
- `src/app/login/page.tsx` (`pulsesocial_active_workspace`)
- `src/app/p/[slug]/page.tsx` (`params.slug`)
- `src/app/oauth-popup/page.tsx` (`searchParams.get('workspaceId')`)
- `src/components/PulseAICopilotPanel.tsx` (`workspaceName`)

---

## 8. Résultat de l'Audit Dépendances (`pnpm audit --prod`)

- **1 vulnérabilité High détectée** sur `zod < 4.6.6` (Advisory GHSA-mrhx-c7xc-m3w5: *Zod can exhaust memory while validating oversized constrained collections*).
- Zod v3 est la version majeure actuelle stable de l'écosystème Next.js. Une protection additionnelle sur la taille des payloads et la profondeur JSON dans le middleware et les parseurs sera mise en place pour neutraliser ce vecteur de déni de service.
