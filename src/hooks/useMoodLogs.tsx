import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { useAuth } from './useAuth';
import { format } from 'date-fns';

export type MoodLog = Tables<'mood_logs'>;
export type MoodLogInsert = TablesInsert<'mood_logs'>;
export type MoodLogUpdate = TablesUpdate<'mood_logs'>;

export function useTodayMoodLog() {
  const { user } = useAuth();
  const today = format(new Date(), 'yyyy-MM-dd');

  return useQuery({
    queryKey: ['mood-log-today', user?.id, today],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mood_logs')
        .select('*')
        .eq('date', today)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useMoodLogs(days: number = 30) {
  const { user } = useAuth();
  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - days);

  return useQuery({
    queryKey: ['mood-logs', user?.id, days],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mood_logs')
        .select('*')
        .gte('date', format(startDate, 'yyyy-MM-dd'))
        .lte('date', format(today, 'yyyy-MM-dd'))
        .order('date', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useUpsertMoodLog() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (moodLog: Omit<MoodLogInsert, 'user_id'>) => {
      const date = moodLog.date || format(new Date(), 'yyyy-MM-dd');
      
      // Check if entry exists for this date
      const { data: existing } = await supabase
        .from('mood_logs')
        .select('id')
        .eq('date', date)
        .eq('user_id', user!.id)
        .maybeSingle();

      if (existing) {
        // Update existing
        const { data, error } = await supabase
          .from('mood_logs')
          .update({ ...moodLog, date })
          .eq('id', existing.id)
          .select()
          .single();
        
        if (error) throw error;
        return data;
      } else {
        // Create new
        const { data, error } = await supabase
          .from('mood_logs')
          .insert({ ...moodLog, user_id: user!.id, date })
          .select()
          .single();
        
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mood-logs'] });
      queryClient.invalidateQueries({ queryKey: ['mood-log-today'] });
    },
  });
}

export function useDeleteMoodLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('mood_logs')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mood-logs'] });
      queryClient.invalidateQueries({ queryKey: ['mood-log-today'] });
    },
  });
}
