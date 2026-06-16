/**
 * useTaskAgent — Day Reorganization Engine
 *
 * Analyses today's task load using adaptive priority + behavior profile
 * and produces an ordered plan with time blocks, quick wins, and
 * actionable suggestions the user can act on in one tap.
 *
 * Design principle: pure computation — no mutations here.
 * All "Apply" actions in the UI call existing task mutations.
 */
import { useMemo } from 'react';
import { differenceInMinutes, parseISO, isToday, isTomorrow, addDays, format } from 'date-fns';
import { useTasks } from './useTasks';
import { useProjects } from './useProjects';
import { useBehaviorEngine } from './useBehaviorEngine';
import { useAdaptivePriority, type ScoredTask } from './useAdaptivePriority';

// ── Types ──────────────────────────────────────────────────────────────────────

export type TimeBlock = 'morning' | 'afternoon' | 'evening';

export interface TaskAgentSuggestion {
  id:           string;
  type:         'reorder' | 'defer' | 'focus' | 'warning' | 'quickwin';
  priority:     'high' | 'medium' | 'low';
  title:        string;
  detail:       string;
  taskIds?:     string[];       // tasks this suggestion refers to
  deferDate?:   string;         // ISO date to defer to
}

export interface DayPlan {
  morning:     ScoredTask[];   // high-energy tasks
  afternoon:   ScoredTask[];   // medium tasks
  evening:     ScoredTask[];   // reviews / quick wins
  quickWins:   ScoredTask[];   // estimated ≤ 30 min
  overloaded:  boolean;
  totalTasks:  number;
  completedToday: number;
  suggestions: TaskAgentSuggestion[];
  peakBlock:   TimeBlock;      // when to do the hardest thing
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function currentBlock(): TimeBlock {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

function blockLabel(b: TimeBlock): string {
  const map: Record<TimeBlock, string> = {
    morning:   'الصباح',
    afternoon: 'بعد الظهر',
    evening:   'المساء',
  };
  return map[b];
}

function peakBlock(peakHour: number): TimeBlock {
  if (peakHour < 12) return 'morning';
  if (peakHour < 17) return 'afternoon';
  return 'evening';
}

const ENERGY: Record<TimeBlock, 'high' | 'medium' | 'low'> = {
  morning:   'high',
  afternoon: 'medium',
  evening:   'low',
};

// ── Main hook ──────────────────────────────────────────────────────────────────

export function useTaskAgent() {
  const { data: rawTasks   = [], isLoading: tL } = useTasks();
  const { data: projects   = [], isLoading: pL } = useProjects();
  const { data: profile,         isLoading: bL } = useBehaviorEngine();

  const pendingTasks = useMemo(
    () => rawTasks.filter(t => t.status !== 'done' && !t.archived_at),
    [rawTasks],
  );

  const completedToday = useMemo(
    () => rawTasks.filter(t => t.status === 'done' && t.completed_at && isToday(parseISO(t.completed_at))).length,
    [rawTasks],
  );

  const scored = useAdaptivePriority(pendingTasks, profile);

  const plan = useMemo<DayPlan>(() => {
    if (!profile) {
      return {
        morning: [], afternoon: [], evening: [], quickWins: [],
        overloaded: false, totalTasks: 0, completedToday: 0, suggestions: [],
        peakBlock: 'morning',
      };
    }

    const peak = peakBlock(profile.peakHour);
    const now  = currentBlock();

    // Quick wins — tasks with estimated time ≤ 30 min
    const quickWins = scored.filter(t => {
      const est = (t as any).estimated_minutes ?? (t as any).estimated_time ?? null;
      return est !== null && Number(est) <= 30;
    }).slice(0, 5);

    // Assign tasks to blocks based on energy required + priority
    // Rule: top-priority tasks → peak block; medium → other blocks; review tasks → evening
    const top3     = scored.slice(0, 3);
    const next3    = scored.slice(3, 6);
    const rest     = scored.slice(6, 10);

    const morning:   ScoredTask[] = [];
    const afternoon: ScoredTask[] = [];
    const evening:   ScoredTask[] = [];

    top3.forEach(t => {
      if (peak === 'morning')        morning.push(t);
      else if (peak === 'afternoon') afternoon.push(t);
      else                           evening.push(t);
    });
    next3.forEach(t => {
      if (peak !== 'afternoon') afternoon.push(t);
      else                      morning.push(t);
    });
    rest.forEach(t => evening.push(t));

    const overloaded = scored.length > 8;

    // ── Suggestions ────────────────────────────────────────────────────────
    const suggestions: TaskAgentSuggestion[] = [];

    if (overloaded) {
      const excess = scored.slice(8);
      suggestions.push({
        id: 'overload',
        type: 'warning',
        priority: 'high',
        title: 'يومك مكتظ',
        detail: `لديك ${scored.length} مهمة نشطة — النظام يقترح تأجيل ${excess.length} منها لتحسين التركيز`,
        taskIds: excess.map(t => t.id),
      });
    }

    if (profile.stalledTaskIds.length > 0) {
      suggestions.push({
        id: 'stalled',
        type: 'reorder',
        priority: 'high',
        title: `${profile.stalledTaskIds.length} مهمة متوقفة تحتاج قراراً`,
        detail: 'هذه المهام تستنزف طاقتك الذهنية بدون تقدم — أنجزها أو أرجئها أو احذفها',
        taskIds: profile.stalledTaskIds,
      });
    }

    if (quickWins.length > 0 && completedToday === 0) {
      suggestions.push({
        id: 'quickwin-start',
        type: 'quickwin',
        priority: 'medium',
        title: 'ابدأ بانتصار سريع',
        detail: `${quickWins[0].title} — ${(quickWins[0] as any).estimated_minutes ?? 20} دقيقة تكسر الجمود`,
        taskIds: [quickWins[0].id],
      });
    }

    if (profile.overcommitmentScore > 60) {
      suggestions.push({
        id: 'overcommit',
        type: 'defer',
        priority: 'medium',
        title: 'تقليل الالتزامات',
        detail: 'عادةً ما تأخذ أكثر مما تستطيع — ركّز على 3 مهام فقط اليوم',
      });
    }

    if (peak !== now && scored.length > 0) {
      suggestions.push({
        id: 'peak-reminder',
        type: 'focus',
        priority: 'low',
        title: `ذروة إنتاجيتك في ${blockLabel(peak)}`,
        detail: `احفظ أصعب مهمة لـ${blockLabel(peak)} — الآن افعل الأشياء البسيطة`,
      });
    }

    if (profile.completionRate < 60 && scored.length > 3) {
      const tomorrow = format(addDays(new Date(), 1), 'yyyy-MM-dd');
      suggestions.push({
        id: 'low-completion',
        type: 'defer',
        priority: 'low',
        title: 'أعد جدولة المهام غير العاجلة',
        detail: 'معدل إنجازك يقل عند كثرة المهام — قلّل القائمة لتحسين الأداء',
        taskIds: scored.slice(5).map(t => t.id),
        deferDate: tomorrow,
      });
    }

    return {
      morning,
      afternoon,
      evening,
      quickWins,
      overloaded,
      totalTasks: scored.length,
      completedToday,
      suggestions,
      peakBlock: peak,
    };
  }, [scored, profile, completedToday]);

  return {
    plan,
    isLoading: tL || pL || bL,
    profile,
  };
}
