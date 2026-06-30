/**
 * useDecisionEngine — The "One Thing" engine.
 *
 * Combines adaptive priority scoring + behavioral context + time-of-day
 * filtering to surface a single focus task at any given moment.
 *
 * Skip:  removes task from today's queue (localStorage, resets midnight)
 * Snooze: hides task for N hours (localStorage, timestamp-based)
 */
import { useState, useCallback, useMemo, useEffect } from 'react';
import { useTasks } from './useTasks';
import { useBehaviorEngine } from './useBehaviorEngine';
import { useAdaptivePriority, ScoredTask } from './useAdaptivePriority';
import { useOperationalMemory } from './useOperationalMemory';

export type ContextMode = 'deep-work' | 'review' | 'execution' | 'wind-down';

// ── localStorage helpers ───────────────────────────────────────────────────────

const SKIP_KEY   = 'de:skipped-v2';
const SNOOZE_KEY = 'de:snoozed-v2';

function loadSkipped(): Set<string> {
  try {
    const raw = localStorage.getItem(SKIP_KEY);
    if (!raw) return new Set();
    const { date, ids } = JSON.parse(raw) as { date: string; ids: string[] };
    if (date !== new Date().toDateString()) return new Set();
    return new Set(ids);
  } catch { return new Set(); }
}

function saveSkipped(set: Set<string>) {
  localStorage.setItem(SKIP_KEY, JSON.stringify({
    date: new Date().toDateString(),
    ids: Array.from(set),
  }));
}

function loadSnoozed(): Map<string, number> {
  try {
    const raw = localStorage.getItem(SNOOZE_KEY);
    if (!raw) return new Map();
    const pairs = JSON.parse(raw) as [string, number][];
    const now = Date.now();
    return new Map(pairs.filter(([, until]) => until > now));
  } catch { return new Map(); }
}

function saveSnoozed(map: Map<string, number>) {
  localStorage.setItem(SNOOZE_KEY, JSON.stringify(Array.from(map.entries())));
}

// ── Context mode ──────────────────────────────────────────────────────────────

export function getContextMode(): ContextMode {
  const h = new Date().getHours();
  if (h >= 5  && h < 12) return 'deep-work';
  if (h >= 12 && h < 17) return 'review';
  if (h >= 17 && h < 21) return 'execution';
  return 'wind-down';
}

// ── Context mode labels (exported for UI) ─────────────────────────────────────

export const CONTEXT_MODE_LABELS: Record<ContextMode, { ar: string; en: string }> = {
  'deep-work':  { ar: 'وقت العمل العميق',   en: 'Deep Work Time'    },
  'review':     { ar: 'وقت المراجعة',       en: 'Review & Connect'  },
  'execution':  { ar: 'وقت الإنجاز',        en: 'Execution Mode'    },
  'wind-down':  { ar: 'وقت التخطيط',        en: 'Wind Down'         },
};

// ── Return type ────────────────────────────────────────────────────────────────

export interface DecisionEngineResult {
  focusTask: ScoredTask | null;
  queue: ScoredTask[];       // next 3 in line after focusTask
  totalPending: number;
  completedToday: number;
  skippedToday: number;
  mode: ContextMode;
  energy: number;            // 1–5
  peakHour: number;
  riskLevel: 'low' | 'medium' | 'high';
  memoryInfluenced: boolean; // true when operational memory shaped the recommendation
  memoryConfidence: number;  // 0-100
  isLoading: boolean;
  skip:     (id: string) => void;
  skipMany: (ids: string[]) => void;  // batch skip from daily planning wizard
  snooze:   (id: string, hours?: number) => void;
  reset:    () => void;      // clear all skips/snoozes
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useDecisionEngine(): DecisionEngineResult {
  // Refresh trigger when skip/snooze state changes
  const [, setVersion] = useState(0);
  const bumpVersion = useCallback(() => setVersion(v => v + 1), []);

  const [skipped, setSkipped] = useState<Set<string>>(() => loadSkipped());
  const [snoozed, setSnoozed] = useState<Map<string, number>>(() => loadSnoozed());

  // Re-sync when the daily planning wizard bulk-skips tasks
  useEffect(() => {
    const handler = () => setSkipped(loadSkipped());
    window.addEventListener('de:skips-updated', handler);
    return () => window.removeEventListener('de:skips-updated', handler);
  }, []);

  const { data: tasks,   isLoading: tasksLoading   } = useTasks();
  const { data: profile, isLoading: profileLoading } = useBehaviorEngine();
  const { data: memory,  isLoading: memoryLoading  } = useOperationalMemory();

  // Only pending, non-archived tasks
  const activeTasks = useMemo(
    () => (tasks ?? []).filter(t =>
      t.status !== 'done' &&
      t.status !== 'archived' &&
      !t.archived_at
    ),
    [tasks],
  );

  const scoredTasks = useAdaptivePriority(activeTasks, profile, memory);

  // Remove skipped (today) and snoozed (until expiry)
  const filtered = useMemo(() => {
    const now = Date.now();
    return scoredTasks.filter(t =>
      !skipped.has(t.id) &&
      (!snoozed.has(t.id) || (snoozed.get(t.id) ?? 0) <= now)
    );
  // version dep forces re-filter after skip/snooze
  }, [scoredTasks, skipped, snoozed]);

  const skip = useCallback((id: string) => {
    setSkipped(prev => {
      const next = new Set(prev);
      next.add(id);
      saveSkipped(next);
      return next;
    });
    bumpVersion();
  }, [bumpVersion]);

  const skipMany = useCallback((ids: string[]) => {
    setSkipped(prev => {
      const next = new Set(prev);
      ids.forEach(id => next.add(id));
      saveSkipped(next);
      return next;
    });
    bumpVersion();
  }, [bumpVersion]);

  const snooze = useCallback((id: string, hours = 1) => {
    setSnoozed(prev => {
      const next = new Map(prev);
      next.set(id, Date.now() + hours * 60 * 60 * 1000);
      saveSnoozed(next);
      return next;
    });
    bumpVersion();
  }, [bumpVersion]);

  const reset = useCallback(() => {
    localStorage.removeItem(SKIP_KEY);
    localStorage.removeItem(SNOOZE_KEY);
    setSkipped(new Set());
    setSnoozed(new Map());
    bumpVersion();
  }, [bumpVersion]);

  return {
    focusTask:      filtered[0] ?? null,
    queue:          filtered.slice(1, 4),
    totalPending:   activeTasks.length,
    completedToday: profile?.completedToday ?? 0,
    skippedToday:   skipped.size,
    mode:           getContextMode(),
    energy:         profile?.energyEstimate ?? 3,
    peakHour:       profile?.peakHour ?? 9,
    riskLevel:        profile?.todayRiskLevel ?? 'low',
    memoryInfluenced: (memory?.confidence ?? 0) >= 40 && (filtered[0]?.memoryReasons?.length ?? 0) > 0,
    memoryConfidence: memory?.confidence ?? 0,
    isLoading:        tasksLoading || profileLoading || memoryLoading,
    skip,
    skipMany,
    snooze,
    reset,
  };
}
