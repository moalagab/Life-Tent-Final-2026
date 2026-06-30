-- Add project_id column to goals table for linking goals to projects
ALTER TABLE public.goals 
ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_goals_project_id ON public.goals(project_id);