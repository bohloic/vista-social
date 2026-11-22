# PulseSocial — Guide Complet des Tests Manuels & Protocole QA (v2.0)

> **Document de référence pour les tests manuels, la recette fonctionnelle (UAT) et la validation de sécurité RBAC / Multi-Tenant.**

---

## 🌐 1. Environnements & Pré-requis

| Environnement | URL | Usage |
| :--- | :--- | :--- |
| **Production (Vercel)** | [https://vista-social-app.vercel.app](https://vista-social-app.vercel.app) | Recette finale & validation en conditions réelles |
| **Local (Dev)** | `http://localhost:3000` | Tests de développement et débugging rapide |
| **Sonde Healthcheck** | `/api/health` | Diagnostic connectivité Supabase & Copilote Gemini |

### Commandes de Validation Automatisées (Avant toute session de test)
```bash
npm run check:secrets   # Contrôle fuite de secrets (.env / clés) - 100% CONFORME requis
npm test                # 43 tests unitaires et contrats de schéma Zod
npm run test:security   # 16 tests de sécurité RLS & isolation Anti-BOLA
npx tsc --noEmit        # Vérification TypeScript stricte (0 erreur)
npm run build           # Compilation de production Next.js
```

---

## 👥 2. Matrice des Rôles & Niveaux d'Accès (RBAC)

| Rôle | Périmètre d'Action Principal | Droits d'Écriture & Validation | Facturation & Membres |
| :--- | :--- | :--- | :--- |
| **`super_admin`** | Accès universel multi-workspaces, configuration système | Total sur tous les workspaces | Gestion globale |
| **`admin`** | Propriétaire du workspace, configuration des réseaux | Création, publication directe, suppression | Inviter des membres, abonnements Mobile Money |
| **`manager`** | Responsable éditorial, Social Selling & CRM | Planification, approbation de posts, gestion CRM/Inbox | Consultation membres & facturation (sans résiliation) |
| **`editor`** | Rédacteur de contenu, graphiste flyer | Rédaction de brouillons, génération IA, création de flyers | Aucun accès aux réglages sensibles |
| **`client`** | Donneur d'ordre / Marque partenaire | Consultation du calendrier, validation/rejet des posts | Aucun accès aux paramètres ni facturation |

---

## 📋 3. Checklist de Test par Rôle Utilisateur

### A. Rôle : `super_admin` (Administrateur Global)
- [ ] **Accès multi-workspaces** :
  - Se connecter avec un compte super admin.
  - Vérifier la possibilité de basculer ou de consulter les publications de plusieurs workspaces sans erreur `403 FORBIDDEN_WORKSPACE`.
- [ ] **Protection de la page Setup (`/setup`)** :
  - Si le système est déjà configuré, la navigation vers `/setup` doit rediriger proprement vers le tableau de bord `/` ou `/login`.
- [ ] **Attribution de rôles sensibles (`/settings` > Équipe)** :
  - Vérifier que seul le `super_admin` a le pouvoir de promouvoir un utilisateur au rôle `super_admin`.
- [ ] **Sonde d'intégrité système (`/api/health`)** :
  - Vérifier que la réponse JSON affiche `{"status":"healthy","supabase":{"status":"connected"}}` avec une latence < 100ms.

---

### B. Rôle : `admin` (Propriétaire de Workspace / Agence)
- [ ] **Connexion des Comptes Réseaux Sociaux (`/settings` > Onglet Réseaux)** :
  - [ ] Connecter un compte Instagram, Facebook, LinkedIn ou Twitter/X.
  - [ ] **Vérification de sécurité (F12 > Network)** : Vérifier que l'API `GET /api/social/connect` ne retourne **JAMAIS** les tokens `access_token` ou `refresh_token` en clair (chiffrement AES-256-GCM au repos).
- [ ] **Gestion de l’Équipe (`/settings` > Onglet Équipe)** :
  - [ ] Inviter un nouveau collaborateur avec le rôle `manager`, `editor` ou `client`.
  - [ ] Tenter d’attribuer le rôle `super_admin` : vérifier le rejet par l'API avec une erreur `403 FORBIDDEN`.
- [ ] **Facturation & Mobile Money Afrique de l'Ouest (`/billing`)** :
  - [ ] Sélectionner un forfait (Starter, Pro, Agence) en FCFA (XOF).
  - [ ] Initier un paiement Mobile Money (Orange Money, MTN MoMo, Wave, Moov) ou carte via Paystack.
  - [ ] Vérifier la bonne conversion monétaire et l'affichage des montants en FCFA.
- [ ] **Publication Directe (`/publish`)** :
  - [ ] Créer une publication et l'enregistrer avec le statut `published`.

---

### C. Rôle : `manager` (Responsable CM & Social Selling)
- [ ] **Planification & Calendrier (`/publish`)** :
  - [ ] Créer un post avec programmation à date et heure futures.
  - [ ] Vérifier l'apparition du post dans la vue Calendrier et la liste des publications.
  - [ ] Reprogrammer un post par glisser-déposer ou édition de date.
  - [ ] Valider / approuver un post soumis par un éditeur (`status: 'approved'`).
- [ ] **Boîte de Réception & Radar d'Intention (`/inbox`)** :
  - [ ] Consulter les messages entrants de test.
  - [ ] Cliquer sur **« Réponse Intelligente IA »** et vérifier la pertinence de la proposition formulée en français professionnel.
  - [ ] Qualifier un contact en prospect commercial (bouton de conversion vers le CRM).
- [ ] **Pipeline Commercial & Mini-CRM (`/crm`)** :
  - [ ] Vérifier l'affichage en colonnes Kanban (*Nouveau, Chaud, Devis envoyé, Gagné, Perdu*).
  - [ ] Glisser un prospect d'une colonne à une autre et vérifier la persistance après rechargement.
  - [ ] Éditer la valeur estimée d'une opportunité en FCFA (ex: `150 000 FCFA`).
- [ ] **Contrôle d'accès négatif** :
  - [ ] Tenter d'accéder aux actions de résiliation d'abonnement ou de suppression du workspace (options absentes ou bloquées avec 403).

---

### D. Rôle : `editor` (Créateur de Contenu & Graphiste)
- [ ] **Raccourci Clavier Global (`Alt + P`)** :
  - [ ] Depuis n'importe quelle page de l'application, appuyer sur `Alt + P` : le compositeur de post doit s'ouvrir immédiatement.
- [ ] **Générateur de Légendes IA (`ComposerModal`)** :
  - [ ] Saisir un sujet (ex: *« Promo week-end burger gastronomique »*).
  - [ ] Choisir le ton (*Engageant*, *Storytelling*, *Expert B2B*).
  - [ ] Générer et vérifier la structure AIDA : accroche magnétique, corps aéré, hashtags pertinents et CTA orienté message privé (DM).
- [ ] **Studio d'Affiches & Flyers Hybride HD (Architecture 2026)** :
  - [ ] Cliquer sur **« Générer Image IA HD »** dans le compositeur.
  - [ ] **Test Modèles Gratuits (0$ API)** :
    - Aller sur l'onglet *« Modèles Prêts & Gratuits (0$) »*.
    - Cliquer sur un preset (ex: *Menu Burger Gourmand*, *Collection Capsule Wax*, *Nuit Blanche Afrobeat*).
    - Vérifier le chargement instantané de l'image et des textes par défaut.
  - [ ] **Test Personnalisation en Temps Réel (0$ de surcoût)** :
    - Modifier le Badge Prix (ex: taper `8 500 FCFA`).
    - Modifier le Titre d'accroche (Headline) et les détails de l'offre.
    - Modifier le contact WhatsApp / Infoline (ex: `WhatsApp: +225 07 12 34 56`).
    - Changer le style d'habillage (*Bandeau Bas Dégradé*, *Bandeau Haut*, *Cartouche Glassmorphism*).
    - Sélectionner une couleur d'accent (Or `#F59E0B`, Rose `#EC4899`, Violet `#6366F1`, Émeraude `#10B981`, Rouge `#EF4444`).
    - **Vérifier que l'aperçu visuel s'actualise instantanément sans requête API payante**.
  - [ ] **Test Export & Fusion Canvas HTML5** :
    - Cliquer sur **« Télécharger HD »** : vérifier le téléchargement d'un fichier PNG net avec les textes parfaitement intégrés.
    - Cliquer sur **« Ajouter ce Flyer au Post »** : vérifier que l'image finale est insérée dans les médias du post.
- [ ] **Statut du post soumis** :
  - [ ] Enregistrer le post : son statut doit être `needs_approval` ou `draft` (en attente de validation par le manager ou client).

---

### E. Rôle : `client` (Marque Partenaire / Donneur d'Ordre)
- [ ] **Consultation & Transparence** :
  - [ ] Le client se connecte et accède à son tableau de bord épuré.
  - [ ] Consultation des publications prévues sur le calendrier (`/publish`).
  - [ ] Consultation des performances et graphiques (`/analytics`).
  - [ ] Consultation des avis clients Google et Facebook (`/reviews`).
- [ ] **Circuit de Validation des Publications** :
  - [ ] Ouvrir une publication au statut `needs_approval`.
  - [ ] Valider le post (**« Approuver »**) ou demander une correction (**« Demander modification »** avec commentaire).
- [ ] **Micro-Page Bio (`/pulse-pages` et lien public `/p/[slug]`)** :
  - [ ] Ouvrir l'URL publique de la page Bio sur smartphone : vérifier le responsive, les liens de contact et l'absence de FOUC (Flash of Unstyled Content).
- [ ] **Contrôle d'accès négatif strict (Sécurité)** :
  - [ ] Tenter de modifier un compte social, de changer un rôle ou d'accéder aux paramètres de facturation : l'accès doit être strictement refusé (`403 FORBIDDEN_ROLE`).

---

## 🛡️ 4. Scénarios d'Attaque & Sécurité (Anti-BOLA / IDOR)

### Scénario 1 : Tentative de fuite de données Cross-Tenant (Workspace A vs Workspace B)
1. Ouvrir une session avec l'**Utilisateur A** (rattaché au Workspace A).
2. Ouvrir une session privée avec l'**Utilisateur B** (rattaché au Workspace B).
3. Depuis la console du navigateur de B, exécuter :
   ```javascript
   fetch('/api/posts?workspace_id=<ID_DU_WORKSPACE_A>')
     .then(res => res.json())
     .then(console.log);
   ```
4. **Résultat attendu** : Réponse HTTP **`403 FORBIDDEN_WORKSPACE`** ou **`403 ROLE_INSUFFICIENT`**. Aucun post du Workspace A ne doit être visible par l'Utilisateur B.

### Scénario 2 : Falsification d'identifiant dans les mutations (Anti-IDOR)
1. En tant qu'Utilisateur B, tenter de supprimer ou modifier un post appartenant au Workspace A via `DELETE /api/posts?id=<POST_ID_A>`.
2. **Résultat attendu** : Réponse HTTP **`403 FORBIDDEN`** ou **`404 NOT FOUND`**.

### Scénario 3 : Fuzzing de payload et Injection de champs non déclarés (Anti-Mass Assignment)
1. Tenter un appel `POST /api/posts` avec des champs non déclarés (ex: `isAdmin: true`, `role: 'super_admin'`).
2. **Résultat attendu** : Rejet strict par Zod avec HTTP **`422 UNPROCESSABLE_ENTITY`** (`extra fields stripped or forbidden`).

---

## 📱 5. PWA, Mobile & Ergonomie Réseau Faible Débit

- [ ] **Installation PWA** :
  - Ouvrir le site sur Chrome Android ou Safari iOS.
  - Vérifier la présence de l'invite « Ajouter à l'écran d'accueil ».
  - Vérifier le nom de l'application : **`PulseSocial`** (< 30 caractères, conforme Webhint).
- [ ] **Mode Hors-ligne (Offline First)** :
  - Dans Chrome DevTools (F12 > Network), passer en mode **Offline**.
  - Recharger la page : la page de secours `/offline.html` doit s'afficher sans écran de plantage navigateur.
- [ ] **Zéro Débordement Horizontal (Responsive Strict 320px - 1440px)** :
  - Tester sur émulateur mobile (iPhone SE 375px et Galaxy S20 360px).
  - Aucun élément ne doit déborder horizontalement.
- [ ] **Cibles Tactiles Conformes** :
  - Tous les boutons d'action clés mesurent au minimum **44 × 44 pixels**.
- [ ] **Raccourci Vocal Microphone (`Alt + M`)** :
  - Appuyer sur `Alt + M` pour vérifier l'affichage du guide de raccourci ou de l'écoute vocale du copilote.

---

## 📝 6. Fiche de Suivi des Sessions de Recette

| Date | Version / Commit | Testeur | Rôle Testé | Résultat Global | Anomalies Détectées |
| :--- | :--- | :--- | :--- | :--- | :--- |
|      |                  |         | Super Admin | `[ ] Pass  [ ] Fail` |                     |
|      |                  |         | Admin       | `[ ] Pass  [ ] Fail` |                     |
|      |                  |         | Manager     | `[ ] Pass  [ ] Fail` |                     |
|      |                  |         | Éditeur     | `[ ] Pass  [ ] Fail` |                     |
|      |                  |         | Client      | `[ ] Pass  [ ] Fail` |                     |
