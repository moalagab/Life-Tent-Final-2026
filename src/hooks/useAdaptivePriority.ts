/**
 * useAdaptivePriority — Dynamic priority scoring engine.
 *
 * Takes raw tasks + BehaviorProfile and returns each task with an
 * adaptive score (0–100) and a recommended action.
 *
 * Scoring factors:
 *  - Base priority (critical=40, high=30, medium=20, low=10)
 *  - Due date urgency (exponential decay as deadline approaches)
 *  - User energy vs task weight (reschedule heavy tasks on low-energy days)
 *  - Stalled penalty (already overdue > 3 days)
 *  - Focus flag bonus
 *  - Peak-hour alignment & suggested time (never in the past)
 *  - Quick-win bonus (short title → likely fast task on low-energy days)
 *  - Procrastination booster for today's due tasks
 */
import { useMemo } from 'react';
import { differenceInHours, parseISO, format } from 'date-fns';
import type { BehaviorProfile } from './useBehaviorEngine';
import { getDecayFactor } from './useLifecycleIntelligence';

// ── Types ────────────────────────────────────────────────────────────────────

export type TaskAction =
  | 'do_now'          // Highest priority — do immediately
  | 'schedule_today'  // Should be done today but not urgent this minute
  | 'quick_win'       // Short task, ideal on low-energy moments
  | 'defer'           // Low energy or low urgency — push to tomorrow
  | 'delegate'        // Repeatedly stalled — consider delegating or dropping
  | 'review';         // Stalled with no due date — needs a decision

export interface ScoredTask {
  id: string;
  title: string;
  originalPriority: string;
  adaptiveScore: number;        // 0–100
  action: TaskAction;
  reasons: string[];            // Human-readable explanation (Arabic)
  suggestedTime?: string;       // e.g. "09:00" based on peakHour (never past)
  estimatedMinutes?: number;    // Rough estimate from title length
}

