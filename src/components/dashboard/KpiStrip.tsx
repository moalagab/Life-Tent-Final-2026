import { ArrowUpRight, Wallet, CheckSquare, Flame, TrendingDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/hooks/useLanguage';
import { useMonthlyStats } from '@/hooks/useFinance';
import { useTasks } from '@/hooks/useTasks';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { isToday, isPast, parseISO, startOfDay } from 'date-fns';

interface Kpi {
  label: string;
  value: string;
  sub: string;
  icon: typeof Wallet;
  to: string;
  emphasis?: 'positive' | 'negative' | 'neutral';
}

/**
 * KpiStrip — flat, divider-separated KPIs in one continuous strip.
 * No card-per-KPI noise. One glance, four numbers.
 */
export function KpiStrip() {
  const { t, currentLanguage } = useLanguage();
  const isAr = currentLanguage === 'ar';
  const { data: stats, isLoading: statsLoading } = useMonthlyStats();
  const { data: tasks, isLoading: tasksLoading } = useTasks();

  const isLoading = statsLoading || tasksLoading;

  const todayStart = startOfDay(new Date());
  const tasksToday = tasks?.filter((t) => {
    if (!t.due_date) return false;
    return isToday(parseISO(t.due_date));
  }) || [];
  const tasksTodayDone = tasksToday.filter((t) => t.status === 'done').length;
  const focusPct = tasksToday.length > 0
    ? Math.round((tasksTodayDone / tasksToday.length) * 100)
    : 0;

  const tasksDueCount = tasks?.filter((t) => {
    if (t.status === 'done' || !t.due_date) return false;
    const d = parseISO(t.due_date);
    return isToday(d) || (isPast(d) && d < todayStart);
  }).length || 0;

  const overdueCount = tasks?.filter((t) => {
    if (t.status === 'done' || !t.due_date) return false;
    const d = parseISO(t.due_date);
    return isPast(d) && d < todayStart;
  }).length || 0;

  const netWorth = stats?.netWorth || 0;
  const monthlyExpenses = stats?.monthlyExpenses || 0;
  const monthlyIncome = stats?.monthlyIncome || 0;
  const burnDelta = monthlyIncome - monthlyExpenses;

  const fmt = (n: number) => n.toLocaleString(isAr ? 'ar-SA' : 'en-US');

  const kpis: Kpi[] = [
    {
      label: t('dashboard.netWorthLabel'),
      value: `${fmt(netWorth)}`,
      sub: burnDelta >= 0
        ? `+${fmt(burnDelta)} ${t('dashboard.thisMonth')}`
        : `${fmt(burnDelta)} ${t('dashboard.thisMonth')}`,
      icon: Wallet,
      to: '/finance?tab=dashboard',
      emphasis: burnDelta >= 0 ? 'positive' : 'negative',
    },
    {
      label: t('dashboard.monthlyBurnLabel'),
      value: fmt(monthlyExpenses),
      sub: monthlyIncome > 0
        ? `${Math.round((monthlyExpenses / monthlyIncome) * 100)}% ${t('dashboard.ofIncome')}`
        : t('dashboard.noIncomeTracked'),
      icon: TrendingDown,
      to: '/finance?tab=transactions',
      emphasis: 'neutral',
    },
    {
      label: t('dashboard.focusTodayLabel'),
      value: tasksToday.length > 0 ? `${focusPct}%` : '—',
      sub: tasksToday.length > 0
        ? `${tasksTodayDone}/${tasksToday.length} ${t('dashboard.tasksDone')}`
        : t('dashboard.noTasksToday'),
      icon: Flame,
      to: '/tasks?filter=today',
      emphasis: focusPct >= 70 ? 'positive' : 'neutral',
    },
    {
      label: t('dashboard.tasksDueLabel'),
      value: String(tasksDueCount),
      sub: overdueCount > 0
        ? `${overdueCount} ${t('dashboard.overdue')}`
        : t('dashboard.noneOverdue'),
      icon: CheckSquare,
      to: overdueCount > 0 ? '/tasks?filter=overdue' : '/tasks?filter=today',
      emphasis: overdueCount > 0 ? 'negative' : 'neutral',
    },
  ];

  return (
    <section
      aria-label={t('dashboard.keyIndicators')}
      className="rounded-2xl bg-card/40 border border-border/40 overflow-hidden"
    >
      <div className="grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x rtl:lg:divide-x-reverse divide-border/40">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-4 lg:p-5">
                <Skeleton className="h-3 w-20 mb-3" />
                <Skeleton className="h-7 w-28 mb-2" />
                <Skeleton className="h-3 w-24" />
              </div>
            ))
          : kpis.map((kpi) => (
              <Link
                key={kpi.label}
                to={kpi.to}
                className="group relative p-4 lg:p-5 hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <kpi.icon className="w-3.5 h-3.5 text-muted-foreground/70" strokeWidth={2} />
                    <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                      {kpi.label}
                    </p>
                  </div>
                  <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground/0 group-hover:text-muted-foreground transition-colors rtl:-scale-x-100" />
                </div>
                <p className="text-2xl lg:text-[26px] font-semibold text-foreground tabular-nums leading-none">
                  {kpi.value}
                </p>
                <p
                  className={cn(
                    'text-xs mt-2 truncate',
                    kpi.emphasis === 'positive' && 'text-success',
                    kpi.emphasis === 'negative' && 'text-destructive',
                    (!kpi.emphasis || kpi.emphasis === 'neutral') && 'text-muted-foreground'
                  )}
                >
                  {kpi.sub}
                </p>
              </Link>
            ))}
      </div>
    </section>
  );
}
