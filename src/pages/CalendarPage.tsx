import { MainLayout } from '@/components/layout/MainLayout';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, Clock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, addMonths, subMonths, parseISO } from 'date-fns';
import { useState } from 'react';
import { formatHijriDate } from '@/lib/hijri';
import { useLanguage } from '@/hooks/useLanguage';
import { useEvents, useCreateEvent } from '@/hooks/useEvents';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

export default function CalendarPage() {
  const { t, currentLanguage } = useLanguage();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    start_time: '',
    end_time: '',
    location: '',
  });

  const { data: events, isLoading } = useEvents();
  const createEvent = useCreateEvent();

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Pad with empty days for proper alignment
  const startDay = monthStart.getDay();
  const paddedDays = [...Array(startDay === 0 ? 6 : startDay - 1).fill(null), ...days];

  const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
  const selectedEvents = events?.filter(event => {
    const eventDate = format(parseISO(event.start_time), 'yyyy-MM-dd');
    return eventDate === selectedDateStr;
  }) || [];

  const getEventsByDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return events?.filter(event => {
      const eventDate = format(parseISO(event.start_time), 'yyyy-MM-dd');
      return eventDate === dateStr;
    }) || [];
  };

  const weekDays = [
    t('weekDays.mon'),
    t('weekDays.tue'),
    t('weekDays.wed'),
    t('weekDays.thu'),
    t('weekDays.fri'),
    t('weekDays.sat'),
    t('weekDays.sun')
  ];

  const handleCreateEvent = async () => {
    if (!newEvent.title || !newEvent.start_time) {
      toast.error(t('common.fillAllFields'));
      return;
    }

    try {
      const startDateTime = `${format(selectedDate, 'yyyy-MM-dd')}T${newEvent.start_time}:00`;
      const endDateTime = newEvent.end_time ? `${format(selectedDate, 'yyyy-MM-dd')}T${newEvent.end_time}:00` : null;

      await createEvent.mutateAsync({
        title: newEvent.title,
        description: newEvent.description || null,
        start_time: startDateTime,
        end_time: endDateTime,
        location: newEvent.location || null,
      });
      toast.success(t('calendar.eventAdded'));
      setIsDialogOpen(false);
      setNewEvent({ title: '', description: '', start_time: '', end_time: '', location: '' });
    } catch (error) {
      toast.error(t('common.error'));
    }
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{t('calendar.title')}</h1>
            <p className="text-muted-foreground mt-1">{t('calendar.subtitle')}</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="gold" size="lg">
                <Plus className="w-5 h-5 me-2" />
                {t('calendar.newEvent')}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('calendar.newEvent')}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <Input
                  placeholder={t('calendar.eventTitle')}
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                />
                <Textarea
                  placeholder={t('calendar.eventDescription')}
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-muted-foreground mb-1 block">{t('calendar.startTime')}</label>
                    <Input
                      type="time"
                      value={newEvent.start_time}
                      onChange={(e) => setNewEvent({ ...newEvent, start_time: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground mb-1 block">{t('calendar.endTime')}</label>
                    <Input
                      type="time"
                      value={newEvent.end_time}
                      onChange={(e) => setNewEvent({ ...newEvent, end_time: e.target.value })}
                    />
                  </div>
                </div>
                <Input
                  placeholder={t('calendar.location')}
                  value={newEvent.location}
                  onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                />
                <Button onClick={handleCreateEvent} className="w-full" disabled={createEvent.isPending}>
                  {createEvent.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : t('common.add')}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
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

              const dayEvents = getEventsByDate(day);
              const isSelected = isSameDay(day, selectedDate);
              const isTodayDate = isToday(day);

              return (
                <button
                  key={format(day, 'yyyy-MM-dd')}
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
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: event.color || '#FFB400' }}
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
              <Button variant="outline" size="sm" className="mt-4" onClick={() => setIsDialogOpen(true)}>
                <Plus className="w-4 h-4 me-2" />
                {t('calendar.addEvent')}
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {selectedEvents.map((event) => (
                <div
                  key={event.id}
                  className="p-3 rounded-xl border-l-4 bg-muted/30"
                  style={{ borderLeftColor: event.color || '#FFB400' }}
                >
                  <h4 className="font-medium text-foreground">{event.title}</h4>
                  {event.start_time && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                      <Clock className="w-3 h-3" />
                      <span>{format(parseISO(event.start_time), 'HH:mm')}</span>
                      {event.end_time && (
                        <span> - {format(parseISO(event.end_time), 'HH:mm')}</span>
                      )}
                    </div>
                  )}
                  {event.location && (
                    <p className="text-xs text-muted-foreground mt-1">{event.location}</p>
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
