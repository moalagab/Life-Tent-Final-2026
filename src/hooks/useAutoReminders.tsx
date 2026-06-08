import { useEffect, useRef } from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import { useTasks } from '@/hooks/useTasks';
import { useEvents } from '@/hooks/useEvents';
import { useHabits } from '@/hooks/useHabits';
import { useLanguage } from '@/hooks/useLanguage';
import { isToday, isTomorrow, differenceInMinutes, parseISO, setHours, setMinutes, isValid } from 'date-fns';

export function useAutoReminders() {
  const { enabled, sendNotification } = useNotifications();
  const { data: tasks } = useTasks();
  const { data: events } = useEvents();
  const { data: habits } = useHabits();
  const { t } = useLanguage();
  const scheduledRef = useRef<Set<string>>(new Set());
  // Track all timeout IDs so we can clean them up on unmount / re-run
  const timeoutIds = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Task reminders
  useEffect(() => {
    if (!enabled || !tasks) return;

    const now = new Date();

    tasks.forEach(task => {
      if (!task.status || task.status === 'done' || !task.due_date) return;
      if (scheduledRef.current.has(`task-${task.id}`)) return;

      const dueDate = parseISO(task.due_date);
      if (!isValid(dueDate)) return;

      if (isToday(dueDate) || isTomorrow(dueDate)) {
        const label = isToday(dueDate) ? t('common.today') : 'Tomorrow';

        if (isToday(dueDate)) {
          scheduledRef.current.add(`task-${task.id}`);

          const eightAM = setMinutes(setHours(now, 8), 0);
          const minsUntilEight = differenceInMinutes(eightAM, now);

          if (minsUntilEight > 0 && minsUntilEight < 60) {
            const id = setTimeout(() => {
              sendNotification(
                `${t('notifications.taskDue')} - ${label}`,
                task.title,
                'task'
              );
            }, minsUntilEight * 60 * 1000);
            timeoutIds.current.push(id);
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
      if (!isValid(startTime)) return;

      const minsUntilEvent = differenceInMinutes(startTime, now);

      if (minsUntilEvent > 0 && minsUntilEvent <= 60) {
        scheduledRef.current.add(`event-${event.id}`);

        const notifyIn = Math.max(0, minsUntilEvent - 30) * 60 * 1000;

        const id = setTimeout(() => {
          sendNotification(
            t('notifications.eventSoon'),
            `${event.title} - ${minsUntilEvent <= 30 ? 'Now' : 'In 30 mins'}`,
            'event'
          );
        }, notifyIn);
        timeoutIds.current.push(id);
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

        const id = setTimeout(() => {
          sendNotification(
            t('notifications.habitReminder'),
            `${activeHabits.length} ${t('habits.dailyHabits')}`,
            'habit'
          );
        }, minsUntilNine * 60 * 1000);
        timeoutIds.current.push(id);
      }
    }
  }, [enabled, habits, sendNotification, t]);

  // Cleanup all pending timeouts on unmount
  useEffect(() => {
    return () => {
      timeoutIds.current.forEach(clearTimeout);
      timeoutIds.current = [];
    };
  }, []);
}
