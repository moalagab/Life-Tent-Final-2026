-- Add Lemon Squeezy tracking columns to user_subscriptions
ALTER TABLE user_subscriptions
  ADD COLUMN IF NOT EXISTS ls_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS ls_customer_id     TEXT,
  ADD COLUMN IF NOT EXISTS ls_variant_id      TEXT,
  ADD COLUMN IF NOT EXISTS ls_status          TEXT;

-- Unique index so we can look up by LS subscription id
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_sub_ls_id
  ON user_subscriptions (ls_subscription_id)
  WHERE ls_subscription_id IS NOT NULL;
