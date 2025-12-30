-- 1. Add habit_id to goals table
ALTER TABLE public.goals ADD COLUMN IF NOT EXISTS habit_id uuid REFERENCES public.habits(id) ON DELETE SET NULL;

-- 2. Add project_id and note_id to media_items table
ALTER TABLE public.media_items ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL;
ALTER TABLE public.media_items ADD COLUMN IF NOT EXISTS note_id uuid REFERENCES public.notes(id) ON DELETE SET NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_goals_habit_id ON public.goals(habit_id);
CREATE INDEX IF NOT EXISTS idx_media_items_project_id ON public.media_items(project_id);
CREATE INDEX IF NOT EXISTS idx_media_items_note_id ON public.media_items(note_id);