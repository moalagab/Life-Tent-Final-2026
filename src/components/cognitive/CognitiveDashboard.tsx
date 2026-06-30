/**
 * CognitiveDashboard — "النظام يختار بدلك"
 *
 * The curated "cognitive load control" panel. Always shows the minimum
 * set of information needed — and nothing more.
 *
 * Sections:
 *   1. Header:  load level indicator + budget bar + expand/collapse controls
 *   2. Tasks:   top N scored tasks with quick-done + start actions
 *   3. Project: single focus project (or top N) with progress + task count
 *   4. Footer:  "عرض المزيد" / hidden count / navigate to full list
 *
 * Levels:
 *   0 = 1 task, 0 projects (ultra-focus / morning / crisis)
 *   1 = 3 tasks, 1 project  (default)
 *   2 = 5 tasks, 2 projects (midday / review)
 *   3 = all                  (user expanded)
 */
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Brain, ChevronRight, ChevronDown, ChevronUp, Play,
  FolderKanban, Check, Minus, Plus, Clock, Layers,
} from 'lucide-react';
import { toast } from 'sonner';
import { ProgressiveList } from './ProgressiveList';
import { useCognitiveLoad, CognitiveLevel } from '@/hooks/useCognitiveLoad';
import { useUpdateTask } from '@/hooks/useTasks';
import { useLanguage } from '@/hooks/useLanguage';
import type { ScoredTask } from '@/hooks/useAdaptivePriority';
import type { Project } from '@/hooks/useProjects';
import type { UIMode } from '@/hooks/useContextAwareness';

// ── Priority colours ───────────────────────────────────────────────────────────

const PRIORITY_COLOR: Record<string, string> = {
  critical: '#ef4444',
  high:     '#f97316',
  medium:   '#f59e0b',
  low:      '#64748b',
};

const PRIORITY_AR: Record<string, string> = {
  critical: 'حرجة', high: 'عالية', medium: 'متوسطة', low: 'منخفضة',
};

// ── Level dots indicator ───────────────────────────────────────────────────────

function LevelDots({ level }: { level: CognitiveLevel }) {
  return (
    <div className="flex items-center gap-0.5">
      {([0, 1, 2, 3] as CognitiveLevel[]).map(l => (
        <span
          key={l}
          className={cn(
            'w-2 h-2 rounded-full transition-all duration-300',
            l <= level ? 'bg-primary scale-100' : 'bg-muted scale-90',
          )}
        />
      ))}
    </div>
  );
}

// ── Budget bar ─────────────────────────────────────────────────────────────────

function BudgetBar({ score, label }: { score: number; label: string }) {
  const color =
    score >= 85 ? 'destructive' : score >= 65 ? 'amber-500' : 'success';

  return (
    <div className="flex items-center gap-1.5">
      <div className="w-16 h-1 bg-muted/60 rounded-full overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500',
            score >= 85 ? 'bg-destructive' : score >= 65 ? 'bg-amber-500' : 'bg-success',
          )}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className={cn(
        'text-[10px] font-semibold',
        score >= 85 ? 'text-destructive' : score >= 65 ? 'text-amber-500' : 'text-success',
      )}>
        {label}
      </span>
    </div>
  );
}

// ── Task row ──────────────────────────────────────────────────────────────────

interface TaskRowProps {
  task:    ScoredTask;
  index:   number;
  isAr:   boolean;
}

