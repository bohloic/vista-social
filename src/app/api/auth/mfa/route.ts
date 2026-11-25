import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireUser, handleApiError } from '@/lib/security/guards';
import { createSignedSession, verifySignedSession } from '@/lib/auth-crypto';
import { encryptToken, decryptToken } from '@/lib/security/encryption';
import { generateTotpSecret, verifyTotpCode, buildTotpQrSvg } from '@/lib/totp';

export const dynamic = 'force-dynamic';

interface StoredFactor {
  id: string;
  userId: string;
  friendly_name: string;
  factor_type: 'totp';
  status: 'unverified' | 'verified';
  encryptedSecret: string;
  created_at: string;
  updated_at: string;
}

// In-memory store synchronized with encrypted HttpOnly cookie for serverless/edge resilience
const mfaFactorsByUser = new Map<string, StoredFactor[]>();

function loadUserFactors(req: NextRequest, userId: string): StoredFactor[] {
  const fromMemory = mfaFactorsByUser.get(userId) || [];
  const cookieVal = req.cookies.get('pulsesocial_mfa_factors')?.value;
  if (cookieVal) {
    const verified = verifySignedSession(cookieVal);
    if (verified && verified.userId === userId && Array.isArray(verified.factors)) {
      const merged = verified.factors as StoredFactor[];
      mfaFactorsByUser.set(userId, merged);
      return merged;
    }
  }
  return fromMemory;
}

function saveUserFactorsToCookie(res: NextResponse, userId: string, factors: StoredFactor[]) {
  mfaFactorsByUser.set(userId, factors);
  const signed = createSignedSession({
    userId,
    factors,
    exp: Date.now() + 30 * 24 * 60 * 60 * 1000,
  });
  res.cookies.set('pulsesocial_mfa_factors', signed, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 30 * 24 * 60 * 60,
  });
}

const mfaActionSchema = z
  .object({
    action: z.enum(['enroll', 'challenge', 'verify', 'unenroll', 'list']),
    factorType: z.enum(['totp']).default('totp'),
    friendlyName: z.string().max(100).optional(),
    factorId: z.string().max(128).optional(),
    challengeId: z.string().max(128).optional(),
    code: z.string().max(12).optional(),
  })
  .strict();

