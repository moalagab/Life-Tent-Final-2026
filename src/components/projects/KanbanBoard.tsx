import { useState } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { useUpdateTask, useDeleteTask } from '@/hooks/useTasks';
import type { Task } from '@/hooks/useTasks';
import { cn }    from '@/lib/utils';
import { format } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { toast } from 'sonner';
import {
  CheckCircle2, Circle, Timer, Eye, Star,
  Flag, MoreHorizontal, Plus, Calendar, Trash2, Pencil,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// ── Column config ─────────────────────────────────────────────────────────────

const COLUMNS: {
  id: string;
  labelAr: string;
  labelEn: string;
  icon:  typeof Circle;
  color: string;
  headerBg: string;
  dot: string;
}[] = [
  { id: 'backlog',     labelAr: 'متراكم',      labelEn: 'Backlog',      icon: Circle,       color: 'text-muted-foreground', headerBg: 'bg-muted/60',        dot: 'bg-muted-foreground' },
  { id: 'todo',        labelAr: 'قائمة الانتظار', labelEn: 'To Do',     icon: Circle,       color: 'text-blue-500',         headerBg: 'bg-blue-500/10',     dot: 'bg-blue-500' },
  { id: 'in_progress', labelAr: 'قيد التنفيذ',  labelEn: 'In Progress',  icon: Timer,        color: 'text-amber-500',        headerBg: 'bg-amber-500/10',    dot: 'bg-amber-500' },
  { id: 'review',      labelAr: 'مراجعة',       labelEn: 'Review',       icon: Eye,          color: 'text-purple-500',       headerBg: 'bg-purple-500/10',   dot: 'bg-purple-500' },
  { id: 'done',        labelAr: 'مكتمل',        labelEn: 'Done',         icon: CheckCircle2, color: 'text-emerald-500',      headerBg: 'bg-emerald-500/10',  dot: 'bg-emerald-500' },
];

const PRIORITY_CONFIG: Record<string, { border: string; badge: string; label: string }> = {
  urgent: { border: 'border-s-red-500',    badge: 'text-red-500 bg-red-500/10',   label: 'عاجل' },
  high:   { border: 'border-s-amber-500',  badge: 'text-amber-500 bg-amber-500/10', label: 'عالي' },
  medium: { border: 'border-s-blue-500',   badge: 'text-blue-500 bg-blue-500/10',  label: 'متوسط' },
  low:    { border: 'border-s-slate-400',  badge: 'text-slate-400 bg-slate-400/10', label: 'منخفض' },
};

// ── Props ─────────────────────────────────────────────────────────────────────

interface KanbanBoardProps {
  projectId: string;
  tasks:     Task[];
  onAddTask?: () => void;
}

// ── Task card ─────────────────────────────────────────────────────────────────

function KanbanCard({
  task,
  onDragStart,
  isDragging,
  isRTL,
}: {
  task:       Task;
  onDragStart: () => void;
  isDragging: boolean;
  isRTL:      boolean;
}) {
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const dateLocale = isRTL ? ar : enUS;
  const priority   = task.priority ?? 'medium';
  const cfg        = PRIORITY_CONFIG[priority] ?? PRIORITY_CONFIG.medium;

  const markDone = async () => {
    try {
      await updateTask.mutateAsync({ id: task.id, status: 'done' });
      toast.success(isRTL ? 'تم إكمال المهمة' : 'Task completed');
    } catch { toast.error(isRTL ? 'حدث خطأ' : 'Error'); }
  };

  const handleDelete = async () => {
    if (!confirm(isRTL ? 'هل تريد حذف هذه المهمة؟' : 'Delete this task?')) return;
    try {
      await deleteTask.mutateAsync(task.id);
      toast.success(isRTL ? 'تم الحذف' : 'Deleted');
    } catch { toast.error(isRTL ? 'حدث خطأ' : 'Error'); }
  };

  return (
    <div
      draggable
      onDragStart={onDragStart}
      className={cn(
        'group rounded-xl border border-border/60 border-s-4 bg-card',
        'p-3 cursor-grab active:cursor-grabbing transition-all select-none',
        cfg.border,
        isDragging && 'opacity-40 scale-95 rotate-1',
      )}
    >
      {/* Title row */}
      <div className="flex items-start gap-2">
        {/* Check done button */}
        <button
          onClick={markDone}
          className="mt-0.5 shrink-0 text-muted-foreground hover:text-emerald-500 transition-colors"
          title={isRTL ? 'إكمال' : 'Mark done'}
        >
          {task.status === 'done'
            ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            : <Circle className="w-3.5 h-3.5" />}
        </button>

        <p className={cn(
          'flex-1 text-sm font-medium text-foreground leading-snug line-clamp-2',
          task.status === 'done' && 'line-through text-muted-foreground',
        )}>
          {task.title}
        </p>

        {/* Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-muted text-muted-foreground">
              <MoreHorizontal className="w-3.5 h-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align={isRTL ? 'start' : 'end'} className="text-sm">
            <DropdownMenuItem onClick={handleDelete} className="text-destructive gap-2">
              <Trash2 className="w-3.5 h-3.5" />
              {isRTL ? 'حذف' : 'Delete'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Meta row */}
      <div className="flex items-center gap-2 mt-2 flex-wrap">
        {/* Priority badge */}
        <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded-md', cfg.badge)}>
          {cfg.label}
        </span>

        {/* Due date */}
        {task.due_date && (
          <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Calendar className="w-2.5 h-2.5" />
            {format(new Date(task.due_date), 'dd MMM', { locale: dateLocale })}
          </span>
        )}

        {/* Focus star */}
        {task.is_focus && (
          <Star className="w-3 h-3 text-amber-400 fill-amber-400 ms-auto" />
        )}
      </div>
    </div>
  );
}

// ── Column ────────────────────────────────────────────────────────────────────

function KanbanColumn({
  column,
  tasks,
  onDragStart,
  onDragOver,
  onDrop,
  draggedTask,
  isRTL,
  onAddTask,
}: {
  column:     typeof COLUMNS[0];
  tasks:      Task[];
  onDragStart: (t: Task) => void;
  onDragOver:  (e: React.DragEvent) => void;
  onDrop:      () => void;
  draggedTask: Task | null;
  isRTL:       boolean;
  onAddTask?:  () => void;
}) {
  const Icon = column.icon;
  const label = isRTL ? column.labelAr : column.labelEn;

  return (
    <div
      className="flex flex-col"
      style={{ minWidth: 220, width: 220 }}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      {/* Column header */}
      <div className={cn(
        'flex items-center gap-2 px-3 py-2.5 rounded-t-xl border border-border/40',
        column.headerBg,
      )}>
        <div className={cn('w-2 h-2 rounded-full shrink-0', column.dot)} />
        <span className={cn('text-xs font-bold flex-1', column.color)}>{label}</span>
        <span className="text-[10px] font-black text-muted-foreground bg-background/60 px-1.5 py-0.5 rounded-md">
          {tasks.length}
        </span>
      </div>

      {/* Cards area */}
      <div
        className={cn(
          'flex-1 rounded-b-xl border border-t-0 border-border/30 bg-muted/20 p-2 space-y-2',
          'min-h-[300px] transition-colors',
          draggedTask && 'bg-muted/40',
        )}
      >
        {tasks.map(task => (
          <KanbanCard
            key={task.id}
            task={task}
            onDragStart={() => onDragStart(task)}
            isDragging={draggedTask?.id === task.id}
            isRTL={isRTL}
          />
        ))}

        {tasks.length === 0 && (
          <div className="flex items-center justify-center h-16">
            <p className="text-[11px] text-muted-foreground/40">
              {isRTL ? 'اسحب المهام هنا' : 'Drop tasks here'}
            </p>
          </div>
        )}

        {/* Add task in this column — only for todo/in_progress */}
        {onAddTask && (column.id === 'todo' || column.id === 'in_progress') && (
          <button
            onClick={onAddTask}
            className="w-full flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground py-1.5 px-2 rounded-lg hover:bg-muted/60 transition-colors mt-1"
          >
            <Plus className="w-3 h-3" />
            {isRTL ? 'إضافة مهمة' : 'Add task'}
          </button>
        )}
      </div>
    </div>
  );
}

// ── Main board ────────────────────────────────────────────────────────────────

export function KanbanBoard({ projectId, tasks, onAddTask }: KanbanBoardProps) {
  const { isRTL } = useLanguage();
  const updateTask = useUpdateTask();
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);

  const getColumnTasks = (status: string) => tasks.filter(t => t.status === status);

  const handleDragOver = (e: React.DragEvent) => e.preventDefault();

  const handleDrop = async (status: string) => {
    if (!draggedTask || draggedTask.status === status) {
      setDraggedTask(null);
      return;
    }
    try {
      await updateTask.mutateAsync({
        id:           draggedTask.id,
        status:       status as Task['status'],
        completed_at: status === 'done' ? new Date().toISOString() : undefined,
      });
    } catch { /* silent */ }
    setDraggedTask(null);
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className={cn('flex items-center justify-between', isRTL && 'flex-row-reverse')}>
        <div className={cn('flex items-center gap-2', isRTL && 'flex-row-reverse')}>
          <span className="text-sm font-bold text-foreground">
            {isRTL ? 'لوحة كانبان' : 'Kanban Board'}
          </span>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            {tasks.length} {isRTL ? 'مهمة' : 'tasks'}
          </span>
        </div>
        {onAddTask && (
          <Button size="sm" variant="outline" onClick={onAddTask} className="h-7 text-xs gap-1">
            <Plus className="w-3 h-3" />
            {isRTL ? 'مهمة جديدة' : 'New Task'}
          </Button>
        )}
      </div>

      {/* Scrollable columns — horizontal scroll on mobile, wrap on large screens */}
      <div
        className="flex gap-3 overflow-x-auto pb-4"
        style={{ scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' }}
      >
        {COLUMNS.map(col => (
          <div key={col.id} style={{ scrollSnapAlign: 'start', flexShrink: 0 }}>
            <KanbanColumn
              column={col}
              tasks={getColumnTasks(col.id)}
              onDragStart={setDraggedTask}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(col.id)}
              draggedTask={draggedTask}
              isRTL={isRTL}
              onAddTask={onAddTask}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
