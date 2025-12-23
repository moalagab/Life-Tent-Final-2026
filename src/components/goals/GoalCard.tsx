import { useState } from 'react';
import { 
  Target, MoreHorizontal, TrendingUp, AlertTriangle, CheckCircle2,
  Calendar, FolderKanban, Plus, Trash2, Edit3, ChevronDown, ChevronUp,
  User, Users, Cog, GraduationCap, Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/hooks/useLanguage';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { format } from 'date-fns';

interface KeyResult {
  id: string;
  title: string;
  current_value: number | null;
  target_value: number;
  unit: string | null;
}

interface GoalCardProps {
  goal: {
    id: string;
    title: string;
    description: string | null;
    perspective: string | null;
    target_value: number | null;
    current_value: number | null;
    unit: string | null;
    start_date: string | null;
    end_date: string | null;
  };
  keyResults: KeyResult[];
  progress: number;
  onEdit?: () => void;
  onDelete?: () => void;
  onAddKeyResult?: () => void;
  onUpdateKeyResult?: (krId: string, value: number) => void;
}

const perspectiveConfig: Record<string, { icon: any; color: string; bg: string }> = {
  personal: { icon: User, color: 'text-amber-500', bg: 'bg-amber-500/10 border-amber-500/20' },
  financial: { icon: TrendingUp, color: 'text-primary', bg: 'bg-primary/10 border-primary/20' },
  customer: { icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10 border-blue-500/20' },
  processes: { icon: Cog, color: 'text-success', bg: 'bg-success/10 border-success/20' },
  learning: { icon: GraduationCap, color: 'text-purple-500', bg: 'bg-purple-500/10 border-purple-500/20' },
};

function getProgressStatus(progress: number) {
  if (progress >= 80) return { label: 'onTrack', color: 'text-success', icon: CheckCircle2, bg: 'bg-success/10' };
  if (progress >= 50) return { label: 'atRisk', color: 'text-primary', icon: TrendingUp, bg: 'bg-primary/10' };
  return { label: 'behind', color: 'text-destructive', icon: AlertTriangle, bg: 'bg-destructive/10' };
}

export function GoalCard({ 
  goal, 
  keyResults, 
  progress,
  onEdit,
  onDelete,
  onAddKeyResult,
  onUpdateKeyResult
}: GoalCardProps) {
  const { t, currentLanguage } = useLanguage();
  const [isExpanded, setIsExpanded] = useState(false);

  const perspective = perspectiveConfig[goal.perspective || 'personal'] || perspectiveConfig.personal;
  const PerspectiveIcon = perspective.icon;
  const status = getProgressStatus(progress);
  const StatusIcon = status.icon;

  return (
    <div className="group relative overflow-hidden rounded-2xl bg-card/80 backdrop-blur-sm border border-border/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:border-primary/20">
      {/* Gradient Accent */}
      <div className="absolute top-0 start-0 end-0 h-1 bg-gradient-to-r from-primary via-primary/50 to-transparent" />
      
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-3 flex-1">
            <div className={cn(
              'w-12 h-12 rounded-xl flex items-center justify-center border flex-shrink-0',
              perspective.bg
            )}>
              <PerspectiveIcon className={cn('w-6 h-6', perspective.color)} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-foreground mb-1 truncate group-hover:text-primary transition-colors">
                {goal.title}
              </h3>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className={cn('text-xs border', perspective.bg, perspective.color)}>
                  {goal.perspective === 'personal' 
                    ? t('goals.category.personal')
                    : t(`goals.category.${goal.perspective}`)}
                </Badge>
                <Badge className={cn('text-xs gap-1', status.bg, status.color)}>
                  <StatusIcon className="w-3 h-3" />
                  {t(`goals.status.${status.label}`)}
                </Badge>
              </div>
            </div>
          </div>

          {/* Actions Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-2 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-muted transition-all">
                <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit} className="gap-2">
                <Edit3 className="w-4 h-4" />
                {t('common.edit')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDelete} className="gap-2 text-destructive focus:text-destructive">
                <Trash2 className="w-4 h-4" />
                {t('common.delete')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Description */}
        {goal.description && (
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
            {goal.description}
          </p>
        )}

        {/* Progress Section */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">{t('goals.progress')}</span>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-foreground">{progress}%</span>
            </div>
          </div>
          <Progress value={progress} className="h-2" />
          
          {/* Goal Value Display */}
          {goal.target_value && (
            <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
              <span>{goal.current_value || 0} / {goal.target_value} {goal.unit}</span>
              {goal.end_date && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {format(new Date(goal.end_date), 'MMM d, yyyy')}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Key Results Section */}
        {keyResults.length > 0 && (
          <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
            <CollapsibleTrigger asChild>
              <button className="flex items-center justify-between w-full py-2 px-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                <span className="text-sm font-medium flex items-center gap-2">
                  <Target className="w-4 h-4 text-primary" />
                  {t('goals.keyResults')} ({keyResults.length})
                </span>
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                )}
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-3 space-y-2">
              {keyResults.map((kr) => {
                const krProgress = Math.min((kr.current_value || 0) / kr.target_value * 100, 100);
                return (
                  <div key={kr.id} className="p-3 rounded-xl bg-muted/30 border border-border/50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-foreground font-medium">{kr.title}</span>
                      <span className="text-xs text-muted-foreground">
                        {(kr.current_value || 0).toLocaleString()} / {kr.target_value.toLocaleString()} {kr.unit}
                      </span>
                    </div>
                    <Progress value={krProgress} className="h-1.5" />
                  </div>
                );
              })}
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Add Key Result Button */}
        {onAddKeyResult && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-full mt-3 text-muted-foreground hover:text-primary"
            onClick={onAddKeyResult}
          >
            <Plus className="w-4 h-4 me-2" />
            {t('goals.addKeyResult')}
          </Button>
        )}
      </div>
    </div>
  );
}
