import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getAdminSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature =
      req.headers.get('x-webhook-signature') ||
      req.headers.get('x-paystack-signature') ||
      req.headers.get('x-cinetpay-signature') ||
      '';

    const secret =
      process.env.MOMO_WEBHOOK_SECRET?.trim() ||
      process.env.PAYSTACK_SECRET_KEY?.trim();

    if (!secret) {
      console.error('Webhook secret non configuré');
      return NextResponse.json({ error: 'Configuration webhook absente' }, { status: 500 });
    }

    // Verify HMAC SHA-256 or SHA-512 signature using constant-time comparison
    let isValid = false;
    try {
      const expectedSha256 = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
      const expectedSha512 = crypto.createHmac('sha512', secret).update(rawBody).digest('hex');

      const sigBuf = Buffer.from(signature, 'hex');
      const expBuf256 = Buffer.from(expectedSha256, 'hex');
      const expBuf512 = Buffer.from(expectedSha512, 'hex');

      if (sigBuf.length === expBuf256.length && crypto.timingSafeEqual(sigBuf, expBuf256)) {
        isValid = true;
      } else if (sigBuf.length === expBuf512.length && crypto.timingSafeEqual(sigBuf, expBuf512)) {
        isValid = true;
      }
    } catch {
      isValid = false;
    }

    if (!isValid) {
      return NextResponse.json({ error: 'Signature invalide' }, { status: 401 });
    }

    const event = JSON.parse(rawBody);
    const rawTxId = event.transactionId || event.data?.reference || event.reference;
    if (!rawTxId || typeof rawTxId !== 'string' || rawTxId.length > 128) {
      return NextResponse.json({ error: 'Identifiant de transaction invalide' }, { status: 400 });
    }
    const transactionId = rawTxId.trim();
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(transactionId);
    const status = event.status === 'successful' || event.event === 'charge.success' ? 'successful' : 'failed';

    const supabase = getAdminSupabase();
    if (!supabase) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
    }

    // [STRIX-06 Fix]: Parameterized .eq() lookup instead of string-interpolated .or()
    let query = supabase
      .from('mobile_money_transactions')
      .update({
        status,
        verified_at: new Date().toISOString(),
      });

    query = isUuid ? query.eq('id', transactionId) : query.eq('transaction_ref', transactionId);

    const { data: tx, error: txError } = await query
      .eq('status', 'pending')
      .select('id, status, plan, workspace_id, currency, amount, updated_at')
      .maybeSingle();

    if (txError) {
      console.error('Error updating webhook transaction:', txError);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    // Already processed or not found
    if (!tx) {
      return NextResponse.json({ received: true, idempotent: true });
    }

    // On successful payment, activate workspace plan
    if (status === 'successful') {
      const plan = tx.plan || 'pro';
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

      await supabase.from('subscriptions').insert({
        workspace_id: tx.workspace_id,
        plan,
        status: 'active',
        currency: tx.currency || 'XOF',
        amount: tx.amount,
        billing_cycle: 'monthly',
        expires_at: expiresAt,
      });

      await supabase.from('workspaces').update({ plan }).eq('id', tx.workspace_id);
    }

    return NextResponse.json({ received: true, status });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur interne webhook';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
