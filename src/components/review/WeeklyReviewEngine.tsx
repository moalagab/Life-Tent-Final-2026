/**
 * WeeklyReviewEngine — Full-screen weekly review report.
 *
 * Five sections, navigated via tab bar:
 *   1. الإنجازات   — What was accomplished (tasks, habits, project wins)
 *   2. التأخيرات   — What was delayed (overdue + slipped tasks)
 *   3. المتعثر     — The most stalled project
 *   4. تدخل عاجل  — Goal that needs immediate intervention
 *   5. الخطة      — Next week's plan (top tasks + focus project)
 *
 * Auto-triggered on Fridays when the weekly review isn't yet done.
 */
import { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  Trophy, Clock, AlertOctagon, Target, CalendarDays,
  X, ChevronRight, ChevronLeft,
  CheckCircle2, AlertTriangle, TrendingUp, TrendingDown,
  Flame, Folder, Star, BarChart3, ArrowRight, Plus, Minus, Loader2,
} from 'lucide-react';
import { useUpdateGoal } from '@/hooks/useGoals';
import { useUpdateTask } from '@/hooks/useTasks';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { format, parseISO } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useWeeklyReview } from '@/hooks/useWeeklyReview';
import type {
  WeekAccomplishment, WeekDelays, StalledProject,
  GoalIntervention, NextWeekPlan,
} from '@/hooks/useWeeklyReview';

// ── Tab config ─────────────────────────────────────────────────────────────────

type ReviewTab = 'accomplishments' | 'delays' | 'stalled' | 'intervention' | 'next-week';

interface TabCfg {
  id:    ReviewTab;
  label: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon:  React.FC<any>;
  color: string;
}

const TABS: TabCfg[] = [
  { id: 'accomplishments', label: 'الإنجازات',  icon: Trophy,       color: 'text-emerald-400'  },
  { id: 'delays',          label: 'التأخيرات',  icon: Clock,        color: 'text-red-400'       },
  { id: 'stalled',         label: 'المتعثر',    icon: AlertOctagon, color: 'text-amber-400'    },
  { id: 'intervention',    label: 'تدخل عاجل',  icon: Target,       color: 'text-orange-400'   },
  { id: 'next-week',       label: 'الخطة',      icon: CalendarDays, color: 'text-blue-400'     },
];

const PRIORITY_DOT: Record<string, string> = {
  urgent: 'bg-red-500',
  high:   'bg-orange-400',
  medium: 'bg-amber-400',
  low:    'bg-slate-400',
};

const PRIORITY_LABEL: Record<string, string> = {
  urgent: 'عاجل', high: 'عالي', medium: 'متوسط', low: 'منخفض',
};

// ── Score ring ─────────────────────────────────────────────────────────────────

function ScoreRing({ score }: { score: number }) {
  const r    = 28;
  const circ = 2 * Math.PI * r;
  const fill = (score / 100) * circ;
  const color =
    score >= 75 ? '#22c55e' :
    score >= 50 ? '#f59e0b' :
    '#ef4444';

  return (
    <div className="relative w-16 h-16 shrink-0">
      <svg width="64" height="64" viewBox="0 0 64 64" className="-rotate-90">
        <circle cx="32" cy="32" r={r} fill="none" stroke="currentColor"
          strokeWidth="5" className="text-muted/30" />
        <circle cx="32" cy="32" r={r} fill="none" stroke={color}
          strokeWidth="5" strokeLinecap="round"
          strokeDasharray={`${fill} ${circ}`}
          style={{ transition: 'stroke-dasharray 1s ease' }} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-black tabular-nums" style={{ color }}>{score}</span>
      </div>
    </div>
  );
}

// ── Section 1: Accomplishments ─────────────────────────────────────────────────

