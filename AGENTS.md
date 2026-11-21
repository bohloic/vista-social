# PulseSocial — Guide Agent & Règles d'Architecture

Plateforme SaaS B2B de Community Management, Social Selling & Facturation Mobile Money (Afrique de l'Ouest / XOF).

## 1. Principes d'Architecture & Sécurité
- **Auth & Session** : Cookie HttpOnly `pulsesocial_session` signé HMAC-SHA256 (Web Crypto à l'Edge) + Supabase Auth.
- **Défense en profondeur** : `requireUser` + `requireWorkspaceRole` sur 100 % des routes `/api/*` protégées. Dériver toujours `workspace_id` de la session (anti-BOLA/IDOR).
- **Base de données & RLS** : RLS obligatoire sur toutes les tables via `supabase/migrations/`. Chiffrement AES-256-GCM des tokens sociaux au repos.
- **Paiements** : Webhooks Mobile Money & Paystack avec validation HMAC `timingSafeEqual`.
- **Copilote IA (Gemini 2.0 Flash)** : Clé injectée via header `x-goog-api-key` (jamais d'URL param), validation Zod stricte des sorties.

## 2. PWA & Optimisations Mobiles
- **Service Worker (`public/sw.js`)** :
  - `NetworkFirst` avec fallback `/offline.html` pour la navigation.
  - `NetworkOnly` pour `/api/*`, mutations et RSC (`_next/data`, `*.rsc`).
  - `CacheFirst` pour les assets statiques hashés (`/_next/static/*`).
- **Responsive Strict** : 320px à 1440px+, zéro débordement horizontal, zones tactiles ≥ 44×44px, safe-area insets.
- **Ressources & Raccourcis** : `Alt + M` (Microphone / Vocal), `Alt + P` (Nouveau Post), `Alt + K` (Recherche).

## 3. Commandes de Validation (CI / Pré-Déploiement)
```bash
npm run check:secrets   # Contrôle fuite de secrets (.env / clés)
npm test                # 43 tests unitaires et d'intégration
npm run test:security   # 16 tests de sécurité RLS & API
npx tsc --noEmit        # Vérification TypeScript stricte
npm run build           # Compilation de production Next.js
```

## 4. Règle Anti-Gaspillage de Tokens
- Ne jamais lire `node_modules/`, `pnpm-lock.yaml`, `.next/` ni les fichiers générés.
- Utiliser des recherches ciblées (`grep`, `find`) et des lectures partielles de lignes.
- Privilégier les exécutions groupées et des rapports de synthèse concis.
