import { useCallback, useEffect, useState } from 'react';
import { useAuth } from './useAuth';

/**
 * usePersistedState — small wrapper around localStorage scoped per user.
 * Key shape: lt.<key>.<userId|anon>
 *
 * Use for UI state we want to remember across sessions: command palette open
 * state, last filter selections, selected layout preset, etc.
 */
export function usePersistedState<T>(key: string, initial: T) {
  const { user } = useAuth();
  const storageKey = `lt.${key}.${user?.id ?? 'anon'}`;

  const read = useCallback((): T => {
    if (typeof window === 'undefined') return initial;
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw === null) return initial;
      return JSON.parse(raw) as T;
    } catch {
      return initial;
    }
  }, [storageKey, initial]);

  const [value, setValueState] = useState<T>(read);

  // Re-sync when the user (and therefore key) changes
  useEffect(() => {
    setValueState(read());
  }, [storageKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const setValue = useCallback(
    (next: T | ((prev: T) => T)) => {
      setValueState((prev) => {
        const resolved =
          typeof next === 'function' ? (next as (p: T) => T)(prev) : next;
        try {
          window.localStorage.setItem(storageKey, JSON.stringify(resolved));
        } catch {
          /* ignore */
        }
        return resolved;
      });
    },
    [storageKey]
  );

  return [value, setValue] as const;
}
