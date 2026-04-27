import { Link } from 'react-router-dom';
import { ArrowUpRight, Wallet, CheckSquare, Flame, TrendingDown } from 'lucide-react';
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
 * KpiStrip — 4 single-glance numbers across the top.
 * KPIs:
 *  1. Net worth (finance)
 *  2. Monthly burn (this month's expenses)
 *  3. Focus progress (today's tasks done / total scheduled today)
 *  4. Tasks due (overdue + due today)
 */
export function KpiStrip() {
  const { currentLanguage } = useLanguage();
  const isAr = currentLanguage === 'ar';
  const { data: stats, isLoading: statsLoading } = useMonthlyStats();
  const { data: tasks, isLoading: tasksLoading } = useTasks();

  const isLoading = statsLoading || tasksLoading;

  const todayStart = startOfDay(new Date());
  const tasksToday = tasks?.filter((t) => {
    if (!t.due_date) return false;
    const d = parseISO(t.due_date);
    return isToday(d);
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

  const kpis: Kpi[] = [
    {
      label: isAr ? 'صافي الثروة' : 'Net worth',
      value: `${netWorth.toLocaleString()} ${isAr ? 'ر.س' : 'SAR'}`,
      sub:
        burnDelta >= 0
          ? `+${burnDelta.toLocaleString()} ${isAr ? 'هذا الشهر' : 'this month'}`
          : `${burnDelta.toLocaleString()} ${isAr ? 'هذا الشهر' : 'this month'}`,
      icon: Wallet,
      to: '/finance',
      emphasis: burnDelta >= 0 ? 'positive' : 'negative',
    },
    {
      label: isAr ? 'المصروف الشهري' : 'Monthly burn',
      value: `${monthlyExpenses.toLocaleString()} ${isAr ? 'ر.س' : 'SAR'}`,
      sub: monthlyIncome > 0
        ? `${Math.round((monthlyExpenses / monthlyIncome) * 100)}% ${isAr ? 'من الدخل' : 'of income'}`
        : (isAr ? 'لا يوجد دخل مسجّل' : 'no income tracked'),
      icon: TrendingDown,
      to: '/finance',
      emphasis: 'neutral',
    },
    {
      label: isAr ? 'تركيز اليوم' : 'Focus progress',
      value: tasksToday.length > 0 ? `${focusPct}%` : '—',
      sub: tasksToday.length > 0
        ? `${tasksTodayDone}/${tasksToday.length} ${isAr ? 'اليوم' : 'today'}`
        : (isAr ? 'لا مهام مجدولة اليوم' : 'no tasks scheduled'),
      icon: Flame,
      to: '/tasks',
      emphasis: focusPct >= 70 ? 'positive' : 'neutral',
    },
    {
      label: isAr ? 'مهام مستحقة' : 'Tasks due',
      value: String(tasksDueCount),
      sub: overdueCount > 0
        ? `${overdueCount} ${isAr ? 'متأخرة' : 'overdue'}`
        : (isAr ? 'لا متأخرات' : 'none overdue'),
      icon: CheckSquare,
      to: '/tasks',
      emphasis: overdueCount > 0 ? 'negative' : 'neutral',
    },
  ];

  return (
    <section aria-label={isAr ? 'مؤشرات رئيسية' : 'Key indicators'}>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="p-4 lg:p-5 rounded-2xl bg-card/60 border border-border/40"
              >
                <div className="flex items-start justify-between mb-3">
                  <Skeleton className="w-9 h-9 rounded-xl" />
                </div>
                <Skeleton className="h-3 w-20 mb-2" />
                <Skeleton className="h-7 w-24 mb-2" />
                <Skeleton className="h-3 w-16" />
              </div>
            ))
          : kpis.map((kpi) => (
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
                <p className="text-2xl lg:text-[26px] font-bold text-foreground ticker-num leading-tight">
                  {kpi.value}
                </p>
                <p
                  className={cn(
                    'text-xs mt-1 truncate',
                    kpi.emphasis === 'positive' && 'text-primary',
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
