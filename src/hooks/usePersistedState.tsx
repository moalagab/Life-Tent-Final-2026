import { useCallback, useEffect, useRef, useState } from 'react';
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
  // Hold initial in a ref so object/array defaults don't cause re-renders.
  // The initial value is intentionally only read on mount — callers must not
  // rely on later changes to `initial` being picked up after mount.
  const initialRef = useRef(initial);

  const read = useCallback((): T => {
    if (typeof window === 'undefined') return initialRef.current;
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw === null) return initialRef.current;
      return JSON.parse(raw) as T;
    } catch {
      return initialRef.current;
    }
  }, [storageKey]);

  const [value, setValueState] = useState<T>(read);

  // Re-sync when the user (and therefore key) changes
  useEffect(() => {
    setValueState(read());
  }, [read]);

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