function AccomplishmentSection({ data }: { data: WeekAccomplishment }) {
  return (
    <div className="space-y-4">
      {/* Hero */}
      <div className="flex items-center gap-4 p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/15">
        <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
          <Trophy className="w-6 h-6 text-emerald-400" />
        </div>
        <div>
          <div className="text-3xl font-black text-emerald-400 tabular-nums">
            {data.tasksCompleted}
          </div>
          <div className="text-xs text-muted-foreground">مهمة مكتملة هذا الأسبوع</div>
        </div>
        <div className="flex-1" />
        <div className="text-end">
          <div className="text-lg font-black text-blue-400">{data.habitCompletionRate}%</div>
          <div className="text-[10px] text-muted-foreground">معدل العادات</div>
        </div>
      </div>

      {/* Highlights */}
      {data.highlights.length > 0 && (
        <div className="space-y-1.5">
          {data.highlights.map((h, i) => (
            <div key={i} className="flex items-center gap-2 text-xs">
              <Star className="w-3 h-3 text-amber-400 shrink-0" />
              <span className="text-foreground/80">{h}</span>
            </div>
          ))}
        </div>
      )}

      {/* By project */}
      {data.byProject.length > 0 && (
        <div className="space-y-2">
          <div className="text-[10px] font-black text-muted-foreground/50 uppercase tracking-widest">
            الإنجاز بالمشروع
          </div>
          {data.byProject.map(pw => (
            <div key={pw.projectId} className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-muted/20 border border-border/20">
              <Folder className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0" />
              <span className="flex-1 text-xs truncate">{pw.projectTitle}</span>
              <span className="text-xs font-black text-emerald-500">{pw.count}</span>
            </div>
          ))}
        </div>
      )}

      {/* Habits kept every day */}
      {data.habitsKeptEveryDay.length > 0 && (
        <div className="space-y-2">
          <div className="text-[10px] font-black text-muted-foreground/50 uppercase tracking-widest">
            عادات يومية مثالية
          </div>
          <div className="flex flex-wrap gap-2">
            {data.habitsKeptEveryDay.map(name => (
              <div key={name} className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-500 bg-emerald-500/8 border border-emerald-500/15 rounded-full px-2.5 py-1">
                <Flame className="w-2.5 h-2.5" />
                {name}
              </div>
            ))}
          </div>
        </div>
      )}

      {data.tasksCompleted === 0 && (
        <div className="flex flex-col items-center gap-2 py-6">
          <TrendingDown className="w-8 h-8 text-muted-foreground/30" />
          <p className="text-xs text-muted-foreground/50 text-center">
            لا إنجازات مسجلة هذا الأسبوع — الأسبوع القادم فرصة جديدة
          </p>
        </div>
      )}
    </div>
  );
}

// ── Section 2: Delays ─────────────────────────────────────────────────────────

function DelayRow({ task, isOverdue }: { task: { id: string; title: string; due_date: string | null; priority: string; daysLate: number }; isOverdue: boolean }) {
  return (
    <div className={cn(
      'flex items-center gap-2.5 px-3 py-2.5 rounded-xl border',
      isOverdue
        ? 'bg-red-500/5 border-red-500/20'
        : 'bg-amber-400/5 border-amber-400/15',
    )}>
      <div className={cn('w-2 h-2 rounded-full shrink-0', PRIORITY_DOT[task.priority] ?? 'bg-slate-400')} />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium truncate">{task.title}</p>
        {task.due_date && (
          <p className="text-[10px] text-muted-foreground/60 mt-0.5">
            استحق {format(parseISO(task.due_date), 'd MMMM', { locale: ar })}
          </p>
        )}
      </div>
      {isOverdue && task.daysLate > 0 && (
        <div className="text-[9px] font-black text-red-500 bg-red-500/10 border border-red-500/20 rounded-full px-2 py-0.5 shrink-0">
          +{task.daysLate}د
        </div>
      )}
      <span className="text-[9px] text-muted-foreground/40 shrink-0">
        {PRIORITY_LABEL[task.priority] ?? task.priority}
      </span>
    </div>
  );
}