function TaskRow({ task, index, isAr }: TaskRowProps) {
  const navigate    = useNavigate();
  const updateTask  = useUpdateTask();
  const pColor = PRIORITY_COLOR[task.originalPriority] ?? '#64748b';

  const handleDone = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await updateTask.mutateAsync({ id: task.id, status: 'done' });
      toast(isAr ? `✓ ${task.title}` : `Done: ${task.title}`);
    } catch { /* noop */ }
  };

  const handleStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate('/tasks');
  };

  return (
    <div
      className={cn(
        'group flex items-center gap-2.5 py-2 px-2 rounded-xl',
        'hover:bg-muted/30 transition-colors cursor-default',
        index === 0 && 'bg-primary/[0.04] border border-primary/10',
      )}
    >
      {/* Priority dot */}
      <span
        className="w-2 h-2 rounded-full shrink-0"
        style={{ background: pColor }}
      />

      {/* Title + reason */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground leading-tight truncate">
          {task.title}
        </p>
        <div className="flex items-center gap-1.5 mt-0.5">
          {/* Score bar */}
          <div className="w-12 h-0.5 bg-muted/60 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-primary/60"
              style={{ width: `${task.adaptiveScore}%` }}
            />
          </div>
          <span className="text-[10px] text-muted-foreground/70">{task.adaptiveScore}</span>
          {task.estimatedMinutes && (
            <span className="text-[10px] text-muted-foreground/60 flex items-center gap-0.5">
              <Clock className="w-2.5 h-2.5" />
              {task.estimatedMinutes}{isAr ? 'د' : 'm'}
            </span>
          )}
          {task.reasons[0] && (
            <span className="text-[10px] text-muted-foreground/60 truncate max-w-[120px]">
              {task.reasons[0]}
            </span>
          )}
        </div>
      </div>

      {/* Actions (visible on hover for index>0, always for index=0) */}
      <div className={cn(
        'flex items-center gap-1 shrink-0',
        index > 0 && 'opacity-0 group-hover:opacity-100 transition-opacity',
      )}>
        <button
          onClick={handleStart}
          className="p-1 rounded-lg text-primary hover:bg-primary/10 transition-colors"
          title={isAr ? 'ابدأ' : 'Start'}
        >
          <Play className="w-3.5 h-3.5 fill-current" />
        </button>
        <button
          onClick={handleDone}
          className="p-1 rounded-lg text-success hover:bg-success/10 transition-colors"
          title={isAr ? 'أتمّ' : 'Done'}
        >
          <Check className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

// ── Project card ───────────────────────────────────────────────────────────────

interface ProjectCardProps {
  project: Project;
  taskCount: { active: number; total: number };
  isAr: boolean;
}

function ProjectCard({ project, taskCount, isAr }: ProjectCardProps) {
  const navigate = useNavigate();
  const color    = project.color || '#6366f1';
  const progress = project.progress ?? 0;

  return (
    <button
      onClick={() => navigate(`/projects/${project.id}`)}
      className="w-full text-start flex items-start gap-3 p-3 rounded-xl hover:bg-muted/30 border border-border/30 transition-colors group"
    >
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: `${color}20` }}
      >
        <FolderKanban className="w-4 h-4" style={{ color }} />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground truncate">{project.title}</p>
        <div className="flex items-center gap-2 mt-1.5">
          <div className="flex-1">
            <Progress value={progress} className="h-1" />
          </div>
          <span className="text-[10px] text-muted-foreground shrink-0">{progress}%</span>
        </div>
        <p className="text-[10px] text-muted-foreground mt-0.5">
          {taskCount.active} {isAr ? 'مهمة نشطة' : 'active tasks'}
          {taskCount.total > 0 && ` · ${taskCount.total} ${isAr ? 'إجمالاً' : 'total'}`}
        </p>
      </div>

      <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
    </button>
  );
}

// ── Skeleton ───────────────────────────────────────────────────────────────────

