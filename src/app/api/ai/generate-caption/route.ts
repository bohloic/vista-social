import { NextRequest, NextResponse } from 'next/server';
import { generateSocialCaption } from '@/lib/gemini';
import { requireUser, handleApiError, sanitizePromptForLLM } from '@/lib/security/guards';
import { checkRateLimit } from '@/lib/security/rate-limit';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const requestSchema = z
  .object({
    topic: z.string().min(1, 'Le sujet est requis').max(1000, 'Sujet trop long'),
    tone: z
      .enum(['professional', 'engaging', 'humorous', 'urgent', 'minimalist', 'storytelling'])
      .default('engaging'),
    platforms: z.array(z.string()).min(1).default(['instagram']),
    includeHashtags: z.boolean().default(true),
    includeEmojis: z.boolean().default(true),
    callToAction: z.string().max(300).optional(),
  })
  .strict();

export async function POST(req: NextRequest) {
  try {
    const { user } = await requireUser(req);
    checkRateLimit(`ai:${user.id}`, 10, 60_000);

    const json = await req.json();
    const validated = requestSchema.parse(json);

    // Sanitize prompt against prompt injection [M1, Phase 2]
    const sanitizedTopic = sanitizePromptForLLM(validated.topic);

    const result = await generateSocialCaption({
      ...validated,
      topic: sanitizedTopic,
    });

    return NextResponse.json(result);
  } catch (err) {
    return handleApiError(err);
  }
}
