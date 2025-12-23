import { ArrowUpRight, Play, Pause, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Project {
  id: string;
  name: string;
  status: 'active' | 'on-hold' | 'completed';
  progress: number;
  phase: string;
  tasksCompleted: number;
  totalTasks: number;
}

const mockProjects: Project[] = [
  { id: '1', name: 'Q4 Strategic Planning', status: 'active', progress: 65, phase: 'Execution', tasksCompleted: 13, totalTasks: 20 },
  { id: '2', name: 'Product Launch Campaign', status: 'active', progress: 40, phase: 'Planning', tasksCompleted: 8, totalTasks: 20 },
  { id: '3', name: 'Office Renovation', status: 'on-hold', progress: 25, phase: 'Initiation', tasksCompleted: 5, totalTasks: 20 },
];

const statusConfig = {
  active: { icon: Play, color: 'text-success bg-success/10', label: 'Active' },
  'on-hold': { icon: Pause, color: 'text-warning bg-warning/10', label: 'On Hold' },
  completed: { icon: CheckCircle, color: 'text-muted-foreground bg-muted', label: 'Completed' },
};

export function ProjectsOverview() {
  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-lg font-semibold text-foreground">Active Projects</h3>
        <button className="text-primary text-sm font-medium hover:underline flex items-center gap-1">
          View All <ArrowUpRight className="w-3 h-3" />
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {mockProjects.map((project) => {
          const StatusIcon = statusConfig[project.status].icon;
          
          return (
            <div
              key={project.id}
              className="p-4 rounded-xl bg-muted/30 border border-border hover:border-primary/30 transition-all duration-200 group cursor-pointer"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h4 className="font-medium text-foreground group-hover:text-primary transition-colors">
                    {project.name}
                  </h4>
                  <span className="text-xs text-muted-foreground">{project.phase} Phase</span>
                </div>
                <span className={cn(
                  'flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
                  statusConfig[project.status].color
                )}>
                  <StatusIcon className="w-3 h-3" />
                  {statusConfig[project.status].label}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="mb-3">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-muted-foreground">Progress</span>
                  <span className="text-xs font-medium text-foreground">{project.progress}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all duration-500',
                      project.status === 'active' ? 'bg-gradient-gold' : 'bg-muted-foreground/50'
                    )}
                    style={{ width: `${project.progress}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{project.tasksCompleted}/{project.totalTasks} tasks</span>
                <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 text-primary transition-opacity" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
