/**
 * useAIDecisionEngine — Frontend orchestrator for the AI layer.
 *
 * Wires together:
 *   - useBehaviorEngine        → BehaviorProfile
 *   - useAdaptivePriority      → ScoredTask[]
 *   - usePersonalizationMemory → DerivedTrends
 *   - ai-decision-engine edge function → AIDecisionResult
 *
 * Modes:
 *   morning  (05:00–11:59) — daily plan & energy allocation
 *   midday   (12:00–14:59) — progress check & re-prioritisation
 *   evening  (18:00–23:59) — reflection & tomorrow's prep
 *   full     (all other)   — deep strategic analysis
 *
 * Cache TTL:
 *   morning  2h | midday 4h | evening 8h | full 4h
 *
 * What's new vs previous version:
 *   - evening mode
 *   - finance context (upcoming bills, budget health)
 *   - analysis proceeds even with 0 pending tasks (great day!)
 *   - completedToday & focusTaskCount forwarded to edge function
 *   - weekSummary flag on Sundays for strategic review
 *   - shorter staleTime for tasks (5 min) so AI context is fresh
 */
import { useState, useCallback, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useBehaviorEngine } from './useBehaviorEngine';
import { useAdaptivePriority } from './useAdaptivePriority';
import { usePersonalizationMemory } from './usePersonalizationMemory';
import { format, subDays, addDays, getDay } from 'date-fns';

// ── Types ────────────────────────────────────────────────────────────────────

export interface AIAction {
  type: 'focus' | 'reschedule' | 'delegate' | 'review' | 'habit' | 'energy' | 'finance';
  title: string;
  description: string;
  taskId?: string | null;
  priority: 'high' | 'medium' | 'low';
  estimated_minutes?: number;
}

export interface DailyTopTask {
  title: string;
  why: string;
  estimated_minutes: number;
}

export interface AIDecisionResult {
  brief: string;
  coaching: string;
  energy_tip?: string;
  highlight?: string;
  actions: AIAction[];
  /** Daily Decision System fields */
  decisions?: string[];
  top_tasks?: DailyTopTask[];
  biggest_risk?: string;
  top_opportunity?: string;
  day_forecast?: string;
  computedAt: string;
  mode: AnalysisMode;
}

export type AnalysisMode = 'morning' | 'midday' | 'evening' | 'full';

interface FinanceSummary {
  upcomingBillsCount: number;
  totalUpcomingAmount: number;
  overBudgetCategories: number;
  healthScore: 'good' | 'warning' | 'critical';
}

// ── Cache helpers ─────────────────────────────────────────────────────────────

const CACHE_TTL: Record<AnalysisMode, number> = {
  morning: 2 * 60 * 60 * 1000,   // 2h
  midday:  4 * 60 * 60 * 1000,   // 4h
  evening: 8 * 60 * 60 * 1000,   // 8h — lasts through the night
  full:    4 * 60 * 60 * 1000,
};

function cacheKey(userId: string, mode: AnalysisMode) {
  return `lt.ai-decision.${userId}.${mode}`;
}

function doneActionsKey(userId: string, mode: AnalysisMode) {
  return `lt.ai-done-actions.${userId}.${mode}.${format(new Date(), 'yyyy-MM-dd')}`;
}

function loadCached(userId: string, mode: AnalysisMode): AIDecisionResult | null {
  try {
    const raw = localStorage.getItem(cacheKey(userId, mode));
    if (!raw) return null;
    const parsed: AIDecisionResult = JSON.parse(raw);
    const age = Date.now() - new Date(parsed.computedAt).getTime();
    if (age > CACHE_TTL[mode]) return null;
    return parsed;
  } catch {
    return null;
  }
}

function saveCache(userId: string, result: AIDecisionResult) {
  try {
    localStorage.setItem(cacheKey(userId, result.mode), JSON.stringify(result));
  } catch { /* ignore */ }
}

function loadDoneActions(userId: string, mode: AnalysisMode): Set<number> {
  try {
    const raw = localStorage.getItem(doneActionsKey(userId, mode));
    if (!raw) return new Set();
    return new Set(JSON.parse(raw));
  } catch {
    return new Set();
  }
}

function saveDoneActions(userId: string, mode: AnalysisMode, indices: Set<number>) {
  try {
    localStorage.setItem(doneActionsKey(userId, mode), JSON.stringify([...indices]));
  } catch { /* ignore */ }
}

