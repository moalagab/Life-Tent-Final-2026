import { MainLayout } from '@/components/layout/MainLayout';
import { Plus, Filter, Search, MoreHorizontal, Play, Pause, Archive, FolderKanban, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/hooks/useLanguage';
import { useProjects, useCreateProject, Project } from '@/hooks/useProjects';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { format } from 'date-fns';

const phaseColors: Record<string, string> = {
  initiation: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  planning: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  execution: 'bg-primary/10 text-primary border-primary/20',
  monitoring: 'bg-success/10 text-success border-success/20',
  closing: 'bg-muted text-muted-foreground border-muted',
};

export default function Projects() {
  const { t } = useLanguage();
  const { data: projects, isLoading } = useProjects();
  const createProject = useCreateProject();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newProject, setNewProject] = useState({
    title: '',
    description: '',
    phase: 'initiation' as 'initiation' | 'planning' | 'execution' | 'monitoring' | 'closing',
  });

  const statusConfig = {
    active: { icon: Play, color: 'text-success', label: t('projects.status.active') },
    on_hold: { icon: Pause, color: 'text-warning', label: t('projects.status.onHold') },
    completed: { icon: Archive, color: 'text-muted-foreground', label: t('projects.status.completed') },
    archived: { icon: Archive, color: 'text-muted-foreground', label: t('projects.status.completed') },
  };

  const phaseLabels: Record<string, string> = {
    initiation: t('projects.phase.initiation'),
    planning: t('projects.phase.planning'),
    execution: t('projects.phase.execution'),
    monitoring: t('projects.phase.monitoring'),
    closing: t('projects.phase.closing'),
  };

  const paraTabs = [
    { id: 'Projects', label: t('common.projects') },
    { id: 'Areas', label: t('projects.areas') },
    { id: 'Resources', label: t('projects.resources') },
    { id: 'Archives', label: t('projects.archives') },
  ];

  const handleCreateProject = async () => {
    if (!newProject.title.trim()) return;
    
    try {
      await createProject.mutateAsync({
        title: newProject.title,
        description: newProject.description,
        phase: newProject.phase,
      });
      toast.success(t('common.save'));
      setIsDialogOpen(false);
      setNewProject({ title: '', description: '', phase: 'initiation' });
    } catch (error) {
      toast.error(t('auth.error'));
    }
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{t('projects.title')}</h1>
            <p className="text-muted-foreground mt-1">{t('projects.subtitle')}</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="gold" size="lg">
                <Plus className="w-5 h-5 me-2" />
                {t('projects.newProject')}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('projects.newProject')}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label>{t('projects.title')}</Label>
                  <Input
                    value={newProject.title}
                    onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                    placeholder={t('projects.title')}
                  />
                </div>
                <div>
                  <Label>{t('projects.subtitle')}</Label>
                  <Textarea
                    value={newProject.description}
                    onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                    placeholder={t('projects.subtitle')}
                  />
                </div>
                <div>
                  <Label>Phase</Label>
                  <Select
                    value={newProject.phase}
                    onValueChange={(value: typeof newProject.phase) => 
                      setNewProject({ ...newProject, phase: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="initiation">{t('projects.phase.initiation')}</SelectItem>
                      <SelectItem value="planning">{t('projects.phase.planning')}</SelectItem>
                      <SelectItem value="execution">{t('projects.phase.execution')}</SelectItem>
                      <SelectItem value="monitoring">{t('projects.phase.monitoring')}</SelectItem>
                      <SelectItem value="closing">{t('projects.phase.closing')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleCreateProject} className="w-full" disabled={createProject.isPending}>
                  {createProject.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : t('common.save')}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 mt-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder={t('projects.searchProjects')}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-muted/50 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <Button variant="outline" size="default">
            <Filter className="w-4 h-4 me-2" />
            {t('common.filter')}
          </Button>
        </div>
      </div>

      {/* PARA Tabs */}
      <div className="flex gap-2 mb-6">
        {paraTabs.map((tab) => (
          <button
            key={tab.id}
            className={cn(
              'px-4 py-2 rounded-xl text-sm font-medium transition-all',
              tab.id === 'Projects' 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-muted/50 text-muted-foreground hover:bg-muted'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Projects Grid */}
      {projects && projects.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2">
          {projects.map((project) => {
            const status = project.status || 'active';
            const StatusIcon = statusConfig[status]?.icon || Play;
            const phase = project.phase || 'initiation';
            
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
                        {project.title}
                      </h3>
                      <span className="text-xs text-muted-foreground">
                        {project.para_category || 'project'}
                      </span>
                    </div>
                  </div>
                  <button className="p-2 rounded-lg hover:bg-muted transition-colors">
                    <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>

                {project.description && (
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {project.description}
                  </p>
                )}

                <div className="flex items-center gap-2 mb-4">
                  <span className={cn(
                    'px-3 py-1 rounded-full text-xs font-medium border',
                    phaseColors[phase]
                  )}>
                    {phaseLabels[phase]}
                  </span>
                  <span className={cn(
                    'flex items-center gap-1 text-xs',
                    statusConfig[status]?.color || 'text-success'
                  )}>
                    <StatusIcon className="w-3 h-3" />
                    {statusConfig[status]?.label || t('projects.status.active')}
                  </span>
                </div>

                {/* Progress */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-muted-foreground">{t('common.progress')}</span>
                    <span className="text-xs font-medium text-foreground">{project.progress || 0}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-gold rounded-full transition-all duration-500"
                      style={{ width: `${project.progress || 0}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{format(new Date(project.created_at), 'MMM d, yyyy')}</span>
                  {project.due_date && (
                    <span>{t('common.due')}: {format(new Date(project.due_date), 'MMM d, yyyy')}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16">
          <FolderKanban className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
          <p className="text-muted-foreground">{t('common.noData')}</p>
          <Button variant="outline" className="mt-4" onClick={() => setIsDialogOpen(true)}>
            <Plus className="w-4 h-4 me-2" />
            {t('projects.newProject')}
          </Button>
        </div>
      )}
    </MainLayout>
  );
}