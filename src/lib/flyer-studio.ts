// Studio d'Affiches & Flyers Hybride PulseSocial (Client-Side Dynamic Typography Overlay)
// Architecture Hybride v2026 : Séparation fond IA (Nano Banana / Recraft / FLUX) et typographie dynamique (Canvas/HTML)
// Économie de 80% sur les coûts d'API, 0$ par retouche de texte/prix/contact, et rendu HD instantané.

export interface CuratedFlyerPreset {
  id: string;
  category: string;
  title: string;
  imageUrl: string;
  headline: string;
  subtitle: string;
  badge: string;
  cta: string;
  accentColor: string;
  ratio: '1:1' | '4:5' | '9:16' | '16:9' | 'a4';
}

export const CURATED_FLYER_PRESETS: CuratedFlyerPreset[] = [
  {
    id: 'food-burger',
    category: 'Restauration & Food',
    title: 'Burger Gourmet & Frites',
    imageUrl: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=1200&auto=format&fit=crop&q=85',
    headline: 'Menu Royal & Frites Maison',
    subtitle: 'Saveurs grillées à la flamme • Sauce secrète du chef',
    badge: '6 500 FCFA',
    cta: 'Commandez au +225 07 00 00 00',
    accentColor: '#F59E0B',
    ratio: '1:1',
  },
  {
    id: 'fashion-afro',
    category: 'Mode & Création',
    title: 'Collection Capsule Wax',
    imageUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1200&auto=format&fit=crop&q=85',
    headline: 'Nouvelle Collection Printemps',
    subtitle: 'Luxe éco-responsable & coupes afro-contemporaines',
    badge: '-25% CETTE SEMAINE',
    cta: 'Dispo au showroom & livraison express',
    accentColor: '#EC4899',
    ratio: '4:5',
  },
  {
    id: 'tech-saas',
    category: 'Tech & B2B',
    title: 'Masterclass Croissance',
    imageUrl: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1200&auto=format&fit=crop&q=85',
    headline: 'Boostez Votre Acquisition B2B',
    subtitle: 'Masterclass exclusive animée par nos experts',
    badge: 'ACCÈS GRATUIT',
    cta: 'Réservez votre place en ligne',
    accentColor: '#6366F1',
    ratio: '16:9',
  },
  {
    id: 'event-concert',
    category: 'Événements & Soirées',
    title: 'Nuit Blanche Afrobeat',
    imageUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&auto=format&fit=crop&q=85',
    headline: 'Nuit Blanche Afro-Fusion',
    subtitle: 'DJ sets d’exception, cocktails signature & surprises',
    badge: 'ENTRÉE LIBRE',
    cta: 'Réservations tables VIP au +221 77 000 00 00',
    accentColor: '#8B5CF6',
    ratio: '9:16',
  },
  {
    id: 'beauty-spa',
    category: 'Beauté & Bien-être',
    title: 'Forfait Détente & Soin',
    imageUrl: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1200&auto=format&fit=crop&q=85',
    headline: 'Journée Sérénité & Éclat',
    subtitle: 'Massages relaxants aux huiles naturelles précieuses',
    badge: 'PACK DUO 25 000 F',
    cta: 'Prenez rendez-vous en ligne',
    accentColor: '#10B981',
    ratio: '1:1',
  },
  {
    id: 'sale-flash',
    category: 'Social Selling & Promo',
    title: 'Grande Vente Flash',
    imageUrl: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1200&auto=format&fit=crop&q=85',
    headline: 'Solde Flash Immanquable',
    subtitle: 'Stocks ultra-limités sur toute la boutique en ligne',
    badge: "JUSQU'À -50%",
    cta: 'Expédition partout en Afrique de l’Ouest',
    accentColor: '#EF4444',
    ratio: '4:5',
  },
];

export interface FlyerCanvasOptions {
  imageUrl: string;
  headline?: string;
  subtitle?: string;
  badge?: string;
  cta?: string;
  ratio: '1:1' | '4:5' | '9:16' | '16:9' | 'a4';
  position: 'bottom' | 'top' | 'glass';
  accentColor: string;
}

/**
 * Composite rendering engine: draws the background image + typographic layout
 * onto a high-definition HTML5 canvas and exports as crisp PNG Data URL.
 */
