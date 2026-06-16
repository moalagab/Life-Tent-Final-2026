/**
 * useCognitiveLoad — Cognitive Budget Engine
 *
 * Determines WHAT the system should surface to avoid overwhelming the user.
 * Uses a 4-level system (0=ultra → 3=full) that defaults based on context
 * mode and is adjustable by the user within the session.
 *
 * Levels:
 *   0  Ultra-focus:  1 task  · 0 projects  (morning / crisis)
 *   1  Default:      3 tasks · 1 project   (deep-work / wind-down)
 *   2  Medium:       5 tasks · 2 projects  (midday / review)
 *   3  Full:         all     · all         (user expanded)
 *
 * Focus project selection:
 *   Scores each active project by: status=active (+30), in_progress tasks
 *   (+10 each), due_date urgency (days ≤7 → +20, ≤3 → +15 more).
 *
 * Budget score (0-100):
 *   Estimate of cognitive load: 40 base + 15/task + 20/project, capped at 100.
 *   Used to colour the load indicator (green/amber/red).
 */
import { useState, useCallback, useMemo, useEffect } from 'react';
import { differenceInDays, parseISO } from 'date-fns';
import { useTasks } from './useTasks';
import { useProjects } from './useProjects';
import { useBehaviorEngine } from './useBehaviorEngine';
import { useAdaptivePriority, ScoredTask } from './useAdaptivePriority';
import type { UIMode } from './useContextAwareness';
import type { Project } from './useProjects';

// ── Types ──────────────────────────────────────────────────────────────────────

export type CognitiveLevel = 0 | 1 | 2 | 3;

export interface CognitiveState {
  level:              CognitiveLevel;
  maxTasks:           number;     // -1 = unlimited
  maxProjects:        number;     // -1 = unlimited
  focusTasks:         ScoredTask[];   // curated, capped at maxTasks
  focusProjects:      Project[];      // curated, capped at maxProjects
  allTaskCount:       number;         // total pending (for "hidden" count)
  allProjectCount:    number;
  hiddenTaskCount:    number;
  hiddenProjectCount: number;
  budgetScore:        number;         // 0-100 cognitive load estimate
  budgetLabel:        string;         // Arabic label
  expand:             () => void;
  collapse:           () => void;
  setLevel:           (l: CognitiveLevel) => void;
  isAtMax:            boolean;
  isLoading:          boolean;
}

// ── Level limits ───────────────────────────────────────────────────────────────

const LEVEL_LIMITS: Record<CognitiveLevel, { tasks: number; projects: number }> = {
  0: { tasks: 1,  projects: 0  },
  1: { tasks: 3,  projects: 1  },
  2: { tasks: 5,  projects: 2  },
  3: { tasks: -1, projects: -1 },
};

// ── Default level from context mode ───────────────────────────────────────────

function defaultLevel(mode: UIMode): CognitiveLevel {
  switch (mode) {
    case 'morning':
    case 'pressure':
      return 0;
    case 'deep-work':
    case 'wind-down':
    case 'execution':
      return 1;
    case 'midday':
    case 'review':
    case 'celebration':
      return 2;
    default:
      return 1;
  }
}

// ── Session persistence ────────────────────────────────────────────────────────

const SESSION_KEY = 'cog:level-v1';

function loadSessionLevel(): CognitiveLevel | null {
  try {
    const s = sessionStorage.getItem(SESSION_KEY);
    if (s === null) return null;
    const n = parseInt(s, 10);
    return ([0, 1, 2, 3] as CognitiveLevel[]).includes(n as CognitiveLevel) ? n as CognitiveLevel : null;
  } catch { return null; }
}

function saveSessionLevel(level: CognitiveLevel) {
  try { sessionStorage.setItem(SESSION_KEY, String(level)); } catch { /* noop */ }
}

// ── Project scoring ────────────────────────────────────────────────────────────

