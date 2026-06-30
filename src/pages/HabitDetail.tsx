import { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { useLanguage } from '@/hooks/useLanguage';
import { useHabits, useHabitLogs } from '@/hooks/useHabits';
import { useGoals } from '@/hooks/useGoals';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { format, subDays, eachDayOfInterval } from 'date-fns';
import { ar } from 'date-fns/locale';
import {
  ArrowRight, Flame, Target, Calendar, Activity, Loader2, TrendingUp,
} from 'lucide-react';

function getFreqLabels(isAr: boolean): Record<string, string> {
  return {
    daily:   isAr ? 'يومي'   : 'Daily',
    weekly:  isAr ? 'أسبوعي' : 'Weekly',
    monthly: isAr ? 'شهري'   : 'Monthly',
  };
}

export default function HabitDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentLanguage } = useLanguage();
  const isAr = currentLanguage === 'ar';
  const dateLocale = isAr ? ar : undefined;
  const FREQ_LABELS = getFreqLabels(isAr);

  const { data: habits }   = useHabits();
  const { data: allLogs }  = useHabitLogs();
  const { data: allGoals } = useGoals();

  const habit = habits?.find(h => h.id === id);
  const logs  = useMemo(() => (allLogs  ?? []).filter(l => l.habit_id  === id), [allLogs,  id]);
  const linkedGoals = useMemo(() => (allGoals ?? []).filter(g => g.habit_id === id), [allGoals, id]);

  // Last 30 days grid
  const last30 = useMemo(() => {
    const days = eachDayOfInterval({ start: subDays(new Date(), 29), end: new Date() });
    const logDates = new Set(logs.map(l => l.completed_at?.slice(0, 10)));
    return days.map(d => ({ date: d, done: logDates.has(format(d, 'yyyy-MM-dd')) }));
  }, [logs]);

  // Streak
  const currentStreak = useMemo(() => {
    const logDates = new Set(logs.map(l => l.completed_at?.slice(0, 10)));
    let streak = 0;
    let d = new Date();
    while (logDates.has(format(d, 'yyyy-MM-dd'))) { streak++; d = subDays(d, 1); }
    return streak;
  }, [logs]);

  const completionRate = useMemo(() => {
    if (last30.length === 0) return 0;
    return Math.round((last30.filter(d => d.done).length / last30.length) * 100);
  }, [last30]);

  const habitColor = habit?.color || '#2563EB';

  if (!habit && habits) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center h-64 gap-3">
          <Flame className="w-12 h-12 text-muted-foreground/30" />
          <p className="text-muted-foreground">{isAr ? 'العادة غير موجودة' : 'Habit not found'}</p>
          <Button variant="outline" onClick={() => navigate('/habits')}>
            {isAr ? 'العودة للعادات' : 'Back to Habits'}
          </Button>
        </div>
      </MainLayout>
    );
  }

  if (!habit) return (
    <MainLayout>
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    </MainLayout>
  );

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto space-y-5">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <button onClick={() => navigate('/habits')} className="hover:text-foreground transition-colors">
            {isAr ? 'العادات' : 'Habits'}
          </button>
          <ArrowRight className={cn('w-3.5 h-3.5 shrink-0', isAr && 'rotate-180')} />
          <span className="text-foreground font-medium truncate">{habit.name}</span>
        </div>

        {/* Header */}
        <div className="glass-card p-5 relative overflow-hidden" style={{ borderTop: `3px solid ${habitColor}` }}>
          <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{ background: `radial-gradient(60% 60% at 80% 20%, ${habitColor}, transparent)` }} />
          <div className="relative flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 text-2xl" style={{ backgroundColor: `${habitColor}20` }}>
              {habit.icon ?? '🔥'}
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-foreground">{habit.name}</h1>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <Badge variant="outline" className="text-xs">
                  {FREQ_LABELS[habit.frequency ?? 'daily']}
                </Badge>
                {habit.target_count && (
                  <span className="text-xs text-muted-foreground">
                    {isAr ? `الهدف: ${habit.target_count}x` : `Target: ${habit.target_count}x`}
                  </span>
                )}
              </div>
              {habit.description && (
                <p className="text-sm text-muted-foreground mt-1.5 line-clamp-2">{habit.description}</p>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="relative grid grid-cols-3 gap-3 mt-5">
            {[
              {
                label: isAr ? 'السلسلة'  : 'Streak',
                value: `${currentStreak}`,
                sub:   isAr ? 'يوم متواصل' : 'days',
                color: 'text-warning',
              },
              {
                label: isAr ? 'الإنجاز'  : 'Completion',
                value: `${completionRate}%`,
                sub:   isAr ? 'آخر 30 يوم' : 'last 30 days',
                color: 'text-success',
              },
              {
                label: isAr ? 'الإجمالي' : 'Total',
                value: logs.length,
                sub:   isAr ? 'تسجيل'    : 'logs',
                color: 'text-primary',
              },
            ].map(s => (
              <div key={s.label} className="text-center p-2.5 rounded-xl bg-background/40">
                <p className={cn('text-2xl font-bold', s.color)}>{s.value}</p>
                <p className="text-xs font-medium text-foreground mt-0.5">{s.label}</p>
                <p className="text-[10px] text-muted-foreground">{s.sub}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 30-day heatmap */}
        <div className="glass-card p-4 space-y-3">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            {isAr ? 'آخر 30 يوم' : 'Last 30 Days'}
          </h3>
          <div className="grid grid-cols-10 gap-1.5">
            {last30.map((d, i) => (
              <div
                key={i}
                title={format(d.date, 'dd MMM', { locale: dateLocale })}
                className={cn('w-full aspect-square rounded-md transition-colors', d.done ? 'opacity-100' : 'bg-muted/50')}
                style={d.done ? { backgroundColor: habitColor } : {}}
              />
            ))}
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{isAr ? 'قبل 30 يوم' : '30 days ago'}</span>
            <span>{isAr ? 'اليوم' : 'Today'}</span>
          </div>
        </div>

        {/* Recent logs */}
        <div className="glass-card p-4 space-y-3">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
            {isAr ? 'سجل الإنجازات' : 'Activity Log'}
          </h3>
          {logs.slice(0, 10).map(log => (
            <div key={log.id} className="flex items-center gap-2.5 p-2 rounded-xl bg-muted/20">
              <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: habitColor }} />
              <span className="text-sm flex-1">
                {log.completed_at
                  ? format(
                      new Date(log.completed_at),
                      isAr ? 'EEEE، dd MMM yyyy' : 'EEEE, dd MMM yyyy',
                      { locale: dateLocale },
                    )
                  : '—'}
              </span>
            </div>
          ))}
          {logs.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4">
              {isAr ? 'لا توجد سجلات بعد' : 'No logs yet'}
            </p>
          )}
        </div>

        {/* Linked Goals */}
        {linkedGoals.length > 0 && (
          <div className="glass-card p-4 space-y-3">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              {isAr ? 'الأهداف المرتبطة' : 'Linked Goals'}
            </h3>
            {linkedGoals.map(g => (
              <button
                key={g.id}
                onClick={() => navigate(`/goals/${g.id}`)}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors text-start"
              >
                <Target className="w-4 h-4 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{g.title}</p>
                  {g.perspective && <p className="text-xs text-muted-foreground">{g.perspective}</p>}
                </div>
                <ArrowRight className={cn('w-4 h-4 text-muted-foreground shrink-0', isAr && 'rotate-180')} />
              </button>
            ))}
          </div>
        )}

        {/* Weekly trend */}
        <div className="glass-card p-4 space-y-3">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            {isAr ? 'الاتجاه الأسبوعي' : 'Weekly Trend'}
          </h3>
          <div className="flex items-end gap-1 h-16">
            {Array.from({ length: 4 }, (_, weekIdx) => {
              const weekDays = last30.slice(weekIdx * 7, (weekIdx + 1) * 7);
              const count  = weekDays.filter(d => d.done).length;
              const height = weekDays.length > 0 ? (count / weekDays.length) * 100 : 0;
              return (
                <div key={weekIdx} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full rounded-t-md transition-all"
                    style={{ height: `${height}%`, minHeight: 4, backgroundColor: height > 0 ? habitColor : undefined, opacity: height > 0 ? 1 : 0.2 }}
                  />
                  <span className="text-[9px] text-muted-foreground">
                    {isAr ? `أ${weekIdx + 1}` : `W${weekIdx + 1}`}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
