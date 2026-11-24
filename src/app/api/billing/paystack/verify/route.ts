import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getAdminSupabase } from '@/lib/supabase';
import {
  requireUser,
  requireWorkspaceRole,
  ApiError,
  handleApiError,
  escapeHtml,
  safeJsonForScript,
} from '@/lib/security/guards';
import { checkRateLimit, getClientIp } from '@/lib/security/rate-limit';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const isUuid = (val?: string) =>
  typeof val === 'string' &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);

const verifyPostSchema = z
  .object({
    reference: z.string().min(3).max(128),
    plan: z.enum(['starter', 'pro', 'agency', 'enterprise']).default('pro'),
    amount: z.number().positive().max(100_000_000),
    currency: z.enum(['XOF', 'EUR', 'USD']).default('XOF'),
    provider: z.enum(['orange_money', 'mtn_momo', 'wave', 'moov', 'card']).default('wave'),
    phoneNumber: z.string().max(32).optional(),
    workspaceId: z.string().uuid(),
  })
  .strict();

async function recordPaystackPayment(params: {
  reference: string;
  plan: string;
  amount: number;
  currency: string;
  provider: string;
  phoneNumber?: string;
  workspaceId: string;
}) {
  const { reference, plan, amount, currency, provider, phoneNumber, workspaceId } = params;
  const supabase = getAdminSupabase();
  if (!supabase) throw new ApiError('DATABASE_UNAVAILABLE', 'Database unreachable', 503);

  // Check idempotency: if reference already recorded as successful, avoid duplicate crediting
  const { data: existingTx } = await supabase
    .from('mobile_money_transactions')
    .select('id, status')
    .eq('transaction_ref', reference)
    .maybeSingle();

  if (existingTx && existingTx.status === 'successful') {
    return { alreadyProcessed: true };
  }

  const validPlan = ['starter', 'pro', 'agency', 'enterprise'].includes(plan) ? plan : 'pro';
  const validProvider = ['orange_money', 'mtn_momo', 'wave', 'moov', 'card'].includes(provider)
    ? provider
    : 'wave';

  if (existingTx) {
    await supabase
      .from('mobile_money_transactions')
      .update({
        status: 'successful',
        verified_at: new Date().toISOString(),
      })
      .eq('id', existingTx.id);
  } else {
    await supabase.from('mobile_money_transactions').insert({
      workspace_id: workspaceId,
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
  }

  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  await supabase.from('subscriptions').insert({
    workspace_id: workspaceId,
    plan: validPlan,
    status: 'active',
    currency: ['XOF', 'EUR', 'USD'].includes(currency) ? currency : 'XOF',
    amount,
    billing_cycle: 'monthly',
    expires_at: expiresAt,
  });

  await supabase.from('workspaces').update({ plan: validPlan }).eq('id', workspaceId);
  return { alreadyProcessed: false };
}

export async function GET(req: NextRequest) {
  try {
    // [STRIX-05 Fix]: Require authenticated session & workspace admin role for payment confirmation callback
    const user = await requireUser(req);
    const ip = getClientIp(req);
    const rateLimitResult = checkRateLimit(`paystack_verify_get:${user.id}:${ip}`, { maxTokens: 20, refillRate: 1 });
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded', retryAfter: rateLimitResult.retryAfter },
        { status: 429, headers: { 'Retry-After': String(rateLimitResult.retryAfter) } }
      );
    }

    const url = new URL(req.url);
    const reference = (url.searchParams.get('reference') || url.searchParams.get('trxref') || '').trim();
    const rawPlan = url.searchParams.get('plan') || 'pro';
    const plan = ['starter', 'pro', 'agency', 'enterprise'].includes(rawPlan) ? rawPlan : 'pro';
    const amount = Number(url.searchParams.get('amount') || 15000);
    const rawCurrency = (url.searchParams.get('currency') || 'XOF').toUpperCase();
    const currency = ['XOF', 'EUR', 'USD'].includes(rawCurrency) ? rawCurrency : 'XOF';
    const rawProvider = url.searchParams.get('provider') || 'wave';
    const provider = ['orange_money', 'mtn_momo', 'wave', 'moov', 'card'].includes(rawProvider) ? rawProvider : 'wave';
    const workspaceId = url.searchParams.get('workspaceId') || user.workspaceId || user.workspace_id || '';
    const prospectId = url.searchParams.get('prospectId') || undefined;

    if (!reference || reference.length > 128 || !isUuid(workspaceId) || !Number.isFinite(amount) || amount <= 0) {
      return new NextResponse('Paramètres de transaction manquants ou invalides', { status: 400 });
    }

    await requireWorkspaceRole(user.id, workspaceId, ['super_admin', 'admin'], user.role);

    const secretKey = process.env.PAYSTACK_SECRET_KEY?.trim();
    if (secretKey && secretKey.startsWith('sk_')) {
      try {
        const verifyRes = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
          headers: { Authorization: `Bearer ${secretKey}` },
        });
        const verifyData = await verifyRes.json();
        if (!verifyData.status || verifyData.data?.status !== 'success') {
          return new NextResponse('Échec de la validation Paystack', { status: 400 });
        }
      } catch {
        return new NextResponse('Impossible de vérifier la transaction auprès de Paystack', { status: 502 });
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

    const safeAmountText = escapeHtml(`${amount.toLocaleString()} ${currency}`);
    const safeRefText = escapeHtml(reference);

    const html = `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"><title>Paiement Paystack Confirmé</title></head>
<body style="background:#07090E;color:#fff;font-family:system-ui;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">
  <div style="text-align:center;padding:24px;">
    <p style="font-size:16px;color:#34d399;font-weight:bold;">✓ Paiement Paystack (${safeAmountText}) validé avec succès !</p>
    <p style="font-size:12px;color:#94a3b8;">Référence : ${safeRefText}</p>
  </div>
  <script>
    try {
      if (window.opener) {
        window.opener.postMessage({
          type: 'PAYSTACK_PAYMENT_SUCCESS',
          reference: ${safeJsonForScript(reference)},
          plan: ${safeJsonForScript(plan)},
          amount: ${safeJsonForScript(amount)},
          currency: ${safeJsonForScript(currency)},
          provider: ${safeJsonForScript(provider)},
          prospectId: ${safeJsonForScript(prospectId || '')}
        }, window.location.origin);
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
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-paystack-signature');
    const secretKey = process.env.PAYSTACK_SECRET_KEY?.trim();

    // Webhook Mode with HMAC SHA-512 signature verification
    if (signature) {
      if (!secretKey) {
        throw new ApiError('CONFIGURATION_ERROR', 'Paystack secret key is missing', 500);
      }

      const expectedSignature = crypto
        .createHmac('sha512', secretKey)
        .update(rawBody)
        .digest('hex');

      let isValid = false;
      try {
        isValid = crypto.timingSafeEqual(
          Buffer.from(signature, 'hex'),
          Buffer.from(expectedSignature, 'hex')
        );
      } catch {
        isValid = false;
      }

      if (!isValid) {
        throw new ApiError('UNAUTHORIZED', 'Invalid Paystack webhook signature', 401);
      }

      const event = JSON.parse(rawBody);
      if (event.event === 'charge.success') {
        const data = event.data;
        const reference = data.reference;
        const amount = data.amount / 100;
        const currency = data.currency || 'XOF';
        const workspaceId = data.metadata?.workspace_id || data.metadata?.workspaceId;

        if (isUuid(workspaceId)) {
          await recordPaystackPayment({
            reference,
            plan: data.metadata?.plan || 'pro',
            amount,
            currency,
            provider: data.channel || 'card',
            phoneNumber: data.customer?.phone,
            workspaceId,
          });
        }
      }

      return NextResponse.json({ received: true });
    }

    // Direct Authenticated Verification Mode
    const user = await requireUser(req);
    const ip = getClientIp(req);
    const rateLimit = checkRateLimit(`paystack_verify_post:${user.id}:${ip}`, { maxTokens: 10, refillRate: 1 });
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded', retryAfter: rateLimit.retryAfter },
        { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfter) } }
      );
    }

    let parsedBody;
    try {
      parsedBody = JSON.parse(rawBody);
    } catch {
      throw new ApiError('BAD_REQUEST', 'Corps JSON invalide', 400);
    }

    const parsed = verifyPostSchema.safeParse(parsedBody);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || 'Données invalides' },
        { status: 422 }
      );
    }

    await requireWorkspaceRole(user.id, parsed.data.workspaceId, ['super_admin', 'admin'], user.role);

    await recordPaystackPayment({
      reference: parsed.data.reference,
      plan: parsed.data.plan,
      amount: parsed.data.amount,
      currency: parsed.data.currency,
      provider: parsed.data.provider,
      phoneNumber: parsed.data.phoneNumber,
      workspaceId: parsed.data.workspaceId,
    });

    return NextResponse.json({
      success: true,
      reference: parsed.data.reference,
      status: 'successful',
      message: `Paiement Paystack (${parsed.data.amount.toLocaleString()} ${parsed.data.currency}) confirmé !`,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
