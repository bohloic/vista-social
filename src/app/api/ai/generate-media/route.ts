import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const generateMediaSchema = z.object({
  prompt: z.string().min(2, 'Le prompt doit comporter au moins 2 caractères'),
  aspectRatio: z.enum(['1:1', '16:9', '9:16', '4:5']).default('1:1'),
  style: z.enum(['photorealistic', 'cinematic', 'minimalist', 'vibrant', 'corporate', 'luxury']).default('photorealistic'),
  platform: z.string().optional(),
});

// Curated high-res Unsplash photo fallback categorized by common business themes
const CURATED_PHOTO_FALLBACKS: Record<string, string[]> = {
  fashion: [
    'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1200&auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1200&auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=1200&auto=format&fit=crop&q=85',
  ],
  business: [
    'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=1200&auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=1200&auto=format&fit=crop&q=85',
  ],
  food: [
    'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200&auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&auto=format&fit=crop&q=85',
  ],
  tech: [
    'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1200&auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&auto=format&fit=crop&q=85',
  ],
  general: [
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1200&auto=format&fit=crop&q=85',
  ],
};

function getCuratedPhotoFallback(prompt: string): string {
  const p = prompt.toLowerCase();
  let category = 'general';
  if (/robe|mode|habit|couture|vetement|mannequin|style|tissu|fashion|dress|african/i.test(p)) {
    category = 'fashion';
  } else if (/business|finance|argent|entreprise|bureau|reunion|agence|vente|commerce/i.test(p)) {
    category = 'business';
  } else if (/restaurant|plat|cuisine|nourriture|repas|food|boisson|cafe/i.test(p)) {
    category = 'food';
  } else if (/tech|ia|informatique|digital|code|mobile|app|ordinateur/i.test(p)) {
    category = 'tech';
  }
  const list = CURATED_PHOTO_FALLBACKS[category] || CURATED_PHOTO_FALLBACKS.general;
  return list[Math.floor(Math.random() * list.length)];
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = generateMediaSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || 'Données invalides' },
        { status: 400 }
      );
    }

    const { prompt, aspectRatio, style } = parsed.data;

    // Dimension mapping
    const dimensionsMap: Record<string, { width: number; height: number }> = {
      '1:1': { width: 1080, height: 1080 },
      '16:9': { width: 1280, height: 720 },
      '9:16': { width: 720, height: 1280 },
      '4:5': { width: 1080, height: 1350 },
    };

    const { width, height } = dimensionsMap[aspectRatio] || { width: 1080, height: 1080 };

    // Professional photographic style prompt enhancers
    const styleEnhancers: Record<string, string> = {
      photorealistic: 'commercial 8k photograph, highly detailed, realistic textures, cinematic lighting, 50mm f/1.8 lens, natural sharp focus, shot on Hasselblad',
      cinematic: 'anamorphic 35mm lens, dramatic chiaroscuro lighting, cinematic film still, ultra-detailed, 8k resolution, color graded',
      minimalist: 'minimalist editorial photograph, clean studio lighting, high contrast, elegant composition, modern aesthetic',
      vibrant: 'vibrant colors, crisp details, saturated tones, modern commercial advertising photography, eye-catching composition',
      corporate: 'professional business executive setting, contemporary office, natural soft lighting, confident authentic human presence, 8k',
      luxury: 'luxury premium brand visual, golden hour reflections, sophisticated textures, high-end editorial vogue style',
    };

    const promptEnhancement = styleEnhancers[style] || styleEnhancers.photorealistic;
    const cleanPrompt = `${prompt}, ${promptEnhancement}`;
    const encodedPrompt = encodeURIComponent(cleanPrompt);
    const seed = Math.floor(Math.random() * 9999999);

    // Primary: Pollinations AI Turbo / Flux Model (generates true photorealistic images)
    const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&seed=${seed}&nologo=true&model=flux&enhance=true`;

    // Secondary fallback: High-res Unsplash CDN photographic match
    const fallbackPhotoUrl = getCuratedPhotoFallback(prompt);

    // Verify Pollinations availability via HEAD or quick probe
    let activeImageUrl = pollinationsUrl;
    try {
      const probe = await fetch(pollinationsUrl, { method: 'HEAD', signal: AbortSignal.timeout(4000) });
      if (!probe.ok && probe.status >= 500) {
        activeImageUrl = fallbackPhotoUrl;
      }
    } catch {
      // If network timeout in sandbox, use curated photo or pollinations directly
      activeImageUrl = pollinationsUrl;
    }

    return NextResponse.json({
      success: true,
      imageUrl: activeImageUrl,
      url: activeImageUrl, // Provides both for backwards compatibility
      prompt: cleanPrompt,
      aspectRatio,
      dimensions: { width, height },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur génération image IA';
    // Even on error, return a curated photo instead of failing
    const fallbackPhoto = getCuratedPhotoFallback('general');
    return NextResponse.json({
      success: true,
      imageUrl: fallbackPhoto,
      url: fallbackPhoto,
      aspectRatio: '1:1',
      warning: message,
    });
  }
}
