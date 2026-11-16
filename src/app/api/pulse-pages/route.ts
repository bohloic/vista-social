import { NextRequest, NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/supabase';
import { z } from 'zod';

const pulsePageSaveSchema = z.object({
  id: z.string().optional(),
  workspace_id: z.string().default('ws-default'),
  title: z.string().min(1, 'Le titre est requis'),
  slug: z.string().min(1, 'Le slug est requis'),
  bio: z.string().default(''),
  avatar_url: z.string().default(''),
  theme_config: z.record(z.any()).default({}),
  blocks: z.array(z.record(z.any())).default([]),
});

export async function GET() {
  try {
    const supabase = getAdminSupabase();
    if (!supabase) {
      return NextResponse.json({ success: true, page: null });
    }

    const { data, error } = await supabase
      .from('pulse_pages')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, page: data });
  } catch (err) {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = pulsePageSaveSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, errors: parsed.error.issues },
        { status: 400 }
      );
    }

    const supabase = getAdminSupabase();
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Database not configured' },
        { status: 503 }
      );
    }

    const { id, ...pageData } = parsed.data;

    if (id) {
      const { data, error } = await supabase
        .from('pulse_pages')
        .upsert({ id, ...pageData, updated_at: new Date().toISOString() })
        .select()
        .single();

      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }
      return NextResponse.json({ success: true, page: data });
    } else {
      const { data, error } = await supabase
        .from('pulse_pages')
        .insert({ ...pageData, updated_at: new Date().toISOString() })
        .select()
        .single();

      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }
      return NextResponse.json({ success: true, page: data });
    }
  } catch (err) {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
