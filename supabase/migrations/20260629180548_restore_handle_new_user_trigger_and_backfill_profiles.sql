-- ============================================================
-- Fix 1: Recreate missing handle_new_user trigger on auth.users
-- The function exists (from 20260616000000 migration) but the
-- trigger was never created, causing all new sign-ups since that
-- migration to have no profile record.
-- ============================================================

DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;

CREATE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- Fix 2: Backfill profiles for the 30 existing users who never
-- got one. Set onboarding_completed = true so they are NOT
-- redirected to the onboarding flow (they already bypassed it
-- and have been using the app via the null-profile fallback).
-- ============================================================

INSERT INTO public.profiles (user_id, full_name, avatar_url, onboarding_completed)
SELECT
  u.id,
  COALESCE(u.raw_user_meta_data->>'full_name', ''),
  u.raw_user_meta_data->>'avatar_url',
  true
FROM auth.users u
LEFT JOIN public.profiles p ON p.user_id = u.id
WHERE p.user_id IS NULL
ON CONFLICT (user_id) DO NOTHING;
