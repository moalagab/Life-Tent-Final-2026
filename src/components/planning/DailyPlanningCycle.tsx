/**
 * DailyPlanningCycle — Morning ritual wizard (4 steps).
 *
 * Step 1: مراجعة أمس   — Yesterday's stats (done / missed / habits)
 * Step 2: خطة اليوم   — Time-blocked day plan (TaskAgent output)
 * Step 3: اختيار التركيز — Confirm or swap the auto-selected focus task
 * Step 4: تأجيل الثانوي — Accept / reject deferral suggestions
 *
 * On completion: applies accepted deferrals via skipMany (→ window event →
 * all useDecisionEngine instances re-sync), then marks planning as done.
 */
import { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  Sun, Calendar, Target, XCircle,
  ChevronRight, CheckCircle2, Circle,
  Flame, Clock, Zap, X, ArrowRight,
  TrendingUp, TrendingDown, Minus,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useDailyPlanningCycle } from '@/hooks/useDailyPlanningCycle';
import type { ScoredTask } from '@/hooks/useAdaptivePriority';
import type { TimeBlock } from '@/hooks/useTaskAgent';

// ── Step meta ─────────────────────────────────────────────────────────────────

interface Step {
  id:    number;
  label: string;
  icon:  React.FC<any>;
  color: string;
}

const STEPS: Step[] = [
  { id: 0, label: 'المراجعة',  icon: TrendingUp, color: 'text-sky-400'     },
  { id: 1, label: 'الخطة',     icon: Calendar,   color: 'text-amber-400'   },
  { id: 2, label: 'التركيز',   icon: Target,     color: 'text-orange-400'  },
  { id: 3, label: 'التأجيل',   icon: XCircle,    color: 'text-violet-400'  },
];

const BLOCK_LABEL: Record<TimeBlock, { label: string; icon: React.FC<any>; color: string }> = {
  morning:   { label: 'الصباح',    icon: Sun,      color: 'text-amber-400'  },
  afternoon: { label: 'بعد الظهر', icon: ArrowRight, color: 'text-blue-400' },
  evening:   { label: 'المساء',    icon: Zap,      color: 'text-violet-400' },
};

const PRIORITY_COLOR: Record<string, string> = {
  urgent: 'bg-red-500',
  high:   'bg-orange-400',
  medium: 'bg-amber-400',
  low:    'bg-slate-400',
};

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  open:    boolean;
  onClose: () => void;
}

// ── Progress bar ──────────────────────────────────────────────────────────────

