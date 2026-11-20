import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireUser, handleApiError, sanitizePromptForLLM } from '@/lib/security/guards';
import { checkRateLimit } from '@/lib/security/rate-limit';

export const dynamic = 'force-dynamic';

const generateMediaSchema = z
  .object({
    prompt: z.string().min(2, 'Le prompt doit comporter au moins 2 caractères').max(1000, 'Prompt trop long'),
    aspectRatio: z.enum(['1:1', '16:9', '9:16', '4:5']).default('1:1'),
    style: z
      .enum(['photorealistic', 'cinematic', 'minimalist', 'vibrant', 'corporate', 'luxury'])
      .default('photorealistic'),
    platform: z.string().optional(),
  })
  .strict();

const CURATED_PHOTO_FALLBACKS: Record<string, string[]> = {
  fashion: [
    'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1200&auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1200&auto=format&fit=crop&q=85',
  ],
  business: [
    'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=1200&auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&auto=format&fit=crop&q=85',
  ],
  food: [
    'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200&auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&auto=format&fit=crop&q=85',
  ],
  tech: [
    'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1200&auto=format&fit=crop&q=85',
  ],
  general: [
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=85',
  ],
};

function getCuratedPhotoFallback(prompt: string): string {
  const p = prompt.toLowerCase();
  let category = 'general';
  if (/robe|mode|habit|couture|vetement|style|tissu|fashion|dress/i.test(p)) {
    category = 'fashion';
  } else if (/business|finance|argent|entreprise|bureau|reunion|agence|vente|commerce/i.test(p)) {
    category = 'business';
  } else if (/restaurant|plat|cuisine|nourriture|repas|food|boisson/i.test(p)) {
    category = 'food';
  } else if (/tech|ia|informatique|digital|code|mobile|app/i.test(p)) {
    category = 'tech';
  }
  const list = CURATED_PHOTO_FALLBACKS[category] || CURATED_PHOTO_FALLBACKS.general;
  return list[Math.floor(Math.random() * list.length)];
}

export async function POST(req: NextRequest) {
  try {
    const { user } = await requireUser(req);
    checkRateLimit(`ai:${user.id}`, 10, 60_000);

    const body = await req.json();
    const validated = generateMediaSchema.parse(body);

    const sanitizedPrompt = sanitizePromptForLLM(validated.prompt);

    const width = validated.aspectRatio === '16:9' ? 1280 : validated.aspectRatio === '9:16' ? 720 : 1080;
    const height = validated.aspectRatio === '16:9' ? 720 : validated.aspectRatio === '9:16' ? 1280 : 1080;

    const seed = Math.floor(Math.random() * 999999);
    const encodedPrompt = encodeURIComponent(`${sanitizedPrompt}, ${validated.style} style, 8k resolution, professional lighting`);
    const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&seed=${seed}&nologo=true&enhance=true`;

    const realPhotoUrl = getCuratedPhotoFallback(validated.prompt);

    return NextResponse.json({
      success: true,
      imageUrl: pollinationsUrl,
      fallbackUrl: realPhotoUrl,
      prompt: validated.prompt,
      aspectRatio: validated.aspectRatio,
      style: validated.style,
      engine: 'pollinations_hd_plus_curated',
    });
  } catch (err) {
    return handleApiError(err);
  }
}
