import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { useLanguage } from '@/hooks/useLanguage';
import { useTasks, useUpdateTask, useDeleteTask } from '@/hooks/useTasks';
import { useProjects } from '@/hooks/useProjects';
import { useAreas } from '@/hooks/useAreas';
import { useGoals } from '@/hooks/useGoals';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { ar } from 'date-fns/locale';
import { toast } from 'sonner';
import {
  ArrowRight, Pencil, Check, X, Trash2, Target,
  FolderKanban, MapPin, Flag, Calendar, Clock,
  CheckSquare, Loader2, AlertTriangle, Star,
} from 'lucide-react';

// ── Config maps ───────────────────────────────────────────────────────────────

type TaskStatus   = 'backlog' | 'todo' | 'in_progress' | 'review' | 'done' | 'archived';
type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

function getStatusCfg(isAr: boolean): Record<TaskStatus, { label: string; color: string; bg: string }> {
  return {
    backlog:     { label: isAr ? 'قائمة الانتظار' : 'Backlog',     color: 'text-slate-500',  bg: 'bg-slate-500/10'  },
    todo:        { label: isAr ? 'للتنفيذ'        : 'To Do',        color: 'text-blue-500',   bg: 'bg-blue-500/10'   },
    in_progress: { label: isAr ? 'قيد التنفيذ'    : 'In Progress',  color: 'text-amber-500',  bg: 'bg-amber-500/10'  },
    review:      { label: isAr ? 'مراجعة'         : 'Review',       color: 'text-purple-500', bg: 'bg-purple-500/10' },
    done:        { label: isAr ? 'مكتمل'          : 'Done',         color: 'text-emerald-500', bg: 'bg-emerald-500/10'},
    archived:    { label: isAr ? 'مؤرشف'          : 'Archived',     color: 'text-muted-foreground', bg: 'bg-muted/50' },
  };
}

function getPriorityCfg(isAr: boolean): Record<TaskPriority, { label: string; color: string; icon: string }> {
  return {
    low:    { label: isAr ? 'منخفض'  : 'Low',    color: 'text-slate-400',  icon: '↓' },
    medium: { label: isAr ? 'متوسط'  : 'Medium', color: 'text-blue-500',   icon: '→' },
    high:   { label: isAr ? 'مرتفع'  : 'High',   color: 'text-amber-500',  icon: '↑' },
    urgent: { label: isAr ? 'عاجل'   : 'Urgent', color: 'text-red-500',    icon: '⚡' },
  };
}

// ── Main component ────────────────────────────────────────────────────────────

