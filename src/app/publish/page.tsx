'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { CalendarView } from '@/components/CalendarView';
import { ComposerModal } from '@/components/ComposerModal';
import { Post, SocialAccount, SocialPlatform } from '@/lib/types';
import { FormattedDate } from '@/components/FormattedDate';
import {
  Calendar,
  List,
  Filter,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileEdit,
  Trash2,
  Eye,
  Check,
  Sparkles,
  Wand2,
  Building2,
  Target,
  X,
  Loader2,
} from 'lucide-react';

interface SectorTemplate {
  title: string;
  hook: string;
  content: string;
  cta: string;
  platforms: SocialPlatform[];
}

const SECTOR_DATA: Record<string, SectorTemplate[]> = {
  ecommerce: [
    {
      title: 'Focus Produit Vedette',
      hook: '🔥 Ce détail fait toute la différence dans votre quotidien...',
      content: 'Découvrez notre nouvelle collection conçue avec soin pour sublimer votre style sans compromis sur le confort.\n\n✨ Matières nobles certifiées\n⚡ Finitions haute précision\n🚚 Livraison express 24h & Paiement Mobile Money sécurisé.',
      cta: '👉 Cliquez sur le lien en bio ou envoyez "PRODUIT" en DM pour recevoir votre code promo -15% !',
      platforms: ['instagram', 'facebook', 'tiktok'],
    },
    {
      title: 'Preuve Sociale & Avis Client',
      hook: '⭐ "J\'ai commandé lundi, reçu mardi à Abidjan !" - Marc K.',
      content: 'Rien ne nous fait plus plaisir que vos retours d\'expérience. Merci à nos plus de 1 200 clients qui nous font confiance chaque mois.\n\nNos stocks partent très vite sur les séries les plus demandées.',
      cta: '📲 Commandez directement via WhatsApp en cliquant sur notre Pulse Page !',
      platforms: ['instagram', 'facebook'],
    },
    {
      title: 'Offre Limitée / Urgence',
      hook: '⏳ Dernières 48 heures pour profiter de notre pack exclusif.',
      content: 'Ne passez pas à côté : le pack duo comprend votre article favori + un accessoire offert.\n\nOffre valable jusqu\'à épuisement strict des stocks.',
      cta: '🛒 Réservez votre commande en 1 clic via le lien dans notre bio.',
      platforms: ['facebook', 'instagram', 'tiktok'],
    },
    {
      title: 'Coulisses & Création',
      hook: '👀 Comment nous sélectionnons nos arrivages chaque semaine...',
      content: 'Chaque pièce passe par 3 étapes de contrôle qualité rigoureux avant d\'arriver entre vos mains.\n\nLa satisfaction client est notre priorité absolue.',
      cta: '💬 Quelle couleur préférez-vous ? Dites-le nous en commentaire !',
      platforms: ['tiktok', 'instagram'],
    },
    {
      title: 'Astuce d\'Entretien',
      hook: '💡 3 erreurs courantes qui abîment vos articles (et comment les éviter)',
      content: '1. Ne jamais laver à température trop élevée\n2. Éviter le séchage direct au soleil intense\n3. Utiliser un savon doux adapté\n\nGardez vos pièces comme neuves pendant des années.',
      cta: '🔖 Enregistrez ce post pour ne pas l\'oublier !',
      platforms: ['instagram', 'facebook'],
    },
    {
      title: 'Unboxing & Vidéo Démo',
      hook: '📦 Déballage en direct de notre bestseller !',
      content: 'Regardez la texture et la robustesse en conditions réelles. Un design pensé pour durer.',
      cta: '👉 Lien d\'achat direct disponible sur notre profil.',
      platforms: ['tiktok', 'instagram'],
    },
    {
      title: 'FAQ Express',
      hook: '❓ "Est-ce que vous livrez à l\'intérieur du pays ?"',
      content: 'Oui ! Nous expédions partout sous 24 à 48h via nos partenaires logistiques agréés. Paiement à la livraison ou par Wave / Orange Money disponible.',
      cta: '📲 Écrivez-nous en message privé pour toute question !',
      platforms: ['facebook', 'instagram'],
    },
  ],
  restaurant: [
    {
      title: 'Plat Signature du Jour',
      hook: '🍽️ Le goût authentique qui réveille vos papilles à midi !',
      content: 'Préparé chaque matin avec des ingrédients frais du terroir par notre chef passionné.\n\nUn équilibre parfait de saveurs et d\'épices raffinées.',
      cta: '📍 Réservez votre table ou commandez à emporter via le lien WhatsApp en bio.',
      platforms: ['instagram', 'facebook'],
    },
    {
      title: 'Menu Déjeuner Express',
      hook: '⏱️ Pause déjeuner pressée mais envie de bien manger ?',
      content: 'Notre formule midi express est servie en moins de 15 minutes chrono :\nEntrée + Plat du jour + Boisson fraîche maison.',
      cta: '👉 Commandez dès 11h sur WhatsApp pour être livré à votre bureau à midi pile !',
      platforms: ['facebook', 'instagram'],
    },
    {
      title: 'Ambiance Soirée & Cocktail',
      hook: '🍹 Vendredi soir : décompressez autour de nos cocktails créations.',
      content: 'Ambiance feutrée, musique acoustique et planches gourmandes à partager entre collègues ou amis.',
      cta: '📞 Réservation fortement conseillée au +225 07 00 00 00 00.',
      platforms: ['instagram', 'facebook'],
    },
    {
      title: 'Les Coulisses du Chef',
      hook: '👨‍🍳 Le secret de notre marinade qui mijote depuis 6h du matin...',
      content: 'Aucun compromis sur la qualité : nous travaillons exclusivement avec des producteurs locaux sélectionnés.',
      cta: '❤️ Laissez un cœur si vous avez déjà l\'eau à la bouche !',
      platforms: ['tiktok', 'instagram'],
    },
    {
      title: 'Offre Spéciale Weekend',
      hook: '🎉 Ce dimanche : Brunch gourmand à volonté !',
      content: 'Buffet salé, viennoiseries chaudes, grillades et desserts artisanaux de 11h à 16h.',
      cta: '🎟️ Places limitées, réservez votre table en DM.',
      platforms: ['instagram', 'facebook'],
    },
    {
      title: 'Le Choix des Gourmets',
      hook: '🔥 Team Grillades ou Team Sauce Traditionnelle ?',
      content: 'Chaque semaine nos habitués débattent ! Les deux sont préparés avec nos sauces secrètes.',
      cta: '💬 Votez en commentaire et tentez de gagner votre plat offert ce vendredi !',
      platforms: ['facebook', 'tiktok'],
    },
    {
      title: 'Service Traiteur & Événements',
      hook: '🎂 Un anniversaire ou un séminaire d\'entreprise à organiser ?',
      content: 'Notre équipe traiteur s\'occupe de tout : cocktail dînatoire, buffet chaud et service impeccable.',
      cta: '📧 Demandez un devis personnalisé en 2h via notre lien en bio.',
      platforms: ['facebook', 'linkedin'],
    },
  ],
  b2b: [
    {
      title: 'Étude de Cas & ROI',
      hook: '📈 Comment notre client a généré +42% de leads qualifiés en 30 jours.',
      content: 'Voici la méthode exacte que nous avons déployée :\n1. Simplification de l\'entonnoir de conversion\n2. Optimisation des temps de réponse (< 15 min)\n3. Relance multi-canal automatisée.',
      cta: '📩 Commentez "AUDIT" pour recevoir notre grille d\'évaluation gratuite.',
      platforms: ['linkedin', 'twitter'],
    },
    {
      title: 'Erreur B2B Fréquente',
      hook: '⚠️ 90% des entreprises perdent des prospects faute de suivi dans les 24h.',
      content: 'Dans le B2B moderne, la réactivité est le premier facteur de conversion. Plus vous attendez, plus votre prospect se tourne vers un concurrent.',
      cta: '👉 Réservez un appel stratégique de 15 min via le lien sur mon profil.',
      platforms: ['linkedin', 'twitter'],
    },
    {
      title: 'Framework & Méthode',
      hook: '🧠 Le framework en 3 étapes pour structurer votre prospection commerciale :',
      content: '1. Identifier l\'intention d\'achat réelle\n2. Qualifier le budget et l\'urgence\n3. Clôturer avec un lien de paiement ou un devis clair sans friction.',
      cta: '💾 Enregistrez ce post et partagez-le à votre équipe commerciale !',
      platforms: ['linkedin'],
    },
    {
      title: 'Tendance Marché',
      hook: '🚀 L\'automatisation intelligente ne remplace pas l\'humain : elle décuple sa force.',
      content: 'Les meilleurs directeurs commerciaux utilisent les outils IA pour éliminer la saisie manuelle et se concentrer sur la négociation à haute valeur.',
      cta: '💬 Quel est votre plus grand défi commercial ce trimestre ?',
      platforms: ['linkedin', 'twitter'],
    },
    {
      title: 'Coulisses & Expertise',
      hook: '🔍 Ce que nous avons appris après avoir analysé plus de 50 000 conversations de vente...',
      content: 'La personnalisation du premier message triple le taux de réponse par rapport à un template générique.',
      cta: '👉 Suivez notre page pour recevoir nos analyses hebdomadaires.',
      platforms: ['linkedin'],
    },
    {
      title: 'Témoignage Dirigeant',
      hook: '💼 "Nous avons gagné 10h de travail par semaine dès le premier mois."',
      content: 'Retrouvez le témoignage complet de la directrice générale de Nexus Solutions sur l\'adoption de nos outils.',
      cta: '🔗 Lien de l\'interview complète disponible dans le premier commentaire.',
      platforms: ['linkedin'],
    },
    {
      title: 'Offre Accompagnement',
      hook: '🎯 Prêt à accélérer vos ventes ce mois-ci ?',
      content: 'Nous ouvrons 3 nouveaux créneaux d\'accompagnement sur-mesure pour les entreprises en croissance.',
      cta: '📩 Envoyez-moi un message privé pour échanger sur vos objectifs.',
      platforms: ['linkedin', 'twitter'],
    },
  ],
  realestate: [
    {
      title: 'Bien d\'Exception à la Vente',
      hook: '🏡 Villa contemporaine 5 pièces avec piscine à Cocody Danga.',
      content: 'Espaces lumineux, finitions haut de gamme, suite parentale avec dressing, cuisine équipée et groupe électrogène.\n\nQuartier calme, sécurisé 24/7.',
      cta: '📲 Contactez notre agent au +225 07 00 00 00 00 ou cliquez sur le lien en bio pour la visite virtuelle.',
      platforms: ['facebook', 'instagram'],
    },
    {
      title: 'Conseil Investisseur',
      hook: '💰 Où investir en 2026 pour obtenir un rendement locatif supérieur à 9% ?',
      content: 'Analyse des zones à fort potentiel de valorisation : infrastructures en développement, proximité des axes majeurs et demande locative soutenue.',
      cta: '📩 Envoyez "INVESTIR" en DM pour recevoir notre guide d\'investissement gratuit.',
      platforms: ['linkedin', 'facebook'],
    },
    {
      title: 'Appartement Clé en Main',
      hook: '🔑 Superbe 3 pièces meublé disponible immédiatement.',
      content: 'Idéal pour cadre d\'entreprise ou investissement Airbnb. Rentabilité démontrée.',
      cta: '👉 Visites sur rendez-vous uniquement : écrivez-nous en privé.',
      platforms: ['instagram', 'facebook'],
    },
    {
      title: 'Visite Vidéo / Drone',
      hook: '🎥 Vue aérienne : découvrez ce domaine d\'exception sous tous les angles.',
      content: 'Un cadre de vie verdoyant à 10 minutes du centre d\'affaires.',
      cta: '💬 Donnez votre avis sur cette vue en commentaire !',
      platforms: ['tiktok', 'instagram'],
    },
    {
      title: 'Guide Juridique & Foncier',
      hook: '📜 ACD, Titre foncier : comment sécuriser votre achat sans mauvaise surprise ?',
      content: 'Les 4 vérifications incontournables avant de verser le moindre acompte.',
      cta: '🔖 Enregistrez ce post pour vos futurs projets immobiliers.',
      platforms: ['facebook', 'linkedin'],
    },
    {
      title: 'Opportunité Terrain',
      hook: '📍 Terrain viabilisé de 600 m² avec arrêté d\'approbation.',
      content: 'Emplacement stratégique en pleine zone résidentielle en plein essor.',
      cta: '📞 Contact rapide via WhatsApp au lien en description.',
      platforms: ['facebook'],
    },
    {
      title: 'Nouveau Partenariat',
      hook: '🤝 Obtenez votre prêt immobilier plus rapidement grâce à nos banques partenaires.',
      content: 'Nous vous accompagnons dans le montage complet de votre dossier financier.',
      cta: '📩 Prenez rendez-vous avec notre courtier partenaire en DM.',
      platforms: ['linkedin', 'facebook'],
    },
  ],
  beauty: [
    {
      title: 'Résultat Avant / Après',
      hook: '✨ Transformation éclat : regardez ce résultat après seulement 3 semaines !',
      content: 'Notre sérum naturel enrichi au beurre de karité bio et acide hyaluronique redonne lumière et fermeté à votre peau sans agresser.',
      cta: '👉 Commandez le vôtre avec livraison à domicile via le lien en bio !',
      platforms: ['instagram', 'tiktok', 'facebook'],
    },
    {
      title: 'Routine Matin 3 Étapes',
      hook: '🌸 5 minutes chrono pour une peau lumineuse toute la journée :',
      content: '1. Nettoyage doux à l\'eau tiède\n2. Brume hydratante florale\n3. Protection solaire invisible indispensable.',
      cta: '💬 Quelle est votre étape préférée ? Partagez en commentaire !',
      platforms: ['tiktok', 'instagram'],
    },
    {
      title: 'Avis Clientes & Story',
      hook: '💖 "Mes tâches ont visiblement diminué !" - Témoignage d\'Aïcha',
      content: 'La formule a été testée et approuvée sous contrôle dermatologique.',
      cta: '📲 Envoyez "BEAUTE" en DM pour bénéficier d\'un diagnostic personnalisé gratuit.',
      platforms: ['instagram', 'facebook'],
    },
    {
      title: 'Pack Promo Weekend',
      hook: '🎁 Le coffret soin complet à prix tout doux ce weekend seulement.',
      content: 'Comprend : gommage exfoliant + masque réparateur + serviette microfibre offerte.',
      cta: '🛒 Lien direct de commande sécurisée par Mobile Money sur notre profil !',
      platforms: ['facebook', 'instagram'],
    },
    {
      title: 'Mythe vs Réalité Soin',
      hook: '❌ "Les peaux grasses n\'ont pas besoin d\'hydratation." VRAI ou FAUX ?',
      content: 'FAUX ! Une peau mal hydratée surproduit du sébum pour se protéger. Choisissez toujours une texture gel légère non comédogène.',
      cta: '🔖 Partagez cette astuce à une amie qui en a besoin !',
      platforms: ['instagram', 'tiktok'],
    },
    {
      title: 'Ingrédients Clés',
      hook: '🌿 Pourquoi nous avons banni les sulfates et les parabènes de tous nos soins.',
      content: 'Respect de la peau, respect de l\'environnement, formulations éco-certifiées.',
      cta: '👉 Retrouvez la composition détaillée sur notre boutique en ligne.',
      platforms: ['instagram', 'facebook'],
    },
    {
      title: 'Tutoriel Coiffure / Maquillage',
      hook: '💄 Réussir un teint parfait sans effet plâtre : le tuto rapide.',
      content: 'Moins de matière, plus d\'estompage : découvrez la gestuelle des professionnels.',
      cta: '❤️ Double-cliquez si le rendu vous plaît !',
      platforms: ['tiktok', 'instagram'],
    },
  ],
  coaching: [
    {
      title: 'Leçon d\'Impact & Mindset',
      hook: '💡 La compétence n°1 qui sépare ceux qui stagnent de ceux qui réussissent.',
      content: 'Ce n\'est pas le talent brut, c\'est la constance dans l\'exécution quotidienne.\n\nCeux qui gagnent ne sont pas plus intelligents : ils ont un système structuré.',
      cta: '👉 Partagez cette citation en story si elle vous inspire aujourd\'hui !',
      platforms: ['linkedin', 'instagram'],
    },
    {
      title: 'Étude de Cas Apprenant',
      hook: '🚀 D\'employé hésitant à entrepreneur rentable en 90 jours : le parcours de Sonia.',
      content: 'Sans réseau au départ, elle a appliqué le module prospection pas à pas pour signer ses 3 premiers clients corporate.',
      cta: '📩 Commentez "FORMATION" pour recevoir le programme complet en avant-première.',
      platforms: ['linkedin', 'facebook'],
    },
    {
      title: 'Webinar Gratuit / Masterclass',
      hook: '🎙️ Masterclass en direct ce jeudi à 19h00 GMT :',
      content: '"Comment doubler ses revenus de prestation de services sans sacrifier son temps personnel."\n\nSession de questions/réponses en direct.',
      cta: '🎟️ Inscription gratuite obligatoire via le lien dans la bio (places limitées).',
      platforms: ['linkedin', 'facebook', 'twitter'],
    },
    {
      title: 'Faux Débat / Prise de Position',
      hook: '🛑 Arrêtez de passer 4 heures par jour sur les réseaux sans stratégie claire.',
      content: '30 minutes ciblées avec un plan d\'action rapportent 10 fois plus qu\'une présence passive et désorganisée.',
      cta: '💬 Combien de temps consacrez-vous à votre prospection par semaine ?',
      platforms: ['linkedin', 'twitter'],
    },
    {
      title: 'Ressource Téléchargeable',
      hook: '🎁 Cadeau de la semaine : téléchargez notre Template de Planification Mensuelle.',
      content: 'Le même document que nous utilisons en interne pour piloter nos lancements.',
      cta: '📲 Lien de téléchargement instantané en bio.',
      platforms: ['linkedin', 'instagram'],
    },
    {
      title: 'Conseil Carrière',
      hook: '💼 3 questions à se poser avant de négocier son prochain contrat.',
      content: '1. Quelle valeur quantifiable ai-je apportée ?\n2. Quel est le coût pour me remplacer ?\n3. Quelle nouvelle responsabilité suis-je prêt à assumer ?',
      cta: '🔖 Enregistrez ce post pour votre prochain entretien !',
      platforms: ['linkedin'],
    },
    {
      title: 'Session Diagnostic Offerte',
      hook: '🎯 Bloqué dans votre développement professionnel ?',
      content: 'J\'offre cette semaine 5 créneaux d\'audit stratégique de 20 minutes pour faire le point sur vos blocages.',
      cta: '📩 Envoyez-moi "DIAGNOSTIC" par message privé pour réserver votre créneau.',
      platforms: ['linkedin', 'instagram'],
    },
  ],
};

