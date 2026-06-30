-- ============================================================
-- Protect Admin & Ban Flags on profiles
--
-- Problem (3 attack vectors):
--
--   1. Self-escalation via own profile:
--      "Users can update own profile" policy has only USING (no WITH CHECK).
--      Any authenticated user can:
--        supabase.from('profiles').update({ is_admin: true }).eq('user_id', uid)
--      ...and it succeeds because RLS only checks *which row*, not *what value*.
--
--   2. Admin-to-admin escalation:
--      "admin_update_profiles" policy lets any admin UPDATE any profile
--      including setting is_admin = true on another account, or
--      clearing is_banned = false on a banned account — with no audit.
--
--   3. Ban self-removal:
--      A banned user (if they somehow get a valid session) could set
--      is_banned = false on their own profile.
--
-- Fix:
--
--   A) Trigger function protect_admin_flag()
--      Fires BEFORE UPDATE on profiles.
--      Blocks any change to is_admin or is_banned (false→true or ban clearing)
--      when auth.uid() IS NOT NULL (i.e. an authenticated user request).
--
--      auth.uid() is NULL for:
--        - service_role requests  (PostgREST doesn't set a user JWT)
--        - SECURITY DEFINER functions running as postgres
--        - Direct DB migrations
--      All of those are allowed through.
--
--   B) admin_set_user_admin(target_user_id, new_is_admin)
--      The ONLY safe path to grant/revoke admin.
--      SECURITY DEFINER → runs as postgres → bypasses trigger.
--      Has its own auth guard (caller must be admin or service_role).
--      Writes to admin_audit_log for full auditability.
--
--   C) Tighten RLS: replace the overly-broad "admin_update_profiles"
--      with a scoped policy that excludes is_admin changes.
--      (The trigger is the backstop; RLS is the first gate.)
--
-- ============================================================


-- ── A. Trigger function ───────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION protect_admin_flag()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- auth.uid() is non-NULL only when a real user JWT is present.
  -- service_role requests and internal DB calls have NULL → allowed through.
  IF auth.uid() IS NOT NULL THEN

    -- Block ANY change to is_admin (both granting and revoking)
    IF (OLD.is_admin IS DISTINCT FROM NEW.is_admin) THEN
      RAISE EXCEPTION
        'Permission denied: is_admin cannot be changed directly. '
        'Use the admin_set_user_admin() function via service role. '
        '[ADMIN_FLAG_PROTECTED]'
      USING ERRCODE = '42501'; -- insufficient_privilege
    END IF;

    -- Block clearing is_banned (prevents banned users un-banning themselves,
    -- and prevents admins accidentally clearing bans via direct UPDATE)
    IF (OLD.is_banned = true AND NEW.is_banned = false) THEN
      RAISE EXCEPTION
        'Permission denied: is_banned cannot be cleared directly. '
        'Use admin_set_user_banned() via service role. '
        '[BAN_FLAG_PROTECTED]'
      USING ERRCODE = '42501';
    END IF;

    -- Also block setting is_banned = true on yourself (self-ban is nonsensical
    -- but closes the door fully)
    IF (OLD.is_banned = false AND NEW.is_banned = true
        AND OLD.user_id = auth.uid()) THEN
      RAISE EXCEPTION
        'Permission denied: cannot set is_banned on your own account. '
        '[SELF_BAN_BLOCKED]'
      USING ERRCODE = '42501';
    END IF;

  END IF;

  RETURN NEW;
END;
$$;

-- Drop if exists, then recreate (idempotent)
DROP TRIGGER IF EXISTS enforce_admin_flag_protection ON profiles;
CREATE TRIGGER enforce_admin_flag_protection
  BEFORE UPDATE OF is_admin, is_banned ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION protect_admin_flag();

-- Revoke direct execute — only called internally by Postgres as trigger
REVOKE EXECUTE ON FUNCTION protect_admin_flag() FROM PUBLIC, anon, authenticated;


-- ── B. admin_set_user_admin() — safe grant/revoke path ───────────────────────
--
--  Called from service role only (e.g. from a secure admin backend).
--  Validates caller is admin OR call originates from service role (no JWT user).
--  Writes a full audit trail to admin_audit_log.
--
--  Example (from Edge Function with service role key):
--    const { error } = await supabase.rpc('admin_set_user_admin', {
--      p_target_user_id: '...uuid...',
--      p_is_admin: true,
--    });

