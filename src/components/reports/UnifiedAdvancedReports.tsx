import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Download, TrendingUp, Target, CheckCircle2, Clock,
  Calendar, BarChart3, PieChart, Loader2, Flame, Brain,
  Wallet, FolderKanban
} from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { useTasks } from '@/hooks/useTasks';
import { useProjects } from '@/hooks/useProjects';
import { useGoals } from '@/hooks/useGoals';
import { useHabitsWithLogs } from '@/hooks/useHabits';
import { useAccounts, useTransactions } from '@/hooks/useFinance';
import { usePomodoroSessions } from '@/hooks/usePomodoro';
import { useMoodLogs } from '@/hooks/useMoodLogs';
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval, differenceInDays } from 'date-fns';
import { ar } from 'date-fns/locale';
import {
  LineChart, Line, BarChart, Bar, PieChart as RechartsPie, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';

const COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  'hsl(var(--primary))',
];

export function UnifiedAdvancedReports() {
  const { currentLanguage } = useLanguage();
  const language = currentLanguage;
  const [period, setPeriod] = useState<'week' | 'month'>('week');

  const { data: tasks, isLoading: tasksLoading } = useTasks();
  const { data: projects } = useProjects();
  const { data: goals } = useGoals();
  const { data: habits } = useHabitsWithLogs();
  const { data: accounts } = useAccounts();
  const { data: transactions } = useTransactions(100);
  const { data: pomodoroSessions } = usePomodoroSessions();
  const { data: moodLogs } = useMoodLogs();

  const dateRange = useMemo(() => {
    const now = new Date();
    if (period === 'week') {
      return { start: startOfWeek(now, { weekStartsOn: 6 }), end: endOfWeek(now, { weekStartsOn: 6 }) };
    }
    return { start: startOfMonth(now), end: endOfMonth(now) };
  }, [period]);

  // Productivity Stats
  const productivityStats = useMemo(() => {
    const periodTasks = tasks?.filter(t => {
      if (!t.created_at) return false;
      return isWithinInterval(new Date(t.created_at), dateRange);
    }) || [];

    const completedTasks = periodTasks.filter(t => t.status === 'done');
    const totalFocusMinutes = pomodoroSessions?.filter(s => {
      return isWithinInterval(new Date(s.completed_at), dateRange) && s.session_type === 'work';
    }).reduce((sum, s) => sum + s.duration_minutes, 0) || 0;

    const habitLogs = habits?.flatMap(h => h.logs || []).filter(l => {
      return isWithinInterval(new Date(l.completed_at), dateRange);
    }) || [];

    const avgMood = moodLogs?.filter(m => {
      return isWithinInterval(new Date(m.date), dateRange);
    }).reduce((sum, m, _, arr) => sum + (m.mood_score || 0) / arr.length, 0) || 0;

    return {
      tasksCreated: periodTasks.length,
      tasksCompleted: completedTasks.length,
      completionRate: periodTasks.length > 0 ? (completedTasks.length / periodTasks.length) * 100 : 0,
      focusHours: Math.round(totalFocusMinutes / 60 * 10) / 10,
      habitCompletions: habitLogs.length,
      avgMood: Math.round(avgMood * 10) / 10,
    };
  }, [tasks, pomodoroSessions, habits, moodLogs, dateRange]);

  // Daily Activity Data
  const dailyActivityData = useMemo(() => {
    const days = period === 'week' ? 7 : differenceInDays(dateRange.end, dateRange.start) + 1;
    const data = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dayTasks = tasks?.filter(t => {
        if (!t.completed_at) return false;
        return format(new Date(t.completed_at), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
      }).length || 0;

      const dayPomodoros = pomodoroSessions?.filter(s => {
        return format(new Date(s.completed_at), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd') && s.session_type === 'work';
      }).reduce((sum, s) => sum + s.duration_minutes, 0) || 0;

      const dayHabits = habits?.flatMap(h => h.logs || []).filter(l => {
        return format(new Date(l.completed_at), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
      }).length || 0;

      data.push({
        date: format(date, 'EEE', { locale: language === 'ar' ? ar : undefined }),
        tasks: dayTasks,
        focusMinutes: dayPomodoros,
        habits: dayHabits,
      });
    }

    return data;
  }, [tasks, pomodoroSessions, habits, period, dateRange, language]);

  // Cross-pillar Performance Radar
  const performanceRadarData = useMemo(() => {
    const taskScore = productivityStats.completionRate;
    const habitScore = habits?.length ? (productivityStats.habitCompletions / (habits.length * (period === 'week' ? 7 : 30))) * 100 : 0;
    const focusScore = Math.min((productivityStats.focusHours / (period === 'week' ? 20 : 80)) * 100, 100);
    const moodScore = (productivityStats.avgMood / 5) * 100;
    
    const projectProgress = projects?.filter(p => p.status === 'active')
      .reduce((sum, p, _, arr) => sum + (p.progress || 0) / arr.length, 0) || 0;
    
    const goalProgress = goals?.filter(g => g.is_active)
      .reduce((sum, g, _, arr) => {
        const progress = g.target_value ? ((g.current_value || 0) / g.target_value) * 100 : 0;
        return sum + progress / arr.length;
      }, 0) || 0;

    return [
      { subject: language === 'ar' ? 'المهام' : 'Tasks', value: Math.round(taskScore), fullMark: 100 },
      { subject: language === 'ar' ? 'العادات' : 'Habits', value: Math.round(habitScore), fullMark: 100 },
      { subject: language === 'ar' ? 'التركيز' : 'Focus', value: Math.round(focusScore), fullMark: 100 },
      { subject: language === 'ar' ? 'المزاج' : 'Mood', value: Math.round(moodScore), fullMark: 100 },
      { subject: language === 'ar' ? 'المشاريع' : 'Projects', value: Math.round(projectProgress), fullMark: 100 },
      { subject: language === 'ar' ? 'الأهداف' : 'Goals', value: Math.round(goalProgress), fullMark: 100 },
    ];
  }, [productivityStats, habits, projects, goals, period, language]);

  // Financial Summary
  const financialSummary = useMemo(() => {
    const periodTransactions = transactions?.filter(t => {
      return isWithinInterval(new Date(t.date), dateRange);
    }) || [];

    const income = periodTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expenses = periodTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const totalBalance = accounts?.reduce((sum, a) => sum + (a.balance || 0), 0) || 0;

    return { income, expenses, net: income - expenses, totalBalance };
  }, [transactions, accounts, dateRange]);

  const handleExport = () => {
    const report = {
      period: period === 'week' ? 'Weekly' : 'Monthly',
      generatedAt: new Date().toISOString(),
      productivity: productivityStats,
      financial: financialSummary,
      dailyActivity: dailyActivityData,
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `unified-report-${period}-${format(new Date(), 'yyyy-MM-dd')}.json`;
    a.click();
  };

  if (tasksLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            {language === 'ar' ? 'التقارير المتقدمة الموحدة' : 'Unified Advanced Reports'}
          </h2>
          <p className="text-muted-foreground">
            {language === 'ar' ? 'تحليل شامل للإنتاجية عبر جميع الأقسام' : 'Cross-pillar productivity analysis'}
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={period} onValueChange={(v: 'week' | 'month') => setPeriod(v)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">{language === 'ar' ? 'أسبوعي' : 'Weekly'}</SelectItem>
              <SelectItem value="month">{language === 'ar' ? 'شهري' : 'Monthly'}</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleExport}>
            <Download className="w-4 h-4 me-2" />
            {language === 'ar' ? 'تصدير' : 'Export'}
          </Button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="glass-card">
          <CardContent className="p-4 text-center">
            <CheckCircle2 className="w-6 h-6 text-success mx-auto mb-2" />
            <p className="text-2xl font-bold">{productivityStats.tasksCompleted}</p>
            <p className="text-xs text-muted-foreground">{language === 'ar' ? 'مهام مكتملة' : 'Tasks Done'}</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4 text-center">
            <Target className="w-6 h-6 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold">{Math.round(productivityStats.completionRate)}%</p>
            <p className="text-xs text-muted-foreground">{language === 'ar' ? 'معدل الإنجاز' : 'Completion'}</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4 text-center">
            <Clock className="w-6 h-6 text-blue-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{productivityStats.focusHours}h</p>
            <p className="text-xs text-muted-foreground">{language === 'ar' ? 'ساعات التركيز' : 'Focus Hours'}</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4 text-center">
            <Flame className="w-6 h-6 text-orange-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{productivityStats.habitCompletions}</p>
            <p className="text-xs text-muted-foreground">{language === 'ar' ? 'عادات مكتملة' : 'Habits Done'}</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4 text-center">
            <Brain className="w-6 h-6 text-purple-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{productivityStats.avgMood}/5</p>
            <p className="text-xs text-muted-foreground">{language === 'ar' ? 'متوسط المزاج' : 'Avg Mood'}</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4 text-center">
            <Wallet className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{financialSummary.net >= 0 ? '+' : ''}{financialSummary.net.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">{language === 'ar' ? 'صافي الفترة' : 'Net Flow'}</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Radar */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              {language === 'ar' ? 'أداء الأقسام' : 'Cross-Pillar Performance'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={performanceRadarData}>
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <Radar
                    name={language === 'ar' ? 'الأداء' : 'Performance'}
                    dataKey="value"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary))"
                    fillOpacity={0.3}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Daily Activity */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              {language === 'ar' ? 'النشاط اليومي' : 'Daily Activity'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyActivityData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Bar dataKey="tasks" name={language === 'ar' ? 'المهام' : 'Tasks'} fill="hsl(var(--chart-1))" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="habits" name={language === 'ar' ? 'العادات' : 'Habits'} fill="hsl(var(--chart-2))" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Period Comparison */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>{language === 'ar' ? 'ملخص الفترة' : 'Period Summary'}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">{language === 'ar' ? 'معدل إنجاز المهام' : 'Task Completion'}</span>
                <span className="font-medium">{Math.round(productivityStats.completionRate)}%</span>
              </div>
              <Progress value={productivityStats.completionRate} className="h-2" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">{language === 'ar' ? 'التزام العادات' : 'Habit Streak'}</span>
                <span className="font-medium">{habits?.length ? Math.round((productivityStats.habitCompletions / (habits.length * (period === 'week' ? 7 : 30))) * 100) : 0}%</span>
              </div>
              <Progress value={habits?.length ? (productivityStats.habitCompletions / (habits.length * (period === 'week' ? 7 : 30))) * 100 : 0} className="h-2" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">{language === 'ar' ? 'هدف التركيز' : 'Focus Goal'}</span>
                <span className="font-medium">{Math.min(Math.round((productivityStats.focusHours / (period === 'week' ? 20 : 80)) * 100), 100)}%</span>
              </div>
              <Progress value={Math.min((productivityStats.focusHours / (period === 'week' ? 20 : 80)) * 100, 100)} className="h-2" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">{language === 'ar' ? 'الصحة النفسية' : 'Wellbeing'}</span>
                <span className="font-medium">{Math.round((productivityStats.avgMood / 5) * 100)}%</span>
              </div>
              <Progress value={(productivityStats.avgMood / 5) * 100} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
