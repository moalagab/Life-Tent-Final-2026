-- Ensure active_modules and onboarding_completed columns exist
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS onboarding_completed boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS active_modules       text[]   NOT NULL DEFAULT '{}';

-- Grant all modules to every profile that has no active modules yet.
-- This covers:
--   1. Users who completed the old onboarding (before progressive disclosure)
--   2. Users whose profile was created before/after previous migrations
--   3. Any profile row with an empty array
UPDATE profiles
SET
  onboarding_completed = true,
  active_modules       = ARRAY['tasks','projects','finance','habits','goals','knowledge']
WHERE active_modules IS NULL
   OR active_modules = '{}'
   OR array_length(active_modules, 1) IS NULL;
