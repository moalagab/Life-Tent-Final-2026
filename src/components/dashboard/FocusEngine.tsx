/**
 * FocusEngine — "شيء واحد فقط مهم الآن"
 *
 * The home page decision engine. Surfaces THE single highest-priority task
 * at this moment based on adaptive scoring + behavioral context + time of day.
 *
 * Actions:
 *   ▶ Start  → mark task in_progress + navigate to tasks
 *   ⏰ Snooze → hide for 1 hour
 *   ⏭ Skip   → remove from today's queue
 */
import { useNavigate } from 'react-router-dom';
import { useDecisionEngine, CONTEXT_MODE_LABELS, ContextMode } from '@/hooks/useDecisionEngine';
import { useUpdateTask } from '@/hooks/useTasks';
import { useLanguage } from '@/hooks/useLanguage';
import {
  Play, Clock, SkipForward, Sun, Sunset, Zap, Moon,
  CheckCircle2, Flame, RotateCcw, ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { ScoredTask } from '@/hooks/useAdaptivePriority';

// ── Mode configuration ─────────────────────────────────────────────────────────

const MODE_CFG: Record<ContextMode, {
  icon:     typeof Sun;
  gradient: string;
  accent:   string;
  border:   string;
  glow:     string;
}> = {
  'deep-work': {
    icon:     Sun,
    gradient: 'from-blue-600/15 via-indigo-500/8 to-transparent',
    accent:   'text-blue-400',
    border:   'border-blue-500/25',
    glow:     'shadow-blue-500/10',
  },
  'review': {
    icon:     Sunset,
    gradient: 'from-amber-500/15 via-orange-500/8 to-transparent',
    accent:   'text-amber-400',
    border:   'border-amber-500/25',
    glow:     'shadow-amber-500/10',
  },
  'execution': {
    icon:     Zap,
    gradient: 'from-green-600/15 via-emerald-500/8 to-transparent',
    accent:   'text-green-400',
    border:   'border-green-500/25',
    glow:     'shadow-green-500/10',
  },
  'wind-down': {
    icon:     Moon,
    gradient: 'from-violet-600/15 via-purple-500/8 to-transparent',
    accent:   'text-violet-400',
    border:   'border-violet-500/25',
    glow:     'shadow-violet-500/10',
  },
};

// ── Score badge ────────────────────────────────────────────────────────────────

function ScorePill({ score, isAr }: { score: number; isAr: boolean }) {
  const urgent     = score >= 70;
  const important  = score >= 45;
  return (
    <span className={cn(
      'inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border',
      urgent    ? 'bg-destructive/12 border-destructive/30 text-destructive'    :
      important ? 'bg-amber-500/12 border-amber-500/30 text-amber-500' :
                  'bg-primary/12 border-primary/30 text-primary',
    )}>
      <span className={cn('w-1.5 h-1.5 rounded-full', urgent ? 'bg-destructive' : important ? 'bg-amber-500' : 'bg-primary')} />
      {urgent ? (isAr ? 'عاجل' : 'Urgent') : important ? (isAr ? 'مهم' : 'Important') : (isAr ? 'عادي' : 'Normal')}
      <span className="opacity-60 ms-0.5">· {score}</span>
    </span>
  );
}

// ── Energy badge ───────────────────────────────────────────────────────────────

function EnergyPill({ energy, isAr }: { energy: number; isAr: boolean }) {
  const label = energy <= 2 ? (isAr ? 'طاقة منخفضة' : 'Low energy')
              : energy === 3 ? (isAr ? 'طاقة متوسطة' : 'Medium energy')
              : (isAr ? 'طاقة عالية' : 'High energy');
  const cls   = energy <= 2 ? 'text-destructive bg-destructive/10'
              : energy === 3 ? 'text-amber-500 bg-amber-500/10'
              : 'text-green-500 bg-green-500/10';
  return (
    <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full', cls)}>
      {label}
    </span>
  );
}

// ── Queue mini-row ─────────────────────────────────────────────────────────────

function QueueRow({ task, isAr }: { task: ScoredTask; isAr: boolean }) {
  return (
    <div className="flex items-center gap-2.5 py-2">
      <div className="w-1.5 h-1.5 rounded-full bg-border shrink-0" />
      <span className="text-sm text-muted-foreground truncate flex-1">{task.title}</span>
      <div className="flex items-center gap-1.5 shrink-0">
        {task.estimatedMinutes && (
          <span className="text-[10px] text-muted-foreground/70 flex items-center gap-0.5">
            <Clock className="w-2.5 h-2.5" />
            {task.estimatedMinutes}{isAr ? 'د' : 'm'}
          </span>
        )}
        <span className={cn(
          'text-[9px] font-bold px-1.5 py-0.5 rounded-full',
          task.adaptiveScore >= 65 ? 'bg-destructive/10 text-destructive' :
          task.adaptiveScore >= 40 ? 'bg-amber-500/10 text-amber-500' :
          'bg-muted text-muted-foreground',
        )}>
          {task.adaptiveScore}
        </span>
      </div>
    </div>
  );
}

// ── Skeleton ───────────────────────────────────────────────────────────────────

function FocusEngineSkeleton() {
  return (
    <div className="glass-card overflow-hidden animate-pulse">
      <div className="h-10 bg-muted/30 border-b border-border/40" />
      <div className="p-5 space-y-4">
        <Skeleton className="h-3 w-40 rounded-full" />
        <Skeleton className="h-2 w-full rounded-full" />
        <Skeleton className="h-8 w-4/5 rounded-xl" />
        <Skeleton className="h-6 w-3/5 rounded-xl" />
        <div className="flex gap-2 pt-1">
          <Skeleton className="h-10 flex-1 rounded-xl" />
          <Skeleton className="h-10 w-10 rounded-xl" />
          <Skeleton className="h-10 w-10 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

// ── Empty state — all done ─────────────────────────────────────────────────────

function FocusEngineEmpty({
  completedToday, skippedToday, onReset, isAr,
}: {
  completedToday: number;
  skippedToday: number;
  onReset: () => void;
  isAr: boolean;
}) {
  const navigate = useNavigate();
  return (
    <div className="glass-card p-6 flex flex-col items-center justify-center gap-4 text-center min-h-[160px]">
      <div className="w-14 h-14 rounded-2xl bg-success/10 flex items-center justify-center">
        <CheckCircle2 className="w-7 h-7 text-success" />
      </div>
      <div>
        <p className="font-bold text-foreground text-lg">
          {isAr ? 'ممتاز! لا توجد مهام معلّقة' : 'All clear! No pending tasks'}
        </p>
        {completedToday > 0 && (
          <p className="text-sm text-muted-foreground mt-1">
            {isAr ? `أتممت ${completedToday} مهام اليوم` : `${completedToday} tasks completed today`}
          </p>
        )}
      </div>
      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={() => navigate('/tasks')}>
          {isAr ? 'إضافة مهمة' : 'Add task'}
        </Button>
        {skippedToday > 0 && (
          <Button size="sm" variant="ghost" onClick={onReset} className="gap-1.5 text-muted-foreground">
            <RotateCcw className="w-3.5 h-3.5" />
            {isAr ? `استعادة ${skippedToday} مُتخطّاة` : `Restore ${skippedToday} skipped`}
          </Button>
        )}
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export function FocusEngine() {
  const { currentLanguage } = useLanguage();
  const isAr = currentLanguage === 'ar';
  const navigate = useNavigate();

  const {
    focusTask, queue, mode, energy,
    completedToday, skippedToday, totalPending,
    isLoading, skip, snooze, reset,
  } = useDecisionEngine();

  const updateTask = useUpdateTask();
  const cfg        = MODE_CFG[mode];
  const ModeIcon   = cfg.icon;

  const handleStart = async () => {
    if (!focusTask) return;
    try {
      await updateTask.mutateAsync({ id: focusTask.id, status: 'in_progress' });
    } catch { /* task might already be in_progress */ }
    navigate('/tasks');
  };

  const handleSkip = () => {
    if (!focusTask) return;
    skip(focusTask.id);
    toast(isAr ? 'تم تخطّي المهمة' : 'Task skipped', {
      description: isAr ? 'ستظهر مجدداً غداً' : 'It will reappear tomorrow',
    });
  };

  const handleSnooze = () => {
    if (!focusTask) return;
    snooze(focusTask.id, 1);
    toast(isAr ? 'تم تأجيل المهمة ساعة' : 'Snoozed for 1 hour');
  };

  if (isLoading) return <FocusEngineSkeleton />;

  if (!focusTask) {
    return (
      <FocusEngineEmpty
        completedToday={completedToday}
        skippedToday={skippedToday}
        onReset={reset}
        isAr={isAr}
      />
    );
  }

  return (
    <div className={cn(
      'glass-card overflow-hidden shadow-lg',
      cfg.glow,
      cfg.border,
    )}>

      {/* ── Context bar ──────────────────────────────────────────────────────── */}
      <div className={cn(
        'flex items-center justify-between px-4 py-2.5 border-b border-border/50',
        'bg-gradient-to-r', cfg.gradient,
      )}>
        <div className="flex items-center gap-2">
          <ModeIcon className={cn('w-3.5 h-3.5', cfg.accent)} strokeWidth={2} />
          <span className={cn('text-[11px] font-bold tracking-wide', cfg.accent)}>
            {isAr ? CONTEXT_MODE_LABELS[mode].ar : CONTEXT_MODE_LABELS[mode].en}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <EnergyPill energy={energy} isAr={isAr} />
          {completedToday > 0 && (
            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
              <CheckCircle2 className="w-2.5 h-2.5 text-success" />
              {completedToday}
            </span>
          )}
          <span className="text-[10px] text-muted-foreground/60">
            {totalPending} {isAr ? 'معلّقة' : 'pending'}
          </span>
        </div>
      </div>

      {/* ── Main: the ONE thing ───────────────────────────────────────────────── */}
      <div className="p-5 space-y-3.5">

        {/* Super-label */}
        <p className={cn('text-[10px] font-black uppercase tracking-[0.15em]', cfg.accent)}>
          {isAr ? 'شيء واحد فقط مهم الآن' : 'The one thing that matters now'}
        </p>

        {/* Score bar + badge */}
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <Progress
              value={focusTask.adaptiveScore}
              className={cn(
                'h-1',
                focusTask.adaptiveScore >= 70 ? '[&>div]:bg-destructive' :
                focusTask.adaptiveScore >= 45 ? '[&>div]:bg-amber-500' :
                '[&>div]:bg-primary',
              )}
            />
          </div>
          <ScorePill score={focusTask.adaptiveScore} isAr={isAr} />
        </div>

        {/* Task title — HERO text */}
        <h2 className="text-xl sm:text-2xl font-extrabold text-foreground leading-snug tracking-tight">
          {focusTask.title}
        </h2>

        {/* Reason chips + estimated time */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {focusTask.reasons.slice(0, 3).map((r, i) => (
            <span
              key={i}
              className="text-[11px] px-2.5 py-1 rounded-full bg-muted/60 border border-border/50 text-muted-foreground"
            >
              {r}
            </span>
          ))}
          {focusTask.estimatedMinutes && (
            <span className="text-[11px] px-2.5 py-1 rounded-full bg-muted/60 border border-border/50 text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" />
              ~{focusTask.estimatedMinutes}{isAr ? 'د' : ' min'}
            </span>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 pt-1">
          <Button
            onClick={handleStart}
            disabled={updateTask.isPending}
            className="flex-1 h-11 text-sm font-bold gap-2"
          >
            <Play className="w-4 h-4 fill-current" />
            {isAr ? 'ابدأ الآن' : 'Start Now'}
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-11 w-11 rounded-xl"
            onClick={handleSnooze}
            title={isAr ? 'تأجيل ساعة' : 'Snooze 1hr'}
          >
            <Clock className="w-4 h-4 text-muted-foreground" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-11 w-11 rounded-xl"
            onClick={handleSkip}
            title={isAr ? 'تخطّي لليوم' : 'Skip for today'}
          >
            <SkipForward className="w-4 h-4 text-muted-foreground" />
          </Button>
        </div>
      </div>

      {/* ── Coming-up queue ───────────────────────────────────────────────────── */}
      {queue.length > 0 && (
        <div className="border-t border-border/40 px-4 pb-2 bg-muted/20">
          <div className="flex items-center justify-between py-2">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              {isAr ? 'التالي في القائمة' : 'Up next'}
            </span>
            <button
              onClick={() => navigate('/tasks')}
              className="flex items-center gap-0.5 text-[10px] text-muted-foreground hover:text-primary transition-colors"
            >
              {isAr ? 'كل المهام' : 'All tasks'}
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="divide-y divide-border/30">
            {queue.map(t => (
              <QueueRow key={t.id} task={t} isAr={isAr} />
            ))}
          </div>
        </div>
      )}

      {/* ── Reset skips banner (when some tasks are hidden) ───────────────────── */}
      {skippedToday > 0 && (
        <button
          onClick={reset}
          className="w-full py-2 text-[10px] text-muted-foreground/60 hover:text-muted-foreground flex items-center justify-center gap-1.5 border-t border-border/30 transition-colors bg-muted/10 hover:bg-muted/20"
        >
          <RotateCcw className="w-2.5 h-2.5" />
          {isAr
            ? `${skippedToday} مهام مُتخطّاة — اضغط لاستعادتها`
            : `${skippedToday} skipped · tap to restore`}
        </button>
      )}
    </div>
  );
}
