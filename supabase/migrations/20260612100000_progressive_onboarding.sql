-- ============================================================
-- Progressive Onboarding — DB schema
--
-- Adds two columns to profiles:
--
--   onboarding_completed  boolean  — whether the user has finished onboarding
--   active_modules        text[]   — modules the user has progressively unlocked
--
-- Progressive-disclosure schedule (enforced in the frontend hook):
--   Day  0:  1 module  (chosen during onboarding)
--   Day  7:  unlock module #2
--   Day 14:  unlock module #3
--
-- Module pool: tasks | projects | finance | habits | goals | knowledge
-- Utility tools always visible regardless: dashboard | calendar | studio | pomodoro
--
-- Backfill: all existing users get onboarding_completed = true and
-- the full module set, so they are not affected by the gate.
-- ============================================================

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS onboarding_completed boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS active_modules       text[]  NOT NULL DEFAULT '{}';

-- Backfill existing users — grant all modules, mark onboarding as done
UPDATE profiles
SET
  onboarding_completed = true,
  active_modules       = ARRAY['tasks','projects','finance','habits','goals','knowledge'];

-- DOWN (rollback):
-- ALTER TABLE profiles
--   DROP COLUMN IF EXISTS onboarding_completed,
--   DROP COLUMN IF EXISTS active_modules;
