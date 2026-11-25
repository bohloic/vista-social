-- ==============================================================================
-- MIGRATION: 20261125_crm_and_pulse_pages_columns.sql
-- Ensures pulse_pages columns (blocks, theme_config, views_count) exist cleanly
-- and reloads PostgREST schema cache.
-- ==============================================================================

ALTER TABLE public.pulse_pages
  ADD COLUMN IF NOT EXISTS blocks JSONB NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.pulse_pages
  ADD COLUMN IF NOT EXISTS theme_config JSONB NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.pulse_pages
  ADD COLUMN IF NOT EXISTS views_count INTEGER NOT NULL DEFAULT 0;

NOTIFY pgrst, 'reload schema';