function StepDots({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-2 justify-center">
      {STEPS.map((s, i) => {
        const Icon = s.icon;
        const done = i < current;
        const active = i === current;
        return (
          <div key={s.id} className="flex items-center gap-2">
            <div className={cn(
              'w-7 h-7 rounded-full flex items-center justify-center transition-all',
              done   ? 'bg-emerald-500/20 border border-emerald-500/40' :
              active ? 'bg-amber-400/15 border border-amber-400/40' :
              'bg-muted/30 border border-border/30',
            )}>
              {done ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              ) : (
                <Icon className={cn('w-3.5 h-3.5', active ? s.color : 'text-muted-foreground/30')} />
              )}
            </div>
            {i < STEPS.length - 1 && (
              <div className={cn('w-6 h-px transition-all', done ? 'bg-emerald-500/40' : 'bg-border/30')} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Step 1: Yesterday Review ──────────────────────────────────────────────────

function ReviewStep({ yesterday }: { yesterday: ReturnType<typeof useDailyPlanningCycle>['yesterday'] }) {
  const { completedCount, missedCount, habitsCompleted, totalHabits, completionRate } = yesterday;

  const rateColor =
    completionRate >= 80 ? 'text-emerald-500' :
    completionRate >= 50 ? 'text-amber-500'   :
    'text-red-500';

  const rateIcon =
    completionRate >= 80 ? TrendingUp  :
    completionRate >= 50 ? Minus        :
    TrendingDown;

  const RateIcon = rateIcon;

  return (
    <div className="space-y-5">
      {/* Hero stat */}
      <div className="text-center py-4">
        <div className={cn('text-5xl font-black tabular-nums', rateColor)}>
          {completionRate}%
        </div>
        <div className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1">
          <RateIcon className={cn('w-3.5 h-3.5', rateColor)} />
          معدل إنجاز أمس
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'مهمة مكتملة',   value: completedCount,  color: 'text-emerald-500', bg: 'bg-emerald-500/8'  },
          { label: 'مهمة فائتة',    value: missedCount,     color: 'text-red-500',     bg: 'bg-red-500/8'      },
          { label: 'عادات مكتملة',  value: `${habitsCompleted}/${totalHabits}`, color: 'text-blue-400', bg: 'bg-blue-400/8' },
        ].map(s => (
          <div key={s.label} className={cn('rounded-2xl p-3 text-center border border-border/30', s.bg)}>
            <div className={cn('text-2xl font-black', s.color)}>{s.value}</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Completion bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>تقدم أمس</span>
          <span className={cn('font-bold', rateColor)}>{completionRate}%</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all duration-1000',
              completionRate >= 80 ? 'bg-emerald-500' :
              completionRate >= 50 ? 'bg-amber-400'   :
              'bg-red-500',
            )}
            style={{ width: `${completionRate}%` }}
          />
        </div>
      </div>

      {completedCount === 0 && missedCount === 0 && (
        <p className="text-center text-xs text-muted-foreground/60 py-2">
          لا توجد بيانات من أمس — يوم جديد يبدأ الآن
        </p>
      )}
    </div>
  );
}

// ── Step 2: Day Plan ──────────────────────────────────────────────────────────

function PlanStep({ plan }: { plan: ReturnType<typeof useDailyPlanningCycle>['plan'] }) {
  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-400/5 border border-amber-400/15">
        <Sun className="w-4 h-4 text-amber-400 shrink-0" />
        <div className="text-xs">
          <span className="font-black text-foreground">{plan.totalTasks}</span>
          <span className="text-muted-foreground"> مهمة اليوم · </span>
          <span className="font-black text-emerald-500">{plan.completedToday}</span>
          <span className="text-muted-foreground"> مكتملة · </span>
          <span className="font-black text-blue-400">{plan.quickWins.length}</span>
          <span className="text-muted-foreground"> انتصارات سريعة</span>
        </div>
        {plan.overloaded && (
          <div className="ms-auto text-[10px] font-bold text-red-500 bg-red-500/10 border border-red-500/20 rounded-full px-2 py-0.5">
            يوم مثقل
          </div>
        )}
      </div>

      {/* Time blocks */}
      {(['morning', 'afternoon', 'evening'] as TimeBlock[]).map(block => {
        const tasks = plan[block];
        if (tasks.length === 0) return null;
        const cfg = BLOCK_LABEL[block];
        const Icon = cfg.icon;
        return (
          <div key={block} className="space-y-1.5">
            <div className={cn('flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider', cfg.color)}>
              <Icon className="w-3 h-3" />
              {cfg.label}
              <span className="font-normal text-muted-foreground/40">({tasks.length})</span>
            </div>
            <div className="space-y-1">
              {tasks.slice(0, 4).map(t => (
                <div key={t.id} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-muted/20 border border-border/20">
                  <div className={cn('w-1.5 h-1.5 rounded-full shrink-0', PRIORITY_COLOR[t.priority] ?? 'bg-slate-400')} />
                  <span className="flex-1 text-xs truncate">{t.title}</span>
                  {t.estimated_minutes && (
                    <span className="text-[9px] text-muted-foreground/50 shrink-0 flex items-center gap-0.5">
                      <Clock className="w-2.5 h-2.5" />
                      {t.estimated_minutes}د
                    </span>
                  )}
                </div>
              ))}
              {tasks.length > 4 && (
                <p className="text-[10px] text-muted-foreground/40 px-2">
                  + {tasks.length - 4} مهام أخرى
                </p>
              )}
            </div>
          </div>
        );
      })}

      {/* Quick wins */}
      {plan.quickWins.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          <span className="text-[10px] font-black text-emerald-500 flex items-center gap-1">
            <Zap className="w-3 h-3" />سريعة:
          </span>
          {plan.quickWins.slice(0, 4).map(t => (
            <span key={t.id} className="text-[10px] text-muted-foreground bg-muted/40 border border-border/30 rounded-lg px-2 py-0.5">
              {t.title}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Step 3: Focus Selection ───────────────────────────────────────────────────

function FocusStep({
  focusTask,
  alternatives,
  selectedId,
  onSelect,
}: {
  focusTask: ScoredTask | null;
  alternatives: ScoredTask[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const allOptions = focusTask
    ? [focusTask, ...alternatives.filter(t => t.id !== focusTask.id)]
    : alternatives;

  if (allOptions.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-8">
        <CheckCircle2 className="w-8 h-8 text-emerald-500/60" />
        <p className="text-sm text-muted-foreground text-center">
          لا توجد مهام معلقة — يوم نظيف
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        النظام اختار مهمتك الأولى بناءً على الأولوية والوقت الحالي.
        يمكنك التغيير:
      </p>

      <div className="space-y-2">
        {allOptions.slice(0, 4).map((t, i) => {
          const selected = (selectedId ?? focusTask?.id) === t.id;
          const isAuto   = i === 0 && t.id === focusTask?.id;
          return (
            <button
              key={t.id}
              onClick={() => onSelect(t.id)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-3 rounded-xl border transition-all text-start',
                selected
                  ? 'border-primary/40 bg-primary/5'
                  : 'border-border/30 bg-muted/20 hover:bg-muted/40',
              )}
            >
              {/* Radio */}
              <div className={cn(
                'w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors',
                selected ? 'border-primary' : 'border-muted-foreground/30',
              )}>
                {selected && <div className="w-2 h-2 rounded-full bg-primary" />}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold truncate">{t.title}</span>
                  {isAuto && (
                    <span className="text-[8px] font-black text-primary bg-primary/10 rounded-full px-1.5 py-0.5 shrink-0">
                      تلقائي
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <div className={cn('w-1.5 h-1.5 rounded-full shrink-0', PRIORITY_COLOR[t.priority] ?? 'bg-slate-400')} />
                  <span className="text-[10px] text-muted-foreground">{t.priority}</span>
                  <span className="text-[10px] text-muted-foreground/50">درجة {t.score}</span>
                </div>
              </div>

              {t.estimated_minutes && (
                <div className="text-[10px] text-muted-foreground shrink-0 flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5" />
                  {t.estimated_minutes}د
                </div>
              )}
            </button>
          );
        })}
      </div>

      {selectedId && selectedId !== focusTask?.id && (
        <div className="text-[10px] text-blue-500 font-medium px-1">
          ✓ غيّرت التركيز — سيبدأ يومك بـ "{allOptions.find(t => t.id === selectedId)?.title}"
        </div>
      )}
    </div>
  );
}

// ── Step 4: Deferral ──────────────────────────────────────────────────────────

function DeferStep({
  candidates,
  deferred,
  onToggle,
}: {
  candidates: ScoredTask[];
  deferred:   Set<string>;
  onToggle:   (id: string) => void;
}) {
  if (candidates.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-8">
        <Flame className="w-8 h-8 text-orange-400/60" />
        <p className="text-sm text-muted-foreground text-center">
          جميع مهامك مهمة — لا شيء مقترح للتأجيل
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        هذه المهام ذات أولوية أقل اليوم. اضغط على أي منها لتأجيلها لغداً:
      </p>

      <div className="space-y-2">
        {candidates.map(t => {
          const isDeferred = deferred.has(t.id);
          return (
            <button
              key={t.id}
              onClick={() => onToggle(t.id)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-3 rounded-xl border transition-all text-start group',
                isDeferred
                  ? 'border-red-500/25 bg-red-500/5 opacity-60'
                  : 'border-border/30 bg-muted/20 hover:border-red-500/20 hover:bg-red-500/5',
              )}
            >
              {/* Toggle icon */}
              <div className={cn(
                'w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors',
                isDeferred ? 'border-red-500 bg-red-500/10' : 'border-muted-foreground/30 group-hover:border-red-400/50',
              )}>
                {isDeferred
                  ? <X className="w-3 h-3 text-red-500" />
                  : <Circle className="w-2.5 h-2.5 text-muted-foreground/30" />}
              </div>

              <div className="flex-1 min-w-0">
                <p className={cn('text-sm font-medium truncate', isDeferred && 'line-through text-muted-foreground')}>
                  {t.title}
                </p>
                <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                  درجة {t.score} · {t.priority}
                </p>
              </div>

              <span className={cn(
                'text-[10px] font-bold shrink-0 transition-colors',
                isDeferred ? 'text-red-500' : 'text-muted-foreground/30 group-hover:text-red-400/60',
              )}>
                {isDeferred ? 'سيُؤجَّل' : 'تأجيل'}
              </span>
            </button>
          );
        })}
      </div>

      {deferred.size > 0 && (
        <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-400/5 border border-amber-400/15 text-xs text-amber-500">
          <Clock className="w-3.5 h-3.5 shrink-0" />
          سيتم إخفاء {deferred.size} مهمة من قائمة اليوم حتى الغد
        </div>
      )}
    </div>
  );
}

// ── Main wizard ───────────────────────────────────────────────────────────────

export function DailyPlanningCycle({ open, onClose }: Props) {
  const {
    yesterday, plan, planLoading,
    focusTask, focusAlternatives,
    skipMany, deferralCandidates,
    markDone, isLoading,
  } = useDailyPlanningCycle();

  const [step, setStep] = useState(0);
  const [selectedFocusId, setSelectedFocusId] = useState<string | null>(null);
  const [deferred,        setDeferred]         = useState<Set<string>>(new Set());

  const TOTAL = STEPS.length;
  const isLast = step === TOTAL - 1;

  const toggleDefer = (id: string) => {
    setDeferred(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleNext = () => {
    if (isLast) {
      handleComplete();
    } else {
      setStep(s => s + 1);
    }
  };

  const handleComplete = () => {
    // Apply deferrals
    if (deferred.size > 0) {
      const ids = Array.from(deferred);
      // Write directly and dispatch so all useDecisionEngine instances re-sync
      const SKIP_KEY = 'de:skipped-v2';
      try {
        const raw = localStorage.getItem(SKIP_KEY);
        const existing = raw ? JSON.parse(raw) : { date: '', ids: [] };
        const today = new Date().toDateString();
        const current: string[] = existing.date === today ? existing.ids : [];
        const newIds = [...new Set([...current, ...ids])];
        localStorage.setItem(SKIP_KEY, JSON.stringify({ date: today, ids: newIds }));
      } catch { /* ignore */ }
      window.dispatchEvent(new Event('de:skips-updated'));
      skipMany(ids);
    }

    const finalFocusId = selectedFocusId ?? focusTask?.id;
    markDone(finalFocusId);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative w-full sm:max-w-md flex flex-col rounded-t-3xl sm:rounded-3xl overflow-hidden border border-border/50 shadow-2xl bg-background max-h-[90vh]">

        {/* Sunrise gradient header */}
        <div className="relative shrink-0 px-5 pt-5 pb-4 bg-gradient-to-b from-amber-400/10 via-orange-400/5 to-transparent">
          {/* Close */}
          <button
            onClick={onClose}
            className="absolute top-4 end-4 w-7 h-7 rounded-xl bg-muted/40 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>

          {/* Title */}
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-9 h-9 rounded-xl bg-amber-400/15 border border-amber-400/25 flex items-center justify-center">
              <Sun className="w-4.5 h-4.5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-sm font-black text-foreground">تخطيط يومك</h2>
              <p className="text-[10px] text-muted-foreground/60">Daily Planning Cycle</p>
            </div>
          </div>

          {/* Step dots */}
          <StepDots current={step} />
        </div>

        {/* Step content */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4">
          {/* Step header */}
          <div className="flex items-center gap-2 mb-4">
            {(() => {
              const s = STEPS[step];
              const Icon = s.icon;
              return (
                <>
                  <Icon className={cn('w-4 h-4', s.color)} />
                  <h3 className="text-sm font-black">{s.label}</h3>
                </>
              );
            })()}
            <div className="flex-1" />
            <span className="text-[10px] text-muted-foreground/40 font-mono">
              {step + 1}/{TOTAL}
            </span>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-20 rounded-2xl" />
              <Skeleton className="h-12 rounded-xl" />
              <Skeleton className="h-12 rounded-xl" />
            </div>
          ) : (
            <>
              {step === 0 && <ReviewStep yesterday={yesterday} />}
              {step === 1 && <PlanStep plan={plan} />}
              {step === 2 && (
                <FocusStep
                  focusTask={focusTask}
                  alternatives={focusAlternatives}
                  selectedId={selectedFocusId}
                  onSelect={setSelectedFocusId}
                />
              )}
              {step === 3 && (
                <DeferStep
                  candidates={deferralCandidates}
                  deferred={deferred}
                  onToggle={toggleDefer}
                />
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 px-5 pb-5 pt-3 border-t border-border/30 space-y-2">
          {/* Next / Complete */}
          <button
            onClick={handleNext}
            className={cn(
              'w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-black transition-all',
              isLast
                ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-lg hover:opacity-90'
                : 'bg-primary text-primary-foreground hover:opacity-90',
            )}
          >
            {isLast ? (
              <>
                <Flame className="w-4 h-4" />
                ابدأ يومك
              </>
            ) : (
              <>
                التالي
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>

          {/* Skip */}
          {!isLast && (
            <button
              onClick={() => { markDone(focusTask?.id); onClose(); }}
              className="w-full text-center text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors py-1"
            >
              تخطي التخطيط لليوم
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