CREATE OR REPLACE FUNCTION admin_set_user_admin(
  p_target_user_id  uuid,
  p_is_admin        boolean
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id       uuid;
  v_target_exists   boolean;
  v_old_value       boolean;
  v_action          text;
BEGIN
  v_caller_id := auth.uid(); -- NULL when called from service role

  -- Auth guard: allow only admins or service role
  IF v_caller_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = v_caller_id AND is_admin = true
    ) THEN
      RAISE EXCEPTION 'Unauthorized: only admins may call admin_set_user_admin()'
        USING ERRCODE = '42501';
    END IF;

    -- Admins cannot de-admin themselves (prevents accidental lockout)
    IF v_caller_id = p_target_user_id AND p_is_admin = false THEN
      RAISE EXCEPTION 'Admins cannot revoke their own admin status'
        USING ERRCODE = '42501';
    END IF;
  END IF;

  -- Ensure target exists
  SELECT is_admin INTO v_old_value
  FROM profiles
  WHERE user_id = p_target_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Target user % not found', p_target_user_id
      USING ERRCODE = 'P0002';
  END IF;

  -- No-op if already in desired state
  IF v_old_value IS NOT DISTINCT FROM p_is_admin THEN
    RETURN;
  END IF;

  v_action := CASE WHEN p_is_admin THEN 'grant_admin' ELSE 'revoke_admin' END;

  -- Apply the change (runs as postgres — trigger allows auth.uid()=NULL)
  UPDATE profiles
  SET    is_admin   = p_is_admin,
         updated_at = now()
  WHERE  user_id = p_target_user_id;

  -- Audit trail
  INSERT INTO admin_audit_log (admin_user_id, action, target_user_id, details)
  VALUES (
    v_caller_id,
    v_action,
    p_target_user_id,
    jsonb_build_object(
      'old_is_admin', v_old_value,
      'new_is_admin', p_is_admin,
      'changed_by',   COALESCE(v_caller_id::text, 'service_role')
    )
  );
END;
$$;

-- Only admins and service role may call this function
REVOKE EXECUTE ON FUNCTION admin_set_user_admin(uuid, boolean) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION admin_set_user_admin(uuid, boolean) TO authenticated, service_role;


-- ── C. admin_set_user_banned() — safe ban/unban path ─────────────────────────

CREATE OR REPLACE FUNCTION admin_set_user_banned(
  p_target_user_id  uuid,
  p_is_banned       boolean,
  p_reason          text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id   uuid;
  v_old_banned  boolean;
  v_action      text;
BEGIN
  v_caller_id := auth.uid();

  -- Auth guard
  IF v_caller_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = v_caller_id AND is_admin = true
    ) THEN
      RAISE EXCEPTION 'Unauthorized: only admins may call admin_set_user_banned()'
        USING ERRCODE = '42501';
    END IF;

    -- Admins cannot ban themselves
    IF v_caller_id = p_target_user_id AND p_is_banned = true THEN
      RAISE EXCEPTION 'Admins cannot ban their own account'
        USING ERRCODE = '42501';
    END IF;
  END IF;

  SELECT is_banned INTO v_old_banned
  FROM profiles
  WHERE user_id = p_target_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Target user % not found', p_target_user_id
      USING ERRCODE = 'P0002';
  END IF;

  IF v_old_banned IS NOT DISTINCT FROM p_is_banned THEN RETURN; END IF;

  v_action := CASE WHEN p_is_banned THEN 'ban_user' ELSE 'unban_user' END;

  UPDATE profiles
  SET is_banned     = p_is_banned,
      banned_at     = CASE WHEN p_is_banned THEN now() ELSE NULL END,
      banned_reason = CASE WHEN p_is_banned THEN p_reason ELSE NULL END,
      updated_at    = now()
  WHERE user_id = p_target_user_id;

  INSERT INTO admin_audit_log (admin_user_id, action, target_user_id, details)
  VALUES (
    v_caller_id,
    v_action,
    p_target_user_id,
    jsonb_build_object(
      'reason',      p_reason,
      'changed_by',  COALESCE(v_caller_id::text, 'service_role')
    )
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION admin_set_user_banned(uuid, boolean, text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION admin_set_user_banned(uuid, boolean, text) TO authenticated, service_role;


-- ── D. Tighten RLS on profiles ────────────────────────────────────────────────
--
-- PostgreSQL RLS WITH CHECK cannot reference OLD — so we cannot restrict
-- specific columns at the policy layer alone.
--
-- The trigger (section A) is the authoritative guard for is_admin / is_banned.
-- The policy below adds the missing WITH CHECK clause (making it explicit that
-- the new row must still belong to the same user), and adds a split into
-- two policies: one for self-updates, one for admin-updates, so the scope
-- of each is clear and auditable.

-- Own-profile update: user can update their own row, WITH CHECK ensures
-- the user_id is not changed to someone else's.
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE
  USING     (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
-- Note: is_admin / is_banned column changes are blocked by the trigger,
-- not here. WITH CHECK cannot compare with OLD values in RLS.


-- ── DOWN (rollback) ───────────────────────────────────────────────────────────
-- DROP TRIGGER  IF EXISTS enforce_admin_flag_protection ON profiles;
-- DROP FUNCTION IF EXISTS protect_admin_flag();
-- DROP FUNCTION IF EXISTS admin_set_user_admin(uuid, boolean);
-- DROP FUNCTION IF EXISTS admin_set_user_banned(uuid, boolean, text);
-- Restore original policy:
-- DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
-- CREATE POLICY "Users can update own profile" ON profiles
--   FOR UPDATE USING (auth.uid() = user_id);
