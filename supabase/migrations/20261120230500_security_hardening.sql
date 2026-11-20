-- ==============================================================================
-- MIGRATION: 20261120230500_security_hardening.sql
-- FIXES: C1 (RLS on all tables), Y1 (Missing Indexes), G1 (Security Policies)
-- STRICT ZERO-TRUST MULTI-TENANT ROW LEVEL SECURITY ARCHITECTURE
-- ==============================================================================

-- 1. EXTENSIONS & COMPATIBILITY
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. ENSURE TABLES EXIST (Including CRM tables if not already present)
CREATE TABLE IF NOT EXISTS public.leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'proposal', 'won', 'lost')),
    deal_value NUMERIC(12, 2) DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.crm_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    owner_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    handle TEXT,
    platform TEXT DEFAULT 'whatsapp',
    email TEXT,
    phone TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES public.crm_contacts(id) ON DELETE CASCADE,
    interaction_type TEXT NOT NULL DEFAULT 'message',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. SECURITY DEFINER HELPER FUNCTIONS (Strict search_path = public, bool return only)
CREATE OR REPLACE FUNCTION public.is_workspace_member(p_workspace_id uuid, p_user_id uuid DEFAULT auth.uid())
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_id = p_workspace_id AND user_id = p_user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.has_workspace_role(p_workspace_id uuid, p_roles text[], p_user_id uuid DEFAULT auth.uid())
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_id = p_workspace_id AND user_id = p_user_id
      AND role = ANY(p_roles)
  );
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin(p_user_id uuid DEFAULT auth.uid())
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = p_user_id AND role = 'super_admin'
  );
$$;

-- 4. ENABLE & FORCE ROW LEVEL SECURITY ON ALL TABLES [C1]
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspaces FORCE ROW LEVEL SECURITY;

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles FORCE ROW LEVEL SECURITY;

ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members FORCE ROW LEVEL SECURITY;

ALTER TABLE public.social_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_accounts FORCE ROW LEVEL SECURITY;

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts FORCE ROW LEVEL SECURITY;

ALTER TABLE public.post_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_targets FORCE ROW LEVEL SECURITY;

ALTER TABLE public.inbox_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inbox_conversations FORCE ROW LEVEL SECURITY;

ALTER TABLE public.inbox_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inbox_messages FORCE ROW LEVEL SECURITY;

ALTER TABLE public.listening_queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listening_queries FORCE ROW LEVEL SECURITY;

ALTER TABLE public.listening_mentions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listening_mentions FORCE ROW LEVEL SECURITY;

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews FORCE ROW LEVEL SECURITY;

ALTER TABLE public.pulse_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pulse_pages FORCE ROW LEVEL SECURITY;

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions FORCE ROW LEVEL SECURITY;

ALTER TABLE public.mobile_money_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mobile_money_transactions FORCE ROW LEVEL SECURITY;

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads FORCE ROW LEVEL SECURITY;

ALTER TABLE public.crm_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_contacts FORCE ROW LEVEL SECURITY;

ALTER TABLE public.interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interactions FORCE ROW LEVEL SECURITY;

ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_config FORCE ROW LEVEL SECURITY;

-- 5. MINIMAL STRICT POLICIES PER TABLE

-- === WORKSPACES ===
DROP POLICY IF EXISTS "workspaces_select_member" ON public.workspaces;
CREATE POLICY "workspaces_select_member" ON public.workspaces
  FOR SELECT TO authenticated
  USING (public.is_workspace_member(id) OR public.is_super_admin());

DROP POLICY IF EXISTS "workspaces_insert_auth" ON public.workspaces;
CREATE POLICY "workspaces_insert_auth" ON public.workspaces
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "workspaces_update_admin" ON public.workspaces;
CREATE POLICY "workspaces_update_admin" ON public.workspaces
  FOR UPDATE TO authenticated
  USING (public.has_workspace_role(id, ARRAY['super_admin', 'admin']))
  WITH CHECK (public.has_workspace_role(id, ARRAY['super_admin', 'admin']));

DROP POLICY IF EXISTS "workspaces_delete_super_admin" ON public.workspaces;
CREATE POLICY "workspaces_delete_super_admin" ON public.workspaces
  FOR DELETE TO authenticated
  USING (public.has_workspace_role(id, ARRAY['super_admin']));

-- === USER_PROFILES ===
DROP POLICY IF EXISTS "user_profiles_select_self_or_super" ON public.user_profiles;
CREATE POLICY "user_profiles_select_self_or_super" ON public.user_profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.is_super_admin());

