-- Additive columns required to match the current Supabase application schema.
-- Run as the PostgreSQL table owner/admin before importing data or switching APIs.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS committed_swaps integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS completed_swaps integer NOT NULL DEFAULT 0;

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS thumbnail_url text,
  ADD COLUMN IF NOT EXISTS reel_uploaded_at timestamptz;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS payment_method text NOT NULL DEFAULT 'bank_transfer';
