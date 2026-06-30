/**
 * useWeeklyReview — Weekly Review Engine data computation.
 *
 * Computes five analytical views from the past 7 days of activity:
 *   1. Accomplishments  — tasks completed, habits kept, project wins
 *   2. Delays           — overdue + slipped tasks
 *   3. Stalled project  — active project with zero completions this week
 *   4. Goal intervention — goal at risk by deadline or low progress
 *   5. Next-week plan   — top pending tasks sorted by priority
 *
 * "Done this week" is persisted per ISO-week so the review only
 * auto-triggers once per week (Fridays by default).
 */
import { useState, useCallback, useMemo } from 'react';
import {
  format, parseISO, subDays, startOfWeek, endOfWeek,
  differenceInDays, getISOWeek, getYear,
} from 'date-fns';
import { ar } from 'date-fns/locale';
import { useAuth }           from './useAuth';
import { useTasks }          from './useTasks';
import { useProjects }       from './useProjects';
import { useHabitsWithLogs } from './useHabits';
import { useGoals }          from './useGoals';
import type { Task }         from './useTasks';
import type { Project }      from './useProjects';

// ── Constants ──────────────────────────────────────────────────────────────────

const REVIEW_DAY        = 5;   // Friday (0 = Sunday)
const STALL_DAYS        = 7;   // project with no activity for this many days = stalled
const GOAL_WARN_DAYS    = 30;  // goal ending within this window triggers intervention
const GOAL_WARN_PROGRESS = 60; // goal below this % triggers intervention

// ── Types ──────────────────────────────────────────────────────────────────────

export interface ProjectWin {
  projectId:    string;
  projectTitle: string;
  count:        number;
}

export interface WeekAccomplishment {
  tasksCompleted:      number;
  byProject:           ProjectWin[];
  habitCompletionRate: number;   // 0-100 average across all habits this week
  habitsKeptEveryDay:  string[]; // names of habits done all 7 days
  highlights:          string[];
}

export interface DelayedTask {
  id:       string;
  title:    string;
  due_date: string | null;
  priority: string;
  daysLate: number;
}

export interface WeekDelays {
  overdueTasks:  DelayedTask[];  // due before today, still pending
  slippedTasks:  DelayedTask[];  // due this week, not done
}

export interface StalledProject {
  project:           Project;
  pendingTaskCount:  number;
  daysSinceActivity: number;
  lastActivityDate:  string | null;
}

export interface GoalIntervention {
  goal:            { id: string; title: string; end_date: string | null; current_value: number | null; target_value: number | null; perspective: string | null };
  progressPercent: number;
  daysUntilEnd:    number | null;
  urgency:         'critical' | 'warning';
  reason:          string;
}

export interface NextWeekTask {
  id:       string;
  title:    string;
  priority: string;
  due_date: string | null;
}

export interface NextWeekPlan {
  topTasks:       NextWeekTask[];
  focusProject:   Project | null;
  pendingTotal:   number;
  weeklyTarget:   number;    // realistic target based on last-week completion
}

