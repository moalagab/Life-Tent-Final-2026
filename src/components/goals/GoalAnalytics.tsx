import { useMemo } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, TrendingUp, CheckCircle2, Clock, Users, User, Cog, GraduationCap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Goal {
  id: string;
  title: string;
  perspective: string | null;
  target_value: number | null;
  current_value: number | null;
  created_at: string;
  end_date: string | null;
}

interface KeyResult {
  id: string;
  goal_id: string;
  current_value: number | null;
  target_value: number;
}

interface GoalAnalyticsProps {
  goals: Goal[];
  keyResults: KeyResult[];
}

const COLORS = {
  personal: '#f59e0b',
  financial: 'hsl(var(--primary))',
  customer: '#3b82f6',
  processes: '#10b981',
  learning: '#8b5cf6',
};

const perspectiveIcons = {
  personal: User,
  financial: TrendingUp,
  customer: Users,
  processes: Cog,
  learning: GraduationCap,
};

export function GoalAnalytics({ goals, keyResults }: GoalAnalyticsProps) {
  const { t, currentLanguage } = useLanguage();

  const analytics = useMemo(() => {
    // Calculate progress for each goal
    const goalsWithProgress = goals.map(goal => {
      const gKRs = keyResults.filter(kr => kr.goal_id === goal.id);
      let progress = 0;
      
      if (gKRs.length > 0) {
        progress = Math.round(
          gKRs.reduce((sum, kr) => sum + ((kr.current_value || 0) / kr.target_value * 100), 0) / gKRs.length
        );
      } else if (goal.target_value && goal.target_value > 0) {
        progress = Math.round(((goal.current_value || 0) / goal.target_value) * 100);
      }
      
      return { ...goal, progress: Math.min(progress, 100) };
    });

    // Distribution by perspective
    const perspectiveData = Object.entries(
      goalsWithProgress.reduce((acc, goal) => {
        const perspective = goal.perspective || 'personal';
        acc[perspective] = (acc[perspective] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    ).map(([name, value]) => ({
      name: currentLanguage === 'ar' 
        ? (name === 'personal' ? 'شخصي' : name === 'financial' ? 'مالي' : name === 'customer' ? 'عملاء' : name === 'processes' ? 'عمليات' : 'تعلم')
        : name.charAt(0).toUpperCase() + name.slice(1),
      value,
      color: COLORS[name as keyof typeof COLORS] || COLORS.personal,
    }));

    // Progress distribution
    const progressBuckets = [
      { range: '0-25%', min: 0, max: 25, count: 0 },
      { range: '26-50%', min: 26, max: 50, count: 0 },
      { range: '51-75%', min: 51, max: 75, count: 0 },
      { range: '76-100%', min: 76, max: 100, count: 0 },
    ];

    goalsWithProgress.forEach(goal => {
      const bucket = progressBuckets.find(b => goal.progress >= b.min && goal.progress <= b.max);
      if (bucket) bucket.count++;
    });

    const progressData = progressBuckets.map(b => ({
      name: b.range,
      [currentLanguage === 'ar' ? 'الأهداف' : 'Goals']: b.count,
    }));

    // Status summary
    const completed = goalsWithProgress.filter(g => g.progress >= 100).length;
    const inProgress = goalsWithProgress.filter(g => g.progress > 0 && g.progress < 100).length;
    const notStarted = goalsWithProgress.filter(g => g.progress === 0).length;

    // Average progress
    const avgProgress = goalsWithProgress.length > 0
      ? Math.round(goalsWithProgress.reduce((sum, g) => sum + g.progress, 0) / goalsWithProgress.length)
      : 0;

    // Top performing goals
    const topGoals = [...goalsWithProgress]
      .sort((a, b) => b.progress - a.progress)
      .slice(0, 5);

    return {
      perspectiveData,
      progressData,
      completed,
      inProgress,
      notStarted,
      avgProgress,
      topGoals,
      total: goals.length,
    };
  }, [goals, keyResults, currentLanguage]);

  if (goals.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <Target className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{analytics.total}</p>
                <p className="text-xs text-muted-foreground">
                  {currentLanguage === 'ar' ? 'إجمالي الأهداف' : 'Total Goals'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-success/10 to-success/5 border-success/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-success/20 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{analytics.completed}</p>
                <p className="text-xs text-muted-foreground">
                  {currentLanguage === 'ar' ? 'مكتملة' : 'Completed'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
                <Clock className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{analytics.inProgress}</p>
                <p className="text-xs text-muted-foreground">
                  {currentLanguage === 'ar' ? 'قيد التنفيذ' : 'In Progress'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{analytics.avgProgress}%</p>
                <p className="text-xs text-muted-foreground">
                  {currentLanguage === 'ar' ? 'متوسط التقدم' : 'Avg Progress'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">
              {currentLanguage === 'ar' ? 'توزيع الأهداف حسب الفئة' : 'Goals by Category'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics.perspectiveData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {analytics.perspectiveData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Progress Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">
              {currentLanguage === 'ar' ? 'توزيع نسبة الإنجاز' : 'Progress Distribution'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.progressData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  />
                  <YAxis 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar 
                    dataKey={currentLanguage === 'ar' ? 'الأهداف' : 'Goals'} 
                    fill="hsl(var(--primary))" 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Goals */}
      {analytics.topGoals.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              {currentLanguage === 'ar' ? 'أفضل الأهداف أداءً' : 'Top Performing Goals'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.topGoals.map((goal, index) => {
                const Icon = perspectiveIcons[goal.perspective as keyof typeof perspectiveIcons] || User;
                return (
                  <div 
                    key={goal.id} 
                    className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                      {index + 1}
                    </div>
                    <div className={cn(
                      'w-8 h-8 rounded-lg flex items-center justify-center',
                      goal.perspective === 'personal' ? 'bg-primary/10' :
                      goal.perspective === 'financial' ? 'bg-primary/10' :
                      goal.perspective === 'customer' ? 'bg-blue-500/10' :
                      goal.perspective === 'processes' ? 'bg-success/10' :
                      'bg-purple-500/10'
                    )}>
                      <Icon className={cn(
                        'w-4 h-4',
                        goal.perspective === 'personal' ? 'text-primary' :
                        goal.perspective === 'financial' ? 'text-primary' :
                        goal.perspective === 'customer' ? 'text-blue-500' :
                        goal.perspective === 'processes' ? 'text-success' :
                        'text-purple-500'
                      )} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{goal.title}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 rounded-full bg-muted overflow-hidden">
                        <div 
                          className="h-full bg-primary rounded-full transition-all duration-500"
                          style={{ width: `${goal.progress}%` }}
                        />
                      </div>
                      <span className="text-sm font-bold text-foreground w-12 text-end">
                        {goal.progress}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}