// ── Sub-queries ───────────────────────────────────────────────────────────────

function useRawTasks() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['ai-engine-tasks', user?.id],
    staleTime: 1000 * 60 * 5, // 5 min — fresh context for AI
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('id, title, priority, due_date, status, is_focus, completed_at')
        .in('status', ['backlog', 'todo', 'in_progress', 'review'])
        .order('due_date', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });
}

function useHabitsSummary() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['ai-habits-summary', user?.id],
    staleTime: 1000 * 60 * 30,
    queryFn: async () => {
      const today = format(new Date(), 'yyyy-MM-dd');
      const [habitsRes, logsRes] = await Promise.all([
        supabase.from('habits').select('id').eq('is_active', true),
        supabase.from('habit_logs').select('habit_id').eq('completed_at', today),
      ]);
      const totalActive    = habitsRes.data?.length ?? 0;
      const todayCompleted = logsRes.data?.length ?? 0;
      return { totalActive, todayCompleted, fragileCount: 0 };
    },
    enabled: !!user,
  });
}

function useGoalsSummary() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['ai-goals-summary', user?.id],
    staleTime: 1000 * 60 * 30,
    queryFn: async () => {
      const { data } = await supabase
        .from('goals')
        .select('id, progress')
        .eq('status', 'active');
      const goals = data ?? [];
      const activeCount  = goals.length;
      const avgProgress  = activeCount > 0
        ? goals.reduce((sum, g) => sum + (g.progress ?? 0), 0) / activeCount
        : 0;
      return { activeCount, avgProgress };
    },
    enabled: !!user,
  });
}

function useDoneToday() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['ai-done-today', user?.id],
    staleTime: 1000 * 60 * 5,
    queryFn: async () => {
      const today = format(new Date(), 'yyyy-MM-dd');
      const { count } = await supabase
        .from('tasks')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'done')
        .gte('completed_at', `${today}T00:00:00Z`);
      return count ?? 0;
    },
    enabled: !!user,
  });
}

function useFinanceSummary(): { data: FinanceSummary | undefined; isLoading: boolean } {
  const { user } = useAuth();
  const query = useQuery({
    queryKey: ['ai-finance-summary', user?.id],
    staleTime: 1000 * 60 * 60, // 1h — financial data changes slowly
    queryFn: async (): Promise<FinanceSummary> => {
      const today    = format(new Date(), 'yyyy-MM-dd');
      const in7days  = format(addDays(new Date(), 7), 'yyyy-MM-dd');
      const monthStart = today.substring(0, 8) + '01';

      const [subsRes, budgetsRes] = await Promise.all([
        // Upcoming subscription renewals within 7 days
        supabase.from('subscriptions')
          .select('amount, next_billing_date')
          .eq('is_active', true)
          .gte('next_billing_date', today)
          .lte('next_billing_date', in7days),
        // Budgets that are over-limit this month
        supabase.from('budgets')
          .select('id, amount, spent')
          .eq('status', 'active')
          .gte('start_date', monthStart),
      ]);

      const subs = subsRes.data ?? [];
      const budgets = budgetsRes.data ?? [];

      const upcomingBillsCount  = subs.length;
      const totalUpcomingAmount = subs.reduce((s, b) => s + (b.amount ?? 0), 0);
      const overBudgetCategories = budgets.filter(b => (b.spent ?? 0) > (b.amount ?? 0)).length;

      let healthScore: FinanceSummary['healthScore'] = 'good';
      if (overBudgetCategories > 2 || upcomingBillsCount > 3) healthScore = 'warning';
      if (overBudgetCategories > 5) healthScore = 'critical';

      return { upcomingBillsCount, totalUpcomingAmount, overBudgetCategories, healthScore };
    },
    enabled: !!user,
  });
  return { data: query.data, isLoading: query.isLoading };
}

// ── Mode detection ────────────────────────────────────────────────────────────

function detectMode(): AnalysisMode {
  const hour = new Date().getHours();
  if (hour >= 5  && hour < 12) return 'morning';
  if (hour >= 12 && hour < 15) return 'midday';
  if (hour >= 18)              return 'evening';
  return 'full';
}

/** True on Sunday — triggers strategic weekly review */
function isWeekSummaryDay(): boolean {
  return getDay(new Date()) === 0;
}

// ── Main hook ────────────────────────────────────────────────────────────────

