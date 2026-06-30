/**
 * useOperationalMemory — Converts historical data into active decision input.
 *
 * PRINCIPLE: Memory is not storage — it is the context that shapes every
 * decision. Every scoring, prediction, and suggestion is calibrated against
 * what has actually worked for this specific user.
 *
 * Analyses 60 days of tasks + habit logs to extract stable behavioral patterns:
 *
 *  bestHours            → which hours historically produce completions
 *  worstDayOfWeek       → day to keep light (not hard-code Monday!)
 *  completionByPriority → does the user actually finish high-priority tasks?
 *  habitBoostFactor     → do habit completions predict task output?
 *  projectLifespan      → how many days before a project silently dies?
 *  avgDailyThroughput   → realistic capacity (not aspirational)
 *  energyByDay          → 7-day energy profile from completion density
 *
 * staleTime: 2 hours — patterns don't change minute-to-minute.
 */
import { useQuery } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import {
  subDays, parseISO, format, getHours, getDay,
  differenceInDays, eachDayOfInterval,
} from 'date-fns';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface MemoryPattern {
  key:        string;
  label:      string;          // Arabic human-readable
  value:      string;          // display value
  confidence: number;          // 0-100 confidence in this pattern
  sentiment:  'positive' | 'warning' | 'neutral';
}

export interface OperationalMemory {
  // ── Temporal patterns ──────────────────────────────────────────────────
  bestHours:              number[];   // hours with above-avg completions, e.g. [9,10,11]
  bestDayOfWeek:          number;     // 0=Sun … 6=Sat
  worstDayOfWeek:         number;
  energyByDay:            number[];   // 7 values 0-5, index=day-of-week

  // ── Capacity patterns ──────────────────────────────────────────────────
  avgDailyCompletions:    number;     // rolling 60-day mean
  realisticDailyTarget:   number;     // 25th-percentile (conservative)

  // ── Task type affinity ─────────────────────────────────────────────────
  completionRateByPriority: Partial<Record<string, number>>;   // 'high' → 0.72

  // ── Habit correlation ──────────────────────────────────────────────────
  habitBoostFactor:       number;     // ratio: completions on habit days / non-habit days
  topHabitId:             string | null;

  // ── Project lifespan ──────────────────────────────────────────────────
  medianProjectLifeDays:  number;     // median days of activity before silence

  // ── Derived patterns (surfaced to UI) ─────────────────────────────────
  patterns:               MemoryPattern[];

