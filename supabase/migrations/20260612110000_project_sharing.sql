-- ============================================================
-- Project Sharing — allow a project owner to invite other
-- registered users as editor or viewer.
--
-- Schema:
--   project_members(project_id, user_id, role, invited_by)
--
-- Access model:
--   • Owner  (projects.user_id)  — full CRUD via existing policies
--   • Editor (role='editor')     — read + write tasks / project rows
--   • Viewer (role='viewer')     — read-only
--
-- Invite flow (client):
--   await supabase.rpc('invite_project_member', {
--     p_project_id: '...', p_invitee_email: 'alice@example.com'
--   });
-- ============================================================

-- ── Table ─────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS project_members (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id   uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role         text NOT NULL DEFAULT 'viewer'
               CHECK (role IN ('editor', 'viewer')),
  invited_by   uuid REFERENCES auth.users(id),
  created_at   timestamptz DEFAULT now() NOT NULL,
  UNIQUE (project_id, user_id)
);

ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;

-- Members can see memberships for projects they belong to
CREATE POLICY "pm_select" ON project_members
  FOR SELECT
  USING (
    user_id = auth.uid()
    OR invited_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM projects WHERE id = project_id AND user_id = auth.uid()
    )
  );

-- Only project owner can add members
CREATE POLICY "pm_insert" ON project_members
  FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM projects WHERE id = project_id AND user_id = auth.uid())
  );

-- Only project owner can change role or remove members
CREATE POLICY "pm_update" ON project_members
  FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM projects WHERE id = project_id AND user_id = auth.uid())
  );

CREATE POLICY "pm_delete" ON project_members
  FOR DELETE
  USING (
    user_id = auth.uid()                                                  -- leave yourself
    OR EXISTS (                                                           -- or owner removes
      SELECT 1 FROM projects WHERE id = project_id AND user_id = auth.uid()
    )
  );

-- ── Extend projects SELECT to include members ─────────────────────────────────

-- Drop the old broad policy if it exists (name may vary)
DROP POLICY IF EXISTS "Users can view their own projects" ON projects;
DROP POLICY IF EXISTS "projects_select_own" ON projects;

-- New policy: owner OR member
CREATE POLICY "projects_select" ON projects
  FOR SELECT
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM project_members
      WHERE project_id = id AND user_id = auth.uid()
    )
  );

-- ── invite_project_member RPC ─────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION invite_project_member(
  p_project_id    uuid,
  p_invitee_email text,
  p_role          text DEFAULT 'viewer'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invitee_id    uuid;
  v_project_owner uuid;
BEGIN
  -- Validate role value
  IF p_role NOT IN ('editor', 'viewer') THEN
    RAISE EXCEPTION 'Invalid role: %. Must be editor or viewer.', p_role
      USING ERRCODE = '22023';
  END IF;

  -- Caller must be project owner
  SELECT user_id INTO v_project_owner
  FROM projects WHERE id = p_project_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Project % not found', p_project_id
      USING ERRCODE = 'P0002';
  END IF;

  IF v_project_owner IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Only the project owner can invite members'
      USING ERRCODE = '42501';
  END IF;

  -- Look up invitee by email
  SELECT id INTO v_invitee_id
  FROM auth.users WHERE email = lower(p_invitee_email);

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No user found with email %', p_invitee_email
      USING ERRCODE = 'P0002';
  END IF;

  IF v_invitee_id = auth.uid() THEN
    RAISE EXCEPTION 'You cannot invite yourself to a project'
      USING ERRCODE = '42501';
  END IF;

  -- Upsert
  INSERT INTO project_members (project_id, user_id, role, invited_by)
  VALUES (p_project_id, v_invitee_id, p_role, auth.uid())
  ON CONFLICT (project_id, user_id)
  DO UPDATE SET role = EXCLUDED.role;

  RETURN jsonb_build_object('success', true, 'user_id', v_invitee_id, 'role', p_role);
END;
$$;

REVOKE EXECUTE ON FUNCTION invite_project_member(uuid, text, text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION invite_project_member(uuid, text, text) TO authenticated;


-- ── remove_project_member RPC ─────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION remove_project_member(
  p_project_id uuid,
  p_user_id    uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner uuid;
BEGIN
  SELECT user_id INTO v_owner FROM projects WHERE id = p_project_id;

  IF v_owner IS DISTINCT FROM auth.uid() AND p_user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized' USING ERRCODE = '42501';
  END IF;

  DELETE FROM project_members
  WHERE project_id = p_project_id AND user_id = p_user_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION remove_project_member(uuid, uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION remove_project_member(uuid, uuid) TO authenticated;

-- DOWN:
-- DROP FUNCTION IF EXISTS invite_project_member(uuid, text, text);
-- DROP FUNCTION IF EXISTS remove_project_member(uuid, uuid);
-- DROP TABLE  IF EXISTS project_members;
-- Restore original projects SELECT policy as needed.