function DelaysSection({ data }: { data: WeekDelays }) {
  const total = data.overdueTasks.length + data.slippedTasks.length;

  if (total === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-10">
        <CheckCircle2 className="w-10 h-10 text-emerald-500/50" />
        <p className="text-sm font-bold text-emerald-500">لا تأخيرات هذا الأسبوع</p>
        <p className="text-xs text-muted-foreground/50">التزمت بجميع مواعيدك</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-red-500/5 border border-red-500/15 p-3 text-center">
          <div className="text-xl font-black text-red-500">{data.overdueTasks.length}</div>
          <div className="text-[10px] text-muted-foreground">متأخرة</div>
        </div>
        <div className="rounded-xl bg-amber-400/5 border border-amber-400/15 p-3 text-center">
          <div className="text-xl font-black text-amber-500">{data.slippedTasks.length}</div>
          <div className="text-[10px] text-muted-foreground">انزلقت هذا الأسبوع</div>
        </div>
      </div>

      {data.overdueTasks.length > 0 && (
        <div className="space-y-1.5">
          <div className="text-[10px] font-black text-red-500 uppercase tracking-widest flex items-center gap-1.5">
            <AlertTriangle className="w-3 h-3" />متأخرة
          </div>
          {data.overdueTasks.map(t => <DelayRow key={t.id} task={t} isOverdue />)}
        </div>
      )}

      {data.slippedTasks.length > 0 && (
        <div className="space-y-1.5">
          <div className="text-[10px] font-black text-amber-500 uppercase tracking-widest">
            انزلقت من هذا الأسبوع
          </div>
          {data.slippedTasks.map(t => <DelayRow key={t.id} task={t} isOverdue={false} />)}
        </div>
      )}
    </div>
  );
}

// ── Section 3: Stalled project ─────────────────────────────────────────────────

