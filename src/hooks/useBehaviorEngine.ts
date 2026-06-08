/**
 * useBehaviorEngine — Local behavioral analysis engine.
 *
 * Pure heuristics — no API key required. Runs entirely from Supabase data.
 * Produces a BehaviorProfile that feeds the Adaptive Priority Engine and AI.
 *
 * Analyses:
 *  1. Task completion rate & procrastination score
 *  2. Overcommitment detection (too many tasks per day)
 *  3. Productivity peaks (which hours tasks get done)
 *  4. Habit streak fragility
 *  5. Recurring failure patterns (tasks stalled > 3 times)
 *  6. Energy proxy from mood_logs
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { subDays, parseISO, getHours, getDay, differenceInDays, format } from 'date-fns';

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
  /** Today's energy estimate 1–5 based on recent mood */
  energyEstimate: number;
  /** Likely distraction patterns (text descriptions) */
  distractionPatterns: string[];
  /** Overall risk level for today */
  todayRiskLevel: 'low' | 'medium' | 'high';
  /** Human-readable insights */
  insights: string[];
  computedAt: string;
}

// ── Helper: clamp 0-100 ──────────────────────────────────────────────────────
const clamp = (n: number, min = 0, max = 100) => Math.max(min, Math.min(max, n));

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
          .select('id, status, priority, due_date, completed_at, created_at, title, is_focus')
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
          .order('date', { ascending: false }),
      ]);

      const tasks     = tasksRes.data     ?? [];
      const habitLogs = habitLogsRes.data ?? [];
      const habits    = habitsRes.data    ?? [];
      const moods     = moodRes.data      ?? [];

      // ── 1. Completion rate ───────────────────────────────────────────────
      const dueTasks = tasks.filter(t => t.due_date && t.due_date <= today);
      const doneTasks = dueTasks.filter(t => t.status === 'done');
      const completionRate = dueTasks.length > 0
        ? clamp(Math.round((doneTasks.length / dueTasks.length) * 100))
        : 75; // default when no data

      // ── 2. Procrastination score ─────────────────────────────────────────
      // Tasks done AFTER their due date, or still not done
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
      // Days where > 5 tasks were due
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
      tasks.filter(t => t.completed_at).forEach(t => {
        const d = parseISO(t.completed_at!);
        hourCounts[getHours(d)]++;
        dayCounts[getDay(d)]++;
      });
      const peakHour = hourCounts.indexOf(Math.max(...hourCounts));
      const peakDay  = dayCounts.indexOf(Math.max(...dayCounts));

      // ── 5. Fragile habits (streak < 3 in last 7 days) ───────────────────
      const logsByHabit: Record<string, Set<string>> = {};
      habitLogs.forEach(l => {
        if (!logsByHabit[l.habit_id]) logsByHabit[l.habit_id] = new Set();
        logsByHabit[l.habit_id].add(l.completed_at);
      });
      const fragileHabitIds = habits
        .filter(h => (logsByHabit[h.id]?.size ?? 0) < 3)
        .map(h => h.id);

      // ── 6. Stalled tasks (overdue > 3 days, not done) ───────────────────
      const stalledTaskIds = tasks
        .filter(t => {
          if (t.status === 'done' || !t.due_date) return false;
          return differenceInDays(new Date(), parseISO(t.due_date)) > 3;
        })
        .map(t => t.id);

      // ── 7. Energy estimate from recent mood ──────────────────────────────
      const recentMood = moods[0];
      let energyEstimate = 3; // default medium
      if (recentMood) {
        const raw = recentMood.energy_level ?? recentMood.mood_score ?? 5;
        energyEstimate = Math.round(clamp(raw, 1, 10) / 2); // 1-10 → 1-5
      }

      // ── 8. Distraction patterns ──────────────────────────────────────────
      const dayNames = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
      const distractionPatterns: string[] = [];
      if (procrastinationScore > 50) {
        const worstDay = dayNames[dayCounts.indexOf(Math.min(...dayCounts.filter(c => c > 0)))];
        distractionPatterns.push(`يوم ${worstDay} أقل أيامك إنتاجاً`);
      }
      if (overcommitmentScore > 40) {
        distractionPatterns.push('تميل لجدولة مهام أكثر من طاقتك اليومية');
      }
      if (fragileHabitIds.length > 2) {
        distractionPatterns.push('أكثر من عادتين بحاجة لإعادة بناء');
      }

      // ── 9. Insights ──────────────────────────────────────────────────────
      const insights: string[] = [];
      if (completionRate >= 80) insights.push('أداء ممتاز في إنجاز المهام');
      else if (completionRate >= 60) insights.push('معدل إنجاز جيد — يمكن تحسينه');
      else insights.push('معدل الإنجاز منخفض — راجع أولوياتك');

      if (stalledTaskIds.length > 0) insights.push(`${stalledTaskIds.length} مهمة متوقفة تحتاج قراراً`);
      if (peakHour >= 8 && peakHour <= 12) insights.push('ذروة إنتاجيتك في الصباح — ضع أصعب المهام أولاً');
      else if (peakHour >= 14 && peakHour <= 17) insights.push('ذروة إنتاجيتك بعد الظهر');
      else if (peakHour >= 20) insights.push('ذروة إنتاجيتك في المساء');

      // ── 10. Risk level ────────────────────────────────────────────────────
      const riskScore = (
        (procrastinationScore > 60 ? 2 : procrastinationScore > 30 ? 1 : 0) +
        (overcommitmentScore > 50 ? 2 : overcommitmentScore > 25 ? 1 : 0) +
        (stalledTaskIds.length > 3 ? 2 : stalledTaskIds.length > 1 ? 1 : 0) +
        (energyEstimate <= 2 ? 1 : 0)
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
        computedAt: new Date().toISOString(),
      };
    },
    enabled: !!user,
  });
}
