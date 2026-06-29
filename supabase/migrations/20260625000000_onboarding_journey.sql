-- ════════════════════════════════════════════════════════
--  ONBOARDING JOURNEY — Day-by-Day Activation
-- ════════════════════════════════════════════════════════

-- challenge       : user's biggest pain point (chosen at sign-up)
-- journey_milestones : JSONB flags tracking which day-emails/prompts fired
-- ai_uses_remaining  : soft paywall — 3 free AI uses before Day-5 upgrade prompt
-- onboarding_completed_at : exact timestamp for day calculation

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS challenge               TEXT,
  ADD COLUMN IF NOT EXISTS journey_milestones      JSONB        NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS ai_uses_remaining       INTEGER      NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ;
