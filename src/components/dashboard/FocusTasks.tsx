import { useState } from 'react';
import { Check, ArrowUpRight, Flag, Trash2, Edit3, Loader2, CheckCircle2, Circle, ListTodo } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/hooks/useLanguage';
import { useTasks, useUpdateTask, useDeleteTask } from '@/hooks/useTasks';
import { Link } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

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

  const [editingTask, setEditingTask] = useState<{ id: string; title: string } | null>(null);

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
      <div className="relative overflow-hidden rounded-2xl bg-card/50 backdrop-blur-xl border border-border/50 p-5 h-full flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const progressPercentage = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-card/50 backdrop-blur-xl border border-border/50 p-5 h-full">
      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl" />
      
      <div className="relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <ListTodo className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">{t('dashboard.focusTasks')}</h3>
              <p className="text-xs text-muted-foreground">{completedCount}/{tasks.length} {currentLanguage === 'ar' ? 'مكتمل' : 'completed'}</p>
            </div>
          </div>
          <Link 
            to="/tasks" 
            className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-primary transition-colors group"
          >
            {t('common.viewAll')} 
            <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>

        {tasks.length > 0 ? (
          <>
            {/* Tasks List */}
            <div className="space-y-2">
              {tasks.map((task, index) => {
                const isCompleted = task.status === 'done';
                const priority = priorityConfig[task.priority || 'medium'];
                
                return (
                  <div
                    key={task.id}
                    className={cn(
                      'group flex items-start gap-3 p-3 rounded-xl transition-all duration-300',
                      'hover:bg-muted/50 cursor-pointer',
                      isCompleted && 'opacity-60'
                    )}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    {/* Checkbox */}
                    <button
                      onClick={() => toggleTask(task.id, task.status || 'todo')}
                      className={cn(
                        'relative w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 transition-all duration-300',
                        isCompleted 
                          ? 'bg-primary text-primary-foreground' 
                          : cn('border-2 border-muted-foreground/50 group-hover:border-primary', priority.ring)
                      )}
                    >
                      {isCompleted && <Check className="w-3 h-3" />}
                      {!isCompleted && (
                        <span className={cn('w-2 h-2 rounded-full', priority.color)} />
                      )}
                    </button>
                    
                    {/* Task Content */}
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        'text-sm font-medium transition-all',
                        isCompleted ? 'line-through text-muted-foreground' : 'text-foreground'
                      )}>
                        {task.title}
                      </p>
                      {task.project_id && (
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground mt-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary/50" />
                          {t('tasks.project')}
                        </span>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300">
                      <button
                        onClick={(e) => { e.stopPropagation(); setEditingTask({ id: task.id, title: task.title }); }}
                        className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-muted-foreground" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(task.id); }}
                        className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-destructive" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Progress Ring */}
            <div className="flex items-center justify-center mt-6 pt-4 border-t border-border/50">
              <div className="relative w-16 h-16">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <circle
                    cx="18"
                    cy="18"
                    r="15"
                    fill="none"
                    className="stroke-muted"
                    strokeWidth="3"
                  />
                  <circle
                    cx="18"
                    cy="18"
                    r="15"
                    fill="none"
                    className="stroke-primary"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray={`${progressPercentage}, 100`}
                    style={{ transition: 'stroke-dasharray 0.7s ease-out' }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-bold gold-text">{progressPercentage}%</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-foreground">
                  {currentLanguage === 'ar' ? 'تقدم اليوم' : "Today's Progress"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {tasks.length - completedCount} {currentLanguage === 'ar' ? 'متبقية' : 'remaining'}
                </p>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-sm">{t('tasks.noTasks')}</p>
          </div>
        )}
      </div>

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
    </div>
  );
}