export default function TaskWorkspace() {
  const { id } = useParams<{ id: string }>();
  const navigate  = useNavigate();
  const { currentLanguage } = useLanguage();
  const isAr = currentLanguage === 'ar';
  const dateLocale = isAr ? ar : undefined;

  const STATUS_CFG   = getStatusCfg(isAr);
  const PRIORITY_CFG = getPriorityCfg(isAr);

  const { data: tasks }    = useTasks();
  const { data: projects } = useProjects();
  const { data: areas }    = useAreas();
  const { data: goals }    = useGoals();
  const updateTask  = useUpdateTask();
  const deleteTask  = useDeleteTask();

  // Edit state
  const [editTitle, setEditTitle]       = useState('');
  const [editDesc,  setEditDesc]        = useState('');
  const [isEditingTitle, setEditingTitle] = useState(false);
  const [isEditingDesc,  setEditingDesc ] = useState(false);

  const task = tasks?.find(t => t.id === id);
  const linkedProject = projects?.find(p => p.id === task?.project_id);
  const linkedArea    = areas?.find(a => a.id === task?.area_id);
  const linkedGoal    = goals?.find(g => g.id === task?.kr_id);

  // ── Loading / not found ─────────────────────────────────────────────────────
  if (!tasks) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </MainLayout>
    );
  }

  if (!task) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center h-64 gap-3">
          <AlertTriangle className="w-12 h-12 text-muted-foreground/30" />
          <p className="text-muted-foreground">{isAr ? 'المهمة غير موجودة' : 'Task not found'}</p>
          <Button variant="outline" onClick={() => navigate('/tasks')}>
            {isAr ? 'العودة للمهام' : 'Back to Tasks'}
          </Button>
        </div>
      </MainLayout>
    );
  }

  const status   = (task.status   ?? 'todo')   as TaskStatus;
  const priority = (task.priority ?? 'medium') as TaskPriority;
  const statusCfg   = STATUS_CFG[status];
  const priorityCfg = PRIORITY_CFG[priority];

  // ── Handlers ────────────────────────────────────────────────────────────────

  function startEditTitle() { setEditTitle(task.title); setEditingTitle(true); }
  function cancelEditTitle() { setEditingTitle(false); }
  async function saveTitle() {
    if (!editTitle.trim()) return;
    await updateTask.mutateAsync({ id: task.id, title: editTitle.trim() });
    setEditingTitle(false);
    toast.success(isAr ? 'تم الحفظ' : 'Saved');
  }

  function startEditDesc() { setEditDesc(task.description ?? ''); setEditingDesc(true); }
  function cancelEditDesc() { setEditingDesc(false); }
  async function saveDesc() {
    await updateTask.mutateAsync({ id: task.id, description: editDesc || null });
    setEditingDesc(false);
    toast.success(isAr ? 'تم الحفظ' : 'Saved');
  }

  async function changeStatus(s: TaskStatus) {
    await updateTask.mutateAsync({ id: task.id, status: s });
    toast.success(isAr ? 'تم تحديث الحالة' : 'Status updated');
  }

  async function changePriority(p: TaskPriority) {
    await updateTask.mutateAsync({ id: task.id, priority: p });
    toast.success(isAr ? 'تم تحديث الأولوية' : 'Priority updated');
  }

  async function toggleFocus() {
    await updateTask.mutateAsync({ id: task.id, is_focus: !task.is_focus });
    toast.success(task.is_focus
      ? (isAr ? 'أُزيل من التركيز' : 'Removed from focus')
      : (isAr ? 'أُضيف للتركيز'    : 'Added to focus'));
  }

  async function handleDelete() {
    if (!confirm(isAr ? 'حذف هذه المهمة؟' : 'Delete this task?')) return;
    await deleteTask.mutateAsync(task.id);
    navigate('/tasks');
    toast.success(isAr ? 'تم الحذف' : 'Deleted');
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto space-y-5 pb-10">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <button onClick={() => navigate('/tasks')} className="hover:text-foreground transition-colors">
            {isAr ? 'المهام' : 'Tasks'}
          </button>
          <ArrowRight className={cn('w-3.5 h-3.5', isAr && 'rotate-180')} />
          <span className="text-foreground font-medium truncate max-w-[200px]">{task.title}</span>
        </div>

        {/* Header card */}
        <div
          className="glass-card p-5 relative overflow-hidden"
          style={{ borderTop: `3px solid ${priorityCfg.color.replace('text-', 'hsl(var(--')}` }}
        >
          <div
            className="absolute inset-0 opacity-[0.03] pointer-events-none"
            style={{ background: 'radial-gradient(60% 60% at 80% 20%, var(--primary), transparent)' }}
          />
          <div className="relative space-y-3">
            {/* Title */}
            <div className="flex items-start gap-2">
              <CheckSquare className="w-5 h-5 text-primary mt-0.5 shrink-0" />
              {isEditingTitle ? (
                <div className="flex-1 flex items-start gap-2">
                  <input
                    className="flex-1 text-xl font-black bg-transparent border-b border-primary/40 focus:border-primary outline-none text-foreground"
                    value={editTitle}
                    onChange={e => setEditTitle(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') saveTitle(); if (e.key === 'Escape') cancelEditTitle(); }}
                    autoFocus
                  />
                  <button onClick={saveTitle} className="p-1 hover:text-emerald-500 transition-colors"><Check className="w-4 h-4" /></button>
                  <button onClick={cancelEditTitle} className="p-1 hover:text-red-500 transition-colors"><X className="w-4 h-4" /></button>
                </div>
              ) : (
                <button
                  className="flex-1 text-xl font-black text-foreground text-start hover:text-primary transition-colors"
                  onClick={startEditTitle}
                >
                  {task.title}
                </button>
              )}
              {task.is_focus && (
                <Star className="w-4 h-4 text-amber-500 fill-amber-500 shrink-0 mt-1" />
              )}
            </div>

            {/* Status + Priority row */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Status pills */}
              <div className="flex flex-wrap gap-1">
                {(Object.keys(STATUS_CFG) as TaskStatus[]).filter(s => s !== 'archived').map(s => (
                  <button
                    key={s}
                    onClick={() => changeStatus(s)}
                    className={cn(
                      'text-[10px] font-bold px-2 py-0.5 rounded-full border transition-all',
                      status === s
                        ? `${STATUS_CFG[s].color} ${STATUS_CFG[s].bg} border-current/30 ring-1 ring-current/20`
                        : 'text-muted-foreground border-border/50 hover:border-muted-foreground/50',
                    )}
                  >
                    {STATUS_CFG[s].label}
                  </button>
                ))}
              </div>

              <span className="text-border/60">·</span>

              {/* Priority pills */}
              <div className="flex gap-1">
                {(Object.keys(PRIORITY_CFG) as TaskPriority[]).map(p => (
                  <button
                    key={p}
                    onClick={() => changePriority(p)}
                    className={cn(
                      'text-[10px] font-bold px-2 py-0.5 rounded-full border transition-all',
                      priority === p
                        ? `${PRIORITY_CFG[p].color} bg-current/10 border-current/30 ring-1 ring-current/20`
                        : 'text-muted-foreground border-border/50 hover:border-muted-foreground/50',
                    )}
                  >
                    {PRIORITY_CFG[p].icon} {PRIORITY_CFG[p].label}
                  </button>
                ))}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 pt-1">
              <Button
                size="sm"
                variant="outline"
                className={cn('gap-1.5 text-xs', task.is_focus && 'border-amber-500/50 text-amber-600')}
                onClick={toggleFocus}
              >
                <Star className={cn('w-3.5 h-3.5', task.is_focus && 'fill-amber-500 text-amber-500')} />
                {task.is_focus ? (isAr ? 'إزالة التركيز' : 'Unstar') : (isAr ? 'تمييز' : 'Star')}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 text-xs text-destructive hover:text-destructive"
                onClick={handleDelete}
              >
                <Trash2 className="w-3.5 h-3.5" />
                {isAr ? 'حذف' : 'Delete'}
              </Button>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="glass-card p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-muted-foreground uppercase tracking-widest">
              {isAr ? 'الوصف' : 'Description'}
            </span>
            {!isEditingDesc && (
              <button onClick={startEditDesc} className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
                <Pencil className="w-3 h-3" />
                {isAr ? 'تعديل' : 'Edit'}
              </button>
            )}
          </div>
          {isEditingDesc ? (
            <div className="space-y-2">
              <Textarea
                value={editDesc}
                onChange={e => setEditDesc(e.target.value)}
                placeholder={isAr ? 'أضف وصفاً...' : 'Add a description...'}
                className="min-h-[100px] text-sm resize-none"
                autoFocus
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={saveDesc} disabled={updateTask.isPending}>{isAr ? 'حفظ' : 'Save'}</Button>
                <Button size="sm" variant="ghost" onClick={cancelEditDesc}>{isAr ? 'إلغاء' : 'Cancel'}</Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground whitespace-pre-wrap min-h-[40px]">
              {task.description || (isAr ? 'لا يوجد وصف.' : 'No description.')}
            </p>
          )}
        </div>

        {/* Meta grid */}
        <div className="grid grid-cols-2 gap-3">
          {task.due_date && (
            <div className="glass-card p-4 flex items-center gap-3">
              <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
              <div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                  {isAr ? 'تاريخ الاستحقاق' : 'Due Date'}
                </div>
                <div className="text-sm font-bold text-foreground">
                  {format(parseISO(task.due_date), 'dd MMM yyyy', { locale: dateLocale })}
                </div>
              </div>
            </div>
          )}
          {task.due_time && (
            <div className="glass-card p-4 flex items-center gap-3">
              <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
              <div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                  {isAr ? 'الوقت' : 'Time'}
                </div>
                <div className="text-sm font-bold text-foreground">{task.due_time}</div>
              </div>
            </div>
          )}
          {task.category && (
            <div className="glass-card p-4 flex items-center gap-3">
              <Flag className="w-4 h-4 text-muted-foreground shrink-0" />
              <div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                  {isAr ? 'التصنيف' : 'Category'}
                </div>
                <div className="text-sm font-bold text-foreground">{task.category}</div>
              </div>
            </div>
          )}
          <div className="glass-card p-4 flex items-center gap-3">
            <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
            <div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                {isAr ? 'تاريخ الإنشاء' : 'Created'}
              </div>
              <div className="text-sm font-bold text-foreground">
                {format(parseISO(task.created_at), 'dd MMM yyyy', { locale: dateLocale })}
              </div>
            </div>
          </div>
        </div>

        {/* Relations */}
        {(linkedProject || linkedArea || linkedGoal) && (
          <div className="glass-card p-4 space-y-3">
            <div className="text-xs font-black text-muted-foreground uppercase tracking-widest">
              {isAr ? 'الروابط' : 'Relations'}
            </div>
            <div className="space-y-2">
              {linkedProject && (
                <button
                  onClick={() => navigate(`/projects/${linkedProject.id}`)}
                  className="w-full flex items-center gap-3 p-2.5 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors text-start"
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${linkedProject.color ?? '#6366f1'}20` }}
                  >
                    <FolderKanban className="w-4 h-4" style={{ color: linkedProject.color ?? '#6366f1' }} />
                  </div>
                  <div>
                    <div className="text-[10px] text-muted-foreground">{isAr ? 'مشروع' : 'Project'}</div>
                    <div className="text-sm font-semibold text-foreground">{linkedProject.title}</div>
                  </div>
                  <ArrowRight className={cn('w-3.5 h-3.5 text-muted-foreground ms-auto', isAr && 'rotate-180')} />
                </button>
              )}
              {linkedArea && (
                <button
                  onClick={() => navigate(`/areas/${linkedArea.id}`)}
                  className="w-full flex items-center gap-3 p-2.5 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors text-start"
                >
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div>
                    <div className="text-[10px] text-muted-foreground">{isAr ? 'مجال' : 'Area'}</div>
                    <div className="text-sm font-semibold text-foreground">{linkedArea.name}</div>
                  </div>
                  <ArrowRight className={cn('w-3.5 h-3.5 text-muted-foreground ms-auto', isAr && 'rotate-180')} />
                </button>
              )}
              {linkedGoal && (
                <button
                  onClick={() => navigate(`/goals/${linkedGoal.id}`)}
                  className="w-full flex items-center gap-3 p-2.5 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors text-start"
                >
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0">
                    <Target className="w-4 h-4 text-purple-500" />
                  </div>
                  <div>
                    <div className="text-[10px] text-muted-foreground">{isAr ? 'هدف' : 'Goal'}</div>
                    <div className="text-sm font-semibold text-foreground">{linkedGoal.title}</div>
                  </div>
                  <ArrowRight className={cn('w-3.5 h-3.5 text-muted-foreground ms-auto', isAr && 'rotate-180')} />
                </button>
              )}
            </div>
          </div>
        )}

      </div>
    </MainLayout>
  );
}