  // ── Meta ───────────────────────────────────────────────────────────────
  dataPoints:             number;
  confidence:             number;     // 0-100 overall reliability
  computedAt:             string;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const clamp = (n: number, min = 0, max = 100) => Math.max(min, Math.min(max, n));

function median(arr: number[]): number {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

function percentile(arr: number[], p: number): number {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

const DAY_NAMES_AR = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

// ── Main hook ──────────────────────────────────────────────────────────────────

export function useOperationalMemory() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['operational-memory', user?.id],
    staleTime: 1000 * 60 * 60 * 2,   // 2 hours — patterns are stable
    queryFn: async (): Promise<OperationalMemory> => {
      const since60 = subDays(new Date(), 60).toISOString();

      const [tasksRes, habitLogsRes, habitsRes, projectsRes] = await Promise.all([
        supabase
          .from('tasks')
          .select('id, priority, status, completed_at, created_at, updated_at, project_id')
          .gte('created_at', since60),
        supabase
          .from('habit_logs')
          .select('habit_id, completed_at')
          .gte('completed_at', format(subDays(new Date(), 60), 'yyyy-MM-dd')),
        supabase
          .from('habits')
          .select('id, name')
          .eq('is_active', true),
        supabase
          .from('projects')
          .select('id, status, created_at, updated_at'),
      ]);

      const tasks     = tasksRes.data     ?? [];
      const habitLogs = habitLogsRes.data ?? [];
      const habits    = habitsRes.data    ?? [];
      const projects  = projectsRes.data  ?? [];

      const doneTasks = tasks.filter(t => t.status === 'done' && t.completed_at);
      const dataPoints = doneTasks.length;

      // ── 1. Hour distribution → bestHours ──────────────────────────────
      const hourCounts = new Array(24).fill(0);
      doneTasks.forEach(t => {
        hourCounts[getHours(parseISO(t.completed_at!))]++;
      });
      const avgHourCount = doneTasks.length / 24;
      const bestHours = hourCounts
        .map((c, h) => ({ h, c }))
        .filter(x => x.c > avgHourCount * 1.5 && x.h >= 5 && x.h <= 23)
        .sort((a, b) => b.c - a.c)
        .slice(0, 4)
        .map(x => x.h);
      if (bestHours.length === 0) bestHours.push(9, 10, 11); // fallback

      // ── 2. Day of week distribution → best/worst ───────────────────────
      const dayCounts  = new Array(7).fill(0);
      const dayDoneCounts = new Array(7).fill(0);
      doneTasks.forEach(t => { dayDoneCounts[getDay(parseISO(t.completed_at!))]++; });
      tasks.forEach(t => { if (t.created_at) dayCounts[getDay(parseISO(t.created_at))]++; });

      // Completion rate per day (done / created)
      const dayRates = dayCounts.map((total, d) =>
        total > 0 ? dayDoneCounts[d] / total : 0,
      );
      const maxRate = Math.max(...dayRates);
      const minRate = Math.min(...dayRates.filter(r => r > 0));
      const bestDayOfWeek  = dayRates.indexOf(maxRate);
      const worstDayOfWeek = dayRates.indexOf(minRate) > -1
        ? dayRates.indexOf(minRate) : (bestDayOfWeek + 3) % 7;

      // ── 3. Energy by day (completion density proxy) ────────────────────
      // Scale dayDoneCounts to 0-5 per day
      const maxDayDone = Math.max(...dayDoneCounts, 1);
      const energyByDay = dayDoneCounts.map(c => Math.round((c / maxDayDone) * 5));

      // ── 4. Daily throughput ────────────────────────────────────────────
      const interval = eachDayOfInterval({
        start: subDays(new Date(), 60),
        end:   new Date(),
      });
      const completionsByDay = new Map<string, number>();
      doneTasks.forEach(t => {
        const d = t.completed_at!.substring(0, 10);
        completionsByDay.set(d, (completionsByDay.get(d) ?? 0) + 1);
      });
      const activeDayCounts = interval
        .map(d => completionsByDay.get(format(d, 'yyyy-MM-dd')) ?? 0)
        .filter(c => c > 0);

      const avgDailyCompletions = activeDayCounts.length > 0
        ? Math.round(activeDayCounts.reduce((s, n) => s + n, 0) / activeDayCounts.length)
        : 3;
      const realisticDailyTarget = activeDayCounts.length > 0
        ? Math.round(percentile(activeDayCounts, 25))
        : 2;

      // ── 5. Completion rate by priority ─────────────────────────────────
      const byPriority: Record<string, { done: number; total: number }> = {};
      tasks.forEach(t => {
        const p = t.priority ?? 'medium';
        if (!byPriority[p]) byPriority[p] = { done: 0, total: 0 };
        byPriority[p].total++;
        if (t.status === 'done') byPriority[p].done++;
      });
      const completionRateByPriority: Partial<Record<string, number>> = {};
      for (const [p, { done, total }] of Object.entries(byPriority)) {
        if (total >= 3) completionRateByPriority[p] = Math.round((done / total) * 100) / 100;
      }

      // ── 6. Habit → task correlation (boost factor) ─────────────────────
      // For each day: was ≥1 habit completed? How many tasks were done?
      const habitDates = new Set(habitLogs.map(l => l.completed_at.substring(0, 10)));

      let habitDayTaskCount    = 0;
      let habitDayCount        = 0;
      let nonHabitDayTaskCount = 0;
      let nonHabitDayCount     = 0;

      interval.forEach(d => {
        const dStr   = format(d, 'yyyy-MM-dd');
        const count  = completionsByDay.get(dStr) ?? 0;
        const hasHabit = habitDates.has(dStr);
        if (hasHabit) { habitDayTaskCount += count; habitDayCount++; }
        else          { nonHabitDayTaskCount += count; nonHabitDayCount++; }
      });

      const habitDayAvg    = habitDayCount    > 0 ? habitDayTaskCount    / habitDayCount    : 0;
      const nonHabitDayAvg = nonHabitDayCount > 0 ? nonHabitDayTaskCount / nonHabitDayCount : 0;

      const habitBoostFactor = (nonHabitDayAvg > 0.5 && habitDayAvg > 0)
        ? Math.round((habitDayAvg / nonHabitDayAvg) * 100) / 100
        : 1.0;

      // Find the habit with most log days (most practiced)
      const habitLogCount: Record<string, number> = {};
      habitLogs.forEach(l => {
        habitLogCount[l.habit_id] = (habitLogCount[l.habit_id] ?? 0) + 1;
      });
      const topHabitId = habits.length > 0
        ? (Object.entries(habitLogCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null)
        : null;

      // ── 7. Project lifespan ────────────────────────────────────────────
      const projectTaskActivity = new Map<string, string[]>();
      tasks.forEach(t => {
        if (!t.project_id) return;
        const dates = projectTaskActivity.get(t.project_id) ?? [];
        dates.push((t.completed_at ?? t.updated_at ?? t.created_at)!.substring(0, 10));
        projectTaskActivity.set(t.project_id, dates);
      });

      const projectLifespans: number[] = [];
      projectTaskActivity.forEach((dates) => {
        if (dates.length < 2) return;
        const sorted   = dates.sort();
        const firstDay = parseISO(sorted[0]);
        const lastDay  = parseISO(sorted[sorted.length - 1]);
        const span     = differenceInDays(lastDay, firstDay);
        if (span > 0) projectLifespans.push(span);
      });
      const medianProjectLifeDays = projectLifespans.length >= 3
        ? Math.round(median(projectLifespans))
        : 14; // fallback

      // ── 8. Confidence ─────────────────────────────────────────────────
      const confidence = clamp(Math.round(
        (Math.min(dataPoints, 100) * 0.5) +
        (Math.min(activeDayCounts.length, 30) * 1.5) +
        (habitLogs.length > 20 ? 20 : 0)
      ), 0, 100);

      // ── 9. Human-readable patterns ────────────────────────────────────
      const patterns: MemoryPattern[] = [];

      if (bestHours.length > 0) {
        const hStr = bestHours.slice(0, 2).map(h => `${h}:00`).join(' - ');
        patterns.push({
          key:        'best-hours',
          label:      'أفضل ساعات العمل',
          value:      `${hStr}`,
          confidence: Math.min(95, 40 + dataPoints * 0.5),
          sentiment:  'positive',
        });
      }

      patterns.push({
        key:        'best-day',
        label:      'أكثر أيامك إنتاجاً',
        value:      DAY_NAMES_AR[bestDayOfWeek],
        confidence: Math.min(90, 30 + activeDayCounts.length * 1.2),
        sentiment:  'positive',
      });

      patterns.push({
        key:        'worst-day',
        label:      'أضعف أيامك تاريخياً',
        value:      DAY_NAMES_AR[worstDayOfWeek],
        confidence: Math.min(85, 30 + activeDayCounts.length),
        sentiment:  'warning',
      });

      if (avgDailyCompletions > 0) {
        patterns.push({
          key:        'throughput',
          label:      'متوسط إنجازك اليومي',
          value:      `${avgDailyCompletions} مهام / يوم`,
          confidence: Math.min(95, 50 + activeDayCounts.length),
          sentiment:  avgDailyCompletions >= 3 ? 'positive' : 'neutral',
        });
      }

      const highRate = completionRateByPriority['high'] ?? completionRateByPriority['critical'];
      if (highRate !== undefined) {
        patterns.push({
          key:        'high-priority-rate',
          label:      'إنجاز المهام العالية الأولوية',
          value:      `${Math.round((highRate) * 100)}%`,
          confidence: Math.min(90, 40 + (byPriority['high']?.total ?? 0) * 2),
          sentiment:  highRate >= 0.7 ? 'positive' : highRate >= 0.4 ? 'neutral' : 'warning',
        });
      }

      if (habitBoostFactor > 1.1) {
        const topHabitName = habits.find(h => h.id === topHabitId)?.name;
        patterns.push({
          key:        'habit-boost',
          label:      'العادات تُضاعف إنتاجيتك',
          value:      `+${Math.round((habitBoostFactor - 1) * 100)}% مهام في أيام العادات`,
          confidence: Math.min(90, 30 + habitDayCount * 2),
          sentiment:  'positive',
        });
        if (topHabitName) {
          patterns.push({
            key:        'top-habit',
            label:      'العادة الأكثر تأثيراً',
            value:      topHabitName,
            confidence: Math.min(85, 25 + (habitLogCount[topHabitId!] ?? 0) * 2),
            sentiment:  'positive',
          });
        }
      }

      if (medianProjectLifeDays > 0) {
        patterns.push({
          key:        'project-lifespan',
          label:      'متوسط نشاط مشاريعك',
          value:      `${medianProjectLifeDays} يوم`,
          confidence: Math.min(80, 20 + projectLifespans.length * 8),
          sentiment:  medianProjectLifeDays >= 14 ? 'positive' : 'warning',
        });
      }

      return {
        bestHours,
        bestDayOfWeek,
        worstDayOfWeek,
        energyByDay,
        avgDailyCompletions,
        realisticDailyTarget,
        completionRateByPriority,
        habitBoostFactor,
        topHabitId,
        medianProjectLifeDays,
        patterns,
        dataPoints,
        confidence,
        computedAt: new Date().toISOString(),
      };
    },
    enabled: !!user,
  });
}
