import { AlertCircle, ArrowRight, Clock, AlertTriangle, CalendarClock, FolderKanban } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTasks } from '@/hooks/useTasks';
import { useEvents } from '@/hooks/useEvents';
import { useProjects } from '@/hooks/useProjects';
import { useLanguage } from '@/hooks/useLanguage';
import { cn } from '@/lib/utils';
import { isToday, isPast, parseISO, differenceInHours, differenceInMinutes } from 'date-fns';

type Severity = 'critical' | 'warn' | 'soon' | 'info';
type Kind = 'overdue' | 'due_today' | 'event_soon' | 'stalled';

interface AttentionItem {
  id: string;
  key: string; // dedupe key
  kind: Kind;
  label: string;
  meta: string;
  to: string;
  severity: Severity;
  rank: number; // lower is more urgent
  sortValue: number; // tiebreaker (e.g. minutes overdue / minutes until)
}

/**
 * AttentionStrip — surfaces only items needing action now.
 * Order (strict): overdue → due today → events ≤ 2h → stalled projects.
 * Deduplicates by stable composite key.
 */
export function AttentionStrip() {
  const { currentLanguage } = useLanguage();
  const isAr = currentLanguage === 'ar';
  const { data: tasks } = useTasks();
  const { data: events } = useEvents();
  const { data: projects } = useProjects();

  const now = new Date();
  const items: AttentionItem[] = [];

  // 1) Overdue tasks (rank 0) and 2) Due today (rank 1)
  tasks?.forEach((t) => {
    if (t.status === 'done' || !t.due_date) return;
    const due = parseISO(t.due_date);
    if (isPast(due) && !isToday(due)) {
      const minutesOverdue = Math.max(1, differenceInMinutes(now, due));
      items.push({
        id: `task-overdue-${t.id}`,
        key: `task:${t.id}`,
        kind: 'overdue',
        label: t.title,
        meta: isAr ? 'مهمة متأخرة' : 'Overdue task',
        to: '/tasks',
        severity: 'critical',
        rank: 0,
        sortValue: -minutesOverdue, // most overdue first
      });
    } else if (isToday(due)) {
      items.push({
        id: `task-today-${t.id}`,
        key: `task:${t.id}`,
        kind: 'due_today',
        label: t.title,
        meta: isAr ? 'مستحقة اليوم' : 'Due today',
        to: '/tasks',
        severity: 'warn',
        rank: 1,
        sortValue: differenceInMinutes(due, now),
      });
    }
  });

  // 3) Events within next 2h (rank 2)
  events?.forEach((e) => {
    const start = new Date(e.start_time);
    const minutesAway = differenceInMinutes(start, now);
    const hoursAway = differenceInHours(start, now);
    if (minutesAway >= 0 && hoursAway <= 2) {
      const metaTime =
        minutesAway < 60
          ? isAr ? `خلال ${minutesAway}د` : `In ${minutesAway}m`
          : isAr ? `خلال ${hoursAway}س` : `In ${hoursAway}h`;
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

  // 4) Stalled projects (rank 3)
  projects?.forEach((p) => {
    if (p.status === 'on_hold') {
      items.push({
        id: `project-${p.id}`,
        key: `project:${p.id}`,
        kind: 'stalled',
        label: p.title,
        meta: isAr ? 'مشروع متوقف' : 'Project on hold',
        to: '/projects',
        severity: 'info',
        rank: 3,
        sortValue: 0,
      });
    }
  });

  // Dedupe — keep the most urgent (lowest rank) per key
  const dedupedMap = new Map<string, AttentionItem>();
  for (const item of items) {
    const existing = dedupedMap.get(item.key);
    if (!existing || item.rank < existing.rank) {
      dedupedMap.set(item.key, item);
    }
  }

  const sorted = Array.from(dedupedMap.values())
    .sort((a, b) => (a.rank - b.rank) || (a.sortValue - b.sortValue))
    .slice(0, 4);

  if (sorted.length === 0) return null;

  return (
    <section aria-label={isAr ? 'يحتاج انتباهك' : 'Needs your attention'}>
      <div className="flex items-center gap-2 mb-3 px-1">
        <AlertCircle className="w-4 h-4 text-destructive" />
        <h2 className="text-sm font-semibold text-foreground">
          {isAr ? 'يحتاج انتباهك' : 'Needs your attention'}
        </h2>
        <span className="text-xs text-muted-foreground">· {sorted.length}</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        {sorted.map((item) => {
          const sevStyles =
            item.severity === 'critical'
              ? 'border-destructive/40 bg-destructive/5 hover:bg-destructive/10'
              : item.severity === 'warn'
              ? 'border-primary/40 bg-primary/5 hover:bg-primary/10'
              : item.severity === 'soon'
              ? 'border-primary/30 bg-primary/[0.04] hover:bg-primary/10'
              : 'border-border bg-muted/30 hover:bg-muted/50';
          const Icon =
            item.kind === 'overdue' ? AlertTriangle
            : item.kind === 'event_soon' ? CalendarClock
            : item.kind === 'stalled' ? FolderKanban
            : Clock;
          const iconColor =
            item.severity === 'critical' ? 'text-destructive'
            : item.severity === 'warn' || item.severity === 'soon' ? 'text-primary'
            : 'text-muted-foreground';

          return (
            <Link
              key={item.id}
              to={item.to}
              className={cn(
                'group flex items-center gap-3 p-3 rounded-xl border transition-all',
                sevStyles
              )}
            >
              <div className={cn('shrink-0 w-8 h-8 rounded-lg bg-background/60 flex items-center justify-center', iconColor)}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate" dir="auto">
                  {item.label}
                </p>
                <p className="text-xs text-muted-foreground truncate">{item.meta}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity rtl:rotate-180" />
            </Link>
          );
        })}
      </div>
    </section>
  );
}
