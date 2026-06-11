/**
 * usePushSubscription — Web Push API (VAPID) integration.
 *
 * Setup required:
 *   1. Generate VAPID keys:  npx web-push generate-vapid-keys
 *   2. Add VITE_VAPID_PUBLIC_KEY to .env
 *   3. Add VAPID_PRIVATE_KEY + VAPID_SUBJECT to Supabase edge function secrets
 *
 * The subscription (endpoint + keys) is stored in `push_subscriptions` table
 * so the `send-push` edge function can target specific users.
 */
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;

/** Convert a base64url string to a Uint8Array (needed for applicationServerKey) */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)));
}

export function usePushSubscription() {
  const { user } = useAuth();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading,    setIsLoading]    = useState(false);

  const isSupported =
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager'   in window;

  // Check current subscription state on mount
  useEffect(() => {
    if (!isSupported) return;
    navigator.serviceWorker.ready.then(reg =>
      reg.pushManager.getSubscription().then(sub => setIsSubscribed(!!sub))
    );
  }, [isSupported]);

  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!user || !isSupported) return false;
    if (!VAPID_PUBLIC_KEY) {
      console.error('VITE_VAPID_PUBLIC_KEY is not set');
      return false;
    }

    setIsLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      const json = sub.toJSON() as {
        endpoint: string;
        keys: { p256dh: string; auth: string };
      };

      const { error } = await supabase.from('push_subscriptions').upsert(
        {
          user_id:  user.id,
          endpoint: json.endpoint,
          p256dh:   json.keys.p256dh,
          auth:     json.keys.auth,
        },
        { onConflict: 'user_id,endpoint' }
      );

      if (error) throw error;
      setIsSubscribed(true);
      return true;
    } catch (err) {
      console.error('Push subscription failed:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user, isSupported]);

  const unsubscribe = useCallback(async (): Promise<void> => {
    if (!isSupported) return;
    setIsLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await supabase
          .from('push_subscriptions')
          .delete()
          .eq('endpoint', sub.endpoint);
        await sub.unsubscribe();
        setIsSubscribed(false);
      }
    } finally {
      setIsLoading(false);
    }
  }, [isSupported]);

  return { isSupported, isSubscribed, isLoading, subscribe, unsubscribe };
}
