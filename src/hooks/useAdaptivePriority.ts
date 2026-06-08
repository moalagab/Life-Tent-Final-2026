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
 *  - Stalled penalty (already overdue > 3 days → deprioritise or force)
 *  - Focus flag bonus
 *  - Peak-hour alignment bonus
 */
import { useMemo } from 'react';
import { differenceInHours, parseISO } from 'date-fns';
import type { BehaviorProfile } from './useBehaviorEngine';

// ── Types ────────────────────────────────────────────────────────────────────

export type TaskAction =
  | 'do_now'          // Highest priority — do immediately
  | 'schedule_today'  // Should be done today but not urgent this minute
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
  suggestedTime?: string;       // e.g. "09:00" based on peakHour
}

interface RawTask {
  id: string;
  title: string;
  priority: string | null;
  due_date: string | null;
  status: string;
  is_focus: boolean | null;
  completed_at: string | null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const clamp = (n: number, min = 0, max = 100) => Math.max(min, Math.min(max, n));

const BASE_SCORE: Record<string, number> = {
  critical: 40,
  high: 30,
  medium: 20,
  low: 10,
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

function formatHour(hour: number): string {
  const h = hour.toString().padStart(2, '0');
  return `${h}:00`;
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
    const todayStr     = now.toISOString().split('T')[0];

    return pendingTasks
      .map((task): ScoredTask => {
        const reasons: string[]     = [];
        let score                    = BASE_SCORE[task.priority ?? 'medium'] ?? 20;

        // 1. Urgency
        const urg = urgencyBonus(task.due_date);
        score += urg;
        if (urg > 0) {
          const hoursLeft = task.due_date
            ? differenceInHours(parseISO(task.due_date + 'T23:59:59'), now)
            : 0;
          if (hoursLeft < 0) reasons.push('متأخرة عن موعدها');
          else if (hoursLeft < 24) reasons.push('موعدها اليوم');
          else if (hoursLeft < 48) reasons.push('موعدها غداً');
        }

        // 2. Focus flag
        if (task.is_focus) {
          score += 10;
          reasons.push('مُحددة كمهمة تركيز');
        }

        // 3. Energy alignment
        // Heavy tasks (critical/high) get a penalty on low-energy days
        const isHeavy = task.priority === 'critical' || task.priority === 'high';
        if (profile.energyEstimate <= 2 && isHeavy) {
          score -= 15;
          reasons.push('طاقتك منخفضة — أجّل المهام الثقيلة');
        } else if (profile.energyEstimate >= 4 && isHeavy) {
          score += 5;
          reasons.push('طاقتك عالية — الوقت المثالي للمهام الصعبة');
        }

        // 4. Stalled penalty
        if (stalledSet.has(task.id)) {
          score -= 10;
          reasons.push('متوقفة منذ أكثر من 3 أيام');
        }

        // 5. Overcommitment — reduce score for non-critical tasks on busy days
        if (profile.overcommitmentScore > 60 && task.priority !== 'critical') {
          score -= 8;
          reasons.push('جدولة اليوم مكتظة');
        }

        // 6. Procrastination boost — if user tends to procrastinate,
        //    bump tasks that are due today to push them above the fold
        if (profile.procrastinationScore > 50 && task.due_date === todayStr) {
          score += 10;
          reasons.push('تميل للتأجيل — قدّم هذه المهمة');
        }

        const finalScore = clamp(Math.round(score));

        // ── Determine action ────────────────────────────────────────────────
        let action: TaskAction;
        if (stalledSet.has(task.id) && profile.stalledTaskIds.length > 3) {
          action = 'delegate';
        } else if (!task.due_date && stalledSet.has(task.id)) {
          action = 'review';
        } else if (finalScore >= 65) {
          action = 'do_now';
        } else if (finalScore >= 40) {
          action = 'schedule_today';
        } else if (profile.energyEstimate <= 2 && isHeavy) {
          action = 'defer';
        } else {
          action = 'schedule_today';
        }

        // ── Suggested time based on peak hour ──────────────────────────────
        const suggestedTime =
          action === 'do_now' || action === 'schedule_today'
            ? formatHour(profile.peakHour)
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
        };
      })
      .sort((a, b) => b.adaptiveScore - a.adaptiveScore);
  }, [tasks, profile]);
}
