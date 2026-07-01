-- ── Fix: wrong FK target on push_subscriptions / webauthn_credentials / user_ai_insights ──
-- These three tables declared `user_id uuid REFERENCES profiles(id)`, but
-- `profiles.id` is a random gen_random_uuid() surrogate key — distinct from
-- `profiles.user_id` (== auth.uid()). Every insert uses `user_id: user.id`
-- (the auth uid), and RLS policies compare `auth.uid() = user_id`, so every
-- insert into these tables has always violated the FK constraint: web push,
-- passkey registration, and AI-insight persistence have been failing since
-- these tables were created. Re-point the FK at auth.users(id), matching
-- every other user-owned table in this schema (profiles, projects, tasks, …).
-- ─────────────────────────────────────────────────────────────────────────

ALTER TABLE push_subscriptions
  DROP CONSTRAINT IF EXISTS push_subscriptions_user_id_fkey,
  ADD CONSTRAINT push_subscriptions_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE webauthn_credentials
  DROP CONSTRAINT IF EXISTS webauthn_credentials_user_id_fkey,
  ADD CONSTRAINT webauthn_credentials_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE user_ai_insights
  DROP CONSTRAINT IF EXISTS user_ai_insights_user_id_fkey,
  ADD CONSTRAINT user_ai_insights_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
