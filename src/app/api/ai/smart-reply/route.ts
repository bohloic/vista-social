import { NextRequest, NextResponse } from 'next/server';
import { generateSmartReply } from '@/lib/gemini';
import { requireUser, handleApiError, sanitizePromptForLLM } from '@/lib/security/guards';
import { checkRateLimit } from '@/lib/security/rate-limit';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const requestSchema = z
  .object({
    customerName: z.string().min(1, 'Nom du client requis').max(100),
    customerMessage: z.string().min(1, 'Message du client requis').max(2000),
    sentiment: z.string().default('neutral'),
    channel: z.string().default('Instagram'),
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

    const json = await req.json();
    const validated = requestSchema.parse(json);

    const sanitizedMessage = sanitizePromptForLLM(validated.customerMessage);

    const replies = await generateSmartReply({
      ...validated,
      customerMessage: sanitizedMessage,
    });

    return NextResponse.json({ replies });
  } catch (err) {
    return handleApiError(err);
  }
}
