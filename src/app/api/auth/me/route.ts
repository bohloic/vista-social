import { NextRequest, NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/supabase';
import { verifySignedSession } from '@/lib/auth-crypto';

export async function GET(req: NextRequest) {
  try {
    const sessionCookie = req.cookies.get('pulsesocial_session');

    if (!sessionCookie?.value) {
      return NextResponse.json({ authenticated: false, user: null });
    }

    const decoded = verifySignedSession(sessionCookie.value);
    if (!decoded || !decoded.id) {
      return NextResponse.json({ authenticated: false, user: null });
    }

    const supabase = getAdminSupabase();
    if (!supabase) {
      return NextResponse.json({ authenticated: false, user: null });
    }

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

    return NextResponse.json({ authenticated: false, user: null });
  } catch (err) {
    return NextResponse.json({ authenticated: false, user: null });
  }
}
