import { useMemo } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { useProjects } from '@/hooks/useProjects';
import { useTasks } from '@/hooks/useTasks';
import { cn } from '@/lib/utils';
import { 
  BarChart3, TrendingUp, FolderKanban, CheckCircle, 
  Clock, AlertTriangle, Target, Calendar
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line 
} from 'recharts';
import { format, subDays, startOfWeek, eachDayOfInterval } from 'date-fns';
import { ar } from 'date-fns/locale';

export function ProjectReports() {
  const { currentLanguage } = useLanguage();
  const { data: projects } = useProjects();
  const { data: tasks } = useTasks();

  const stats = useMemo(() => {
    if (!projects) return null;

    const total = projects.length;
    const active = projects.filter(p => p.status === 'active').length;
    const onHold = projects.filter(p => p.status === 'on_hold').length;
    const completed = projects.filter(p => p.status === 'completed').length;
    const archived = projects.filter(p => p.status === 'archived' || p.para_category === 'archive').length;

    // Phase distribution
    const phaseData = [
      { name: currentLanguage === 'ar' ? 'البدء' : 'Initiation', value: projects.filter(p => p.phase === 'initiation').length },
      { name: currentLanguage === 'ar' ? 'التخطيط' : 'Planning', value: projects.filter(p => p.phase === 'planning').length },
      { name: currentLanguage === 'ar' ? 'التنفيذ' : 'Execution', value: projects.filter(p => p.phase === 'execution').length },
      { name: currentLanguage === 'ar' ? 'المراقبة' : 'Monitoring', value: projects.filter(p => p.phase === 'monitoring').length },
      { name: currentLanguage === 'ar' ? 'الإغلاق' : 'Closing', value: projects.filter(p => p.phase === 'closing').length },
    ].filter(d => d.value > 0);

    // PARA distribution
    const paraData = [
      { name: currentLanguage === 'ar' ? 'مشاريع' : 'Projects', value: projects.filter(p => p.para_category === 'project' || !p.para_category).length },
      { name: currentLanguage === 'ar' ? 'مجالات' : 'Areas', value: projects.filter(p => p.para_category === 'area').length },
      { name: currentLanguage === 'ar' ? 'موارد' : 'Resources', value: projects.filter(p => p.para_category === 'resource').length },
      { name: currentLanguage === 'ar' ? 'أرشيف' : 'Archive', value: projects.filter(p => p.para_category === 'archive').length },
    ].filter(d => d.value > 0);

    // Average progress
    const avgProgress = projects.length > 0 
      ? Math.round(projects.reduce((sum, p) => sum + (p.progress || 0), 0) / projects.length)
      : 0;

    // Weekly activity
    const last7Days = eachDayOfInterval({
      start: subDays(new Date(), 6),
      end: new Date()
    });

    const weeklyData = last7Days.map(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const projectsCreated = projects.filter(p => 
        format(new Date(p.created_at), 'yyyy-MM-dd') === dayStr
      ).length;
      const tasksCompleted = tasks?.filter(t => 
        t.completed_at && format(new Date(t.completed_at), 'yyyy-MM-dd') === dayStr
      ).length || 0;

      return {
        day: format(day, 'EEE', { locale: currentLanguage === 'ar' ? ar : undefined }),
        projects: projectsCreated,
        tasks: tasksCompleted,
      };
    });

    return { total, active, onHold, completed, archived, phaseData, paraData, avgProgress, weeklyData };
  }, [projects, tasks, currentLanguage]);

  if (!stats) return null;

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--success))', 'hsl(var(--warning))', 'hsl(var(--destructive))', 'hsl(var(--muted-foreground))'];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
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
          icon={Clock}
          value={stats.onHold}
          label={currentLanguage === 'ar' ? 'متوقف' : 'On Hold'}
          color="text-warning"
          bgColor="bg-warning/10"
        />
        <StatCard
          icon={CheckCircle}
          value={stats.completed}
          label={currentLanguage === 'ar' ? 'مكتمل' : 'Completed'}
          color="text-muted-foreground"
          bgColor="bg-muted"
        />
        <StatCard
          icon={Target}
          value={`${stats.avgProgress}%`}
          label={currentLanguage === 'ar' ? 'متوسط التقدم' : 'Avg Progress'}
          color="text-primary"
          bgColor="bg-primary/10"
        />
      </div>

      {/* Charts Row */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Phase Distribution */}
        <div className="glass-card p-4">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary" />
            {currentLanguage === 'ar' ? 'توزيع المراحل (PMBOK)' : 'Phase Distribution (PMBOK)'}
          </h3>
          {stats.phaseData.length > 0 ? (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.phaseData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis type="category" dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} width={80} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              {currentLanguage === 'ar' ? 'لا توجد بيانات' : 'No data'}
            </p>
          )}
        </div>

        {/* PARA Distribution */}
        <div className="glass-card p-4">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" />
            {currentLanguage === 'ar' ? 'توزيع PARA' : 'PARA Distribution'}
          </h3>
          {stats.paraData.length > 0 ? (
            <div className="h-48 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.paraData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                    labelLine={false}
                  >
                    {stats.paraData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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
        </div>
      </div>

      {/* Weekly Activity */}
      <div className="glass-card p-4">
        <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary" />
          {currentLanguage === 'ar' ? 'النشاط الأسبوعي' : 'Weekly Activity'}
        </h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={stats.weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="tasks" 
                stroke="hsl(var(--success))" 
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--success))' }}
                name={currentLanguage === 'ar' ? 'مهام مكتملة' : 'Tasks Completed'}
              />
              <Line 
                type="monotone" 
                dataKey="projects" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--primary))' }}
                name={currentLanguage === 'ar' ? 'مشاريع جديدة' : 'New Projects'}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
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
