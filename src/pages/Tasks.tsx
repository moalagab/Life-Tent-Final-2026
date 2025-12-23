import { MainLayout } from '@/components/layout/MainLayout';
import { Plus, Filter, Search, MoreHorizontal, Flag, Calendar, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Task {
  id: string;
  title: string;
  status: 'backlog' | 'todo' | 'in-progress' | 'review' | 'done';
  priority: 'high' | 'medium' | 'low';
  project?: string;
  dueDate?: string;
  assignee?: string;
}

const mockTasks: Record<string, Task[]> = {
  backlog: [
    { id: '1', title: 'Research competitor pricing', status: 'backlog', priority: 'low', project: 'Strategy' },
  ],
  todo: [
    { id: '2', title: 'Finalize Q4 budget proposal', status: 'todo', priority: 'high', project: 'Finance', dueDate: 'Dec 20' },
    { id: '3', title: 'Review team performance reports', status: 'todo', priority: 'medium', project: 'HR', dueDate: 'Dec 22' },
  ],
  'in-progress': [
    { id: '4', title: 'Prepare board presentation', status: 'in-progress', priority: 'high', project: 'Strategy', dueDate: 'Dec 18' },
    { id: '5', title: 'Design new dashboard mockups', status: 'in-progress', priority: 'medium', project: 'Product' },
  ],
  review: [
    { id: '6', title: 'Marketing campaign copy', status: 'review', priority: 'medium', project: 'Marketing' },
  ],
  done: [
    { id: '7', title: 'Update employee handbook', status: 'done', priority: 'low', project: 'HR' },
  ],
};

const columns = [
  { id: 'backlog', title: 'Backlog', color: 'bg-muted-foreground' },
  { id: 'todo', title: 'To Do', color: 'bg-blue-500' },
  { id: 'in-progress', title: 'In Progress', color: 'bg-primary' },
  { id: 'review', title: 'Review', color: 'bg-purple-500' },
  { id: 'done', title: 'Done', color: 'bg-success' },
];

const priorityColors = {
  high: 'text-destructive bg-destructive/10',
  medium: 'text-primary bg-primary/10',
  low: 'text-muted-foreground bg-muted',
};

export default function Tasks() {
  return (
    <MainLayout>
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Tasks</h1>
            <p className="text-muted-foreground mt-1">Drag and drop to organize your workflow</p>
          </div>
          <Button variant="gold" size="lg">
            <Plus className="w-5 h-5 mr-2" />
            New Task
          </Button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 mt-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search tasks..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-muted/50 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <Button variant="outline" size="default">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map((column) => (
          <div key={column.id} className="flex-shrink-0 w-72">
            {/* Column Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className={cn('w-3 h-3 rounded-full', column.color)} />
                <span className="font-semibold text-foreground">{column.title}</span>
                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                  {mockTasks[column.id]?.length || 0}
                </span>
              </div>
              <button className="p-1 rounded hover:bg-muted transition-colors">
                <Plus className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            {/* Tasks */}
            <div className="space-y-3">
              {mockTasks[column.id]?.map((task) => (
                <div
                  key={task.id}
                  className="glass-card p-4 hover:border-primary/30 transition-all duration-200 cursor-grab active:cursor-grabbing group"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="text-sm font-medium text-foreground group-hover:text-primary transition-colors flex-1 pr-2">
                      {task.title}
                    </h4>
                    <button className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-muted transition-all">
                      <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </div>

                  {task.project && (
                    <span className="text-xs text-muted-foreground block mb-3">
                      {task.project}
                    </span>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        'flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium',
                        priorityColors[task.priority]
                      )}>
                        <Flag className="w-3 h-3" />
                        {task.priority}
                      </span>
                    </div>
                    
                    {task.dueDate && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        {task.dueDate}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </MainLayout>
  );
}
