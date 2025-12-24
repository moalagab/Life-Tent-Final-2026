-- Create enum for customer status
CREATE TYPE public.customer_status AS ENUM ('lead', 'prospect', 'active', 'inactive', 'churned');

-- Create enum for case status
CREATE TYPE public.case_status AS ENUM ('open', 'in_progress', 'pending', 'resolved', 'closed');

-- Create enum for case priority
CREATE TYPE public.case_priority AS ENUM ('low', 'medium', 'high', 'urgent');

-- Create enum for communication type
CREATE TYPE public.communication_type AS ENUM ('call', 'email', 'meeting', 'note', 'message');

-- Create customers table
CREATE TABLE public.customers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company TEXT,
  status customer_status DEFAULT 'lead',
  pipeline_stage TEXT DEFAULT 'new',
  notes TEXT,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create customer cases table
CREATE TABLE public.customer_cases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status case_status DEFAULT 'open',
  priority case_priority DEFAULT 'medium',
  due_date DATE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create customer communications table
CREATE TABLE public.customer_communications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE NOT NULL,
  case_id UUID REFERENCES public.customer_cases(id) ON DELETE SET NULL,
  type communication_type NOT NULL DEFAULT 'note',
  subject TEXT,
  content TEXT,
  contact_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_communications ENABLE ROW LEVEL SECURITY;

-- RLS policies for customers
CREATE POLICY "Users can view own customers" ON public.customers
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own customers" ON public.customers
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own customers" ON public.customers
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own customers" ON public.customers
  FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for customer_cases
CREATE POLICY "Users can view own cases" ON public.customer_cases
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own cases" ON public.customer_cases
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cases" ON public.customer_cases
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own cases" ON public.customer_cases
  FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for customer_communications
CREATE POLICY "Users can view own communications" ON public.customer_communications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own communications" ON public.customer_communications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own communications" ON public.customer_communications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own communications" ON public.customer_communications
  FOR DELETE USING (auth.uid() = user_id);

-- Triggers for updated_at
CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON public.customers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_customer_cases_updated_at
  BEFORE UPDATE ON public.customer_cases
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();