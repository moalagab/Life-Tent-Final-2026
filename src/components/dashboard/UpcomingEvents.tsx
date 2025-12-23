import { Calendar, Clock, MapPin, Loader2, CalendarDays, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/hooks/useLanguage';
import { useEvents } from '@/hooks/useEvents';
import { format, parseISO, isToday, isTomorrow } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { DashboardWidgetShell, DashboardEmptyState } from './DashboardWidgetShell';
import { Link } from 'react-router-dom';

export function UpcomingEvents() {
  const { t, currentLanguage } = useLanguage();
  const { data: events, isLoading } = useEvents();

  const getRelativeDate = (dateStr: string) => {
    const date = parseISO(dateStr);
    if (isToday(date)) return { text: currentLanguage === 'ar' ? 'اليوم' : 'Today', isToday: true };
    if (isTomorrow(date)) return { text: currentLanguage === 'ar' ? 'غداً' : 'Tomorrow', isToday: false };
    return { text: format(date, 'EEE, d MMM', { locale: currentLanguage === 'ar' ? ar : enUS }), isToday: false };
  };

  const upcomingEvents = events
    ?.filter(event => new Date(event.start_time) >= new Date())
    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
    .slice(0, 4) || [];

  if (isLoading) {
    return (
      <DashboardWidgetShell
        title={t('dashboard.upcomingEvents')}
        icon={CalendarDays}
        iconColor="text-purple-500"
        iconBg="bg-purple-500/10"
        accentColor="bg-purple-500/10"
        headerAction={
          <Link to="/calendar" className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors">
            <Calendar className="w-4 h-4 text-muted-foreground hover:text-primary transition-colors" />
          </Link>
        }
      >
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
        </div>
      </DashboardWidgetShell>
    );
  }

  return (
    <DashboardWidgetShell
      title={t('dashboard.upcomingEvents')}
      icon={CalendarDays}
      iconColor="text-purple-500"
      iconBg="bg-purple-500/10"
      accentColor="bg-purple-500/10"
      headerAction={
        <Link to="/calendar" className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors">
          <Calendar className="w-4 h-4 text-muted-foreground hover:text-primary transition-colors" />
        </Link>
      }
    >
      {upcomingEvents.length > 0 ? (
        <div className="space-y-2.5">
          {upcomingEvents.map((event) => {
            const dateInfo = getRelativeDate(event.start_time);
            
            return (
              <div
                key={event.id}
                className={cn(
                  'group flex items-start gap-3 p-3 rounded-xl border transition-all duration-200',
                  'hover:shadow-sm hover:border-primary/20',
                  dateInfo.isToday ? 'bg-primary/5 border-primary/20' : 'bg-muted/30 border-border/40'
                )}
              >
                {/* Time Indicator */}
                <div 
                  className={cn(
                    'w-10 h-10 rounded-xl flex items-center justify-center transition-transform duration-200 group-hover:scale-105',
                    'bg-background/80'
                  )}
                  style={{ backgroundColor: event.color ? `${event.color}15` : undefined }}
                >
                  <CalendarDays 
                    className="w-4 h-4" 
                    style={{ color: event.color || 'var(--primary)' }} 
                  />
                </div>
                
                {/* Event Details */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                    {event.title}
                  </p>
                  
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1 text-[10px] text-muted-foreground">
                    <span className={cn("font-medium", dateInfo.isToday && "text-primary")}>
                      {dateInfo.text}
                    </span>
                    <span>•</span>
                    <div className="flex items-center gap-0.5">
                      <Clock className="w-2.5 h-2.5" />
                      <span className="tabular-nums">{format(parseISO(event.start_time), 'HH:mm')}</span>
                    </div>
                    {event.location && (
                      <>
                        <span>•</span>
                        <div className="flex items-center gap-0.5">
                          <MapPin className="w-2.5 h-2.5" />
                          <span className="truncate max-w-[80px]">{event.location}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Now Badge */}
                {dateInfo.isToday && (
                  <span className="px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground text-[9px] font-bold">
                    {currentLanguage === 'ar' ? 'قريب' : 'SOON'}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <DashboardEmptyState
          icon={CalendarDays}
          message={t('calendar.noEvents')}
          action={
            <Link 
              to="/calendar" 
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors"
            >
              <Calendar className="w-3.5 h-3.5" />
              {currentLanguage === 'ar' ? 'إضافة حدث' : 'Add Event'}
            </Link>
          }
        />
      )}
    </DashboardWidgetShell>
  );
}