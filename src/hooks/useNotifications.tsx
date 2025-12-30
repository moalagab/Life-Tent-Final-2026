import { useState, useEffect, useCallback } from 'react';
import { useLanguage } from './useLanguage';

export type NotificationType = 'task' | 'event' | 'habit' | 'subscription' | 'debt' | 'project';

export interface Notification {
  id: string;
  title: string;
  body: string;
  type: NotificationType;
  timestamp: Date;
  read: boolean;
  sourceId?: string;
  sourceType?: string;
}

export function useNotifications() {
  const { t } = useLanguage();
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [enabled, setEnabled] = useState(() => {
    const stored = localStorage.getItem('notifications-enabled');
    return stored ? JSON.parse(stored) : false;
  });

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      return 'denied';
    }

    const result = await Notification.requestPermission();
    setPermission(result);
    return result;
  }, []);

  const enableNotifications = useCallback(async () => {
    const result = await requestPermission();
    if (result === 'granted') {
      setEnabled(true);
      localStorage.setItem('notifications-enabled', 'true');
      return true;
    }
    return false;
  }, [requestPermission]);

  const disableNotifications = useCallback(() => {
    setEnabled(false);
    localStorage.setItem('notifications-enabled', 'false');
  }, []);

  const sendNotification = useCallback((
    title: string, 
    body: string, 
    type: NotificationType,
    sourceId?: string,
    sourceType?: string
  ) => {
    if (!enabled || permission !== 'granted') return;

    // Browser notification
    const notification = new Notification(title, {
      body,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
    });

    // Add to internal notifications list
    const newNotification: Notification = {
      id: crypto.randomUUID(),
      title,
      body,
      type,
      timestamp: new Date(),
      read: false,
      sourceId,
      sourceType,
    };

    setNotifications(prev => [newNotification, ...prev].slice(0, 50));

    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    return notification;
  }, [enabled, permission]);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev =>
      prev.map(n => ({ ...n, read: true }))
    );
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const scheduleTaskReminder = useCallback((taskTitle: string, dueDate: Date) => {
    if (!enabled) return;

    const now = new Date();
    const timeDiff = dueDate.getTime() - now.getTime();
    const hourBefore = timeDiff - (60 * 60 * 1000);

    if (hourBefore > 0) {
      setTimeout(() => {
        sendNotification(
          t('notifications.taskDue'),
          taskTitle,
          'task'
        );
      }, hourBefore);
    }
  }, [enabled, sendNotification, t]);

  const scheduleEventReminder = useCallback((eventTitle: string, startTime: Date) => {
    if (!enabled) return;

    const now = new Date();
    const timeDiff = startTime.getTime() - now.getTime();
    const thirtyMinBefore = timeDiff - (30 * 60 * 1000);

    if (thirtyMinBefore > 0) {
      setTimeout(() => {
        sendNotification(
          t('notifications.eventSoon'),
          eventTitle,
          'event'
        );
      }, thirtyMinBefore);
    }
  }, [enabled, sendNotification, t]);

  const sendHabitReminder = useCallback((habitName: string) => {
    if (!enabled) return;
    
    sendNotification(
      t('notifications.habitReminder'),
      habitName,
      'habit'
    );
  }, [enabled, sendNotification, t]);

  const scheduleSubscriptionReminder = useCallback((
    subscriptionName: string, 
    amount: number, 
    billingDate: Date,
    subscriptionId: string
  ) => {
    if (!enabled) return;

    const now = new Date();
    const timeDiff = billingDate.getTime() - now.getTime();
    const threeDaysBefore = timeDiff - (3 * 24 * 60 * 60 * 1000); // 3 days before

    if (threeDaysBefore > 0) {
      setTimeout(() => {
        sendNotification(
          t('notifications.subscriptionRenewal') || 'تجديد اشتراك قادم',
          `${subscriptionName} - ${amount}`,
          'subscription',
          subscriptionId,
          'subscriptions'
        );
      }, threeDaysBefore);
    }
  }, [enabled, sendNotification, t]);

  const sendDebtReminder = useCallback((
    debtName: string, 
    amount: number,
    debtId: string
  ) => {
    if (!enabled) return;
    
    sendNotification(
      t('notifications.debtPayment') || 'موعد سداد دين',
      `${debtName} - ${amount}`,
      'debt',
      debtId,
      'debts'
    );
  }, [enabled, sendNotification, t]);

  const unreadCount = notifications.filter(n => !n.read).length;

  return {
    permission,
    enabled,
    notifications,
    unreadCount,
    requestPermission,
    enableNotifications,
    disableNotifications,
    sendNotification,
    markAsRead,
    markAllAsRead,
    clearAll,
    scheduleTaskReminder,
    scheduleEventReminder,
    sendHabitReminder,
    scheduleSubscriptionReminder,
    sendDebtReminder,
  };
}
