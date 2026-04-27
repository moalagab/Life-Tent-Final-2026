import { Link } from 'react-router-dom';
import { ArrowUpRight, Wallet, CheckSquare, Target, FolderKanban } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { useMonthlyStats } from '@/hooks/useFinance';
import { useTasks } from '@/hooks/useTasks';
import { useGoals } from '@/hooks/useGoals';
import { useProjects } from '@/hooks/useProjects';
import { cn } from '@/lib/utils';

interface Kpi {
  label: string;
  value: string;
  sub: string;
  icon: typeof Wallet;
  to: string;
}

/**
 * KpiStrip — 4 single-glance numbers across the top.
 * Replaces 3 separate "snapshot" cards with one breathable horizontal row.
 * Brand colors only: primary accents on hover, muted text otherwise.
 */
export function KpiStrip() {
  const { currentLanguage } = useLanguage();
  const isAr = currentLanguage === 'ar';
  const { data: stats } = useMonthlyStats();
  const { data: tasks } = useTasks();
  const { data: goals } = useGoals();
  const { data: projects } = useProjects();

  const openTasks = tasks?.filter((t) => t.status !== 'done').length || 0;
  const totalTasks = tasks?.length || 0;
  const activeProjects = projects?.filter((p) => p.status === 'active').length || 0;
  const totalProjects = projects?.length || 0;
  const activeGoals = goals?.filter((g) => g.is_active).length || 0;
  const completedGoals =
    goals?.filter((g) => {
      const t = g.target_value || 1;
      const c = g.current_value || 0;
      return c >= t;
    }).length || 0;

  const netWorth = stats?.netWorth || 0;
  const monthlyBalance = (stats?.monthlyIncome || 0) - (stats?.monthlyExpenses || 0);

  const kpis: Kpi[] = [
    {
      label: isAr ? 'صافي الثروة' : 'Net worth',
      value: `${netWorth.toLocaleString()} ${isAr ? 'ر.س' : 'SAR'}`,
      sub:
        monthlyBalance >= 0
          ? `+${monthlyBalance.toLocaleString()} ${isAr ? 'هذا الشهر' : 'this month'}`
          : `${monthlyBalance.toLocaleString()} ${isAr ? 'هذا الشهر' : 'this month'}`,
      icon: Wallet,
      to: '/finance',
    },
    {
      label: isAr ? 'مهام مفتوحة' : 'Open tasks',
      value: String(openTasks),
      sub: `${totalTasks - openTasks}/${totalTasks} ${isAr ? 'مكتمل' : 'done'}`,
      icon: CheckSquare,
      to: '/tasks',
    },
    {
      label: isAr ? 'مشاريع نشطة' : 'Active projects',
      value: String(activeProjects),
      sub: `${totalProjects} ${isAr ? 'إجمالي' : 'total'}`,
      icon: FolderKanban,
      to: '/projects',
    },
    {
      label: isAr ? 'أهداف' : 'Goals',
      value: String(activeGoals),
      sub: `${completedGoals} ${isAr ? 'محققة' : 'achieved'}`,
      icon: Target,
      to: '/goals',
    },
  ];

  return (
    <section aria-label={isAr ? 'مؤشرات رئيسية' : 'Key indicators'}>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        {kpis.map((kpi) => (
          <Link
            key={kpi.label}
            to={kpi.to}
            className={cn(
              'group relative p-4 lg:p-5 rounded-2xl bg-card/60 border border-border/40',
              'hover:border-primary/40 hover:bg-card transition-all'
            )}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="w-9 h-9 rounded-xl bg-muted/60 group-hover:bg-primary/10 flex items-center justify-center transition-colors">
                <kpi.icon className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <ArrowUpRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <p className="text-xs text-muted-foreground mb-1">{kpi.label}</p>
            <p className="text-2xl lg:text-[26px] font-bold text-foreground ticker-num leading-tight">{kpi.value}</p>
            <p className="text-xs text-muted-foreground mt-1 truncate">{kpi.sub}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
