import { useState } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { Project, useUpdateProject, useDeleteProject } from '@/hooks/useProjects';
import { useTasks } from '@/hooks/useTasks';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { toast } from 'sonner';
import {
  Target, ListTodo, LayoutGrid, Eye, DollarSign,
  FolderKanban, Calendar, ArrowRight, ArrowLeft, Archive,
  Play, Pause, CheckCircle, TrendingUp, StickyNote, Users, Database,
  Pencil, Trash2, Check, X, AlertTriangle,
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
  const { t, currentLanguage, isRTL } = useLanguage();
  const { data: allTasks } = useTasks();
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();
  const [activeTab, setActiveTab] = useState('overview');

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [editDesc, setEditDesc] = useState('');
  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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
        phase: newPhase as 'initiation' | 'planning' | 'execution' | 'monitoring' | 'closing',
        status: newPhase === 'closing' ? 'completed' : project.status,
      });
      toast.success(t('projects.projectUpdated'));
    } catch {
      toast.error(t('common.error'));
    }
  };

  const handleSaveTitle = async () => {
    if (!editTitle.trim()) return;
    try {
      await updateProject.mutateAsync({ id: project.id, title: editTitle.trim() });
      setIsEditingTitle(false);
      toast.success(currentLanguage === 'ar' ? 'تم تحديث العنوان' : 'Title updated');
    } catch {
      toast.error(t('common.error'));
    }
  };

  const handleSaveDesc = async () => {
    try {
      await updateProject.mutateAsync({ id: project.id, description: editDesc });
      setIsEditingDesc(false);
      toast.success(currentLanguage === 'ar' ? 'تم تحديث الوصف' : 'Description updated');
    } catch {
      toast.error(t('common.error'));
    }
  };

  const handleStatusChange = async (status: string) => {
    try {
      await updateProject.mutateAsync({ id: project.id, status: status as Project['status'] });
      setIsEditingStatus(false);
      toast.success(currentLanguage === 'ar' ? 'تم تحديث الحالة' : 'Status updated');
    } catch {
      toast.error(t('common.error'));
    }
  };

  const handleArchive = async () => {
    try {
      await updateProject.mutateAsync({ id: project.id, status: 'archived', para_category: 'archive' });
      toast.success(t('common.success'));
      onOpenChange(false);
    } catch {
      toast.error(t('common.error'));
    }
  };

  const handleDelete = async () => {
    try {
      await deleteProject.mutateAsync(project.id);
      toast.success(currentLanguage === 'ar' ? 'تم حذف المشروع' : 'Project deleted');
      onOpenChange(false);
    } catch {
      toast.error(t('common.error'));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{
                backgroundColor: project.color ? `${project.color}20` : 'hsl(var(--primary) / 0.1)',
                color: project.color || 'hsl(var(--primary))',
              }}
            >
              <FolderKanban className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              {isEditingTitle ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveTitle()}
                    className="h-8 text-base font-bold"
                    dir="auto"
                    autoFocus
                  />
                  <button onClick={handleSaveTitle} className="text-success"><Check className="w-4 h-4" /></button>
                  <button onClick={() => setIsEditingTitle(false)} className="text-muted-foreground"><X className="w-4 h-4" /></button>
                </div>
              ) : (
                <button
                  onClick={() => { setEditTitle(project.title); setIsEditingTitle(true); }}
                  className="group flex items-center gap-1.5 text-start"
                >
                  <h2 className="text-xl font-bold truncate">{project.title}</h2>
                  <Pencil className="w-3.5 h-3.5 text-muted-foreground/0 group-hover:text-muted-foreground/60 transition-opacity shrink-0" />
                </button>
              )}
              <div className="flex items-center gap-2 mt-1">
                {isEditingStatus ? (
                  <Select defaultValue={project.status || 'active'} onValueChange={handleStatusChange}>
                    <SelectTrigger className="h-6 w-[120px] text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">{currentLanguage === 'ar' ? 'نشط' : 'Active'}</SelectItem>
                      <SelectItem value="on_hold">{currentLanguage === 'ar' ? 'متوقف' : 'On Hold'}</SelectItem>
                      <SelectItem value="completed">{currentLanguage === 'ar' ? 'مكتمل' : 'Completed'}</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <button
                    onClick={() => setIsEditingStatus(true)}
                    className={cn('px-2 py-0.5 rounded-full text-xs font-medium border cursor-pointer hover:opacity-80', statusColors[project.status || 'active'])}
                  >
                    {project.status === 'active' && <Play className="w-3 h-3 inline me-1" />}
                    {project.status === 'on_hold' && <Pause className="w-3 h-3 inline me-1" />}
                    {project.status === 'completed' && <CheckCircle className="w-3 h-3 inline me-1" />}
                    {project.status || 'active'}
                  </button>
                )}
                <span className="text-xs text-muted-foreground">{phaseLabels[project.phase || 'initiation']}</span>
              </div>
            </div>

            {/* Delete with confirm */}
            {showDeleteConfirm ? (
              <div className="flex items-center gap-1.5 p-2 bg-destructive/10 rounded-lg border border-destructive/30">
                <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
                <span className="text-xs text-destructive font-medium">
                  {currentLanguage === 'ar' ? 'حذف نهائي؟' : 'Delete?'}
                </span>
                <Button size="sm" variant="destructive" className="h-6 text-xs px-2" onClick={handleDelete} disabled={deleteProject.isPending}>
                  {currentLanguage === 'ar' ? 'نعم' : 'Yes'}
                </Button>
                <Button size="sm" variant="ghost" className="h-6 text-xs px-2" onClick={() => setShowDeleteConfirm(false)}>
                  {currentLanguage === 'ar' ? 'لا' : 'No'}
                </Button>
              </div>
            ) : (
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0" onClick={() => setShowDeleteConfirm(true)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="w-full flex overflow-x-auto shrink-0 gap-0.5 h-auto p-1">
            <TabsTrigger value="overview" className="flex items-center gap-1 flex-shrink-0 px-3 py-2">
              <Eye className="w-4 h-4" />
              <span className="hidden sm:inline">{currentLanguage === 'ar' ? 'نظرة' : 'Overview'}</span>
            </TabsTrigger>
            <TabsTrigger value="tasks" className="flex items-center gap-1 flex-shrink-0 px-3 py-2">
              <ListTodo className="w-4 h-4" />
              <span className="hidden sm:inline">{currentLanguage === 'ar' ? 'مهام' : 'Tasks'}</span>
            </TabsTrigger>
            <TabsTrigger value="goals" className="flex items-center gap-1 flex-shrink-0 px-3 py-2">
              <Target className="w-4 h-4" />
              <span className="hidden sm:inline">{currentLanguage === 'ar' ? 'أهداف' : 'Goals'}</span>
            </TabsTrigger>
            <TabsTrigger value="resources" className="flex items-center gap-1 flex-shrink-0 px-3 py-2">
              <Database className="w-4 h-4" />
              <span className="hidden sm:inline">{currentLanguage === 'ar' ? 'موارد' : 'Resources'}</span>
            </TabsTrigger>
            <TabsTrigger value="notes" className="flex items-center gap-1 flex-shrink-0 px-3 py-2">
              <StickyNote className="w-4 h-4" />
              <span className="hidden sm:inline">{currentLanguage === 'ar' ? 'ملاحظات' : 'Notes'}</span>
            </TabsTrigger>
            <TabsTrigger value="crm" className="flex items-center gap-1 flex-shrink-0 px-3 py-2">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">CRM</span>
            </TabsTrigger>
            <TabsTrigger value="okrs" className="flex items-center gap-1 flex-shrink-0 px-3 py-2">
              <TrendingUp className="w-4 h-4" />
              <span className="hidden sm:inline">OKRs</span>
            </TabsTrigger>
            <TabsTrigger value="kanban" className="flex items-center gap-1 flex-shrink-0 px-3 py-2">
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden sm:inline">{currentLanguage === 'ar' ? 'كانبان' : 'Kanban'}</span>
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto mt-4">
            <TabsContent value="overview" className="space-y-6 m-0">
              {/* Phase Progress */}
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
                            : 'bg-muted text-muted-foreground hover:bg-muted/80',
                        )}
                      >
                        {phaseLabels[phase]}
                      </button>
                      {index < phaseSteps.length - 1 && (
                        isRTL
                          ? <ArrowLeft className="w-4 h-4 text-muted-foreground mx-1 shrink-0" />
                          : <ArrowRight className="w-4 h-4 text-muted-foreground mx-1 shrink-0" />
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

              {/* Description — editable */}
              <div className="glass-card p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-foreground">{currentLanguage === 'ar' ? 'الوصف' : 'Description'}</h3>
                  {!isEditingDesc && (
                    <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => { setEditDesc(project.description ?? ''); setIsEditingDesc(true); }}>
                      <Pencil className="w-3 h-3" />
                      {currentLanguage === 'ar' ? 'تعديل' : 'Edit'}
                    </Button>
                  )}
                </div>
                {isEditingDesc ? (
                  <div className="space-y-2">
                    <Textarea
                      dir="auto"
                      value={editDesc}
                      onChange={(e) => setEditDesc(e.target.value)}
                      rows={3}
                      className="bg-muted/50 resize-none"
                      autoFocus
                    />
                    <div className="flex gap-2 justify-end">
                      <Button size="sm" variant="outline" onClick={() => setIsEditingDesc(false)}>{currentLanguage === 'ar' ? 'إلغاء' : 'Cancel'}</Button>
                      <Button size="sm" onClick={handleSaveDesc} disabled={updateProject.isPending}>{currentLanguage === 'ar' ? 'حفظ' : 'Save'}</Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {project.description || (currentLanguage === 'ar' ? 'لا يوجد وصف — اضغط تعديل لإضافة وصف' : 'No description — click Edit to add one')}
                  </p>
                )}
              </div>

              {/* Archive / Delete */}
              <div className="flex gap-3">
                {project.status !== 'archived' && (
                  <Button variant="outline" className="flex-1" onClick={handleArchive} disabled={updateProject.isPending}>
                    <Archive className="w-4 h-4 me-2" />
                    {currentLanguage === 'ar' ? 'نقل للأرشيف' : 'Move to Archive'}
                  </Button>
                )}
                <Button variant="destructive" className="flex-1" onClick={() => setShowDeleteConfirm(true)}>
                  <Trash2 className="w-4 h-4 me-2" />
                  {currentLanguage === 'ar' ? 'حذف المشروع' : 'Delete Project'}
                </Button>
              </div>
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

            <TabsContent value="notes" className="m-0">
              <ProjectNotesTab projectId={project.id} />
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
