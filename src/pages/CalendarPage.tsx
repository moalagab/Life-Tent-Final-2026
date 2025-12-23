import { MainLayout } from '@/components/layout/MainLayout';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, Clock, Loader2, Target, FolderKanban, CheckSquare, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, addMonths, subMonths, parseISO } from 'date-fns';
import { useState } from 'react';
import { formatHijriDate } from '@/lib/hijri';
import { useLanguage } from '@/hooks/useLanguage';
import { useEvents, useCreateEvent, useUpdateEvent, useDeleteEvent } from '@/hooks/useEvents';
import { useTasks } from '@/hooks/useTasks';
import { useProjects } from '@/hooks/useProjects';
import { useGoals } from '@/hooks/useGoals';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Helper to format time in 12-hour format
const formatTime12h = (dateStr: string) => {
  const date = parseISO(dateStr);
  return format(date, 'hh:mm a');
};

export default function CalendarPage() {
  const { t, currentLanguage } = useLanguage();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    start_time: '',
    end_time: '',
    location: '',
    color: '#FFB400',
  });

  const { data: events, isLoading } = useEvents();
  const { data: tasks } = useTasks();
  const { data: projects } = useProjects();
  const { data: goals } = useGoals();
  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent();
  const deleteEvent = useDeleteEvent();

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

  // Get tasks for selected date
  const selectedTasks = tasks?.filter(task => {
    if (!task.due_date) return false;
    return task.due_date === selectedDateStr;
  }) || [];

  const getEventsByDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return events?.filter(event => {
      const eventDate = format(parseISO(event.start_time), 'yyyy-MM-dd');
      return eventDate === dateStr;
    }) || [];
  };

  const getTasksByDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return tasks?.filter(task => task.due_date === dateStr) || [];
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

      if (editingEvent) {
        await updateEvent.mutateAsync({
          id: editingEvent.id,
          title: newEvent.title,
          description: newEvent.description || null,
          start_time: startDateTime,
          end_time: endDateTime,
          location: newEvent.location || null,
          color: newEvent.color,
        });
        toast.success(t('calendar.eventUpdated'));
      } else {
        await createEvent.mutateAsync({
          title: newEvent.title,
          description: newEvent.description || null,
          start_time: startDateTime,
          end_time: endDateTime,
          location: newEvent.location || null,
          color: newEvent.color,
        });
        toast.success(t('calendar.eventAdded'));
      }
      setIsDialogOpen(false);
      setEditingEvent(null);
      setNewEvent({ title: '', description: '', start_time: '', end_time: '', location: '', color: '#FFB400' });
    } catch (error) {
      toast.error(t('common.error'));
    }
  };

  const handleEditEvent = (event: any) => {
    setEditingEvent(event);
    setNewEvent({
      title: event.title,
      description: event.description || '',
      start_time: format(parseISO(event.start_time), 'HH:mm'),
      end_time: event.end_time ? format(parseISO(event.end_time), 'HH:mm') : '',
      location: event.location || '',
      color: event.color || '#FFB400',
    });
    setIsDialogOpen(true);
  };

  const handleDeleteEvent = async (id: string) => {
    try {
      await deleteEvent.mutateAsync(id);
      toast.success(t('calendar.eventDeleted'));
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
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{t('calendar.title')}</h1>
            <p className="text-muted-foreground mt-1">{t('calendar.subtitle')}</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              setEditingEvent(null);
              setNewEvent({ title: '', description: '', start_time: '', end_time: '', location: '', color: '#FFB400' });
            }
          }}>
            <DialogTrigger asChild>
              <Button variant="gold" size="lg">
                <Plus className="w-5 h-5 me-2" />
                {t('calendar.newEvent')}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingEvent ? t('calendar.editEvent') : t('calendar.newEvent')}</DialogTitle>
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
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">{t('calendar.color')}</label>
                  <div className="flex gap-2">
                    {['#FFB400', '#10B981', '#3B82F6', '#EF4444', '#8B5CF6', '#EC4899'].map((color) => (
                      <button
                        key={color}
                        onClick={() => setNewEvent({ ...newEvent, color })}
                        className={cn(
                          'w-8 h-8 rounded-full transition-all',
                          newEvent.color === color && 'ring-2 ring-offset-2 ring-primary'
                        )}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
                <Button onClick={handleCreateEvent} className="w-full" disabled={createEvent.isPending || updateEvent.isPending}>
                  {(createEvent.isPending || updateEvent.isPending) ? <Loader2 className="w-4 h-4 animate-spin" /> : editingEvent ? t('common.update') : t('common.add')}
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
          <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
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
              const dayTasks = getTasksByDate(day);
              const isSelected = isSameDay(day, selectedDate);
              const isTodayDate = isToday(day);
              const hasItems = dayEvents.length > 0 || dayTasks.length > 0;

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
                  
                  {hasItems && (
                    <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                      {dayEvents.slice(0, 2).map((event) => (
                        <div
                          key={event.id}
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: event.color || '#FFB400' }}
                        />
                      ))}
                      {dayTasks.slice(0, 1).map((task) => (
                        <div
                          key={task.id}
                          className="w-1.5 h-1.5 rounded-full bg-blue-500"
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

          <Tabs defaultValue="events" className="w-full">
            <TabsList className="w-full mb-4">
              <TabsTrigger value="events" className="flex-1">{t('calendar.events')}</TabsTrigger>
              <TabsTrigger value="tasks" className="flex-1">{t('nav.tasks')}</TabsTrigger>
            </TabsList>

            <TabsContent value="events">
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
                      className="p-3 rounded-xl border-l-4 bg-muted/30 group"
                      style={{ borderLeftColor: event.color || '#FFB400' }}
                    >
                      <div className="flex justify-between items-start">
                        <h4 className="font-medium text-foreground">{event.title}</h4>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleEditEvent(event)} className="p-1 hover:bg-muted rounded">
                            <Edit className="w-4 h-4 text-muted-foreground" />
                          </button>
                          <button onClick={() => handleDeleteEvent(event.id)} className="p-1 hover:bg-destructive/10 rounded">
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </button>
                        </div>
                      </div>
                      {event.start_time && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                          <Clock className="w-3 h-3" />
                          <span>{formatTime12h(event.start_time)}</span>
                          {event.end_time && (
                            <span> - {formatTime12h(event.end_time)}</span>
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
            </TabsContent>

            <TabsContent value="tasks">
              {selectedTasks.length === 0 ? (
                <div className="text-center py-8">
                  <CheckSquare className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                  <p className="text-muted-foreground">{t('tasks.noTasks')}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedTasks.map((task) => (
                    <div
                      key={task.id}
                      className={cn(
                        "p-3 rounded-xl bg-muted/30 border-l-4",
                        task.status === 'done' ? 'border-green-500' : 'border-blue-500'
                      )}
                    >
                      <h4 className={cn(
                        "font-medium",
                        task.status === 'done' && 'line-through text-muted-foreground'
                      )}>{task.title}</h4>
                      {task.due_time && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                          <Clock className="w-3 h-3" />
                          <span>{task.due_time}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Quick Links */}
          <div className="mt-6 pt-6 border-t border-border">
            <h4 className="text-sm font-medium text-foreground mb-3">{t('calendar.quickLinks')}</h4>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 rounded-xl bg-muted/30 text-center">
                <FolderKanban className="w-5 h-5 text-primary mx-auto mb-1" />
                <span className="text-xs text-muted-foreground">{projects?.length || 0} {t('nav.projects')}</span>
              </div>
              <div className="p-3 rounded-xl bg-muted/30 text-center">
                <Target className="w-5 h-5 text-green-500 mx-auto mb-1" />
                <span className="text-xs text-muted-foreground">{goals?.length || 0} {t('nav.goals')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
