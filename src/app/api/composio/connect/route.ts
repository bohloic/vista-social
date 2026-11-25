import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireUser, requireWorkspaceRole, handleApiError } from '@/lib/security/guards';
import { checkRateLimit, getClientIp } from '@/lib/security/rate-limit';
import {
  ComposioApiError,
  buildComposioCallbackUrl,
  createComposioConnectLink,
  normalizePlatformAndToolkit,
  resolveAppOrigin,
  sanitizeNextPath,
} from '@/lib/composio';

export const dynamic = 'force-dynamic';

const isUuid = (val?: string) =>
  typeof val === 'string' &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);

const connectBodySchema = z
  .object({
    toolkit: z.string().min(1).max(64).optional(),
    platform: z.string().min(1).max(64).optional(),
    next: z.string().max(256).optional(),
    authConfigId: z.string().max(128).optional(),
    workspaceId: z.string().max(64).optional(),
  })
  .strict()
  .refine((data) => Boolean(data.toolkit || data.platform), {
    message: 'Un paramètre toolkit ou platform est requis.',
  });

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser(req);
    const ip = getClientIp(req);
    const rl = checkRateLimit(`composio_connect:${user.id}:${ip}`, {
      maxTokens: 20,
      refillRate: 2,
    });
    if (!rl.allowed) {
      return NextResponse.json(
        { success: false, error: 'Trop de requêtes, veuillez patienter.', retryAfter: rl.retryAfter },
        { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } }
      );
    }

    const body = await req.json();
    const parsed = connectBodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: parsed.error.issues[0]?.message || 'Paramètres de connexion invalides.',
        },
        { status: 422 }
      );
    }

    const requestedWsId = parsed.data.workspaceId;
    const workspaceId =
      (requestedWsId && isUuid(requestedWsId) ? requestedWsId : undefined) ||
      user.workspaceId ||
      user.workspace_id;

    if (workspaceId && isUuid(workspaceId)) {
      await requireWorkspaceRole(
        user.id,
        workspaceId,
        ['super_admin', 'admin', 'manager', 'editor'],
        user.role
      );
    }

    const targetInput = parsed.data.platform || parsed.data.toolkit || '';
    const normalized = normalizePlatformAndToolkit(targetInput);
    if (!normalized) {
      return NextResponse.json(
        { success: false, error: `Réseau ou toolkit non supporté : ${targetInput}` },
        { status: 400 }
      );
    }

    const origin = resolveAppOrigin(req);
    const safeNext = sanitizeNextPath(parsed.data.next, '/settings');
    const callbackUrl = buildComposioCallbackUrl(origin, {
      next: safeNext,
      toolkit: normalized.toolkitSlug,
      platform: normalized.platform,
    });

    // Multi-tenant Connect Link bound strictly to authenticated Supabase user.id
    const linkResult = await createComposioConnectLink({
      userId: user.id,
      platformOrToolkit: normalized.platform,
      callbackUrl,
      authConfigIdOverride: parsed.data.authConfigId,
    });

    return NextResponse.json({
      success: true,
      redirectUrl: linkResult.redirectUrl,
      connectedAccountId: linkResult.connectedAccountId,
      toolkit: linkResult.toolkitSlug,
      platform: linkResult.platform,
      callbackUrl,
    });
  } catch (err: unknown) {
    if (err instanceof ComposioApiError) {
      return NextResponse.json(
        { success: false, error: err.message, code: err.code },
        { status: err.status }
      );
    }
    return handleApiError(err);
  }
}
