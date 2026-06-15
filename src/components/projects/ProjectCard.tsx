import { cn } from '@/lib/utils';
import { useLanguage } from '@/hooks/useLanguage';
import { format } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { 
  FolderKanban, Play, Pause, CheckCircle, Archive,
  MoreHorizontal, Eye, Edit3, Trash2, Target, ListTodo, Share2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Project } from '@/hooks/useProjects';

interface ProjectCardProps {
  project: Project;
  onView: (project: Project) => void;
  onEdit: (project: Project) => void;
  onDelete: (projectId: string) => void;
  onArchive?: (project: Project) => void;
  onShare?: (project: Project) => void;
}

const phaseColors: Record<string, string> = {
  initiation: 'bg-primary/10 text-primary border-primary/20',
  planning: 'bg-warning/10 text-warning border-warning/20',
  execution: 'bg-success/10 text-success border-success/20',
  monitoring: 'bg-primary/10 text-primary border-primary/20',
  closing: 'bg-muted text-muted-foreground border-muted',
};

const statusIcons: Record<string, typeof Play> = {
  active: Play,
  on_hold: Pause,
  completed: CheckCircle,
  archived: Archive,
};

export function ProjectCard({ project, onView, onEdit, onDelete, onArchive, onShare }: ProjectCardProps) {
  const { t, currentLanguage } = useLanguage();
  const dateLocale = currentLanguage === 'ar' ? ar : enUS;
  
  const status = project.status || 'active';
  const phase = project.phase || 'initiation';
  const StatusIcon = statusIcons[status] || Play;

  const statusColors: Record<string, string> = {
    active: 'text-success',
    on_hold: 'text-warning',
    completed: 'text-muted-foreground',
    archived: 'text-muted-foreground',
  };

  const phaseLabels: Record<string, string> = {
    initiation: t('projects.phase.initiation'),
    planning: t('projects.phase.planning'),
    execution: t('projects.phase.execution'),
    monitoring: t('projects.phase.monitoring'),
    closing: t('projects.phase.closing'),
  };

  const statusLabels: Record<string, string> = {
    active: t('projects.status.active'),
    on_hold: t('projects.status.onHold'),
    completed: t('projects.status.completed'),
    archived: t('projects.archives'),
  };

  return (
    <div
      className="glass-card p-6 hover:border-primary/30 transition-all duration-200 group cursor-pointer"
      onClick={() => onView(project)}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div 
            className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg"
            style={{ 
              backgroundColor: project.color ? `${project.color}20` : 'hsl(var(--primary) / 0.1)',
              color: project.color || 'hsl(var(--primary))'
            }}
          >
            <FolderKanban className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
              {project.title}
            </h3>
            <span className="text-xs text-muted-foreground capitalize">
              {project.para_category || 'project'}
            </span>
          </div>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onView(project); }}>
              <Eye className="w-4 h-4 me-2" />
              {t('common.viewAll')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(project); }}>
              <Edit3 className="w-4 h-4 me-2" />
              {t('common.edit')}
            </DropdownMenuItem>
            {onShare && (
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onShare(project); }}>
                <Share2 className="w-4 h-4 me-2" />
                مشاركة
              </DropdownMenuItem>
            )}
            {onArchive && status !== 'archived' && (
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onArchive(project); }}>
                <Archive className="w-4 h-4 me-2" />
                {t('projects.archives')}
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="text-destructive focus:text-destructive"
              onClick={(e) => { e.stopPropagation(); onDelete(project.id); }}
            >
              <Trash2 className="w-4 h-4 me-2" />
              {t('common.delete')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {project.description && (
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
          {project.description}
        </p>
      )}

      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <span className={cn(
          'px-3 py-1 rounded-full text-xs font-medium border',
          phaseColors[phase]
        )}>
          {phaseLabels[phase]}
        </span>
        <span className={cn(
          'flex items-center gap-1 text-xs',
          statusColors[status]
        )}>
          <StatusIcon className="w-3 h-3" />
          {statusLabels[status]}
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

      {/* Quick Stats */}
      <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 border-t border-border/50">
        <span className="flex items-center gap-1">
          <Target className="w-3 h-3" />
          OKRs
        </span>
        <span className="flex items-center gap-1">
          <ListTodo className="w-3 h-3" />
          {t('tasks.title')}
        </span>
        <span>
          {format(new Date(project.created_at), 'dd MMM yyyy', { locale: dateLocale })}
        </span>
      </div>
    </div>
  );
}
