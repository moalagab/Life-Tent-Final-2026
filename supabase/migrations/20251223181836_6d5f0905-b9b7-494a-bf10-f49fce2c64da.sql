-- Add new columns to projects table for Vision & Investment tracking
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS vision TEXT,
ADD COLUMN IF NOT EXISTS investment_notes TEXT,
ADD COLUMN IF NOT EXISTS expected_roi TEXT,
ADD COLUMN IF NOT EXISTS risk_level TEXT DEFAULT 'medium',
ADD COLUMN IF NOT EXISTS start_date DATE,
ADD COLUMN IF NOT EXISTS estimated_budget NUMERIC,
ADD COLUMN IF NOT EXISTS actual_budget NUMERIC;

-- Create project_okrs table for OKRs linked to projects
CREATE TABLE IF NOT EXISTS public.project_okrs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  objective TEXT NOT NULL,
  description TEXT,
  quarter TEXT,
  year INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
  progress INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create project_key_results table for Key Results linked to OKRs
CREATE TABLE IF NOT EXISTS public.project_key_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  okr_id UUID NOT NULL REFERENCES public.project_okrs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  target_value NUMERIC NOT NULL,
  current_value NUMERIC DEFAULT 0,
  unit TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create planning_pipeline table for projects in initiation phase
CREATE TABLE IF NOT EXISTS public.planning_pipeline (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  
  -- Stage 1: Strategy & Direction
  strategy_vision TEXT,
  strategy_why TEXT,
  strategy_where TEXT,
  strategy_completed BOOLEAN DEFAULT false,
  
  -- Stage 2: Validation
  validation_problem TEXT,
  validation_solution TEXT,
  validation_target_market TEXT,
  validation_completed BOOLEAN DEFAULT false,
  
  -- Stage 3: Business Model
  business_revenue_model TEXT,
  business_cost_structure TEXT,
  business_value_proposition TEXT,
  business_completed BOOLEAN DEFAULT false,
  
  -- Stage 4: Feasibility
  feasibility_technical TEXT,
  feasibility_financial TEXT,
  feasibility_timeline TEXT,
  feasibility_resources TEXT,
  feasibility_completed BOOLEAN DEFAULT false,
  
  -- Stage 5: Go/No-Go
  decision TEXT CHECK (decision IN ('go', 'no_go', 'pending')),
  decision_notes TEXT,
  decision_date TIMESTAMP WITH TIME ZONE,
  
  current_stage INTEGER DEFAULT 1,
  status TEXT DEFAULT 'in_progress',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.project_okrs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_key_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planning_pipeline ENABLE ROW LEVEL SECURITY;

-- RLS Policies for project_okrs
CREATE POLICY "Users can view own project_okrs"
ON public.project_okrs FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own project_okrs"
ON public.project_okrs FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own project_okrs"
ON public.project_okrs FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own project_okrs"
ON public.project_okrs FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies for project_key_results
CREATE POLICY "Users can view own project_key_results"
ON public.project_key_results FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own project_key_results"
ON public.project_key_results FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own project_key_results"
ON public.project_key_results FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own project_key_results"
ON public.project_key_results FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies for planning_pipeline
CREATE POLICY "Users can view own planning_pipeline"
ON public.planning_pipeline FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own planning_pipeline"
ON public.planning_pipeline FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own planning_pipeline"
ON public.planning_pipeline FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own planning_pipeline"
ON public.planning_pipeline FOR DELETE
USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_project_okrs_project ON public.project_okrs(project_id);
CREATE INDEX IF NOT EXISTS idx_project_okrs_user ON public.project_okrs(user_id);
CREATE INDEX IF NOT EXISTS idx_project_key_results_okr ON public.project_key_results(okr_id);
CREATE INDEX IF NOT EXISTS idx_planning_pipeline_user ON public.planning_pipeline(user_id);
CREATE INDEX IF NOT EXISTS idx_planning_pipeline_project ON public.planning_pipeline(project_id);

-- Update triggers for timestamps
CREATE TRIGGER update_project_okrs_updated_at
BEFORE UPDATE ON public.project_okrs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_project_key_results_updated_at
BEFORE UPDATE ON public.project_key_results
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_planning_pipeline_updated_at
BEFORE UPDATE ON public.planning_pipeline
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();