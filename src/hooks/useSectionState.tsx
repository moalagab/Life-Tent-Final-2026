import { useCallback, useEffect, useState } from 'react';
import { useAuth } from './useAuth';

/**
 * useSectionState — remembers collapsed/expanded state per section, per user, in localStorage.
 * Key shape: lt.section.<userId>.<sectionId>
 */
export function useSectionState(sectionId: string, defaultOpen = true) {
  const { user } = useAuth();
  const storageKey = `lt.section.${user?.id ?? 'anon'}.${sectionId}`;

  const [open, setOpen] = useState<boolean>(() => {
    if (typeof window === 'undefined') return defaultOpen;
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw === null) return defaultOpen;
      return raw === '1';
    } catch {
      return defaultOpen;
    }
  });

  // Re-sync if user changes
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw === null) {
        setOpen(defaultOpen);
      } else {
        setOpen(raw === '1');
      }
    } catch {
      /* ignore */
    }
  }, [storageKey, defaultOpen]);

  const toggle = useCallback(() => {
    setOpen((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(storageKey, next ? '1' : '0');
      } catch {
        /* ignore */
      }
      return next;
    });
  }, [storageKey]);

  const setOpenPersistent = useCallback(
    (next: boolean) => {
      setOpen(next);
      try {
        window.localStorage.setItem(storageKey, next ? '1' : '0');
      } catch {
        /* ignore */
      }
    },
    [storageKey]
  );

  return { open, toggle, setOpen: setOpenPersistent };
}
