import { Target, ArrowUpRight, Loader2, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/hooks/useLanguage';
import { useGoals } from '@/hooks/useGoals';
import { Link } from 'react-router-dom';
import { Progress } from '@/components/ui/progress';

export function GoalProgress() {
  const { t, currentLanguage } = useLanguage();
  const { data: goals, isLoading } = useGoals();

  const activeGoals = goals?.filter(g => g.is_active) || [];
  
  // Calculate overall progress
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

  // Get top 3 goals by progress (not yet completed)
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
      <div className="relative overflow-hidden rounded-2xl bg-card/50 backdrop-blur-xl border border-border/50 p-5 h-full flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl bg-card/50 backdrop-blur-xl border border-border/50 p-5 h-full">
      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full blur-3xl" />
      
      <div className="relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
              <Target className="w-4 h-4 text-accent" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">{t('goals.title')}</h3>
              <p className="text-xs text-muted-foreground">
                {activeGoals.length} {currentLanguage === 'ar' ? 'أهداف نشطة' : 'active goals'}
              </p>
            </div>
          </div>
          <Link 
            to="/goals" 
            className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-primary transition-colors group"
          >
            {t('common.viewAll')} 
            <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>

        {activeGoals.length > 0 ? (
          <>
            {/* Overall Progress Circle */}
            <div className="flex items-center gap-4 mb-6">
              <div className="relative w-20 h-20">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <circle
                    cx="18"
                    cy="18"
                    r="15"
                    fill="none"
                    className="stroke-muted"
                    strokeWidth="3"
                  />
                  <circle
                    cx="18"
                    cy="18"
                    r="15"
                    fill="none"
                    className="stroke-accent"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray={`${overallProgress}, 100`}
                    style={{ transition: 'stroke-dasharray 0.7s ease-out' }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-bold text-accent">{overallProgress}%</span>
                </div>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground mb-2">
                  {currentLanguage === 'ar' ? 'التقدم الكلي' : 'Overall Progress'}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="text-xs text-muted-foreground">
                      {completedGoals} {currentLanguage === 'ar' ? 'مكتمل' : 'completed'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-primary" />
                    <span className="text-xs text-muted-foreground">
                      {inProgressGoals} {currentLanguage === 'ar' ? 'قيد التنفيذ' : 'in progress'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Top Goals */}
            {topGoals.length > 0 && (
              <div className="space-y-3">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {currentLanguage === 'ar' ? 'أهداف قيد التقدم' : 'Goals in Progress'}
                </p>
                {topGoals.map((goal, index) => (
                  <div 
                    key={goal.id} 
                    className="p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-foreground truncate flex-1">
                        {goal.title}
                      </p>
                      <span className="text-xs font-medium text-accent ml-2">
                        {goal.progress}%
                      </span>
                    </div>
                    <Progress value={goal.progress} className="h-1.5" />
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-sm">
              {currentLanguage === 'ar' ? 'لا توجد أهداف نشطة' : 'No active goals'}
            </p>
            <Link 
              to="/goals" 
              className="inline-block mt-2 text-sm text-primary hover:underline"
            >
              {currentLanguage === 'ar' ? 'إضافة هدف جديد' : 'Add a new goal'}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
