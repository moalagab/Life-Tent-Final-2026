import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Manages the Screen Wake Lock API to prevent the screen from
 * turning off during active Pomodoro sessions.
 *
 * Automatically re-acquires the lock when the page becomes visible
 * again (e.g. after the user switches tabs).
 */
export function useWakeLock() {
  const [isSupported] = useState(() => 'wakeLock' in navigator);
  const [isActive, setIsActive]   = useState(false);
  const sentinelRef = useRef<WakeLockSentinel | null>(null);

  const acquire = useCallback(async () => {
    if (!isSupported) return;
    try {
      sentinelRef.current = await (navigator as Navigator & { wakeLock: { request: (type: string) => Promise<WakeLockSentinel> } }).wakeLock.request('screen');
      setIsActive(true);

      sentinelRef.current.addEventListener('release', () => {
        setIsActive(false);
      });
    } catch (err) {
      // Silently ignore — wake lock may be denied (low battery, etc.)
      console.warn('Wake lock could not be acquired:', err);
    }
  }, [isSupported]);

  const release = useCallback(async () => {
    if (sentinelRef.current) {
      await sentinelRef.current.release();
      sentinelRef.current = null;
      setIsActive(false);
    }
  }, []);

  // Re-acquire when the page becomes visible again (tab switch / lock screen)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isActive && !sentinelRef.current) {
        acquire();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isActive, acquire]);

  // Always release on unmount
  useEffect(() => {
    return () => {
      sentinelRef.current?.release().catch(() => {});
    };
  }, []);

  return { isSupported, isActive, acquire, release };
}