export interface WeeklyReviewData {
  shouldShow:       boolean;
  isDoneThisWeek:   boolean;
  markDone:         () => void;
  openManually:     () => void;
  weekRange:        string;
  weekScore:        number;   // 0-100 overall week health
  accomplishment:   WeekAccomplishment;
  delays:           WeekDelays;
  stalledProject:   StalledProject | null;
  goalIntervention: GoalIntervention | null;
  nextWeekPlan:     NextWeekPlan;
  isLoading:        boolean;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function isThisWeek(dateStr: string | null): boolean {
  if (!dateStr) return false;
  try {
    const d = parseISO(dateStr);
    const now = new Date();
    const ws  = startOfWeek(now, { weekStartsOn: 0 });
    const we  = endOfWeek(now,   { weekStartsOn: 0 });
    return d >= ws && d <= we;
  } catch { return false; }
}

function isBeforeToday(dateStr: string | null): boolean {
  if (!dateStr) return false;
  try {
    return parseISO(dateStr) < new Date();
  } catch { return false; }
}

function daysLate(dueDateStr: string): number {
  try {
    return Math.max(0, differenceInDays(new Date(), parseISO(dueDateStr)));
  } catch { return 0; }
}

function priorityOrder(p: string): number {
  return { urgent: 0, high: 1, medium: 2, low: 3 }[p] ?? 2;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useWeeklyReview(): WeeklyReviewData {
  const { user } = useAuth();
  const reviewKey = `lt.weekly-review.${user?.id ?? 'anon'}`;

  // ── Persistence ────────────────────────────────────────────────────────────

  const isDoneThisWeek = (): boolean => {
    try {
      const raw = localStorage.getItem(reviewKey);
      if (!raw) return false;
      const { week, year } = JSON.parse(raw) as { week: number; year: number };
      const now = new Date();
      return week === getISOWeek(now) && year === getYear(now);
    } catch { return false; }
  };

  const [done,         setDone]         = useState(() => isDoneThisWeek());
  const [manuallyOpen, setManuallyOpen] = useState(false);

  const markDone = useCallback(() => {
    try {
      const now = new Date();
      localStorage.setItem(reviewKey, JSON.stringify({
        week: getISOWeek(now),
        year: getYear(now),
      }));
    } catch { /* ignore */ }
    setDone(true);
    setManuallyOpen(false);
  }, [reviewKey]);

  const openManually = useCallback(() => setManuallyOpen(true), []);

  const isReviewDay = new Date().getDay() === REVIEW_DAY;
  const shouldShow  = manuallyOpen || (isReviewDay && !done);

  // ── Data sources ───────────────────────────────────────────────────────────

  const { data: tasks    = [], isLoading: tL } = useTasks();
  const { data: projects = [], isLoading: pL } = useProjects();
  const { data: habitsWL = [], isLoading: hL } = useHabitsWithLogs();
  const { data: goals    = [], isLoading: gL } = useGoals();

  // ── Week range label ───────────────────────────────────────────────────────

  const weekRange = useMemo(() => {
    const now = new Date();
    const ws  = startOfWeek(now, { weekStartsOn: 0 });
    const we  = endOfWeek(now,   { weekStartsOn: 0 });
    const start = format(ws, 'd MMMM', { locale: ar });
    const end   = format(we, 'd MMMM yyyy', { locale: ar });
    return `${start} — ${end}`;
  }, []);

  // ── Section 1: Accomplishments ─────────────────────────────────────────────

  const accomplishment = useMemo<WeekAccomplishment>(() => {
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 0 });
    const weekEnd   = endOfWeek(new Date(),   { weekStartsOn: 0 });

    const completedThisWeek = tasks.filter(t => {
      if (!t.completed_at || t.status !== 'done') return false;
      try {
        const d = parseISO(t.completed_at);
        return d >= weekStart && d <= weekEnd;
      } catch { return false; }
    });

    // Group by project
    const projectMap: Record<string, { title: string; count: number }> = {};
    completedThisWeek.forEach(t => {
      if (!t.project_id) return;
      if (!projectMap[t.project_id]) {
        const proj = projects.find(p => p.id === t.project_id);
        projectMap[t.project_id] = { title: proj?.title ?? 'مشروع', count: 0 };
      }
      projectMap[t.project_id].count++;
    });

    const byProject: ProjectWin[] = Object.entries(projectMap)
      .map(([id, { title, count }]) => ({ projectId: id, projectTitle: title, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Habit stats — habitsWL has logs for the past 7 days
    const totalDays  = 7;
    let totalSlots   = 0;
    let totalDone    = 0;
    const keptEveryDay: string[] = [];

    habitsWL.forEach(h => {
      const daysCompleted = new Set(
        h.logs
          .filter(l => {
            try { return parseISO(l.completed_at ?? '') >= weekStart; } catch { return false; }
          })
          .map(l => format(parseISO(l.completed_at ?? ''), 'yyyy-MM-dd')),
      ).size;
      totalSlots += totalDays;
      totalDone  += daysCompleted;
      if (daysCompleted >= totalDays) keptEveryDay.push(h.name);
    });

    const habitCompletionRate = totalSlots > 0
      ? Math.round((totalDone / totalSlots) * 100) : 0;

    const highlights: string[] = [];
    if (completedThisWeek.length > 0)
      highlights.push(`أنجزت ${completedThisWeek.length} مهمة هذا الأسبوع`);
    if (keptEveryDay.length > 0)
      highlights.push(`حافظت على ${keptEveryDay.length} عادة طوال الأسبوع`);
    if (byProject.length > 0)
      highlights.push(`قدّمت في ${byProject.length} مشاريع`);
    if (completedThisWeek.length >= 10)
      highlights.push('أسبوع منتج استثنائي!');
    else if (completedThisWeek.length === 0)
      highlights.push('لا مهام مكتملة — ركّز على الإنجاز الأسبوع القادم');

    return {
      tasksCompleted: completedThisWeek.length,
      byProject,
      habitCompletionRate,
      habitsKeptEveryDay: keptEveryDay,
      highlights,
    };
  }, [tasks, projects, habitsWL]);

  // ── Section 2: Delays ─────────────────────────────────────────────────────

  const delays = useMemo<WeekDelays>(() => {
    const todayStr  = format(new Date(), 'yyyy-MM-dd');
    const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 0 }), 'yyyy-MM-dd');

    const pendingTasks = tasks.filter(t =>
      t.status !== 'done' && t.status !== 'archived' && !t.archived_at,
    );

    const overdueTasks: DelayedTask[] = pendingTasks
      .filter(t => t.due_date && t.due_date < todayStr)
      .map(t => ({
        id:       t.id,
        title:    t.title,
        due_date: t.due_date,
        priority: t.priority,
        daysLate: daysLate(t.due_date!),
      }))
      .sort((a, b) => b.daysLate - a.daysLate)
      .slice(0, 8);

    const slippedTasks: DelayedTask[] = pendingTasks
      .filter(t =>
        t.due_date &&
        t.due_date >= weekStart &&
        t.due_date <= todayStr,
      )
      .filter(t => !overdueTasks.some(o => o.id === t.id))
      .map(t => ({
        id:       t.id,
        title:    t.title,
        due_date: t.due_date,
        priority: t.priority,
        daysLate: 0,
      }))
      .sort((a, b) => priorityOrder(a.priority) - priorityOrder(b.priority))
      .slice(0, 6);

    return { overdueTasks, slippedTasks };
  }, [tasks]);

