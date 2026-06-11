-- ===== ADMIN SYSTEM =====
-- profiles.user_id = auth.uid() (not profiles.id)
-- user_subscriptions (separate from finance subscriptions table)

-- ── 1. Admin columns on profiles ─────────────────────────────────────────────
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin   boolean      DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_banned  boolean      DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS banned_at  timestamptz;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS banned_reason text;

-- ── 2. user_subscriptions — platform plan per user ───────────────────────────
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               uuid        NOT NULL UNIQUE,   -- auth.users.id
  plan                  text        NOT NULL DEFAULT 'free'
                                    CHECK (plan IN ('free', 'pro', 'business')),
  status                text        NOT NULL DEFAULT 'active'
                                    CHECK (status IN ('active', 'cancelled', 'expired', 'trial')),
  trial_ends_at         timestamptz,
  current_period_start  timestamptz DEFAULT now(),
  current_period_end    timestamptz,
  cancelled_at          timestamptz,
  created_at            timestamptz DEFAULT now(),
  updated_at            timestamptz DEFAULT now()
);

ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

-- User reads own subscription
DROP POLICY IF EXISTS "users_read_own_user_subscription" ON user_subscriptions;
CREATE POLICY "users_read_own_user_subscription" ON user_subscriptions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
        AND profiles.user_id = user_subscriptions.user_id
    )
  );

-- Admin full access
DROP POLICY IF EXISTS "admin_full_access_user_subscriptions" ON user_subscriptions;
CREATE POLICY "admin_full_access_user_subscriptions" ON user_subscriptions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid() AND profiles.is_admin = true
    )
  );

-- ── 3. admin_audit_log ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id   uuid,                     -- auth.users.id of admin
  action          text        NOT NULL,
  target_user_id  uuid,                     -- auth.users.id of target
  details         jsonb       DEFAULT '{}',
  created_at      timestamptz DEFAULT now()
);

ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_only_audit_log" ON admin_audit_log;
CREATE POLICY "admin_only_audit_log" ON admin_audit_log
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid() AND profiles.is_admin = true
    )
  );

-- ── 4. updated_at trigger for user_subscriptions ─────────────────────────────
CREATE OR REPLACE FUNCTION update_user_subscriptions_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS user_subscriptions_updated_at ON user_subscriptions;
CREATE TRIGGER user_subscriptions_updated_at
  BEFORE UPDATE ON user_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_user_subscriptions_updated_at();

-- ── 5. RLS: admin can read + update all profiles ──────────────────────────────
DROP POLICY IF EXISTS "admin_read_all_profiles"   ON profiles;
DROP POLICY IF EXISTS "admin_update_profiles"     ON profiles;

CREATE POLICY "admin_read_all_profiles" ON profiles
  FOR SELECT USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM profiles p2
      WHERE p2.user_id = auth.uid() AND p2.is_admin = true
    )
  );

CREATE POLICY "admin_update_profiles" ON profiles
  FOR UPDATE USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM profiles p2
      WHERE p2.user_id = auth.uid() AND p2.is_admin = true
    )
  );

-- ── 6. get_admin_stats() ──────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_admin_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM profiles WHERE user_id = auth.uid() AND is_admin = true
  ) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT jsonb_build_object(
    'total_users',          (SELECT count(*)::int FROM profiles),
    'active_today',         (SELECT count(*)::int FROM profiles WHERE updated_at > now() - interval '24 hours'),
    'active_this_week',     (SELECT count(*)::int FROM profiles WHERE updated_at > now() - interval '7 days'),
    'new_this_month',       (SELECT count(*)::int FROM profiles WHERE created_at > date_trunc('month', now())),
    'pro_subscribers',      (SELECT count(*)::int FROM user_subscriptions WHERE plan = 'pro'      AND status = 'active'),
    'business_subscribers', (SELECT count(*)::int FROM user_subscriptions WHERE plan = 'business' AND status = 'active'),
    'banned_users',         (SELECT count(*)::int FROM profiles WHERE is_banned = true),
    'total_subscriptions',  (SELECT count(*)::int FROM user_subscriptions WHERE status = 'active')
  ) INTO result;

  RETURN result;
END;
$$;

-- ── 7. get_admin_users() — joins profiles with auth.users for email ───────────
CREATE OR REPLACE FUNCTION get_admin_users(
  p_search text  DEFAULT '',
  p_filter text  DEFAULT 'all',
  p_offset int   DEFAULT 0,
  p_limit  int   DEFAULT 20
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM profiles WHERE user_id = auth.uid() AND is_admin = true
  ) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT jsonb_build_object(
    'users', COALESCE((
      SELECT jsonb_agg(row_to_json(u))
      FROM (
        SELECT
          p.id,
          p.user_id,
          au.email,
          p.full_name,
          p.avatar_url,
          COALESCE(p.is_admin,  false) AS is_admin,
          COALESCE(p.is_banned, false) AS is_banned,
          p.banned_at,
          p.banned_reason,
          p.created_at,
          p.updated_at,
          COALESCE(us.plan, 'free') AS plan,
          us.status                  AS subscription_status
        FROM profiles p
        JOIN auth.users au ON au.id = p.user_id
        LEFT JOIN user_subscriptions us ON us.user_id = p.user_id
        WHERE (
          p_search = ''
          OR p.full_name ILIKE '%' || p_search || '%'
          OR au.email    ILIKE '%' || p_search || '%'
        )
        AND (
          p_filter = 'all'
          OR (p_filter = 'banned'   AND p.is_banned = true)
          OR (p_filter = 'free'     AND (us.plan IS NULL OR us.plan = 'free'))
          OR (p_filter = 'pro'      AND us.plan = 'pro'      AND us.status = 'active')
          OR (p_filter = 'business' AND us.plan = 'business' AND us.status = 'active')
        )
        ORDER BY p.created_at DESC
        LIMIT  p_limit
        OFFSET p_offset
      ) u
    ), '[]'::jsonb),
    'total', (
      SELECT count(*)::int
      FROM profiles p
      JOIN auth.users au ON au.id = p.user_id
      LEFT JOIN user_subscriptions us ON us.user_id = p.user_id
      WHERE (
        p_search = ''
        OR p.full_name ILIKE '%' || p_search || '%'
        OR au.email    ILIKE '%' || p_search || '%'
      )
      AND (
        p_filter = 'all'
        OR (p_filter = 'banned'   AND p.is_banned = true)
        OR (p_filter = 'free'     AND (us.plan IS NULL OR us.plan = 'free'))
        OR (p_filter = 'pro'      AND us.plan = 'pro'      AND us.status = 'active')
        OR (p_filter = 'business' AND us.plan = 'business' AND us.status = 'active')
      )
    )
  ) INTO result;

  RETURN result;
END;
$$;

-- ── Indexes ───────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin   ON profiles (is_admin)  WHERE is_admin  = true;
CREATE INDEX IF NOT EXISTS idx_profiles_is_banned  ON profiles (is_banned) WHERE is_banned = true;
CREATE INDEX IF NOT EXISTS idx_user_sub_user_id    ON user_subscriptions (user_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_created ON admin_audit_log (created_at DESC);
