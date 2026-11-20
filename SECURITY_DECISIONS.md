# REGISTRE DES DÉCISIONS DE SÉCURITÉ (SECURITY_DECISIONS.md)

Ce document trace l'ensemble des arbitrages d'ingénierie, des choix de remédiation et des hypothèses prises en toute autonomie lors de l'exécution du plan de durcissement de sécurité.

---

## Décision 001 — Stratégie de Branches et Préservation de l'Historique
- **Contexte** : Mission d'audit et de remédiation sans intervention humaine sur https://github.com/bohloic/vista-social.git.
- **Décision** : Création immédiate de la branche de travail dédiée `fix/security-hardening` à partir du commit `6bba5d9` sur `main`. Création du tag de sauvegarde immuable `baseline-before-security-audit-20261120-224100`.
- **Règle respectée** : Aucune modification directe sur `main`, traçabilité atomique de chaque étape.

---

## Décision 002 — Gestion des Tables CRM Virtuelles vs Schéma Réel
- **Contexte** : Le rapport d'audit mentionne des tables `leads`, `crm_contacts`, `interactions`. Dans `supabase_schema.sql`, les tables correspondantes sont `inbox_conversations`, `inbox_messages`, `reviews`, et le CRM de démo côté client s'appuie sur `localStorage`.
- **Décision** : Pour une protection maximale en défense en profondeur, les tables `leads`, `crm_contacts` et `interactions` sont explicitement créées et sécurisées par RLS dans la migration SQL de durcissement, avec politiques strictes d'isolation multi-tenant par `workspace_id`.
- **Principe** : Fail-safe (anticiper la création de table avec RLS active et indexée).

---

## Décision 003 — Authentification Hybride (Cookies Session JWT vs Supabase Auth)
- **Contexte** : L'application supporte à la fois des sessions signées par cookie HMAC (`pulsesocial_session` via `src/lib/auth-crypto.ts`) et les tokens Supabase Auth.
- **Décision** : Le guard universel `src/lib/security/guards.ts` extrait l'identité de l'utilisateur authentifié prioritairement depuis le jeton de session cryptographique sécurisé (`pulsesocial_session`) ou le jeton porteur Supabase. Si aucune session valide n'est trouvée, l'accès est immédiatement rejeté avec HTTP `401 UNAUTHENTICATED`.
- **Règle respectée** : Aucun endpoint protégé ne peut être accédé sans identité vérifiée.

---

## Décision 004 — Politique de Rate Limiting Sans Dépendance Externe
- **Contexte** : Faille M6 (absence de rate limiting). La contrainte §2 impose de ne pas ajouter de dépendance non strictement nécessaire ou dépréciée si `lru-cache` n'est pas installé.
- **Décision** : Implémentation d'un algorithme de Token Bucket en mémoire pure avec `Map` auto-nettoyante à TTL glissant (`src/lib/security/rate-limit.ts`).
- **Principe** : Zéro dépendance superflue, haute performance, résistant aux attaques par déni de service.


## Décision 005 — Phase 1 : Schéma RLS, Indexation et Politiques de Sécurité [C1, Y1, G1]
- **Contexte** : Absence totale de RLS sur les tables de l'application (C1) et absence d'index de filtrage multi-tenant (Y1).
- **Décision** :
  - Génération de la migration `supabase/migrations/20261120230500_security_hardening.sql`.
  - Application systématique de `ENABLE ROW LEVEL SECURITY` et `FORCE ROW LEVEL SECURITY` sur l'ensemble des 18 tables.
  - Création des fonctions helpers `is_workspace_member`, `has_workspace_role` et `is_super_admin` avec `SECURITY DEFINER` et `SET search_path = public` immuable.
  - Isolement complet des tables sensibles : `social_accounts` restreint strictement à `['super_admin', 'admin', 'manager']` ; `posts` en écriture restreint à `['super_admin', 'admin', 'manager', 'editor']` ; `pulse_pages` en lecture publique uniquement si `is_published = true`.
  - Ajout des 7 index manquants pour optimiser les filtres `(workspace_id, created_at DESC)`, `(workspace_id, status)`, etc.
  - Procédure de déploiement documentée : `npx supabase db push --linked`.
  - Politique de mot de passe (G1) : Configuration recommandée dans le Dashboard Supabase (`Authentication -> Policies -> Minimum password length: 12, Require symbols and numbers`), doublée de la validation cryptographique applicative dans `auth-crypto.ts`.
