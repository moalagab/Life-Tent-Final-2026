-- ============================================================
-- Fix: infinite recursion in profiles RLS policies
-- Cause: auth.uid() evaluated per-row triggers recursive
--        policy lookup. Fix: (select auth.uid()) evaluated once.
-- ============================================================

-- Drop all existing profiles policies
DROP POLICY IF EXISTS "Users can view own profile"   ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select"              ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert"              ON public.profiles;
DROP POLICY IF EXISTS "profiles_update"              ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete"              ON public.profiles;
DROP POLICY IF EXISTS "profiles_service_role"        ON public.profiles;

-- Re-create with (select auth.uid()) — evaluated once, no recursion
CREATE POLICY "profiles_select"
  ON public.profiles
  FOR SELECT
  USING ( (select auth.uid()) = user_id );

CREATE POLICY "profiles_insert"
  ON public.profiles
  FOR INSERT
  WITH CHECK ( (select auth.uid()) = user_id );

CREATE POLICY "profiles_update"
  ON public.profiles
  FOR UPDATE
  USING ( (select auth.uid()) = user_id )
  WITH CHECK ( (select auth.uid()) = user_id );

CREATE POLICY "profiles_delete"
  ON public.profiles
  FOR DELETE
  USING ( (select auth.uid()) = user_id );

-- service_role bypass (required for trigger handle_new_user)
CREATE POLICY "profiles_service_role"
  ON public.profiles
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Re-create the trigger function with SECURITY DEFINER (bypasses RLS on insert)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'avatar_url'
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;
