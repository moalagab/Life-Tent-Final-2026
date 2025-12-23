import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

// Types
export interface Category {
  id: string;
  name: string;
  name_ar?: string;
  parent_id?: string;
  type: 'income' | 'expense' | 'transfer';
  icon?: string;
  color?: string;
  is_system?: boolean;
}

export interface Payee {
  id: string;
  name: string;
  default_category_id?: string;
  notes?: string;
}

export interface Envelope {
  id: string;
  budget_id?: string;
  name: string;
  target_amount?: number;
  available_amount: number;
  color?: string;
  icon?: string;
}

export interface SinkingFund {
  id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  target_date?: string;
  monthly_contribution?: number;
  linked_envelope_id?: string;
  is_active: boolean;
}

export interface Debt {
  id: string;
  name: string;
  lender?: string;
  total_amount: number;
  remaining_amount: number;
  interest_rate: number;
  minimum_payment?: number;
  start_date?: string;
  end_date?: string;
  status: 'active' | 'closed' | 'paused';
  payoff_strategy?: 'snowball' | 'avalanche';
  currency?: string;
  notes?: string;
}

export interface DebtSchedule {
  id: string;
  debt_id: string;
  due_date: string;
  amount: number;
  principal_amount: number;
  interest_amount: number;
  is_paid: boolean;
  paid_at?: string;
}

export interface InvestmentPortfolio {
  id: string;
  name: string;
  base_currency: string;
  description?: string;
  is_default: boolean;
}

export interface InvestmentAsset {
  id: string;
  symbol: string;
  name: string;
  type: 'stock' | 'etf' | 'fund' | 'gold' | 'crypto' | 'bond' | 'real_estate';
  currency: string;
  exchange?: string;
}

export interface InvestmentHolding {
  id: string;
  portfolio_id: string;
  asset_id: string;
  quantity: number;
  avg_cost: number;
  cost_currency: string;
  current_price?: number;
  target_allocation?: number;
  asset?: InvestmentAsset;
}

export interface InvestmentTransaction {
  id: string;
  portfolio_id: string;
  asset_id?: string;
  type: 'buy' | 'sell' | 'fee' | 'dividend' | 'transfer' | 'deposit' | 'withdrawal';
  date: string;
  quantity?: number;
  price?: number;
  total_amount: number;
  currency: string;
  fees: number;
  notes?: string;
  asset?: InvestmentAsset;
}

export interface FinanceSettings {
  id: string;
  default_currency: string;
  accounting_basis: 'cash' | 'accrual';
  fiscal_month_start_day: number;
  risk_profile?: any;
  show_decimal: boolean;
  auto_categorize: boolean;
}

export interface ProjectFinance {
  id: string;
  project_id: string;
  currency: string;
  planned_budget_total: number;
  actual_spend_total: number;
  evm_enabled: boolean;
  planned_value: number;
  earned_value: number;
  notes?: string;
}

// Categories Hooks
export function useCategories() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['categories', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as Category[];
    },
    enabled: !!user,
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (category: Partial<Category>) => {
      const { data, error } = await supabase
        .from('categories')
        .insert({ ...category, user_id: user!.id } as any)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}

// Envelopes Hooks
export function useEnvelopes() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['envelopes', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('envelopes')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Envelope[];
    },
    enabled: !!user,
  });
}

export function useCreateEnvelope() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (envelope: Partial<Envelope>) => {
      const { data, error } = await supabase
        .from('envelopes')
        .insert({ ...envelope, user_id: user!.id } as any)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['envelopes'] });
    },
  });
}

export function useUpdateEnvelope() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Envelope> & { id: string }) => {
      const { data, error } = await supabase
        .from('envelopes')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['envelopes'] });
    },
  });
}

// Sinking Funds Hooks
export function useSinkingFunds() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['sinking-funds', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sinking_funds')
        .select('*')
        .eq('is_active', true)
        .order('target_date');
      
      if (error) throw error;
      return data as SinkingFund[];
    },
    enabled: !!user,
  });
}

export function useCreateSinkingFund() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (fund: Partial<SinkingFund>) => {
      const { data, error } = await supabase
        .from('sinking_funds')
        .insert({ ...fund, user_id: user!.id } as any)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sinking-funds'] });
    },
  });
}

export function useUpdateSinkingFund() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<SinkingFund> & { id: string }) => {
      const { data, error } = await supabase
        .from('sinking_funds')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sinking-funds'] });
    },
  });
}

// Debts Hooks
export function useDebts() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['debts', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('debts')
        .select('*')
        .order('end_date');
      
      if (error) throw error;
      return data as Debt[];
    },
    enabled: !!user,
  });
}

export function useCreateDebt() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (debt: Partial<Debt>) => {
      const { data, error } = await supabase
        .from('debts')
        .insert({ ...debt, user_id: user!.id } as any)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['debts'] });
    },
  });
}

export function useUpdateDebt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Debt> & { id: string }) => {
      const { data, error } = await supabase
        .from('debts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['debts'] });
    },
  });
}