export async function renderFlyerCompositeToDataUrl(options: FlyerCanvasOptions): Promise<string> {
  const { imageUrl, headline, subtitle, badge, cta, ratio, position, accentColor } = options;

  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(imageUrl);
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        let width = 1080;
        let height = 1080;
        if (ratio === '16:9') {
          width = 1280;
          height = 720;
        } else if (ratio === '9:16') {
          width = 1080;
          height = 1920;
        } else if (ratio === '4:5') {
          width = 1080;
          height = 1350;
        } else if (ratio === 'a4') {
          width = 1240;
          height = 1754;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          resolve(imageUrl);
          return;
        }

        // 1. Draw background image covering entire canvas
        ctx.drawImage(img, 0, 0, width, height);

        // If no typography is enabled, return raw visual
        if (!headline && !badge && !subtitle && !cta) {
          resolve(canvas.toDataURL('image/png'));
          return;
        }

        // 2. Draw overlay background
        if (position === 'bottom') {
          const grad = ctx.createLinearGradient(0, height * 0.45, 0, height);
          grad.addColorStop(0, 'rgba(0,0,0,0)');
          grad.addColorStop(0.3, 'rgba(0,0,0,0.6)');
          grad.addColorStop(1, 'rgba(0,0,0,0.92)');
          ctx.fillStyle = grad;
          ctx.fillRect(0, height * 0.45, width, height * 0.55);
        } else if (position === 'top') {
          const grad = ctx.createLinearGradient(0, 0, 0, height * 0.55);
          grad.addColorStop(0, 'rgba(0,0,0,0.92)');
          grad.addColorStop(0.7, 'rgba(0,0,0,0.6)');
          grad.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, width, height * 0.55);
        } else {
          // Glassmorphism card
          ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
          ctx.lineWidth = 4;
          const padX = width * 0.06;
          const cardY = height * 0.52;
          const cardW = width * 0.88;
          const cardH = height * 0.42;
          ctx.beginPath();
          ctx.roundRect(padX, cardY, cardW, cardH, 28);
          ctx.fill();
          ctx.stroke();
        }

        // 3. Render typography
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';

        const padLeft = width * 0.08;
        let startY = position === 'top' ? height * 0.08 : height * 0.58;
        if (position === 'glass') startY = height * 0.56;

        // Badge (Price / Discount / Action tag)
        if (badge) {
          ctx.font = 'bold 28px sans-serif';
          const badgeText = badge.toUpperCase();
          const badgeWidth = ctx.measureText(badgeText).width + 36;
          const badgeHeight = 44;
          ctx.fillStyle = accentColor || '#F59E0B';
          ctx.beginPath();
          ctx.roundRect(padLeft, startY, badgeWidth, badgeHeight, 10);
          ctx.fill();

          ctx.fillStyle = '#FFFFFF';
          ctx.fillText(badgeText, padLeft + 18, startY + 8);
          startY += 62;
        }

        // Headline
        if (headline) {
          ctx.font = '900 48px sans-serif';
          ctx.fillStyle = '#FFFFFF';
          const words = headline.split(' ');
          let line = '';
          for (let n = 0; n < words.length; n++) {
            const testLine = line + words[n] + ' ';
            const metrics = ctx.measureText(testLine);
            if (metrics.width > width * 0.84 && n > 0) {
              ctx.fillText(line, padLeft, startY);
              line = words[n] + ' ';
              startY += 58;
            } else {
              line = testLine;
            }
          }
          ctx.fillText(line, padLeft, startY);
          startY += 64;
        }

        // Subtitle
        if (subtitle) {
          ctx.font = '500 26px sans-serif';
          ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
          ctx.fillText(subtitle, padLeft, startY);
          startY += 44;
        }

        // Call to action & Contact
        if (cta) {
          ctx.font = 'bold 28px sans-serif';
          ctx.fillStyle = accentColor || '#60A5FA';
          ctx.fillText(`👉 ${cta}`, padLeft, startY);
        }

        resolve(canvas.toDataURL('image/png'));
      } catch {
        resolve(imageUrl);
      }
    };

    img.onerror = () => {
      resolve(imageUrl);
    };

    img.src = imageUrl;
  });
}
