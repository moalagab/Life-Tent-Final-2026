import { MainLayout } from '@/components/layout/MainLayout';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, addMonths, subMonths } from 'date-fns';
import { useState } from 'react';
import { formatHijriDate } from '@/lib/hijri';
import { useLanguage } from '@/hooks/useLanguage';

interface Event {
  id: string;
  title: string;
  time: string;
  type: 'meeting' | 'task' | 'prayer' | 'bill';
  color: string;
}

const mockEvents: Record<string, Event[]> = {
  '2024-12-18': [
    { id: '1', title: 'Team Standup', time: '10:00', type: 'meeting', color: 'bg-blue-500' },
    { id: '2', title: 'Client Presentation', time: '14:00', type: 'meeting', color: 'bg-purple-500' },
  ],
  '2024-12-20': [
    { id: '3', title: 'Budget Review', time: '11:00', type: 'task', color: 'bg-primary' },
  ],
  '2024-12-24': [
    { id: '4', title: 'Netflix Renewal', time: '', type: 'bill', color: 'bg-destructive' },
  ],
  '2024-12-25': [
    { id: '5', title: 'Project Deadline', time: '18:00', type: 'task', color: 'bg-primary' },
  ],
};

export default function CalendarPage() {
  const { t, currentLanguage } = useLanguage();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Pad with empty days for proper alignment
  const startDay = monthStart.getDay();
  const paddedDays = [...Array(startDay === 0 ? 6 : startDay - 1).fill(null), ...days];

  const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
  const selectedEvents = mockEvents[selectedDateStr] || [];

  const weekDays = [
    t('weekDays.mon'),
    t('weekDays.tue'),
    t('weekDays.wed'),
    t('weekDays.thu'),
    t('weekDays.fri'),
    t('weekDays.sat'),
    t('weekDays.sun')
  ];

  return (
    <MainLayout>
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{t('calendar.title')}</h1>
            <p className="text-muted-foreground mt-1">{t('calendar.subtitle')}</p>
          </div>
          <Button variant="gold" size="lg">
            <Plus className="w-5 h-5 me-2" />
            {t('calendar.newEvent')}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2 glass-card p-5">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-foreground">
                {format(currentMonth, 'MMMM yyyy')}
              </h2>
              <p className="text-sm text-muted-foreground" dir="rtl">
                {formatHijriDate(currentMonth, 'ar')}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-muted-foreground" />
              </button>
              <button
                onClick={() => setCurrentMonth(new Date())}
                className="px-3 py-2 rounded-lg bg-muted text-sm font-medium hover:bg-muted/80 transition-colors"
              >
                {t('common.today')}
              </button>
              <button
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
          </div>

          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {weekDays.map((day) => (
              <div key={day} className="text-center text-sm text-muted-foreground py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {paddedDays.map((day, index) => {
              if (!day) {
                return <div key={`empty-${index}`} className="aspect-square" />;
              }

              const dateStr = format(day, 'yyyy-MM-dd');
              const dayEvents = mockEvents[dateStr] || [];
              const isSelected = isSameDay(day, selectedDate);
              const isTodayDate = isToday(day);

              return (
                <button
                  key={dateStr}
                  onClick={() => setSelectedDate(day)}
                  className={cn(
                    'aspect-square p-1 rounded-xl transition-all relative',
                    'hover:bg-muted/50',
                    isSelected && 'bg-primary/10 border border-primary/30',
                    isTodayDate && !isSelected && 'bg-primary/5'
                  )}
                >
                  <span className={cn(
                    'text-sm font-medium',
                    isSelected && 'text-primary',
                    isTodayDate && !isSelected && 'text-primary',
                    !isSelected && !isTodayDate && 'text-foreground'
                  )}>
                    {format(day, 'd')}
                  </span>
                  
                  {dayEvents.length > 0 && (
                    <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                      {dayEvents.slice(0, 3).map((event) => (
                        <div
                          key={event.id}
                          className={cn('w-1.5 h-1.5 rounded-full', event.color)}
                        />
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Day Details */}
        <div className="glass-card p-5">
          <div className="mb-5">
            <h3 className="text-lg font-semibold text-foreground">
              {format(selectedDate, 'EEEE, MMMM d')}
            </h3>
            <p className="text-sm text-muted-foreground" dir="rtl">
              {formatHijriDate(selectedDate, currentLanguage as 'ar' | 'en')}
            </p>
          </div>

          {selectedEvents.length === 0 ? (
            <div className="text-center py-8">
              <CalendarIcon className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-muted-foreground">{t('calendar.noEvents')}</p>
              <Button variant="outline" size="sm" className="mt-4">
                <Plus className="w-4 h-4 me-2" />
                {t('calendar.addEvent')}
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {selectedEvents.map((event) => (
                <div
                  key={event.id}
                  className={cn(
                    'p-3 rounded-xl border-l-4 bg-muted/30',
                    event.color.replace('bg-', 'border-')
                  )}
                >
                  <h4 className="font-medium text-foreground">{event.title}</h4>
                  {event.time && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                      <Clock className="w-3 h-3" />
                      <span>{event.time}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Time Blocking */}
          <div className="mt-6 pt-6 border-t border-border">
            <h4 className="text-sm font-medium text-foreground mb-3">{t('calendar.quickTimeBlock')}</h4>
            <p className="text-xs text-muted-foreground mb-3">
              {t('calendar.dragTasks')}
            </p>
            <div className="p-4 rounded-xl border-2 border-dashed border-border text-center">
              <p className="text-sm text-muted-foreground">{t('calendar.dropTask')}</p>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}