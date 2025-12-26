import { useState } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { Project, useUpdateProject } from '@/hooks/useProjects';
import { useTasks } from '@/hooks/useTasks';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { 
  Target, ListTodo, LayoutGrid, Eye, DollarSign,
  FolderKanban, Calendar, Loader2, ArrowRight, Archive,
  Play, Pause, CheckCircle, TrendingUp, StickyNote
} from 'lucide-react';

import { ProjectOkrsView } from './ProjectOkrsView';
import { KanbanBoard } from './KanbanBoard';
import { ProjectNotesTab } from './ProjectNotesTab';

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
          <TabsList className="grid w-full grid-cols-6 shrink-0">
            <TabsTrigger value="overview" className="flex items-center gap-1">
              <Eye className="w-4 h-4" />
              <span className="hidden sm:inline">نظرة عامة</span>
            </TabsTrigger>
            <TabsTrigger value="notes" className="flex items-center gap-1">
              <StickyNote className="w-4 h-4" />
              <span className="hidden sm:inline">ملاحظات</span>
            </TabsTrigger>
            <TabsTrigger value="okrs" className="flex items-center gap-1">
              <Target className="w-4 h-4" />
              <span className="hidden sm:inline">OKRs</span>
            </TabsTrigger>
            <TabsTrigger value="kanban" className="flex items-center gap-1">
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden sm:inline">Kanban</span>
            </TabsTrigger>
            <TabsTrigger value="tasks" className="flex items-center gap-1">
              <ListTodo className="w-4 h-4" />
              <span className="hidden sm:inline">GTD</span>
            </TabsTrigger>
            <TabsTrigger value="vision" className="flex items-center gap-1">
              <TrendingUp className="w-4 h-4" />
              <span className="hidden sm:inline">الرؤية</span>
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

            <TabsContent value="notes" className="m-0">
              <ProjectNotesTab projectId={project.id} />
            </TabsContent>

            <TabsContent value="okrs" className="m-0">
              <ProjectOkrsView projectId={project.id} />
            </TabsContent>

            <TabsContent value="kanban" className="m-0">
              <KanbanBoard projectId={project.id} tasks={projectTasks} />
            </TabsContent>

            <TabsContent value="tasks" className="m-0">
              <div className="space-y-4">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <ListTodo className="w-5 h-5 text-primary" />
                  {currentLanguage === 'ar' ? 'قائمة المهام (GTD)' : 'Task List (GTD)'}
                </h3>
                
                {projectTasks.length > 0 ? (
                  <div className="space-y-2">
                    {projectTasks.map((task) => (
                      <div 
                        key={task.id}
                        className={cn(
                          'flex items-center gap-3 p-3 rounded-lg border',
                          task.status === 'done' 
                            ? 'bg-muted/30 border-muted' 
                            : 'bg-card border-border'
                        )}
                      >
                        <CheckCircle className={cn(
                          'w-5 h-5 shrink-0',
                          task.status === 'done' ? 'text-success' : 'text-muted-foreground'
                        )} />
                        <div className="flex-1">
                          <span className={cn(
                            'text-sm',
                            task.status === 'done' && 'line-through text-muted-foreground'
                          )}>
                            {task.title}
                          </span>
                        </div>
                        {task.due_date && (
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(task.due_date), 'MMM d')}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-muted/20 rounded-xl">
                    <ListTodo className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                    <p className="text-muted-foreground">
                      {currentLanguage === 'ar' ? 'لا توجد مهام لهذا المشروع' : 'No tasks for this project'}
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="vision" className="m-0">
              <div className="space-y-4">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <Eye className="w-5 h-5 text-primary" />
                  {currentLanguage === 'ar' ? 'الرؤية والاستثمار' : 'Vision & Investment'}
                </h3>
                
                {project.vision ? (
                  <div className="glass-card p-4">
                    <h4 className="text-sm font-medium text-foreground mb-2">الرؤية</h4>
                    <p className="text-sm text-muted-foreground">{project.vision}</p>
                  </div>
                ) : (
                  <div className="glass-card p-4 text-center">
                    <Eye className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                    <p className="text-sm text-muted-foreground">
                      {currentLanguage === 'ar' ? 'لم يتم تحديد الرؤية بعد' : 'Vision not defined yet'}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="glass-card p-4">
                    <h4 className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-success" />
                      العائد المتوقع
                    </h4>
                    <p className="text-lg font-bold text-foreground">
                      {project.expected_roi || '-'}
                    </p>
                  </div>
                  <div className="glass-card p-4">
                    <h4 className="text-sm font-medium text-foreground mb-2">مستوى المخاطرة</h4>
                    <span className={cn(
                      'px-2 py-1 rounded text-xs font-medium',
                      project.risk_level === 'low' && 'bg-success/10 text-success',
                      project.risk_level === 'medium' && 'bg-warning/10 text-warning',
                      project.risk_level === 'high' && 'bg-destructive/10 text-destructive'
                    )}>
                      {project.risk_level === 'low' && 'منخفض'}
                      {project.risk_level === 'medium' && 'متوسط'}
                      {project.risk_level === 'high' && 'عالي'}
                      {!project.risk_level && '-'}
                    </span>
                  </div>
                </div>

                {project.investment_notes && (
                  <div className="glass-card p-4">
                    <h4 className="text-sm font-medium text-foreground mb-2">ملاحظات الاستثمار</h4>
                    <p className="text-sm text-muted-foreground">{project.investment_notes}</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
