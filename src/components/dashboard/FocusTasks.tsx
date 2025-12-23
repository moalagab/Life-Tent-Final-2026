import { useState } from 'react';
import { Check, ArrowUpRight, Flag, Trash2, Edit3, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/hooks/useLanguage';
import { useTasks, useUpdateTask, useDeleteTask } from '@/hooks/useTasks';
import { Link } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const priorityColors = {
  high: 'text-destructive',
  medium: 'text-primary',
  low: 'text-muted-foreground',
  urgent: 'text-destructive',
};

export function FocusTasks() {
  const { t, currentLanguage } = useLanguage();
  const { data: allTasks, isLoading } = useTasks();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  const [editingTask, setEditingTask] = useState<{ id: string; title: string } | null>(null);

  // Get focus tasks (is_focus = true) or first 3 tasks
  const tasks = allTasks?.filter(task => task.is_focus || task.status === 'todo').slice(0, 4) || [];
  const completedCount = tasks.filter(t => t.status === 'done').length;

  const toggleTask = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'done' ? 'todo' : 'done';
    try {
      await updateTask.mutateAsync({ id, status: newStatus });
    } catch (error) {
      toast.error(t('common.error'));
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteTask.mutateAsync(id);
      toast.success(t('tasks.taskDeleted'));
    } catch (error) {
      toast.error(t('common.error'));
    }
  };

  const handleEdit = async () => {
    if (!editingTask) return;
    try {
      await updateTask.mutateAsync({ id: editingTask.id, title: editingTask.title });
      toast.success(t('tasks.taskUpdated'));
      setEditingTask(null);
    } catch (error) {
      toast.error(t('common.error'));
    }
  };

  if (isLoading) {
    return (
      <div className="glass-card p-5 h-full flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="glass-card p-5 h-full">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-lg font-semibold text-foreground">{t('dashboard.focusTasks')}</h3>
          <p className="text-sm text-muted-foreground">{completedCount}/{tasks.length} {currentLanguage === 'ar' ? 'مكتمل' : 'completed'}</p>
        </div>
        <Link to="/tasks" className="text-primary text-sm font-medium hover:underline flex items-center gap-1">
          {t('common.viewAll')} <ArrowUpRight className="w-3 h-3" />
        </Link>
      </div>

      {tasks.length > 0 ? (
        <div className="space-y-3">
          {tasks.map((task, index) => (
            <div
              key={task.id}
              className={cn(
                'flex items-start gap-3 p-3 rounded-xl transition-all duration-200',
                'hover:bg-accent/50 group',
                task.status === 'done' && 'opacity-60'
              )}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <button
                onClick={() => toggleTask(task.id, task.status || 'todo')}
                className={cn(
                  'w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 mt-0.5',
                  task.status === 'done'
                    ? 'bg-primary border-primary' 
                    : 'border-muted-foreground group-hover:border-primary'
                )}
              >
                {task.status === 'done' && <Check className="w-3 h-3 text-primary-foreground" />}
              </button>
              
              <div className="flex-1 min-w-0">
                <p className={cn(
                  'text-sm font-medium text-foreground transition-all',
                  task.status === 'done' && 'line-through text-muted-foreground'
                )}>
                  {task.title}
                </p>
                {task.project_id && (
                  <span className="text-xs text-muted-foreground">
                    {t('tasks.project')}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => setEditingTask({ id: task.id, title: task.title })}
                  className="p-1 rounded hover:bg-muted"
                >
                  <Edit3 className="w-3 h-3 text-muted-foreground" />
                </button>
                <button
                  onClick={() => handleDelete(task.id)}
                  className="p-1 rounded hover:bg-destructive/10"
                >
                  <Trash2 className="w-3 h-3 text-destructive" />
                </button>
              </div>

              <Flag className={cn('w-4 h-4 flex-shrink-0', priorityColors[task.priority || 'medium'])} />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-muted-foreground text-sm">{t('tasks.noTasks')}</p>
        </div>
      )}

      {/* Progress Ring */}
      {tasks.length > 0 && (
        <div className="flex justify-center mt-6">
          <div className="relative w-20 h-20">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <circle
                cx="18"
                cy="18"
                r="16"
                fill="none"
                className="stroke-muted"
                strokeWidth="3"
              />
              <circle
                cx="18"
                cy="18"
                r="16"
                fill="none"
                className="stroke-primary"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={`${tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0}, 100`}
                style={{ transition: 'stroke-dasharray 0.5s ease' }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-lg font-bold gold-text">
                {tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingTask} onOpenChange={() => setEditingTask(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('tasks.editTask')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <Input
              value={editingTask?.title || ''}
              onChange={(e) => setEditingTask(prev => prev ? { ...prev, title: e.target.value } : null)}
              placeholder={t('tasks.taskTitle')}
            />
            <Button onClick={handleEdit} className="w-full" disabled={updateTask.isPending}>
              {updateTask.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : t('common.save')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
