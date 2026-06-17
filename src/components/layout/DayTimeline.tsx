import { useMemo } from 'react';
import { useEvents } from '@/hooks/useEvents';
import { useFocusTasks } from '@/hooks/useTasks';
import { useLanguage } from '@/hooks/useLanguage';
import { cn } from '@/lib/utils';
import { format, isToday, parseISO } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Clock, CheckSquare } from 'lucide-react';

const HOURS = Array.from({ length: 17 }, (_, i) => i + 6); // 6am – 10pm

export function DayTimeline() {
  const { currentLanguage } = useLanguage();
  const isAr = currentLanguage === 'ar';
  const dateLocale = isAr ? ar : undefined;

  const { data: allEvents }  = useEvents();
  const { data: focusTasks } = useFocusTasks();

  // Filter to today's events with a valid start_time
  const todayEvents = useMemo(() => {
    if (!allEvents) return [];
    return allEvents.filter(e => e.start_time && isToday(parseISO(e.start_time)));
  }, [allEvents]);

  // Map events to their starting hour (0-indexed from HOURS[0]=6)
  const eventsByHour = useMemo(() => {
    const map = new Map<number, typeof todayEvents>();
    todayEvents.forEach(e => {
      const hour = parseISO(e.start_time!).getHours();
      const existing = map.get(hour) ?? [];
      map.set(hour, [...existing, e]);
    });
    return map;
  }, [todayEvents]);

  const now    = new Date();
  const nowH   = now.getHours();
  const nowMin = now.getMinutes();

  return (
    <div className="space-y-3">
      {/* Focus tasks strip */}
      {focusTasks && focusTasks.length > 0 && (
        <div className="space-y-1">
          {focusTasks.slice(0, 3).map(task => (
            <div
              key={task.id}
              className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-primary/5 border border-primary/10"
            >
              <CheckSquare className="w-3.5 h-3.5 text-primary shrink-0" />
              <span className="text-xs text-foreground truncate flex-1">{task.title}</span>
            </div>
          ))}
        </div>
      )}

      {/* Hour rows */}
      <div className="relative">
        {HOURS.map(h => {
          const events      = eventsByHour.get(h) ?? [];
          const isCurrentH  = h === nowH;
          const nowTopPct   = isCurrentH ? (nowMin / 60) * 100 : null;

          return (
            <div key={h} className="flex gap-2 min-h-[36px] relative">
              {/* Hour label */}
              <div className={cn(
                'w-9 shrink-0 text-[10px] text-right pt-0.5 leading-none select-none',
                isCurrentH ? 'text-primary font-semibold' : 'text-muted-foreground/40',
              )}>
                {isAr
                  ? format(new Date(2000, 0, 1, h), 'h a', { locale: dateLocale })
                  : `${h % 12 === 0 ? 12 : h % 12}${h < 12 ? 'am' : 'pm'}`}
              </div>

              {/* Track */}
              <div className="flex-1 border-t border-border/20 pt-1 pb-2 relative min-h-[36px]">
                {/* Current-time indicator */}
                {nowTopPct !== null && (
                  <div
                    className="absolute inset-x-0 flex items-center gap-1 pointer-events-none z-10"
                    style={{ top: `${nowTopPct}%` }}
                  >
                    <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
                    <div className="flex-1 h-px bg-primary" />
                  </div>
                )}

                {/* Event blocks */}
                {events.map(ev => (
                  <div
                    key={ev.id}
                    className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs text-white font-medium mb-0.5 truncate"
                    style={{ backgroundColor: ev.color ?? 'hsl(var(--primary))' }}
                  >
                    <Clock className="w-3 h-3 shrink-0" />
                    <span className="truncate">{ev.title}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
