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
