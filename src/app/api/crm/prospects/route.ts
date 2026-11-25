import crypto from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAdminSupabase } from '@/lib/supabase';
import { requireUser, requireWorkspaceRole, ApiError, handleApiError } from '@/lib/security/guards';
import { checkRateLimit, getClientIp } from '@/lib/security/rate-limit';
import { CRMProspect, CRMStage, SocialPlatform } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isUuid = (val?: string | null): val is string => Boolean(val && UUID_REGEX.test(val));

const PLATFORMS = [
  'instagram',
  'facebook',
  'twitter',
  'linkedin',
  'tiktok',
  'youtube',
  'pinterest',
  'threads',
  'google_business',
  'whatsapp',
] as const;

const createProspectSchema = z
  .object({
    name: z.string().trim().min(1, 'Le nom du prospect est requis').max(120),
    platform: z.enum(PLATFORMS).default('whatsapp'),
    handle: z.string().trim().max(120).default('@prospect'),
    deal_value: z.coerce.number().min(0, 'Valeur invalide').default(0),
    currency: z.string().trim().max(10).default('FCFA'),
    status: z.enum(['lead', 'contacted', 'proposal', 'won']).default('lead'),
    lead_score: z.coerce.number().min(0).max(100).default(85),
    notes: z.string().max(2000).optional(),
    phone: z.string().max(40).optional(),
    avatar_url: z.string().max(500).optional(),
    inbox_conversation_id: z.string().max(120).optional(),
  })
  .strict();

const updateProspectSchema = z
  .object({
    id: z.string().uuid('Identifiant prospect UUID invalide'),
    status: z.enum(['lead', 'contacted', 'proposal', 'won']).optional(),
    deal_value: z.coerce.number().min(0).optional(),
    notes: z.string().max(2000).optional(),
    name: z.string().trim().min(1).max(120).optional(),
  })
  .strict();

function toDbStatus(stage: CRMStage): 'new' | 'contacted' | 'proposal' | 'won' {
  if (stage === 'lead') return 'new';
  return stage;
}

function fromDbStatus(dbStatus?: string | null): CRMStage {
  if (dbStatus === 'contacted' || dbStatus === 'proposal' || dbStatus === 'won') {
    return dbStatus;
  }
  return 'lead';
}

function encodeContactNotes(rawNotes: string | undefined, leadScore: number, convId?: string): string {
  const clean = (rawNotes || '')
    .replace(/\s*\[score:\d+\]/g, '')
    .replace(/\s*\[conv:[^\]]+\]/g, '')
    .trim();
  const tags = [`[score:${Math.min(100, Math.max(0, Math.round(leadScore)))}]`];
  if (convId) tags.push(`[conv:${convId}]`);
  return `${clean} ${tags.join(' ')}`.trim();
}

function parseContactNotes(storedNotes?: string | null): {
  notes: string;
  lead_score: number;
  inbox_conversation_id?: string;
} {
  const raw = storedNotes || '';
  const scoreMatch = raw.match(/\[score:(\d+)\]/);
  const convMatch = raw.match(/\[conv:([^\]]+)\]/);
  const notes = raw
    .replace(/\s*\[score:\d+\]/g, '')
    .replace(/\s*\[conv:[^\]]+\]/g, '')
    .trim();
  return {
    notes,
    lead_score: scoreMatch ? Math.min(100, Math.max(0, Number(scoreMatch[1]))) : 85,
    inbox_conversation_id: convMatch ? convMatch[1] : undefined,
  };
}

