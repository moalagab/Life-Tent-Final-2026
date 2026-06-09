/**
 * useAIDecisionEngine — Frontend orchestrator for the AI layer.
 *
 * Wires together:
 *   - useBehaviorEngine    → BehaviorProfile
 *   - useAdaptivePriority  → ScoredTask[]
 *   - usePersonalizationMemory → DerivedTrends
 *   - ai-decision-engine edge function → AIDecisionResult
 *
 * Improvements:
 *   - Sends habits & goals summary for richer AI context
 *   - Sends done-today count
 *   - Uses full_name from user metadata instead of email prefix
 *   - Tracks which AI actions have been marked done (localStorage)
 *   - Cache TTL: 2h for morning, 4h for midday/full
 */
import { useState, useCallback, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useBehaviorEngine } from './useBehaviorEngine';
import { useAdaptivePriority } from './useAdaptivePriority';
import { usePersonalizationMemory } from './usePersonalizationMemory';
import { format, subDays } from 'date-fns';

// ── Types ────────────────────────────────────────────────────────────────────

export interface AIAction {
  type: 'focus' | 'reschedule' | 'delegate' | 'review' | 'habit' | 'energy';
  title: string;
  description: string;
  taskId?: string | null;
  priority: 'high' | 'medium' | 'low';
  estimated_minutes?: number;
}

export interface AIDecisionResult {
  brief: string;
  coaching: string;
  energy_tip?: string;
  highlight?: string;
  actions: AIAction[];
  computedAt: string;
  mode: 'morning' | 'midday' | 'full';
}

type AnalysisMode = 'morning' | 'midday' | 'full';

// ── Cache helpers ─────────────────────────────────────────────────────────────

const CACHE_TTL: Record<AnalysisMode, number> = {
  morning: 2 * 60 * 60 * 1000,   // 2h — morning brief refreshes at midday
  midday:  4 * 60 * 60 * 1000,   // 4h
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

// ── Task fetch query ──────────────────────────────────────────────────────────

function useRawTasks() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['ai-engine-tasks', user?.id],
    staleTime: 1000 * 60 * 15,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('id, title, priority, due_date, status, is_focus, completed_at')
        .neq('status', 'done')
        .order('due_date', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });
}

// ── Habits summary query ──────────────────────────────────────────────────────

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
      const totalActive = habitsRes.data?.length ?? 0;
      const todayCompleted = logsRes.data?.length ?? 0;
      return { totalActive, todayCompleted, fragileCount: 0 }; // fragileCount from BehaviorEngine
    },
    enabled: !!user,
  });
}

// ── Goals summary query ───────────────────────────────────────────────────────

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
      const activeCount = goals.length;
      const avgProgress = activeCount > 0
        ? goals.reduce((sum, g) => sum + (g.progress ?? 0), 0) / activeCount
        : 0;
      return { activeCount, avgProgress };
    },
    enabled: !!user,
  });
}

// ── Done-today count query ────────────────────────────────────────────────────

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

// ── Main hook ────────────────────────────────────────────────────────────────

export function useAIDecisionEngine() {
  const { user } = useAuth();
  const userId = user?.id ?? 'anonymous';

  const { data: profile, isLoading: profileLoading } = useBehaviorEngine();
  const { data: rawTasks = [], isLoading: tasksLoading } = useRawTasks();
  const { trends, recordSnapshot } = usePersonalizationMemory();
  const { data: habitsSummary } = useHabitsSummary();
  const { data: goalsSummary } = useGoalsSummary();
  const { data: doneToday = 0 } = useDoneToday();

  const scoredTasks = useAdaptivePriority(rawTasks, profile);

  const [result, setResult] = useState<AIDecisionResult | null>(null);
  const [isAnalysing, setIsAnalysing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [doneActions, setDoneActions] = useState<Set<number>>(() => new Set());

  // Auto-detect mode based on time of day
  const detectMode = useCallback((): AnalysisMode => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 11) return 'morning';
    if (hour >= 12 && hour < 15) return 'midday';
    return 'full';
  }, []);

  // Load cached result and done-actions on mount
  useEffect(() => {
    if (!user) return;
    const mode = detectMode();
    const cached = loadCached(userId, mode);
    if (cached) setResult(cached);
    setDoneActions(loadDoneActions(userId, mode));
  }, [userId, user, detectMode]);

  // Record snapshot whenever a fresh BehaviorProfile is computed
  useEffect(() => {
    if (!profile) return;
    const today = format(new Date(), 'yyyy-MM-dd');
    const key = `lt.snapshot-recorded.${userId}.${today}`;
    if (localStorage.getItem(key)) return;
    recordSnapshot(profile, doneToday);
    localStorage.setItem(key, '1');
  }, [profile, userId, doneToday, recordSnapshot]);

  // Resolve display name: prefer full_name from metadata, fallback to email prefix
  const resolveUserName = useCallback(() => {
    const meta = user?.user_metadata;
    if (meta?.full_name) return meta.full_name as string;
    if (meta?.name) return meta.name as string;
    const email = user?.email ?? '';
    const prefix = email.split('@')[0];
    // Capitalise and replace dots/underscores
    return prefix.replace(/[._-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }, [user]);

  const analyse = useCallback(async (mode?: AnalysisMode) => {
    if (!profile || scoredTasks.length === 0) return;

    const selectedMode = mode ?? detectMode();

    if (!mode) {
      const cached = loadCached(userId, selectedMode);
      if (cached) {
        setResult(cached);
        return;
      }
    }

    setIsAnalysing(true);
    setError(null);

    // Build habits summary enriched with fragile count from profile
    const enrichedHabits = habitsSummary
      ? { ...habitsSummary, fragileCount: profile.fragileHabitIds.length }
      : undefined;

    try {
      const { data, error: fnError } = await supabase.functions.invoke('ai-decision-engine', {
        body: {
          profile,
          tasks: scoredTasks.slice(0, 10),
          trends,
          mode: selectedMode,
          userName: resolveUserName(),
          habits: enrichedHabits,
          goals: goalsSummary,
          doneToday,
        },
      });

      if (fnError) throw new Error(fnError.message);

      const aiResult: AIDecisionResult = {
        ...data,
        computedAt: new Date().toISOString(),
        mode: selectedMode,
      };

      saveCache(userId, aiResult);
      setResult(aiResult);
      // Reset done actions for new result
      const freshDone = new Set<number>();
      setDoneActions(freshDone);
      saveDoneActions(userId, selectedMode, freshDone);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsAnalysing(false);
    }
  }, [profile, scoredTasks, trends, userId, habitsSummary, goalsSummary, doneToday, detectMode, resolveUserName]);

  const refresh = useCallback(() => {
    const mode = detectMode();
    try { localStorage.removeItem(cacheKey(userId, mode)); } catch { /* */ }
    analyse(mode);
  }, [userId, analyse, detectMode]);

  /** Mark an action (by index) as done/undone */
  const toggleActionDone = useCallback((index: number) => {
    const mode = detectMode();
    setDoneActions(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      saveDoneActions(userId, mode, next);
      return next;
    });
  }, [userId, detectMode]);

  const isReady = !profileLoading && !tasksLoading;

  return {
    result,
    scoredTasks,
    profile,
    trends,
    doneToday,
    isReady,
    isAnalysing,
    error,
    doneActions,
    analyse,
    refresh,
    toggleActionDone,
  };
}
