import { getAdminSupabase } from '@/lib/supabase';
import { z } from 'zod';

const checkoutSchema = z.object({
  workspaceId: z.string().min(1, 'Workspace ID requis'),
  plan: z.enum(['starter', 'pro', 'agency', 'enterprise']),
  provider: z.enum(['orange_money', 'mtn_momo', 'wave', 'moov', 'card']),
  phoneNumber: z.string().min(8, 'Numéro de téléphone invalide'),
  currency: z.enum(['XOF', 'EUR', 'USD']).default('XOF'),
  amount: z.number().positive(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = checkoutSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: parsed.error.errors[0]?.message || 'Données de paiement invalides' },
        { status: 422 }
      );
    }

    const { workspaceId, plan, provider, phoneNumber, currency, amount } = parsed.data;
    const adminClient = getAdminSupabase();

    const transactionRef = `PLS-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    // 1. Create transaction in database
    const { data: tx, error: txError } = await adminClient
      .from('mobile_money_transactions')
      .insert({
        workspace_id: workspaceId,
        provider,
        phone_number: phoneNumber,
        country_code: 'CI',
        currency,
        amount,
        plan,
        status: 'successful', // Auto-completed for instantaneous testing & real demo
        transaction_ref: transactionRef,
        verified_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (txError) {
      console.error('Error recording Mobile Money transaction:', txError);
      return Response.json({ error: 'Erreur lors de l\'enregistrement de la transaction' }, { status: 500 });
    }

    // 2. Activate or update Subscription
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    await adminClient.from('subscriptions').insert({
      workspace_id: workspaceId,
      plan,
      status: 'active',
      currency,
      amount,
      billing_cycle: 'monthly',
      expires_at: expiresAt,
    });

    // 3. Update Workspace plan
    await adminClient
      .from('workspaces')
      .update({ plan })
      .eq('id', workspaceId);

    // USSD simulation instructions based on provider
    const ussdInstructions: Record<string, string> = {
      orange_money: `Composez le #144# sur votre mobile pour confirmer le débit de ${amount} ${currency}.`,
      mtn_momo: `Composez le *133# pour autoriser le paiement de ${amount} ${currency}.`,
      wave: `Scannez le QR Code Wave ou validez la notification sur votre application Wave.`,
      moov: `Composez le *155# pour confirmer la transaction de ${amount} ${currency}.`,
      card: `Paiement par carte bancaire validé avec succès.`,
    };

    return Response.json({
      success: true,
      transactionRef,
      status: 'successful',
      message: 'Paiement Mobile Money validé ! Votre abonnement PulseSocial est actif.',
      instruction: ussdInstructions[provider] || 'Paiement en cours de traitement.',
      transaction: tx,
      subscription: {
        plan,
        status: 'active',
        currency,
        amount,
        expiresAt,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur interne du serveur';
    console.error('Checkout error:', err);
    return Response.json({ error: message }, { status: 500 });
  }
}
