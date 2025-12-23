import { Calendar, Clock, MapPin, Video, CreditCard, Loader2, CalendarDays, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/hooks/useLanguage';
import { useEvents } from '@/hooks/useEvents';
import { format, parseISO, isToday, isTomorrow, isThisWeek } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { Link } from 'react-router-dom';

const typeConfig = {
  meeting: { icon: Video, gradient: 'from-blue-500/20 to-blue-500/5', iconColor: 'text-blue-500', borderColor: 'border-blue-500/30' },
  task: { icon: Calendar, gradient: 'from-primary/20 to-primary/5', iconColor: 'text-primary', borderColor: 'border-primary/30' },
  bill: { icon: CreditCard, gradient: 'from-destructive/20 to-destructive/5', iconColor: 'text-destructive', borderColor: 'border-destructive/30' },
  prayer: { icon: Clock, gradient: 'from-success/20 to-success/5', iconColor: 'text-success', borderColor: 'border-success/30' },
  default: { icon: Calendar, gradient: 'from-primary/20 to-primary/5', iconColor: 'text-primary', borderColor: 'border-primary/30' },
};

export function UpcomingEvents() {
  const { t, currentLanguage } = useLanguage();
  const { data: events, isLoading } = useEvents();

  const getRelativeDate = (dateStr: string) => {
    const date = parseISO(dateStr);
    if (isToday(date)) return { text: currentLanguage === 'ar' ? 'اليوم' : 'Today', isToday: true };
    if (isTomorrow(date)) return { text: currentLanguage === 'ar' ? 'غداً' : 'Tomorrow', isToday: false };
    return { text: format(date, 'EEE, MMM d', { locale: currentLanguage === 'ar' ? ar : enUS }), isToday: false };
  };

  if (isLoading) {
    return (
      <div className="relative overflow-hidden rounded-2xl bg-card/50 backdrop-blur-xl border border-border/50 p-5 h-full flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const upcomingEvents = events
    ?.filter(event => new Date(event.start_time) >= new Date())
    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
    .slice(0, 4) || [];

  return (
    <div className="relative overflow-hidden rounded-2xl bg-card/50 backdrop-blur-xl border border-border/50 p-5 h-full">
      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-3xl" />
      
      <div className="relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <CalendarDays className="w-4 h-4 text-purple-500" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">{t('dashboard.upcomingEvents')}</h3>
          </div>
          <Link to="/calendar" className="p-2 rounded-lg hover:bg-muted/50 transition-colors">
            <Calendar className="w-5 h-5 text-muted-foreground hover:text-primary transition-colors" />
          </Link>
        </div>

        {upcomingEvents.length > 0 ? (
          <div className="space-y-3">
            {upcomingEvents.map((event, index) => {
              const config = typeConfig.default;
              const TypeIcon = config.icon;
              const dateInfo = getRelativeDate(event.start_time);
              
              return (
                <div
                  key={event.id}
                  className={cn(
                    'group relative flex items-start gap-4 p-4 rounded-xl border-2 transition-all duration-300',
                    'hover:bg-gradient-to-r hover:shadow-lg hover:-translate-y-0.5',
                    config.gradient,
                    config.borderColor,
                    'bg-gradient-to-r'
                  )}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {/* Time Indicator */}
                  <div className="flex flex-col items-center">
                    <div 
                      className={cn(
                        'w-12 h-12 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110',
                        event.color ? '' : 'bg-background/80'
                      )}
                      style={{ backgroundColor: event.color ? `${event.color}20` : undefined }}
                    >
                      <TypeIcon 
                        className="w-5 h-5" 
                        style={{ color: event.color || undefined }} 
                      />
                    </div>
                    {dateInfo.isToday && (
                      <div className="mt-2 px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                        {currentLanguage === 'ar' ? 'الآن' : 'NOW'}
                      </div>
                    )}
                  </div>
                  
                  {/* Event Details */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground mb-1 truncate group-hover:text-primary transition-colors">
                      {event.title}
                    </p>
                    
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      {/* Date */}
                      <span className={cn(
                        "font-medium",
                        dateInfo.isToday && "text-primary"
                      )}>
                        {dateInfo.text}
                      </span>
                      
                      {/* Time */}
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span className="tabular-nums">{format(parseISO(event.start_time), 'HH:mm')}</span>
                      </div>
                      
                      {/* Location */}
                      {event.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          <span className="truncate max-w-[100px]">{event.location}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Notification Bell */}
                  <button className="opacity-0 group-hover:opacity-100 p-2 rounded-lg hover:bg-background/50 transition-all duration-300">
                    <Bell className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
              <CalendarDays className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-sm mb-4">{t('calendar.noEvents')}</p>
            <Link 
              to="/calendar" 
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors"
            >
              <Calendar className="w-4 h-4" />
              {currentLanguage === 'ar' ? 'إضافة حدث' : 'Add Event'}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
