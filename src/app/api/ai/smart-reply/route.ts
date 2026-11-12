import { NextResponse } from 'next/server';
import { generateSmartReply } from '@/lib/gemini';
import { z } from 'zod';

const requestSchema = z.object({
  customerName: z.string().min(1),
  customerMessage: z.string().min(1),
  sentiment: z.string().default('neutral'),
  channel: z.string().default('Instagram'),
});

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const validated = requestSchema.parse(json);
    const replies = await generateSmartReply(validated);
    return NextResponse.json({ replies });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Invalid request' }, { status: 400 });
  }
}

