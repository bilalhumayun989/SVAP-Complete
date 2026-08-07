-- Fix profiles table - Add missing bio column only
-- Run this in your Supabase SQL Editor

-- Add bio column if it doesn't exist (this was causing the error)
DO $$ 
BEGIN
  -- Check and add bio column only
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='bio') THEN
    ALTER TABLE public.profiles ADD COLUMN bio TEXT DEFAULT '';
  END IF;
END $$;

-- Update existing profiles without usernames to have proper usernames
UPDATE public.profiles 
SET username = LOWER(REGEXP_REPLACE(
  COALESCE(full_name, split_part(email, '@', 1), 'user'), 
  '[^a-zA-Z0-9._-]+', 
  '_', 
  'g'
)) || '_' || SUBSTR(id::text, 1, 8)
WHERE username IS NULL OR username = '';

-- Make sure RLS is enabled (it probably already is)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "profiles_public_read" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_self" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_self" ON public.profiles;

-- Create RLS policies
CREATE POLICY "profiles_public_read"
  ON public.profiles
  FOR SELECT
  USING (true);

CREATE POLICY "profiles_insert_self"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_self"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Refresh schema cache so the API recognizes the new bio column
SELECT pg_notify('pgrst', 'reload schema');