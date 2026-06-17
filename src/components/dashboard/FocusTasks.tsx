import { useState } from 'react';
import { Check, Trash2, Edit3, Loader2, CheckCircle2, ListTodo, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/hooks/useLanguage';
import { useTasks, useUpdateTask, useDeleteTask, useCreateTask } from '@/hooks/useTasks';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { DashboardWidgetShell, DashboardEmptyState } from './DashboardWidgetShell';

const priorityConfig = {
  high: { color: 'bg-destructive', ring: 'ring-destructive/30' },
  medium: { color: 'bg-primary', ring: 'ring-primary/30' },
  low: { color: 'bg-muted-foreground', ring: 'ring-muted-foreground/30' },
  urgent: { color: 'bg-destructive', ring: 'ring-destructive/30' },
};

export function FocusTasks() {
  const { t, currentLanguage } = useLanguage();
  const { data: allTasks, isLoading } = useTasks();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  const createTask = useCreateTask();
  const [editingTask,  setEditingTask]  = useState<{ id: string; title: string } | null>(null);
  const [addingTask,   setAddingTask]   = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  const handleCreate = async () => {
    if (!newTaskTitle.trim()) return;
    try {
      await createTask.mutateAsync({ title: newTaskTitle.trim(), status: 'todo', is_focus: true });
      toast.success(currentLanguage === 'ar' ? 'تم إضافة المهمة' : 'Task added');
      setNewTaskTitle('');
      setAddingTask(false);
    } catch { toast.error(t('common.error')); }
  };

  const tasks = allTasks?.filter(task => task.is_focus || task.status === 'todo').slice(0, 4) || [];
  const completedCount = tasks.filter(t => t.status === 'done').length;
  const progressPercentage = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  const toggleTask = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'done' ? 'todo' : 'done';
    try {
      await updateTask.mutateAsync({ id, status: newStatus });
    } catch {
      toast.error(t('common.error'));
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteTask.mutateAsync(id);
      toast.success(t('tasks.taskDeleted'));
    } catch {
      toast.error(t('common.error'));
    }
  };

  const handleEdit = async () => {
    if (!editingTask) return;
    try {
      await updateTask.mutateAsync({ id: editingTask.id, title: editingTask.title });
      toast.success(t('tasks.taskUpdated'));
      setEditingTask(null);
    } catch {
      toast.error(t('common.error'));
    }
  };

  if (isLoading) {
    return (
      <DashboardWidgetShell
        title={t('dashboard.focusTasks')}
        subtitle={`0/0 ${currentLanguage === 'ar' ? 'مكتمل' : 'done'}`}
        icon={ListTodo}
        iconColor="text-primary"
        iconBg="bg-primary/10"
        linkTo="/tasks"
        linkText={t('common.viewAll')}
      >
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
        </div>
      </DashboardWidgetShell>
    );
  }

  return (
    <DashboardWidgetShell
      title={t('dashboard.focusTasks')}
      subtitle={`${completedCount}/${tasks.length} ${currentLanguage === 'ar' ? 'مكتمل' : 'done'}`}
      icon={ListTodo}
      iconColor="text-primary"
      iconBg="bg-primary/10"
      linkTo="/tasks"
      linkText={t('common.viewAll')}
      headerAction={
        <button
          onClick={() => setAddingTask(true)}
          className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-primary"
          title={currentLanguage === 'ar' ? 'إضافة مهمة' : 'Add task'}
        >
          <Plus className="w-4 h-4" />
        </button>
      }
    >
      {tasks.length > 0 ? (
        <>
          {/* Tasks List */}
          <div className="space-y-1.5">
            {tasks.map((task) => {
              const isCompleted = task.status === 'done';
              const priority = priorityConfig[task.priority || 'medium'];
              
              return (
                <div
                  key={task.id}
                  className={cn(
                    'group flex items-start gap-2.5 p-2.5 rounded-xl transition-all duration-200',
                    'hover:bg-muted/40 cursor-pointer',
                    isCompleted && 'opacity-50'
                  )}
                >
                  {/* Checkbox */}
                  <button
                    onClick={() => toggleTask(task.id, task.status || 'todo')}
                    className={cn(
                      'relative w-4.5 h-4.5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 transition-all duration-200',
                      isCompleted 
                        ? 'bg-primary text-primary-foreground' 
                        : cn('border-2 border-muted-foreground/40 group-hover:border-primary', priority.ring)
                    )}
                  >
                    {isCompleted && <Check className="w-2.5 h-2.5" />}
                    {!isCompleted && (
                      <span className={cn('w-1.5 h-1.5 rounded-full', priority.color)} />
                    )}
                  </button>
                  
                  {/* Task Content */}
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      'text-sm font-medium transition-all leading-tight',
                      isCompleted ? 'line-through text-muted-foreground' : 'text-foreground'
                    )}>
                      {task.title}
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => { e.stopPropagation(); setEditingTask({ id: task.id, title: task.title }); }}
                      className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                    >
                      <Edit3 className="w-3 h-3 text-muted-foreground" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(task.id); }}
                      className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors"
                    >
                      <Trash2 className="w-3 h-3 text-destructive" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Progress */}
          <div className="flex items-center gap-3 mt-4 pt-3 border-t border-border/40">
            <div className="relative w-12 h-12">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="14" fill="none" className="stroke-muted" strokeWidth="3" />
                <circle
                  cx="18" cy="18" r="14" fill="none"
                  className="stroke-primary"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray={`${progressPercentage}, 100`}
                  style={{ transition: 'stroke-dasharray 0.5s ease-out' }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-bold text-primary">{progressPercentage}%</span>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                {currentLanguage === 'ar' ? 'التقدم' : 'Progress'}
              </p>
              <p className="text-xs text-muted-foreground">
                {tasks.length - completedCount} {currentLanguage === 'ar' ? 'متبقية' : 'left'}
              </p>
            </div>
          </div>
        </>
      ) : (
        <DashboardEmptyState
          icon={CheckCircle2}
          message={t('tasks.noTasks')}
        />
      )}

      {/* Create Dialog */}
      <Dialog open={addingTask} onOpenChange={v => { setAddingTask(v); setNewTaskTitle(''); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Plus className="w-4 h-4 text-primary" />
              </div>
              {currentLanguage === 'ar' ? 'مهمة جديدة' : 'New Task'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <Input
              autoFocus
              value={newTaskTitle}
              onChange={e => setNewTaskTitle(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleCreate(); }}
              placeholder={t('tasks.taskTitle')}
              className="bg-muted/50"
            />
            <Button onClick={handleCreate} className="w-full" disabled={createTask.isPending || !newTaskTitle.trim()}>
              {createTask.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : (currentLanguage === 'ar' ? 'إضافة' : 'Add')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingTask} onOpenChange={() => setEditingTask(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Edit3 className="w-4 h-4 text-primary" />
              </div>
              {t('tasks.editTask')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <Input
              value={editingTask?.title || ''}
              onChange={(e) => setEditingTask(prev => prev ? { ...prev, title: e.target.value } : null)}
              placeholder={t('tasks.taskTitle')}
              className="bg-muted/50"
            />
            <Button onClick={handleEdit} className="w-full" disabled={updateTask.isPending}>
              {updateTask.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : t('common.save')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardWidgetShell>
  );
}