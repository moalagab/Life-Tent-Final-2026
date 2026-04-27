import { ArrowUpRight, Play, Pause, CheckCircle, Loader2, Edit3, Trash2, FolderKanban } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/hooks/useLanguage';
import { useProjects, useUpdateProject, useDeleteProject } from '@/hooks/useProjects';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { DashboardWidgetShell, DashboardEmptyState } from './DashboardWidgetShell';

export function ProjectsOverview() {
  const { t, currentLanguage } = useLanguage();
  const { data: projects, isLoading } = useProjects();
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();

  const [editingProject, setEditingProject] = useState<{ id: string; title: string } | null>(null);

  const statusConfig = {
    active: { icon: Play, color: 'text-success', badge: 'bg-success/10 text-success border-success/20', label: t('projects.status.active') },
    on_hold: { icon: Pause, color: 'text-warning', badge: 'bg-warning/10 text-warning border-warning/20', label: t('projects.status.onHold') },
    completed: { icon: CheckCircle, color: 'text-muted-foreground', badge: 'bg-muted text-muted-foreground border-muted', label: t('projects.status.completed') },
    archived: { icon: CheckCircle, color: 'text-muted-foreground', badge: 'bg-muted text-muted-foreground border-muted', label: t('projects.status.archived') },
  };

  const phaseLabels: Record<string, string> = {
    initiation: currentLanguage === 'ar' ? 'البدء' : 'Initiation',
    planning: currentLanguage === 'ar' ? 'التخطيط' : 'Planning',
    execution: currentLanguage === 'ar' ? 'التنفيذ' : 'Execution',
    monitoring: currentLanguage === 'ar' ? 'المتابعة' : 'Monitoring',
    closing: currentLanguage === 'ar' ? 'الإغلاق' : 'Closing',
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteProject.mutateAsync(id);
      toast.success(t('projects.projectDeleted'));
    } catch {
      toast.error(t('common.error'));
    }
  };

  const handleEdit = async () => {
    if (!editingProject) return;
    try {
      await updateProject.mutateAsync({ id: editingProject.id, title: editingProject.title });
      toast.success(t('projects.projectUpdated'));
      setEditingProject(null);
    } catch {
      toast.error(t('common.error'));
    }
  };

  const displayProjects = projects?.filter(p => p.status === 'active' || p.status === 'on_hold').slice(0, 3) || [];

  if (isLoading) {
    return (
      <DashboardWidgetShell
        title={t('dashboard.projectsOverview')}
        icon={FolderKanban}
        iconColor="text-primary"
        iconBg="bg-primary/10"
        linkTo="/projects"
        linkText={t('common.viewAll')}
      >
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
        </div>
      </DashboardWidgetShell>
    );
  }

  return (
    <DashboardWidgetShell
      title={t('dashboard.projectsOverview')}
      icon={FolderKanban}
      iconColor="text-primary"
      iconBg="bg-primary/10"
      linkTo="/projects"
      linkText={t('common.viewAll')}
    >
      {displayProjects.length > 0 ? (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {displayProjects.map((project) => {
            const status = project.status || 'active';
            const StatusIcon = statusConfig[status]?.icon || Play;
            const progress = project.progress || 0;
            
            return (
              <div
                key={project.id}
                className="group relative p-3.5 rounded-xl bg-muted/30 border border-border/40 hover:border-border hover:bg-muted/50 transition-all"
              >
                {/* Action Menu */}
                <div className="absolute top-2 end-2 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => setEditingProject({ id: project.id, title: project.title })}
                    className="p-1.5 rounded-lg bg-background/80 hover:bg-muted transition-colors"
                  >
                    <Edit3 className="w-3 h-3 text-muted-foreground" />
                  </button>
                  <button
                    onClick={() => handleDelete(project.id)}
                    className="p-1.5 rounded-lg bg-background/80 hover:bg-destructive/10 transition-colors"
                  >
                    <Trash2 className="w-3 h-3 text-destructive" />
                  </button>
                </div>

                {/* Status Badge */}
                <div className={cn(
                  'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border mb-2.5',
                  statusConfig[status]?.badge
                )}>
                  <StatusIcon className="w-2.5 h-2.5" />
                  {statusConfig[status]?.label || status}
                </div>

                {/* Project Title */}
                <h4 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors mb-0.5 truncate pe-12" dir="auto">
                  {project.title}
                </h4>

                {/* Phase Label */}
                <span className="text-[11px] text-muted-foreground">
                  {phaseLabels[project.phase || 'initiation']}
                </span>

                {/* Progress Bar */}
                <div className="mt-3">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-[11px] text-muted-foreground">{t('common.progress')}</span>
                    <span className="text-[11px] font-semibold text-foreground tabular-nums">{progress}%</span>
                  </div>
                  <div className="relative h-1.5 bg-muted/50 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        'absolute inset-y-0 start-0 rounded-full transition-all duration-500',
                        status === 'active' ? 'bg-primary' : 'bg-muted-foreground/50'
                      )}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <DashboardEmptyState
          icon={FolderKanban}
          message={t('projects.noProjects')}
        />
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingProject} onOpenChange={() => setEditingProject(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Edit3 className="w-4 h-4 text-primary" />
              </div>
              {t('projects.editProject')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <Input
              value={editingProject?.title || ''}
              onChange={(e) => setEditingProject(prev => prev ? { ...prev, title: e.target.value } : null)}
              placeholder={t('projects.projectName')}
              className="bg-muted/50"
            />
            <Button onClick={handleEdit} className="w-full" disabled={updateProject.isPending}>
              {updateProject.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : t('common.save')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardWidgetShell>
  );
}