/**
 * useAIDecisionEngine — Frontend orchestrator for the AI layer.
 *
 * Wires together:
 *   - useBehaviorEngine    → BehaviorProfile
 *   - useAdaptivePriority  → ScoredTask[]
 *   - usePersonalizationMemory → DerivedTrends
 *   - ai-decision-engine edge function → AIDecisionResult
 *
 * Caches edge function result in localStorage for 6 hours
 * (avoids hammering Gemini API on every page reload).
 */
import { useState, useCallback, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useBehaviorEngine } from './useBehaviorEngine';
import { useAdaptivePriority } from './useAdaptivePriority';
import { usePersonalizationMemory } from './usePersonalizationMemory';
import { format } from 'date-fns';

// ── Types ────────────────────────────────────────────────────────────────────

export interface AIAction {
  type: 'focus' | 'reschedule' | 'delegate' | 'review' | 'habit' | 'energy';
  title: string;
  description: string;
  taskId?: string | null;
  priority: 'high' | 'medium' | 'low';
}

export interface AIDecisionResult {
  brief: string;
  coaching: string;
  actions: AIAction[];
  computedAt: string;
  mode: 'morning' | 'midday' | 'full';
}

type AnalysisMode = 'morning' | 'midday' | 'full';

// ── Cache helpers ─────────────────────────────────────────────────────────────

const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

function cacheKey(userId: string, mode: AnalysisMode) {
  return `lt.ai-decision.${userId}.${mode}`;
}

function loadCached(userId: string, mode: AnalysisMode): AIDecisionResult | null {
  try {
    const raw = localStorage.getItem(cacheKey(userId, mode));
    if (!raw) return null;
    const parsed: AIDecisionResult = JSON.parse(raw);
    const age = Date.now() - new Date(parsed.computedAt).getTime();
    if (age > CACHE_TTL_MS) return null;
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

// ── Main hook ────────────────────────────────────────────────────────────────

export function useAIDecisionEngine() {
  const { user } = useAuth();
  const userId = user?.id ?? 'anonymous';

  const { data: profile, isLoading: profileLoading } = useBehaviorEngine();
  const { data: rawTasks = [], isLoading: tasksLoading } = useRawTasks();
  const { trends, recordSnapshot } = usePersonalizationMemory();

  const scoredTasks = useAdaptivePriority(rawTasks, profile);

  const [result, setResult] = useState<AIDecisionResult | null>(null);
  const [isAnalysing, setIsAnalysing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-detect mode based on time of day
  const detectMode = useCallback((): AnalysisMode => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 11) return 'morning';
    if (hour >= 12 && hour < 15) return 'midday';
    return 'full';
  }, []);

  // Load cached result on mount
  useEffect(() => {
    if (!user) return;
    const mode = detectMode();
    const cached = loadCached(userId, mode);
    if (cached) setResult(cached);
  }, [userId, user, detectMode]);

  // Record snapshot whenever a fresh BehaviorProfile is computed
  useEffect(() => {
    if (!profile) return;
    const today = format(new Date(), 'yyyy-MM-dd');
    const key = `lt.snapshot-recorded.${userId}.${today}`;
    if (localStorage.getItem(key)) return;
    recordSnapshot(profile, 0); // completedToday tracked separately
    localStorage.setItem(key, '1');
  }, [profile, userId, recordSnapshot]);

  const analyse = useCallback(async (mode?: AnalysisMode) => {
    if (!profile || scoredTasks.length === 0) return;

    const selectedMode = mode ?? detectMode();

    // Check cache first (unless caller explicitly passes a mode to force refresh)
    if (!mode) {
      const cached = loadCached(userId, selectedMode);
      if (cached) {
        setResult(cached);
        return;
      }
    }

    setIsAnalysing(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('ai-decision-engine', {
        body: {
          profile,
          tasks: scoredTasks.slice(0, 10),
          trends,
          mode: selectedMode,
          userName: user?.email?.split('@')[0] ?? undefined,
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
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsAnalysing(false);
    }
  }, [profile, scoredTasks, trends, userId, user, detectMode]);

  const refresh = useCallback(() => {
    const mode = detectMode();
    // Invalidate cache before re-running
    try { localStorage.removeItem(cacheKey(userId, mode)); } catch { /* */ }
    analyse(mode);
  }, [userId, analyse, detectMode]);

  const isReady = !profileLoading && !tasksLoading;

  return {
    /** Full AI analysis result */
    result,
    /** Sorted + scored tasks ready for display */
    scoredTasks,
    /** Raw behavior profile */
    profile,
    /** Long-term trends from personalization memory */
    trends,
    /** Whether data is still loading */
    isReady,
    /** Whether edge function call is in progress */
    isAnalysing,
    /** Error message if edge function failed */
    error,
    /** Run analysis (uses cached result if fresh) */
    analyse,
    /** Force a fresh analysis ignoring cache */
    refresh,
  };
}
