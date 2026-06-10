/**
 * useBehaviorEngine — Local behavioral analysis engine.
 *
 * Pure heuristics — no API key required. Runs entirely from Supabase data.
 * Produces a BehaviorProfile that feeds the Adaptive Priority Engine and AI.
 *
 * Analyses:
 *  1. Task completion rate & procrastination score
 *  2. Overcommitment detection (too many tasks per day)
 *  3. Productivity peaks (which hours/days tasks get done)
 *  4. Habit streak fragility (consecutive-day calculation)
 *  5. Recurring failure patterns (tasks stalled > 3 days)
 *  6. Energy proxy from weighted average of recent mood_logs
 *  7. Weekend vs weekday productivity split
 *  8. Quick-win availability (tasks completable in < 30 min)
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { subDays, parseISO, getHours, getDay, differenceInDays, format, isWeekend } from 'date-fns';

// ── Types ────────────────────────────────────────────────────────────────────

export interface BehaviorProfile {
  /** 0–100: how consistently user completes tasks on time */
  completionRate: number;
  /** 0–100: tendency to defer tasks past due date */
  procrastinationScore: number;
  /** 0–100: tendency to take on more than can be done */
  overcommitmentScore: number;
  /** 0–23: hour of day with highest task completion */
  peakHour: number;
  /** 0–6 (Sun=0): most productive day of week */
  peakDay: number;
  /** Array of habit IDs at risk (streak < 3 days) */
  fragileHabitIds: string[];
  /** Task IDs that have been deferred/failed repeatedly */
  stalledTaskIds: string[];
  /** Today's energy estimate 1–5 based on weighted recent mood */
  energyEstimate: number;
  /** Likely distraction patterns (text descriptions) */
  distractionPatterns: string[];
  /** Overall risk level for today */
  todayRiskLevel: 'low' | 'medium' | 'high';
  /** Human-readable insights */
  insights: string[];
  /** Number of tasks completed today */
  completedToday: number;
  /** Number of tasks currently marked as focus */
  focusTaskCount: number;
  /** Weekend productivity vs weekday (ratio 0-2, 1 = same) */
  weekendProductivityRatio: number;
  computedAt: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────
const clamp = (n: number, min = 0, max = 100) => Math.max(min, Math.min(max, n));

/** Consecutive-day streak ending on or before today */
function calcStreak(completedDates: Set<string>): number {
  if (completedDates.size === 0) return 0;
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 60; i++) {
    const d = format(subDays(today, i), 'yyyy-MM-dd');
    if (completedDates.has(d)) {
      streak++;
    } else if (i > 0) {
      // Allow missing today (not yet logged)
      break;
    }
  }
  return streak;
}

