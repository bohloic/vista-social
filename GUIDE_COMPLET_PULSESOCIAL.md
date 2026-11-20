# 📖 Guide Complet de la Plateforme PulseSocial (Social Selling 3-en-1 + PulseAI Vocal)

**URL de production** : [https://vista-social-app.vercel.app/](https://vista-social-app.vercel.app/)  
**Dépôt GitHub** : `https://github.com/bohloic/vista-social.git`  
**Stack Technique** : Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, Supabase PostgreSQL, Google Gemini 2.0 Flash, Composio OAuth 2.0 (v3), Paystack XOF.

---

## 1. Vue d'ensemble des 11 Modules du Site

| Module | Route | Rôle & Fonctionnalités Clés |
| :--- | :--- | :--- |
| **Tableau de bord & Cockpit 15 min** | `/` | Routine quotidienne en 3 étapes chronométrées (5 min Studio CM → 5 min Radar → 5 min Encaissement CRM), KPIs réels vs Projection IA. |
| **Chat IA & Copilote Vocal (PulseAI)** | `/chat` + *Bouton flottant partout* | Assistant exécutif Gemini **concis et peu gourmand en tokens**. **Voix bidirectionnelle** (Micro `fr-FR` + Synthèse vocale), **upload jusqu'à 10 fichiers** (images, vidéos, PDF, docs), exécution directe d'actions (créer un post, ajouter un prospect CRM, générer un lien Paystack, naviguer). |
| **Studio CM & Planificateur** | `/publish` | Calendrier mensuel, file d'attente CRUD (Éditer/Supprimer), **Générateur de Calendrier IA par secteur**, Compositeur Multi-Réseaux (tons B2B/B2C/Conversationnel, générateur de visuels HD, import fichiers locaux). |
| **Boîte de réception & Radar IA** | `/inbox` | Détection automatique d'intention d'achat (Score IA 0-100 %), filtres B2B/B2C/Chauds, **Fenêtre 24h Meta/WhatsApp**, bouton 1-clic **« Ouvrir et coller dans LinkedIn »**, insertion directe de liens **Paystack** et **Cal.com**. |
| **Pipeline de Vente (Mini-CRM)** | `/crm` | Tableau Kanban à 4 colonnes (*Nouveau contact* → *Discussion en cours* → *Devis / Lien envoyé* → *Payé ✅*), KPIs financiers en FCFA, guichet Paystack en direct qui passe automatiquement le prospect en *Payé ✅*. |
| **Analytics & Rapports PDF** | `/analytics` | Courbes cross-canal, filtres réactifs **7 / 30 / 90 Jours**, export **Imprimer / PDF** propre (`@media print`). |
| **Listening & Veille** | `/listening` | Veille de mots-clés sectoriels persistés et analyse de sentiment. |
| **Avis Clients** | `/reviews` | Centralisation Google Business / Facebook / Trustpilot, filtres `5★` à `1★`, réponses officielles générées par Gemini. |
| **Pulse Pages (Link-in-Bio)** | `/pulse-pages` | Constructeur de micro-page publique (`/p/[slug]`), upload fichier avatar en Base64, sauvegarde Supabase + brouillon session. |
| **Abonnements & Paiement Paystack** | `/billing` | Plans en **FCFA (XOF)**, EUR, USD avec ouverture directe du guichet **Paystack Checkout** (Wave, Orange Money, MTN MoMo, Visa/Mastercard). |
| **Paramètres, OAuth 2.0 & Équipe** | `/settings` | Connexion 1-clic par **fenêtre pop-up OAuth 2.0 externe (Composio v3)**, gestion d'équipe & rôles, Tokens Manuels (Composio, Paystack, Cal.com, Meta, WhatsApp), diagnostic de latence Supabase & IA. |

---

## 2. Comment utiliser l'Assistant Vocal & Exécutif PulseAI

PulseAI est accessible **partout sur le site** via le bouton flottant **« PulseAI Vocal »** en bas à droite, ou en plein écran via l'onglet **`Chat IA (PulseAI)`** (`/chat`).

- **Parler à l'IA** : Cliquez sur l'icône **Micro** (`fr-FR`), dictez votre demande, puis envoyez.
- **Écouter la voix de l'IA** : L'icône **Haut-parleur** en haut à droite active/désactive la lecture vocale automatique en français. Vous pouvez aussi cliquer sur *Écouter* sous chaque message.
- **Envoyer jusqu'à 10 fichiers** : Cliquez sur l'icône **Trombone** pour joindre jusqu'à 10 images, vidéos ou documents (PDF, CSV, TXT, MD). Gemini Vision analyse directement vos images et textes.
- **Exemples de commandes exécutées à votre place** :
  - *« Crée un post LinkedIn sur notre nouvelle promo Mobile Money »* → Programme le post dans Supabase.
  - *« Ajoute un prospect CRM de 150000 FCFA »* → Ajoute la carte dans le Kanban `/crm`.
  - *« Génère un lien Paystack de 25000 FCFA »* → Initialise une vraie transaction Paystack et affiche le bouton d'ouverture.
  - *« Ouvre le CRM »* / *« Va sur les paramètres »* → Navigue immédiatement.

---

## 3. État des Outils Externes & Plan de Configuration Finale

| Outil | État actuel | Action requise pour 100 % Live Production |
| :--- | :---: | :--- |
| **Supabase PostgreSQL** | ✅ Connecté (`28 ms`) | Vérifier que `supabase_schema.sql` est exécuté dans SQL Editor Supabase et que `SUPABASE_SERVICE_ROLE_KEY` est sur Vercel. |
| **Paystack (Wave / Orange / MTN / Carte)** | ✅ **Clé `sk_test_` valide en `XOF`** | Ajouter `PAYSTACK_SECRET_KEY` dans *Vercel → Settings → Environment Variables* (puis basculer vers `sk_live_...` au lancement commercial). |
| **Google Gemini AI** | ✅ Clé configurée | Vérifier que `GEMINI_API_KEY` (clé Google AI Studio `AIzaSy...`) est active dans Vercel pour les rendus IA temps réel. |
| **Composio OAuth 2.0 (v3)** | ⚠️ Clé `ck_...` rejetée (`401`) | Aller sur [app.composio.dev/settings](https://app.composio.dev/settings), copier une nouvelle clé API complète, la coller dans `.env.local` + Vercel (ou dans `/settings` → `Tokens Manuels`). |
| **Google Sign-In (« Continuer avec Google »)** | ⚠️ `external.google: false` sur Supabase | 1) Créer un OAuth Client ID sur [console.cloud.google.com](https://console.cloud.google.com/apis/credentials) avec URI de redirection `https://ljpslbcouvyyzzvxxfme.supabase.co/auth/v1/callback`. 2) Activer *Google* dans *Supabase → Authentication → Providers* et coller Client ID + Secret. *(En attendant, le SSO Pop-up intégré fonctionne déjà sans erreur).* |
| **Cal.com (Prise de RDV)** | ⚙️ Configurable dans `/settings` | Créer votre lien gratuit sur [cal.com](https://cal.com) (ex. `https://cal.com/votre-nom/15min`) et le coller dans **`/settings` → `Tokens Manuels` → `Lien d'Agenda Cal.com`**. Il s'appliquera automatiquement dans `/inbox` et `/crm`. |

---

## 4. Conformité Légale & Sécurité
- **RGPD & ARTCI (Côte d'Ivoire — Loi n° 2013-450)** : Modales légales accessibles depuis le pied de page global, `/login` et `/billing`.
- **Anti-bannissement réseaux sociaux** : Respect strict de la fenêtre officielle de **24 heures Meta / WhatsApp Business Cloud API**, zéro scraping, et validation humaine 1-clic pour LinkedIn.
