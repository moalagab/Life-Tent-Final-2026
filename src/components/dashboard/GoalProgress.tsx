import { Target, Loader2, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/hooks/useLanguage';
import { useGoals } from '@/hooks/useGoals';
import { Link } from 'react-router-dom';
import { Progress } from '@/components/ui/progress';
import { DashboardWidgetShell, DashboardEmptyState } from './DashboardWidgetShell';

export function GoalProgress() {
  const { t, currentLanguage } = useLanguage();
  const { data: goals, isLoading } = useGoals();

  const activeGoals = goals?.filter(g => g.is_active) || [];
  
  const goalsWithProgress = activeGoals.map(goal => {
    const target = goal.target_value || 1;
    const current = goal.current_value || 0;
    return Math.min(100, Math.round((current / target) * 100));
  });
  
  const overallProgress = goalsWithProgress.length > 0 
    ? Math.round(goalsWithProgress.reduce((a, b) => a + b, 0) / goalsWithProgress.length)
    : 0;

  const completedGoals = goalsWithProgress.filter(p => p >= 100).length;
  const inProgressGoals = goalsWithProgress.filter(p => p > 0 && p < 100).length;

  const topGoals = activeGoals
    .map(goal => ({
      ...goal,
      progress: Math.min(100, Math.round(((goal.current_value || 0) / (goal.target_value || 1)) * 100))
    }))
    .filter(g => g.progress < 100)
    .sort((a, b) => b.progress - a.progress)
    .slice(0, 3);

  if (isLoading) {
    return (
      <DashboardWidgetShell
        title={t('goals.title')}
        subtitle={`0 ${currentLanguage === 'ar' ? 'أهداف نشطة' : 'active'}`}
        icon={Target}
        iconColor="text-accent"
        iconBg="bg-accent/10"
        accentColor="bg-accent/10"
        linkTo="/goals"
        linkText={t('common.viewAll')}
      >
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
        </div>
      </DashboardWidgetShell>
    );
  }

  return (
    <DashboardWidgetShell
      title={t('goals.title')}
      subtitle={`${activeGoals.length} ${currentLanguage === 'ar' ? 'نشط' : 'active'}`}
      icon={Target}
      iconColor="text-accent"
      iconBg="bg-accent/10"
      accentColor="bg-accent/10"
      linkTo="/goals"
      linkText={t('common.viewAll')}
    >
      {activeGoals.length > 0 ? (
        <>
          {/* Overall Progress */}
          <div className="flex items-center gap-3 mb-4">
            <div className="relative w-14 h-14">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="14" fill="none" className="stroke-muted" strokeWidth="2.5" />
                <circle
                  cx="18" cy="18" r="14" fill="none"
                  className="stroke-accent"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeDasharray={`${overallProgress}, 100`}
                  style={{ transition: 'stroke-dasharray 0.5s ease-out' }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-bold text-accent">{overallProgress}%</span>
              </div>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground mb-1.5">
                {currentLanguage === 'ar' ? 'التقدم الكلي' : 'Overall'}
              </p>
              <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-success" />
                  {completedGoals} {currentLanguage === 'ar' ? 'مكتمل' : 'done'}
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  {inProgressGoals} {currentLanguage === 'ar' ? 'جاري' : 'active'}
                </span>
              </div>
            </div>
          </div>

          {/* Top Goals */}
          {topGoals.length > 0 && (
            <div className="space-y-2">
              {topGoals.map((goal) => (
                <div key={goal.id} className="p-2.5 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <p className="text-xs font-medium text-foreground truncate flex-1" dir="auto">
                      {goal.title}
                    </p>
                    <span className="text-[11px] font-semibold text-accent tabular-nums shrink-0">{goal.progress}%</span>
                  </div>
                  <Progress value={goal.progress} className="h-1" />
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <DashboardEmptyState
          icon={TrendingUp}
          message={currentLanguage === 'ar' ? 'لا توجد أهداف' : 'No goals yet'}
          action={
            <Link to="/goals" className="text-xs text-primary hover:underline">
              {currentLanguage === 'ar' ? 'إضافة هدف' : 'Add goal'}
            </Link>
          }
        />
      )}
    </DashboardWidgetShell>
  );
}