import { MainLayout } from '@/components/layout/MainLayout';
import { Plus, Filter, Search, MoreHorizontal, Flag, Calendar, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/hooks/useLanguage';
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask, Task } from '@/hooks/useTasks';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { format } from 'date-fns';

type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'review' | 'done';

export default function Tasks() {
  const { t } = useLanguage();
  const { data: tasks, isLoading } = useTasks();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    status: 'todo' as TaskStatus,
  });

  const columns = [
    { id: 'backlog' as const, title: t('tasks.backlog'), color: 'bg-muted-foreground' },
    { id: 'todo' as const, title: t('tasks.todo'), color: 'bg-blue-500' },
    { id: 'in_progress' as const, title: t('tasks.inProgress'), color: 'bg-primary' },
    { id: 'review' as const, title: t('tasks.review'), color: 'bg-purple-500' },
    { id: 'done' as const, title: t('tasks.done'), color: 'bg-success' },
  ];

  const priorityColors: Record<string, { class: string; label: string }> = {
    high: { class: 'text-destructive bg-destructive/10', label: t('tasks.priority.high') },
    urgent: { class: 'text-destructive bg-destructive/10', label: t('tasks.priority.high') },
    medium: { class: 'text-primary bg-primary/10', label: t('tasks.priority.medium') },
    low: { class: 'text-muted-foreground bg-muted', label: t('tasks.priority.low') },
  };

  const getTasksByStatus = (status: TaskStatus) => {
    return tasks?.filter(task => task.status === status) || [];
  };

  const handleCreateTask = async () => {
    if (!newTask.title.trim()) return;
    
    try {
      await createTask.mutateAsync({
        title: newTask.title,
        priority: newTask.priority,
        status: newTask.status,
      });
      toast.success(t('common.save'));
      setIsDialogOpen(false);
      setNewTask({ title: '', priority: 'medium', status: 'todo' });
    } catch (error) {
      toast.error(t('auth.error'));
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    try {
      await updateTask.mutateAsync({
        id: taskId,
        status: newStatus,
        completed_at: newStatus === 'done' ? new Date().toISOString() : null,
      });
    } catch (error) {
      toast.error(t('auth.error'));
    }
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{t('tasks.title')}</h1>
            <p className="text-muted-foreground mt-1">{t('tasks.subtitle')}</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="gold" size="lg">
                <Plus className="w-5 h-5 me-2" />
                {t('tasks.newTask')}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('tasks.newTask')}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label>{t('tasks.title')}</Label>
                  <Input
                    value={newTask.title}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                    placeholder={t('tasks.title')}
                  />
                </div>
                <div>
                  <Label>{t('common.filter')}</Label>
                  <Select
                    value={newTask.priority}
                    onValueChange={(value: 'low' | 'medium' | 'high' | 'urgent') => 
                      setNewTask({ ...newTask, priority: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">{t('tasks.priority.low')}</SelectItem>
                      <SelectItem value="medium">{t('tasks.priority.medium')}</SelectItem>
                      <SelectItem value="high">{t('tasks.priority.high')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleCreateTask} className="w-full" disabled={createTask.isPending}>
                  {createTask.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : t('common.save')}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 mt-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder={t('tasks.searchTasks')}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-muted/50 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <Button variant="outline" size="default">
            <Filter className="w-4 h-4 me-2" />
            {t('common.filter')}
          </Button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map((column) => {
          const columnTasks = getTasksByStatus(column.id);
          
          return (
            <div key={column.id} className="flex-shrink-0 w-72">
              {/* Column Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className={cn('w-3 h-3 rounded-full', column.color)} />
                  <span className="font-semibold text-foreground">{column.title}</span>
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                    {columnTasks.length}
                  </span>
                </div>
                <button 
                  className="p-1 rounded hover:bg-muted transition-colors"
                  onClick={() => {
                    setNewTask({ ...newTask, status: column.id });
                    setIsDialogOpen(true);
                  }}
                >
                  <Plus className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              {/* Tasks */}
              <div className="space-y-3">
                {columnTasks.map((task) => (
                  <div
                    key={task.id}
                    className="glass-card p-4 hover:border-primary/30 transition-all duration-200 cursor-pointer group"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="text-sm font-medium text-foreground group-hover:text-primary transition-colors flex-1 pe-2">
                        {task.title}
                      </h4>
                      <button className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-muted transition-all">
                        <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </div>

                    {task.description && (
                      <span className="text-xs text-muted-foreground block mb-3 line-clamp-2">
                        {task.description}
                      </span>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {task.priority && (
                          <span className={cn(
                            'flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium',
                            priorityColors[task.priority]?.class || priorityColors.medium.class
                          )}>
                            <Flag className="w-3 h-3" />
                            {priorityColors[task.priority]?.label || t('tasks.priority.medium')}
                          </span>
                        )}
                      </div>
                      
                      {task.due_date && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(task.due_date), 'MMM d')}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                
                {columnTasks.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    {t('common.noData')}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </MainLayout>
  );
}