import { NextRequest, NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/supabase';
import { verifySignedSession } from '@/lib/auth-crypto';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const supabase = getAdminSupabase();
    let userId: string | null = null;
    let userEmail: string = '';
    let userRole: string = 'client';
    let userFullName: string = '';
    let userWorkspaceId: string | undefined;
    let isLifetimeFree: boolean = false;

    // 1. Try cryptographic session cookie
    const sessionCookie = req.cookies.get('pulsesocial_session')?.value;
    if (sessionCookie) {
      const decoded = verifySignedSession(sessionCookie);
      if (decoded && (decoded.id || decoded.userId)) {
        userId = decoded.id || decoded.userId;
        userEmail = decoded.email || '';
        userRole = decoded.role || 'client';
        userFullName = decoded.fullName || '';
        userWorkspaceId = decoded.workspaceId || decoded.workspace_id;
        isLifetimeFree = !!(decoded.isLifetimeFree ?? decoded.is_lifetime_free);
      }
    }

    // 2. Try Authorization: Bearer
    if (!userId) {
      const authHeader = req.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.slice(7).trim();
        const decoded = verifySignedSession(token);
        if (decoded && (decoded.id || decoded.userId)) {
          userId = decoded.id || decoded.userId;
          userEmail = decoded.email || '';
          userRole = decoded.role || 'client';
          userFullName = decoded.fullName || '';
          userWorkspaceId = decoded.workspaceId || decoded.workspace_id;
          isLifetimeFree = !!(decoded.isLifetimeFree ?? decoded.is_lifetime_free);
        } else if (supabase) {
          const { data: authData } = await supabase.auth.getUser(token);
          if (authData?.user) {
            userId = authData.user.id;
            userEmail = authData.user.email || '';
          }
        }
      }
    }

    // 3. Try Supabase session cookies (sb-*-auth-token)
    if (!userId && supabase) {
      for (const cookie of req.cookies.getAll()) {
        if (cookie.name.startsWith('sb-') && cookie.name.endsWith('-auth-token')) {
          try {
            let val = cookie.value;
            if (val.startsWith('base64-')) {
              val = Buffer.from(val.slice(7), 'base64').toString('utf-8');
            }
            const parsed = JSON.parse(val);
            const accessToken = typeof parsed === 'string'
              ? parsed
              : Array.isArray(parsed)
              ? parsed[0]
              : parsed?.access_token;
            if (accessToken) {
              const { data: authData } = await supabase.auth.getUser(accessToken);
              if (authData?.user) {
                userId = authData.user.id;
                userEmail = authData.user.email || '';
                break;
              }
            }
          } catch {
            // ignore
          }
        }
      }
    }

    if (!userId) {
      return NextResponse.json({ authenticated: false, user: null });
    }

    // 4. Fetch or sync freshest user profile from database
    if (supabase) {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('id, email, full_name, role, is_lifetime_free, workspace_id, avatar_url, workspaces(id, name, slug)')
        .eq('id', userId)
        .maybeSingle();

      if (profile) {
        let workspace: any = profile.workspaces;
        let wsId = profile.workspace_id;

        // Auto-assign default workspace if user has none
        if (!wsId) {
          const { data: defaultWs } = await supabase.from('workspaces').select('id, name, slug').limit(1).maybeSingle();
          if (defaultWs) {
            workspace = defaultWs;
            wsId = defaultWs.id;
            await supabase.from('user_profiles').update({ workspace_id: defaultWs.id }).eq('id', profile.id);
          }
        }

        return NextResponse.json({
          authenticated: true,
          user: {
            id: profile.id,
            email: profile.email,
            fullName: profile.full_name || userFullName || 'Utilisateur',
            role: profile.role || userRole,
            isLifetimeFree: profile.is_lifetime_free ?? isLifetimeFree,
            workspace: workspace || { id: wsId, name: 'Pulse Social Studio' },
            workspaceId: wsId,
          },
        });
      }
    }

    // Fallback if DB profile lookup is empty or offline
    return NextResponse.json({
      authenticated: true,
      user: {
        id: userId,
        email: userEmail,
        fullName: userFullName || userEmail.split('@')[0] || 'Utilisateur Pulse',
        role: userRole,
        isLifetimeFree,
        workspaceId: userWorkspaceId,
        workspace: { id: userWorkspaceId, name: 'Pulse Social Studio' },
      },
    });
  } catch (err) {
    return NextResponse.json({ authenticated: false, user: null });
  }
}
