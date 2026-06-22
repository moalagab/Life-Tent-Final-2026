import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  Plus, Trash2, Pencil, Check, X, Target, ChevronRight,
  Flag, Calendar, CheckCircle, Circle, Loader2, Zap,
} from 'lucide-react';
import {
  useInitiatives, useCreateInitiative, useUpdateInitiative, useDeleteInitiative,
  useInitiativeTaskCounts, Initiative, InitiativePriority, InitiativeStatus,
} from '@/hooks/useInitiatives';
import { useLanguage } from '@/hooks/useLanguage';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

// ── Config ─────────────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<InitiativeStatus, string> = {
  active:      'bg-primary/10 text-primary border-primary/20',
  in_progress: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  completed:   'bg-success/10 text-success border-success/20',
  cancelled:   'bg-muted text-muted-foreground border-border',
  on_hold:     'bg-warning/10 text-warning border-warning/20',
};

const PRIORITY_COLORS: Record<InitiativePriority, string> = {
  low:      'text-muted-foreground',
  medium:   'text-primary',
  high:     'text-warning',
  critical: 'text-destructive',
};

const PRIORITY_DOT: Record<InitiativePriority, string> = {
  low:      'bg-muted-foreground/40',
  medium:   'bg-primary',
  high:     'bg-warning',
  critical: 'bg-destructive',
};

// ── Form Dialog ───────────────────────────────────────────────────────────────

interface InitiativeFormProps {
  open: boolean;
  onClose: () => void;
  goalId?: string;
  projectId?: string;
  areaId?: string;
  initiative?: Initiative;
  isAr: boolean;
}

