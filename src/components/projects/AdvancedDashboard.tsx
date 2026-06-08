import { useMemo } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { useProjects } from '@/hooks/useProjects';
import { useTasks } from '@/hooks/useTasks';
import { useProjectOkrsWithKeyResults } from '@/hooks/useProjectOkrs';
import { usePlanningPipelines } from '@/hooks/usePlanningPipeline';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { 
  BarChart3, TrendingUp, FolderKanban, CheckCircle, 
  Clock, AlertTriangle, Target, Calendar, DollarSign,
  Lightbulb, Rocket, ArrowUpRight, ArrowDownRight,
  Download, FileText, Activity
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line,
  AreaChart, Area, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import { format, subDays, eachDayOfInterval, differenceInDays, parseISO, isAfter } from 'date-fns';
import { ar } from 'date-fns/locale';
import { exportProjects } from '@/lib/export-utils';

export function AdvancedDashboard() {
  const { currentLanguage } = useLanguage();
  const { data: projects } = useProjects();
  const { data: tasks } = useTasks();
  const { data: okrs } = useProjectOkrsWithKeyResults();
  const { data: pipelines } = usePlanningPipelines();

  const stats = useMemo(() => {
    if (!projects) return null;

    const total = projects.length;
    const active = projects.filter(p => p.status === 'active').length;
    const onHold = projects.filter(p => p.status === 'on_hold').length;
    const completed = projects.filter(p => p.status === 'completed').length;
    const archived = projects.filter(p => p.status === 'archived' || p.para_category === 'archive').length;

    // Budget Analysis
    const totalEstimatedBudget = projects.reduce((sum, p) => sum + (p.estimated_budget || 0), 0);
    const totalActualBudget = projects.reduce((sum, p) => sum + (p.actual_budget || 0), 0);
    const budgetVariance = totalEstimatedBudget - totalActualBudget;

    // Risk Distribution
    const riskData = [
      { name: currentLanguage === 'ar' ? 'منخفض' : 'Low', value: projects.filter(p => p.risk_level === 'low').length, fill: 'hsl(var(--success))' },
      { name: currentLanguage === 'ar' ? 'متوسط' : 'Medium', value: projects.filter(p => p.risk_level === 'medium' || !p.risk_level).length, fill: 'hsl(var(--warning))' },
      { name: currentLanguage === 'ar' ? 'عالي' : 'High', value: projects.filter(p => p.risk_level === 'high').length, fill: 'hsl(var(--destructive))' },
    ].filter(d => d.value > 0);

    // Phase distribution
    const phaseData = [
      { name: currentLanguage === 'ar' ? 'البدء' : 'Initiation', value: projects.filter(p => p.phase === 'initiation').length },
      { name: currentLanguage === 'ar' ? 'التخطيط' : 'Planning', value: projects.filter(p => p.phase === 'planning').length },
      { name: currentLanguage === 'ar' ? 'التنفيذ' : 'Execution', value: projects.filter(p => p.phase === 'execution').length },
      { name: currentLanguage === 'ar' ? 'المراقبة' : 'Monitoring', value: projects.filter(p => p.phase === 'monitoring').length },
      { name: currentLanguage === 'ar' ? 'الإغلاق' : 'Closing', value: projects.filter(p => p.phase === 'closing').length },
    ];

    // PARA distribution
    const paraData = [
      { name: currentLanguage === 'ar' ? 'مشاريع' : 'Projects', value: projects.filter(p => p.para_category === 'project' || !p.para_category).length },
      { name: currentLanguage === 'ar' ? 'مجالات' : 'Areas', value: projects.filter(p => p.para_category === 'area').length },
      { name: currentLanguage === 'ar' ? 'موارد' : 'Resources', value: projects.filter(p => p.para_category === 'resource').length },
      { name: currentLanguage === 'ar' ? 'أرشيف' : 'Archive', value: projects.filter(p => p.para_category === 'archive').length },
    ];

    // Average progress
    const avgProgress = projects.length > 0 
      ? Math.round(projects.reduce((sum, p) => sum + (p.progress || 0), 0) / projects.length)
      : 0;

    // OKR Progress
    const okrProgress = okrs && okrs.length > 0
      ? Math.round(okrs.reduce((sum, o) => sum + (o.progress || 0), 0) / okrs.length)
      : 0;

    // Pipeline stats
    const pipelineInProgress = pipelines?.filter(p => p.status === 'in_progress').length || 0;
    const pipelineApproved = pipelines?.filter(p => p.decision === 'go').length || 0;

    // Upcoming deadlines
    const upcomingDeadlines = projects
      .filter(p => p.due_date && isAfter(parseISO(p.due_date), new Date()))
      .sort((a, b) => differenceInDays(parseISO(a.due_date!), new Date()) - differenceInDays(parseISO(b.due_date!), new Date()))
      .slice(0, 5);

    // Weekly activity (last 14 days for more data)
    const last14Days = eachDayOfInterval({
      start: subDays(new Date(), 13),
      end: new Date()
    });

    const weeklyData = last14Days.map(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const projectsCreated = projects.filter(p => 
        format(new Date(p.created_at), 'yyyy-MM-dd') === dayStr
      ).length;
      const tasksCompleted = tasks?.filter(t => 
        t.completed_at && format(new Date(t.completed_at), 'yyyy-MM-dd') === dayStr
      ).length || 0;

      return {
        day: format(day, 'dd/MM'),
        projects: projectsCreated,
        tasks: tasksCompleted,
      };
    });

    // Health Score Calculation
    const onTimeProjects = projects.filter(p => {
      if (!p.due_date) return true;
      return !isAfter(new Date(), parseISO(p.due_date)) || p.status === 'completed';
    }).length;
    const healthScore = projects.length > 0 ? Math.round((onTimeProjects / projects.length) * 100) : 100;

    return { 
      total, active, onHold, completed, archived, 
      phaseData, paraData, avgProgress, weeklyData,
      totalEstimatedBudget, totalActualBudget, budgetVariance,
      riskData, okrProgress, pipelineInProgress, pipelineApproved,
      upcomingDeadlines, healthScore
    };
  }, [projects, tasks, okrs, pipelines, currentLanguage]);

  const handleExportProjects = () => {
    if (projects) {
      exportProjects(projects);
    }
  };

  if (!stats) return null;

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--success))', 'hsl(var(--warning))', 'hsl(var(--destructive))', 'hsl(var(--muted-foreground))'];

  return (
    <div className="space-y-6">
      {/* Export Button */}
      <div className="flex justify-end">
        <Button variant="outline" onClick={handleExportProjects}>
          <Download className="w-4 h-4 me-2" />
          {currentLanguage === 'ar' ? 'تصدير التقارير' : 'Export Reports'}
        </Button>
      </div>

      {/* Main KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <StatCard
          icon={FolderKanban}
          value={stats.total}
          label={currentLanguage === 'ar' ? 'إجمالي المشاريع' : 'Total Projects'}
          color="text-primary"
          bgColor="bg-primary/10"
        />
        <StatCard
          icon={TrendingUp}
          value={stats.active}
          label={currentLanguage === 'ar' ? 'نشط' : 'Active'}
          color="text-success"
          bgColor="bg-success/10"
        />
        <StatCard
          icon={CheckCircle}
          value={stats.completed}
          label={currentLanguage === 'ar' ? 'مكتمل' : 'Completed'}
          color="text-primary"
          bgColor="bg-primary/10"
        />
        <StatCard
          icon={Target}
          value={`${stats.avgProgress}%`}
          label={currentLanguage === 'ar' ? 'متوسط التقدم' : 'Avg Progress'}
          color="text-primary"
          bgColor="bg-primary/10"
        />
        <StatCard
          icon={Activity}
          value={`${stats.healthScore}%`}
          label={currentLanguage === 'ar' ? 'صحة المشاريع' : 'Health Score'}
          color={stats.healthScore >= 70 ? "text-success" : stats.healthScore >= 50 ? "text-warning" : "text-destructive"}
          bgColor={stats.healthScore >= 70 ? "bg-success/10" : stats.healthScore >= 50 ? "bg-warning/10" : "bg-destructive/10"}
        />
        <StatCard
          icon={Lightbulb}
          value={stats.pipelineInProgress}
          label={currentLanguage === 'ar' ? 'قيد التخطيط' : 'In Pipeline'}
          color="text-warning"
          bgColor="bg-warning/10"
        />
      </div>

      {/* Budget & OKR Section */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Budget Overview */}
        <div className="glass-card p-4">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-primary" />
            {currentLanguage === 'ar' ? 'نظرة عامة على الميزانية' : 'Budget Overview'}
          </h3>
          <div className="space-y-4">
            <div>
              <p className="text-xs text-muted-foreground">
                {currentLanguage === 'ar' ? 'الميزانية المقدرة' : 'Estimated Budget'}
              </p>
              <p className="text-xl font-bold text-foreground">
                {stats.totalEstimatedBudget.toLocaleString()} SAR
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">
                {currentLanguage === 'ar' ? 'الميزانية الفعلية' : 'Actual Budget'}
              </p>
              <p className="text-xl font-bold text-foreground">
                {stats.totalActualBudget.toLocaleString()} SAR
              </p>
            </div>
            <div className={cn(
              "flex items-center gap-2 p-2 rounded-lg",
              stats.budgetVariance >= 0 ? "bg-success/10" : "bg-destructive/10"
            )}>
              {stats.budgetVariance >= 0 ? (
                <ArrowDownRight className="w-4 h-4 text-success" />
              ) : (
                <ArrowUpRight className="w-4 h-4 text-destructive" />
              )}
              <span className={cn(
                "text-sm font-medium",
                stats.budgetVariance >= 0 ? "text-success" : "text-destructive"
              )}>
                {Math.abs(stats.budgetVariance).toLocaleString()} SAR {stats.budgetVariance >= 0 ? (currentLanguage === 'ar' ? 'وفر' : 'saved') : (currentLanguage === 'ar' ? 'تجاوز' : 'over')}
              </span>
            </div>
          </div>
        </div>

        {/* OKR Progress */}
        <div className="glass-card p-4">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <Rocket className="w-4 h-4 text-primary" />
            {currentLanguage === 'ar' ? 'تقدم OKRs' : 'OKR Progress'}
          </h3>
          <div className="flex items-center justify-center h-32">
            <div className="relative">
              <svg className="w-32 h-32 transform -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="hsl(var(--muted))"
                  strokeWidth="12"
                  fill="none"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="hsl(var(--primary))"
                  strokeWidth="12"
                  fill="none"
                  strokeDasharray={`${stats.okrProgress * 3.52} 352`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold text-foreground">{stats.okrProgress}%</span>
              </div>
            </div>
          </div>
          <p className="text-center text-sm text-muted-foreground mt-2">
            {currentLanguage === 'ar' ? `${okrs?.length || 0} أهداف` : `${okrs?.length || 0} Objectives`}
          </p>
        </div>

        {/* Risk Distribution */}
        <div className="glass-card p-4">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-primary" />
            {currentLanguage === 'ar' ? 'توزيع المخاطر' : 'Risk Distribution'}
          </h3>
          {stats.riskData.length > 0 ? (
            <div className="h-32">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.riskData}
                    cx="50%"
                    cy="50%"
                    innerRadius={30}
                    outerRadius={50}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {stats.riskData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              {currentLanguage === 'ar' ? 'لا توجد بيانات' : 'No data'}
            </p>
          )}
          <div className="flex justify-center gap-4 mt-2">
            {stats.riskData.map((item, i) => (
              <div key={i} className="flex items-center gap-1 text-xs">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.fill }} />
                <span className="text-muted-foreground">{item.name}: {item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Phase Distribution (Radar) */}
        <div className="glass-card p-4">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary" />
            {currentLanguage === 'ar' ? 'توزيع المراحل (PMBOK)' : 'Phase Distribution (PMBOK)'}
          </h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={stats.phaseData}>
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                <PolarRadiusAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                <Radar 
                  name="Projects" 
                  dataKey="value" 
                  stroke="hsl(var(--primary))" 
                  fill="hsl(var(--primary))" 
                  fillOpacity={0.4} 
                />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* PARA Distribution */}
        <div className="glass-card p-4">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" />
            {currentLanguage === 'ar' ? 'توزيع PARA' : 'PARA Distribution'}
          </h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.paraData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {stats.paraData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Activity Timeline */}
      <div className="glass-card p-4">
        <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary" />
          {currentLanguage === 'ar' ? 'النشاط (آخر 14 يوم)' : 'Activity (Last 14 Days)'}
        </h3>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={stats.weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Area 
                type="monotone" 
                dataKey="tasks" 
                stackId="1"
                stroke="hsl(var(--success))" 
                fill="hsl(var(--success))"
                fillOpacity={0.3}
                name={currentLanguage === 'ar' ? 'مهام مكتملة' : 'Tasks Completed'}
              />
              <Area 
                type="monotone" 
                dataKey="projects" 
                stackId="2"
                stroke="hsl(var(--primary))" 
                fill="hsl(var(--primary))"
                fillOpacity={0.3}
                name={currentLanguage === 'ar' ? 'مشاريع جديدة' : 'New Projects'}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Upcoming Deadlines */}
      {stats.upcomingDeadlines.length > 0 && (
        <div className="glass-card p-4">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            {currentLanguage === 'ar' ? 'المواعيد القادمة' : 'Upcoming Deadlines'}
          </h3>
          <div className="space-y-3">
            {stats.upcomingDeadlines.map((project) => {
              const daysLeft = differenceInDays(parseISO(project.due_date!), new Date());
              return (
                <div key={project.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-medium text-foreground text-sm">{project.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(parseISO(project.due_date!), 'dd MMM yyyy', { locale: currentLanguage === 'ar' ? ar : undefined })}
                    </p>
                  </div>
                  <div className={cn(
                    "px-2 py-1 rounded-full text-xs font-medium",
                    daysLeft <= 3 ? "bg-destructive/10 text-destructive" :
                    daysLeft <= 7 ? "bg-warning/10 text-warning" :
                    "bg-success/10 text-success"
                  )}>
                    {daysLeft} {currentLanguage === 'ar' ? 'يوم' : 'days'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

interface StatCardProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: any;
  value: string | number;
  label: string;
  color: string;
  bgColor: string;
}

function StatCard({ icon: Icon, value, label, color, bgColor }: StatCardProps) {
  return (
    <div className="glass-card p-4 text-center">
      <div className={cn('w-10 h-10 rounded-xl mx-auto mb-2 flex items-center justify-center', bgColor)}>
        <Icon className={cn('w-5 h-5', color)} />
      </div>
      <div className="text-2xl font-bold text-foreground">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