DROP POLICY IF EXISTS "user_profiles_update_self" ON public.user_profiles;
CREATE POLICY "user_profiles_update_self" ON public.user_profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- === WORKSPACE_MEMBERS ===
DROP POLICY IF EXISTS "workspace_members_select_coworkers" ON public.workspace_members;
CREATE POLICY "workspace_members_select_coworkers" ON public.workspace_members
  FOR SELECT TO authenticated
  USING (public.is_workspace_member(workspace_id) OR public.is_super_admin());

DROP POLICY IF EXISTS "workspace_members_modify_admin" ON public.workspace_members;
CREATE POLICY "workspace_members_modify_admin" ON public.workspace_members
  FOR ALL TO authenticated
  USING (public.has_workspace_role(workspace_id, ARRAY['super_admin', 'admin', 'manager']))
  WITH CHECK (public.has_workspace_role(workspace_id, ARRAY['super_admin', 'admin', 'manager']));

-- === POSTS ===
DROP POLICY IF EXISTS "posts_select_member" ON public.posts;
CREATE POLICY "posts_select_member" ON public.posts
  FOR SELECT TO authenticated
  USING (public.is_workspace_member(workspace_id) OR public.is_super_admin());

DROP POLICY IF EXISTS "posts_modify_creator" ON public.posts;
CREATE POLICY "posts_modify_creator" ON public.posts
  FOR INSERT TO authenticated
  WITH CHECK (public.has_workspace_role(workspace_id, ARRAY['super_admin', 'admin', 'manager', 'editor']));

DROP POLICY IF EXISTS "posts_update_creator" ON public.posts;
CREATE POLICY "posts_update_creator" ON public.posts
  FOR UPDATE TO authenticated
  USING (public.has_workspace_role(workspace_id, ARRAY['super_admin', 'admin', 'manager', 'editor']))
  WITH CHECK (public.has_workspace_role(workspace_id, ARRAY['super_admin', 'admin', 'manager', 'editor']));

DROP POLICY IF EXISTS "posts_delete_creator" ON public.posts;
CREATE POLICY "posts_delete_creator" ON public.posts
  FOR DELETE TO authenticated
  USING (public.has_workspace_role(workspace_id, ARRAY['super_admin', 'admin', 'manager', 'editor']));

-- === SOCIAL_ACCOUNTS [C4 protection: admin/manager/super_admin only] ===
DROP POLICY IF EXISTS "social_accounts_access_admin" ON public.social_accounts;
CREATE POLICY "social_accounts_access_admin" ON public.social_accounts
  FOR ALL TO authenticated
  USING (public.has_workspace_role(workspace_id, ARRAY['super_admin', 'admin', 'manager']))
  WITH CHECK (public.has_workspace_role(workspace_id, ARRAY['super_admin', 'admin', 'manager']));

-- === LEADS, CRM_CONTACTS, INTERACTIONS ===
DROP POLICY IF EXISTS "leads_select_member" ON public.leads;
CREATE POLICY "leads_select_member" ON public.leads
  FOR SELECT TO authenticated
  USING (public.is_workspace_member(workspace_id) OR public.is_super_admin());

DROP POLICY IF EXISTS "leads_write_editor" ON public.leads;
CREATE POLICY "leads_write_editor" ON public.leads
  FOR ALL TO authenticated
  USING (public.has_workspace_role(workspace_id, ARRAY['super_admin', 'admin', 'manager', 'editor']))
  WITH CHECK (public.has_workspace_role(workspace_id, ARRAY['super_admin', 'admin', 'manager', 'editor']));

DROP POLICY IF EXISTS "crm_contacts_select_member" ON public.crm_contacts;
CREATE POLICY "crm_contacts_select_member" ON public.crm_contacts
  FOR SELECT TO authenticated
  USING (public.is_workspace_member(workspace_id) OR public.is_super_admin());

DROP POLICY IF EXISTS "crm_contacts_write_editor" ON public.crm_contacts;
CREATE POLICY "crm_contacts_write_editor" ON public.crm_contacts
  FOR ALL TO authenticated
  USING (public.has_workspace_role(workspace_id, ARRAY['super_admin', 'admin', 'manager', 'editor']))
  WITH CHECK (public.has_workspace_role(workspace_id, ARRAY['super_admin', 'admin', 'manager', 'editor']));

DROP POLICY IF EXISTS "interactions_select_member" ON public.interactions;
CREATE POLICY "interactions_select_member" ON public.interactions
  FOR SELECT TO authenticated
  USING (public.is_workspace_member(workspace_id) OR public.is_super_admin());