function CognitiveSkeleton() {
  return (
    <div className="glass-card p-4 space-y-3 animate-pulse">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-3 w-20" />
      </div>
      <Skeleton className="h-px w-full" />
      {[0, 1, 2].map(i => <Skeleton key={i} className="h-10 w-full rounded-xl" />)}
      <Skeleton className="h-14 w-full rounded-xl" />
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

interface CognitiveDashboardProps {
  contextMode?: UIMode;
}

export function CognitiveDashboard({ contextMode = 'deep-work' }: CognitiveDashboardProps) {
  const { currentLanguage } = useLanguage();
  const isAr = currentLanguage === 'ar';
  const navigate = useNavigate();

  const {
    level, focusTasks, focusProjects,
    hiddenTaskCount, hiddenProjectCount,
    allTaskCount, allProjectCount,
    budgetScore, budgetLabel,
    expand, collapse, setLevel,
    isAtMax, isLoading,
  } = useCognitiveLoad(contextMode);

  if (isLoading) return <CognitiveSkeleton />;

  if (allTaskCount === 0 && allProjectCount === 0) return null;

  // Build project → task counts map
  const getProjectTaskCount = (projectId: string) => ({
    active: 0,   // Would need tasks passed in; using 0 as placeholder
    total:  0,
  });

  const LEVEL_LABELS: Record<CognitiveLevel, string> = {
    0: isAr ? 'تركيز قصوى' : 'Ultra focus',
    1: isAr ? 'مركّز'      : 'Focused',
    2: isAr ? 'متوازن'     : 'Balanced',
    3: isAr ? 'كامل'       : 'Full view',
  };

  return (
    <div className="glass-card overflow-hidden">

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/40 bg-muted/10">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">
            <Brain className="w-3.5 h-3.5 text-primary" />
          </div>
          <div>
            <p className="text-[11px] font-black text-foreground uppercase tracking-widest">
              {isAr ? 'الحد الذهني' : 'Cognitive Load'}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {isAr ? 'النظام يختار بدلك' : 'System curates for you'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <BudgetBar score={budgetScore} label={budgetLabel} />
          <LevelDots level={level} />
          <span className="text-[10px] text-muted-foreground w-16 text-end">
            {LEVEL_LABELS[level]}
          </span>

          {/* Expand / collapse */}
          <div className="flex items-center gap-0.5">
            <button
              onClick={collapse}
              disabled={level === 0}
              className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/40 disabled:opacity-30 transition-colors"
              title={isAr ? 'تبسيط' : 'Simplify'}
            >
              <Minus className="w-3 h-3" />
            </button>
            <button
              onClick={expand}
              disabled={isAtMax}
              className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/40 disabled:opacity-30 transition-colors"
              title={isAr ? 'توسيع' : 'Expand'}
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">

        {/* ── Tasks section ── */}
        {focusTasks.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                {isAr ? 'المهام المختارة' : 'Selected tasks'}
                <span className="ms-1 font-normal normal-case text-muted-foreground/60">
                  {focusTasks.length} / {allTaskCount}
                </span>
              </span>
              <button
                onClick={() => navigate('/tasks')}
                className="text-[10px] text-primary hover:underline"
              >
                {isAr ? 'كل المهام' : 'All tasks'}
              </button>
            </div>

            <div className="space-y-0.5">
              {focusTasks.map((task, i) => (
                <TaskRow key={task.id} task={task} index={i} isAr={isAr} />
              ))}
            </div>

            {hiddenTaskCount > 0 && (
              <button
                onClick={expand}
                disabled={isAtMax}
                className={cn(
                  'flex items-center gap-1 text-[11px] text-muted-foreground/70',
                  'hover:text-primary transition-colors pt-1.5 px-2 font-semibold',
                  isAtMax && 'cursor-default',
                )}
              >
                <ChevronDown className="w-3 h-3" />
                {isAr
                  ? `+ ${hiddenTaskCount} مهمة أخرى`
                  : `+ ${hiddenTaskCount} more tasks`}
              </button>
            )}
          </section>
        )}

        {/* ── Project focus section ── */}
        {focusProjects.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                {isAr ? 'المشروع المركّز' : 'Focus project'}
                <span className="ms-1 font-normal normal-case text-muted-foreground/60">
                  {focusProjects.length} / {allProjectCount}
                </span>
              </span>
              <button
                onClick={() => navigate('/projects')}
                className="text-[10px] text-primary hover:underline"
              >
                {isAr ? 'كل المشاريع' : 'All projects'}
              </button>
            </div>

            <div className="space-y-1.5">
              {focusProjects.map(p => (
                <ProjectCard
                  key={p.id}
                  project={p}
                  taskCount={getProjectTaskCount(p.id)}
                  isAr={isAr}
                />
              ))}
            </div>

            {hiddenProjectCount > 0 && (
              <button
                onClick={expand}
                disabled={isAtMax}
                className="flex items-center gap-1 text-[11px] text-muted-foreground/70 hover:text-primary transition-colors pt-1 px-2 font-semibold"
              >
                <ChevronDown className="w-3 h-3" />
                {isAr
                  ? `+ ${hiddenProjectCount} مشروع آخر`
                  : `+ ${hiddenProjectCount} more projects`}
              </button>
            )}
          </section>
        )}

        {/* ── Level quick-set footer ── */}
        <div className="flex items-center justify-between pt-1 border-t border-border/30">
          <div className="flex items-center gap-1">
            <Layers className="w-3 h-3 text-muted-foreground/50" />
            <span className="text-[10px] text-muted-foreground/50">
              {isAr ? 'المستوى' : 'Level'}:
            </span>
            {([0, 1, 2, 3] as CognitiveLevel[]).map(l => (
              <button
                key={l}
                onClick={() => setLevel(l)}
                className={cn(
                  'text-[10px] px-1.5 py-0.5 rounded transition-colors',
                  level === l
                    ? 'bg-primary/10 text-primary font-bold'
                    : 'text-muted-foreground/50 hover:text-muted-foreground',
                )}
              >
                {l}
              </button>
            ))}
          </div>

          {level === 3 && (
            <button
              onClick={collapse}
              className="flex items-center gap-0.5 text-[10px] text-muted-foreground/60 hover:text-muted-foreground transition-colors"
            >
              <ChevronUp className="w-3 h-3" />
              {isAr ? 'تبسيط' : 'Simplify'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
