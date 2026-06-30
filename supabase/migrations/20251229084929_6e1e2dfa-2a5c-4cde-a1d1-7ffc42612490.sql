-- Add new columns to projects table for scope, outputs, owner, and risks
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS scope TEXT,
ADD COLUMN IF NOT EXISTS outputs TEXT,
ADD COLUMN IF NOT EXISTS owner TEXT,
ADD COLUMN IF NOT EXISTS risks TEXT;

-- Add category field to tasks for work/personal filtering
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'personal';

-- Create project_attachments table
CREATE TABLE public.project_attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  file_type TEXT,
  size_bytes INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.project_attachments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for project_attachments
CREATE POLICY "Users can view own project_attachments" 
ON public.project_attachments 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own project_attachments" 
ON public.project_attachments 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own project_attachments" 
ON public.project_attachments 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create finance_audit_log table for tracking changes
CREATE TABLE public.finance_audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  action TEXT NOT NULL,
  old_values JSONB,
  new_values JSONB,
  source TEXT DEFAULT 'manual',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.finance_audit_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for finance_audit_log
CREATE POLICY "Users can view own finance_audit_log" 
ON public.finance_audit_log 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own finance_audit_log" 
ON public.finance_audit_log 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Add advanced investment fields
ALTER TABLE public.investment_holdings 
ADD COLUMN IF NOT EXISTS target_allocation_percent NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_zakatable BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS entry_target_price NUMERIC,
ADD COLUMN IF NOT EXISTS stop_loss_price NUMERIC,
ADD COLUMN IF NOT EXISTS take_profit_price NUMERIC,
ADD COLUMN IF NOT EXISTS investment_journal TEXT;

-- Add source tracking to transactions
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual';

-- Add source tracking to debts
ALTER TABLE public.debts 
ADD COLUMN IF NOT EXISTS monthly_payment_date INTEGER DEFAULT 1;