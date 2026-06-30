-- ═══ PROJECTS TABLE: New Columns ═══
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS health_score     integer DEFAULT 0 CHECK (health_score BETWEEN 0 AND 100),
  ADD COLUMN IF NOT EXISTS health_status    text DEFAULT 'not_started'
    CHECK (health_status IN ('on_track','at_risk','overdue','not_started')),
  ADD COLUMN IF NOT EXISTS phase_progress   jsonb DEFAULT '{"initiation":0,"planning":0,"execution":0,"monitoring":0,"closing":0}',
  ADD COLUMN IF NOT EXISTS velocity         float DEFAULT 0,
  ADD COLUMN IF NOT EXISTS forecasted_end   date,
  ADD COLUMN IF NOT EXISTS risk_count       jsonb DEFAULT '{"high":0,"medium":0,"low":0}',
  ADD COLUMN IF NOT EXISTS last_activity_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS ai_brief         text,
  ADD COLUMN IF NOT EXISTS settings         jsonb DEFAULT '{}';

-- ═══ NEW TABLE: project_phases ═══
CREATE TABLE IF NOT EXISTS project_phases (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES auth.users(id),
  phase       text NOT NULL CHECK (phase IN ('initiation','planning','execution','monitoring','closing')),
  status      text DEFAULT 'pending' CHECK (status IN ('pending','in_progress','completed')),
  progress    integer DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  target_date date,
  checklist   jsonb DEFAULT '[]',
  notes       text,
  created_at  timestamptz DEFAULT now(),
  UNIQUE(project_id, phase)
);
ALTER TABLE project_phases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own project_phases" ON project_phases
  FOR ALL USING (auth.uid() = user_id);

-- ═══ NEW TABLE: project_risks ═══
CREATE TABLE IF NOT EXISTS project_risks (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id   uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id      uuid NOT NULL REFERENCES auth.users(id),
  title        text NOT NULL,
  description  text,
  probability  text DEFAULT 'medium' CHECK (probability IN ('low','medium','high')),
  impact       text DEFAULT 'medium' CHECK (impact IN ('low','medium','high')),
  severity     text GENERATED ALWAYS AS (
    CASE
      WHEN probability='high' AND impact='high' THEN 'critical'
      WHEN probability='high' OR impact='high' THEN 'high'
      WHEN probability='low' AND impact='low' THEN 'low'
      ELSE 'medium'
    END
  ) STORED,
  status       text DEFAULT 'open' CHECK (status IN ('open','mitigated','closed')),
  mitigation   text,
  created_at   timestamptz DEFAULT now()
);
ALTER TABLE project_risks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own project_risks" ON project_risks
  FOR ALL USING (auth.uid() = user_id);

-- ═══ NEW TABLE: project_activity_feed ═══
CREATE TABLE IF NOT EXISTS project_activity_feed (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES auth.users(id),
  event_type  text NOT NULL,
  title       text NOT NULL,
  description text,
  metadata    jsonb DEFAULT '{}',
  created_at  timestamptz DEFAULT now()
);
ALTER TABLE project_activity_feed ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own activity_feed" ON project_activity_feed
  FOR ALL USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_activity_feed_project
  ON project_activity_feed(project_id, created_at DESC);

-- ═══ NEW TABLE: project_stakeholders ═══
CREATE TABLE IF NOT EXISTS project_stakeholders (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES auth.users(id),
  name        text NOT NULL,
  role        text,
  email       text,
  created_at  timestamptz DEFAULT now()
);
ALTER TABLE project_stakeholders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own stakeholders" ON project_stakeholders
  FOR ALL USING (auth.uid() = user_id);

-- ═══ INDEXES ═══
CREATE INDEX IF NOT EXISTS idx_projects_health ON projects(health_status, user_id);
CREATE INDEX IF NOT EXISTS idx_projects_phase  ON projects(phase, user_id);
