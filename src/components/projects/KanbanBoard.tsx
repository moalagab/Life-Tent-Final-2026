import { useState } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { useTasks, useUpdateTask, Task } from '@/hooks/useTasks';
import { cn } from '@/lib/utils';
import { 
  CheckCircle, Circle, Clock, AlertCircle, 
  Flag, MoreHorizontal, Plus, Loader2 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface KanbanBoardProps {
  projectId: string;
  tasks: Task[];
  onAddTask?: () => void;
}

const COLUMNS = [
  { id: 'backlog', icon: Circle, color: 'text-muted-foreground' },
  { id: 'todo', icon: Clock, color: 'text-blue-500' },
  { id: 'in_progress', icon: AlertCircle, color: 'text-warning' },
  { id: 'review', icon: AlertCircle, color: 'text-purple-500' },
  { id: 'done', icon: CheckCircle, color: 'text-success' },
];

const priorityColors: Record<string, string> = {
  urgent: 'border-l-destructive bg-destructive/5',
  high: 'border-l-warning bg-warning/5',
  medium: 'border-l-blue-500 bg-blue-500/5',
  low: 'border-l-muted-foreground bg-muted/30',
};

export function KanbanBoard({ projectId, tasks, onAddTask }: KanbanBoardProps) {
  const { t, currentLanguage } = useLanguage();
  const updateTask = useUpdateTask();
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);

  const columnLabels: Record<string, string> = {
    backlog: t('tasks.backlog'),
    todo: t('tasks.todo'),
    in_progress: t('tasks.inProgress'),
    review: t('tasks.review'),
    done: t('tasks.done'),
  };

  const getTasksForColumn = (status: string) => {
    return tasks.filter(task => task.status === status);
  };

  const handleDragStart = (task: Task) => {
    setDraggedTask(task);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (status: string) => {
    if (!draggedTask || draggedTask.status === status) {
      setDraggedTask(null);
      return;
    }

    try {
      await updateTask.mutateAsync({
        id: draggedTask.id,
        status: status as 'backlog' | 'todo' | 'in_progress' | 'review' | 'done',
        completed_at: status === 'done' ? new Date().toISOString() : null,
      });
    } catch (error) {
      console.error('Failed to update task status');
    }
    
    setDraggedTask(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground">
          {currentLanguage === 'ar' ? 'لوحة كانبان' : 'Kanban Board'}
        </h3>
        {onAddTask && (
          <Button size="sm" variant="outline" onClick={onAddTask}>
            <Plus className="w-4 h-4 me-1" />
            {t('tasks.newTask')}
          </Button>
        )}
      </div>

      <div className="grid grid-cols-5 gap-3 overflow-x-auto">
        {COLUMNS.map((column) => {
          const Icon = column.icon;
          const columnTasks = getTasksForColumn(column.id);
          
          return (
            <div
              key={column.id}
              className="min-w-[200px]"
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(column.id)}
            >
              {/* Column Header */}
              <div className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-t-lg bg-muted/50 border-b border-border',
                column.color
              )}>
                <Icon className="w-4 h-4" />
                <span className="text-sm font-medium">{columnLabels[column.id]}</span>
                <span className="ms-auto text-xs bg-muted px-1.5 py-0.5 rounded">
                  {columnTasks.length}
                </span>
              </div>
              
              {/* Tasks */}
              <div className="bg-muted/20 rounded-b-lg p-2 min-h-[200px] space-y-2">
                {columnTasks.map((task) => (
                  <TaskCard 
                    key={task.id} 
                    task={task}
                    onDragStart={() => handleDragStart(task)}
                    isDragging={draggedTask?.id === task.id}
                  />
                ))}
                
                {columnTasks.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-8">
                    {currentLanguage === 'ar' ? 'اسحب المهام هنا' : 'Drop tasks here'}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface TaskCardProps {
  task: Task;
  onDragStart: () => void;
  isDragging: boolean;
}

function TaskCard({ task, onDragStart, isDragging }: TaskCardProps) {
  const { t } = useLanguage();
  const priority = task.priority || 'medium';
  
  const priorityLabels: Record<string, string> = {
    urgent: 'عاجل',
    high: t('tasks.priority.high'),
    medium: t('tasks.priority.medium'),
    low: t('tasks.priority.low'),
  };

  return (
    <div
      draggable
      onDragStart={onDragStart}
      className={cn(
        'p-3 rounded-lg border-l-4 cursor-grab active:cursor-grabbing transition-all',
        priorityColors[priority],
        isDragging && 'opacity-50 scale-95'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <h4 className="text-sm font-medium text-foreground line-clamp-2">
          {task.title}
        </h4>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0">
              <MoreHorizontal className="w-3 h-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>{t('common.edit')}</DropdownMenuItem>
            <DropdownMenuItem className="text-destructive">{t('common.delete')}</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      <div className="flex items-center gap-2 mt-2">
        <span className={cn(
          'flex items-center gap-1 text-xs px-1.5 py-0.5 rounded',
          priority === 'urgent' || priority === 'high' 
            ? 'text-destructive bg-destructive/10' 
            : 'text-muted-foreground bg-muted'
        )}>
          <Flag className="w-3 h-3" />
          {priorityLabels[priority]}
        </span>
        
        {task.due_date && (
          <span className="text-xs text-muted-foreground">
            {new Date(task.due_date).toLocaleDateString('ar-SA')}
          </span>
        )}
      </div>
    </div>
  );
}