function scoreProject(p: Project, inProgressCount: number): number {
  let s = 0;
  if (p.status === 'active')     s += 30;
  if (p.status === 'on_hold')    s += 5;
  s += Math.min(inProgressCount, 6) * 10;
  if (p.due_date) {
    const days = differenceInDays(parseISO(p.due_date), new Date());
    if (days >= 0 && days <= 3)  s += 35;
    else if (days <= 7)          s += 20;
    else if (days <= 14)         s += 8;
  }
  if (p.progress !== null && p.progress >= 50 && p.progress < 90) s += 5; // near completion
  return s;
}

// ── Budget computation ─────────────────────────────────────────────────────────

function computeBudget(tasks: number, projects: number): { score: number; label: string } {
  const raw = 40 + tasks * 15 + projects * 20;  // 40 base (FocusEngine always present)
  const score = Math.min(100, raw);
  const label = score >= 85 ? 'حمل ثقيل' : score >= 65 ? 'حمل متوسط' : 'حمل خفيف';
  return { score, label };
}

// ── Main hook ──────────────────────────────────────────────────────────────────

export function useCognitiveLoad(contextMode: UIMode = 'deep-work'): CognitiveState {
  const initLevel = loadSessionLevel() ?? defaultLevel(contextMode);
  const [level, setLevelState] = useState<CognitiveLevel>(initLevel);

  // Sync level with context mode changes (but not if user has manually set)
  const [userOverrode, setUserOverrode] = useState(false);
  useEffect(() => {
    if (!userOverrode) {
      const next = defaultLevel(contextMode);
      setLevelState(next);
      saveSessionLevel(next);
    }
  // only re-run when mode changes, not userOverrode
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contextMode]);

  const setLevel = useCallback((l: CognitiveLevel) => {
    setLevelState(l);
    saveSessionLevel(l);
    setUserOverrode(true);
  }, []);

  const expand = useCallback(() => {
    setLevel(Math.min(3, level + 1) as CognitiveLevel);
  }, [level, setLevel]);

  const collapse = useCallback(() => {
    setLevel(Math.max(0, level - 1) as CognitiveLevel);
  }, [level, setLevel]);

  // Data
  const { data: rawTasks = [],    isLoading: tL } = useTasks();
  const { data: rawProjects = [], isLoading: pL } = useProjects();
  const { data: profile,          isLoading: bL } = useBehaviorEngine();

  const pendingTasks = useMemo(
    () => rawTasks.filter(t => t.status !== 'done' && !t.archived_at),
    [rawTasks],
  );

  const scoredTasks = useAdaptivePriority(pendingTasks, profile);

  // Active projects (not archived, not completed)
  const activeProjects = useMemo(
    () => rawProjects.filter(p => p.status !== 'archived' && p.status !== 'completed' && !p.archived_at),
    [rawProjects],
  );

  // Score + sort projects
  const scoredProjects = useMemo(() => {
    return activeProjects
      .map(p => {
        const inProgress = rawTasks.filter(
          t => t.project_id === p.id && t.status === 'in_progress',
        ).length;
        return { project: p, score: scoreProject(p, inProgress) };
      })
      .sort((a, b) => b.score - a.score)
      .map(s => s.project);
  }, [activeProjects, rawTasks]);

  const limits    = LEVEL_LIMITS[level];
  const maxT      = limits.tasks    < 0 ? scoredTasks.length    : limits.tasks;
  const maxP      = limits.projects < 0 ? scoredProjects.length : limits.projects;

  const focusTasks    = scoredTasks.slice(0, maxT);
  const focusProjects = scoredProjects.slice(0, maxP);

  const hiddenTaskCount    = Math.max(0, scoredTasks.length    - focusTasks.length);
  const hiddenProjectCount = Math.max(0, scoredProjects.length - focusProjects.length);

  const { score: budgetScore, label: budgetLabel } =
    computeBudget(focusTasks.length, focusProjects.length);

  return {
    level,
    maxTasks:    maxT,
    maxProjects: maxP,
    focusTasks,
    focusProjects,
    allTaskCount:       scoredTasks.length,
    allProjectCount:    scoredProjects.length,
    hiddenTaskCount,
    hiddenProjectCount,
    budgetScore,
    budgetLabel,
    expand,
    collapse,
    setLevel,
    isAtMax:   level === 3,
    isLoading: tL || pL || bL,
  };
}
