import { useEffect, useRef } from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import { usePushSubscription } from '@/hooks/usePushSubscription';
import { useTasks } from '@/hooks/useTasks';
import { useEvents } from '@/hooks/useEvents';
import { useHabits } from '@/hooks/useHabits';
import { useLanguage } from '@/hooks/useLanguage';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { isToday, isTomorrow, differenceInMinutes, parseISO, setHours, setMinutes, isValid } from 'date-fns';

/**
 * Fire a push notification via the send-push edge function.
 * Belt-and-suspenders: used alongside the browser Notification API so the
 * user still gets a system-level notification when the tab is in the background.
 */
async function invokePush(userId: string, title: string, body: string, url: string) {
  try {
    await supabase.functions.invoke('send-push', {
      body: { user_id: userId, title, body, url },
    });
  } catch {
    // Non-critical — browser notification already shown
  }
}

export function useAutoReminders() {
  const { enabled, sendNotification } = useNotifications();
  const { isSubscribed: pushSubscribed } = usePushSubscription();
  const { user } = useAuth();
  const { data: tasks } = useTasks();
  const { data: events } = useEvents();
  const { data: habits } = useHabits();
  const { t } = useLanguage();

  const scheduledRef   = useRef<Set<string>>(new Set());
  const timeoutIds     = useRef<ReturnType<typeof setTimeout>[]>([]);
  // Keep a ref so setTimeout closures see the latest value without re-scheduling
  const pushRef        = useRef(pushSubscribed);
  const userIdRef      = useRef(user?.id);

  useEffect(() => { pushRef.current   = pushSubscribed; }, [pushSubscribed]);
  useEffect(() => { userIdRef.current = user?.id; },      [user?.id]);

  // ── On mount: trigger server-side reminders for the day ─────────────────────
  // Calls send-reminders so the backend dispatches push for any upcoming items
  // even if the app is closed later. Only runs once per session.
  useEffect(() => {
    if (!enabled || !user) return;
    void supabase.functions.invoke('send-reminders');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, enabled]);

  // ── Task reminders ───────────────────────────────────────────────────────────
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

          const eightAM       = setMinutes(setHours(now, 8), 0);
          const minsUntilEight = differenceInMinutes(eightAM, now);

          if (minsUntilEight > 0 && minsUntilEight < 60) {
            const id = setTimeout(() => {
              const title = `${t('notifications.taskDue')} - ${label}`;
              sendNotification(title, task.title, 'task');
              // Also dispatch a real push so it fires even if the tab loses focus
              if (pushRef.current && userIdRef.current) {
                void invokePush(userIdRef.current, title, task.title, '/tasks');
              }
            }, minsUntilEight * 60 * 1000);
            timeoutIds.current.push(id);
          }
        }
      }
    });
  }, [enabled, tasks, sendNotification, t]);

  // ── Event reminders ──────────────────────────────────────────────────────────
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
          const remainingText = minsUntilEvent <= 30 ? 'Now' : 'In 30 mins';
          const title         = t('notifications.eventSoon');
          const body          = `${event.title} - ${remainingText}`;
          sendNotification(title, body, 'event');
          if (pushRef.current && userIdRef.current) {
            void invokePush(userIdRef.current, title, body, '/calendar');
          }
        }, notifyIn);
        timeoutIds.current.push(id);
      }
    });
  }, [enabled, events, sendNotification, t]);

  // ── Habit reminders — daily at 9 AM ─────────────────────────────────────────
  useEffect(() => {
    if (!enabled || !habits) return;

    const now      = new Date();
    const nineAM   = setMinutes(setHours(now, 9), 0);
    const minsUntilNine = differenceInMinutes(nineAM, now);

    if (minsUntilNine > 0 && minsUntilNine < 60) {
      const activeHabits = habits.filter(h => h.is_active);

      if (activeHabits.length > 0 && !scheduledRef.current.has('habits-daily')) {
        scheduledRef.current.add('habits-daily');

        const id = setTimeout(() => {
          const title = t('notifications.habitReminder');
          const body  = `${activeHabits.length} ${t('habits.dailyHabits')}`;
          sendNotification(title, body, 'habit');
          if (pushRef.current && userIdRef.current) {
            void invokePush(userIdRef.current, title, body, '/habits');
          }
        }, minsUntilNine * 60 * 1000);
        timeoutIds.current.push(id);
      }
    }
  }, [enabled, habits, sendNotification, t]);

  // ── Cleanup all pending timeouts on unmount ──────────────────────────────────
  useEffect(() => {
    return () => {
      timeoutIds.current.forEach(clearTimeout);
      timeoutIds.current = [];
    };
  }, []);
}
