import { NextResponse } from 'next/server';
import { generateSocialCaption } from '@/lib/gemini';
import { z } from 'zod';

const requestSchema = z.object({
  topic: z.string().min(1),
  tone: z.enum(['professional', 'engaging', 'humorous', 'urgent', 'minimalist', 'storytelling']).default('engaging'),
  platforms: z.array(z.string()).default(['instagram']),
  includeHashtags: z.boolean().default(true),
  includeEmojis: z.boolean().default(true),
  callToAction: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const validated = requestSchema.parse(json);
    const result = await generateSocialCaption(validated);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Invalid request' }, { status: 400 });
  }
}

