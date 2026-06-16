/**
 * useSystemHealth — Composite score for the entire life OS.
 *
 * Four dimensions, each 0-100, weighted into a single System Health score:
 *   Focus Score      (25%) — task completion rate, procrastination, focus task presence
 *   Execution Score  (35%) — throughput vs. realistic capacity, overcommitment
 *   Financial Score  (25%) — directly from useFinanceAgent.healthScore
 *   Goal Progress    (15%) — average progress across active goals
 *
 * Pure derivation — no extra API calls beyond already-running hooks.
 * staleTime: inherits from underlying hooks.
 */
import { useMemo } from 'react';
import { useBehaviorEngine } from './useBehaviorEngine';
import { useFinanceAgent }   from './useFinanceAgent';
import { useGoalsWithKeyResults } from './useGoals';
import { useOperationalMemory }   from './useOperationalMemory';

// ── Types ──────────────────────────────────────────────────────────────────────

export type HealthGrade = 'excellent' | 'good' | 'fair' | 'poor';

export interface HealthDimension {
  id:      string;
  label:   string;      // Arabic display name
  score:   number;      // 0-100
  grade:   HealthGrade;
  color:   string;      // hex
  insight: string;      // one-line Arabic context
  weight:  number;      // fraction of total (sums to 1)
}

export interface SystemHealthData {
  overall:      number;
  overallGrade: HealthGrade;
  overallLabel: string;
  overallColor: string;
  dimensions:   HealthDimension[];
  isLoading:    boolean;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

function grade(score: number): HealthGrade {
  if (score >= 80) return 'excellent';
  if (score >= 60) return 'good';
  if (score >= 40) return 'fair';
  return 'poor';
}

function gradeLabel(score: number): string {
  if (score >= 80) return 'ممتاز';
  if (score >= 60) return 'جيد';
  if (score >= 40) return 'متوسط';
  return 'يحتاج تحسين';
}

function gradeColor(score: number): string {
  if (score >= 80) return '#10b981';  // emerald-500
  if (score >= 60) return '#3b82f6';  // blue-500
  if (score >= 40) return '#f59e0b';  // amber-500
  return '#ef4444';                    // red-500
}

function focusInsight(score: number): string {
  if (score >= 80) return 'تركيزك ممتاز — استمر';
  if (score >= 60) return 'مستوى تركيز جيد';
  if (score >= 40) return 'يمكن تحسين التركيز';
  return 'التركيز يحتاج اهتماماً';
}

function executionInsight(score: number): string {
  if (score >= 80) return 'معدل إنجازك مرتفع';
  if (score >= 60) return 'إنجاز منتظم وثابت';
  if (score >= 40) return 'الإنجاز أقل من الطاقة الفعلية';
  return 'كثير من المهام متراكمة';
}

function financeInsight(score: number): string {
  if (score >= 80) return 'صحة مالية ممتازة';
  if (score >= 60) return 'الوضع المالي مقبول';
  if (score >= 40) return 'تحتاج مراجعة مالية';
  return 'الوضع المالي يحتاج تدخلاً';
}

function goalInsight(score: number): string {
  if (score >= 80) return 'الأهداف تسير بخطى ممتازة';
  if (score >= 60) return 'تقدم معقول نحو الأهداف';
  if (score >= 40) return 'الأهداف تحتاج دفعة';
  return 'الأهداف بعيدة عن المسار';
}

// ── Main hook ─────────────────────────────────────────────────────────────────

export function useSystemHealth(): SystemHealthData {
  const { data: behavior,     isLoading: bL } = useBehaviorEngine();
  const { data: memory,       isLoading: mL } = useOperationalMemory();
  const { data: goals = [],   isLoading: gL } = useGoalsWithKeyResults();
  const financeAgent = useFinanceAgent();

  const isLoading = bL || mL || gL || financeAgent.isLoading;

  const result = useMemo<Omit<SystemHealthData, 'isLoading'>>(() => {
    // ── Focus Score (25%) ────────────────────────────────────────────────────
    const completionRate        = behavior?.completionRate        ?? 50;
    const procrastinationScore  = behavior?.procrastinationScore  ?? 50;
    const focusTaskCount        = behavior?.focusTaskCount        ?? 0;

    const focusScore = clamp(
      completionRate * 0.5 +
      (100 - procrastinationScore) * 0.3 +
      (focusTaskCount > 0 ? 20 : 0),
    );

    // ── Execution Score (35%) ────────────────────────────────────────────────
    const avgDaily      = memory?.avgDailyCompletions    ?? 0;
    const targetDaily   = memory?.realisticDailyTarget   ?? 1;
    const overcommit    = behavior?.overcommitmentScore   ?? 50;

    const throughputPct = targetDaily > 0
      ? Math.min(100, (avgDaily / targetDaily) * 100)
      : 50;

    const executionScore = clamp(
      completionRate * 0.4 +
      throughputPct  * 0.3 +
      (100 - overcommit) * 0.3,
    );

    // ── Financial Score (25%) ────────────────────────────────────────────────
    const financialScore = financeAgent.healthScore ?? 50;

    // ── Goal Progress Score (15%) ────────────────────────────────────────────
    const activeGoals = goals.filter(g => g.keyResults.length > 0 || g.progress != null);
    const goalScore = activeGoals.length > 0
      ? clamp(
          activeGoals.reduce((sum, g) => {
            const p = 'calculatedProgress' in g
              ? (g as { calculatedProgress: number }).calculatedProgress
              : (g.progress ?? 0);
            return sum + p;
          }, 0) / activeGoals.length,
        )
      : goals.length > 0 ? 30 : 50;   // have goals but no KRs → below avg

    // ── Overall ─────────────────────────────────────────────────────────────
    const overall = clamp(
      focusScore      * 0.25 +
      executionScore  * 0.35 +
      financialScore  * 0.25 +
      goalScore       * 0.15,
    );

    const dimensions: HealthDimension[] = [
      {
        id:      'focus',
        label:   'التركيز',
        score:   focusScore,
        grade:   grade(focusScore),
        color:   gradeColor(focusScore),
        insight: focusInsight(focusScore),
        weight:  0.25,
      },
      {
        id:      'execution',
        label:   'التنفيذ',
        score:   executionScore,
        grade:   grade(executionScore),
        color:   gradeColor(executionScore),
        insight: executionInsight(executionScore),
        weight:  0.35,
      },
      {
        id:      'finance',
        label:   'المالية',
        score:   financialScore,
        grade:   grade(financialScore),
        color:   gradeColor(financialScore),
        insight: financeInsight(financialScore),
        weight:  0.25,
      },
      {
        id:      'goals',
        label:   'الأهداف',
        score:   goalScore,
        grade:   grade(goalScore),
        color:   gradeColor(goalScore),
        insight: goalInsight(goalScore),
        weight:  0.15,
      },
    ];

    return {
      overall,
      overallGrade: grade(overall),
      overallLabel: gradeLabel(overall),
      overallColor: gradeColor(overall),
      dimensions,
    };
  }, [behavior, memory, goals, financeAgent.healthScore]);

  return { ...result, isLoading };
}
