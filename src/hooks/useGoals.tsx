import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { useAuth } from './useAuth';

export type Goal = Tables<'goals'>;
export type KeyResult = Tables<'key_results'>;

export function useGoals(includeArchived = false) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['goals', user?.id, includeArchived],
    queryFn: async () => {
      let query = supabase
        .from('goals')
        .select('*, projects(id, title, color), habits(id, name, icon)')
        .order('created_at', { ascending: false });
      
      if (!includeArchived) {
        query = query.eq('is_active', true);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useArchivedGoals() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['goals-archived', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('goals')
        .select('*, projects(id, title, color), habits(id, name, icon)')
        .eq('is_active', false)
        .order('updated_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useKeyResults() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['key-results', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('key_results')
        .select('*')
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useGoalsWithKeyResults() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['goals-with-kr', user?.id],
    queryFn: async () => {
      const { data: goals, error: goalsError } = await supabase
        .from('goals')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      
      if (goalsError) throw goalsError;

      const { data: keyResults, error: krError } = await supabase
        .from('key_results')
        .select('*')
        .order('created_at', { ascending: true });
      
      if (krError) throw krError;

      return goals.map(goal => {
        const gKRs = keyResults.filter(kr => kr.goal_id === goal.id);
        const progress = gKRs.length > 0
          ? Math.round(gKRs.reduce((sum, kr) => sum + (kr.current_value || 0) / kr.target_value * 100, 0) / gKRs.length)
          : 0;
        
        return {
          ...goal,
          keyResults: gKRs,
          calculatedProgress: progress,
        };
      });
    },
    enabled: !!user,
  });
}

export function useCreateGoal() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (goal: Omit<TablesInsert<'goals'>, 'user_id'>) => {
      const { data, error } = await supabase
        .from('goals')
        .insert({ ...goal, user_id: user!.id })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['goals-with-kr'] });
    },
  });
}

export function useCreateKeyResult() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (kr: Omit<TablesInsert<'key_results'>, 'user_id'>) => {
      const { data, error } = await supabase
        .from('key_results')
        .insert({ ...kr, user_id: user!.id })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals-with-kr'] });
    },
  });
}

export function useUpdateKeyResult() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: TablesUpdate<'key_results'> & { id: string }) => {
      const { data, error } = await supabase
        .from('key_results')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals-with-kr'] });
      queryClient.invalidateQueries({ queryKey: ['key-results'] });
    },
  });
}

export function useUpdateGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: TablesUpdate<'goals'> & { id: string }) => {
      const { data, error } = await supabase
        .from('goals')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['goals-with-kr'] });
    },
  });
}

export function useDeleteGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // First delete all key results for this goal
      await supabase
        .from('key_results')
        .delete()
        .eq('goal_id', id);

      // Then delete the goal
      const { error } = await supabase
        .from('goals')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['goals-with-kr'] });
      queryClient.invalidateQueries({ queryKey: ['key-results'] });
    },
  });
}

export function useDeleteKeyResult() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('key_results')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals-with-kr'] });
      queryClient.invalidateQueries({ queryKey: ['key-results'] });
    },
  });
}

export function useArchiveGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('goals')
        .update({ is_active: false })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['goals-archived'] });
      queryClient.invalidateQueries({ queryKey: ['goals-with-kr'] });
    },
  });
}

export function useRestoreGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('goals')
        .update({ is_active: true })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['goals-archived'] });
      queryClient.invalidateQueries({ queryKey: ['goals-with-kr'] });
    },
  });
}