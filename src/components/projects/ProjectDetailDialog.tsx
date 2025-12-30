import { useState } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { Project, useUpdateProject } from '@/hooks/useProjects';
import { useTasks } from '@/hooks/useTasks';
import { useGoals } from '@/hooks/useGoals';
import { useResources } from '@/hooks/useResources';
import { useCustomers } from '@/hooks/useCRM';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { 
  Target, ListTodo, LayoutGrid, Eye, DollarSign,
  FolderKanban, Calendar, Loader2, ArrowRight, Archive,
  Play, Pause, CheckCircle, TrendingUp, StickyNote, Users, Database
} from 'lucide-react';

import { ProjectOkrsView } from './ProjectOkrsView';
import { KanbanBoard } from './KanbanBoard';
import { ProjectNotesTab } from './ProjectNotesTab';
import { ProjectTasksTab } from './ProjectTasksTab';
import { ProjectGoalsTab } from './ProjectGoalsTab';
import { ProjectResourcesTab } from './ProjectResourcesTab';
import { ProjectCRMTab } from './ProjectCRMTab';

interface ProjectDetailDialogProps {
  project: Project | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const phaseSteps = ['initiation', 'planning', 'execution', 'monitoring', 'closing'];

export function ProjectDetailDialog({ project, open, onOpenChange }: ProjectDetailDialogProps) {
  const { t, currentLanguage } = useLanguage();
  const { data: allTasks } = useTasks();
  const updateProject = useUpdateProject();
  const [activeTab, setActiveTab] = useState('overview');

  if (!project) return null;

  const projectTasks = allTasks?.filter(task => task.project_id === project.id) || [];
  const completedTasks = projectTasks.filter(task => task.status === 'done').length;
  const currentPhaseIndex = phaseSteps.indexOf(project.phase || 'initiation');

  const phaseLabels: Record<string, string> = {
    initiation: t('projects.phase.initiation'),
    planning: t('projects.phase.planning'),
    execution: t('projects.phase.execution'),
    monitoring: t('projects.phase.monitoring'),
    closing: t('projects.phase.closing'),
  };

  const statusColors: Record<string, string> = {
    active: 'bg-success/10 text-success border-success/20',
    on_hold: 'bg-warning/10 text-warning border-warning/20',
    completed: 'bg-muted text-muted-foreground border-muted',
    archived: 'bg-muted text-muted-foreground border-muted',
  };

  const handlePhaseChange = async (newPhase: string) => {
    try {
      await updateProject.mutateAsync({ 
        id: project.id, 
        phase: newPhase as any,
        status: newPhase === 'closing' ? 'completed' : project.status
      });
      toast.success(t('projects.projectUpdated'));
    } catch (error) {
      toast.error(t('common.error'));
    }
  };

  const handleArchive = async () => {
    try {
      await updateProject.mutateAsync({
        id: project.id,
        status: 'archived',
        para_category: 'archive'
      });
      toast.success(t('common.success'));
      onOpenChange(false);
    } catch (error) {
      toast.error(t('common.error'));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ 
                backgroundColor: project.color ? `${project.color}20` : 'hsl(var(--primary) / 0.1)',
                color: project.color || 'hsl(var(--primary))'
              }}
            >
              <FolderKanban className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold">{project.title}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className={cn(
                  'px-2 py-0.5 rounded-full text-xs font-medium border',
                  statusColors[project.status || 'active']
                )}>
                  {project.status === 'active' && <Play className="w-3 h-3 inline me-1" />}
                  {project.status === 'on_hold' && <Pause className="w-3 h-3 inline me-1" />}
                  {project.status === 'completed' && <CheckCircle className="w-3 h-3 inline me-1" />}
                  {project.status || 'active'}
                </span>
                <span className="text-xs text-muted-foreground">
                  {phaseLabels[project.phase || 'initiation']}
                </span>
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-7 shrink-0">
            <TabsTrigger value="overview" className="flex items-center gap-1">
              <Eye className="w-4 h-4" />
              <span className="hidden sm:inline">نظرة</span>
            </TabsTrigger>
            <TabsTrigger value="tasks" className="flex items-center gap-1">
              <ListTodo className="w-4 h-4" />
              <span className="hidden sm:inline">مهام</span>
            </TabsTrigger>
            <TabsTrigger value="goals" className="flex items-center gap-1">
              <Target className="w-4 h-4" />
              <span className="hidden sm:inline">أهداف</span>
            </TabsTrigger>
            <TabsTrigger value="resources" className="flex items-center gap-1">
              <Database className="w-4 h-4" />
              <span className="hidden sm:inline">موارد</span>
            </TabsTrigger>
            <TabsTrigger value="crm" className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">CRM</span>
            </TabsTrigger>
            <TabsTrigger value="okrs" className="flex items-center gap-1">
              <TrendingUp className="w-4 h-4" />
              <span className="hidden sm:inline">OKRs</span>
            </TabsTrigger>
            <TabsTrigger value="kanban" className="flex items-center gap-1">
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden sm:inline">كانبان</span>
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto mt-4">
            <TabsContent value="overview" className="space-y-6 m-0">
              {/* Phase Progress (PMP/PMBOK) */}
              <div className="glass-card p-4">
                <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  {currentLanguage === 'ar' ? 'مراحل المشروع (PMBOK)' : 'Project Phases (PMBOK)'}
                </h3>
                <div className="flex items-center gap-2">
                  {phaseSteps.map((phase, index) => (
                    <div key={phase} className="flex items-center flex-1">
                      <button
                        onClick={() => handlePhaseChange(phase)}
                        className={cn(
                          'flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all text-center',
                          index <= currentPhaseIndex
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
                        )}
                      >
                        {phaseLabels[phase]}
                      </button>
                      {index < phaseSteps.length - 1 && (
                        <ArrowRight className="w-4 h-4 text-muted-foreground mx-1 shrink-0" />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="glass-card p-4 text-center">
                  <div className="text-2xl font-bold text-foreground">{project.progress || 0}%</div>
                  <div className="text-xs text-muted-foreground">{t('common.progress')}</div>
                  <Progress value={project.progress || 0} className="mt-2 h-1.5" />
                </div>
                <div className="glass-card p-4 text-center">
                  <div className="text-2xl font-bold text-foreground">{projectTasks.length}</div>
                  <div className="text-xs text-muted-foreground">{t('tasks.title')}</div>
                  <div className="text-xs text-success mt-1">{completedTasks} {t('tasks.done')}</div>
                </div>
                <div className="glass-card p-4 text-center">
                  <div className="text-2xl font-bold text-foreground">
                    {project.due_date ? format(new Date(project.due_date), 'MMM d') : '-'}
                  </div>
                  <div className="text-xs text-muted-foreground">{t('common.due')}</div>
                </div>
              </div>

              {/* Description */}
              {project.description && (
                <div className="glass-card p-4">
                  <h3 className="font-semibold text-foreground mb-2">الوصف</h3>
                  <p className="text-sm text-muted-foreground">{project.description}</p>
                </div>
              )}

              {/* Archive Action */}
              {project.status !== 'archived' && (
                <Button variant="outline" className="w-full" onClick={handleArchive}>
                  <Archive className="w-4 h-4 me-2" />
                  {currentLanguage === 'ar' ? 'نقل للأرشيف' : 'Move to Archive'}
                </Button>
              )}
            </TabsContent>

            <TabsContent value="tasks" className="m-0">
              <ProjectTasksTab projectId={project.id} />
            </TabsContent>

            <TabsContent value="goals" className="m-0">
              <ProjectGoalsTab projectId={project.id} />
            </TabsContent>

            <TabsContent value="resources" className="m-0">
              <ProjectResourcesTab projectId={project.id} />
            </TabsContent>

            <TabsContent value="crm" className="m-0">
              <ProjectCRMTab projectId={project.id} />
            </TabsContent>

            <TabsContent value="okrs" className="m-0">
              <ProjectOkrsView projectId={project.id} />
            </TabsContent>

            <TabsContent value="kanban" className="m-0">
              <KanbanBoard projectId={project.id} tasks={projectTasks} />
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
