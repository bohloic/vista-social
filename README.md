# Vista Social CM - Plateforme Unifiée de Community Management

Reconstruction complète et autonome de l'ensemble des fonctionnalités de **[Vista Social](https://vistasocial.com)** dans [`d:\tutoReact\mon-CM`](file:///d:/tutoReact/mon-CM), intégrant l'IA **Google Gemini**, **Next.js 16 (App Router)**, **TypeScript**, **Tailwind CSS**, **Recharts** et **Supabase (PostgreSQL)**.

---

## 🌟 Modules Métier Implémentés

### 1. 📅 Planificateur & Calendrier Éditorial (`/publish`)
* **Calendrier interactif** : Vue mensuelle et vue file d'attente avec indicateurs de statut (*Programmé*, *Publié*, *Brouillon*).
* **Compositeur Multi-Réseaux** :
  * Sélection simultanée des réseaux cibles (Instagram, LinkedIn, X, TikTok, Facebook).
  * Compteur de caractères dynamique adapté par réseau (X: 280, LinkedIn: 3000, IG: 2200).
  * Premier commentaire automatique pour hashtags (Instagram / LinkedIn).
  * Sélection de formats : Post standard, Reel, Story, Carrousel.
* **Simulateur d'Aperçu Pixel-Perfect** : Rendu fidèle de l'interface mobile pour chaque réseau social.

### 2. 📥 Boîte de Réception Sociale Unifiée (`/inbox`)
* Centralisation des messages directs (DMs), commentaires et mentions de tous les comptes connectés.
* Étiquetage automatique des sentiments (*Positif*, *Neutre*, *Négatif*).
* **Réponses Intelligentes IA Gemini** : Génération instantanée de 3 propositions de réponses adaptées à insérer en un clic.

### 3. 📊 Analyses & Rapports Consolidés (`/analytics`)
* Suivi de la portée, des impressions globales et du taux d'engagement moyen.
* Courbes d'évolution de l'audience et répartition des interactions par plateforme (graphiques Recharts).
* Classement des meilleures publications par résonance d'audience.
* Export de rapports PDF / synthèses de performance.

### 4. 👂 Social Listening & Veille Concurrentielle (`/listening`)
* Surveillance en temps réel des mentions de marque (`@StudioNovaHQ`, `#StudioNova`).
* Jauge de sentiment globale (82% Positif) et détection proactive des signaux faibles.
* Flux direct des mentions avec liens d'accès aux publications sources.

### 5. ⭐ Gestion des Avis Clients (`/reviews`)
* Centralisation des avis (Google Business, Yelp, Trustpilot, Facebook).
* Filtres par note (1 à 5 étoiles) et indicateur de taux de réponse.
* Rédacteur IA Gemini pour formuler des réponses professionnelles, courtoises et optimisées SEO.

### 6. 🔗 Vista Page - Constructeur de Link-in-Bio (`/vista-pages` & `/p/[slug]`)
* Éditeur visuel de micro-pages d'atterrissage avec simulateur smartphone en direct.
* Gestion des blocs de liens, bannières et icônes sociales.
* Thèmes personnalisables (*Violet Aurora*, *Midnight Slate*, *Emerald Lush*, *Sunset Rose*).
* Route publique haute conversion disponible sur [`/p/studionova`](file:///d:/tutoReact/mon-CM/src/app/p/[slug]/page.tsx).

### 7. ⚙️ Gestion des Comptes & Équipe (`/settings`)
* Gestion des 5 réseaux connectés avec statut de synchronisation API.
* Gestion des membres d'équipe (Admin, Créatif, Approbateur Client).
* Supervision de la connexion API Gemini 2.0 Flash et de la base Supabase.

---

## 🚀 Démarrage Rapide

### 1. Lancer le serveur de développement
```bash
pnpm dev
```
Ouvrez ensuite [http://localhost:3000](http://localhost:3000) dans votre navigateur.

### 2. Déployer le schéma dans Supabase
Le fichier [`supabase_schema.sql`](file:///d:/tutoReact/mon-CM/supabase_schema.sql) contient toutes les tables, index et contraintes PostgreSQL (Workspaces, Posts, Inbox, Analytics, Reviews, Vista Pages).
Copiez-collez son contenu dans l'éditeur SQL de votre projet Supabase :
👉 [azhboxpmkrosvykmxzct.supabase.co](https://azhboxpmkrosvykmxzct.supabase.co)

### 3. Exécuter les tests de conformité
```bash
node --test src/tests/domain.test.mjs
```

---

## 🛠️ Stack Technique

* **Framework** : Next.js 16.4.5 (App Router, Turbopack) & React 19
* **Langage** : TypeScript 5 strict
* **Styles** : Tailwind CSS v4 & Lucide Icons
* **Graphiques** : Recharts 3
* **Validation des Schémas** : Zod 3
* **IA Générative** : Google Gemini API (clé utilisateur configurée)
* **Base de données** : PostgreSQL via Supabase

