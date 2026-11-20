# PulseSocial - Plateforme Professionnelle de Community Management & Monétisation

Reconstruction complète et autonome de l'ensemble des fonctionnalités de gestion de réseaux sociaux dans [`d:\tutoReact\mon-CM`](file:///d:/tutoReact/mon-CM), intégrant l'IA **Google Gemini 2.0 Flash**, **Next.js 16 (App Router)**, **TypeScript**, **Tailwind CSS**, **Recharts**, **Supabase (PostgreSQL)** et un système de monétisation multi-devises avec **Mobile Money (Orange Money, MTN MoMo, Wave, Moov)** en Francs CFA (XOF), EUR (€) et USD ($).

---

## 🌟 Modules Métier PulseSocial

### 1. 🧙‍♂️ Assistant d'Installation Super-Admin (`/setup`)
* Détection automatique au premier lancement (`checkAppInitialized()`).
* Création d'un compte Super-Admin unique avec **Passe Illimité Gratuit à Vie** (`is_lifetime_free: true`).
* Initialisation de l'espace de travail et configuration de base en 3 étapes avec Dark Glassmorphism.

### 2. 📱 Monétisation & Abonnements Mobile Money (`/billing`)
* Passerelle multi-devises automatique : **FCFA (XOF)** pour la Côte d'Ivoire et l'UEMOA, **Euros (€)** et **Dollars ($)**.
* Paiements intégrés : **Orange Money**, **MTN MoMo**, **Wave**, **Moov Money** et Cartes Bancaires.
* Forfaits Créateur (15 000 FCFA/mois), Agence Pro (45 000 FCFA/mois) et Illimité.

### 3. 📅 Planificateur & Calendrier Éditorial (`/publish`)
* Calendrier interactif mensuel et vue file d'attente synchronisés en direct avec la table PostgreSQL `posts` de Supabase.
* Compositeur Multi-Réseaux avec calcul automatique des limites de caractères (X: 280, LinkedIn: 3000, IG: 2200).
* Premier commentaire automatique pour hashtags (Instagram / LinkedIn).
* Simulateur d'aperçu fidèle pour Instagram, X, LinkedIn, TikTok et Facebook.

### 4. 📥 Boîte de Réception Sociale Unifiée (`/inbox`)
* Centralisation des messages directs (DMs), commentaires et mentions de tous les comptes connectés.
* Étiquetage automatique des sentiments (*Positif*, *Neutre*, *Négatif*).
* **Réponses Intelligentes IA Gemini** : Génération instantanée de propositions de réponses adaptées à insérer en un clic.

### 5. 🔗 Pulse Pages - Constructeur de Link-in-Bio (`/pulse-pages` & `/p/[slug]`)
* Éditeur visuel de micro-pages d'atterrissage avec simulateur smartphone interactif en direct.
* Thèmes exclusifs (*Violet Nebula*, *Obsidian Pure*, *Emerald Aurora*, *Sunset Magenta*).
* Route publique haute conversion disponible sur [`/p/[slug]`](file:///d:/tutoReact/mon-CM/src/app/p/[slug]/page.tsx).

### 6. 👂 Social Listening & Veille Concurrentielle (`/listening`)
* Surveillance en temps réel des mentions de marque et hashtags.
* Détection proactive des signaux faibles et analyse de sentiments.

### 7. ⭐ Gestion des Avis Clients (`/reviews`)
* Centralisation des avis (Google Business, Trustpilot, Facebook).
* Assistant IA Gemini pour formuler des réponses professionnelles et valorisantes.

### 8. ⚙️ Paramètres & Tokens Développeurs (`/settings`)
* Saisie et stockage des tokens officiels d'API (Meta Graph Access Token, X Bearer Token, LinkedIn OAuth, TikTok API).
* Gestion des membres d'équipe et contrôle de la santé du cluster Supabase.

---

## 🛠️ Stack Technique

* **Framework** : Next.js 16.4.5 (App Router, Turbopack) & React 19
* **Langage** : TypeScript 5 strict
* **Styles** : Tailwind CSS v4 & Lucide Icons (Dark Glassmorphism)
* **Graphiques** : Recharts 3
* **Validation des Schémas** : Zod 3
* **IA Générative** : Google Gemini API (`gemini-2.0-flash`)
* **Base de données** : PostgreSQL via Supabase (avec politiques de sécurité Row-Level Security RLS)
* **Monétisation** : Passerelle Mobile Money (Orange, MTN, Wave, Moov)

---

## 🚀 Démarrage & Tests

```bash
# Lancer le serveur de développement
pnpm dev

# Lancer la suite de tests automatisés
pnpm test
```
