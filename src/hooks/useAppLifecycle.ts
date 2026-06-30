/**
 * useAppLifecycle — Native app lifecycle events via @capacitor/app.
 *
 * Handles:
 *   - Android back button (navigate back or minimize app)
 *   - App resume (refresh stale data)
 *   - App pause (save pending state)
 *
 * Only active on native platforms — no-op on web.
 */
import { useEffect } from 'react';
import { isNative } from '@/lib/capacitor';

export function useAppLifecycle(onResume?: () => void) {
  useEffect(() => {
    if (!isNative) return;

    const cleanupFns: Array<() => void> = [];

    import('@capacitor/app').then(({ App }) => {
      // Back button — go back in history, or minimize on root
      App.addListener('backButton', ({ canGoBack }) => {
        if (canGoBack) {
          window.history.back();
        } else {
          App.minimizeApp();
        }
      }).then(h => cleanupFns.push(() => h.remove())).catch(() => {});

      // Resume — app comes back to foreground
      App.addListener('resume', () => {
        onResume?.();
      }).then(h => cleanupFns.push(() => h.remove())).catch(() => {});

    }).catch(() => {});

    return () => cleanupFns.forEach(fn => fn());
  }, [onResume]);
}
