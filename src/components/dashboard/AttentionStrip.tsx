import { AlertCircle, ArrowRight, Clock, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTasks } from '@/hooks/useTasks';
import { useEvents } from '@/hooks/useEvents';
import { useProjects } from '@/hooks/useProjects';
import { useLanguage } from '@/hooks/useLanguage';
import { cn } from '@/lib/utils';
import { isToday, isPast, parseISO, differenceInHours } from 'date-fns';

interface AttentionItem {
  id: string;
  label: string;
  meta: string;
  to: string;
  severity: 'critical' | 'warn' | 'info';
}

/**
 * AttentionStrip — answers "what needs attention now?" instantly.
 * Pulls from tasks/events/projects and surfaces only items requiring action today.
 * Uses ONLY existing tokens (destructive / primary / muted) — no new colors.
 */
export function AttentionStrip() {
  const { currentLanguage } = useLanguage();
  const isAr = currentLanguage === 'ar';
  const { data: tasks } = useTasks();
  const { data: events } = useEvents();
  const { data: projects } = useProjects();

  const items: AttentionItem[] = [];

  // Overdue tasks
  tasks?.forEach((t) => {
    if (t.status === 'done' || !t.due_date) return;
    const due = parseISO(t.due_date);
    if (isPast(due) && !isToday(due)) {
      items.push({
        id: `task-${t.id}`,
        label: t.title,
        meta: isAr ? 'مهمة متأخرة' : 'Overdue task',
        to: '/tasks',
        severity: 'critical',
      });
    } else if (isToday(due)) {
      items.push({
        id: `task-${t.id}`,
        label: t.title,
        meta: isAr ? 'مستحقة اليوم' : 'Due today',
        to: '/tasks',
        severity: 'warn',
      });
    }
  });

  // Events within next 2h
  events?.forEach((e) => {
    const start = new Date(e.start_time);
    const hoursAway = differenceInHours(start, new Date());
    if (hoursAway >= 0 && hoursAway <= 2) {
      items.push({
        id: `event-${e.id}`,
        label: e.title,
        meta: isAr ? `خلال ${hoursAway}س` : `In ${hoursAway}h`,
        to: '/calendar',
        severity: 'warn',
      });
    }
  });

  // Stalled projects (active, low progress, no recent update — heuristic)
  projects?.forEach((p) => {
    if (p.status === 'on_hold') {
      items.push({
        id: `project-${p.id}`,
        label: p.title,
        meta: isAr ? 'مشروع متوقف' : 'Project on hold',
        to: '/projects',
        severity: 'info',
      });
    }
  });

  // Sort by severity
  const order = { critical: 0, warn: 1, info: 2 };
  const sorted = items.sort((a, b) => order[a.severity] - order[b.severity]).slice(0, 4);

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
              : 'border-border bg-muted/30 hover:bg-muted/50';
          const Icon = item.severity === 'critical' ? AlertTriangle : Clock;
          const iconColor =
            item.severity === 'critical' ? 'text-destructive' : item.severity === 'warn' ? 'text-primary' : 'text-muted-foreground';

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
