export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const currency = (searchParams.get('currency') || 'XOF').toUpperCase();

  const plans = [
    {
      id: 'starter',
      name: 'Starter Solo',
      badge: 'Idéal Débutant & Créateur',
      description: 'Pour les indépendants et créateurs gérant jusqu\'à 3 réseaux sociaux.',
      price: {
        XOF: { amount: 5000, symbol: 'FCFA', period: '/mois' },
        EUR: { amount: 9, symbol: '€', period: '/mois' },
        USD: { amount: 10, symbol: '$', period: '/mois' },
      },
      features: [
        'Jusqu\'à 3 comptes sociaux connectés',
        'Planificateur de posts & Calendrier mensuel',
        'Génération de légendes IA Gemini (50/mois)',
        'Boîte de réception unifiée (DMs & Commentaires)',
        '1 Pulse Page (Link-in-bio)',
      ],
      popular: false,
    },
    {
      id: 'pro',
      name: 'Pro Community Manager',
      badge: 'Le Plus Populaire 🔥',
      description: 'Pour les CMs et PME cherchant à développer une audience engagée.',
      price: {
        XOF: { amount: 15000, symbol: 'FCFA', period: '/mois' },
        EUR: { amount: 25, symbol: '€', period: '/mois' },
        USD: { amount: 28, symbol: '$', period: '/mois' },
      },
      features: [
        'Jusqu\'à 10 comptes sociaux connectés',
        'Publications illimitées & Carrousels HD',
        'Réponses intelligentes IA Gemini illimitées',
        'Social Listening & Veille de réputation de marque',
        'Hub complet de gestion des avis clients',
        'Pulse Pages illimitées avec thèmes avancés',
        'Export de rapports d\'audience & Analytics PDF',
      ],
      popular: true,
    },
    {
      id: 'agency',
      name: 'Agence & Entreprise',
      badge: 'Multi-Équipes & Haute Performance',
      description: 'Pour les agences digitales gérant plusieurs marques et clients.',
      price: {
        XOF: { amount: 35000, symbol: 'FCFA', period: '/mois' },
        EUR: { amount: 55, symbol: '€', period: '/mois' },
        USD: { amount: 60, symbol: '$', period: '/mois' },
      },
      features: [
        'Comptes sociaux illimités',
        'Gestion multi-espaces de travail & Rôles d\'équipe',
        'Workflow d\'approbation client avant publication',
        'IA Gemini 2.0 Flash personnalisée au ton de marque',
        'Support prioritaire WhatsApp & Mobile Money dédié',
        'Accès API développeur & Webhooks en temps réel',
      ],
      popular: false,
    },
  ];

  return Response.json({
    currency,
    supportedCurrencies: ['XOF', 'EUR', 'USD'],
    mobileMoneyProviders: [
      { id: 'orange_money', name: 'Orange Money Côte d\'Ivoire', logo: '🟠', country: 'CI' },
      { id: 'mtn_momo', name: 'MTN Mobile Money', logo: '🟡', country: 'CI' },
      { id: 'wave', name: 'Wave Mobile Money', logo: '🌊', country: 'CI' },
      { id: 'moov', name: 'Moov Money', logo: '🔵', country: 'CI' },
      { id: 'card', name: 'Carte Bancaire (Visa / Mastercard)', logo: '💳', country: 'ALL' },
    ],
    plans,
  });
}