  // ── Section 3: Stalled project ────────────────────────────────────────────

  const stalledProject = useMemo<StalledProject | null>(() => {
    const weekStartDate = startOfWeek(new Date(), { weekStartsOn: 0 });
    const activeProjects = projects.filter(p =>
      !p.archived_at && p.status !== 'completed' && p.status !== 'archived',
    );

    if (activeProjects.length === 0) return null;

    const candidates: StalledProject[] = [];

    activeProjects.forEach(proj => {
      const projectTasks = tasks.filter(t => t.project_id === proj.id);
      if (projectTasks.length === 0) return;

      const pending = projectTasks.filter(t =>
        t.status !== 'done' && t.status !== 'archived' && !t.archived_at,
      );
      if (pending.length === 0) return;

      const completedThisWeek = projectTasks.filter(t => {
        if (!t.completed_at || t.status !== 'done') return false;
        try { return parseISO(t.completed_at) >= weekStartDate; }
        catch { return false; }
      });

      if (completedThisWeek.length > 0) return; // active project, skip

      // Find last activity date
      const completions = projectTasks
        .filter(t => t.completed_at)
        .map(t => {
          try { return parseISO(t.completed_at!); } catch { return null; }
        })
        .filter(Boolean) as Date[];

      const lastActivity = completions.length > 0
        ? new Date(Math.max(...completions.map(d => d.getTime())))
        : null;

      const daysSince = lastActivity
        ? differenceInDays(new Date(), lastActivity)
        : 999;

      if (daysSince >= STALL_DAYS) {
        candidates.push({
          project:           proj,
          pendingTaskCount:  pending.length,
          daysSinceActivity: daysSince,
          lastActivityDate:  lastActivity ? format(lastActivity, 'yyyy-MM-dd') : null,
        });
      }
    });

    if (candidates.length === 0) return null;

    // Most stalled = most pending tasks + longest inactivity
    return candidates.sort((a, b) => {
      const scoreA = a.pendingTaskCount * 2 + Math.min(a.daysSinceActivity, 60);
      const scoreB = b.pendingTaskCount * 2 + Math.min(b.daysSinceActivity, 60);
      return scoreB - scoreA;
    })[0];
  }, [tasks, projects]);

  // ── Section 4: Goal intervention ─────────────────────────────────────────

