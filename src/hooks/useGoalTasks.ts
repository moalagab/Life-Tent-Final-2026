/**
 * useGoalTasks — bidirectional Goals ↔ Tasks integration.
 *
 * A task can be linked to a goal via the `goal_id` column on the tasks table.
 * These hooks provide:
 *   - useTasksByGoal(goalId)  — fetch tasks linked to a specific goal
 *   - useLinkTaskToGoal()     — mutation to link/unlink a task ↔ goal
 *   - useGoalProgress()       — computes goal progress from linked tasks
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

// ── Tasks for a given goal ───────────────────────────────────────────────────
export function useTasksByGoal(goalId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['tasks-by-goal', goalId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('goal_id', goalId!)
        .order('position', { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!user && !!goalId,
  });
}

// ── Link / unlink a task to a goal ──────────────────────────────────────────
export function useLinkTaskToGoal() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, goalId }: { taskId: string; goalId: string | null }) => {
      const { error } = await supabase
        .from('tasks')
        .update({ goal_id: goalId } as never)
        .eq('id', taskId);
      if (error) throw error;
    },
    onSuccess: (_data, { goalId }) => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
      qc.invalidateQueries({ queryKey: ['tasks-by-goal', goalId] });
      qc.invalidateQueries({ queryKey: ['goal-task-progress'] });
    },
  });
}

// ── Goal progress derived from task completion ───────────────────────────────
export function useGoalTaskProgress(goalId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['goal-task-progress', goalId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('id, status')
        .eq('goal_id', goalId!);
      if (error) throw error;

      const total = data.length;
      const done = data.filter(t => t.status === 'done').length;
      return {
        total,
        done,
        percent: total > 0 ? Math.round((done / total) * 100) : 0,
      };
    },
    enabled: !!user && !!goalId,
  });
}

// ── All goals with their task-progress computed ──────────────────────────────
export function useAllGoalTaskProgress() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['all-goal-task-progress', user?.id],
    queryFn: async () => {
      // Fetch goals + their linked tasks in one round-trip
      const { data: goals, error: gErr } = await supabase
        .from('goals')
        .select('id, title, progress')
        .eq('is_active', true);
      if (gErr) throw gErr;

      const { data: tasks, error: tErr } = await supabase
        .from('tasks')
        .select('id, status, goal_id')
        .not('goal_id', 'is', null);
      if (tErr) throw tErr;

      return goals.map(g => {
        const linked = tasks.filter(t => t.goal_id === g.id);
        const done = linked.filter(t => t.status === 'done').length;
        return {
          ...g,
          linkedTasksTotal: linked.length,
          linkedTasksDone: done,
          taskPercent: linked.length > 0 ? Math.round((done / linked.length) * 100) : null,
        };
      });
    },
    enabled: !!user,
  });
}
