-- Create enums for finance module
CREATE TYPE public.account_type AS ENUM ('bank', 'wallet', 'cash', 'credit', 'investment');
CREATE TYPE public.category_type AS ENUM ('income', 'expense', 'transfer');
CREATE TYPE public.accounting_basis AS ENUM ('cash', 'accrual');
CREATE TYPE public.budget_status AS ENUM ('draft', 'active', 'closed');
CREATE TYPE public.debt_status AS ENUM ('active', 'closed', 'paused');
CREATE TYPE public.subscription_status AS ENUM ('active', 'paused', 'canceled');
CREATE TYPE public.subscription_cycle AS ENUM ('weekly', 'monthly', 'quarterly', 'annual');
CREATE TYPE public.investment_type AS ENUM ('stock', 'etf', 'fund', 'gold', 'crypto', 'bond', 'real_estate');
CREATE TYPE public.investment_tx_type AS ENUM ('buy', 'sell', 'fee', 'dividend', 'transfer', 'deposit', 'withdrawal');
CREATE TYPE public.payoff_strategy AS ENUM ('snowball', 'avalanche');

-- Categories table (hierarchical)
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  name_ar TEXT,
  parent_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  type category_type NOT NULL DEFAULT 'expense',
  icon TEXT,
  color TEXT DEFAULT '#6366f1',
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Payees table
CREATE TABLE public.payees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  default_category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Update accounts table with new columns
ALTER TABLE public.accounts 
  ADD COLUMN IF NOT EXISTS account_type account_type DEFAULT 'bank',
  ADD COLUMN IF NOT EXISTS opening_balance NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS last_reconciled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reconciled_balance NUMERIC DEFAULT 0;

-- Journal entries for double-entry accounting
CREATE TABLE public.journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  memo TEXT,
  source_type TEXT, -- 'transaction', 'adjustment', 'opening'
  source_id UUID,
  is_posted BOOLEAN DEFAULT true,
  posted_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Journal lines (debit/credit entries)
CREATE TABLE public.journal_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journal_entry_id UUID NOT NULL REFERENCES public.journal_entries(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  debit NUMERIC DEFAULT 0,
  credit NUMERIC DEFAULT 0,
  currency TEXT DEFAULT 'SAR',
  memo TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT valid_entry CHECK (
    (debit > 0 AND credit = 0) OR (credit > 0 AND debit = 0) OR (debit = 0 AND credit = 0)
  )
);