function StalledSection({ data }: { data: StalledProject | null }) {
  if (!data) {
    return (
      <div className="flex flex-col items-center gap-3 py-10">
        <TrendingUp className="w-10 h-10 text-emerald-500/50" />
        <p className="text-sm font-bold text-emerald-500">جميع مشاريعك نشطة</p>
        <p className="text-xs text-muted-foreground/50">لا مشاريع متعثرة هذا الأسبوع</p>
      </div>
    );
  }

  const { project, pendingTaskCount, daysSinceActivity, lastActivityDate } = data;

  return (
    <div className="space-y-4">
      {/* Hero card */}
      <div className="p-4 rounded-2xl border border-amber-400/25 bg-amber-400/5 space-y-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center shrink-0">
            <AlertOctagon className="w-5 h-5 text-amber-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-black text-foreground leading-tight">{project.title}</h3>
            {project.description && (
              <p className="text-[10px] text-muted-foreground/60 mt-0.5 line-clamp-2">
                {project.description}
              </p>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-lg bg-muted/30 p-2">
            <div className="text-lg font-black text-amber-400">{daysSinceActivity}</div>
            <div className="text-[9px] text-muted-foreground">يوم بلا نشاط</div>
          </div>
          <div className="rounded-lg bg-muted/30 p-2">
            <div className="text-lg font-black text-foreground">{pendingTaskCount}</div>
            <div className="text-[9px] text-muted-foreground">مهمة معلقة</div>
          </div>
          <div className="rounded-lg bg-muted/30 p-2">
            <div className="text-lg font-black text-foreground">
              {project.progress ?? 0}%
            </div>
            <div className="text-[9px] text-muted-foreground">تقدم</div>
          </div>
        </div>

        {lastActivityDate && (
          <p className="text-[10px] text-muted-foreground/50 text-center">
            آخر نشاط: {format(parseISO(lastActivityDate), 'd MMMM yyyy', { locale: ar })}
          </p>
        )}
      </div>

      {/* Progress bar */}
      {project.progress !== null && (
        <div className="space-y-1.5">
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>تقدم المشروع</span>
            <span className="font-bold">{project.progress ?? 0}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-amber-400 transition-all duration-700"
              style={{ width: `${project.progress ?? 0}%` }}
            />
          </div>
        </div>
      )}

      {/* Action suggestion */}
      <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-muted/20 border border-border/30 text-xs">
        <ArrowRight className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
        <span className="text-muted-foreground">
          خصص ساعة للمشروع في بداية الأسبوع القادم لكسر حالة التوقف
        </span>
      </div>
    </div>
  );
}

// ── Section 4: Goal intervention ──────────────────────────────────────────────

const PERSPECTIVE_LABEL: Record<string, string> = {
  financial: 'مالي', customer: 'عملاء',
  processes: 'عمليات', learning: 'تعلم',
};

function InterventionSection({ data }: { data: GoalIntervention | null }) {
  const updateGoal = useUpdateGoal();
  const [localValue, setLocalValue] = useState<number | null>(null);
  const currentValue = localValue ?? (data?.goal.current_value ?? 0);

  const handleUpdateProgress = async (delta: number) => {
    if (!data) return;
    const newValue = Math.max(0, currentValue + delta);
    setLocalValue(newValue);
    try {
      await updateGoal.mutateAsync({ id: data.goal.id, current_value: newValue });
      toast.success('تم تحديث التقدم');
    } catch { toast.error('حدث خطأ'); }
  };

  if (!data) {
    return (
      <div className="flex flex-col items-center gap-3 py-10">
        <Target className="w-10 h-10 text-emerald-500/50" />
        <p className="text-sm font-bold text-emerald-500">أهدافك على المسار الصحيح</p>
        <p className="text-xs text-muted-foreground/50">لا أهداف تحتاج تدخلاً عاجلاً</p>
      </div>
    );
  }

  const { goal, progressPercent, daysUntilEnd, urgency, reason } = data;
  const isCritical = urgency === 'critical';

  return (
    <div className="space-y-4">
      {/* Goal card */}
      <div className={cn(
        'p-4 rounded-2xl border space-y-3',
        isCritical
          ? 'border-red-500/25 bg-red-500/5'
          : 'border-amber-400/25 bg-amber-400/5',
      )}>
        <div className="flex items-start gap-3">
          <div className={cn(
            'w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border',
            isCritical
              ? 'bg-red-500/10 border-red-500/20'
              : 'bg-amber-400/10 border-amber-400/20',
          )}>
            <Target className={cn('w-5 h-5', isCritical ? 'text-red-400' : 'text-amber-400')} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black text-foreground leading-tight flex-1 truncate">
                {goal.title}
              </h3>
              {goal.perspective && (
                <span className="text-[9px] font-bold text-muted-foreground/50 bg-muted/40 rounded-full px-2 py-0.5 shrink-0">
                  {PERSPECTIVE_LABEL[goal.perspective] ?? goal.perspective}
                </span>
              )}
            </div>
            <p className={cn('text-[11px] mt-1', isCritical ? 'text-red-400' : 'text-amber-500')}>
              {reason}
            </p>
          </div>
        </div>

        {/* Progress ring + stats */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-lg bg-muted/30 p-2">
            <div className={cn('text-xl font-black tabular-nums', isCritical ? 'text-red-400' : 'text-amber-400')}>
              {progressPercent}%
            </div>
            <div className="text-[9px] text-muted-foreground">التقدم</div>
          </div>
          <div className="rounded-lg bg-muted/30 p-2">
            <div className="text-xl font-black">{goal.current_value ?? 0}</div>
            <div className="text-[9px] text-muted-foreground">الحالي</div>
          </div>
          <div className="rounded-lg bg-muted/30 p-2">
            <div className="text-xl font-black">{goal.target_value ?? '?'}</div>
            <div className="text-[9px] text-muted-foreground">الهدف</div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all duration-700',
              isCritical ? 'bg-red-500' : 'bg-amber-400',
            )}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {daysUntilEnd !== null && (
          <p className="text-[10px] text-center text-muted-foreground/50">
            {daysUntilEnd < 0
              ? `تجاوزت المهلة بـ ${Math.abs(daysUntilEnd)} يوم`
              : `يتبقى ${daysUntilEnd} يوم حتى الموعد`}
          </p>
        )}
      </div>

      {/* Quick progress update */}
      <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-muted/20 border border-border/30">
        <span className="text-xs text-muted-foreground flex-1">تحديث التقدم:</span>
        <button
          onClick={() => handleUpdateProgress(-1)}
          disabled={updateGoal.isPending || currentValue <= 0}
          className="w-7 h-7 rounded-lg bg-muted border border-border hover:bg-muted/80 flex items-center justify-center disabled:opacity-40"
        >
          <Minus className="w-3 h-3 text-muted-foreground" />
        </button>
        <span className="text-sm font-black tabular-nums w-10 text-center">
          {updateGoal.isPending ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : currentValue}
        </span>
        <button
          onClick={() => handleUpdateProgress(1)}
          disabled={updateGoal.isPending}
          className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 hover:bg-primary/20 flex items-center justify-center disabled:opacity-40"
        >
          <Plus className="w-3 h-3 text-primary" />
        </button>
        <span className="text-[10px] text-muted-foreground">/ {data.goal.target_value ?? '?'}</span>
      </div>

      {/* Action hint */}
      <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-muted/20 border border-border/30 text-xs">
        <ArrowRight className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
        <span className="text-muted-foreground">
          {isCritical
            ? 'راجع هذا الهدف فوراً — قد تحتاج لتعديل الموعد أو إعادة تأطير الهدف'
            : 'خصص وقتاً في الأسبوع القادم للتقدم في هذا الهدف قبل تأخره أكثر'}
        </span>
      </div>
    </div>
  );
}

// ── Section 5: Next week plan ─────────────────────────────────────────────────

function NextWeekSection({ data }: { data: NextWeekPlan }) {
  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-xl bg-blue-400/5 border border-blue-400/15 p-3">
          <div className="text-xl font-black text-blue-400">{data.weeklyTarget}</div>
          <div className="text-[9px] text-muted-foreground">هدف الأسبوع</div>
        </div>
        <div className="rounded-xl bg-muted/20 border border-border/20 p-3">
          <div className="text-xl font-black">{data.pendingTotal}</div>
          <div className="text-[9px] text-muted-foreground">مهمة معلقة</div>
        </div>
        <div className="rounded-xl bg-muted/20 border border-border/20 p-3">
          <div className="text-xl font-black">{data.topTasks.length}</div>
          <div className="text-[9px] text-muted-foreground">أولويات</div>
        </div>
      </div>

      {/* Focus project */}
      {data.focusProject && (
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-blue-400/5 border border-blue-400/15">
          <Folder className="w-4 h-4 text-blue-400 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-black text-foreground/90 truncate">
              {data.focusProject.title}
            </p>
            <p className="text-[10px] text-muted-foreground">مشروع التركيز الأسبوع القادم</p>
          </div>
          <BarChart3 className="w-3.5 h-3.5 text-blue-400/50 shrink-0" />
        </div>
      )}

      {/* Top tasks */}
      <div className="space-y-1.5">
        <div className="text-[10px] font-black text-muted-foreground/50 uppercase tracking-widest">
          أولويات الأسبوع القادم
        </div>
        {data.topTasks.length === 0 ? (
          <p className="text-xs text-muted-foreground/50 text-center py-4">
            لا مهام معلقة — أسبوع نظيف!
          </p>
        ) : (
          data.topTasks.map((t, i) => (
            <div key={t.id} className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-muted/20 border border-border/20">
              <span className="text-[10px] font-black text-muted-foreground/40 w-4 shrink-0">
                {i + 1}
              </span>
              <div className={cn('w-2 h-2 rounded-full shrink-0', PRIORITY_DOT[t.priority] ?? 'bg-slate-400')} />
              <span className="flex-1 text-xs truncate">{t.title}</span>
              {t.due_date && (
                <span className="text-[9px] text-muted-foreground/50 shrink-0">
                  {format(parseISO(t.due_date), 'd/M', { locale: ar })}
                </span>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  open:    boolean;
  onClose: () => void;
}

// ── Main component ────────────────────────────────────────────────────────────

export function WeeklyReviewEngine({ open, onClose }: Props) {
  const {
    weekRange, weekScore, isLoading,
    accomplishment, delays, stalledProject, goalIntervention, nextWeekPlan,
    markDone,
  } = useWeeklyReview();

  const [activeTab, setActiveTab] = useState<ReviewTab>('accomplishments');

  const currentIdx = TABS.findIndex(t => t.id === activeTab);

  const goNext = () => {
    if (currentIdx < TABS.length - 1) {
      setActiveTab(TABS[currentIdx + 1].id);
    } else {
      markDone();
      onClose();
    }
  };

  const goPrev = () => {
    if (currentIdx > 0) setActiveTab(TABS[currentIdx - 1].id);
  };

  const isLast = currentIdx === TABS.length - 1;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative w-full sm:max-w-lg flex flex-col rounded-t-3xl sm:rounded-3xl overflow-hidden border border-border/40 shadow-2xl bg-background max-h-[92vh]">

        {/* ── Header ── */}
        <div className="shrink-0 px-5 pt-5 pb-3 border-b border-border/30">
          <div className="flex items-center gap-3 mb-3">
            {/* Score */}
            <ScoreRing score={weekScore} />

            <div className="flex-1 min-w-0">
              <h2 className="text-sm font-black text-foreground">مراجعة الأسبوع</h2>
              <p className="text-[10px] text-muted-foreground mt-0.5">{weekRange}</p>
              <div className={cn(
                'text-[10px] font-bold mt-1',
                weekScore >= 75 ? 'text-emerald-500' :
                weekScore >= 50 ? 'text-amber-500'   :
                'text-red-500',
              )}>
                {weekScore >= 75 ? 'أسبوع ممتاز'  :
                 weekScore >= 50 ? 'أسبوع جيد'    :
                 weekScore >= 25 ? 'يحتاج تحسين' :
                 'أسبوع صعب'}
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-muted/40 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Tab bar */}
          <div className="flex gap-1 overflow-x-auto scrollbar-none">
            {TABS.map(tab => {
              const active = tab.id === activeTab;
              const Icon   = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all shrink-0',
                    active
                      ? 'bg-muted text-foreground'
                      : 'text-muted-foreground/50 hover:text-muted-foreground',
                  )}
                >
                  <Icon className={cn('w-3 h-3', active ? tab.color : '')} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Content ── */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4">
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-24 rounded-2xl" />
              <Skeleton className="h-16 rounded-xl" />
              <Skeleton className="h-16 rounded-xl" />
              <Skeleton className="h-16 rounded-xl" />
            </div>
          ) : (
            <>
              {activeTab === 'accomplishments' && (
                <AccomplishmentSection data={accomplishment} />
              )}
              {activeTab === 'delays' && (
                <DelaysSection data={delays} />
              )}
              {activeTab === 'stalled' && (
                <StalledSection data={stalledProject} />
              )}
              {activeTab === 'intervention' && (
                <InterventionSection data={goalIntervention} />
              )}
              {activeTab === 'next-week' && (
                <NextWeekSection data={nextWeekPlan} />
              )}
            </>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="shrink-0 px-5 pb-5 pt-3 border-t border-border/30 flex gap-2">
          {/* Back */}
          {currentIdx > 0 && (
            <button
              onClick={goPrev}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl border border-border/40 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              السابق
            </button>
          )}

          {/* Next / Close */}
          <button
            onClick={goNext}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-2xl text-sm font-black transition-all',
              isLast
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:opacity-90'
                : 'bg-primary text-primary-foreground hover:opacity-90',
            )}
          >
            {isLast ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                إغلاق المراجعة
              </>
            ) : (
              <>
                التالي
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
