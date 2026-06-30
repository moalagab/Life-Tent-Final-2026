/**
 * useDailyPlanningCycle — Morning ritual orchestration hook.
 *
 * Determines whether to show the planning wizard (morning hours + not yet
 * done today), computes yesterday's review stats, today's plan, and
 * which tasks to suggest deferring.
 *
 * "Done today" is persisted in localStorage scoped per user.
 */
import { useState, useCallback, useMemo } from 'react';
import { format, parseISO, subDays, isYesterday } from 'date-fns';
import { useAuth } from './useAuth';
import { useTasks } from './useTasks';
import { useHabitsWithLogs } from './useHabits';
import { useTaskAgent } from './useTaskAgent';
import { useDecisionEngine } from './useDecisionEngine';
import type { ScoredTask } from './useAdaptivePriority';

// ── Constants ──────────────────────────────────────────────────────────────────

const MORNING_START = 5;
const MORNING_END   = 11;
const DEFER_THRESHOLD = 42;       // tasks below this score are deferral candidates

// ── Yesterday stats ───────────────────────────────────────────────────────────

export interface YesterdayReview {
  completedCount:  number;
  missedCount:     number;
  habitsCompleted: number;
  totalHabits:     number;
  completionRate:  number;        // 0-100
}

// ── Hook return ───────────────────────────────────────────────────────────────

export interface DailyPlanningCycleData {
  shouldShow:        boolean;
  isDone:            boolean;
  markDone:          (focusTaskId?: string) => void;
  openManually:      () => void;   // force-show even if not morning / already done
  yesterday:         YesterdayReview;
  plan:              ReturnType<typeof useTaskAgent>['plan'];
  planLoading:       boolean;
  focusTask:         ScoredTask | null;
  focusAlternatives: ScoredTask[];
  skipMany:          (ids: string[]) => void;
  deferralCandidates: ScoredTask[];
  isLoading:         boolean;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function isMorningNow(): boolean {
  const h = new Date().getHours();
  return h >= MORNING_START && h < MORNING_END;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useDailyPlanningCycle(): DailyPlanningCycleData {
  const { user } = useAuth();
  const planKey = `lt.daily-plan.${user?.id ?? 'anon'}`;

  const isDoneToday = (): boolean => {
    try {
      const raw = localStorage.getItem(planKey);
      if (!raw) return false;
      const { date } = JSON.parse(raw) as { date: string };
      return date === new Date().toDateString();
    } catch {
      return false;
    }
  };

  const [done,         setDone]         = useState(() => isDoneToday());
  const [manuallyOpen, setManuallyOpen] = useState(false);

  const markDone = useCallback((focusTaskId?: string) => {
    try {
      localStorage.setItem(planKey, JSON.stringify({
        date: new Date().toDateString(),
        focusTaskId: focusTaskId ?? null,
      }));
    } catch { /* ignore */ }
    setDone(true);
    setManuallyOpen(false);
  }, [planKey]);

  const openManually = useCallback(() => {
    setManuallyOpen(true);
  }, []);

  const shouldShow = manuallyOpen || (isMorningNow() && !done);

  // ── Data hooks (shared cache — no extra network requests) ──────────────────

  const { data: tasks = [],          isLoading: tL  } = useTasks();
  const { data: habitsWithLogs = [], isLoading: hL  } = useHabitsWithLogs();
  const { plan,                      isLoading: pL  } = useTaskAgent();
  const { focusTask, queue, skipMany }                 = useDecisionEngine();

  // ── Yesterday review ───────────────────────────────────────────────────────

  const yesterday = useMemo<YesterdayReview>(() => {
    const yesterdayStr = format(subDays(new Date(), 1), 'yyyy-MM-dd');

    const completedCount = tasks.filter(t => {
      if (!t.completed_at) return false;
      try {
        return format(parseISO(t.completed_at), 'yyyy-MM-dd') === yesterdayStr;
      } catch { return false; }
    }).length;

    const missedCount = tasks.filter(t =>
      t.due_date === yesterdayStr && t.status !== 'done',
    ).length;

    const habitsCompleted = habitsWithLogs.filter(h =>
      h.logs.some(l => {
        try {
          return format(parseISO(l.completed_at ?? ''), 'yyyy-MM-dd') === yesterdayStr;
        } catch { return false; }
      }),
    ).length;

    const totalTasks = completedCount + missedCount;
    const completionRate = totalTasks > 0
      ? Math.round((completedCount / totalTasks) * 100) : 0;

    return {
      completedCount,
      missedCount,
      habitsCompleted,
      totalHabits: habitsWithLogs.length,
      completionRate,
    };
  }, [tasks, habitsWithLogs]);

  // ── Deferral candidates ────────────────────────────────────────────────────

  const deferralCandidates = useMemo<ScoredTask[]>(() => {
    const focusId = focusTask?.id;
    const allPlanTasks: ScoredTask[] = [
      ...plan.morning,
      ...plan.afternoon,
      ...plan.evening,
    ];
    return allPlanTasks
      .filter(t => t.score < DEFER_THRESHOLD && t.id !== focusId)
      .slice(0, 5);
  }, [plan, focusTask]);

  return {
    shouldShow,
    isDone: done,
    markDone,
    openManually,
    yesterday,
    plan,
    planLoading: pL,
    focusTask,
    focusAlternatives: queue,
    skipMany,
    deferralCandidates,
    isLoading: tL || hL || pL,
  };
}
