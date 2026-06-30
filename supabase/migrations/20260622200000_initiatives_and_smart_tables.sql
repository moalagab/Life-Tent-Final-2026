-- ════════════════════════════════════════════════════════
--  INITIATIVES
-- ════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS initiatives (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title       TEXT        NOT NULL,
  description TEXT,
  goal_id     UUID        REFERENCES goals(id)    ON DELETE SET NULL,
  project_id  UUID        REFERENCES projects(id) ON DELETE SET NULL,
  area_id     UUID        REFERENCES areas(id)    ON DELETE SET NULL,
  status      TEXT        NOT NULL DEFAULT 'active'
                          CHECK (status IN ('active','in_progress','completed','cancelled','on_hold')),
  priority    TEXT        NOT NULL DEFAULT 'medium'
                          CHECK (priority IN ('low','medium','high','critical')),
  progress    INTEGER     NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  start_date  DATE,
  due_date    DATE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE initiatives ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "user_owns_initiatives" ON initiatives;
CREATE POLICY "user_owns_initiatives" ON initiatives
  FOR ALL USING (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_initiatives_goal_id    ON initiatives (goal_id);
CREATE INDEX IF NOT EXISTS idx_initiatives_project_id ON initiatives (project_id);
CREATE INDEX IF NOT EXISTS idx_initiatives_area_id    ON initiatives (area_id);

CREATE OR REPLACE FUNCTION set_initiatives_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;
DROP TRIGGER IF EXISTS trg_initiatives_updated_at ON initiatives;
CREATE TRIGGER trg_initiatives_updated_at
  BEFORE UPDATE ON initiatives FOR EACH ROW
  EXECUTE FUNCTION set_initiatives_updated_at();

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS initiative_id UUID REFERENCES initiatives(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_initiative_id ON tasks (initiative_id);

-- ════════════════════════════════════════════════════════
--  SMART TABLES
-- ════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS custom_tables (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title       TEXT        NOT NULL,
  description TEXT,
  icon        TEXT        DEFAULT '📊',
  color       TEXT        DEFAULT '#2E63E8',
  entity_type TEXT        CHECK (entity_type IN ('area','project','goal','initiative','global')),
  entity_id   UUID,
  columns     JSONB       NOT NULL DEFAULT '[]',
  status      TEXT        NOT NULL DEFAULT 'active' CHECK (status IN ('active','archived')),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE custom_tables ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "user_owns_custom_tables" ON custom_tables;
CREATE POLICY "user_owns_custom_tables" ON custom_tables
  FOR ALL USING (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_custom_tables_entity ON custom_tables (entity_type, entity_id);

CREATE TABLE IF NOT EXISTS custom_table_rows (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  table_id    UUID        NOT NULL REFERENCES custom_tables(id) ON DELETE CASCADE,
  data        JSONB       NOT NULL DEFAULT '{}',
  position    INTEGER     NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE custom_table_rows ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "user_owns_custom_table_rows" ON custom_table_rows;
CREATE POLICY "user_owns_custom_table_rows" ON custom_table_rows
  FOR ALL USING (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_custom_table_rows_table ON custom_table_rows (table_id, position);

CREATE OR REPLACE FUNCTION set_custom_tables_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;
DROP TRIGGER IF EXISTS trg_custom_tables_updated_at ON custom_tables;
CREATE TRIGGER trg_custom_tables_updated_at
  BEFORE UPDATE ON custom_tables FOR EACH ROW
  EXECUTE FUNCTION set_custom_tables_updated_at();

CREATE OR REPLACE FUNCTION set_custom_table_rows_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;
DROP TRIGGER IF EXISTS trg_custom_table_rows_updated_at ON custom_table_rows;
CREATE TRIGGER trg_custom_table_rows_updated_at
  BEFORE UPDATE ON custom_table_rows FOR EACH ROW
  EXECUTE FUNCTION set_custom_table_rows_updated_at();