function InitiativeFormDialog({ open, onClose, goalId, projectId, areaId, initiative, isAr }: InitiativeFormProps) {
  const [title, setTitle]       = useState(initiative?.title ?? '');
  const [desc, setDesc]         = useState(initiative?.description ?? '');
  const [status, setStatus]     = useState<InitiativeStatus>(initiative?.status ?? 'active');
  const [priority, setPriority] = useState<InitiativePriority>(initiative?.priority ?? 'medium');
  const [dueDate, setDueDate]   = useState(initiative?.due_date ?? '');

  const create = useCreateInitiative();
  const update = useUpdateInitiative();

  const handleSubmit = async () => {
    if (!title.trim()) { toast.error(isAr ? 'العنوان مطلوب' : 'Title required'); return; }
    try {
      if (initiative) {
        await update.mutateAsync({ id: initiative.id, title: title.trim(), description: desc || null, status, priority, due_date: dueDate || null });
        toast.success(isAr ? 'تم التحديث' : 'Updated');
      } else {
        await create.mutateAsync({ title: title.trim(), description: desc || null, status, priority, due_date: dueDate || null, goal_id: goalId ?? null, project_id: projectId ?? null, area_id: areaId ?? null });
        toast.success(isAr ? 'تمت الإضافة' : 'Added');
      }
      onClose();
    } catch { toast.error(isAr ? 'حدث خطأ' : 'Error occurred'); }
  };

  const isPending = create.isPending || update.isPending;

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{initiative ? (isAr ? 'تعديل المبادرة' : 'Edit Initiative') : (isAr ? 'مبادرة جديدة' : 'New Initiative')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <Input
            placeholder={isAr ? 'عنوان المبادرة...' : 'Initiative title...'}
            value={title} onChange={e => setTitle(e.target.value)} dir="auto" autoFocus
          />
          <Textarea
            placeholder={isAr ? 'وصف (اختياري)...' : 'Description (optional)...'}
            value={desc} onChange={e => setDesc(e.target.value)}
            rows={2} dir="auto" className="resize-none"
          />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-muted-foreground mb-1.5">{isAr ? 'الحالة' : 'Status'}</p>
              <Select value={status} onValueChange={v => setStatus(v as InitiativeStatus)}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">{isAr ? 'نشطة' : 'Active'}</SelectItem>
                  <SelectItem value="in_progress">{isAr ? 'قيد التنفيذ' : 'In Progress'}</SelectItem>
                  <SelectItem value="on_hold">{isAr ? 'معلقة' : 'On Hold'}</SelectItem>
                  <SelectItem value="completed">{isAr ? 'مكتملة' : 'Completed'}</SelectItem>
                  <SelectItem value="cancelled">{isAr ? 'ملغاة' : 'Cancelled'}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1.5">{isAr ? 'الأولوية' : 'Priority'}</p>
              <Select value={priority} onValueChange={v => setPriority(v as InitiativePriority)}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">{isAr ? 'منخفضة' : 'Low'}</SelectItem>
                  <SelectItem value="medium">{isAr ? 'متوسطة' : 'Medium'}</SelectItem>
                  <SelectItem value="high">{isAr ? 'عالية' : 'High'}</SelectItem>
                  <SelectItem value="critical">{isAr ? 'حرجة' : 'Critical'}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1.5">{isAr ? 'تاريخ الانتهاء' : 'Due Date'}</p>
            <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="h-9" />
          </div>
          <div className="flex gap-2 pt-1">
            <Button onClick={handleSubmit} disabled={isPending} className="flex-1">
              {isPending ? <Loader2 className="w-4 h-4 animate-spin me-2" /> : <Check className="w-4 h-4 me-2" />}
              {initiative ? (isAr ? 'تحديث' : 'Update') : (isAr ? 'إضافة' : 'Add')}
            </Button>
            <Button variant="outline" onClick={onClose} disabled={isPending}>
              {isAr ? 'إلغاء' : 'Cancel'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Initiative Card ───────────────────────────────────────────────────────────

function InitiativeCard({
  initiative,
  taskCount,
  doneCount,
  isAr,
  onEdit,
  onDelete,
}: {
  initiative: Initiative;
  taskCount: number;
  doneCount: number;
  isAr: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const progress = taskCount > 0 ? Math.round((doneCount / taskCount) * 100) : initiative.progress;

  return (
    <div className={cn('glass-card p-4 space-y-3 border-s-2', initiative.status === 'completed' ? 'border-success' : 'border-primary/40')}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2.5 min-w-0">
          <div className={cn('w-2 h-2 rounded-full mt-1.5 shrink-0', PRIORITY_DOT[initiative.priority])} />
          <div className="min-w-0">
            <p className={cn('font-semibold text-sm leading-tight', initiative.status === 'completed' && 'line-through text-muted-foreground')}>
              {initiative.title}
            </p>
            {initiative.description && (
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{initiative.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-medium border', STATUS_COLORS[initiative.status])}>
            {isAr
              ? ({ active: 'نشطة', in_progress: 'قيد التنفيذ', completed: 'مكتملة', cancelled: 'ملغاة', on_hold: 'معلقة' })[initiative.status]
              : initiative.status.replace('_', ' ')
            }
          </span>
          <button onClick={onEdit} className="text-muted-foreground/50 hover:text-primary transition-colors">
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button onClick={onDelete} className="text-muted-foreground/50 hover:text-destructive transition-colors">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Progress */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            {taskCount > 0
              ? <><CheckCircle className="w-3 h-3" /> {doneCount} / {taskCount} {isAr ? 'مهمة' : 'tasks'}</>
              : <><Circle className="w-3 h-3" /> {isAr ? 'لا توجد مهام' : 'No tasks yet'}</>
            }
          </span>
          <span className={cn('font-medium', PRIORITY_COLORS[initiative.priority])}>{progress}%</span>
        </div>
        <Progress value={progress} className="h-1.5" />
      </div>

      {/* Meta */}
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className={cn('flex items-center gap-1', PRIORITY_COLORS[initiative.priority])}>
          <Flag className="w-3 h-3" />
          {isAr
            ? ({ low: 'منخفضة', medium: 'متوسطة', high: 'عالية', critical: 'حرجة' })[initiative.priority]
            : initiative.priority
          }
        </span>
        {initiative.due_date && (
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {format(new Date(initiative.due_date), 'dd MMM', { locale: isAr ? ar : undefined })}
          </span>
        )}
      </div>
    </div>
  );
}

// ── Main Tab ──────────────────────────────────────────────────────────────────

interface InitiativesTabProps {
  goalId?: string;
  projectId?: string;
  areaId?: string;
}

export function InitiativesTab({ goalId, projectId, areaId }: InitiativesTabProps) {
  const { currentLanguage } = useLanguage();
  const isAr = currentLanguage === 'ar';

  const [formOpen, setFormOpen]           = useState(false);
  const [editing, setEditing]             = useState<Initiative | null>(null);
  const [filterStatus, setFilterStatus]   = useState<InitiativeStatus | 'all'>('all');

  const { data: initiatives = [], isLoading } = useInitiatives({ goal_id: goalId, project_id: projectId, area_id: areaId });
  const taskCounts = useInitiativeTaskCounts(initiatives.map(i => i.id));
  const deleteInitiative = useDeleteInitiative();

  const filtered = filterStatus === 'all' ? initiatives : initiatives.filter(i => i.status === filterStatus);

  const handleDelete = async (id: string) => {
    try {
      await deleteInitiative.mutateAsync(id);
      toast.success(isAr ? 'تم الحذف' : 'Deleted');
    } catch { toast.error(isAr ? 'حدث خطأ' : 'Error'); }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold text-sm">{isAr ? 'المبادرات' : 'Initiatives'}</p>
          <p className="text-xs text-muted-foreground">
            {initiatives.length} {isAr ? 'مبادرة' : 'initiatives'} ·{' '}
            {initiatives.filter(i => i.status === 'completed').length} {isAr ? 'مكتملة' : 'completed'}
          </p>
        </div>
        <Button variant="gold" size="sm" onClick={() => { setEditing(null); setFormOpen(true); }} className="gap-1.5">
          <Plus className="w-3.5 h-3.5" />
          {isAr ? 'مبادرة جديدة' : 'New Initiative'}
        </Button>
      </div>

      {/* Filter chips */}
      {initiatives.length > 3 && (
        <div className="flex gap-2 flex-wrap">
          {(['all', 'active', 'in_progress', 'completed', 'on_hold'] as const).map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={cn(
                'px-3 py-1 rounded-full text-xs font-medium border transition-all',
                filterStatus === s
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-muted/30 border-border/50 text-muted-foreground hover:bg-muted/50',
              )}
            >
              {s === 'all' ? (isAr ? 'الكل' : 'All')
               : s === 'active' ? (isAr ? 'نشطة' : 'Active')
               : s === 'in_progress' ? (isAr ? 'قيد التنفيذ' : 'In Progress')
               : s === 'completed' ? (isAr ? 'مكتملة' : 'Completed')
               : (isAr ? 'معلقة' : 'On Hold')}
            </button>
          ))}
        </div>
      )}

      {/* List */}
      {filtered.length === 0 ? (
        <div className="text-center py-14 text-muted-foreground">
          <Zap className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="font-medium">{isAr ? 'لا توجد مبادرات' : 'No initiatives yet'}</p>
          <p className="text-xs mt-1 max-w-xs mx-auto">
            {isAr
              ? 'المبادرات هي الجسر بين أهدافك الكبرى والمهام اليومية'
              : 'Initiatives bridge your goals and daily tasks'}
          </p>
          <Button variant="outline" size="sm" className="mt-4 gap-1.5" onClick={() => { setEditing(null); setFormOpen(true); }}>
            <Plus className="w-3.5 h-3.5" />
            {isAr ? 'أضف أول مبادرة' : 'Add first initiative'}
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(initiative => (
            <InitiativeCard
              key={initiative.id}
              initiative={initiative}
              taskCount={taskCounts.data?.[initiative.id]?.total ?? 0}
              doneCount={taskCounts.data?.[initiative.id]?.done ?? 0}
              isAr={isAr}
              onEdit={() => { setEditing(initiative); setFormOpen(true); }}
              onDelete={() => handleDelete(initiative.id)}
            />
          ))}
        </div>
      )}

      {/* Summary stats (if any) */}
      {initiatives.length > 0 && (
        <div className="glass-card p-4">
          <div className="grid grid-cols-3 gap-3 text-center">
            {[
              { label: isAr ? 'إجمالي' : 'Total', value: initiatives.length, color: 'text-foreground' },
              { label: isAr ? 'قيد التنفيذ' : 'Active', value: initiatives.filter(i => ['active','in_progress'].includes(i.status)).length, color: 'text-primary' },
              { label: isAr ? 'مكتملة' : 'Done', value: initiatives.filter(i => i.status === 'completed').length, color: 'text-success' },
            ].map(s => (
              <div key={s.label}>
                <p className={cn('text-xl font-bold', s.color)}>{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Form dialog */}
      <InitiativeFormDialog
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditing(null); }}
        goalId={goalId}
        projectId={projectId}
        areaId={areaId}
        initiative={editing ?? undefined}
        isAr={isAr}
      />
    </div>
  );
}
