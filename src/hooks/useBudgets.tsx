import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface Budget {
  id: string;
  user_id: string;
  category: string;
  limit_amount: number;
  spent_amount: number | null;
  currency: string | null;
  month: number;
  year: number;
  status: 'draft' | 'active' | 'closed' | null;
  notes: string | null;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface BudgetCategoryLine {
  id: string;
  budget_id: string;
  category_id: string;
  planned_amount: number;
  actual_amount: number | null;
  created_at: string;
  updated_at: string;
}

export function useBudgets(month?: number, year?: number) {
  const { user } = useAuth();
  const currentDate = new Date();
  const targetMonth = month ?? currentDate.getMonth() + 1;
  const targetYear = year ?? currentDate.getFullYear();

  return useQuery({
    queryKey: ['budgets', user?.id, targetMonth, targetYear],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('budgets')
        .select('*')
        .eq('month', targetMonth)
        .eq('year', targetYear)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Budget[];
    },
    enabled: !!user,
  });
}

export function useAllBudgets() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['all-budgets', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('budgets')
        .select('*')
        .order('year', { ascending: false })
        .order('month', { ascending: false });
      
      if (error) throw error;
      return data as Budget[];
    },
    enabled: !!user,
  });
}

export function useBudgetById(budgetId: string | null) {
  return useQuery({
    queryKey: ['budget', budgetId],
    queryFn: async () => {
      if (!budgetId) return null;
      
      const { data, error } = await supabase
        .from('budgets')
        .select('*')
        .eq('id', budgetId)
        .single();
      
      if (error) throw error;
      return data as Budget;
    },
    enabled: !!budgetId,
  });
}

export function useCreateBudget() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (budget: Partial<Budget>) => {
      const { data, error } = await supabase
        .from('budgets')
        .insert({
          user_id: user!.id,
          category: budget.category || 'monthly',
          limit_amount: budget.limit_amount || 0,
          spent_amount: budget.spent_amount || 0,
          currency: budget.currency || 'SAR',
          month: budget.month || new Date().getMonth() + 1,
          year: budget.year || new Date().getFullYear(),
          status: budget.status || 'active',
          notes: budget.notes,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data as Budget;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      queryClient.invalidateQueries({ queryKey: ['all-budgets'] });
    },
  });
}

export function useUpdateBudget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Budget> & { id: string }) => {
      const { data, error } = await supabase
        .from('budgets')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data as Budget;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      queryClient.invalidateQueries({ queryKey: ['all-budgets'] });
      queryClient.invalidateQueries({ queryKey: ['budget'] });
    },
  });
}

export function useDeleteBudget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (budgetId: string) => {
      const { error } = await supabase
        .from('budgets')
        .delete()
        .eq('id', budgetId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      queryClient.invalidateQueries({ queryKey: ['all-budgets'] });
    },
  });
}

// Budget Category Lines
export function useBudgetLines(budgetId: string | null) {
  return useQuery({
    queryKey: ['budget-lines', budgetId],
    queryFn: async () => {
      if (!budgetId) return [];
      
      const { data, error } = await supabase
        .from('budget_category_lines')
        .select(`
          *,
          category:categories(id, name, name_ar, color, icon)
        `)
        .eq('budget_id', budgetId)
        .order('planned_amount', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!budgetId,
  });
}

export function useCreateBudgetLine() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (line: Partial<BudgetCategoryLine>) => {
      const { data, error } = await supabase
        .from('budget_category_lines')
        .insert({
          budget_id: line.budget_id!,
          category_id: line.category_id!,
          planned_amount: line.planned_amount || 0,
          actual_amount: line.actual_amount || 0,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['budget-lines', variables.budget_id] });
    },
  });
}

export function useUpdateBudgetLine() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, budget_id, ...updates }: Partial<BudgetCategoryLine> & { id: string; budget_id: string }) => {
      const { data, error } = await supabase
        .from('budget_category_lines')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['budget-lines', variables.budget_id] });
    },
  });
}

export function useDeleteBudgetLine() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, budget_id }: { id: string; budget_id: string }) => {
      const { error } = await supabase
        .from('budget_category_lines')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['budget-lines', variables.budget_id] });
    },
  });
}