DROP POLICY IF EXISTS "interactions_write_editor" ON public.interactions;
CREATE POLICY "interactions_write_editor" ON public.interactions
  FOR ALL TO authenticated
  USING (public.has_workspace_role(workspace_id, ARRAY['super_admin', 'admin', 'manager', 'editor']))
  WITH CHECK (public.has_workspace_role(workspace_id, ARRAY['super_admin', 'admin', 'manager', 'editor']));

-- === INBOX CONVERSATIONS & MESSAGES ===
DROP POLICY IF EXISTS "inbox_conversations_all_member" ON public.inbox_conversations;
CREATE POLICY "inbox_conversations_all_member" ON public.inbox_conversations
  FOR ALL TO authenticated
  USING (public.is_workspace_member(workspace_id) OR public.is_super_admin())
  WITH CHECK (public.is_workspace_member(workspace_id) OR public.is_super_admin());

DROP POLICY IF EXISTS "inbox_messages_all_member" ON public.inbox_messages;
CREATE POLICY "inbox_messages_all_member" ON public.inbox_messages
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.inbox_conversations c
      WHERE c.id = conversation_id AND (public.is_workspace_member(c.workspace_id) OR public.is_super_admin())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.inbox_conversations c
      WHERE c.id = conversation_id AND (public.is_workspace_member(c.workspace_id) OR public.is_super_admin())
    )
  );

-- === REVIEWS ===
DROP POLICY IF EXISTS "reviews_all_member" ON public.reviews;
CREATE POLICY "reviews_all_member" ON public.reviews
  FOR ALL TO authenticated
  USING (public.is_workspace_member(workspace_id) OR public.is_super_admin())
  WITH CHECK (public.is_workspace_member(workspace_id) OR public.is_super_admin());

-- === PULSE PAGES (Public SELECT for active bio, authenticated admin/editor for edits) ===
DROP POLICY IF EXISTS "pulse_pages_select_public" ON public.pulse_pages;
CREATE POLICY "pulse_pages_select_public" ON public.pulse_pages
  FOR SELECT TO anon, authenticated
  USING (is_published = true OR (auth.uid() IS NOT NULL AND (public.is_workspace_member(workspace_id) OR public.is_super_admin())));

DROP POLICY IF EXISTS "pulse_pages_write_editor" ON public.pulse_pages;
CREATE POLICY "pulse_pages_write_editor" ON public.pulse_pages
  FOR ALL TO authenticated
  USING (public.has_workspace_role(workspace_id, ARRAY['super_admin', 'admin', 'manager', 'editor']))
  WITH CHECK (public.has_workspace_role(workspace_id, ARRAY['super_admin', 'admin', 'manager', 'editor']));

-- === MONETIZATION & TRANSACTIONS ===
DROP POLICY IF EXISTS "subscriptions_access_admin" ON public.subscriptions;
CREATE POLICY "subscriptions_access_admin" ON public.subscriptions
  FOR ALL TO authenticated
  USING (public.has_workspace_role(workspace_id, ARRAY['super_admin', 'admin']))
  WITH CHECK (public.has_workspace_role(workspace_id, ARRAY['super_admin', 'admin']));

DROP POLICY IF EXISTS "transactions_access_admin" ON public.mobile_money_transactions;
CREATE POLICY "transactions_access_admin" ON public.mobile_money_transactions
  FOR ALL TO authenticated
  USING (public.has_workspace_role(workspace_id, ARRAY['super_admin', 'admin']))
  WITH CHECK (public.has_workspace_role(workspace_id, ARRAY['super_admin', 'admin']));

-- === APP_CONFIG ===
DROP POLICY IF EXISTS "app_config_super_admin_only" ON public.app_config;
CREATE POLICY "app_config_super_admin_only" ON public.app_config
  FOR ALL TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- 6. INDEXES TO MITIGATE QUERY LATENCY & SUPPORT POLICIES [Y1]
CREATE INDEX IF NOT EXISTS idx_workspace_members_user_id ON public.workspace_members(user_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_workspace_role ON public.workspace_members(workspace_id, role);
CREATE INDEX IF NOT EXISTS idx_posts_workspace_created ON public.posts(workspace_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_workspace_status ON public.leads(workspace_id, status);
CREATE INDEX IF NOT EXISTS idx_crm_contacts_workspace_owner ON public.crm_contacts(workspace_id, owner_id);
CREATE INDEX IF NOT EXISTS idx_interactions_workspace_created ON public.interactions(workspace_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_social_accounts_workspace ON public.social_accounts(workspace_id, status);
