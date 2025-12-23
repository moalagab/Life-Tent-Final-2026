import { ArrowUpRight, Play, Pause, CheckCircle, Loader2, Edit3, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/hooks/useLanguage';
import { useProjects, useUpdateProject, useDeleteProject } from '@/hooks/useProjects';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export function ProjectsOverview() {
  const { t, currentLanguage } = useLanguage();
  const { data: projects, isLoading } = useProjects();
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();

  const [editingProject, setEditingProject] = useState<{ id: string; title: string } | null>(null);

  const statusConfig = {
    active: { icon: Play, color: 'text-success bg-success/10', label: t('projects.status.active') },
    on_hold: { icon: Pause, color: 'text-warning bg-warning/10', label: t('projects.status.onHold') },
    completed: { icon: CheckCircle, color: 'text-muted-foreground bg-muted', label: t('projects.status.completed') },
    archived: { icon: CheckCircle, color: 'text-muted-foreground bg-muted', label: t('projects.status.archived') },
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
    } catch (error) {
      toast.error(t('common.error'));
    }
  };

  const handleEdit = async () => {
    if (!editingProject) return;
    try {
      await updateProject.mutateAsync({ id: editingProject.id, title: editingProject.title });
      toast.success(t('projects.projectUpdated'));
      setEditingProject(null);
    } catch (error) {
      toast.error(t('common.error'));
    }
  };

  if (isLoading) {
    return (
      <div className="glass-card p-5 flex items-center justify-center h-48">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const displayProjects = projects?.filter(p => p.status === 'active' || p.status === 'on_hold').slice(0, 3) || [];

  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-lg font-semibold text-foreground">{t('dashboard.projectsOverview')}</h3>
        <Link to="/projects" className="text-primary text-sm font-medium hover:underline flex items-center gap-1">
          {t('common.viewAll')} <ArrowUpRight className="w-3 h-3" />
        </Link>
      </div>

      {displayProjects.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {displayProjects.map((project) => {
            const status = project.status || 'active';
            const StatusIcon = statusConfig[status]?.icon || Play;
            
            return (
              <div
                key={project.id}
                className="p-4 rounded-xl bg-muted/30 border border-border hover:border-primary/30 transition-all duration-200 group cursor-pointer relative"
              >
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => setEditingProject({ id: project.id, title: project.title })}
                    className="p-1 rounded hover:bg-muted"
                  >
                    <Edit3 className="w-3 h-3 text-muted-foreground" />
                  </button>
                  <button
                    onClick={() => handleDelete(project.id)}
                    className="p-1 rounded hover:bg-destructive/10"
                  >
                    <Trash2 className="w-3 h-3 text-destructive" />
                  </button>
                </div>

                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="font-medium text-foreground group-hover:text-primary transition-colors">
                      {project.title}
                    </h4>
                    <span className="text-xs text-muted-foreground">
                      {phaseLabels[project.phase || 'initiation']} {currentLanguage === 'ar' ? '' : 'Phase'}
                    </span>
                  </div>
                  <span className={cn(
                    'flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
                    statusConfig[status]?.color || 'bg-muted text-muted-foreground'
                  )}>
                    <StatusIcon className="w-3 h-3" />
                    {statusConfig[status]?.label || status}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="mb-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-muted-foreground">{t('common.progress')}</span>
                    <span className="text-xs font-medium text-foreground">{project.progress || 0}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all duration-500',
                        status === 'active' ? 'bg-gradient-gold' : 'bg-muted-foreground/50'
                      )}
                      style={{ width: `${project.progress || 0}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{project.description?.slice(0, 30) || t('projects.noDescription')}</span>
                  <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 text-primary transition-opacity" />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-muted-foreground text-sm">{t('projects.noProjects')}</p>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingProject} onOpenChange={() => setEditingProject(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('projects.editProject')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <Input
              value={editingProject?.title || ''}
              onChange={(e) => setEditingProject(prev => prev ? { ...prev, title: e.target.value } : null)}
              placeholder={t('projects.projectName')}
            />
            <Button onClick={handleEdit} className="w-full" disabled={updateProject.isPending}>
              {updateProject.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : t('common.save')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
