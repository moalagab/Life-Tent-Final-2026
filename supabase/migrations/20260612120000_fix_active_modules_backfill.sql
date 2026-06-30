-- Fix: users with onboarding_completed = true but empty active_modules
-- (happened because the initial backfill ran before their profile existed,
--  or they skipped onboarding via the old path that didn't set active_modules)
UPDATE profiles
SET active_modules = ARRAY['tasks','projects','finance','habits','goals','knowledge']
WHERE onboarding_completed = true
  AND (active_modules IS NULL OR active_modules = '{}');

-- Also cover users who have a profile but never hit onboarding at all
-- (created via trigger before onboarding_completed column existed)
UPDATE profiles
SET
  onboarding_completed = true,
  active_modules       = ARRAY['tasks','projects','finance','habits','goals','knowledge']
WHERE active_modules IS NULL OR active_modules = '{}';