export function useDebtSchedules(debtId?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['debt-schedules', debtId],
    queryFn: async () => {
      let query = supabase
        .from('debt_schedules')
        .select('*')
        .order('due_date');
      
      if (debtId) {
        query = query.eq('debt_id', debtId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as DebtSchedule[];
    },
    enabled: !!user,
  });
}

// Investment Hooks
export function useInvestmentPortfolios() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['investment-portfolios', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('investment_portfolios')
        .select('*')
        .order('created_at');
      
      if (error) throw error;
      return data as InvestmentPortfolio[];
    },
    enabled: !!user,
  });
}

export function useCreatePortfolio() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (portfolio: Partial<InvestmentPortfolio>) => {
      const { data, error } = await supabase
        .from('investment_portfolios')
        .insert({ ...portfolio, user_id: user!.id } as any)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investment-portfolios'] });
    },
  });
}

export function useInvestmentAssets() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['investment-assets', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('investment_assets')
        .select('*')
        .order('symbol');
      
      if (error) throw error;
      return data as InvestmentAsset[];
    },
    enabled: !!user,
  });
}

export function useCreateAsset() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (asset: Partial<InvestmentAsset>) => {
      const { data, error } = await supabase
        .from('investment_assets')
        .insert({ ...asset, user_id: user!.id } as any)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investment-assets'] });
    },
  });
}

export function useInvestmentHoldings(portfolioId?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['investment-holdings', portfolioId],
    queryFn: async () => {
      let query = supabase
        .from('investment_holdings')
        .select(`
          *,
          asset:investment_assets(*)
        `);
      
      if (portfolioId) {
        query = query.eq('portfolio_id', portfolioId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as InvestmentHolding[];
    },
    enabled: !!user,
  });
}

export function useCreateHolding() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (holding: Partial<InvestmentHolding>) => {
      const { data, error } = await supabase
        .from('investment_holdings')
        .insert(holding as any)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investment-holdings'] });
    },
  });
}

export function useUpdateHolding() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<InvestmentHolding> & { id: string }) => {
      const { data, error } = await supabase
        .from('investment_holdings')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investment-holdings'] });
    },
  });
}

export function useInvestmentTransactions(portfolioId?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['investment-transactions', portfolioId],
    queryFn: async () => {
      let query = supabase
        .from('investment_transactions')
        .select(`
          *,
          asset:investment_assets(*)
        `)
        .order('date', { ascending: false });
      
      if (portfolioId) {
        query = query.eq('portfolio_id', portfolioId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as InvestmentTransaction[];
    },
    enabled: !!user,
  });
}

export function useCreateInvestmentTransaction() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (tx: Partial<InvestmentTransaction>) => {
      const { data, error } = await supabase
        .from('investment_transactions')
        .insert({ ...tx, user_id: user!.id } as any)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investment-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['investment-holdings'] });
    },
  });
}

// Project Finance Hooks
export function useProjectFinance(projectId?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['project-finance', projectId],
    queryFn: async () => {
      let query = supabase.from('project_finance').select('*');
      
      if (projectId) {
        query = query.eq('project_id', projectId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as ProjectFinance[];
    },
    enabled: !!user,
  });
}

export function useCreateProjectFinance() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (finance: Partial<ProjectFinance>) => {
      const { data, error } = await supabase
        .from('project_finance')
        .insert({ ...finance, user_id: user!.id } as any)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-finance'] });
    },
  });
}

// Finance Settings
export function useFinanceSettings() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['finance-settings', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('finance_settings')
        .select('*')
        .maybeSingle();
      
      if (error) throw error;
      return data as FinanceSettings | null;
    },
    enabled: !!user,
  });
}

export function useUpdateFinanceSettings() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (settings: Partial<FinanceSettings>) => {
      const { data: existing } = await supabase
        .from('finance_settings')
        .select('id')
        .maybeSingle();
      
      if (existing) {
        const { data, error } = await supabase
          .from('finance_settings')
          .update(settings)
          .eq('id', existing.id)
          .select()
          .single();
        
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('finance_settings')
          .insert({ ...settings, user_id: user!.id })
          .select()
          .single();
        
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance-settings'] });
    },
  });
}

// Activity Log
export function useFinanceActivityLog(limit = 50) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['finance-activity-log', user?.id, limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('finance_activity_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

// Update existing subscription type
export function useUpdateSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; [key: string]: any }) => {
      const { data, error } = await supabase
        .from('subscriptions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
    },
  });
}

export function useDeleteSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('subscriptions')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
    },
  });
}

export function useCreateSubscription() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (subscription: any) => {
      const { data, error } = await supabase
        .from('subscriptions')
        .insert({ ...subscription, user_id: user!.id })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
    },
  });
}

// Reconciliation
export function useReconcileAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ accountId, balance }: { accountId: string; balance: number }) => {
      const { error } = await supabase
        .from('accounts')
        .update({ 
          reconciled_balance: balance,
          last_reconciled_at: new Date().toISOString()
        })
        .eq('id', accountId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });
}

export function useReconcileTransactions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (transactionIds: string[]) => {
      const { error } = await supabase
        .from('transactions')
        .update({ 
          is_reconciled: true,
          reconciled_at: new Date().toISOString()
        })
        .in('id', transactionIds);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
}
