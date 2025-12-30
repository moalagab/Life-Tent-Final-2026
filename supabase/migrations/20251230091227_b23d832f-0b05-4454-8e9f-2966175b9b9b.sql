-- A1: Create Areas table
CREATE TABLE public.areas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  owner_id UUID,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  review_cadence TEXT DEFAULT 'monthly' CHECK (review_cadence IN ('weekly', 'monthly', 'quarterly', 'yearly')),
  kpi_json JSONB,
  color TEXT DEFAULT '#6366f1',
  icon TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  archived_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.areas ENABLE ROW LEVEL SECURITY;

-- RLS Policies for areas
CREATE POLICY "Users can view own areas" ON public.areas FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own areas" ON public.areas FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own areas" ON public.areas FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own areas" ON public.areas FOR DELETE USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_areas_updated_at BEFORE UPDATE ON public.areas
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- A1: Add area_id to projects
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS area_id UUID REFERENCES public.areas(id) ON DELETE SET NULL;

-- A1: Add area_id to tasks
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS area_id UUID REFERENCES public.areas(id) ON DELETE SET NULL;

-- A1: Add area_id to goals
ALTER TABLE public.goals ADD COLUMN IF NOT EXISTS area_id UUID REFERENCES public.areas(id) ON DELETE SET NULL;

-- A2: Add status and archived_at to projects (if not exists)
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP WITH TIME ZONE;

-- A2: Add status and archived_at to goals
ALTER TABLE public.goals ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP WITH TIME ZONE;

-- A2: Add status and archived_at to tasks
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP WITH TIME ZONE;

-- A2: Add status and archived_at to customers
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP WITH TIME ZONE;

-- A3: Create unified resources table
CREATE TABLE public.resources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('note', 'file', 'link', 'course', 'media', 'document')),
  title TEXT NOT NULL,
  description TEXT,
  content TEXT,
  content_ref TEXT,
  source_url TEXT,
  area_id UUID REFERENCES public.areas(id) ON DELETE SET NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  tags TEXT[],
  metadata JSONB,
  last_used_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  archived_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS for resources
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

-- RLS Policies for resources
CREATE POLICY "Users can view own resources" ON public.resources FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own resources" ON public.resources FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own resources" ON public.resources FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own resources" ON public.resources FOR DELETE USING (auth.uid() = user_id);

-- Trigger for updated_at on resources
CREATE TRIGGER update_resources_updated_at BEFORE UPDATE ON public.resources
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- A4: Add scheduled_at to tasks (for calendar view)
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMP WITH TIME ZONE;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_areas_user_id ON public.areas(user_id);
CREATE INDEX IF NOT EXISTS idx_areas_status ON public.areas(status);
CREATE INDEX IF NOT EXISTS idx_resources_user_id ON public.resources(user_id);
CREATE INDEX IF NOT EXISTS idx_resources_type ON public.resources(type);
CREATE INDEX IF NOT EXISTS idx_resources_area_id ON public.resources(area_id);
CREATE INDEX IF NOT EXISTS idx_resources_project_id ON public.resources(project_id);
CREATE INDEX IF NOT EXISTS idx_projects_area_id ON public.projects(area_id);
CREATE INDEX IF NOT EXISTS idx_tasks_area_id ON public.tasks(area_id);
CREATE INDEX IF NOT EXISTS idx_tasks_scheduled_at ON public.tasks(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_goals_area_id ON public.goals(area_id);