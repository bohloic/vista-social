import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireUser, requireWorkspaceRole, handleApiError, ApiError } from '@/lib/security/guards';
import { checkRateLimit } from '@/lib/security/rate-limit';

export const dynamic = 'force-dynamic';

const checkoutSchema = z
  .object({
    workspaceId: z.string().uuid('workspaceId doit être un UUID valide'),
    plan: z.enum(['starter', 'pro', 'agency', 'enterprise']),
    provider: z.enum(['orange_money', 'mtn_momo', 'wave', 'moov', 'card']),
    phoneNumber: z.string().min(8, 'Numéro de téléphone invalide').max(20),
    currency: z.enum(['XOF', 'EUR', 'USD']).default('XOF'),
    amount: z.number().positive('Le montant doit être supérieur à zéro'),
  })
  .strict();

export async function POST(req: NextRequest) {
  try {
    const { user, supabase } = await requireUser(req);

    // Rate limiting: max 5 checkout requests/min per user [M6]
    checkRateLimit(`billing:${user.id}`, 5, 60_000);

    const body = await req.json();
    const validated = checkoutSchema.parse(body);

    // Restrict checkout initialization to admin and super_admin [M2, Phase 2]
    await requireWorkspaceRole(
      supabase,
      user.id,
      validated.workspaceId,
      ['super_admin', 'admin'],
      user.role
    );

    const transactionRef = `PLS-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    if (!supabase) {
      return NextResponse.json({
        success: true,
        transactionRef,
        status: 'pending',
        message: 'Demande de paiement enregistrée en mode test',
      });
    }

    const { data: tx, error: txError } = await supabase
      .from('mobile_money_transactions')
      .insert({
        workspace_id: validated.workspaceId,
        provider: validated.provider,
        phone_number: validated.phoneNumber,
        country_code: 'CI',
        currency: validated.currency,
        amount: validated.amount,
        plan: validated.plan,
        status: 'pending',
        transaction_ref: transactionRef,
      })
      .select()
      .single();

    if (txError) {
      throw new ApiError(500, 'TRANSACTION_CREATION_FAILED', 'Impossible de créer la transaction');
    }

    return NextResponse.json({
      success: true,
      transactionRef,
      status: 'pending',
      transaction: tx,
      paymentUrl: `https://pay.pulsesocial.ci/checkout?ref=${encodeURIComponent(transactionRef)}`,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
