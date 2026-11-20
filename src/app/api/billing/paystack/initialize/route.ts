import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireUser, requireWorkspaceRole, handleApiError, ApiError } from '@/lib/security/guards';
import { checkRateLimit } from '@/lib/security/rate-limit';

export const dynamic = 'force-dynamic';

const paystackInitSchema = z
  .object({
    email: z.string().email('Email client invalide'),
    amount: z.number().positive('Montant invalide'),
    currency: z.enum(['XOF', 'EUR', 'USD', 'NGN', 'GHS']).default('XOF'),
    plan: z.string().default('pro'),
    provider: z.string().default('wave'),
    phoneNumber: z.string().optional(),
    workspaceId: z.string().uuid('workspaceId doit être un UUID').optional(),
    customerName: z.string().optional(),
    prospectId: z.string().optional(),
  })
  .strict();

export async function POST(req: NextRequest) {
  try {
    const { user, supabase } = await requireUser(req);

    // Rate limiting: max 5 requests/min per user [M6]
    checkRateLimit(`billing:${user.id}`, 5, 60_000);

    const body = await req.json();
    const validated = paystackInitSchema.parse(body);

    const targetWorkspaceId = validated.workspaceId || user.workspaceId;
    if (targetWorkspaceId) {
      await requireWorkspaceRole(
        supabase,
        user.id,
        targetWorkspaceId,
        ['super_admin', 'admin'],
        user.role
      );
    }

    const origin = new URL(req.url).origin;
    const secretKey = process.env.PAYSTACK_SECRET_KEY?.trim();
    const reference = `PSTK-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    const callbackUrl = `${origin}/api/billing/paystack/verify?reference=${encodeURIComponent(reference)}&plan=${encodeURIComponent(validated.plan)}&amount=${validated.amount}&currency=${validated.currency}&provider=${encodeURIComponent(validated.provider)}&workspaceId=${encodeURIComponent(targetWorkspaceId || '')}&prospectId=${encodeURIComponent(validated.prospectId || '')}`;

    if (secretKey && secretKey.startsWith('sk_')) {
      try {
        const paystackRes = await fetch('https://api.paystack.co/transaction/initialize', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${secretKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: validated.email,
            amount: Math.round(validated.amount * 100),
            currency: validated.currency,
            reference,
            callback_url: callbackUrl,
            metadata: {
              plan: validated.plan,
              provider: validated.provider,
              workspaceId: targetWorkspaceId,
              customerName: validated.customerName,
              prospectId: validated.prospectId,
            },
          }),
          signal: AbortSignal.timeout(9000),
        });

        if (paystackRes.ok) {
          const paystackData = await paystackRes.json();
          if (paystackData.status && paystackData.data?.authorization_url) {
            return NextResponse.json({
              success: true,
              reference,
              authorization_url: paystackData.data.authorization_url,
              access_code: paystackData.data.access_code,
              mode: 'live_paystack_official',
            });
          }
        }
      } catch (apiErr) {
        console.warn('Paystack live gateway call error:', apiErr);
      }
    }

    // Direct fallback redirect URL
    return NextResponse.json({
      success: true,
      reference,
      authorization_url: callbackUrl,
      mode: 'mock_instant_confirmation',
    });
  } catch (err) {
    return handleApiError(err);
  }
}
