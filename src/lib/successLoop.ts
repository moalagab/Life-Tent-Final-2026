/**
 * runSuccessLoop — cascading updates triggered after a task is marked done.
 *
 * Order of operations (all non-blocking, non-fatal):
 *   1. Recompute + write goal progress  (if task.goal_id)
 *   2. Recompute + write project progress (if task.project_id)
 *   3. Invalidate all downstream React Query caches
 *   4. Dispatch `success-loop:complete` event for UI feedback
 */
import { QueryClient } from '@tanstack/react-query';
import { supabase }    from '@/integrations/supabase/client';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface ProgressUpdate {
  id:          string;
  title:       string;
  oldProgress: number;
  newProgress: number;
}

export interface SuccessLoopResult {
  taskTitle:       string;
  goalUpdate:      ProgressUpdate | null;
  projectUpdate:   ProgressUpdate | null;
  cachesRefreshed: number;
  timestamp:       number;
}

// ── All query keys that need refreshing ───────────────────────────────────────

const DOWNSTREAM_CACHES = [
  ['tasks'],
  ['focus-tasks'],
  ['goals'],
  ['goals-with-kr'],
  ['goal-task-progress'],
  ['all-goal-task-progress'],
  ['projects'],
  ['active-projects'],
  ['behavior-engine'],
  ['operational-memory'],
  ['archived-items'],
];

// ── Core orchestrator ─────────────────────────────────────────────────────────

export async function runSuccessLoop(
  queryClient: QueryClient,
  completedTask: {
    id:         string;
    title:      string;
    goal_id?:   string | null;
    project_id?: string | null;
  },
): Promise<SuccessLoopResult> {
  const [goalUpdate, projectUpdate] = await Promise.all([
    completedTask.goal_id
      ? recomputeGoalProgress(completedTask.goal_id)
      : Promise.resolve(null),
    completedTask.project_id
      ? recomputeProjectProgress(completedTask.project_id)
      : Promise.resolve(null),
  ]);

  // Invalidate all downstream caches in parallel
  await Promise.all(
    DOWNSTREAM_CACHES.map(k => queryClient.invalidateQueries({ queryKey: k })),
  );

  const result: SuccessLoopResult = {
    taskTitle:       completedTask.title,
    goalUpdate,
    projectUpdate,
    cachesRefreshed: DOWNSTREAM_CACHES.length,
    timestamp:       Date.now(),
  };

  window.dispatchEvent(
    new CustomEvent<SuccessLoopResult>('success-loop:complete', { detail: result }),
  );

  return result;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

async function recomputeGoalProgress(goalId: string): Promise<ProgressUpdate | null> {
  try {
    const [{ data: goal }, { data: tasks }] = await Promise.all([
      supabase.from('goals').select('id, title, progress').eq('id', goalId).single(),
      supabase.from('tasks').select('id, status').eq('goal_id' as never, goalId),
    ]);

    if (!goal || !tasks || tasks.length === 0) return null;

    const done        = tasks.filter((t: { status: string }) => t.status === 'done').length;
    const newProgress = Math.round((done / tasks.length) * 100);
    const oldProgress = goal.progress ?? 0;

    await supabase.from('goals').update({ progress: newProgress }).eq('id', goalId);

    return { id: goal.id, title: goal.title, oldProgress, newProgress };
  } catch {
    return null;
  }
}

async function recomputeProjectProgress(projectId: string): Promise<ProgressUpdate | null> {
  try {
    const [{ data: project }, { data: tasks }] = await Promise.all([
      supabase.from('projects').select('id, title, progress').eq('id', projectId).single(),
      supabase.from('tasks').select('id, status').eq('project_id', projectId),
    ]);

    if (!project || !tasks || tasks.length === 0) return null;

    const done        = tasks.filter((t: { status: string }) => t.status === 'done').length;
    const newProgress = Math.round((done / tasks.length) * 100);
    const oldProgress = project.progress ?? 0;

    await supabase.from('projects').update({ progress: newProgress }).eq('id', projectId);

    return { id: project.id, title: project.title, oldProgress, newProgress };
  } catch {
    return null;
  }
}
