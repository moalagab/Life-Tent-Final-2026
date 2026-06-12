-- ============================================================
-- Fix infinite RLS recursion on projects + project_members
--
-- Root cause:
--   projects_select  → EXISTS (SELECT FROM project_members)
--   pm_select        → EXISTS (SELECT FROM projects)
--   → PostgreSQL loops forever, query hangs
--
-- Additional bug in projects_select:
--   project_members.project_id = project_members.id   ← WRONG (self-join)
--   should be project_members.project_id = projects.id
--
-- Fix strategy:
--   1. Drop the buggy projects_select policy
--   2. Keep/restore the simple "Users can view own projects" policy
--   3. Rewrite pm_select without referencing projects table
--      (a user can see memberships where they are the member or inviter)
-- ============================================================

-- ── 1. Remove the buggy, recursive projects SELECT policy ─────────────────────
DROP POLICY IF EXISTS "projects_select" ON projects;

-- Ensure the simple owner-only policy exists (may already be present)
DROP POLICY IF EXISTS "Users can view own projects" ON projects;
CREATE POLICY "Users can view own projects" ON projects
  FOR SELECT
  USING (auth.uid() = user_id);

-- ── 2. Fix pm_select — remove the cross-reference to projects ─────────────────
-- Old policy caused recursion by querying projects inside project_members policy.
-- New policy: a user can see rows where they are the member OR the inviter.
-- Project owners don't need to query project_members to manage sharing;
-- that is gated at the RPC level (SECURITY DEFINER).
DROP POLICY IF EXISTS "pm_select" ON project_members;
CREATE POLICY "pm_select" ON project_members
  FOR SELECT
  USING (
    user_id    = auth.uid()   -- I am the member
    OR invited_by = auth.uid() -- I sent the invite
  );

-- pm_insert / pm_update / pm_delete also reference projects → fix them too
DROP POLICY IF EXISTS "pm_insert" ON project_members;
CREATE POLICY "pm_insert" ON project_members
  FOR INSERT
  WITH CHECK (invited_by = auth.uid());  -- only the inviter inserts via RPC

DROP POLICY IF EXISTS "pm_update" ON project_members;
CREATE POLICY "pm_update" ON project_members
  FOR UPDATE
  USING (invited_by = auth.uid());

DROP POLICY IF EXISTS "pm_delete" ON project_members;
CREATE POLICY "pm_delete" ON project_members
  FOR DELETE
  USING (
    user_id    = auth.uid()   -- leave yourself
    OR invited_by = auth.uid() -- inviter can remove
  );
