import { ArrowUpRight, Play, Pause, CheckCircle, Loader2, Edit3, Trash2, FolderKanban, MoreHorizontal } from 'lucide-react';
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
    active: { icon: Play, color: 'bg-success text-success-foreground', badge: 'bg-success/10 text-success border-success/20', label: t('projects.status.active') },
    on_hold: { icon: Pause, color: 'bg-warning text-warning-foreground', badge: 'bg-warning/10 text-warning border-warning/20', label: t('projects.status.onHold') },
    completed: { icon: CheckCircle, color: 'bg-muted text-muted-foreground', badge: 'bg-muted text-muted-foreground border-muted', label: t('projects.status.completed') },
    archived: { icon: CheckCircle, color: 'bg-muted text-muted-foreground', badge: 'bg-muted text-muted-foreground border-muted', label: t('projects.status.archived') },
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
      <div className="relative overflow-hidden rounded-2xl bg-card/50 backdrop-blur-xl border border-border/50 p-5 flex items-center justify-center h-48">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const displayProjects = projects?.filter(p => p.status === 'active' || p.status === 'on_hold').slice(0, 3) || [];

  return (
    <div className="relative overflow-hidden rounded-2xl bg-card/50 backdrop-blur-xl border border-border/50 p-5">
      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-gold-500/5 rounded-full blur-2xl" />
      
      <div className="relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <FolderKanban className="w-4 h-4 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">{t('dashboard.projectsOverview')}</h3>
          </div>
          <Link 
            to="/projects" 
            className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-primary transition-colors group"
          >
            {t('common.viewAll')} 
            <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>

        {displayProjects.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {displayProjects.map((project, index) => {
              const status = project.status || 'active';
              const StatusIcon = statusConfig[status]?.icon || Play;
              const progress = project.progress || 0;
              
              return (
                <div
                  key={project.id}
                  className="group relative p-5 rounded-xl bg-gradient-to-br from-muted/30 to-transparent border border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {/* Action Menu */}
                  <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300">
                    <div className="flex gap-1 p-1 rounded-lg bg-background/80 backdrop-blur-sm border border-border/50">
                      <button
                        onClick={() => setEditingProject({ id: project.id, title: project.title })}
                        className="p-1.5 rounded hover:bg-muted transition-colors"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-muted-foreground" />
                      </button>
                      <button
                        onClick={() => handleDelete(project.id)}
                        className="p-1.5 rounded hover:bg-destructive/10 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-destructive" />
                      </button>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className={cn(
                    'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border mb-4',
                    statusConfig[status]?.badge
                  )}>
                    <StatusIcon className="w-3 h-3" />
                    {statusConfig[status]?.label || status}
                  </div>

                  {/* Project Title */}
                  <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors mb-1 truncate">
                    {project.title}
                  </h4>
                  
                  {/* Phase Label */}
                  <span className="text-xs text-muted-foreground">
                    {phaseLabels[project.phase || 'initiation']}
                  </span>

                  {/* Progress Bar */}
                  <div className="mt-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs text-muted-foreground">{t('common.progress')}</span>
                      <span className="text-xs font-bold text-foreground">{progress}%</span>
                    </div>
                    <div className="relative h-2 bg-muted/50 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          'absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-out',
                          status === 'active' ? 'bg-gradient-to-r from-primary to-gold-500' : 'bg-muted-foreground/50'
                        )}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Description Preview */}
                  {project.description && (
                    <p className="text-xs text-muted-foreground mt-3 line-clamp-2">
                      {project.description}
                    </p>
                  )}

                  {/* Hover Arrow */}
                  <ArrowUpRight className="absolute bottom-4 right-4 w-5 h-5 text-primary opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
              <FolderKanban className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-sm">{t('projects.noProjects')}</p>
          </div>
        )}
      </div>

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
    </div>
  );
}
