import { useAreas } from '@/hooks/useAreas';
import { useProjects } from '@/hooks/useProjects';
import { useGoals } from '@/hooks/useGoals';
import { useTasks } from '@/hooks/useTasks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Loader2, Layers, Target, FolderKanban, CheckSquare, TrendingUp, AlertCircle, Calendar } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { cn } from '@/lib/utils';
import { useMemo } from 'react';

interface AreaWithStats {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  review_cadence: string | null;
  status: string;
  projectCount: number;
  goalCount: number;
  taskCount: number;
  completedTasks: number;
  progress: number;
  health: 'excellent' | 'good' | 'warning' | 'critical';
}

export function AreasDashboard() {
  const { data: areas, isLoading: areasLoading } = useAreas(false);
  const { data: projects } = useProjects();
  const { data: goals } = useGoals();
  const { data: tasks } = useTasks();
  const { currentLanguage } = useLanguage();

  const areasWithStats = useMemo(() => {
    if (!areas) return [];

    return areas.map(area => {
      const areaProjects = projects?.filter(p => p.area_id === area.id) || [];
      const areaGoals = goals?.filter(g => g.area_id === area.id) || [];
      const areaTasks = tasks?.filter(t => {
        const taskProject = projects?.find(p => p.id === t.project_id);
        return taskProject?.area_id === area.id;
      }) || [];

      const completedTasks = areaTasks.filter(t => t.status === 'done').length;
      const progress = areaTasks.length > 0 
        ? Math.round((completedTasks / areaTasks.length) * 100) 
        : 0;

      // Calculate health based on overdue tasks and active projects
      const overdueTasks = areaTasks.filter(t => 
        t.due_date && new Date(t.due_date) < new Date() && t.status !== 'done'
      ).length;
      
      let health: 'excellent' | 'good' | 'warning' | 'critical' = 'excellent';
      if (overdueTasks > 5 || progress < 20) health = 'critical';
      else if (overdueTasks > 2 || progress < 40) health = 'warning';
      else if (overdueTasks > 0 || progress < 60) health = 'good';

      return {
        ...area,
        projectCount: areaProjects.length,
        goalCount: areaGoals.length,
        taskCount: areaTasks.length,
        completedTasks,
        progress,
        health,
      } as AreaWithStats;
    });
  }, [areas, projects, goals, tasks]);

  if (areasLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!areasWithStats || areasWithStats.length === 0) {
    return (
      <Card className="glass-card">
        <CardContent className="text-center py-12">
          <Layers className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            {currentLanguage === 'ar' ? 'لا توجد مجالات' : 'No Areas'}
          </h3>
          <p className="text-muted-foreground">
            {currentLanguage === 'ar' 
              ? 'أنشئ مجالات لتنظيم مسؤولياتك المستمرة'
              : 'Create areas to organize your ongoing responsibilities'}
          </p>
        </CardContent>
      </Card>
    );
  }

  const healthColors = {
    excellent: 'bg-emerald-500',
    good: 'bg-primary',
    warning: 'bg-amber-500',
    critical: 'bg-destructive',
  };

  const healthLabels = {
    excellent: { ar: 'ممتاز', en: 'Excellent' },
    good: { ar: 'جيد', en: 'Good' },
    warning: { ar: 'تحذير', en: 'Warning' },
    critical: { ar: 'حرج', en: 'Critical' },
  };

  const cadenceLabels: Record<string, { ar: string; en: string }> = {
    weekly: { ar: 'أسبوعي', en: 'Weekly' },
    monthly: { ar: 'شهري', en: 'Monthly' },
    quarterly: { ar: 'ربع سنوي', en: 'Quarterly' },
    yearly: { ar: 'سنوي', en: 'Yearly' },
  };

  // Summary stats
  const totalProjects = areasWithStats.reduce((sum, a) => sum + a.projectCount, 0);
  const totalGoals = areasWithStats.reduce((sum, a) => sum + a.goalCount, 0);
  const avgProgress = Math.round(
    areasWithStats.reduce((sum, a) => sum + a.progress, 0) / areasWithStats.length
  );

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Layers className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{areasWithStats.length}</p>
                <p className="text-xs text-muted-foreground">
                  {currentLanguage === 'ar' ? 'مجالات نشطة' : 'Active Areas'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <FolderKanban className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{totalProjects}</p>
                <p className="text-xs text-muted-foreground">
                  {currentLanguage === 'ar' ? 'مشاريع' : 'Projects'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <Target className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{totalGoals}</p>
                <p className="text-xs text-muted-foreground">
                  {currentLanguage === 'ar' ? 'أهداف' : 'Goals'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{avgProgress}%</p>
                <p className="text-xs text-muted-foreground">
                  {currentLanguage === 'ar' ? 'متوسط التقدم' : 'Avg Progress'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Areas Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {areasWithStats.map((area) => (
          <Card 
            key={area.id} 
            className="glass-card overflow-hidden hover:shadow-lg transition-all duration-300"
          >
            <div 
              className="h-1"
              style={{ backgroundColor: area.color || '#6366f1' }}
            />
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${area.color}20` }}
                  >
                    <Layers className="w-5 h-5" style={{ color: area.color || '#6366f1' }} />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{area.name}</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <div className={cn(
                        'w-2 h-2 rounded-full',
                        healthColors[area.health]
                      )} />
                      <span className="text-xs text-muted-foreground">
                        {healthLabels[area.health][currentLanguage]}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {area.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {area.description}
                </p>
              )}

              {/* Progress */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">
                    {currentLanguage === 'ar' ? 'التقدم' : 'Progress'}
                  </span>
                  <span className="font-medium text-foreground">{area.progress}%</span>
                </div>
                <Progress value={area.progress} className="h-2" />
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 rounded-lg bg-muted/30">
                  <FolderKanban className="w-4 h-4 mx-auto text-blue-500 mb-1" />
                  <p className="text-sm font-medium text-foreground">{area.projectCount}</p>
                  <p className="text-xs text-muted-foreground">
                    {currentLanguage === 'ar' ? 'مشاريع' : 'Projects'}
                  </p>
                </div>
                <div className="p-2 rounded-lg bg-muted/30">
                  <Target className="w-4 h-4 mx-auto text-amber-500 mb-1" />
                  <p className="text-sm font-medium text-foreground">{area.goalCount}</p>
                  <p className="text-xs text-muted-foreground">
                    {currentLanguage === 'ar' ? 'أهداف' : 'Goals'}
                  </p>
                </div>
                <div className="p-2 rounded-lg bg-muted/30">
                  <CheckSquare className="w-4 h-4 mx-auto text-emerald-500 mb-1" />
                  <p className="text-sm font-medium text-foreground">
                    {area.completedTasks}/{area.taskCount}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {currentLanguage === 'ar' ? 'مهام' : 'Tasks'}
                  </p>
                </div>
              </div>

              {/* Cadence */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar className="w-3 h-3" />
                <span>
                  {currentLanguage === 'ar' ? 'مراجعة:' : 'Review:'}{' '}
                  {cadenceLabels[area.review_cadence || 'monthly']?.[currentLanguage]}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