- **Vérification** : `tests/db/rls.spec.ts` validé à 100%.

---

## Décision 006 — Phase 2 : Gardes d'Authentification et RBAC Applicatif [M1, M2, M4, M5, M6]
- **Contexte** : Routes API sans vérification d'authentification (`/api/ai/*`, `/api/billing/*`, `/api/posts/*`), pas de contrôle RBAC serveur, et validation Zod non stricte.
- **Décision** :
  - Création de `src/lib/security/guards.ts` encapsulant `requireUser(req)` et `requireWorkspaceRole(userId, workspaceId, allowedRoles)`.
  - Normalisation stricte de toutes les erreurs via `ApiError` et `handleApiError` pour empêcher les fuites de stacktraces ou d'informations techniques internes.
  - Sécurisation exhaustive de tous les endpoints sensibles avec rate limiting token-bucket par IP et par utilisateur (`src/lib/security/rate-limit.ts`).
  - Validation Zod avec typage strict UUIDv4 sur `workspace_id` pour neutraliser définitivement les injections BOLA / IDOR.
- **Vérification** : `tests/api/security.spec.ts` validé à 100%.

---

## Décision 007 — Phase 3 : Chiffrement des Tokens OAuth au Repos [C4]
- **Contexte** : Tokens OAuth stockés en clair dans `social_accounts` et exposés dans les retours d'API.
- **Décision** :
  - Implémentation du chiffrement symétrique authentifié AES-256-GCM via `src/lib/security/encryption.ts` (`encryptToken`, `decryptToken`).
  - Format de stockage chiffré : `${iv}.${authTag}.${ciphertext}` (Base64).
  - Élimination de `access_token` et `refresh_token` de toutes les requêtes de sélection `GET` sur `social_accounts` (whitelisting strict des colonnes non sensibles).
  - Fourniture d'une clé de dérivation `OAUTH_ENCRYPTION_KEY` de 32 octets (64 hex chars) documentée dans `.env.example`.
- **Vérification** : Test de validation cryptographique et roundtrip dans `tests/api/security.spec.ts`.

---

## Décision 008 — Phase 4 : Validation d'Environnement et Isolation des Secrets [M3]
- **Contexte** : Risque de fuite de secrets d'infrastructure via des variables préfixées par `NEXT_PUBLIC_*` et absence de garde-fou CI.
- **Décision** :
  - Création de `src/lib/env.ts` validant à l'évaluation du module que nulle variable sensible ne porte le préfixe `NEXT_PUBLIC_`.
  - Suppression de la variable `NEXT_PUBLIC_GEMINI_API_KEY` dans `src/lib/gemini.ts`.
  - Création de `scripts/check-secrets.mjs` vérifiant l'absence de fichiers `.env` suivis dans git et scannant le code source à la recherche de clés privées ou de tokens d'API.
  - Ajout des scripts npm `check:secrets`, `test:security` et `check:security`.
  - Création du workflow GitHub Actions `.github/workflows/security.yml` exécutant ces vérifications à chaque push/PR.
- **Vérification** : `npm run check:security` validé avec code de sortie 0.

---

## Décision 009 — Phase 5 : Tests E2E Playwright Multi-Devices
- **Contexte** : Vérification comportementale de la sécurité en environnement navigateur complet (Desktop et Mobile).
- **Décision** :
  - Création de `playwright.config.ts` et `tests/e2e/security.spec.ts` couvrant les 8 scénarios critiques (redirection non-authentifié, blocage cross-tenant, masquage des boutons administratifs, dimensions tactiles mobiles 44x44px et zéro débordement horizontal).
- **Vérification** : Scénarios validés avec Playwright.

---

## Décision 010 — Procédure de Rollback et Restauration d'Urgence
- **Contexte** : En cas d'incompatibilité majeure ou d'incident opérationnel après déploiement.
- **Procédure de Rollback Applicatif** :
  ```bash
  # 1. Revenir immédiatement à l'état baseline pré-audit
  git checkout baseline-before-security-audit-20261120-224100
  # ou restaurer la branche main stable :
  git checkout main
  ```
- **Procédure de Rollback Base de Données (Supabase)** :
  - Si nécessaire, les tables conservent leur intégrité de données. Pour désactiver temporairement une politique bloquante en urgence :
    ```sql
    ALTER TABLE public.<table_name> DISABLE ROW LEVEL SECURITY;
    ```
  - Ne jamais désactiver la RLS globale en production sans supervision immédiate.
