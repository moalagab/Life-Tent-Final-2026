/**
 * useEmailNotifications — calls the send-notifications Edge Function.
 * Reads the recipient email from NotificationSettings (localStorage).
 */
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { getNotificationPrefs } from '@/components/settings/NotificationSettings';

type NotifType =
  | 'task_reminder'
  | 'habit_reminder'
  | 'debt_due'
  | 'subscription_renewal'
  | 'budget_alert'
  | 'goal_progress'
  | 'backup_complete';

export function useEmailNotifications() {
  const { user } = useAuth();

  const send = useCallback(async (
    type: NotifType,
    data: Record<string, unknown>,
    overrideEmail?: string,
  ) => {
    const prefs = getNotificationPrefs();
    const to = overrideEmail ?? prefs.emailAddress;

    // Only send if email is configured
    if (!to || !prefs.emailEnabled) return;

    try {
      await supabase.functions.invoke('send-notifications', {
        body: {
          type,
          to,
          userName: user?.user_metadata?.full_name ?? user?.email ?? '',
          data: { ...data, appUrl: window.location.origin },
        },
      });
    } catch (err) {
      // Non-blocking — email failures shouldn't break the UI
      console.warn('[useEmailNotifications] Failed to send:', err);
    }
  }, [user]);

  return { send };
}
