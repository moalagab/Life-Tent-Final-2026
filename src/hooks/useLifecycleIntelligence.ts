/**
 * useLifecycleIntelligence — Object Lifecycle Engine
 *
 * Tracks how "fresh" each task is based on the time since it was last
 * touched (created_at OR updated_at, whichever is newer). Applies an
 * exponential decay to base priority scores and surfaces:
 *
 *   fresh    → 0–2 days  (decay = 1.0)
 *   active   → 2–5 days  (decay = 0.92)
 *   aging    → 5–14 days (decay = 0.75)
 *   stale    → 14–30 days (decay = 0.50)
 *   dormant  → 30–60 days (decay = 0.28)
 *   ghost    → 60+ days  (decay = 0.12)
 *
 * Decay exceptions:
 *   - due_date within 7 days → urgency overrides, no decay (cap at 0.90)
 *   - is_focus = true        → decay halved (slower)
 *   - priority = 'critical'  → minimum decay = 0.55 (never fully hidden)
 *
 * Outputs:
 *   - Per-task lifecycle metadata
 *   - Aggregate LifecycleReport (health score 0–100)
 *   - Reprioritization suggestions when effective priority drops a tier
 *   - Mutations: batchReprioritize, archiveGhosts, resetDecay
 */
import { useMemo } from 'react';
import { differenceInDays, differenceInHours, parseISO } from 'date-fns';
import { useTasks, useUpdateTask } from './useTasks';
import type { Task } from './useTasks';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

// ── Types ──────────────────────────────────────────────────────────────────────

export type LifecycleState =
  | 'fresh'    // 0–2 days
  | 'active'   // 2–5 days
  | 'aging'    // 5–14 days
  | 'stale'    // 14–30 days
  | 'dormant'  // 30–60 days
  | 'ghost';   // 60+ days

export type SuggestedAction =
  | 'keep'      // task is healthy — no action needed
  | 'review'    // aging — worth a quick look
  | 'reschedule'// stale with no due date — set a date or defer
  | 'downgrade' // priority should drop a tier
  | 'archive'   // dormant/ghost — safe to archive
  | 'purge';    // ghost — strong archive recommendation

export interface TaskLifecycle {
  task:             Task;
  staleDays:        number;   // days since last activity (max of created/updated)
  state:            LifecycleState;
  decayFactor:      number;   // 0.12 – 1.0
  suggestedAction:  SuggestedAction;
  effectivePriority: string;  // priority after decay suggestion
  decayedScore:     number;   // base score after decay (for display)
  isExempt:         boolean;  // true when urgency or focus overrides decay
  exemptReason?:    string;   // why it's exempt
}

export interface ReprioritizeSuggestion {
  taskId:    string;
  title:     string;
  from:      string;
  to:        string;
  reason:    string;
}

export interface LifecycleReport {
  all:          TaskLifecycle[];
  byState: {
    fresh:   TaskLifecycle[];
    active:  TaskLifecycle[];
    aging:   TaskLifecycle[];
    stale:   TaskLifecycle[];
    dormant: TaskLifecycle[];
    ghost:   TaskLifecycle[];
  };
  healthScore:            number;   // 0–100
  totalDecayed:           number;   // tasks losing significant priority due to age
  reprioritizeSuggestions: ReprioritizeSuggestion[];
  isLoading:              boolean;
}

// ── Constants ──────────────────────────────────────────────────────────────────

const DECAY_BY_STATE: Record<LifecycleState, number> = {
  fresh:   1.00,
  active:  0.92,
  aging:   0.75,
  stale:   0.50,
  dormant: 0.28,
  ghost:   0.12,
};

const BASE_SCORE: Record<string, number> = {
  critical: 40,
  high:     30,
  medium:   20,
  low:      10,
};

const PRIORITY_ORDER = ['critical', 'high', 'medium', 'low'];

