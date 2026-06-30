/**
 * useHabitGoals — bidirectional Habits ↔ Goals integration.
 *
 * The goals table has a nullable `habit_id` column.
 * These hooks provide:
 *   - useGoalHabit(habitId)     — find the goal linked to a habit
 *   - useLinkHabitToGoal()      — mutation to link a habit to a goal
 *   - useHabitsWithGoals()      — habits enriched with their linked goal title
 *   - useGoalHabitStreak(goalId) — streak count from the linked habit
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

// ── Goal linked to a given habit ─────────────────────────────────────────────
export function useGoalByHabit(habitId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['goal-by-habit', habitId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('goals')
        .select('id, title, progress, target_value, current_value')
        .eq('habit_id', habitId!)
        .eq('is_active', true)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user && !!habitId,
  });
}

// ── Link a habit to a goal ───────────────────────────────────────────────────
export function useLinkHabitToGoal() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ goalId, habitId }: { goalId: string; habitId: string | null }) => {
      const { error } = await supabase
        .from('goals')
        .update({ habit_id: habitId })
        .eq('id', goalId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['goals'] });
      qc.invalidateQueries({ queryKey: ['goal-by-habit'] });
      qc.invalidateQueries({ queryKey: ['habits-with-goals'] });
    },
  });
}

// ── Habits enriched with their linked goal ───────────────────────────────────
export function useHabitsWithGoals() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['habits-with-goals', user?.id],
    queryFn: async () => {
      const [{ data: habits, error: hErr }, { data: goals, error: gErr }] = await Promise.all([
        supabase.from('habits').select('*').eq('is_active', true),
        supabase.from('goals').select('id, title, habit_id, progress').eq('is_active', true).not('habit_id', 'is', null),
      ]);
      if (hErr) throw hErr;
      if (gErr) throw gErr;

      const goalByHabit = Object.fromEntries((goals ?? []).map(g => [g.habit_id, g]));

      return (habits ?? []).map(h => ({
        ...h,
        linkedGoal: goalByHabit[h.id] ?? null,
      }));
    },
    enabled: !!user,
  });
}

// ── Habit streak for a goal's linked habit ──────────────────────────────────
export function useGoalHabitStreak(goalId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['goal-habit-streak', goalId],
    queryFn: async () => {
      // 1. Get the goal's habit_id
      const { data: goal, error: gErr } = await supabase
        .from('goals')
        .select('habit_id')
        .eq('id', goalId!)
        .single();
      if (gErr) throw gErr;
      if (!goal.habit_id) return null;

      // 2. Get the habit streak
      const { data: habit, error: hErr } = await supabase
        .from('habits')
        .select('id, name, current_streak, longest_streak, icon')
        .eq('id', goal.habit_id)
        .single();
      if (hErr) throw hErr;
      return habit;
    },
    enabled: !!user && !!goalId,
  });
}
