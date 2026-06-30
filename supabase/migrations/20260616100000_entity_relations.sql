-- Entity Relations: weighted, typed relationships between any entity pairs
-- Supports: contributes_to | blocks | depends_on | parent_of | child_of

CREATE TABLE IF NOT EXISTS public.entity_relations (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_id     UUID        NOT NULL,
  source_type   TEXT        NOT NULL,
  source_label  TEXT        NOT NULL DEFAULT '',   -- denorm title for read perf
  target_id     UUID        NOT NULL,
  target_type   TEXT        NOT NULL,
  target_label  TEXT        NOT NULL DEFAULT '',   -- denorm title for read perf
  relation_type TEXT        NOT NULL,
  weight        FLOAT       NOT NULL DEFAULT 1.0,
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT entity_relations_source_type_check
    CHECK (source_type IN ('task','project','goal','area','habit','resource','note')),
  CONSTRAINT entity_relations_target_type_check
    CHECK (target_type IN ('task','project','goal','area','habit','resource','note')),
  CONSTRAINT entity_relations_relation_type_check
    CHECK (relation_type IN ('contributes_to','blocks','depends_on','parent_of','child_of')),
  CONSTRAINT entity_relations_weight_check
    CHECK (weight > 0 AND weight <= 1),
  CONSTRAINT entity_relations_no_self_loop
    CHECK (source_id <> target_id),
  CONSTRAINT entity_relations_unique
    UNIQUE(user_id, source_id, target_id, relation_type)
);

-- Row-level security: users see and manage only their own relations
ALTER TABLE public.entity_relations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "entity_relations: user owns" ON public.entity_relations
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Fast lookups from either direction
CREATE INDEX IF NOT EXISTS er_source_idx ON public.entity_relations (user_id, source_id);
CREATE INDEX IF NOT EXISTS er_target_idx ON public.entity_relations (user_id, target_id);
CREATE INDEX IF NOT EXISTS er_type_idx   ON public.entity_relations (user_id, relation_type);
