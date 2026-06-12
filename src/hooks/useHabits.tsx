import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { useAuth } from './useAuth';
import { format, subDays } from 'date-fns';
import { vibrate } from '@/lib/vibrate';

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

export function useHabitLogs() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['habit-logs', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('habit_logs')
        .select('*')
        .order('completed_at', { ascending: false });
      
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
      const { data: habits, error: habitsError } = await supabase
        .from('habits')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      
      if (habitsError) throw habitsError;

      const { data: logs, error: logsError } = await supabase
        .from('habit_logs')
        .select('*')
        .gte('completed_at', format(weekAgo, 'yyyy-MM-dd'))
        .lte('completed_at', format(today, 'yyyy-MM-dd'));
      
      if (logsError) throw logsError;

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
    mutationFn: async ({ habit_id, completed_at }: { habit_id: string; completed_at?: string }) => {
      const date = completed_at || format(new Date(), 'yyyy-MM-dd');
      
      const { data: existing } = await supabase
        .from('habit_logs')
        .select('id')
        .eq('habit_id', habit_id)
        .eq('completed_at', date)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('habit_logs')
          .delete()
          .eq('id', existing.id);
        if (error) throw error;
        return { action: 'removed' };
      } else {
        const { error } = await supabase
          .from('habit_logs')
          .insert({ habit_id, user_id: user!.id, completed_at: date });
        if (error) throw error;
        return { action: 'added' };
      }
    },
    onSuccess: (data) => {
      if (data.action === 'added') vibrate.success();
      queryClient.invalidateQueries({ queryKey: ['habits-with-logs'] });
      queryClient.invalidateQueries({ queryKey: ['habit-logs'] });
    },
  });
}

export function useUpdateHabit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: HabitUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('habits')
        .update(updates)
        .eq('id', id)
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

/** Fetches habit logs for the past 365 days — used by the yearly contribution graph. */
export function useYearlyHabitLogs() {
  const { user } = useAuth();
  const yearAgo = subDays(new Date(), 364);

  return useQuery({
    queryKey: ['habit-logs-yearly', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('habit_logs')
        .select('completed_at')
        .gte('completed_at', format(yearAgo, 'yyyy-MM-dd'))
        .order('completed_at', { ascending: true });

      if (error) throw error;
      return data as { completed_at: string }[];
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 min cache
  });
}
