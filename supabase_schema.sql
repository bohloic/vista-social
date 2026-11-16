-- ==============================================================================
-- PULSESOCIAL ENTERPRISE DATABASE SCHEMA (POSTGRESQL / SUPABASE)
-- Multi-Tenant AI-Powered Social Media Management, Publishing & Mobile Money Monetization
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 0. SYSTEM CONFIGURATION & INITIALIZATION STATE
CREATE TABLE IF NOT EXISTS public.app_config (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 1. WORKSPACES
CREATE TABLE IF NOT EXISTS public.workspaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    timezone TEXT NOT NULL DEFAULT 'Africa/Abidjan',
    logo_url TEXT,
    plan TEXT NOT NULL DEFAULT 'pro' CHECK (plan IN ('starter', 'pro', 'agency', 'enterprise')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. USER PROFILES & ADMIN ROLES (Authentication metadata)
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('super_admin', 'admin', 'manager', 'editor', 'client')),
    is_lifetime_free BOOLEAN NOT NULL DEFAULT FALSE,
    password_hash TEXT, -- Optional if using local auth or Supabase Auth sync
    workspace_id UUID REFERENCES public.workspaces(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. WORKSPACE MEMBERS
CREATE TABLE IF NOT EXISTS public.workspace_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('super_admin', 'admin', 'manager', 'editor', 'client')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(workspace_id, user_id)
);

-- 4. CONNECTED SOCIAL ACCOUNTS
CREATE TABLE IF NOT EXISTS public.social_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    platform TEXT NOT NULL CHECK (platform IN ('instagram', 'facebook', 'twitter', 'linkedin', 'tiktok', 'youtube', 'threads', 'google_business')),
    platform_account_id TEXT NOT NULL,
    account_name TEXT NOT NULL,
    username TEXT NOT NULL,
    avatar_url TEXT,
    access_token TEXT,
    refresh_token TEXT,
    token_expires_at TIMESTAMPTZ,
    is_connected BOOLEAN NOT NULL DEFAULT TRUE,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'error', 'paused')),
    followers_count INTEGER NOT NULL DEFAULT 0,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(workspace_id, platform, platform_account_id)
);

-- 5. POSTS & SCHEDULER
CREATE TABLE IF NOT EXISTS public.posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    author_name TEXT NOT NULL DEFAULT 'Pulse CM',
    content TEXT NOT NULL,
    post_type TEXT NOT NULL DEFAULT 'post' CHECK (post_type IN ('post', 'reel', 'story', 'carousel', 'thread', 'short', 'pin')),
    media_urls JSONB DEFAULT '[]'::jsonb,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'needs_approval', 'approved', 'scheduled', 'publishing', 'published', 'failed')),
    scheduled_for TIMESTAMPTZ,
    published_at TIMESTAMPTZ,
    error_message TEXT,
    tags TEXT[] DEFAULT '{}',
    first_comment TEXT,
    channel_customizations JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. POST TARGETS
CREATE TABLE IF NOT EXISTS public.post_targets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    social_account_id UUID NOT NULL REFERENCES public.social_accounts(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'publishing', 'published', 'failed')),
    platform_post_id TEXT,
    platform_post_url TEXT,
    published_at TIMESTAMPTZ,
    error_details TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. UNIFIED INBOX CONVERSATIONS
CREATE TABLE IF NOT EXISTS public.inbox_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    social_account_id UUID NOT NULL REFERENCES public.social_accounts(id) ON DELETE CASCADE,
    customer_name TEXT NOT NULL,
    customer_username TEXT,
    customer_avatar_url TEXT,
    platform_conversation_id TEXT,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'snoozed')),
    sentiment TEXT NOT NULL DEFAULT 'neutral' CHECK (sentiment IN ('positive', 'neutral', 'negative')),
    tags TEXT[] DEFAULT '{}',
    last_message_preview TEXT,
    last_message_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    unread_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. INBOX MESSAGES
