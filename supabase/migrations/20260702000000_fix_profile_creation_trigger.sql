-- ── Fix: profile-creation trigger was silently destroyed ───────────────────
-- 20260618000000_welcome_email_trigger.sql ran:
--   DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
-- That name belonged to the ORIGINAL profile-creation trigger defined in
-- 20251223111535 (AFTER INSERT ON auth.users EXECUTE FUNCTION handle_new_user()).
-- The welcome-email migration then rebound the same trigger name to
-- handle_new_user_welcome(), so every signup since has created zero rows in
-- public.profiles. This restores profile creation under a distinct trigger
-- name so both triggers can coexist without name collisions in the future.
-- ─────────────────────────────────────────────────────────────────────────

CREATE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill: create profiles for any user who signed up between the two
-- migrations above and never triggered the lazy-insert fallback in
-- src/hooks/useProfile.tsx (i.e. never opened/edited their profile).
INSERT INTO public.profiles (user_id, full_name)
SELECT u.id, u.raw_user_meta_data ->> 'full_name'
FROM auth.users u
LEFT JOIN public.profiles p ON p.user_id = u.id
WHERE p.user_id IS NULL;
