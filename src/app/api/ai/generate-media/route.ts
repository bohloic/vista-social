import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const generateMediaSchema = z.object({
  prompt: z.string().min(3, 'Le prompt doit comporter au moins 3 caractères'),
  aspectRatio: z.enum(['1:1', '16:9', '9:16', '4:5']).default('1:1'),
  style: z.enum(['photorealistic', 'cinematic', 'minimalist', 'vibrant', 'corporate', 'luxury']).default('photorealistic'),
});

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

    // Map aspect ratios to pixel dimensions
    const dimensionsMap: Record<string, { width: number; height: number }> = {
      '1:1': { width: 1024, height: 1024 },
      '16:9': { width: 1280, height: 720 },
      '9:16': { width: 720, height: 1280 },
      '4:5': { width: 1080, height: 1350 },
    };

    const { width, height } = dimensionsMap[aspectRatio] || { width: 1024, height: 1024 };

    // Enhanced style prompts for professional output
    const styleEnhancers: Record<string, string> = {
      photorealistic: 'hyperrealistic, professional 8k photograph, highly detailed, soft natural studio lighting, depth of field, award-winning commercial photography',
      cinematic: 'cinematic lighting, dramatic atmosphere, anamorphic 35mm lens, 8k resolution, cinematic color grading, master shot',
      minimalist: 'minimalist elegant design, clean lines, balanced composition, modern aesthetic, high contrast, studio backdrop',
      vibrant: 'vibrant colors, dynamic composition, energetic lighting, ultra-sharp detail, social media viral aesthetic',
      corporate: 'professional business executive setting, clean modern corporate office, sleek lighting, trustworthy commercial photography',
      luxury: 'luxury high-end premium aesthetic, golden hour reflections, sophisticated textures, ultra-detailed',
    };

    const enhancedPrompt = `${prompt}, ${styleEnhancers[style] || styleEnhancers.photorealistic}`;
    const encodedPrompt = encodeURIComponent(enhancedPrompt);
    const seed = Math.floor(Math.random() * 999999);

    // High quality generation URL via Pollinations AI Turbo Engine
    const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&seed=${seed}&nologo=true&enhance=true`;

    return NextResponse.json({
      success: true,
      imageUrl,
      prompt: enhancedPrompt,
      aspectRatio,
      dimensions: { width, height },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur génération image IA';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