async function resolveWorkspaceId(
  user: { id: string; workspace_id?: string; workspaceId?: string },
  supabase: ReturnType<typeof getAdminSupabase>
): Promise<string | null> {
  if (isUuid(user.workspace_id)) return user.workspace_id;
  if (isUuid(user.workspaceId)) return user.workspaceId;

  if (supabase) {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('workspace_id')
      .eq('id', user.id)
      .maybeSingle();
    if (isUuid(profile?.workspace_id)) return profile.workspace_id;

    const { data: member } = await supabase
      .from('workspace_members')
      .select('workspace_id')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle();
    if (isUuid(member?.workspace_id)) return member.workspace_id;
  }
  return null;
}

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser(req);
    const ip = getClientIp(req);
    const rl = checkRateLimit(`crm_get:${user.id}:${ip}`, { maxTokens: 60, refillRate: 5 });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Limite de requêtes atteinte', retryAfter: rl.retryAfter },
        { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } }
      );
    }

    const supabase = getAdminSupabase();
    const workspaceId = await resolveWorkspaceId(user, supabase);
    if (!workspaceId) {
      throw new ApiError(422, 'MISSING_WORKSPACE', 'Aucun espace de travail associé à votre session');
    }

    await requireWorkspaceRole(
      supabase,
      user.id,
      workspaceId,
      ['super_admin', 'admin', 'manager', 'editor', 'client'],
      user.role
    );

    if (!supabase) {
      return NextResponse.json({ success: true, prospects: [] });
    }

    const [{ data: leads, error: leadsErr }, { data: contacts }] = await Promise.all([
      supabase
        .from('leads')
        .select('id, workspace_id, name, email, phone, status, deal_value, created_at, updated_at')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false }),
      supabase
        .from('crm_contacts')
        .select('id, workspace_id, name, handle, platform, email, phone, notes, created_at, updated_at')
        .eq('workspace_id', workspaceId),
    ]);

    if (leadsErr) {
      throw new ApiError(500, 'CRM_FETCH_FAILED', leadsErr.message);
    }

    const contactById = new Map<string, any>();
    for (const c of contacts || []) {
      contactById.set(c.id, c);
    }

    const prospects: CRMProspect[] = (leads || []).map((lead: any) => {
      const contact = contactById.get(lead.id);
      const parsedNotes = parseContactNotes(contact?.notes);
      return {
        id: lead.id,
        name: lead.name || contact?.name || 'Prospect',
        platform: (contact?.platform || 'whatsapp') as SocialPlatform,
        handle: contact?.handle || lead.phone || '@prospect',
        avatar_url: '/logo.svg',
        deal_value: Number(lead.deal_value || 0),
        currency: 'FCFA',
        status: fromDbStatus(lead.status),
        lead_score: parsedNotes.lead_score,
        notes: parsedNotes.notes,
        last_interaction: lead.updated_at || lead.created_at || new Date().toISOString(),
        phone: lead.phone || contact?.phone || undefined,
        inbox_conversation_id: parsedNotes.inbox_conversation_id,
      };
    });

    return NextResponse.json({ success: true, prospects });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser(req);
    const ip = getClientIp(req);
    const rl = checkRateLimit(`crm_post:${user.id}:${ip}`, { maxTokens: 30, refillRate: 3 });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Limite de requêtes atteinte', retryAfter: rl.retryAfter },
        { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } }
      );
    }

    const body = await req.json();
    const parsed = createProspectSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || 'Données prospect invalides', issues: parsed.error.issues },
        { status: 422 }
      );
    }

    const supabase = getAdminSupabase();
    if (!supabase) {
      throw new ApiError(503, 'DATABASE_UNAVAILABLE', 'Base de données Supabase inaccessible');
    }

    const workspaceId = await resolveWorkspaceId(user, supabase);
    if (!workspaceId) {
      throw new ApiError(422, 'MISSING_WORKSPACE', 'Aucun espace de travail associé à votre session');
    }

    await requireWorkspaceRole(
      supabase,
      user.id,
      workspaceId,
      ['super_admin', 'admin', 'manager', 'editor'],
      user.role
    );

    const data = parsed.data;
    const now = new Date().toISOString();
    let prospectId = crypto.randomUUID();
    let isUpdate = false;

    if (data.inbox_conversation_id) {
      const { data: existingContacts } = await supabase
        .from('crm_contacts')
        .select('id, notes')
        .eq('workspace_id', workspaceId)
        .ilike('notes', `%[conv:${data.inbox_conversation_id}]%`)
        .limit(1);

      if (existingContacts && existingContacts.length > 0) {
        prospectId = existingContacts[0].id;
        isUpdate = true;
      }
    }

    const dbStatus = toDbStatus(data.status);
    const cleanPhone = data.phone || (data.handle.startsWith('+') ? data.handle : undefined);

    const { error: leadErr } = await supabase.from('leads').upsert(
      {
        id: prospectId,
        workspace_id: workspaceId,
        name: data.name,
        phone: cleanPhone || data.handle || null,
        status: dbStatus,
        deal_value: data.deal_value,
        updated_at: now,
      },
      { onConflict: 'id' }
    );

    if (leadErr) {
      throw new ApiError(500, 'CRM_SAVE_FAILED', `Échec enregistrement Supabase (leads): ${leadErr.message}`);
    }

    const encodedNotes = encodeContactNotes(data.notes, data.lead_score, data.inbox_conversation_id);
    const { error: contactErr } = await supabase.from('crm_contacts').upsert(
      {
        id: prospectId,
        workspace_id: workspaceId,
        owner_id: user.id,
        name: data.name,
        handle: data.handle || '@prospect',
        platform: data.platform,
        phone: cleanPhone || data.handle || null,
        notes: encodedNotes,
        updated_at: now,
      },
      { onConflict: 'id' }
    );

    if (contactErr && contactErr.message.includes('owner_id')) {
      await supabase.from('crm_contacts').upsert(
        {
          id: prospectId,
          workspace_id: workspaceId,
          name: data.name,
          handle: data.handle || '@prospect',
          platform: data.platform,
          phone: cleanPhone || data.handle || null,
          notes: encodedNotes,
          updated_at: now,
        },
        { onConflict: 'id' }
      );
    }

    const prospect: CRMProspect = {
      id: prospectId,
      name: data.name,
      platform: data.platform as SocialPlatform,
      handle: data.handle || '@prospect',
      avatar_url: '/logo.svg',
      deal_value: data.deal_value,
      currency: data.currency || 'FCFA',
      status: data.status,
      lead_score: data.lead_score,
      notes: data.notes || '',
      last_interaction: now,
      phone: cleanPhone,
      inbox_conversation_id: data.inbox_conversation_id,
    };

    return NextResponse.json(
      { success: true, prospect },
      { status: isUpdate ? 200 : 201 }
    );
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await requireUser(req);
    const body = await req.json();
    const parsed = updateProspectSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || 'Données invalides' },
        { status: 422 }
      );
    }

    const supabase = getAdminSupabase();
    if (!supabase) {
      throw new ApiError(503, 'DATABASE_UNAVAILABLE', 'Base de données inaccessible');
    }

    const workspaceId = await resolveWorkspaceId(user, supabase);
    if (!workspaceId) {
      throw new ApiError(422, 'MISSING_WORKSPACE', 'Espace de travail manquant');
    }

    await requireWorkspaceRole(
      supabase,
      user.id,
      workspaceId,
      ['super_admin', 'admin', 'manager', 'editor'],
      user.role
    );

    const { id, status, deal_value, notes, name } = parsed.data;
    const updates: Record<string, any> = { updated_at: new Date().toISOString() };
    if (status) updates.status = toDbStatus(status);
    if (deal_value !== undefined) updates.deal_value = deal_value;
    if (name) updates.name = name;

    const { data: updatedLead, error: upErr } = await supabase
      .from('leads')
      .update(updates)
      .eq('id', id)
      .eq('workspace_id', workspaceId)
      .select('id, workspace_id, name, phone, status, deal_value, updated_at')
      .maybeSingle();

    if (upErr) {
      throw new ApiError(500, 'CRM_UPDATE_FAILED', upErr.message);
    }
    if (!updatedLead) {
      throw new ApiError(404, 'PROSPECT_NOT_FOUND', 'Prospect introuvable dans cet espace de travail');
    }

    if (notes !== undefined || name !== undefined) {
      const contactUpdate: Record<string, any> = { updated_at: new Date().toISOString() };
      if (notes !== undefined) contactUpdate.notes = notes;
      if (name !== undefined) contactUpdate.name = name;
      await supabase
        .from('crm_contacts')
        .update(contactUpdate)
        .eq('id', id)
        .eq('workspace_id', workspaceId);
    }

    return NextResponse.json({
      success: true,
      prospect: {
        id: updatedLead.id,
        name: updatedLead.name,
        status: fromDbStatus(updatedLead.status),
        deal_value: Number(updatedLead.deal_value || 0),
        last_interaction: updatedLead.updated_at,
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await requireUser(req);
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!isUuid(id)) {
      throw new ApiError(422, 'INVALID_ID', 'Identifiant prospect UUID invalide');
    }

    const supabase = getAdminSupabase();
    if (!supabase) {
      throw new ApiError(503, 'DATABASE_UNAVAILABLE', 'Base de données inaccessible');
    }

    const workspaceId = await resolveWorkspaceId(user, supabase);
    if (!workspaceId) {
      throw new ApiError(422, 'MISSING_WORKSPACE', 'Espace de travail manquant');
    }

    await requireWorkspaceRole(
      supabase,
      user.id,
      workspaceId,
      ['super_admin', 'admin', 'manager', 'editor'],
      user.role
    );

    const { error: delErr } = await supabase
      .from('leads')
      .delete()
      .eq('id', id)
      .eq('workspace_id', workspaceId);

    if (delErr) {
      throw new ApiError(500, 'CRM_DELETE_FAILED', delErr.message);
    }

    await supabase
      .from('crm_contacts')
      .delete()
      .eq('id', id)
      .eq('workspace_id', workspaceId);

    return NextResponse.json({ success: true });
  } catch (err) {
    return handleApiError(err);
  }
}
