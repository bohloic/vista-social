import { NextRequest, NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/supabase';
import { createSignedSession } from '@/lib/auth-crypto';

export const dynamic = 'force-dynamic';

const ADMIN_EMAILS = process.env.ADMIN_EMAILS
  ? process.env.ADMIN_EMAILS.split(',').map((e) => e.trim().toLowerCase())
  : [];

const isAdminEmail = (e: string) => {
  const clean = e.toLowerCase().trim();
  return ADMIN_EMAILS.some((adm) => clean === adm.toLowerCase().trim());
};

async function resolveOrCreateGoogleUser(email: string, fullName: string, avatarUrl?: string) {
  const cleanEmail = email.toLowerCase().trim();
  const supabase = getAdminSupabase();

  const isAdmin = isAdminEmail(cleanEmail);
  const defaultRole = isAdmin ? 'super_admin' : 'client';
  const isLifetimeFree = isAdmin;
  const initialPlan = isAdmin ? 'agency' : 'starter';

  let userRecord = {
    id: `google-${Date.now()}`,
    email: cleanEmail,
    fullName: fullName || cleanEmail.split('@')[0],
    role: defaultRole,
    isLifetimeFree,
    workspaceId: 'ws-default',
    workspaceName: 'Mon Espace PulseSocial',
    avatarUrl: avatarUrl || '',
  };

  if (supabase) {
    try {
      // 1. Check if user profile already exists
      const { data: existingProfile } = await supabase
        .from('user_profiles')
        .select('id, email, full_name, role, is_lifetime_free, workspace_id, avatar_url, workspaces(name)')
        .eq('email', cleanEmail)
        .maybeSingle();

      if (existingProfile) {
        const wsObj = existingProfile.workspaces as any;
        const wsName = (Array.isArray(wsObj) ? wsObj[0]?.name : wsObj?.name) || 'Mon Espace PulseSocial';
        userRecord = {
          id: existingProfile.id,
          email: existingProfile.email,
          fullName: existingProfile.full_name || fullName,
          role: existingProfile.role || defaultRole,
          isLifetimeFree: existingProfile.is_lifetime_free ?? isLifetimeFree,
          workspaceId: existingProfile.workspace_id || 'ws-default',
          workspaceName: wsName,
          avatarUrl: existingProfile.avatar_url || avatarUrl || '',
        };
      } else {
        // 2. Ensure a workspace exists
        let wsId: string | undefined;
        let wsName = 'Mon Espace PulseSocial';
        const { data: existingWs } = await supabase
          .from('workspaces')
          .select('id, name')
          .limit(1)
          .maybeSingle();

        if (existingWs?.id) {
          wsId = existingWs.id;
          wsName = existingWs.name;
        } else {
          const { data: createdWs } = await supabase
            .from('workspaces')
            .insert({
              name: `Espace ${fullName || 'PulseSocial'}`,
              slug: `ws-${Date.now()}`,
              plan: initialPlan,
            })
            .select('id, name')
            .single();
          wsId = createdWs?.id;
          if (createdWs?.name) wsName = createdWs.name;
        }

        // 3. Create user profile in Supabase with standard client role if not admin
        const { data: createdUser } = await supabase
          .from('user_profiles')
          .insert({
            email: cleanEmail,
            full_name: fullName || cleanEmail.split('@')[0],
            role: defaultRole,
            is_lifetime_free: isLifetimeFree,
            workspace_id: wsId,
            avatar_url: avatarUrl || null,
          })
          .select('id, email, full_name, role, is_lifetime_free, workspace_id, avatar_url')
          .single();

        if (createdUser) {
          userRecord = {
            id: createdUser.id,
            email: createdUser.email,
            fullName: createdUser.full_name,
            role: createdUser.role,
            isLifetimeFree: createdUser.is_lifetime_free,
            workspaceId: createdUser.workspace_id || wsId || 'ws-default',
            workspaceName: wsName,
            avatarUrl: createdUser.avatar_url || '',
          };
        }
      }
    } catch {
      // Fallback to local session if Supabase table isn't migrated yet
    }
  }

  return userRecord;
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const popup = url.searchParams.get('popup') === '1';
    const emailParam = url.searchParams.get('email');
    const nameParam = url.searchParams.get('name');

    if (!code && !emailParam) {
      return NextResponse.redirect(new URL('/login?error=auth_cancelled', req.url));
    }

    let email = emailParam || '';
    let fullName = nameParam || '';
    let avatarUrl = '';

    if (code) {
      const supabase = getAdminSupabase();
      if (supabase) {
        const { data } = await supabase.auth.exchangeCodeForSession(code);
        if (data?.user?.email) {
          email = data.user.email;
          fullName =
            data.user.user_metadata?.full_name ||
            data.user.user_metadata?.name ||
            email.split('@')[0];
          avatarUrl = data.user.user_metadata?.avatar_url || '';
        }
      }
    }

    const userRecord = await resolveOrCreateGoogleUser(email, fullName, avatarUrl);

    const sessionToken = createSignedSession({
      id: userRecord.id,
      email: userRecord.email,
      role: userRecord.role,
      workspaceId: userRecord.workspaceId,
      authProvider: 'google',
      exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
    });

    if (popup) {
      const html = `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"><title>Authentification Google réussie</title></head>
<body style="background:#07090E;color:#fff;font-family:system-ui;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">
  <div style="text-align:center;">
    <p style="font-size:14px;color:#34d399;font-weight:bold;">✓ Connexion Google validée. Redirection en cours...</p>
  </div>
  <script>
    try {
      if (window.opener) {
        window.opener.postMessage({
          type: 'GOOGLE_AUTH_SUCCESS',
          user: ${JSON.stringify(userRecord)}
        }, '*');
      }
    } catch (e) {}
    setTimeout(() => window.close(), 300);
  </script>
</body>
</html>`;
      const res = new NextResponse(html, {
        status: 200,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
      res.cookies.set('pulsesocial_session', sessionToken, {
        httpOnly: true,
        path: '/',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60,
      });
      return res;
    }

    const redirectRes = NextResponse.redirect(new URL('/', req.url));
    redirectRes.cookies.set('pulsesocial_session', sessionToken, {
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
    });
    return redirectRes;
  } catch {
    return NextResponse.redirect(new URL('/login?error=google_oauth_failed', req.url));
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body?.email || typeof body.email !== 'string') {
      return NextResponse.json({ success: false, error: 'Email requis pour la validation.' }, { status: 400 });
    }
    const email = body.email.trim().toLowerCase();
    const fullName = body.name || email.split('@')[0];
    const avatarUrl = body.avatarUrl || '';

    const userRecord = await resolveOrCreateGoogleUser(email, fullName, avatarUrl);

    const sessionToken = createSignedSession({
      id: userRecord.id,
      email: userRecord.email,
      role: userRecord.role,
      workspaceId: userRecord.workspaceId,
      authProvider: 'google',
      exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
    });

    const res = NextResponse.json({
      success: true,
      user: userRecord,
    });

    res.cookies.set('pulsesocial_session', sessionToken, {
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
    });

    return res;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur callback Google';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