// ── Main hook ────────────────────────────────────────────────────────────────
export function useBehaviorEngine() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['behavior-engine', user?.id],
    staleTime: 1000 * 60 * 30, // re-compute every 30 min max
    queryFn: async (): Promise<BehaviorProfile> => {
      const since30 = subDays(new Date(), 30).toISOString().split('T')[0];
      const since7  = subDays(new Date(), 7).toISOString().split('T')[0];
      const today   = format(new Date(), 'yyyy-MM-dd');

      // ── Parallel data fetch ──────────────────────────────────────────────
      const [tasksRes, habitLogsRes, habitsRes, moodRes] = await Promise.all([
        supabase.from('tasks')
          .select('id, status, priority, due_date, completed_at, created_at, title, is_focus, updated_at')
          .gte('created_at', since30 + 'T00:00:00Z'),
        supabase.from('habit_logs')
          .select('habit_id, completed_at')
          .gte('completed_at', since30),
        supabase.from('habits')
          .select('id, name, frequency')
          .eq('is_active', true),
        supabase.from('mood_logs')
          .select('date, mood_score, energy_level')
          .gte('date', since7)
          .order('date', { ascending: false })
          .limit(7),
      ]);

      const tasks     = tasksRes.data     ?? [];
      const habitLogs = habitLogsRes.data ?? [];
      const habits    = habitsRes.data    ?? [];
      const moods     = moodRes.data      ?? [];

      // ── 1. Completion rate ───────────────────────────────────────────────
      const dueTasks  = tasks.filter(t => t.due_date && t.due_date <= today);
      const doneTasks = dueTasks.filter(t => t.status === 'done');
      const completionRate = dueTasks.length > 0
        ? clamp(Math.round((doneTasks.length / dueTasks.length) * 100))
        : 75;

      // ── 2. Procrastination score ─────────────────────────────────────────
      const lateTasks = tasks.filter(t => {
        if (!t.due_date) return false;
        if (t.status === 'done' && t.completed_at) {
          return t.completed_at.split('T')[0] > t.due_date;
        }
        return t.status !== 'done' && t.due_date < today;
      });
      const procrastinationScore = dueTasks.length > 0
        ? clamp(Math.round((lateTasks.length / dueTasks.length) * 100))
        : 20;

      // ── 3. Overcommitment score ──────────────────────────────────────────
      const tasksByDay: Record<string, number> = {};
      tasks.forEach(t => {
        if (t.due_date) tasksByDay[t.due_date] = (tasksByDay[t.due_date] || 0) + 1;
      });
      const overloadedDays = Object.values(tasksByDay).filter(n => n > 5).length;
      const totalDays = Object.keys(tasksByDay).length || 1;
      const overcommitmentScore = clamp(Math.round((overloadedDays / totalDays) * 100));

      // ── 4. Productivity peaks ────────────────────────────────────────────
      const hourCounts = new Array(24).fill(0);
      const dayCounts  = new Array(7).fill(0);
      tasks.filter(t => t.completed_at && t.status === 'done').forEach(t => {
        const d = parseISO(t.completed_at!);
        hourCounts[getHours(d)]++;
        dayCounts[getDay(d)]++;
      });

      // Safe peak detection — fallback to 9 (morning) if no data
      const maxHour = Math.max(...hourCounts);
      const peakHour = maxHour > 0 ? hourCounts.indexOf(maxHour) : 9;
      const maxDay = Math.max(...dayCounts);
      const peakDay = maxDay > 0 ? dayCounts.indexOf(maxDay) : 1; // Monday

      // ── 5. Fragile habits (consecutive streak < 3) ───────────────────────
      const logsByHabit: Record<string, Set<string>> = {};
      habitLogs.forEach(l => {
        if (!logsByHabit[l.habit_id]) logsByHabit[l.habit_id] = new Set();
        logsByHabit[l.habit_id].add(l.completed_at);
      });
      const fragileHabitIds = habits
        .filter(h => calcStreak(logsByHabit[h.id] ?? new Set()) < 3)
        .map(h => h.id);

      // ── 6. Stalled tasks (overdue > 3 days OR in_progress > 7 days untouched) ──
      const stalledTaskIds = tasks
        .filter(t => {
          if (t.status === 'done') return false;
          // Overdue by due_date
          if (t.due_date && differenceInDays(new Date(), parseISO(t.due_date)) > 3) return true;
          // In progress but not updated for 7+ days
          if (t.status === 'in_progress' && t.updated_at) {
            return differenceInDays(new Date(), parseISO(t.updated_at)) > 7;
          }
          return false;
        })
        .map(t => t.id);

      // ── 7. Weighted energy estimate (recent days weighted more) ──────────
      // Weights: today=3, yesterday=2, 2 days ago=1, rest=0.5
      let energyEstimate = 3;
      if (moods.length > 0) {
        const weights = [3, 2, 1.5, 1, 0.75, 0.5, 0.5];
        let weightedSum = 0;
        let totalWeight = 0;
        moods.slice(0, 7).forEach((m, i) => {
          const raw = m.energy_level ?? m.mood_score ?? 5;
          const normalized = clamp(raw, 1, 10) / 2; // 1-10 → 0.5-5
          const w = weights[i] ?? 0.5;
          weightedSum += normalized * w;
          totalWeight += w;
        });
        energyEstimate = Math.round(clamp(weightedSum / totalWeight, 1, 5));
      }

      // ── 8. Completed today & focus task count ────────────────────────────
      const completedToday = tasks.filter(
        t => t.status === 'done' && t.completed_at?.startsWith(today)
      ).length;
      const focusTaskCount = tasks.filter(t => t.is_focus && t.status !== 'done').length;

      // ── 9. Weekend vs weekday productivity ratio ─────────────────────────
      const weekendDone  = tasks.filter(t => t.status === 'done' && t.completed_at && isWeekend(parseISO(t.completed_at))).length;
      const weekdayDone  = tasks.filter(t => t.status === 'done' && t.completed_at && !isWeekend(parseISO(t.completed_at))).length;
      const weekendRatio = weekdayDone > 0 ? weekendDone / weekdayDone : 1;
      const weekendProductivityRatio = Math.round(weekendRatio * 100) / 100;

      // ── 10. Distraction patterns ─────────────────────────────────────────
      const dayNames = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
      const distractionPatterns: string[] = [];

      if (procrastinationScore > 50) {
        // Only compute worstDay if there's actual data
        const activeDayCounts = dayCounts.map((c, i) => ({ day: i, count: c })).filter(d => d.count > 0);
        if (activeDayCounts.length > 0) {
          const worstDayIdx = activeDayCounts.reduce((min, d) => d.count < min.count ? d : min).day;
          distractionPatterns.push(`يوم ${dayNames[worstDayIdx]} أقل أيامك إنتاجاً`);
        }
      }
      if (overcommitmentScore > 40) {
        distractionPatterns.push('تميل لجدولة مهام أكثر من طاقتك اليومية');
      }
      if (fragileHabitIds.length > 2) {
        distractionPatterns.push('أكثر من عادتين بحاجة لإعادة بناء');
      }
      if (stalledTaskIds.length > 3) {
        distractionPatterns.push(`${stalledTaskIds.length} مهام متوقفة تستنزف طاقتك الذهنية`);
      }
      if (weekendProductivityRatio < 0.3 && weekdayDone > 5) {
        distractionPatterns.push('إنتاجيتك في عطلة نهاية الأسبوع منخفضة جداً');
      }

      // ── 11. Insights ─────────────────────────────────────────────────────
      const insights: string[] = [];
      if (completionRate >= 80) insights.push('أداء ممتاز في إنجاز المهام');
      else if (completionRate >= 60) insights.push('معدل إنجاز جيد — يمكن تحسينه');
      else insights.push('معدل الإنجاز منخفض — راجع أولوياتك');

      if (completedToday > 0) insights.push(`أنجزت ${completedToday} مهمة اليوم — استمر`);
      if (stalledTaskIds.length > 0) insights.push(`${stalledTaskIds.length} مهمة متوقفة تحتاج قراراً`);

      if (peakHour >= 5 && peakHour < 12) insights.push('ذروة إنتاجيتك في الصباح — ضع أصعب المهام أولاً');
      else if (peakHour >= 12 && peakHour < 17) insights.push('ذروة إنتاجيتك بعد الظهر');
      else if (peakHour >= 17) insights.push('ذروة إنتاجيتك في المساء');

      if (focusTaskCount > 5) insights.push('مهام التركيز كثيرة — اختر 3-5 فقط');

      // ── 12. Risk level ────────────────────────────────────────────────────
      const riskScore = (
        (procrastinationScore > 60 ? 2 : procrastinationScore > 30 ? 1 : 0) +
        (overcommitmentScore  > 50 ? 2 : overcommitmentScore  > 25 ? 1 : 0) +
        (stalledTaskIds.length > 3  ? 2 : stalledTaskIds.length > 1  ? 1 : 0) +
        (energyEstimate <= 2 ? 1 : 0) +
        (focusTaskCount > 7  ? 1 : 0)
      );
      const todayRiskLevel: BehaviorProfile['todayRiskLevel'] =
        riskScore >= 5 ? 'high' : riskScore >= 2 ? 'medium' : 'low';

      return {
        completionRate,
        procrastinationScore,
        overcommitmentScore,
        peakHour,
        peakDay,
        fragileHabitIds,
        stalledTaskIds,
        energyEstimate,
        distractionPatterns,
        todayRiskLevel,
        insights,
        completedToday,
        focusTaskCount,
        weekendProductivityRatio,
        computedAt: new Date().toISOString(),
      };
    },
    enabled: !!user,
  });
}
