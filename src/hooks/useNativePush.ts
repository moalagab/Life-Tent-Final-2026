/**
 * useNativePush — Native push notifications via @capacitor/push-notifications.
 *
 * On Android: Firebase Cloud Messaging (FCM)
 * On iOS:     Apple Push Notification Service (APNs)
 * On Web:     delegates to usePushSubscription (VAPID)
 *
 * Usage:
 *   const { token, permission, requestPermission } = useNativePush();
 */
import { useState, useEffect, useCallback } from 'react';
import { isNative } from '@/lib/capacitor';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface NativePushState {
  permission: 'default' | 'granted' | 'denied';
  token: string | null;
  isLoading: boolean;
  requestPermission: () => Promise<boolean>;
}

export function useNativePush(): NativePushState {
  const { user } = useAuth();
  const [permission, setPermission] = useState<'default' | 'granted' | 'denied'>('default');
  const [token, setToken]           = useState<string | null>(null);
  const [isLoading, setIsLoading]   = useState(false);

  // Save FCM/APNs token to Supabase so edge functions can target this device
  const saveToken = useCallback(async (fcmToken: string) => {
    if (!user) return;
    try {
      await supabase.from('push_subscriptions').upsert({
        user_id:  user.id,
        endpoint: fcmToken,          // reuse endpoint column for native token
        p256dh:   'native',          // marker to distinguish from VAPID
        auth:     'native',
      }, { onConflict: 'user_id,endpoint' });
    } catch { /* non-fatal */ }
  }, [user]);

  useEffect(() => {
    if (!isNative) return;

    const cleanupFns: Array<() => void> = [];

    import('@capacitor/push-notifications').then(({ PushNotifications }) => {
      // Check current permission state
      PushNotifications.checkPermissions().then(result => {
        setPermission(result.receive === 'granted' ? 'granted'
                    : result.receive === 'denied'  ? 'denied'
                    : 'default');
      }).catch(() => {});

      // Registration success → save token
      PushNotifications.addListener('registration', reg => {
        setToken(reg.value);
        saveToken(reg.value);
        setPermission('granted');
      }).then(h => cleanupFns.push(() => h.remove())).catch(() => {});

      // Registration error
      PushNotifications.addListener('registrationError', () => {
        setPermission('denied');
      }).then(h => cleanupFns.push(() => h.remove())).catch(() => {});

      // Foreground notification received
      PushNotifications.addListener('pushNotificationReceived', notification => {
        console.log('[Push] received in foreground:', notification.title);
      }).then(h => cleanupFns.push(() => h.remove())).catch(() => {});

      // Notification tapped
      PushNotifications.addListener('pushNotificationActionPerformed', action => {
        const url = action.notification?.data?.url as string | undefined;
        if (url) window.location.href = url;
      }).then(h => cleanupFns.push(() => h.remove())).catch(() => {});
    }).catch(() => {});

    return () => cleanupFns.forEach(fn => fn());
  }, [saveToken]);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isNative) return false;
    setIsLoading(true);
    try {
      const { PushNotifications } = await import('@capacitor/push-notifications');
      const result = await PushNotifications.requestPermissions();
      if (result.receive === 'granted') {
        await PushNotifications.register();
        setPermission('granted');
        return true;
      }
      setPermission('denied');
      return false;
    } catch {
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { permission, token, isLoading, requestPermission };
}
