import { useEffect, useRef } from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import { useTasks } from '@/hooks/useTasks';
import { useEvents } from '@/hooks/useEvents';
import { useHabits } from '@/hooks/useHabits';
import { useLanguage } from '@/hooks/useLanguage';
import { isToday, isTomorrow, differenceInMinutes, parseISO, setHours, setMinutes } from 'date-fns';

export function useAutoReminders() {
  const { enabled, sendNotification } = useNotifications();
  const { data: tasks } = useTasks();
  const { data: events } = useEvents();
  const { data: habits } = useHabits();
  const { t } = useLanguage();
  const scheduledRef = useRef<Set<string>>(new Set());

  // Task reminders
  useEffect(() => {
    if (!enabled || !tasks) return;

    const now = new Date();
    
    tasks.forEach(task => {
      if (task.status === 'done' || !task.due_date) return;
      if (scheduledRef.current.has(`task-${task.id}`)) return;

      const dueDate = parseISO(task.due_date);
      
      // Check if task is due today or tomorrow
      if (isToday(dueDate) || isTomorrow(dueDate)) {
        const label = isToday(dueDate) ? t('common.today') : 'Tomorrow';
        
        // Send immediate notification for today's tasks
        if (isToday(dueDate)) {
          scheduledRef.current.add(`task-${task.id}`);
          
          // Check if it's morning (8 AM notification)
          const eightAM = setMinutes(setHours(now, 8), 0);
          const minsUntilEight = differenceInMinutes(eightAM, now);
          
          if (minsUntilEight > 0 && minsUntilEight < 60) {
            setTimeout(() => {
              sendNotification(
                `${t('notifications.taskDue')} - ${label}`,
                task.title,
                'task'
              );
            }, minsUntilEight * 60 * 1000);
          }
        }
      }
    });
  }, [enabled, tasks, sendNotification, t]);

  // Event reminders
  useEffect(() => {
    if (!enabled || !events) return;

    const now = new Date();

    events.forEach(event => {
      if (scheduledRef.current.has(`event-${event.id}`)) return;
      
      const startTime = parseISO(event.start_time);
      const minsUntilEvent = differenceInMinutes(startTime, now);
      
      // Notify 30 minutes before
      if (minsUntilEvent > 0 && minsUntilEvent <= 60) {
        scheduledRef.current.add(`event-${event.id}`);
        
        const notifyIn = Math.max(0, minsUntilEvent - 30) * 60 * 1000;
        
        setTimeout(() => {
          sendNotification(
            t('notifications.eventSoon'),
            `${event.title} - ${minsUntilEvent <= 30 ? 'Now' : 'In 30 mins'}`,
            'event'
          );
        }, notifyIn);
      }
    });
  }, [enabled, events, sendNotification, t]);

  // Habit reminders - daily at 9 AM
  useEffect(() => {
    if (!enabled || !habits) return;

    const now = new Date();
    const nineAM = setMinutes(setHours(now, 9), 0);
    const minsUntilNine = differenceInMinutes(nineAM, now);

    if (minsUntilNine > 0 && minsUntilNine < 60) {
      const activeHabits = habits.filter(h => h.is_active);
      
      if (activeHabits.length > 0 && !scheduledRef.current.has('habits-daily')) {
        scheduledRef.current.add('habits-daily');
        
        setTimeout(() => {
          sendNotification(
            t('notifications.habitReminder'),
            `${activeHabits.length} ${t('habits.dailyHabits')}`,
            'habit'
          );
        }, minsUntilNine * 60 * 1000);
      }
    }
  }, [enabled, habits, sendNotification, t]);
}
