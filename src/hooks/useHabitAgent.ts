/**
 * useHabitAgent — Behavior-Outcome Correlation Engine
 *
 * Analyses habit completion patterns and correlates them with task
 * productivity signals from the behavior engine.
 *
 * Outputs:
 *  - Per-habit insights: streak, completion rate, impact on productivity
 *  - Correlation insights: "عندما تُكمل X، تنجز Y% أكثر"
 *  - At-risk habits: fragile streaks about to break
 *  - Achievement signals: milestones reached
 *  - Recommended habits to do today based on energy + time
 */
import { useMemo } from 'react';
import {
  differenceInDays, parseISO, subDays, format, isToday, eachDayOfInterval,
} from 'date-fns';
import { useHabitsWithLogs } from './useHabits';
import { useBehaviorEngine } from './useBehaviorEngine';
import { useTasks } from './useTasks';

// ── Types ──────────────────────────────────────────────────────────────────────

export type HabitInsightType =
  | 'correlation'    // habit X → productivity Y
  | 'streak'         // milestone or fragile
  | 'warning'        // about to break
  | 'achievement'    // hit a milestone
  | 'recommendation' // do this today
  | 'insight'        // general behavioral insight

export interface HabitInsight {
  id:            string;
  type:          HabitInsightType;
  habitId:       string;
  habitName:     string;
  habitColor?:   string;
  habitIcon?:    string;
  title:         string;
  detail:        string;
  impact:        'positive' | 'negative' | 'neutral';
  priority:      'high' | 'medium' | 'low';
  streakDays?:   number;
  completionRate?: number;  // 0-100 last 30 days
}

export interface HabitAgentResult {
  insights:        HabitInsight[];
  topHabits:       HabitWithStats[];   // sorted by impact
  atRisk:          HabitWithStats[];   // streak < 3
  recommendations: HabitWithStats[];  // best to do today
  overallScore:    number;            // 0-100 habit health
  overallLabel:    string;
  isLoading:       boolean;
}