interface RawTask {
  id: string;
  title: string;
  priority: string | null;
  due_date: string | null;
  status: string;
  is_focus: boolean | null;
  completed_at: string | null;
  created_at?: string;   // used for lifecycle decay
  updated_at?: string;   // used for lifecycle decay
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const clamp = (n: number, min = 0, max = 100) => Math.max(min, Math.min(max, n));

const BASE_SCORE: Record<string, number> = {
  critical: 40,
  high:     30,
  medium:   20,
  low:      10,
};

function urgencyBonus(dueDate: string | null): number {
  if (!dueDate) return 0;
  const hoursLeft = differenceInHours(parseISO(dueDate + 'T23:59:59'), new Date());
  if (hoursLeft < 0)   return 35; // already overdue
  if (hoursLeft < 4)   return 30;
  if (hoursLeft < 12)  return 20;
  if (hoursLeft < 24)  return 15;
  if (hoursLeft < 48)  return 8;
  if (hoursLeft < 96)  return 4;
  return 0;
}

/**
 * Estimate task duration from title length.
 * Very rough heuristic: short title → quick task, long → complex.
 */
function estimateMinutes(title: string): number {
  const words = title.trim().split(/\s+/).length;
  if (words <= 3) return 15;
  if (words <= 6) return 30;
  if (words <= 10) return 60;
  return 90;
}

/**
 * Return a future time string based on peakHour.
 * If peakHour has already passed today, suggest tomorrow's slot.
 * Falls back to next round hour + 1.
 */
function suggestTime(peakHour: number): string {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  if (peakHour > currentHour || (peakHour === currentHour && currentMinute < 30)) {
    return `${String(peakHour).padStart(2, '0')}:00`;
  }
  // Peak passed — suggest next block (peak + 1, or current hour + 1)
  const nextHour = Math.min(currentHour + 1, 22);
  return `${String(nextHour).padStart(2, '0')}:00`;
}

// ── Main hook ────────────────────────────────────────────────────────────────

export function useAdaptivePriority(
  tasks: RawTask[],
  profile: BehaviorProfile | undefined,
): ScoredTask[] {
  return useMemo(() => {
    if (!profile) return [];

    const pendingTasks = tasks.filter(t => t.status !== 'done');
    const stalledSet   = new Set(profile.stalledTaskIds);
    const now          = new Date();
    const todayStr     = format(now, 'yyyy-MM-dd');

    return pendingTasks
      .map((task): ScoredTask => {
        const reasons: string[] = [];

        // 0. Lifecycle decay — ages tasks that haven't been touched recently
        const decay = getDecayFactor(task);
        const baseRaw = BASE_SCORE[task.priority ?? 'medium'] ?? 20;
        let score = Math.round(baseRaw * decay);
        if (decay < 0.90 && decay >= 0.75) reasons.push('المهمة تتقادم تدريجياً');
        if (decay < 0.75 && decay >= 0.50) reasons.push('المهمة راكدة — تحقق منها');
        if (decay < 0.50)                  reasons.push('مهمة قديمة — فكر في أرشفتها');

        // 1. Urgency
        const urg = urgencyBonus(task.due_date);
        score += urg;
        if (urg > 0) {
          const hoursLeft = task.due_date
            ? differenceInHours(parseISO(task.due_date + 'T23:59:59'), now)
            : 0;
          if (hoursLeft < 0)       reasons.push('متأخرة عن موعدها');
          else if (hoursLeft < 4)  reasons.push('موعدها خلال ساعات');
          else if (hoursLeft < 24) reasons.push('موعدها اليوم');
          else if (hoursLeft < 48) reasons.push('موعدها غداً');
          else                     reasons.push('موعدها قريب');
        }

        // 2. Focus flag bonus
        if (task.is_focus) {
          score += 10;
          reasons.push('مُحددة كمهمة تركيز');
        }

        // 3. Energy alignment
        const isHeavy = task.priority === 'critical' || task.priority === 'high';
        const isLight = task.priority === 'low';

        if (profile.energyEstimate <= 2 && isHeavy) {
          score -= 15;
          reasons.push('طاقتك منخفضة — أجّل المهام الثقيلة');
        } else if (profile.energyEstimate >= 4 && isHeavy) {
          score += 5;
          reasons.push('طاقتك عالية — الوقت المثالي للمهام الصعبة');
        } else if (profile.energyEstimate <= 2 && isLight) {
          // Low energy + easy task = quick win opportunity
          score += 8;
          reasons.push('مهمة خفيفة مناسبة لطاقتك الآن');
        }

        // 4. Stalled penalty
        if (stalledSet.has(task.id)) {
          score -= 10;
          reasons.push('متوقفة منذ أكثر من 3 أيام');
        }

        // 5. Overcommitment — reduce score for non-critical tasks
        if (profile.overcommitmentScore > 60 && task.priority !== 'critical') {
          score -= 8;
          reasons.push('جدولة اليوم مكتظة');
        }

        // 6. Procrastination boost for today's tasks
        if (profile.procrastinationScore > 50 && task.due_date === todayStr) {
          score += 10;
          reasons.push('تميل للتأجيل — قدّم هذه المهمة');
        }

        // 7. Quick-win detection
        const estMinutes = estimateMinutes(task.title);
        const isQuickWin = estMinutes <= 15;
        if (isQuickWin && profile.energyEstimate <= 2) {
          score += 5;
          reasons.push('مهمة سريعة — أنجزها بين المهام الكبيرة');
        }

        const finalScore = clamp(Math.round(score));

        // ── Determine action ────────────────────────────────────────────────
        let action: TaskAction;

        if (stalledSet.has(task.id) && profile.stalledTaskIds.length > 3) {
          action = 'delegate';
        } else if (!task.due_date && stalledSet.has(task.id)) {
          action = 'review';
        } else if (isQuickWin && profile.energyEstimate <= 2 && finalScore >= 30) {
          action = 'quick_win';
        } else if (finalScore >= 65) {
          action = 'do_now';
        } else if (finalScore >= 40) {
          action = 'schedule_today';
        } else if (profile.energyEstimate <= 2 && isHeavy) {
          action = 'defer';
        } else if (finalScore < 25) {
          action = 'defer';
        } else {
          action = 'schedule_today';
        }

        // ── Suggested time — never in the past ─────────────────────────────
        const suggestedTime =
          action === 'do_now' || action === 'schedule_today' || action === 'quick_win'
            ? suggestTime(profile.peakHour)
            : undefined;

        if (reasons.length === 0) reasons.push('أولوية عادية');

        return {
          id: task.id,
          title: task.title,
          originalPriority: task.priority ?? 'medium',
          adaptiveScore: finalScore,
          action,
          reasons,
          suggestedTime,
          estimatedMinutes: estMinutes,
        };
      })
      .sort((a, b) => b.adaptiveScore - a.adaptiveScore);
  }, [tasks, profile]);
}
