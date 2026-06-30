/**
 * useOnlineStatus — Network connectivity, platform-aware.
 *
 * Native → @capacitor/network (more reliable on Android/iOS)
 * Web    → navigator.onLine + events
 */
import { useState, useEffect } from 'react';
import { isNative } from '@/lib/capacitor';

export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);

  useEffect(() => {
    if (isNative) {
      // ── Capacitor Network plugin ────────────────────────────────────────
      let listenerHandle: { remove: () => void } | null = null;

      import('@capacitor/network').then(({ Network }) => {
        // Get initial status
        Network.getStatus().then(s => setIsOnline(s.connected)).catch(() => {});

        // Listen for changes
        Network.addListener('networkStatusChange', status => {
          setIsOnline(status.connected);
        }).then(handle => {
          listenerHandle = handle;
        }).catch(() => {});
      }).catch(() => {});

      return () => { listenerHandle?.remove(); };
    }

    // ── Web events ──────────────────────────────────────────────────────────
    const handleOnline  = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online',  handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online',  handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}