-- Update transactions table
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS payee_id UUID REFERENCES public.payees(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS is_split BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_reconciled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS reconciled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS journal_entry_id UUID REFERENCES public.journal_entries(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS tags TEXT[],
  ADD COLUMN IF NOT EXISTS receipt_url TEXT;

-- Transaction splits
CREATE TABLE public.transaction_splits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  memo TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Category rules for auto-classification
CREATE TABLE public.category_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  conditions JSONB NOT NULL, -- {field: 'description', operator: 'contains', value: 'STC'}
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  priority INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Envelopes for envelope budgeting
CREATE TABLE public.envelopes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  budget_id UUID REFERENCES public.budgets(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  target_amount NUMERIC,
  available_amount NUMERIC DEFAULT 0,
  color TEXT DEFAULT '#10b981',
  icon TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Sinking funds
CREATE TABLE public.sinking_funds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  target_amount NUMERIC NOT NULL,
  current_amount NUMERIC DEFAULT 0,
  target_date DATE,
  monthly_contribution NUMERIC,
  linked_envelope_id UUID REFERENCES public.envelopes(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Budget lines (update existing)
ALTER TABLE public.budgets
  ADD COLUMN IF NOT EXISTS status budget_status DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS closed_at TIMESTAMPTZ;

-- Budget category lines
CREATE TABLE public.budget_category_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id UUID NOT NULL REFERENCES public.budgets(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  planned_amount NUMERIC NOT NULL DEFAULT 0,
  actual_amount NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(budget_id, category_id)
);

-- Project finance tracking
CREATE TABLE public.project_finance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE UNIQUE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  currency TEXT DEFAULT 'SAR',
  planned_budget_total NUMERIC DEFAULT 0,
  actual_spend_total NUMERIC DEFAULT 0,
  evm_enabled BOOLEAN DEFAULT false,
  planned_value NUMERIC DEFAULT 0, -- PV
  earned_value NUMERIC DEFAULT 0, -- EV
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Project budget lines
CREATE TABLE public.project_budget_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_finance_id UUID NOT NULL REFERENCES public.project_finance(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  planned_amount NUMERIC NOT NULL DEFAULT 0,
  actual_amount NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Debt schedules
CREATE TABLE public.debt_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  debt_id UUID NOT NULL REFERENCES public.debts(id) ON DELETE CASCADE,
  due_date DATE NOT NULL,
  amount NUMERIC NOT NULL,
  principal_amount NUMERIC DEFAULT 0,
  interest_amount NUMERIC DEFAULT 0,
  is_paid BOOLEAN DEFAULT false,
  paid_at TIMESTAMPTZ,
  transaction_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Update debts table
ALTER TABLE public.debts
  ADD COLUMN IF NOT EXISTS interest_rate NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS minimum_payment NUMERIC,
  ADD COLUMN IF NOT EXISTS lender TEXT,
  ADD COLUMN IF NOT EXISTS status debt_status DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS payoff_strategy payoff_strategy,
  ADD COLUMN IF NOT EXISTS notes TEXT;

-- Update subscriptions table
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS status subscription_status DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS provider TEXT,
  ADD COLUMN IF NOT EXISTS payment_account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS last_paid_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS usage_rating INTEGER CHECK (usage_rating >= 1 AND usage_rating <= 5);

-- Investment portfolios
CREATE TABLE public.investment_portfolios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  base_currency TEXT DEFAULT 'SAR',
  description TEXT,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Investment assets (master list)
CREATE TABLE public.investment_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  name TEXT NOT NULL,
  type investment_type NOT NULL,
  currency TEXT DEFAULT 'SAR',
  exchange TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Investment holdings
CREATE TABLE public.investment_holdings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id UUID NOT NULL REFERENCES public.investment_portfolios(id) ON DELETE CASCADE,
  asset_id UUID NOT NULL REFERENCES public.investment_assets(id) ON DELETE CASCADE,
  quantity NUMERIC NOT NULL DEFAULT 0,
  avg_cost NUMERIC NOT NULL DEFAULT 0,
  cost_currency TEXT DEFAULT 'SAR',
  current_price NUMERIC,
  last_price_update TIMESTAMPTZ,
  target_allocation NUMERIC, -- percentage
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(portfolio_id, asset_id)
);

-- Investment transactions
CREATE TABLE public.investment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  portfolio_id UUID NOT NULL REFERENCES public.investment_portfolios(id) ON DELETE CASCADE,
  asset_id UUID REFERENCES public.investment_assets(id) ON DELETE SET NULL,
  type investment_tx_type NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  quantity NUMERIC,
  price NUMERIC,
  total_amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'SAR',
  fees NUMERIC DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- FX rates
CREATE TABLE public.fx_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  from_currency TEXT NOT NULL,
  to_currency TEXT NOT NULL,
  rate NUMERIC NOT NULL,
  source TEXT DEFAULT 'manual',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(date, from_currency, to_currency)
);

-- Activity log for audit trail
CREATE TABLE public.finance_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL, -- 'transaction', 'budget', 'debt', etc.
  entity_id UUID NOT NULL,
  action TEXT NOT NULL, -- 'create', 'update', 'delete', 'reconcile', 'close'
  changes JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Finance settings per user
CREATE TABLE public.finance_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  default_currency TEXT DEFAULT 'SAR',
  accounting_basis accounting_basis DEFAULT 'cash',
  fiscal_month_start_day INTEGER DEFAULT 1,
  risk_profile JSONB,
  show_decimal BOOLEAN DEFAULT true,
  auto_categorize BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_categories_user ON public.categories(user_id);
CREATE INDEX idx_categories_parent ON public.categories(parent_id);
CREATE INDEX idx_payees_user ON public.payees(user_id);
CREATE INDEX idx_journal_entries_user_date ON public.journal_entries(user_id, date);
CREATE INDEX idx_journal_entries_source ON public.journal_entries(source_type, source_id);
CREATE INDEX idx_journal_lines_entry ON public.journal_lines(journal_entry_id);
CREATE INDEX idx_journal_lines_account ON public.journal_lines(account_id);
CREATE INDEX idx_transactions_project ON public.transactions(project_id);
CREATE INDEX idx_transactions_reconciled ON public.transactions(is_reconciled);
CREATE INDEX idx_transaction_splits_tx ON public.transaction_splits(transaction_id);
CREATE INDEX idx_category_rules_user ON public.category_rules(user_id, is_active);
CREATE INDEX idx_envelopes_user ON public.envelopes(user_id);
CREATE INDEX idx_envelopes_budget ON public.envelopes(budget_id);
CREATE INDEX idx_sinking_funds_user ON public.sinking_funds(user_id, is_active);
CREATE INDEX idx_budget_lines_budget ON public.budget_category_lines(budget_id);
CREATE INDEX idx_project_finance_project ON public.project_finance(project_id);
CREATE INDEX idx_project_budget_lines ON public.project_budget_lines(project_finance_id);
CREATE INDEX idx_debt_schedules_debt ON public.debt_schedules(debt_id);
CREATE INDEX idx_debt_schedules_due ON public.debt_schedules(due_date, is_paid);
CREATE INDEX idx_investment_portfolios_user ON public.investment_portfolios(user_id);
CREATE INDEX idx_investment_assets_user ON public.investment_assets(user_id, type);
CREATE INDEX idx_investment_holdings_portfolio ON public.investment_holdings(portfolio_id);
CREATE INDEX idx_investment_tx_portfolio ON public.investment_transactions(portfolio_id, date);
CREATE INDEX idx_investment_tx_asset ON public.investment_transactions(asset_id);
CREATE INDEX idx_fx_rates_date ON public.fx_rates(date, from_currency, to_currency);
CREATE INDEX idx_finance_activity_entity ON public.finance_activity_log(entity_type, entity_id);
CREATE INDEX idx_finance_activity_user ON public.finance_activity_log(user_id, created_at);

-- Enable RLS on all new tables
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_splits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.category_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.envelopes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sinking_funds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_category_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_finance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_budget_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debt_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investment_portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investment_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investment_holdings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fx_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for categories
CREATE POLICY "Users can view own categories" ON public.categories FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own categories" ON public.categories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own categories" ON public.categories FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own categories" ON public.categories FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for payees
CREATE POLICY "Users can view own payees" ON public.payees FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own payees" ON public.payees FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own payees" ON public.payees FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own payees" ON public.payees FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for journal_entries
CREATE POLICY "Users can view own journal_entries" ON public.journal_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own journal_entries" ON public.journal_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own journal_entries" ON public.journal_entries FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own journal_entries" ON public.journal_entries FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for journal_lines (via journal_entry ownership)
CREATE POLICY "Users can view own journal_lines" ON public.journal_lines FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.journal_entries je WHERE je.id = journal_entry_id AND je.user_id = auth.uid()));
CREATE POLICY "Users can insert own journal_lines" ON public.journal_lines FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM public.journal_entries je WHERE je.id = journal_entry_id AND je.user_id = auth.uid()));
CREATE POLICY "Users can update own journal_lines" ON public.journal_lines FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM public.journal_entries je WHERE je.id = journal_entry_id AND je.user_id = auth.uid()));
CREATE POLICY "Users can delete own journal_lines" ON public.journal_lines FOR DELETE 
  USING (EXISTS (SELECT 1 FROM public.journal_entries je WHERE je.id = journal_entry_id AND je.user_id = auth.uid()));

