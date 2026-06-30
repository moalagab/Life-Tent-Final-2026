-- Fix get_admin_users: column was "ban_reason" in the function but
-- the actual profiles column is "banned_reason" (added in 20260609192938).
-- This was causing a PostgreSQL "column p.ban_reason does not exist" error.

CREATE OR REPLACE FUNCTION get_admin_users(
  p_search text  DEFAULT '',
  p_filter text  DEFAULT 'all',
  p_offset int   DEFAULT 0,
  p_limit  int   DEFAULT 20
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM profiles WHERE user_id = auth.uid() AND is_admin = true
  ) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  p_limit  := LEAST(p_limit, 100);
  p_offset := GREATEST(p_offset, 0);

  SELECT jsonb_build_object(
    'users', COALESCE((
      SELECT jsonb_agg(row_to_json(u))
      FROM (
        SELECT
          p.id,
          p.user_id,
          p.full_name,
          p.avatar_url,
          p.is_admin,
          p.is_banned,
          p.banned_reason,          -- fixed: was "ban_reason"
          p.created_at,
          p.updated_at,
          au.email,
          COALESCE(us.plan, 'free') AS plan,
          us.status                 AS subscription_status
        FROM profiles p
        JOIN auth.users au ON au.id = p.user_id
        LEFT JOIN user_subscriptions us
               ON us.user_id = p.user_id AND us.status = 'active'
        WHERE (
          p_search = ''
          OR p.full_name ILIKE '%' || p_search || '%'
          OR au.email    ILIKE '%' || p_search || '%'
        )
        AND (
          p_filter = 'all'
          OR (p_filter = 'pro'      AND COALESCE(us.plan, 'free') = 'pro')
          OR (p_filter = 'business' AND COALESCE(us.plan, 'free') = 'business')
          OR (p_filter = 'free'     AND COALESCE(us.plan, 'free') = 'free')
          OR (p_filter = 'banned'   AND p.is_banned = true)
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
      LEFT JOIN user_subscriptions us
             ON us.user_id = p.user_id AND us.status = 'active'
      WHERE (
        p_search = ''
        OR p.full_name ILIKE '%' || p_search || '%'
        OR au.email    ILIKE '%' || p_search || '%'
      )
      AND (
        p_filter = 'all'
        OR (p_filter = 'pro'      AND COALESCE(us.plan, 'free') = 'pro')
        OR (p_filter = 'business' AND COALESCE(us.plan, 'free') = 'business')
        OR (p_filter = 'free'     AND COALESCE(us.plan, 'free') = 'free')
        OR (p_filter = 'banned'   AND p.is_banned = true)
      )
    )
  ) INTO result;

  RETURN result;
END;
$$;

REVOKE EXECUTE ON FUNCTION get_admin_users(text, text, int, int) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION get_admin_users(text, text, int, int) TO authenticated;