const STATE_LABELS: Record<LifecycleState, { ar: string; en: string; color: string; days: string }> = {
  fresh:   { ar: 'جديدة',   en: 'Fresh',   color: '#22c55e', days: '0–2 أيام'   },
  active:  { ar: 'نشطة',   en: 'Active',   color: '#3b82f6', days: '2–5 أيام'   },
  aging:   { ar: 'تقادم',  en: 'Aging',   color: '#f59e0b', days: '5–14 يوم'  },
  stale:   { ar: 'راكدة',  en: 'Stale',   color: '#f97316', days: '14–30 يوم' },
  dormant: { ar: 'خاملة',  en: 'Dormant', color: '#ef4444', days: '30–60 يوم' },
  ghost:   { ar: 'شبح',    en: 'Ghost',   color: '#7c3aed', days: '60+ يوم'   },
};

export { STATE_LABELS };

// ── Core logic (pure — no React) ───────────────────────────────────────────────

function getActivityDate(task: Task): Date {
  const created = task.created_at ? new Date(task.created_at) : new Date(0);
  const updated = task.updated_at ? new Date(task.updated_at) : new Date(0);
  return created > updated ? created : updated;
}

function classifyState(staleDays: number): LifecycleState {
  if (staleDays <  2)  return 'fresh';
  if (staleDays <  5)  return 'active';
  if (staleDays < 14)  return 'aging';
  if (staleDays < 30)  return 'stale';
  if (staleDays < 60)  return 'dormant';
  return 'ghost';
}

export function getDecayFactor(task: {
  created_at?: string;
  updated_at?: string;
  due_date?: string | null;
  is_focus?: boolean | null;
  priority?: string | null;
}): number {
  const now      = new Date();
  const created  = task.created_at ? new Date(task.created_at) : now;
  const updated  = task.updated_at ? new Date(task.updated_at) : now;
  const lastActivity = created > updated ? created : updated;
  const staleDays = differenceInDays(now, lastActivity);
  const state     = classifyState(staleDays);
  let   decay     = DECAY_BY_STATE[state];

  // Exception 1: critical tasks never fully disappear
  if (task.priority === 'critical') {
    decay = Math.max(decay, 0.55);
  }

  // Exception 2: focus tasks decay slower (√ decay → slower)
  if (task.is_focus) {
    decay = Math.max(decay, Math.sqrt(decay));
  }

  // Exception 3: due_date within 7 days → urgency override
  if (task.due_date) {
    const hoursLeft = differenceInHours(parseISO(task.due_date + 'T23:59:59'), now);
    if (hoursLeft >= 0 && hoursLeft <= 168) { // 7 days
      decay = Math.max(decay, 0.90);
    }
  }

  return decay;
}

function suggestAction(state: LifecycleState, isExempt: boolean): SuggestedAction {
  if (isExempt) return 'keep';
  switch (state) {
    case 'fresh':   return 'keep';
    case 'active':  return 'keep';
    case 'aging':   return 'review';
    case 'stale':   return 'reschedule';
    case 'dormant': return 'archive';
    case 'ghost':   return 'purge';
  }
}

function downgradePriority(priority: string, decay: number): string {
  const idx = PRIORITY_ORDER.indexOf(priority);
  if (idx === -1) return priority;
  // Suggest downgrade only when decay is significant
  if (decay <= 0.50 && idx < PRIORITY_ORDER.length - 1) {
    return PRIORITY_ORDER[idx + 1];
  }
  if (decay <= 0.28 && idx < PRIORITY_ORDER.length - 1) {
    return PRIORITY_ORDER[Math.min(idx + 2, PRIORITY_ORDER.length - 1)];
  }
  return priority;
}

function analyzeTask(task: Task): TaskLifecycle {
  const now          = new Date();
  const lastActivity = getActivityDate(task);
  const staleDays    = differenceInDays(now, lastActivity);
  const state        = classifyState(staleDays);

  // Determine exemptions
  let isExempt     = false;
  let exemptReason: string | undefined;

  if (task.is_focus) {
    isExempt     = true;
    exemptReason = 'مهمة تركيز';
  } else if (task.priority === 'critical') {
    isExempt     = true;
    exemptReason = 'أولوية حرجة';
  } else if (task.due_date) {
    const hoursLeft = differenceInHours(parseISO(task.due_date + 'T23:59:59'), now);
    if (hoursLeft >= 0 && hoursLeft <= 168) {
      isExempt     = true;
      exemptReason = 'موعد قريب';
    }
  }

  const decayFactor  = getDecayFactor(task);
  const baseScore    = BASE_SCORE[task.priority ?? 'medium'] ?? 20;
  const decayedScore = Math.round(baseScore * decayFactor);
  const effectivePriority = isExempt
    ? (task.priority ?? 'medium')
    : downgradePriority(task.priority ?? 'medium', decayFactor);

  return {
    task,
    staleDays,
    state,
    decayFactor,
    suggestedAction:  suggestAction(state, isExempt),
    effectivePriority,
    decayedScore,
    isExempt,
    exemptReason,
  };
}