-- RLS Policies for transaction_splits
CREATE POLICY "Users can view own transaction_splits" ON public.transaction_splits FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.transactions t WHERE t.id = transaction_id AND t.user_id = auth.uid()));
CREATE POLICY "Users can insert own transaction_splits" ON public.transaction_splits FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM public.transactions t WHERE t.id = transaction_id AND t.user_id = auth.uid()));
CREATE POLICY "Users can update own transaction_splits" ON public.transaction_splits FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM public.transactions t WHERE t.id = transaction_id AND t.user_id = auth.uid()));
CREATE POLICY "Users can delete own transaction_splits" ON public.transaction_splits FOR DELETE 
  USING (EXISTS (SELECT 1 FROM public.transactions t WHERE t.id = transaction_id AND t.user_id = auth.uid()));

-- RLS Policies for category_rules
CREATE POLICY "Users can view own category_rules" ON public.category_rules FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own category_rules" ON public.category_rules FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own category_rules" ON public.category_rules FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own category_rules" ON public.category_rules FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for envelopes
CREATE POLICY "Users can view own envelopes" ON public.envelopes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own envelopes" ON public.envelopes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own envelopes" ON public.envelopes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own envelopes" ON public.envelopes FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for sinking_funds
CREATE POLICY "Users can view own sinking_funds" ON public.sinking_funds FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own sinking_funds" ON public.sinking_funds FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own sinking_funds" ON public.sinking_funds FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own sinking_funds" ON public.sinking_funds FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for budget_category_lines (via budget ownership)
CREATE POLICY "Users can view own budget_lines" ON public.budget_category_lines FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.budgets b WHERE b.id = budget_id AND b.user_id = auth.uid()));
CREATE POLICY "Users can insert own budget_lines" ON public.budget_category_lines FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM public.budgets b WHERE b.id = budget_id AND b.user_id = auth.uid()));
CREATE POLICY "Users can update own budget_lines" ON public.budget_category_lines FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM public.budgets b WHERE b.id = budget_id AND b.user_id = auth.uid()));
CREATE POLICY "Users can delete own budget_lines" ON public.budget_category_lines FOR DELETE 
  USING (EXISTS (SELECT 1 FROM public.budgets b WHERE b.id = budget_id AND b.user_id = auth.uid()));

