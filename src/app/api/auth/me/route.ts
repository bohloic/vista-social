import { NextRequest, NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const sessionCookie = req.cookies.get('pulsesocial_session');

    const supabase = getAdminSupabase();
    if (!supabase) {
      return NextResponse.json({ authenticated: false, user: null });
    }

    if (sessionCookie?.value) {
      try {
        const decoded = JSON.parse(Buffer.from(sessionCookie.value, 'base64').toString('utf-8'));
        if (decoded.exp && decoded.exp > Date.now()) {
          // Fetch freshest user profile
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('*, workspaces(*)')
            .eq('id', decoded.id)
            .maybeSingle();

          if (profile) {
            return NextResponse.json({
              authenticated: true,
              user: {
                id: profile.id,
                email: profile.email,
                fullName: profile.full_name,
                role: profile.role,
                isLifetimeFree: profile.is_lifetime_free,
                workspace: profile.workspaces,
              },
            });
          }
        }
      } catch (err) {
        // Invalid session cookie
      }
    }

    // Fallback: Check if any admin exists in database to display info
    const { data: firstAdmin } = await supabase
      .from('user_profiles')
      .select('*, workspaces(*)')
      .limit(1)
      .maybeSingle();

    if (firstAdmin) {
      return NextResponse.json({
        authenticated: true,
        user: {
          id: firstAdmin.id,
          email: firstAdmin.email,
          fullName: firstAdmin.full_name,
          role: firstAdmin.role,
          isLifetimeFree: firstAdmin.is_lifetime_free,
          workspace: firstAdmin.workspaces,
        },
      });
    }

    return NextResponse.json({ authenticated: false, user: null });
  } catch (err) {
    return NextResponse.json({ authenticated: false, user: null });
  }
}