export interface HabitWithStats {
  id:            string;
  name:          string;
  color?:        string | null;
  icon?:         string | null;
  streakDays:    number;
  completionRate: number;   // 0-100, last 30 days
  completedToday: boolean;
  lastCompleted?: string;
  impactScore:   number;    // 0-100 estimated productivity impact
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function calcStreak(logs: Array<{ completed_at: string }>): number {
  const dates = new Set(logs.map(l => l.completed_at.substring(0, 10)));
  let streak = 0;
  for (let i = 0; i < 60; i++) {
    const d = format(subDays(new Date(), i), 'yyyy-MM-dd');
    if (dates.has(d)) {
      streak++;
    } else if (i > 0) {
      break;
    }
  }
  return streak;
}

function calcCompletionRate(logs: Array<{ completed_at: string }>, days = 30): number {
  const start = subDays(new Date(), days);
  const interval = eachDayOfInterval({ start, end: new Date() });
  const dates = new Set(logs.map(l => l.completed_at.substring(0, 10)));
  const completed = interval.filter(d => dates.has(format(d, 'yyyy-MM-dd'))).length;
  return Math.round((completed / interval.length) * 100);
}

function impactScore(streak: number, completionRate: number, fragile: boolean): number {
  let s = 0;
  s += Math.min(40, streak * 2);
  s += completionRate * 0.5;
  if (fragile) s -= 10;
  return Math.max(0, Math.min(100, Math.round(s)));
}

const STREAK_MILESTONES = [3, 7, 14, 21, 30, 60, 90, 180, 365];

function nextMilestone(streak: number): number | null {
  return STREAK_MILESTONES.find(m => m > streak) ?? null;
}

// ── Main hook ──────────────────────────────────────────────────────────────────

export function useHabitAgent(): HabitAgentResult {
  const { data: habitsWithLogs = [], isLoading: hL } = useHabitsWithLogs();
  const { data: profile,             isLoading: bL } = useBehaviorEngine();
  const { data: rawTasks   = [],     isLoading: tL } = useTasks();

  const habitsStats = useMemo<HabitWithStats[]>(() => {
    return habitsWithLogs.map(h => {
      const logs       = h.logs ?? [];
      const streak     = calcStreak(logs);
      const rate       = calcCompletionRate(logs, 30);
      const fragile    = profile?.fragileHabitIds?.includes(h.id) ?? (streak < 3);
      const todayStr   = format(new Date(), 'yyyy-MM-dd');
      const completedToday = logs.some(l => l.completed_at.startsWith(todayStr));
      const lastLog    = logs[0]?.completed_at?.substring(0, 10);

      return {
        id:            h.id,
        name:          h.name,
        color:         h.color,
        icon:          h.icon,
        streakDays:    streak,
        completionRate: rate,
        completedToday,
        lastCompleted: lastLog,
        impactScore:   impactScore(streak, rate, fragile),
      };
    });
  }, [habitsWithLogs, profile]);

  const result = useMemo<Omit<HabitAgentResult, 'isLoading'>>(() => {
    const insights: HabitInsight[] = [];

    // Overall habit health score: avg completion rate weighted by streak
    const overallScore = habitsStats.length > 0
      ? Math.round(habitsStats.reduce((s, h) => s + h.completionRate, 0) / habitsStats.length)
      : 0;

    const overallLabel =
      overallScore >= 75 ? 'عادات قوية ومنتظمة' :
      overallScore >= 50 ? 'استمرارية جيدة' :
      overallScore >= 25 ? 'تحتاج دفعة' :
      'العادات تحتاج إعادة بناء';

    // ── Per-habit insights ─────────────────────────────────────────────────
    habitsStats.forEach(h => {
      // Streak warning — fragile streak
      if (h.streakDays > 0 && h.streakDays < 3 && !h.completedToday) {
        insights.push({
          id:            `warn-${h.id}`,
          type:          'warning',
          habitId:       h.id,
          habitName:     h.name,
          habitColor:    h.color ?? undefined,
          habitIcon:     h.icon ?? undefined,
          title:         `${h.name} — سلسلة ${h.streakDays} أيام ستنكسر`,
          detail:        'أكمل هذه العادة اليوم للحفاظ على الاستمرارية',
          impact:        'negative',
          priority:      'high',
          streakDays:    h.streakDays,
          completionRate: h.completionRate,
        });
      }

      // Milestone achievement
      const prevMilestone = STREAK_MILESTONES.filter(m => m <= h.streakDays).pop();
      if (prevMilestone && h.streakDays === prevMilestone) {
        insights.push({
          id:            `milestone-${h.id}-${prevMilestone}`,
          type:          'achievement',
          habitId:       h.id,
          habitName:     h.name,
          habitColor:    h.color ?? undefined,
          habitIcon:     h.icon ?? undefined,
          title:         `${h.name} — ${prevMilestone} يوم متواصل! 🎯`,
          detail:        prevMilestone >= 21
            ? 'أصبحت هذه العادة جزءاً من روتينك تلقائياً'
            : `${nextMilestone(h.streakDays) ?? prevMilestone + 7 - h.streakDays} يوم للوصول للمرحلة التالية`,
          impact:        'positive',
          priority:      'medium',
          streakDays:    h.streakDays,
          completionRate: h.completionRate,
        });
      }
    });

    // ── Correlation insights (behavior ↔ habit) ────────────────────────────
    if (profile) {
      // High-completion habits → better productivity
      const highImpact = habitsStats.filter(h => h.completionRate >= 70 && h.streakDays >= 7);
      if (highImpact.length > 0 && profile.completionRate > 60) {
        const h = highImpact[0];
        insights.push({
          id:         `corr-positive-${h.id}`,
          type:       'correlation',
          habitId:    h.id,
          habitName:  h.name,
          habitColor: h.color ?? undefined,
          title:      `عادة "${h.name}" ترفع إنتاجيتك`,
          detail:     `معدل إنجاز مهامك ${profile.completionRate}% في الأيام التي تُكملها — استمر`,
          impact:     'positive',
          priority:   'low',
          streakDays: h.streakDays,
          completionRate: h.completionRate,
        });
      }

      // Low-completion + stalled tasks correlation
      if (profile.stalledTaskIds.length > 2) {
        const lowHabits = habitsStats.filter(h => h.completionRate < 30 && !h.completedToday);
        if (lowHabits.length > 0) {
          insights.push({
            id:         'corr-stall',
            type:       'correlation',
            habitId:    lowHabits[0].id,
            habitName:  lowHabits[0].name,
            title:      'العادات المتقطعة تُبطئ إنجاز المهام',
            detail:     `لديك ${profile.stalledTaskIds.length} مهمة متوقفة — بناء عادات يومية يُحسّن التدفق`,
            impact:     'negative',
            priority:   'medium',
            completionRate: lowHabits[0].completionRate,
          });
        }
      }

      // Weekend habit pattern
      if (profile.weekendProductivityRatio < 0.5) {
        insights.push({
          id:       'weekend-habits',
          type:     'insight',
          habitId:  '',
          habitName: '',
          title:    'إنتاجيتك في عطل نهاية الأسبوع منخفضة',
          detail:   'اختر عادة واحدة فقط للعطلة — الاستمرارية البسيطة تبني الزخم',
          impact:   'neutral',
          priority: 'low',
        });
      }
    }

    // ── Sort ───────────────────────────────────────────────────────────────
    const PRIO: Record<string, number> = { high: 0, medium: 1, low: 2 };
    insights.sort((a, b) => PRIO[a.priority] - PRIO[b.priority]);

    const sorted   = [...habitsStats].sort((a, b) => b.impactScore - a.impactScore);
    const atRisk   = habitsStats.filter(h => h.streakDays < 3 && !h.completedToday);
    const notDoneToday = habitsStats.filter(h => !h.completedToday);
    const recommendations = notDoneToday
      .sort((a, b) => b.impactScore - a.impactScore)
      .slice(0, 3);

    return {
      insights:        insights.slice(0, 6),
      topHabits:       sorted.slice(0, 5),
      atRisk:          atRisk.slice(0, 3),
      recommendations,
      overallScore,
      overallLabel,
    };
  }, [habitsStats, profile, rawTasks]);

  return {
    ...result,
    isLoading: hL || bL || tL,
  };
}