export function useAIDecisionEngine() {
  const { user } = useAuth();
  const userId = user?.id ?? 'anonymous';

  const { data: profile, isLoading: profileLoading } = useBehaviorEngine();
  const { data: rawTasks = [], isLoading: tasksLoading } = useRawTasks();
  const { trends, recordSnapshot } = usePersonalizationMemory();
  const { data: habitsSummary } = useHabitsSummary();
  const { data: goalsSummary  } = useGoalsSummary();
  const { data: doneToday = 0 } = useDoneToday();
  const { data: financeSummary } = useFinanceSummary();

  const scoredTasks = useAdaptivePriority(rawTasks, profile);

  const [result,      setResult]      = useState<AIDecisionResult | null>(null);
  const [isAnalysing, setIsAnalysing] = useState(false);
  const [error,       setError]       = useState<string | null>(null);
  const [doneActions, setDoneActions] = useState<Set<number>>(() => new Set());

  // Load cached result and done-actions on mount
  useEffect(() => {
    if (!user) return;
    const mode = detectMode();
    const cached = loadCached(userId, mode);
    if (cached) setResult(cached);
    setDoneActions(loadDoneActions(userId, mode));
  }, [userId, user]);

  // Record snapshot whenever a fresh BehaviorProfile is computed
  useEffect(() => {
    if (!profile) return;
    const today = format(new Date(), 'yyyy-MM-dd');
    const key   = `lt.snapshot-recorded.${userId}.${today}`;
    if (localStorage.getItem(key)) return;
    recordSnapshot(profile, doneToday);
    localStorage.setItem(key, '1');
  }, [profile, userId, doneToday, recordSnapshot]);

  const resolveUserName = useCallback((): string => {
    const meta = user?.user_metadata;
    if (meta?.full_name) return meta.full_name as string;
    if (meta?.name)      return meta.name as string;
    const email  = user?.email ?? '';
    const prefix = email.split('@')[0];
    return prefix.replace(/[._-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }, [user]);

  const analyse = useCallback(async (forceMode?: AnalysisMode) => {
    // Allow analysis even when all tasks are done (great day = 0 pending)
    if (!profile) return;

    const selectedMode = forceMode ?? detectMode();

    if (!forceMode) {
      const cached = loadCached(userId, selectedMode);
      if (cached) { setResult(cached); return; }
    }

    setIsAnalysing(true);
    setError(null);

    const enrichedHabits = habitsSummary
      ? { ...habitsSummary, fragileCount: profile.fragileHabitIds.length }
      : undefined;

    try {
      const { data, error: fnError } = await supabase.functions.invoke('ai-decision-engine', {
        body: {
          profile: {
            ...profile,
            completedToday:  profile.completedToday,
            focusTaskCount:  profile.focusTaskCount,
            weekendProductivityRatio: profile.weekendProductivityRatio,
          },
          tasks:     scoredTasks.slice(0, 10),
          trends,
          mode:      selectedMode,
          userName:  resolveUserName(),
          habits:    enrichedHabits,
          goals:     goalsSummary,
          doneToday,
          finance:   financeSummary,
          isWeekSummary: selectedMode === 'morning' && isWeekSummaryDay(),
        },
      });

      if (fnError) throw new Error(fnError.message);

      const aiResult: AIDecisionResult = {
        ...data,
        computedAt: new Date().toISOString(),
        mode:       selectedMode,
      };

      saveCache(userId, aiResult);
      setResult(aiResult);
      const freshDone = new Set<number>();
      setDoneActions(freshDone);
      saveDoneActions(userId, selectedMode, freshDone);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsAnalysing(false);
    }
  }, [profile, scoredTasks, trends, userId, habitsSummary, goalsSummary, doneToday, financeSummary, resolveUserName]);

  const refresh = useCallback(() => {
    const mode = detectMode();
    try { localStorage.removeItem(cacheKey(userId, mode)); } catch { /* */ }
    analyse(mode);
  }, [userId, analyse]);

  const toggleActionDone = useCallback((index: number) => {
    const mode = detectMode();
    setDoneActions(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      saveDoneActions(userId, mode, next);
      return next;
    });
  }, [userId]);

  const isReady = !profileLoading && !tasksLoading;
  const currentMode = detectMode();

  return {
    result,
    scoredTasks,
    profile,
    trends,
    doneToday,
    currentMode,
    isReady,
    isAnalysing,
    error,
    doneActions,
    analyse,
    refresh,
    toggleActionDone,
  };
}