// ── Health score (0-100) ───────────────────────────────────────────────────────
// Penalise heavily for ghosts/dormant, lightly for stale/aging

function computeHealthScore(lcItems: TaskLifecycle[]): number {
  if (lcItems.length === 0) return 100;
  const penalties: Record<LifecycleState, number> = {
    fresh:   0,
    active:  0,
    aging:   5,
    stale:   15,
    dormant: 30,
    ghost:   50,
  };
  const totalPenalty = lcItems.reduce((acc, item) => {
    if (item.isExempt) return acc;
    return acc + (penalties[item.state] ?? 0);
  }, 0);
  return Math.max(0, Math.round(100 - (totalPenalty / lcItems.length)));
}

// ── Main hook ──────────────────────────────────────────────────────────────────

export function useLifecycleIntelligence(): LifecycleReport {
  const { data: tasks = [], isLoading } = useTasks();

  const report = useMemo((): Omit<LifecycleReport, 'isLoading'> => {
    // Only pending tasks (archived/done are already handled)
    const pending = tasks.filter(t =>
      t.status !== 'done' &&
      !t.archived_at &&
      t.status !== 'archived'
    );

    const all = pending.map(analyzeTask);

    const byState = {
      fresh:   all.filter(i => i.state === 'fresh'),
      active:  all.filter(i => i.state === 'active'),
      aging:   all.filter(i => i.state === 'aging'),
      stale:   all.filter(i => i.state === 'stale'),
      dormant: all.filter(i => i.state === 'dormant'),
      ghost:   all.filter(i => i.state === 'ghost'),
    };

    const healthScore   = computeHealthScore(all);
    const totalDecayed  = all.filter(i => !i.isExempt && i.decayFactor < 0.75).length;

    const reprioritizeSuggestions: ReprioritizeSuggestion[] = all
      .filter(i => !i.isExempt && i.effectivePriority !== (i.task.priority ?? 'medium'))
      .map(i => ({
        taskId: i.task.id,
        title:  i.task.title,
        from:   i.task.priority ?? 'medium',
        to:     i.effectivePriority,
        reason: `${STATE_LABELS[i.state].ar} — ${Math.round(i.decayFactor * 100)}% من الأولوية الأصلية`,
      }));

    return { all, byState, healthScore, totalDecayed, reprioritizeSuggestions };
  }, [tasks]);

  return { ...report, isLoading };
}

// ── Mutations ──────────────────────────────────────────────────────────────────

/** Batch-apply reprioritization suggestions */
export function useBatchReprioritize() {
  const updateTask = useUpdateTask();
  return async (suggestions: ReprioritizeSuggestion[]) => {
    for (const s of suggestions) {
      await updateTask.mutateAsync({ id: s.taskId, priority: s.to as Task['priority'] });
    }
  };
}

/** Archive all ghost tasks in one shot */
export function useArchiveGhosts() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return async (ghosts: TaskLifecycle[]) => {
    if (!ghosts.length) return;
    const now = new Date().toISOString();
    const ids = ghosts.map(g => g.task.id);
    await supabase
      .from('tasks')
      .update({ archived_at: now, status: 'done' })
      .in('id', ids)
      .eq('user_id', user!.id);
    await qc.invalidateQueries({ queryKey: ['tasks'] });
  };
}

/** Reset decay for a task by touching updated_at */
export function useResetDecay() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return async (taskId: string) => {
    await supabase
      .from('tasks')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', taskId)
      .eq('user_id', user!.id);
    await qc.invalidateQueries({ queryKey: ['tasks'] });
  };
}
