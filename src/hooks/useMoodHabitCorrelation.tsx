import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useMemo } from 'react';
import { format, subDays, isSameDay } from 'date-fns';

export interface CorrelationData {
  habitId: string;
  habitName: string;
  habitIcon: string | null;
  correlation: number; // -1 to 1
  completionDays: number;
  avgMoodWithHabit: number;
  avgMoodWithoutHabit: number;
  totalDays: number;
}

export function useMoodHabitCorrelation(days = 30) {
  const { user } = useAuth();
  const startDate = format(subDays(new Date(), days), 'yyyy-MM-dd');

  const { data: moodLogs, isLoading: moodLoading } = useQuery({
    queryKey: ['mood-logs-correlation', user?.id, days],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mood_logs')
        .select('*')
        .gte('date', startDate)
        .order('date', { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: habits, isLoading: habitsLoading } = useQuery({
    queryKey: ['habits-for-correlation', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('habits')
        .select('id, name, icon, is_active')
        .eq('is_active', true);

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: habitLogs, isLoading: logsLoading } = useQuery({
    queryKey: ['habit-logs-correlation', user?.id, days],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('habit_logs')
        .select('habit_id, completed_at')
        .gte('completed_at', startDate);

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const correlationData = useMemo(() => {
    if (!moodLogs || !habits || !habitLogs) return [];

    const results: CorrelationData[] = [];

    habits.forEach(habit => {
      const habitCompletedDays = new Set(
        habitLogs
          .filter(log => log.habit_id === habit.id)
          .map(log => log.completed_at)
      );

      let moodWithHabit: number[] = [];
      let moodWithoutHabit: number[] = [];

      moodLogs.forEach(mood => {
        if (mood.mood_score) {
          if (habitCompletedDays.has(mood.date)) {
            moodWithHabit.push(mood.mood_score);
          } else {
            moodWithoutHabit.push(mood.mood_score);
          }
        }
      });

      const avgWithHabit = moodWithHabit.length > 0 
        ? moodWithHabit.reduce((a, b) => a + b, 0) / moodWithHabit.length 
        : 0;
      const avgWithoutHabit = moodWithoutHabit.length > 0 
        ? moodWithoutHabit.reduce((a, b) => a + b, 0) / moodWithoutHabit.length 
        : 0;

      // Simple correlation: difference in average mood
      const correlation = avgWithHabit > 0 && avgWithoutHabit > 0 
        ? (avgWithHabit - avgWithoutHabit) / 2  // Normalize to roughly -1 to 1
        : 0;

      results.push({
        habitId: habit.id,
        habitName: habit.name,
        habitIcon: habit.icon,
        correlation: Math.max(-1, Math.min(1, correlation)),
        completionDays: habitCompletedDays.size,
        avgMoodWithHabit: avgWithHabit,
        avgMoodWithoutHabit: avgWithoutHabit,
        totalDays: moodLogs.length,
      });
    });

    return results.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation));
  }, [moodLogs, habits, habitLogs]);

  return {
    data: correlationData,
    isLoading: moodLoading || habitsLoading || logsLoading,
  };
}
