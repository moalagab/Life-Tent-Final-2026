-- ============================================================
-- Rate Limiting — Sliding Window Counter
--
-- Tracks how many times each user called each edge function
-- within a rolling time window. Called from edge functions
-- before any expensive operation (AI calls, emails, etc.).
--
-- Usage (from edge function):
--   SELECT check_rate_limit(
--     auth.uid(),           -- user uuid
--     'ai-decision-engine', -- function name
--     50,                   -- max requests allowed
--     3600                  -- window in seconds
--   );
--   -- returns: current count AFTER incrementing
--   -- if returned value > max_requests → reject with 429
-- ============================================================

-- ── Table ─────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS rate_limit_counters (
  id             bigserial   PRIMARY KEY,
  user_id        uuid        NOT NULL,
  function_name  text        NOT NULL,
  window_start   timestamptz NOT NULL DEFAULT now(),
  request_count  int         NOT NULL DEFAULT 1
);

-- Unique index: one row per (user, function, window)
CREATE UNIQUE INDEX IF NOT EXISTS rate_limit_counters_window_idx
  ON rate_limit_counters (user_id, function_name, window_start);

-- Cleanup index: find expired windows fast
CREATE INDEX IF NOT EXISTS rate_limit_counters_window_start_idx
  ON rate_limit_counters (window_start);

-- ── RLS ───────────────────────────────────────────────────────────────────────
-- No direct client access — only SECURITY DEFINER function touches this table

ALTER TABLE rate_limit_counters ENABLE ROW LEVEL SECURITY;

-- Block all direct access; the function uses SECURITY DEFINER to bypass RLS
CREATE POLICY "no_direct_access"
  ON rate_limit_counters
  FOR ALL
  TO authenticated, anon
  USING (false);

-- ── Function ──────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION check_rate_limit(
  p_user_id        uuid,
  p_function       text,
  p_max_requests   int  DEFAULT 50,
  p_window_seconds int  DEFAULT 3600
)
RETURNS int                    -- returns the NEW request count for this window
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_window_start  timestamptz;
  v_count         int;
BEGIN
  -- Align to the nearest window boundary (e.g. floor to the hour)
  v_window_start := date_trunc('second', now())
                    - ((EXTRACT(EPOCH FROM now())::int % p_window_seconds)
                       * interval '1 second');

  -- Upsert: create row for this window or increment existing
  INSERT INTO rate_limit_counters (user_id, function_name, window_start, request_count)
  VALUES (p_user_id, p_function, v_window_start, 1)
  ON CONFLICT (user_id, function_name, window_start)
  DO UPDATE SET request_count = rate_limit_counters.request_count + 1
  RETURNING request_count INTO v_count;

  -- Opportunistic cleanup: delete windows older than 2× the window size
  -- (runs ~1% of the time to avoid overhead on every request)
  IF random() < 0.01 THEN
    DELETE FROM rate_limit_counters
    WHERE window_start < now() - (p_window_seconds * 2 * interval '1 second');
  END IF;

  RETURN v_count;
END;
$$;

-- Only edge functions (service role) and authenticated users can call this
REVOKE EXECUTE ON FUNCTION check_rate_limit(uuid, text, int, int)
  FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION check_rate_limit(uuid, text, int, int)
  TO authenticated, service_role;

-- ── DOWN (rollback) ───────────────────────────────────────────────────────────
-- DROP FUNCTION IF EXISTS check_rate_limit(uuid, text, int, int);
-- DROP TABLE IF EXISTS rate_limit_counters CASCADE;
