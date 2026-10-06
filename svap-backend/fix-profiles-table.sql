
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

SELECT pg_notify('pgrst', 'reload schema');