-- RLS Policies for project_finance
CREATE POLICY "Users can view own project_finance" ON public.project_finance FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own project_finance" ON public.project_finance FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own project_finance" ON public.project_finance FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own project_finance" ON public.project_finance FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for project_budget_lines
CREATE POLICY "Users can view own project_budget_lines" ON public.project_budget_lines FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.project_finance pf WHERE pf.id = project_finance_id AND pf.user_id = auth.uid()));
CREATE POLICY "Users can insert own project_budget_lines" ON public.project_budget_lines FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM public.project_finance pf WHERE pf.id = project_finance_id AND pf.user_id = auth.uid()));
CREATE POLICY "Users can update own project_budget_lines" ON public.project_budget_lines FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM public.project_finance pf WHERE pf.id = project_finance_id AND pf.user_id = auth.uid()));
CREATE POLICY "Users can delete own project_budget_lines" ON public.project_budget_lines FOR DELETE 
  USING (EXISTS (SELECT 1 FROM public.project_finance pf WHERE pf.id = project_finance_id AND pf.user_id = auth.uid()));

-- RLS Policies for debt_schedules
CREATE POLICY "Users can view own debt_schedules" ON public.debt_schedules FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.debts d WHERE d.id = debt_id AND d.user_id = auth.uid()));
CREATE POLICY "Users can insert own debt_schedules" ON public.debt_schedules FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM public.debts d WHERE d.id = debt_id AND d.user_id = auth.uid()));
CREATE POLICY "Users can update own debt_schedules" ON public.debt_schedules FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM public.debts d WHERE d.id = debt_id AND d.user_id = auth.uid()));
CREATE POLICY "Users can delete own debt_schedules" ON public.debt_schedules FOR DELETE 
  USING (EXISTS (SELECT 1 FROM public.debts d WHERE d.id = debt_id AND d.user_id = auth.uid()));

-- RLS Policies for investment_portfolios
CREATE POLICY "Users can view own investment_portfolios" ON public.investment_portfolios FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own investment_portfolios" ON public.investment_portfolios FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own investment_portfolios" ON public.investment_portfolios FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own investment_portfolios" ON public.investment_portfolios FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for investment_assets
CREATE POLICY "Users can view own investment_assets" ON public.investment_assets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own investment_assets" ON public.investment_assets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own investment_assets" ON public.investment_assets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own investment_assets" ON public.investment_assets FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for investment_holdings
CREATE POLICY "Users can view own investment_holdings" ON public.investment_holdings FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.investment_portfolios p WHERE p.id = portfolio_id AND p.user_id = auth.uid()));
CREATE POLICY "Users can insert own investment_holdings" ON public.investment_holdings FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM public.investment_portfolios p WHERE p.id = portfolio_id AND p.user_id = auth.uid()));
CREATE POLICY "Users can update own investment_holdings" ON public.investment_holdings FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM public.investment_portfolios p WHERE p.id = portfolio_id AND p.user_id = auth.uid()));
CREATE POLICY "Users can delete own investment_holdings" ON public.investment_holdings FOR DELETE 
  USING (EXISTS (SELECT 1 FROM public.investment_portfolios p WHERE p.id = portfolio_id AND p.user_id = auth.uid()));

-- RLS Policies for investment_transactions
CREATE POLICY "Users can view own investment_transactions" ON public.investment_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own investment_transactions" ON public.investment_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own investment_transactions" ON public.investment_transactions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own investment_transactions" ON public.investment_transactions FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for fx_rates (all users can view, only insert own)
CREATE POLICY "Users can view all fx_rates" ON public.fx_rates FOR SELECT USING (true);
CREATE POLICY "Users can insert fx_rates" ON public.fx_rates FOR INSERT WITH CHECK (true);

