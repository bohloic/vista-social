import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireUser, handleApiError, sanitizePromptForLLM } from '@/lib/security/guards';
import { checkRateLimit } from '@/lib/security/rate-limit';
import { optimizeVisualPromptForFlyer } from '@/lib/gemini';
import { CURATED_FLYER_PRESETS, getLocalFlyerFallback } from '@/lib/flyer-studio';

export const dynamic = 'force-dynamic';

const generateMediaSchema = z
  .object({
    prompt: z.string().min(2, 'Le prompt doit comporter au moins 2 caractères').max(1000, 'Prompt trop long'),
    aspectRatio: z.enum(['1:1', '16:9', '9:16', '4:5', 'a4']).default('1:1'),
    style: z
      .enum(['photorealistic', 'cinematic', 'minimalist', 'vibrant', 'corporate', 'luxury', 'flyer_promo', '3d_clay'])
      .default('photorealistic'),
    platform: z.string().optional(),
    optimizeWithLLM: z.boolean().default(true),
  })
  .strict();

export async function POST(req: NextRequest) {
  try {
    const { user } = await requireUser(req);
    const rl = checkRateLimit(`ai:${user.id}`, 10, 60_000);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Limite de requêtes IA atteinte. Veuillez patienter.', retryAfter: rl.retryAfter },
        { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } }
      );
    }

    const body = await req.json();
    const validated = generateMediaSchema.parse(body);

    const sanitizedPrompt = sanitizePromptForLLM(validated.prompt);

    // Compute exact dimensions matching the requested ratio
    let width = 1080;
    let height = 1080;
    if (validated.aspectRatio === '16:9') {
      width = 1280;
      height = 720;
    } else if (validated.aspectRatio === '9:16') {
      width = 1080;
      height = 1920;
    } else if (validated.aspectRatio === '4:5') {
      width = 1080;
      height = 1350;
    } else if (validated.aspectRatio === 'a4') {
      width = 1240;
      height = 1754;
    }

    // 1. LLM-Powered Prompt Optimization & Dynamic Typography Analysis
    // Generates high-detail English visual prompt with dedicated negative space + structured flyer text
    const designAnalysis = await optimizeVisualPromptForFlyer(
      sanitizedPrompt,
      validated.style,
      validated.aspectRatio
    );

    const seed = Math.floor(Math.random() * 999999);
    const finalVisualPrompt = designAnalysis.englishPrompt || `${sanitizedPrompt}, 8k commercial photography, advertising key visual, clean composition with negative space for typography, no baked-in text`;
    const encodedPrompt = encodeURIComponent(finalVisualPrompt);

    // 2. Verify external AI image endpoint availability; fall back seamlessly to local SVG studio background if unreachable
    const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&seed=${seed}&nologo=true&model=flux&enhance=true`;
    const localPhotoFallback = getLocalFlyerFallback(validated.prompt);
    let resolvedImageUrl = localPhotoFallback;

    try {
      const probe = await fetch(pollinationsUrl, {
        method: 'HEAD',
        signal: AbortSignal.timeout(3500),
      });
      const contentType = probe.headers.get('content-type') || '';
      if (probe.ok && contentType.startsWith('image/')) {
        resolvedImageUrl = pollinationsUrl;
      }
    } catch {
      resolvedImageUrl = localPhotoFallback;
    }

    return NextResponse.json({
      success: true,
      imageUrl: resolvedImageUrl,
      url: resolvedImageUrl,
      fallbackUrl: localPhotoFallback,
      prompt: validated.prompt,
      aspectRatio: validated.aspectRatio,
      style: validated.style,
      dimensions: { width, height },
      optimizedPrompt: designAnalysis.englishPrompt,
      overlayData: {
        headline: designAnalysis.headline,
        subtitle: designAnalysis.subtitle,
        badge: designAnalysis.badge,
        cta: designAnalysis.cta,
        suggestedLayout: designAnalysis.suggestedOverlayLayout,
        accentColor: designAnalysis.accentColor,
      },
      curatedPresets: CURATED_FLYER_PRESETS,
      architecture: 'Hybrid: AI/Local SVG Studio Background + Client-Side Dynamic Typography Overlay',
      costEstimate: '0.000$ - 0.025$ / image',
    });
  } catch (err) {
    return handleApiError(err);
  }
}
