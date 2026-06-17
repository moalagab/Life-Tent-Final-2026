/**
 * CommandCenter — Mission Control Overlay
 *
 * Generates the day plan, kills unnecessary options, forces focus,
 * and recalculates daily priorities.
 */
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import {
  X, RefreshCw, Zap, XCircle, Sun, Cloud, Moon,
  CheckCircle2, AlertTriangle, Clock, Target,
  ChevronRight, Crosshair, Flame, Plus, CheckSquare,
  FolderKanban, ListTodo, CalendarDays, Loader2,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useCommandCenter, CMD_KILL_THRESHOLD } from '@/hooks/useCommandCenter';
import { useCreateTask, useUpdateTask } from '@/hooks/useTasks';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import type { ScoredTask } from '@/hooks/useAdaptivePriority';
import type { TimeBlock } from '@/hooks/useTaskAgent';
import type { Prediction } from '@/hooks/usePredictiveEngine';

// ── Props ──────────────────────────────────────────────────────────────────────

interface Props {
  open:               boolean;
  onClose:            () => void;
  focusModeActive:    boolean;
  onToggleFocusMode:  () => void;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const BLOCK_CFG: Record<TimeBlock, { label: string; icon: React.FC<any>; color: string }> = {
  morning:   { label: 'الصباح',    icon: Sun,   color: 'text-amber-500'  },
  afternoon: { label: 'بعد الظهر', icon: Cloud, color: 'text-blue-500'   },
  evening:   { label: 'المساء',    icon: Moon,  color: 'text-violet-500' },
};

const PRIORITY_DOT: Record<string, string> = {
  urgent: 'bg-red-500',
  high:   'bg-orange-400',
  medium: 'bg-amber-400',
  low:    'bg-slate-400',
};

// ── Sub-components ─────────────────────────────────────────────────────────────

function PriorityDot({ priority }: { priority: string }) {
  return (
    <div className={cn(
      'w-1.5 h-1.5 rounded-full shrink-0',
      PRIORITY_DOT[priority] ?? 'bg-slate-400',
    )} />
  );
}

function TaskRow({
  task,
  killed,
  preview,
}: {
  task: ScoredTask;
  killed: boolean;
  preview: boolean;
}) {
  const isLow = task.score < CMD_KILL_THRESHOLD;
  const dim = killed || (preview && isLow);

  return (
    <div className={cn(
      'flex items-center gap-2 py-1.5 px-2 rounded-lg transition-all duration-300',
      dim ? 'opacity-30 line-through' : '',
      preview && isLow && !killed ? 'bg-red-500/8 border border-red-500/20' : '',
    )}>
      <PriorityDot priority={task.priority} />
      <span className="flex-1 text-xs text-foreground/90 truncate">{task.title}</span>
      <span className="text-[9px] font-bold tabular-nums text-muted-foreground/50 shrink-0">
        {task.score}
      </span>
    </div>
  );
}

function TimeBlockSection({
  block,
  tasks,
  killed,
  preview,
}: {
  block: TimeBlock;
  tasks: ScoredTask[];
  killed: boolean;
  preview: boolean;
}) {
  const cfg = BLOCK_CFG[block];
  const Icon = cfg.icon;
  if (tasks.length === 0) return null;

  return (
    <div className="space-y-1">
      <div className={cn('flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider', cfg.color)}>
        <Icon className="w-3 h-3" />
        {cfg.label}
        <span className="font-normal text-muted-foreground/40">({tasks.length})</span>
      </div>
      <div className="space-y-0.5">
        {tasks.map(t => (
          <TaskRow key={t.id} task={t} killed={killed} preview={preview} />
        ))}
      </div>
    </div>
  );
}

function PredictionAlert({ p }: { p: Prediction }) {
  const isCritical = p.severity === 'critical';
  return (
    <div className={cn(
      'flex items-start gap-2 px-2.5 py-2 rounded-lg border text-xs',
      isCritical
        ? 'bg-red-500/8 border-red-500/20 text-red-500'
        : 'bg-amber-400/8 border-amber-400/20 text-amber-500',
    )}>
      <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
      <div className="min-w-0">
        <div className="font-bold leading-tight truncate">{p.title}</div>
        <div className="text-[10px] opacity-70 mt-0.5 leading-tight">{p.summary}</div>
      </div>
      <div className="text-[9px] font-bold shrink-0 opacity-60">{p.confidence}%</div>
    </div>
  );
}

function RiskBar({ score }: { score: number }) {
  const color =
    score >= 70 ? 'bg-red-500' :
    score >= 40 ? 'bg-amber-400' :
    'bg-emerald-500';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-700', color)}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className={cn(
        'text-[10px] font-black tabular-nums',
        score >= 70 ? 'text-red-500' : score >= 40 ? 'text-amber-500' : 'text-emerald-500',
      )}>
        {score}
      </span>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export function CommandCenter({ open, onClose, focusModeActive, onToggleFocusMode }: Props) {
  const {
    plan, planLoading, focusTask, mode,
    predictions, riskScore, riskLabel,
    eliminatableTasks,
    isRecalculating, lastRecalculated, recalculate,
  } = useCommandCenter();

  const createTask  = useCreateTask();
  const updateTask  = useUpdateTask();
  const navigate    = useNavigate();

  const [killMode,      setKillMode]      = useState<'off' | 'preview' | 'done'>('off');
  const [killedCount,   setKilledCount]   = useState(0);
  const [addTaskOpen,   setAddTaskOpen]   = useState(false);
  const [newTaskTitle,  setNewTaskTitle]  = useState('');

  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) return;
    const today = new Date().toISOString().split('T')[0];
    try {
      await createTask.mutateAsync({ title: newTaskTitle.trim(), status: 'todo', due_date: today });
      toast.success('تم إضافة المهمة');
      setNewTaskTitle('');
      setAddTaskOpen(false);
    } catch { toast.error('حدث خطأ'); }
  };

  const handleCompleteFocus = async () => {
    if (!focusTask) return;
    try {
      await updateTask.mutateAsync({ id: focusTask.id, status: 'done' });
      toast.success('أحسنت! المهمة مكتملة');
    } catch { toast.error('حدث خطأ'); }
  };

  useEffect(() => {
    if (!open) { setKillMode('off'); setKilledCount(0); }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  const handleKill = () => {
    if (killMode === 'off') {
      setKillMode('preview');
    } else if (killMode === 'preview') {
      setKilledCount(eliminatableTasks.length);
      setKillMode('done');
    } else {
      setKillMode('off');
      setKilledCount(0);
    }
  };

  const criticalPredictions = predictions.filter(p => p.severity === 'critical');
  const warningPredictions  = predictions.filter(p => p.severity === 'warning');
  const visibleAlerts = [...criticalPredictions, ...warningPredictions].slice(0, 5);

  const modeLabels: Record<string, string> = {
    'deep-work':  'عمل عميق',
    'review':     'مراجعة',
    'execution':  'إنجاز',
    'wind-down':  'تخطيط',
  };

  if (!open) return null;

  // Add-task dialog (rendered outside the fixed overlay to avoid z-index issues)
  const addTaskDialog = (
    <Dialog open={addTaskOpen} onOpenChange={v => { setAddTaskOpen(v); setNewTaskTitle(''); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Plus className="w-4 h-4 text-primary" />
            </div>
            مهمة جديدة
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <Input
            autoFocus
            value={newTaskTitle}
            onChange={e => setNewTaskTitle(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleAddTask(); }}
            placeholder="عنوان المهمة…"
            className="bg-muted/50"
          />
          <Button onClick={handleAddTask} className="w-full" disabled={createTask.isPending || !newTaskTitle.trim()}>
            {createTask.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'إضافة'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );

  return (
    <>
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-3xl overflow-hidden border border-border/40 bg-background">

        {/* ── Header ── */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-border/30 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-center">
              <Crosshair className="w-4 h-4 text-red-500" />
            </div>
            <div>
              <h2 className="text-sm font-black text-foreground tracking-wider uppercase">
                مركز القيادة
              </h2>
              <p className="text-[9px] text-muted-foreground/60 uppercase tracking-widest">Command Center</p>
            </div>
          </div>

          <div className="flex-1" />

          {/* Mode chip */}
          <div className="hidden sm:flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground bg-muted/40 border border-border/40 rounded-full px-2.5 py-1">
            <Clock className="w-3 h-3" />
            {modeLabels[mode] ?? mode}
          </div>

          {/* Risk */}
          <div className={cn(
            'hidden sm:flex items-center gap-1.5 text-[10px] font-black rounded-full px-2.5 py-1 border',
            riskScore >= 70 ? 'text-red-500 bg-red-500/10 border-red-500/20' :
            riskScore >= 40 ? 'text-amber-500 bg-amber-400/10 border-amber-400/20' :
            'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
          )}>
            {riskLabel}
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-muted/40 border border-border/30 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          {planLoading ? (
            <div className="p-5 space-y-3">
              <Skeleton className="h-20 rounded-2xl" />
              <div className="grid grid-cols-3 gap-3">
                {[0, 1, 2].map(i => <Skeleton key={i} className="h-40 rounded-xl" />)}
              </div>
            </div>
          ) : (
            <div className="p-4 sm:p-5 space-y-5">

              {/* ── Quick actions ── */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  {
                    label: 'إنجاز المهمة', icon: CheckSquare,
                    onClick: handleCompleteFocus,
                    disabled: !focusTask || updateTask.isPending,
                    color: 'text-emerald-500',
                    bg: 'bg-emerald-500/8 border-emerald-500/20 hover:bg-emerald-500/15',
                  },
                  {
                    label: 'مهمة جديدة', icon: Plus,
                    onClick: () => setAddTaskOpen(true),
                    disabled: false,
                    color: 'text-primary',
                    bg: 'bg-primary/8 border-primary/20 hover:bg-primary/15',
                  },
                  {
                    label: 'المهام', icon: ListTodo,
                    onClick: () => { navigate('/tasks'); onClose(); },
                    disabled: false,
                    color: 'text-blue-500',
                    bg: 'bg-blue-500/8 border-blue-500/20 hover:bg-blue-500/15',
                  },
                  {
                    label: 'التقويم', icon: CalendarDays,
                    onClick: () => { navigate('/calendar'); onClose(); },
                    disabled: false,
                    color: 'text-violet-500',
                    bg: 'bg-violet-500/8 border-violet-500/20 hover:bg-violet-500/15',
                  },
                ].map(action => (
                  <button
                    key={action.label}
                    onClick={action.onClick}
                    disabled={action.disabled}
                    className={cn(
                      'flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl border transition-all text-center disabled:opacity-40',
                      action.bg,
                    )}
                  >
                    <action.icon className={cn('w-5 h-5', action.color)} />
                    <span className={cn('text-[11px] font-bold', action.color)}>{action.label}</span>
                  </button>
                ))}
              </div>

              {/* ── Section 1: The Mission ── */}
              <div className="rounded-2xl border border-border/30 bg-muted/20 p-4">
                <div className="flex items-center gap-1.5 text-[9px] font-black text-red-500 uppercase tracking-widest mb-3">
                  <Target className="w-3 h-3" />
                  المهمة الأولى
                </div>

                {focusTask ? (
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
                      <Flame className="w-5 h-5 text-red-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-black text-foreground leading-tight">{focusTask.title}</h3>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span className={cn(
                          'text-[9px] font-black uppercase tracking-wide px-2 py-0.5 rounded-full border',
                          focusTask.priority === 'urgent' ? 'text-red-500 border-red-500/30 bg-red-500/10' :
                          focusTask.priority === 'high'   ? 'text-orange-500 border-orange-400/30 bg-orange-400/10' :
                          'text-amber-500 border-amber-400/30 bg-amber-400/10',
                        )}>
                          {focusTask.priority}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-bold tabular-nums">
                          درجة {focusTask.score}
                        </span>
                        {focusTask.estimated_minutes && (
                          <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                            <Clock className="w-2.5 h-2.5" />
                            {focusTask.estimated_minutes} دقيقة
                          </span>
                        )}
                        {focusTask.memoryReasons?.length > 0 && (
                          <span className="text-[9px] text-indigo-500 font-bold">
                            ← بناءً على تاريخك
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    لا توجد مهام معلقة — يوم نظيف
                  </div>
                )}
              </div>

              {/* ── Section 2: Day Plan ── */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {(['morning', 'afternoon', 'evening'] as TimeBlock[]).map(block => {
                  const tasks = plan[block];
                  if (tasks.length === 0) return null;
                  return (
                    <div key={block} className="rounded-xl border border-border/30 bg-muted/10 p-3 space-y-2">
                      <TimeBlockSection
                        block={block}
                        tasks={tasks}
                        killed={killMode === 'done'}
                        preview={killMode === 'preview'}
                      />
                    </div>
                  );
                })}
              </div>

              {/* Quick wins */}
              {plan.quickWins.length > 0 && (
                <div className="rounded-xl border border-border/30 bg-muted/10 p-3">
                  <div className="text-[10px] font-black text-emerald-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Zap className="w-3 h-3" />
                    انتصارات سريعة ({plan.quickWins.length})
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {plan.quickWins.slice(0, 6).map(t => (
                      <span key={t.id} className="text-[10px] font-medium text-foreground/70 bg-muted/40 border border-border/30 rounded-lg px-2 py-1">
                        {t.title}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Kill preview notice */}
              {killMode === 'preview' && eliminatableTasks.length > 0 && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-500">
                  <XCircle className="w-4 h-4 shrink-0" />
                  سيتم إخفاء <span className="font-black mx-1">{eliminatableTasks.length}</span> مهمة بدرجة أقل من {CMD_KILL_THRESHOLD} — اضغط مجدداً للتأكيد
                </div>
              )}

              {killMode === 'done' && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-500">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  تم حذف <span className="font-black mx-1">{killedCount}</span> مهمة ثانوية — الخطة نظيفة
                </div>
              )}

              {/* ── Section 3: Alerts ── */}
              {visibleAlerts.length > 0 && (
                <div className="space-y-2">
                  <div className="text-[9px] font-black text-muted-foreground/50 uppercase tracking-widest">
                    التحذيرات والمخاطر
                  </div>
                  <div className="space-y-1.5">
                    {visibleAlerts.map(p => (
                      <PredictionAlert key={p.id} p={p} />
                    ))}
                  </div>
                  <div className="mt-1.5">
                    <RiskBar score={riskScore} />
                  </div>
                </div>
              )}

              {/* Plan stats */}
              <div className="grid grid-cols-3 gap-2 text-center">
                {[
                  { label: 'إجمالي اليوم', value: plan.totalTasks },
                  { label: 'مكتملة اليوم', value: plan.completedToday },
                  { label: 'قابلة للإلغاء', value: eliminatableTasks.length },
                ].map(s => (
                  <div key={s.label} className="rounded-xl bg-muted/20 border border-border/30 py-2.5 px-2">
                    <div className="text-lg font-black text-foreground">{s.value}</div>
                    <div className="text-[9px] text-muted-foreground">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Action Bar ── */}
        <div className="shrink-0 px-4 py-3 border-t border-border/30 bg-muted/10">
          <div className="flex gap-2">

            {/* Recalculate */}
            <button
              onClick={recalculate}
              disabled={isRecalculating}
              className={cn(
                'flex items-center gap-1.5 flex-1 justify-center py-2.5 rounded-xl text-xs font-black transition-all',
                'border border-border/40 bg-muted/30 text-muted-foreground hover:bg-muted/50 hover:text-foreground',
                isRecalculating && 'opacity-60 cursor-not-allowed',
              )}
            >
              <RefreshCw className={cn('w-3.5 h-3.5', isRecalculating && 'animate-spin')} />
              {isRecalculating ? 'يعيد الحساب…' : 'إعادة الحساب'}
            </button>

            {/* Kill secondary */}
            <button
              onClick={handleKill}
              disabled={eliminatableTasks.length === 0}
              className={cn(
                'flex items-center gap-1.5 flex-1 justify-center py-2.5 rounded-xl text-xs font-black transition-all',
                'border',
                killMode === 'done'
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-500'
                  : killMode === 'preview'
                  ? 'border-red-500/40 bg-red-500/15 text-red-500 animate-pulse'
                  : 'border-border/40 bg-muted/30 text-muted-foreground hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/30',
                eliminatableTasks.length === 0 && killMode === 'off' && 'opacity-40 cursor-not-allowed',
              )}
            >
              <XCircle className="w-3.5 h-3.5" />
              {killMode === 'done'    ? `✓ تم حذف ${killedCount}` :
               killMode === 'preview' ? 'تأكيد الحذف' :
               `حذف الثانوي (${eliminatableTasks.length})`}
            </button>

            {/* Force focus */}
            <button
              onClick={onToggleFocusMode}
              className={cn(
                'flex items-center gap-1.5 flex-1 justify-center py-2.5 rounded-xl text-xs font-black transition-all border',
                focusModeActive
                  ? 'border-amber-400/40 bg-amber-400/15 text-amber-500'
                  : 'border-border/40 bg-muted/30 text-muted-foreground hover:bg-amber-400/10 hover:text-amber-500 hover:border-amber-400/30',
              )}
            >
              <Zap className="w-3.5 h-3.5" />
              {focusModeActive ? 'إيقاف التركيز' : 'وضع التركيز'}
            </button>
          </div>

          {lastRecalculated && (
            <p className="text-center text-[9px] text-muted-foreground/40 mt-2">
              آخر تحديث: {lastRecalculated.toLocaleTimeString('ar')}
            </p>
          )}
        </div>
      </div>
    </div>
    {addTaskDialog}
    </>
  );
}
