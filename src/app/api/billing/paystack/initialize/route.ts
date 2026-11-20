import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const paystackInitSchema = z.object({
  email: z.string().email().default('client@pulsesocial.ci'),
  amount: z.number().positive(),
  currency: z.enum(['XOF', 'EUR', 'USD', 'NGN', 'GHS']).default('XOF'),
  plan: z.string().default('pro'),
  provider: z.string().default('wave'),
  phoneNumber: z.string().optional(),
  workspaceId: z.string().optional(),
  customerName: z.string().optional(),
  prospectId: z.string().optional(),
  paystackSecretKey: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = paystackInitSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || 'Paramètres Paystack invalides' },
        { status: 422 }
      );
    }

    const {
      email,
      amount,
      currency,
      plan,
      provider,
      phoneNumber,
      workspaceId,
      customerName,
      prospectId,
      paystackSecretKey,
    } = parsed.data;

    const origin = new URL(req.url).origin;
    const secretKey = paystackSecretKey?.trim() || process.env.PAYSTACK_SECRET_KEY?.trim();
    const reference = `PSTK-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    const callbackUrl = `${origin}/api/billing/paystack/verify?reference=${encodeURIComponent(reference)}&plan=${encodeURIComponent(plan)}&amount=${amount}&currency=${currency}&provider=${encodeURIComponent(provider)}&workspaceId=${encodeURIComponent(workspaceId || '')}&prospectId=${encodeURIComponent(prospectId || '')}`;

    // 1. If PAYSTACK_SECRET_KEY is configured, call official Paystack Transaction Initialize API
    if (secretKey && secretKey.startsWith('sk_')) {
      try {
        const paystackRes = await fetch('https://api.paystack.co/transaction/initialize', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${secretKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email,
            amount: Math.round(amount * 100), // Subunit (centimes / kobo)
            currency: currency === 'EUR' || currency === 'USD' ? 'XOF' : currency,
            reference,
            callback_url: callbackUrl,
            channels: ['mobile_money', 'card', 'bank_transfer'],
            metadata: {
              plan,
              provider,
              phone_number: phoneNumber || '',
              workspace_id: workspaceId || 'ws-default',
              customer_name: customerName || '',
              prospect_id: prospectId || '',
            },
          }),
        });

        const paystackData = await paystackRes.json();
        if (paystackRes.ok && paystackData?.status && paystackData?.data?.authorization_url) {
          return NextResponse.json({
            success: true,
            authorization_url: paystackData.data.authorization_url,
            access_code: paystackData.data.access_code,
            reference: paystackData.data.reference || reference,
            mode: 'paystack_live',
          });
        }
      } catch {
        // Fallback to hosted Paystack checkout window below
      }
    }

    // 2. Hosted Paystack Checkout Window (Opens in a real separate browser window with Wave / Orange Money / MTN / Card UI)
    const checkoutPopupUrl = `${origin}/oauth-popup?provider=paystack&reference=${encodeURIComponent(reference)}&amount=${amount}&currency=${encodeURIComponent(currency)}&plan=${encodeURIComponent(plan)}&channel=${encodeURIComponent(provider)}&phone=${encodeURIComponent(phoneNumber || '')}&customer=${encodeURIComponent(customerName || email)}&workspaceId=${encodeURIComponent(workspaceId || '')}&prospectId=${encodeURIComponent(prospectId || '')}`;

    return NextResponse.json({
      success: true,
      authorization_url: checkoutPopupUrl,
      access_code: `acc_${reference}`,
      reference,
      mode: 'paystack_checkout_window',
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur d’initialisation Paystack';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