  const goalIntervention = useMemo<GoalIntervention | null>(() => {
    const today = new Date();
    const candidates: GoalIntervention[] = [];

    goals.forEach(g => {
      const tgt = g.target_value ?? 0;
      const cur = g.current_value ?? 0;
      const progressPercent = tgt > 0 ? Math.round((cur / tgt) * 100) : 0;

      const daysUntilEnd = g.end_date
        ? differenceInDays(parseISO(g.end_date), today) : null;

      let urgency: 'critical' | 'warning' | null = null;
      let reason = '';

      if (daysUntilEnd !== null && daysUntilEnd < 0) {
        urgency = 'critical';
        reason  = `انتهى المهلة منذ ${Math.abs(daysUntilEnd)} يوم والتقدم ${progressPercent}%`;
      } else if (daysUntilEnd !== null && daysUntilEnd <= GOAL_WARN_DAYS && progressPercent < GOAL_WARN_PROGRESS) {
        urgency = 'critical';
        reason  = `يتبقى ${daysUntilEnd} يوم والتقدم ${progressPercent}% فقط`;
      } else if (daysUntilEnd !== null && daysUntilEnd <= GOAL_WARN_DAYS * 2 && progressPercent < 40) {
        urgency = 'warning';
        reason  = `يتبقى ${daysUntilEnd} يوم والتقدم منخفض (${progressPercent}%)`;
      } else if (progressPercent < 20 && tgt > 0) {
        urgency = 'warning';
        reason  = `التقدم متأخر جداً — ${progressPercent}% من الهدف`;
      }

      if (urgency) {
        candidates.push({
          goal: {
            id:            g.id,
            title:         g.title,
            end_date:      g.end_date,
            current_value: g.current_value,
            target_value:  g.target_value,
            perspective:   g.perspective,
          },
          progressPercent,
          daysUntilEnd,
          urgency,
          reason,
        });
      }
    });

    if (candidates.length === 0) return null;

    return candidates.sort((a, b) => {
      if (a.urgency !== b.urgency)
        return a.urgency === 'critical' ? -1 : 1;
      return a.progressPercent - b.progressPercent;
    })[0];
  }, [goals]);

  // ── Section 5: Next-week plan ─────────────────────────────────────────────

  const nextWeekPlan = useMemo<NextWeekPlan>(() => {
    const pending = tasks
      .filter(t =>
        t.status !== 'done' && t.status !== 'archived' && !t.archived_at,
      )
      .sort((a, b) => {
        const po = priorityOrder(a.priority) - priorityOrder(b.priority);
        if (po !== 0) return po;
        // Then by due_date
        if (a.due_date && b.due_date) return a.due_date.localeCompare(b.due_date);
        if (a.due_date) return -1;
        if (b.due_date) return 1;
        return 0;
      });

    const topTasks: NextWeekTask[] = pending.slice(0, 7).map(t => ({
      id:       t.id,
      title:    t.title,
      priority: t.priority,
      due_date: t.due_date,
    }));

    // Focus project = project with most pending tasks
    const projTaskCount: Record<string, number> = {};
    pending.forEach(t => {
      if (t.project_id) projTaskCount[t.project_id] = (projTaskCount[t.project_id] ?? 0) + 1;
    });
    const topProjectId = Object.entries(projTaskCount)
      .sort((a, b) => b[1] - a[1])[0]?.[0];
    const focusProject = topProjectId
      ? (projects.find(p => p.id === topProjectId) ?? null) : null;

    // Weekly target = last week's completion + 10% stretch
    const weeklyTarget = Math.max(
      5,
      Math.round(accomplishment.tasksCompleted * 1.1),
    );

    return {
      topTasks,
      focusProject,
      pendingTotal: pending.length,
      weeklyTarget,
    };
  }, [tasks, projects, accomplishment.tasksCompleted]);

  // ── Week score (0-100) ────────────────────────────────────────────────────

  const weekScore = useMemo(() => {
    let score = 0;
    // Completion rate contribution (40 pts)
    const pending = tasks.filter(t => t.status !== 'done' && !t.archived_at);
    const total   = accomplishment.tasksCompleted + pending.length;
    const rate    = total > 0 ? accomplishment.tasksCompleted / total : 0;
    score += Math.round(rate * 40);
    // Habits (30 pts)
    score += Math.round((accomplishment.habitCompletionRate / 100) * 30);
    // No overdue tasks (15 pts)
    score += delays.overdueTasks.length === 0 ? 15 : Math.max(0, 15 - delays.overdueTasks.length * 3);
    // No stalled projects (15 pts)
    score += stalledProject ? 0 : 15;
    return Math.min(100, score);
  }, [accomplishment, delays, stalledProject, tasks]);

  return {
    shouldShow,
    isDoneThisWeek: done,
    markDone,
    openManually,
    weekRange,
    weekScore,
    accomplishment,
    delays,
    stalledProject,
    goalIntervention,
    nextWeekPlan,
    isLoading: tL || pL || hL || gL,
  };
}