export async function GET(req: NextRequest) {
  try {
    const { user } = await requireUser(req);
    const factors = loadUserFactors(req, user.id);
    const verifiedFactors = factors.filter((f) => f.status === 'verified');

    const sessionCookie = req.cookies.get('pulsesocial_session')?.value;
    const decodedSession = sessionCookie ? verifySignedSession(sessionCookie) : null;
    const currentAal = decodedSession?.aal === 'aal2' ? 'aal2' : 'aal1';
    const nextAal = verifiedFactors.length > 0 ? 'aal2' : 'aal1';

    return NextResponse.json({
      success: true,
      currentLevel: currentAal,
      nextLevel: nextAal,
      requiresMfaPolicy: user.role === 'super_admin' || user.role === 'admin',
      factors: factors.map((f) => ({
        id: f.id,
        friendly_name: f.friendly_name,
        factor_type: f.factor_type,
        status: f.status,
        created_at: f.created_at,
        updated_at: f.updated_at,
      })),
    });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user } = await requireUser(req);
    const body = await req.json();
    const parsed = mfaActionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || 'Requête MFA invalide' },
        { status: 422 }
      );
    }

    const { action, friendlyName, factorId, code } = parsed.data;
    const factors = loadUserFactors(req, user.id);

    // 1. Enroll TOTP Factor
    if (action === 'enroll') {
      const secret = generateTotpSecret();
      const issuer = 'PulseSocial PRO';
      const label = encodeURIComponent(`${issuer}:${user.email}`);
      const uri = `otpauth://totp/${label}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;
      const svgQr = buildTotpQrSvg(uri, secret);
      const now = new Date().toISOString();
      const newFactorId = `totp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

      const newFactor: StoredFactor = {
        id: newFactorId,
        userId: user.id,
        friendly_name: friendlyName || 'PulseSocial Authenticator',
        factor_type: 'totp',
        status: 'unverified',
        encryptedSecret: encryptToken(secret),
        created_at: now,
        updated_at: now,
      };

      const updatedFactors = [...factors.filter((f) => f.status === 'verified'), newFactor];
      const res = NextResponse.json({
        success: true,
        id: newFactorId,
        type: 'totp',
        friendly_name: newFactor.friendly_name,
        totp: {
          qr_code: svgQr,
          secret,
          uri,
        },
      });

      saveUserFactorsToCookie(res, user.id, updatedFactors);
      return res;
    }

    // 2. Challenge TOTP Factor
    if (action === 'challenge') {
      const target = factorId ? factors.find((f) => f.id === factorId) : factors[factors.length - 1];
      if (!target) {
        return NextResponse.json({ success: false, error: 'Facteur TOTP introuvable' }, { status: 404 });
      }
      return NextResponse.json({
        success: true,
        id: `chl_${Date.now()}`,
        factor_id: target.id,
        expires_at: Math.floor(Date.now() / 1000) + 300,
      });
    }

    // 3. Verify TOTP Code & Elevate Session to AAL2
    if (action === 'verify') {
      const target = factorId ? factors.find((f) => f.id === factorId) : factors[factors.length - 1];
      if (!target) {
        return NextResponse.json({ success: false, error: 'Aucun facteur TOTP à vérifier' }, { status: 404 });
      }

      if (!code || !/^\d{6}$/.test(code.trim())) {
        return NextResponse.json(
          { success: false, error: 'Le code TOTP doit comporter exactement 6 chiffres.' },
          { status: 422 }
        );
      }

      const rawSecret = decryptToken(target.encryptedSecret);
      const isValid = verifyTotpCode(rawSecret, code.trim(), 1);
      if (!isValid) {
        return NextResponse.json(
          { success: false, error: 'Code Authenticator invalide ou expiré.' },
          { status: 401 }
        );
      }

      target.status = 'verified';
      target.updated_at = new Date().toISOString();

      // Upgrade session cookie to AAL2
      const upgradedSession = createSignedSession({
        id: user.id,
        userId: user.id,
        email: user.email,
        role: user.role,
        workspaceId: user.workspaceId || user.workspace_id,
        isLifetimeFree: user.isLifetimeFree,
        aal: 'aal2',
        mfaVerified: true,
        exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
      });

      const res = NextResponse.json({
        success: true,
        aal: 'aal2',
        currentLevel: 'aal2',
        nextLevel: 'aal2',
        factor: {
          id: target.id,
          friendly_name: target.friendly_name,
          status: target.status,
        },
        message: 'Authentification multifacteur (AAL2) validée avec succès.',
      });

      res.cookies.set('pulsesocial_session', upgradedSession, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60,
      });
      saveUserFactorsToCookie(res, user.id, factors);
      return res;
    }

    // 4. Unenroll TOTP Factor
    if (action === 'unenroll') {
      const remaining = factorId ? factors.filter((f) => f.id !== factorId) : [];
      const downgradedSession = createSignedSession({
        id: user.id,
        userId: user.id,
        email: user.email,
        role: user.role,
        workspaceId: user.workspaceId || user.workspace_id,
        isLifetimeFree: user.isLifetimeFree,
        aal: 'aal1',
        mfaVerified: false,
        exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
      });

      const res = NextResponse.json({
        success: true,
        aal: 'aal1',
        message: 'Facteur MFA TOTP désactivé et session actualisée.',
      });

      res.cookies.set('pulsesocial_session', downgradedSession, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60,
      });
      saveUserFactorsToCookie(res, user.id, remaining);
      return res;
    }

    return NextResponse.json({
      success: true,
      factors: factors.map((f) => ({
        id: f.id,
        friendly_name: f.friendly_name,
        factor_type: f.factor_type,
        status: f.status,
      })),
    });
  } catch (err) {
    return handleApiError(err);
  }
}