-- RLS Policies for finance_activity_log
CREATE POLICY "Users can view own finance_activity_log" ON public.finance_activity_log FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own finance_activity_log" ON public.finance_activity_log FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for finance_settings
CREATE POLICY "Users can view own finance_settings" ON public.finance_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own finance_settings" ON public.finance_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own finance_settings" ON public.finance_settings FOR UPDATE USING (auth.uid() = user_id);

-- Function to validate journal entry balance
CREATE OR REPLACE FUNCTION public.validate_journal_balance()
RETURNS TRIGGER AS $$
DECLARE
  total_debits NUMERIC;
  total_credits NUMERIC;
BEGIN
  SELECT COALESCE(SUM(debit), 0), COALESCE(SUM(credit), 0)
  INTO total_debits, total_credits
  FROM public.journal_lines
  WHERE journal_entry_id = NEW.journal_entry_id;
  
  IF total_debits != total_credits THEN
    RAISE EXCEPTION 'Journal entry is not balanced. Debits: %, Credits: %', total_debits, total_credits;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to update account balance after transaction
CREATE OR REPLACE FUNCTION public.update_account_balance()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.type = 'income' THEN
      UPDATE public.accounts SET balance = balance + NEW.amount WHERE id = NEW.account_id;
    ELSIF NEW.type = 'expense' THEN
      UPDATE public.accounts SET balance = balance - NEW.amount WHERE id = NEW.account_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.type = 'income' THEN
      UPDATE public.accounts SET balance = balance - OLD.amount WHERE id = OLD.account_id;
    ELSIF OLD.type = 'expense' THEN
      UPDATE public.accounts SET balance = balance + OLD.amount WHERE id = OLD.account_id;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Reverse old transaction
    IF OLD.type = 'income' THEN
      UPDATE public.accounts SET balance = balance - OLD.amount WHERE id = OLD.account_id;
    ELSIF OLD.type = 'expense' THEN
      UPDATE public.accounts SET balance = balance + OLD.amount WHERE id = OLD.account_id;
    END IF;
    -- Apply new transaction
    IF NEW.type = 'income' THEN
      UPDATE public.accounts SET balance = balance + NEW.amount WHERE id = NEW.account_id;
    ELSIF NEW.type = 'expense' THEN
      UPDATE public.accounts SET balance = balance - NEW.amount WHERE id = NEW.account_id;
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_update_account_balance
AFTER INSERT OR UPDATE OR DELETE ON public.transactions
FOR EACH ROW EXECUTE FUNCTION public.update_account_balance();

-- Function to log finance activity
CREATE OR REPLACE FUNCTION public.log_finance_activity()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.finance_activity_log (user_id, entity_type, entity_id, action, changes)
  VALUES (
    auth.uid(),
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    TG_OP,
    CASE 
      WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD)
      WHEN TG_OP = 'UPDATE' THEN jsonb_build_object('old', to_jsonb(OLD), 'new', to_jsonb(NEW))
      ELSE to_jsonb(NEW)
    END
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Activity log triggers for key tables
CREATE TRIGGER log_transactions_activity
AFTER INSERT OR UPDATE OR DELETE ON public.transactions
FOR EACH ROW EXECUTE FUNCTION public.log_finance_activity();

CREATE TRIGGER log_debts_activity
AFTER INSERT OR UPDATE OR DELETE ON public.debts
FOR EACH ROW EXECUTE FUNCTION public.log_finance_activity();

CREATE TRIGGER log_subscriptions_activity
AFTER INSERT OR UPDATE OR DELETE ON public.subscriptions
FOR EACH ROW EXECUTE FUNCTION public.log_finance_activity();

-- Update triggers for updated_at
CREATE TRIGGER update_categories_updated_at
BEFORE UPDATE ON public.categories
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_envelopes_updated_at
BEFORE UPDATE ON public.envelopes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sinking_funds_updated_at
BEFORE UPDATE ON public.sinking_funds
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_project_finance_updated_at
BEFORE UPDATE ON public.project_finance
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_investment_portfolios_updated_at
BEFORE UPDATE ON public.investment_portfolios
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_investment_holdings_updated_at
BEFORE UPDATE ON public.investment_holdings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_finance_settings_updated_at
BEFORE UPDATE ON public.finance_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();