import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { useAuth } from './useAuth';
import { format, subDays } from 'date-fns';

export type Habit = Tables<'habits'>;
export type HabitInsert = TablesInsert<'habits'>;
export type HabitUpdate = TablesUpdate<'habits'>;
export type HabitLog = Tables<'habit_logs'>;

export function useHabits() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['habits', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('habits')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useHabitsWithLogs() {
  const { user } = useAuth();
  const today = new Date();
  const weekAgo = subDays(today, 6);

  return useQuery({
    queryKey: ['habits-with-logs', user?.id],
    queryFn: async () => {
      // Get habits
      const { data: habits, error: habitsError } = await supabase
        .from('habits')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      
      if (habitsError) throw habitsError;

      // Get logs for the past week
      const { data: logs, error: logsError } = await supabase
        .from('habit_logs')
        .select('*')
        .gte('completed_at', format(weekAgo, 'yyyy-MM-dd'))
        .lte('completed_at', format(today, 'yyyy-MM-dd'));
      
      if (logsError) throw logsError;

      // Combine habits with their logs
      return habits.map(habit => ({
        ...habit,
        logs: logs.filter(log => log.habit_id === habit.id),
      }));
    },
    enabled: !!user,
  });
}

export function useCreateHabit() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (habit: Omit<HabitInsert, 'user_id'>) => {
      const { data, error } = await supabase
        .from('habits')
        .insert({ ...habit, user_id: user!.id })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      queryClient.invalidateQueries({ queryKey: ['habits-with-logs'] });
    },
  });
}

export function useLogHabit() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ habit_id, completed_at }: { habit_id: string; completed_at: string }) => {
      // Check if already logged
      const { data: existing } = await supabase
        .from('habit_logs')
        .select('id')
        .eq('habit_id', habit_id)
        .eq('completed_at', completed_at)
        .maybeSingle();

      if (existing) {
        // Remove log if exists
        const { error } = await supabase
          .from('habit_logs')
          .delete()
          .eq('id', existing.id);
        if (error) throw error;
        return { action: 'removed' };
      } else {
        // Add log
        const { error } = await supabase
          .from('habit_logs')
          .insert({ habit_id, user_id: user!.id, completed_at });
        if (error) throw error;
        return { action: 'added' };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits-with-logs'] });
    },
  });
}

export function useDeleteHabit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('habits')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      queryClient.invalidateQueries({ queryKey: ['habits-with-logs'] });
    },
  });
}