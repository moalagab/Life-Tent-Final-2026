-- ============================================================
-- user_ai_insights — Persistent AI memory per user
--
-- Stores behavioral insights discovered by the AI engine
-- (productivity patterns, user preferences, goal context).
-- These persist between sessions so the AI coach builds
-- knowledge about the user over time — not starting fresh
-- every conversation.
--
-- UP / DOWN pattern included for safe rollback.
-- ============================================================

-- ── UP ────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS user_ai_insights (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  insight_type  text        NOT NULL CHECK (insight_type IN (
                              'productivity_pattern',
                              'preference',
                              'goal_context'
                            )),
  content       text        NOT NULL CHECK (char_length(content) BETWEEN 1 AND 2000),
  confidence    float       NOT NULL DEFAULT 0.5 CHECK (confidence BETWEEN 0.0 AND 1.0),
  created_at    timestamptz NOT NULL DEFAULT now(),
  expires_at    timestamptz           -- NULL = never expires
);

-- Index for fast per-user lookups (most common access pattern)
CREATE INDEX IF NOT EXISTS user_ai_insights_user_id_idx
  ON user_ai_insights (user_id, created_at DESC);

-- Index for expiry cleanup (cron job / scheduled function)
CREATE INDEX IF NOT EXISTS user_ai_insights_expires_at_idx
  ON user_ai_insights (expires_at)
  WHERE expires_at IS NOT NULL;

-- ── RLS ───────────────────────────────────────────────────────────────────────

ALTER TABLE user_ai_insights ENABLE ROW LEVEL SECURITY;

-- Users can only read and write their own insights
CREATE POLICY "user_own_insights"
  ON user_ai_insights
  FOR ALL
  TO authenticated
  USING     (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── DOWN (rollback) ───────────────────────────────────────────────────────────
-- To undo: DROP TABLE IF EXISTS user_ai_insights CASCADE;