CREATE TABLE IF NOT EXISTS public.inbox_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.inbox_conversations(id) ON DELETE CASCADE,
    direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
    message_type TEXT NOT NULL DEFAULT 'dm' CHECK (message_type IN ('dm', 'comment', 'mention', 'review')),
    content TEXT NOT NULL,
    media_urls JSONB DEFAULT '[]'::jsonb,
    sentiment TEXT DEFAULT 'neutral',
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. SOCIAL LISTENING & MENTIONS
CREATE TABLE IF NOT EXISTS public.listening_queries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    query_type TEXT NOT NULL CHECK (query_type IN ('brand_mention', 'hashtag', 'keyword', 'competitor')),
    search_terms TEXT[] NOT NULL,
    excluded_terms TEXT[] DEFAULT '{}',
    platforms TEXT[] DEFAULT '{instagram,twitter,tiktok,linkedin}',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.listening_mentions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    query_id UUID REFERENCES public.listening_queries(id) ON DELETE CASCADE,
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    platform TEXT NOT NULL,
    author_name TEXT NOT NULL,
    author_handle TEXT NOT NULL,
    author_avatar TEXT,
    content TEXT NOT NULL,
    url TEXT,
    sentiment TEXT NOT NULL DEFAULT 'neutral' CHECK (sentiment IN ('positive', 'neutral', 'negative')),
    reach INTEGER NOT NULL DEFAULT 0,
    engagement INTEGER NOT NULL DEFAULT 0,
    published_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. REVIEWS HUB
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    social_account_id UUID REFERENCES public.social_accounts(id) ON DELETE SET NULL,
    platform TEXT NOT NULL CHECK (platform IN ('google', 'yelp', 'facebook', 'trustpilot')),
    author_name TEXT NOT NULL,
    author_avatar TEXT,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT NOT NULL,
    response_text TEXT,
    responded_at TIMESTAMPTZ,
    sentiment TEXT NOT NULL DEFAULT 'neutral' CHECK (sentiment IN ('positive', 'neutral', 'negative')),
    review_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. PULSE PAGES (LINK IN BIO BUILDER)
CREATE TABLE IF NOT EXISTS public.pulse_pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    bio TEXT,
    avatar_url TEXT,
    theme_config JSONB NOT NULL DEFAULT '{
        "preset": "pulse_cyber",
        "bg_type": "gradient",
        "bg_gradient": "from-slate-950 via-purple-950 to-indigo-950",
        "text_color": "#ffffff",
        "button_bg": "rgba(255, 255, 255, 0.08)",
        "button_text": "#ffffff",
        "button_border": "rgba(255, 255, 255, 0.18)",
        "button_radius": "rounded-2xl",
        "font_family": "sans"
    }'::jsonb,
    blocks JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_published BOOLEAN NOT NULL DEFAULT TRUE,
    views_count INTEGER NOT NULL DEFAULT 0,
    clicks_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. MONETIZATION & MOBILE MONEY TRANSACTIONS (Orange Money, MTN, Wave, Moov)
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    plan TEXT NOT NULL CHECK (plan IN ('starter', 'pro', 'agency', 'enterprise')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'past_due', 'canceled', 'trialing')),
    currency TEXT NOT NULL DEFAULT 'XOF' CHECK (currency IN ('XOF', 'EUR', 'USD')),
    amount NUMERIC(12, 2) NOT NULL,
    billing_cycle TEXT NOT NULL DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly')),
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.mobile_money_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    provider TEXT NOT NULL CHECK (provider IN ('orange_money', 'mtn_momo', 'wave', 'moov', 'card')),
    phone_number TEXT NOT NULL,
    country_code TEXT NOT NULL DEFAULT 'CI',
    currency TEXT NOT NULL DEFAULT 'XOF',
    amount NUMERIC(12, 2) NOT NULL,
    plan TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'successful', 'failed', 'refunded')),
    transaction_ref TEXT NOT NULL UNIQUE,
    provider_ref TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_posts_workspace_status ON public.posts(workspace_id, status);
CREATE INDEX IF NOT EXISTS idx_posts_scheduled_for ON public.posts(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_inbox_conversations_workspace ON public.inbox_conversations(workspace_id, status);
CREATE INDEX IF NOT EXISTS idx_inbox_messages_conversation ON public.inbox_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_reviews_workspace_rating ON public.reviews(workspace_id, rating);
CREATE INDEX IF NOT EXISTS idx_pulse_pages_slug ON public.pulse_pages(slug);
CREATE INDEX IF NOT EXISTS idx_transactions_workspace ON public.mobile_money_transactions(workspace_id, status);
