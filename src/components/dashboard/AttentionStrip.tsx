import { ArrowRight, Clock, AlertTriangle, CalendarClock, FolderKanban } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTasks } from '@/hooks/useTasks';
import { useEvents } from '@/hooks/useEvents';
import { useProjects } from '@/hooks/useProjects';
import { useLanguage } from '@/hooks/useLanguage';
import { cn } from '@/lib/utils';
import { parseISO, differenceInHours, differenceInMinutes, startOfDay, addDays, isSameDay } from 'date-fns';

type Severity = 'critical' | 'warn' | 'soon' | 'info';
type Kind = 'overdue' | 'due_today' | 'event_soon' | 'stalled';

interface AttentionItem {
  id: string;
  key: string;
  kind: Kind;
  label: string;
  meta: string;
  to: string;
  severity: Severity;
  rank: number;
  sortValue: number;
}

/**
 * AttentionStrip — quiet alert ribbon.
 * Horizontal scroll on small screens, dot-coded severity, no loud cards.
 */
export function AttentionStrip() {
  const { t } = useLanguage();
  const { data: tasks } = useTasks();
  const { data: events } = useEvents();
  const { data: projects } = useProjects();

  const now = new Date();
  const todayStart  = startOfDay(now);
  const items: AttentionItem[] = [];

  tasks?.forEach((task) => {
    if (task.status === 'done' || !task.due_date) return;
    const due     = parseISO(task.due_date);
    const dueDay  = startOfDay(due);

    if (dueDay < todayStart) {
      // Overdue: due date is strictly before today (date-only comparison — timezone-safe)
      const minutesOverdue = Math.max(1, differenceInMinutes(now, due));
      items.push({
        id: `task-overdue-${task.id}`,
        key: `task:${task.id}`,
        kind: 'overdue',
        label: task.title,
        meta: t('dashboard.overdue'),
        to: '/tasks?filter=overdue',
        severity: 'critical',
        rank: 0,
        sortValue: -minutesOverdue,
      });
    } else if (isSameDay(dueDay, todayStart)) {
      // Due today
      items.push({
        id: `task-today-${task.id}`,
        key: `task:${task.id}`,
        kind: 'due_today',
        label: task.title,
        meta: t('common.today'),
        to: '/tasks?filter=today',
        severity: 'warn',
        rank: 1,
        sortValue: differenceInMinutes(due, now),
      });
    } else if (dueDay <= addDays(todayStart, 7)) {
      // Upcoming: due within the next 7 days — show so user can find recently added tasks
      const daysAway = Math.round(differenceInHours(dueDay, todayStart) / 24);
      items.push({
        id: `task-soon-${task.id}`,
        key: `task:${task.id}`,
        kind: 'due_today',
        label: task.title,
        meta: daysAway === 1
          ? (t('common.today').startsWith('ا') ? 'غداً' : 'Tomorrow')
          : `${daysAway}${t('common.today').startsWith('ا') ? ' أيام' : ' days'}`,
        to: '/tasks',
        severity: 'info',
        rank: 2,
        sortValue: differenceInMinutes(due, now),
      });
    }
  });

  events?.forEach((e) => {
    const start = new Date(e.start_time);
    const minutesAway = differenceInMinutes(start, now);
    const hoursAway = differenceInHours(start, now);
    if (minutesAway >= 0 && hoursAway <= 2) {
      const metaTime =
        minutesAway < 60
          ? t('dashboard.inMinutes', { count: minutesAway })
          : t('dashboard.inHours', { count: hoursAway });
      items.push({
        id: `event-${e.id}`,
        key: `event:${e.id}`,
        kind: 'event_soon',
        label: e.title,
        meta: metaTime,
        to: '/calendar',
        severity: 'soon',
        rank: 2,
        sortValue: minutesAway,
      });
    }
  });

  projects?.forEach((p) => {
    if (p.status === 'on_hold') {
      items.push({
        id: `project-${p.id}`,
        key: `project:${p.id}`,
        kind: 'stalled',
        label: p.title,
        meta: t('dashboard.stalled'),
        to: '/projects',
        severity: 'info',
        rank: 3,
        sortValue: 0,
      });
    }
  });

  const dedupedMap = new Map<string, AttentionItem>();
  for (const item of items) {
    const existing = dedupedMap.get(item.key);
    if (!existing || item.rank < existing.rank) dedupedMap.set(item.key, item);
  }

  const sorted = Array.from(dedupedMap.values())
    .sort((a, b) => (a.rank - b.rank) || (a.sortValue - b.sortValue))
    .slice(0, 6);

  if (sorted.length === 0) {
    return (
      <section
        aria-label={t('dashboard.allClear')}
        className="flex items-center gap-3 px-4 py-3 rounded-xl bg-success/5 border border-success/20"
      >
        <div className="w-2 h-2 rounded-full bg-success" aria-hidden="true" />
        <p className="text-sm text-foreground/90">
          {t('dashboard.allClearDesc')}
        </p>
      </section>
    );
  }

  return (
    <section aria-label={t('dashboard.needsAttention')}>
      <div className="flex items-center gap-2 mb-2.5">
        <span className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse" aria-hidden="true" />
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-foreground">
          {t('dashboard.needsAttention')}
        </h2>
        <span className="text-[11px] text-muted-foreground tabular-nums">{sorted.length}</span>
      </div>

      <div className="flex gap-2 overflow-x-auto scrollbar-thin pb-1 -mx-1 px-1 snap-x">
        {sorted.map((item) => {
          const dotColor =
            item.severity === 'critical' ? 'bg-destructive'
            : item.severity === 'warn' ? 'bg-primary/80'
            : item.severity === 'soon' ? 'bg-primary'
            : 'bg-muted-foreground';
          const Icon =
            item.kind === 'overdue' ? AlertTriangle
            : item.kind === 'event_soon' ? CalendarClock
            : item.kind === 'stalled' ? FolderKanban
            : Clock;

          return (
            <Link
              key={item.id}
              to={item.to}
              className={cn(
                'group shrink-0 snap-start flex items-center gap-2.5 ps-3 pe-3.5 py-2.5 rounded-xl',
                'bg-card/60 hover:bg-card border border-border/40 hover:border-border transition-all',
                'min-w-[200px] max-w-[280px]'
              )}
            >
              <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', dotColor)} />
              <Icon className="w-3.5 h-3.5 text-muted-foreground shrink-0" strokeWidth={2} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate leading-tight" dir="auto">
                  {item.label}
                </p>
                <p className="text-[11px] text-muted-foreground truncate mt-0.5">{item.meta}</p>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors rtl:rotate-180" />
            </Link>
          );
        })}
      </div>
    </section>
  );
}
