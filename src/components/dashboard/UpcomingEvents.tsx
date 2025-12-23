import { Calendar, Clock, MapPin, Video, CreditCard, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/hooks/useLanguage';
import { useEvents } from '@/hooks/useEvents';
import { format, parseISO, isToday, isTomorrow, isThisWeek } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { Link } from 'react-router-dom';

const typeConfig = {
  meeting: { icon: Video, color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
  task: { icon: Calendar, color: 'bg-primary/10 text-primary border-primary/20' },
  bill: { icon: CreditCard, color: 'bg-destructive/10 text-destructive border-destructive/20' },
  prayer: { icon: Clock, color: 'bg-success/10 text-success border-success/20' },
  default: { icon: Calendar, color: 'bg-primary/10 text-primary border-primary/20' },
};

export function UpcomingEvents() {
  const { t, currentLanguage } = useLanguage();
  const { data: events, isLoading } = useEvents();

  const getRelativeDate = (dateStr: string) => {
    const date = parseISO(dateStr);
    if (isToday(date)) return currentLanguage === 'ar' ? 'اليوم' : 'Today';
    if (isTomorrow(date)) return currentLanguage === 'ar' ? 'غداً' : 'Tomorrow';
    return format(date, 'EEE, MMM d', { locale: currentLanguage === 'ar' ? ar : enUS });
  };

  if (isLoading) {
    return (
      <div className="glass-card p-5 h-full flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  // Get upcoming events (sorted by start_time)
  const upcomingEvents = events
    ?.filter(event => new Date(event.start_time) >= new Date())
    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
    .slice(0, 4) || [];

  return (
    <div className="glass-card p-5 h-full">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-lg font-semibold text-foreground">{t('dashboard.upcomingEvents')}</h3>
        <Link to="/calendar">
          <Calendar className="w-5 h-5 text-muted-foreground hover:text-primary transition-colors" />
        </Link>
      </div>

      {upcomingEvents.length > 0 ? (
        <div className="space-y-3">
          {upcomingEvents.map((event) => {
            const config = typeConfig.default;
            const TypeIcon = config.icon;
            
            return (
              <div
                key={event.id}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 hover:bg-accent/30',
                  config.color
                )}
              >
                <div className={cn(
                  'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
                  config.color.split(' ')[0]
                )}
                style={{ backgroundColor: event.color ? `${event.color}20` : undefined }}
                >
                  <TypeIcon className="w-5 h-5" style={{ color: event.color || undefined }} />
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {event.title}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span>{getRelativeDate(event.start_time)}</span>
                    <span>•</span>
                    <span>{format(parseISO(event.start_time), 'HH:mm')}</span>
                    {event.location && (
                      <>
                        <span>•</span>
                        <MapPin className="w-3 h-3" />
                        <span className="truncate">{event.location}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8">
          <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
          <p className="text-muted-foreground text-sm">{t('calendar.noEvents')}</p>
        </div>
      )}
    </div>
  );
}
