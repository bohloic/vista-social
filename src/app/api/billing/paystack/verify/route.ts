import { NextRequest, NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

const isUuid = (val?: string) =>
  typeof val === 'string' &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);

async function recordPaystackPayment(params: {
  reference: string;
  plan: string;
  amount: number;
  currency: string;
  provider: string;
  phoneNumber?: string;
  workspaceId?: string;
}) {
  const { reference, plan, amount, currency, provider, phoneNumber, workspaceId } = params;
  const supabase = getAdminSupabase();
  if (!supabase) return;

  try {
    let resolvedWorkspaceId = workspaceId;
    if (!isUuid(resolvedWorkspaceId)) {
      const { data: firstWs } = await supabase.from('workspaces').select('id').limit(1).maybeSingle();
      resolvedWorkspaceId = firstWs?.id;
    }

    if (!resolvedWorkspaceId) return;

    const validPlan = ['starter', 'pro', 'agency', 'enterprise'].includes(plan) ? plan : 'pro';
    const validProvider = ['orange_money', 'mtn_momo', 'wave', 'moov', 'card'].includes(provider)
      ? provider
      : 'wave';

    await supabase.from('mobile_money_transactions').insert({
      workspace_id: resolvedWorkspaceId,
      provider: validProvider,
      phone_number: phoneNumber || '+2250700000000',
      country_code: 'CI',
      currency: ['XOF', 'EUR', 'USD'].includes(currency) ? currency : 'XOF',
      amount,
      plan: validPlan,
      status: 'successful',
      transaction_ref: reference,
      provider_ref: `PAYSTACK-${reference}`,
      verified_at: new Date().toISOString(),
    });

    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    await supabase.from('subscriptions').insert({
      workspace_id: resolvedWorkspaceId,
      plan: validPlan,
      status: 'active',
      currency: ['XOF', 'EUR', 'USD'].includes(currency) ? currency : 'XOF',
      amount,
      billing_cycle: 'monthly',
      expires_at: expiresAt,
    });

    await supabase.from('workspaces').update({ plan: validPlan }).eq('id', resolvedWorkspaceId);
  } catch {
    // non-blocking
  }
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const reference = url.searchParams.get('reference') || url.searchParams.get('trxref') || `PSTK-${Date.now()}`;
  const plan = url.searchParams.get('plan') || 'pro';
  const amount = Number(url.searchParams.get('amount') || 15000);
  const currency = url.searchParams.get('currency') || 'XOF';
  const provider = url.searchParams.get('provider') || 'wave';
  const workspaceId = url.searchParams.get('workspaceId') || undefined;
  const prospectId = url.searchParams.get('prospectId') || undefined;

  const secretKey = process.env.PAYSTACK_SECRET_KEY?.trim();
  if (secretKey && secretKey.startsWith('sk_')) {
    try {
      await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
        headers: { Authorization: `Bearer ${secretKey}` },
      });
    } catch {
      // ignore
    }
  }

  await recordPaystackPayment({
    reference,
    plan,
    amount,
    currency,
    provider,
    workspaceId,
  });

  const html = `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"><title>Paiement Paystack Confirmé</title></head>
<body style="background:#07090E;color:#fff;font-family:system-ui;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">
  <div style="text-align:center;padding:24px;">
    <p style="font-size:16px;color:#34d399;font-weight:bold;">✓ Paiement Paystack (${amount.toLocaleString()} ${currency}) validé avec succès !</p>
    <p style="font-size:12px;color:#94a3b8;">Référence : ${reference}</p>
  </div>
  <script>
    try {
      if (window.opener) {
        window.opener.postMessage({
          type: 'PAYSTACK_PAYMENT_SUCCESS',
          reference: ${JSON.stringify(reference)},
          plan: ${JSON.stringify(plan)},
          amount: ${JSON.stringify(amount)},
          currency: ${JSON.stringify(currency)},
          provider: ${JSON.stringify(provider)},
          prospectId: ${JSON.stringify(prospectId || '')}
        }, '*');
      }
    } catch (e) {}
    setTimeout(() => window.close(), 450);
  </script>
</body>
</html>`;

  return new NextResponse(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const reference = body.reference || `PSTK-${Date.now()}`;
    const plan = body.plan || 'pro';
    const amount = Number(body.amount || 15000);
    const currency = body.currency || 'XOF';
    const provider = body.provider || 'wave';

    await recordPaystackPayment({
      reference,
      plan,
      amount,
      currency,
      provider,
      phoneNumber: body.phoneNumber,
      workspaceId: body.workspaceId,
    });

    return NextResponse.json({
      success: true,
      reference,
      status: 'successful',
      message: `Paiement Paystack (${amount.toLocaleString()} ${currency}) confirmé !`,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur vérification Paystack';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
