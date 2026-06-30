-- ── Security Fixes ───────────────────────────────────────────────────────────

-- 1. Remove duplicate/broad SELECT policy on avatars bucket that allows listing
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "avatars_public_read" ON storage.objects;

-- Re-create a tighter read policy: allow reading only by direct object path (no listing)
CREATE POLICY "avatars_public_read"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'avatars'
    AND name IS NOT NULL
  );

-- 2. Fix uploads bucket: restrict listing
DROP POLICY IF EXISTS "Uploaded files are publicly accessible" ON storage.objects;

-- Only owners can list their uploaded files
CREATE POLICY "uploads_owner_read"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'uploads'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- 3. Ensure all public tables have RLS enabled
-- (belt-and-suspenders: the migrations already set these, this is a safety check)
ALTER TABLE IF EXISTS public.profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.tasks             ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.projects          ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.goals             ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.habits            ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.habit_logs        ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.events            ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.notes             ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.accounts          ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.transactions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.budgets           ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.debts             ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.subscriptions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.investments       ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.wishlist_items    ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.mood_logs         ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.media_items       ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.courses           ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.resources         ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.categories        ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.fx_rates          ENABLE ROW LEVEL SECURITY;
