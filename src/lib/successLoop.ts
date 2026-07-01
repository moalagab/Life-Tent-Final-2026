/**
 * runSuccessLoop — cascading updates triggered after a task is marked done.
 *
 * Order of operations (all non-blocking, non-fatal):
 *   1. Recompute + write project progress (if task.project_id)
 *   2. Invalidate all downstream React Query caches
 *   3. Dispatch `success-loop:complete` event for UI feedback
 *
 * Note: goal-progress cascade was removed — it read a `tasks.goal_id`
 * column and wrote a `goals.progress` column that no longer exist in the
 * schema (tasks now link to goals indirectly via `kr_id` -> key_results ->
 * goal_id, and goals/key_results track progress via current_value/
 * target_value, not a completion percentage). Re-adding this needs a
 * product decision on how a goal's progress should be derived from its
 * key results before it can be reimplemented correctly.
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
    project_id?: string | null;
  },
): Promise<SuccessLoopResult> {
  const projectUpdate = completedTask.project_id
    ? await recomputeProjectProgress(completedTask.project_id)
    : null;

  // Invalidate all downstream caches in parallel
  await Promise.all(
    DOWNSTREAM_CACHES.map(k => queryClient.invalidateQueries({ queryKey: k })),
  );

  const result: SuccessLoopResult = {
    taskTitle:       completedTask.title,
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
