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
            workspaceId: wsId || 'ws-default',
            workspaceName: wsName,
            avatarUrl: createdUser.avatar_url || '',
          };
        }
      }
    } catch (e) {
      console.warn('Database user sync fallback:', e);
    }
  }

  return userRecord;
}

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.COMPOSIO_API_KEY?.trim();
    let detectedEmail = '';
    let detectedName = '';

    if (apiKey && apiKey.length > 8) {
      try {
        const mcpRes = await fetch('https://connect.composio.dev/mcp', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json, text/event-stream',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'tools/call',
            params: {
              name: 'COMPOSIO_MANAGE_CONNECTIONS',
              arguments: {
                toolkits: ['gmail'],
              },
            },
            id: Date.now(),
          }),
          signal: AbortSignal.timeout(8000),
        });

        if (mcpRes.ok) {
          const mcpText = await mcpRes.text();
          for (const line of mcpText.split('\n')) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                const resText = data?.result?.content?.[0]?.text;
                if (resText) {
                  const parsed = JSON.parse(resText);
                  const gmailData = parsed?.data?.results?.['gmail'];
                  const accounts = gmailData?.accounts || [];
                  const activeAcc = accounts.find((a: any) => a.status === 'active' || a.status === 'connected') || accounts[0];
                  if (activeAcc) {
                    if (activeAcc.email) detectedEmail = activeAcc.email;
                    if (activeAcc.name) detectedName = activeAcc.name;
                  }
                }
              } catch {
                // Ignore chunk parse error
              }
            }
          }
        }
      } catch (err) {
        console.warn('Composio connection check warning:', err);
      }
    }

    // If no active Google / Composio connection was detected, reject with 401
    if (!detectedEmail) {
      return NextResponse.json(
        {
          success: false,
          error: 'Aucune session Google active détectée. Veuillez vous authentifier.',
        },
        { status: 401 }
      );
    }

    const userRecord = await resolveOrCreateGoogleUser(detectedEmail, detectedName);

    // Sign session cookie
    const signedToken = createSignedSession({
      userId: userRecord.id,
      email: userRecord.email,
      role: userRecord.role,
      workspaceId: userRecord.workspaceId,
    });

    const res = NextResponse.json({
      success: true,
      user: userRecord,
    });

    res.cookies.set({
      name: 'pulsesocial_session',
      value: signedToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return res;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur de vérification Google';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