export default function PublishPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [platformFilter, setPlatformFilter] = useState<string>('all');
  const [composerOpen, setComposerOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Calendar AI Generator Modal State
  const [calendarGeneratorOpen, setCalendarGeneratorOpen] = useState(false);
  const [selectedSector, setSelectedSector] = useState<string>('ecommerce');
  const [selectedObjective, setSelectedObjective] = useState<string>('sales');
  const [selectedFrequency, setSelectedFrequency] = useState<number>(3);
  const [isGeneratingCalendar, setIsGeneratingCalendar] = useState(false);

  const fetchPostsAndAccounts = async () => {
    try {
      const [postsRes, accsRes] = await Promise.all([
        fetch('/api/posts'),
        fetch('/api/social/connect'),
      ]);

      if (postsRes.ok) {
        const data = await postsRes.json();
        if (data.posts) setPosts(data.posts);
      }

      if (accsRes.ok) {
        const accsData = await accsRes.json();
        if (accsData.accounts) setAccounts(accsData.accounts);
      }
    } catch (err) {
      console.warn('Error loading posts/accounts:', err);
    }
  };

  useEffect(() => {
    fetchPostsAndAccounts();

    const handleUpdate = () => fetchPostsAndAccounts();
    window.addEventListener('posts-updated', handleUpdate);
    return () => window.removeEventListener('posts-updated', handleUpdate);
  }, []);

  const handleSavePost = async (newPost: Omit<Post, 'id' | 'created_at'>) => {
    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPost),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Erreur lors de la programmation de la publication');
      }
      const data = await res.json();
      setPosts((prev) => [data.post, ...prev]);
      setActionMessage('✓ Publication créée et programmée avec succès !');
      setTimeout(() => setActionMessage(null), 3500);
      return data.post;
    } catch (err) {
      console.error('Failed to save post', err);
      throw err;
    }
  };

  const handleUpdatePost = async (updatedPost: Post) => {
    try {
      const res = await fetch('/api/posts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedPost),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Erreur lors de la mise à jour de la publication');
      }

      const data = await res.json();
      const postResult = data.post || updatedPost;
      setPosts((prev) => prev.map((p) => (p.id === updatedPost.id ? postResult : p)));
      setEditingPost(null);
      if (selectedPost?.id === updatedPost.id) {
        setSelectedPost(postResult);
      }
      setActionMessage('✓ Publication modifiée avec succès dans Supabase !');
      setTimeout(() => setActionMessage(null), 3500);
      window.dispatchEvent(new Event('posts-updated'));
      return postResult;
    } catch (err) {
      console.error('Failed to update post:', err);
      throw err;
    }
  };

  const handleGenerateSectorCalendar = async () => {
    setIsGeneratingCalendar(true);
    try {
      const templates = (SECTOR_DATA[selectedSector] || SECTOR_DATA['ecommerce']).slice(0, selectedFrequency);
      const newPostsCreated: Post[] = [];

      for (let i = 0; i < templates.length; i++) {
        const t = templates[i];
        const sched = new Date();
        sched.setDate(sched.getDate() + (i + 1));
        sched.setHours(10, 0, 0, 0);

        const newPost = {
          content: `${t.hook}\n\n${t.content}\n\n${t.cta}`,
          media_urls: [],
          platforms: t.platforms,
          target_accounts: [],
          status: 'scheduled' as const,
          scheduled_at: sched.toISOString(),
        };

        try {
          const res = await fetch('/api/posts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newPost),
          });
          if (res.ok) {
            const data = await res.json();
            if (data.post) newPostsCreated.push(data.post);
          }
        } catch (e) {
          console.warn('Could not post to api', e);
        }
      }

      if (newPostsCreated.length > 0) {
        setPosts((prev) => [...newPostsCreated, ...prev]);
        setActionMessage(`✓ Calendrier IA généré : ${newPostsCreated.length} publications Social Selling ajoutées !`);
      } else {
        setActionMessage(`✓ Calendrier généré avec succès !`);
      }
      setTimeout(() => setActionMessage(null), 4500);
      window.dispatchEvent(new Event('posts-updated'));
      setCalendarGeneratorOpen(false);
    } catch (err) {
      console.error('Error generating calendar:', err);
      alert('Erreur lors de la génération du calendrier.');
    } finally {
      setIsGeneratingCalendar(false);
    }
  };

  const handleDeletePost = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer définitivement cette publication ?')) {
      return;
    }

    try {
      const res = await fetch(`/api/posts?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setPosts((prev) => prev.filter((p) => p.id !== id));
        if (selectedPost?.id === id) {
          setSelectedPost(null);
        }
        setActionMessage('✓ Publication supprimée de la base de données.');
        setTimeout(() => setActionMessage(null), 3500);
        window.dispatchEvent(new Event('posts-updated'));
      }
    } catch (err) {
      console.error('Failed to delete post:', err);
    }
  };

  const openEditModal = (post: Post) => {
    setSelectedPost(null);
    setEditingPost(post);
    setComposerOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return {
          label: 'Publié',
          className: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30',
        };
      case 'scheduled':
        return {
          label: 'Programmé',
          className: 'bg-violet-500/15 text-violet-300 border border-violet-500/30',
        };
      case 'draft':
        return {
          label: 'Brouillon',
          className: 'bg-slate-500/15 text-slate-300 border border-slate-500/30',
        };
      case 'failed':
        return {
          label: 'Échec',
          className: 'bg-rose-500/15 text-rose-300 border border-rose-500/30',
        };
      default:
        return {
          label: status,
          className: 'bg-slate-500/15 text-slate-300 border border-slate-500/30',
        };
    }
  };

  const filteredPosts = posts.filter((post) => {
    if (platformFilter === 'all') return true;
    const matchingAccounts = accounts.filter((a) => post.target_accounts?.includes(a.id));
    return matchingAccounts.some((a) => a.platform === platformFilter);
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-[#6366F1]" />
            Planificateur &amp; Calendrier Éditorial
          </h1>
          <p className="text-xs text-slate-600 font-medium">
            Organisez et automatisez votre calendrier de publication sur tous vos réseaux avec synchronisation Supabase.
          </p>
        </div>

        {/* View mode toggle & Create Button */}
        <div className="flex items-center gap-2">
          <div className="flex items-center p-1 bg-slate-900 border border-slate-800 rounded-xl shadow-xs">
            <button
              onClick={() => setViewMode('calendar')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${viewMode === 'calendar'
                ? 'bg-violet-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
                }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Calendrier</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${viewMode === 'list'
                ? 'bg-violet-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
                }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>File d&apos;attente</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setCalendarGeneratorOpen(true)}
            className="flex items-center gap-2 py-2 px-3.5 rounded-xl bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 hover:opacity-90 text-white text-xs font-bold shadow-lg shadow-violet-600/30 active:scale-95 transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>✨ Générateur de Calendrier IA</span>
          </button>

          <button
            onClick={() => {
              setEditingPost(null);
              setComposerOpen(true);
            }}
            className="flex items-center gap-2 py-2 px-4 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold shadow-lg shadow-violet-600/30 active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nouveau Post</span>
          </button>
        </div>
      </div>

      {/* Action Notification Alert */}
      {actionMessage && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Filter Bar (Harmonized Dark Theme) */}
      <div className="flex flex-wrap items-center gap-2 p-3 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-sm text-slate-100">
        <span className="text-xs font-semibold text-slate-400 flex items-center gap-1 pl-2">
          <Filter className="w-3.5 h-3.5 text-violet-400" /> Filtrer par réseau :
        </span>
        {['all', 'instagram', 'linkedin', 'twitter', 'tiktok', 'facebook'].map((plat) => (
          <button
            key={plat}
            onClick={() => setPlatformFilter(plat)}
            className={`px-3 py-1 rounded-xl text-xs font-medium capitalize transition-colors cursor-pointer ${platformFilter === plat
              ? 'bg-violet-600 text-white font-bold shadow-sm'
              : 'text-slate-400 bg-slate-800/80 hover:bg-slate-800 hover:text-white border border-slate-700/40'
              }`}
          >
            {plat === 'all' ? 'Tous les réseaux' : plat === 'twitter' ? 'X' : plat}
          </button>
        ))}
      </div>

      {/* Main Content: Calendar vs Queue List */}
      {viewMode === 'calendar' ? (
        <CalendarView
          posts={filteredPosts}
          accounts={accounts}
          onNewPostWithDate={() => {
            setEditingPost(null);
            setComposerOpen(true);
          }}
          onSelectPost={(post) => setSelectedPost(post)}
        />
      ) : (
        <div className="space-y-4">
          {filteredPosts.length === 0 ? (
            <div className="py-16 text-center pulse-card p-8 border-dashed border-slate-800 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-violet-500/10 text-violet-400 mx-auto flex items-center justify-center">
                <Calendar className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-white">File de publication vide</h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Vous n&apos;avez aucune publication planifiée avec ces critères. Commencez à planifier votre contenu multi-réseaux !
              </p>
              <button
                onClick={() => {
                  setEditingPost(null);
                  setComposerOpen(true);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs shadow-lg shadow-violet-600/30 transition-all hover:scale-105 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Créer une publication maintenant
              </button>
            </div>
          ) : (
            filteredPosts.map((post) => {
              const targetAccs = accounts.filter((a) =>
                post.target_accounts?.includes(a.id)
              );
              const statusInfo = getStatusBadge(post.status);

              return (
                <div
                  key={post.id}
                  className="pulse-card p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-slate-800 bg-slate-900/60"
                >
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    {post.media_urls.length > 0 ? (
                      <img
                        src={post.media_urls[0]}
                        alt="Media"
                        className="w-20 h-20 rounded-2xl object-cover shrink-0 border border-slate-800"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-2xl bg-slate-800 shrink-0 flex items-center justify-center text-xs text-slate-400 font-semibold border border-slate-700/50">
                        Texte seul
                      </div>
                    )}

                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-violet-400 inline-flex items-center gap-1" suppressHydrationWarning={true}>
                          <Clock className="w-3.5 h-3.5" />
                          <FormattedDate date={post.scheduled_for} formatType="full" />
                        </span>

                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${statusInfo.className}`}>
                          {statusInfo.label}
                        </span>

                        <div className="flex items-center gap-1 ml-auto">
                          {targetAccs.map((a) => (
                            <span
                              key={a.id}
                              className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 uppercase border border-slate-700/50"
                            >
                              {a.platform}
                            </span>
                          ))}
                        </div>
                      </div>

                      <p className="text-xs text-slate-100 leading-relaxed font-medium">
                        {post.content}
                      </p>

                      {post.first_comment && (
                        <p className="text-[10px] text-slate-400">
                          <strong className="text-slate-300">1er commentaire :</strong> {post.first_comment}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons: Preview, Edit, Delete */}
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <button
                      onClick={() => setSelectedPost(post)}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
                      title="Voir les détails"
                    >
                      <Eye className="w-3.5 h-3.5 text-violet-400" />
                      <span>Aperçu</span>
                    </button>
                    <button
                      onClick={() => openEditModal(post)}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-xl border border-violet-500/30 bg-violet-950/40 hover:bg-violet-900/60 text-violet-300 transition-colors cursor-pointer"
                      title="Modifier cette publication"
                    >
                      <FileEdit className="w-3.5 h-3.5" />
                      <span>Modifier</span>
                    </button>
                    <button
                      onClick={() => handleDeletePost(post.id)}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-xl border border-rose-500/30 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 transition-colors cursor-pointer"
                      title="Supprimer définitivement"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                      <span>Supprimer</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Selected Post Detail Modal */}
      {selectedPost && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-base text-white">
                Détails de la publication
              </h3>
              <button
                onClick={() => setSelectedPost(null)}
                className="text-slate-400 hover:text-white text-sm font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>
                  Statut :{' '}
                  <strong className={`font-bold px-2 py-0.5 rounded-full text-[10px] ${getStatusBadge(selectedPost.status).className}`}>
                    {getStatusBadge(selectedPost.status).label}
                  </strong>
                </span>
                <span suppressHydrationWarning>
                  Prévu pour : <strong className="text-white"><FormattedDate date={selectedPost.scheduled_for} formatType="datetime" /></strong>
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
                <p className="text-xs text-slate-100 leading-relaxed whitespace-pre-wrap font-medium">
                  {selectedPost.content}
                </p>
              </div>

              {selectedPost.first_comment && (
                <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800/80">
                  <p className="text-[11px] text-slate-400">
                    <strong className="text-slate-300">1er commentaire :</strong> {selectedPost.first_comment}
                  </p>
                </div>
              )}

              {selectedPost.media_urls.length > 0 && (
                <div className="rounded-xl overflow-hidden aspect-video border border-slate-800 bg-black">
                  <img src={selectedPost.media_urls[0]} alt="Media" className="w-full h-full object-cover" />
                </div>
              )}
            </div>

            {/* Modal Actions: Edit, Delete, Close */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              <button
                onClick={() => handleDeletePost(selectedPost.id)}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Supprimer</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => openEditModal(selectedPost)}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-violet-600 hover:bg-violet-500 text-white shadow-md transition-all cursor-pointer"
                >
                  <FileEdit className="w-3.5 h-3.5" />
                  <span>Modifier</span>
                </button>
                <button
                  onClick={() => setSelectedPost(null)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Calendar AI Generator Modal */}
      {calendarGeneratorOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in overflow-y-auto">
          <div className="w-full max-w-xl bg-slate-900 border border-violet-500/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col my-8">
            {/* Header */}
            <div className="p-6 bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center font-bold text-lg shadow-inner">
                  <Sparkles className="w-6 h-6 text-amber-300" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-black/30 px-2 py-0.5 rounded-full">
                    Social Selling Automatisé
                  </span>
                  <h3 className="text-base font-bold leading-tight mt-0.5">
                    Générateur de Calendrier Éditorial IA
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCalendarGeneratorOpen(false)}
                className="p-1 rounded-full bg-black/20 hover:bg-black/40 text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 text-xs text-slate-300">
              {/* Sector Selector */}
              <div className="space-y-2">
                <label className="font-bold text-white flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-violet-400" />
                  1. Choisissez votre Secteur d&apos;Activité :
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'ecommerce', label: 'E-Commerce & Vente', icon: '🛍️' },
                    { id: 'restaurant', label: 'Restauration & Food', icon: '🍽️' },
                    { id: 'b2b', label: 'B2B & Agence Web', icon: '💼' },
                    { id: 'realestate', label: 'Immobilier & Bâtiment', icon: '🏡' },
                    { id: 'beauty', label: 'Beauté & Cosmétiques', icon: '✨' },
                    { id: 'coaching', label: 'Formation & Coaching', icon: '🎓' },
                  ].map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSelectedSector(s.id)}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col gap-1 ${selectedSector === s.id
                        ? 'bg-violet-600/20 border-violet-500 text-white ring-1 ring-violet-500'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                        }`}
                    >
                      <span className="text-lg">{s.icon}</span>
                      <span className="font-bold text-[11px] leading-tight">{s.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Commercial Objective */}
              <div className="space-y-2">
                <label className="font-bold text-white flex items-center gap-2">
                  <Target className="w-4 h-4 text-fuchsia-400" />
                  2. Objectif Commercial Prioritaire :
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'sales', label: 'Vente Directe & DMs', desc: 'Appels à l\'action vers WhatsApp / Pulse Pages' },
                    { id: 'authority', label: 'Notoriété & Confiance', desc: 'Cas clients, coulisses, preuves sociales' },
                    { id: 'engagement', label: 'Engagement & Débat', desc: 'Questions ouvertes, sondages, interactions' },
                  ].map((obj) => (
                    <button
                      key={obj.id}
                      type="button"
                      onClick={() => setSelectedObjective(obj.id)}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${selectedObjective === obj.id
                        ? 'bg-fuchsia-600/20 border-fuchsia-500 text-white ring-1 ring-fuchsia-500'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                        }`}
                    >
                      <span className="font-bold text-[11px] block text-white">{obj.label}</span>
                      <span className="text-[10px] text-slate-400 leading-tight block mt-0.5">{obj.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Frequency */}
              <div className="space-y-2">
                <label className="font-bold text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-pink-400" />
                  3. Fréquence de Publication :
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedFrequency(3)}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${selectedFrequency === 3
                      ? 'bg-pink-600/20 border-pink-500 text-white ring-1 ring-pink-500'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                      }`}
                  >
                    <span className="font-bold text-[11px] block text-white">3 Posts (Hebdo Express)</span>
                    <span className="text-[10px] text-slate-400 leading-tight block mt-0.5">
                      Lundi, Mercredi, Vendredi (Idéal pour débuter)
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedFrequency(7)}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${selectedFrequency === 7
                      ? 'bg-pink-600/20 border-pink-500 text-white ring-1 ring-pink-500'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                      }`}
                  >
                    <span className="font-bold text-[11px] block text-white">7 Posts (Semaine Complète)</span>
                    <span className="text-[10px] text-slate-400 leading-tight block mt-0.5">
                      1 post par jour avec rotation multi-réseaux
                    </span>
                  </button>
                </div>
              </div>

              {/* Summary note */}
              <div className="p-3.5 rounded-2xl bg-violet-950/40 border border-violet-800/40 text-[11px] text-slate-300">
                <span className="font-bold text-violet-300 block mb-0.5">
                  ⚡ Intégration Social Selling PulseSocial :
                </span>
                Chaque post généré inclut une accroche forte, un corps de texte adapté à votre marché et un appel à l&apos;action commercial vers WhatsApp, votre Pulse Page ou votre messagerie.
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setCalendarGeneratorOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
              >
                Annuler
              </button>

              <button
                type="button"
                onClick={handleGenerateSectorCalendar}
                disabled={isGeneratingCalendar}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 hover:opacity-90 text-white font-bold text-xs shadow-lg shadow-violet-600/30 transition-all cursor-pointer disabled:opacity-50"
              >
                {isGeneratingCalendar ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Génération et programmation...</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4 text-amber-300" />
                    <span>Générer {selectedFrequency} Publications en 1 Clic</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Composer / Edit Modal */}
      <ComposerModal
        isOpen={composerOpen}
        onClose={() => {
          setComposerOpen(false);
          setEditingPost(null);
        }}
        accounts={accounts}
        onSavePost={handleSavePost}
        editingPost={editingPost}
        onUpdatePost={handleUpdatePost}
      />
    </div>
  );
}
