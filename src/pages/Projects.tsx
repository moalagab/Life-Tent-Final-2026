import { MainLayout } from '@/components/layout/MainLayout';
import { Plus, Filter, Search, MoreHorizontal, Play, Pause, Archive, FolderKanban } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Project {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'on-hold' | 'completed';
  phase: 'Initiation' | 'Planning' | 'Execution' | 'Monitoring' | 'Closing';
  progress: number;
  area: string;
  tasksCompleted: number;
  totalTasks: number;
  dueDate: string;
}

const mockProjects: Project[] = [
  { id: '1', name: 'Q4 Strategic Planning', description: 'Annual strategic planning for next fiscal year', status: 'active', phase: 'Execution', progress: 65, area: 'Business', tasksCompleted: 13, totalTasks: 20, dueDate: 'Dec 31, 2024' },
  { id: '2', name: 'Product Launch Campaign', description: 'Marketing campaign for new product line', status: 'active', phase: 'Planning', progress: 40, area: 'Marketing', tasksCompleted: 8, totalTasks: 20, dueDate: 'Jan 15, 2025' },
  { id: '3', name: 'Office Renovation', description: 'Modernize workspace facilities', status: 'on-hold', phase: 'Initiation', progress: 25, area: 'Operations', tasksCompleted: 5, totalTasks: 20, dueDate: 'Feb 28, 2025' },
  { id: '4', name: 'Mobile App Development', description: 'Customer-facing mobile application', status: 'active', phase: 'Execution', progress: 80, area: 'Technology', tasksCompleted: 16, totalTasks: 20, dueDate: 'Dec 20, 2024' },
];

const phaseColors: Record<string, string> = {
  Initiation: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  Planning: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  Execution: 'bg-primary/10 text-primary border-primary/20',
  Monitoring: 'bg-success/10 text-success border-success/20',
  Closing: 'bg-muted text-muted-foreground border-muted',
};

const statusConfig = {
  active: { icon: Play, color: 'text-success', label: 'Active' },
  'on-hold': { icon: Pause, color: 'text-warning', label: 'On Hold' },
  completed: { icon: Archive, color: 'text-muted-foreground', label: 'Completed' },
};

export default function Projects() {
  return (
    <MainLayout>
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Projects</h1>
            <p className="text-muted-foreground mt-1">PARA + PMP powered project management</p>
          </div>
          <Button variant="gold" size="lg">
            <Plus className="w-5 h-5 mr-2" />
            New Project
          </Button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 mt-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search projects..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-muted/50 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <Button variant="outline" size="default">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
        </div>
      </div>

      {/* PARA Tabs */}
      <div className="flex gap-2 mb-6">
        {['Projects', 'Areas', 'Resources', 'Archives'].map((tab) => (
          <button
            key={tab}
            className={cn(
              'px-4 py-2 rounded-xl text-sm font-medium transition-all',
              tab === 'Projects' 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-muted/50 text-muted-foreground hover:bg-muted'
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Projects Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {mockProjects.map((project) => {
          const StatusIcon = statusConfig[project.status].icon;
          
          return (
            <div
              key={project.id}
              className="glass-card p-6 hover:border-primary/30 transition-all duration-200 group cursor-pointer"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-gold flex items-center justify-center shadow-gold-glow-sm">
                    <FolderKanban className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                      {project.name}
                    </h3>
                    <span className="text-xs text-muted-foreground">{project.area}</span>
                  </div>
                </div>
                <button className="p-2 rounded-lg hover:bg-muted transition-colors">
                  <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                {project.description}
              </p>

              <div className="flex items-center gap-2 mb-4">
                <span className={cn(
                  'px-3 py-1 rounded-full text-xs font-medium border',
                  phaseColors[project.phase]
                )}>
                  {project.phase}
                </span>
                <span className={cn(
                  'flex items-center gap-1 text-xs',
                  statusConfig[project.status].color
                )}>
                  <StatusIcon className="w-3 h-3" />
                  {statusConfig[project.status].label}
                </span>
              </div>

              {/* Progress */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-muted-foreground">Progress</span>
                  <span className="text-xs font-medium text-foreground">{project.progress}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-gold rounded-full transition-all duration-500"
                    style={{ width: `${project.progress}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{project.tasksCompleted}/{project.totalTasks} tasks</span>
                <span>Due: {project.dueDate}</span>
              </div>
            </div>
          );
        })}
      </div>
    </MainLayout>
  );
}
