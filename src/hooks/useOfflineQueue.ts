/**
 * useOfflineQueue — Offline-first mutation queue.
 *
 * When the device loses connectivity, mutations are stored in localStorage
 * instead of being dropped. When the connection is restored, the queue
 * is replayed in order.
 *
 * Usage:
 *   const { enqueue } = useOfflineQueue();
 *
 *   // Instead of calling supabase directly when offline:
 *   enqueue({
 *     table:  'tasks',
 *     op:     'insert',
 *     payload: { title: 'My Task', user_id: userId },
 *   });
 *
 * The queue is automatically replayed via the useOnlineStatus hook.
 * React Query cache invalidation after replay ensures UI is consistent.
 */
import { useEffect, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOnlineStatus } from './useOnlineStatus';

// ── Types ─────────────────────────────────────────────────────────────────────

type Op = 'insert' | 'update' | 'delete' | 'upsert';

export interface QueuedMutation {
  id:        string;
  table:     string;
  op:        Op;
  payload:   Record<string, unknown>;
  /** For update/delete: the row filter, e.g. { id: 'abc' } */
  filter?:   Record<string, unknown>;
  enqueuedAt:string; // ISO string
}

const QUEUE_KEY = 'offline-mutation-queue';

function loadQueue(): QueuedMutation[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveQueue(queue: QueuedMutation[]): void {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useOfflineQueue() {
  const isOnline    = useOnlineStatus();
  const queryClient = useQueryClient();
  const replayingRef = useRef(false);

  // ── Replay the queue when back online ──────────────────────────────────────

  const replayQueue = useCallback(async () => {
    if (replayingRef.current) return;
    const queue = loadQueue();
    if (!queue.length) return;

    replayingRef.current = true;
    const failed: QueuedMutation[] = [];

    for (const mutation of queue) {
      try {
        const table = supabase.from(mutation.table);

        if (mutation.op === 'insert') {
          const { error } = await table.insert(mutation.payload);
          if (error) throw error;
        } else if (mutation.op === 'upsert') {
          const { error } = await table.upsert(mutation.payload);
          if (error) throw error;
        } else if (mutation.op === 'update' && mutation.filter) {
          let q = table.update(mutation.payload);
          for (const [col, val] of Object.entries(mutation.filter)) {
            q = q.eq(col, val as string);
          }
          const { error } = await q;
          if (error) throw error;
        } else if (mutation.op === 'delete' && mutation.filter) {
          let q = table.delete();
          for (const [col, val] of Object.entries(mutation.filter)) {
            q = q.eq(col, val as string);
          }
          const { error } = await q;
          if (error) throw error;
        }
      } catch (err) {
        console.error(`Offline queue replay failed for ${mutation.table}:${mutation.op}`, err);
        // Re-queue the failed mutation (keep it for next attempt)
        failed.push(mutation);
      }
    }

    saveQueue(failed);

    // Invalidate all queries so UI refreshes with server state
    await queryClient.invalidateQueries();
    replayingRef.current = false;
  }, [queryClient]);

  useEffect(() => {
    if (isOnline) {
      replayQueue();
    }
  }, [isOnline, replayQueue]);

  // ── Enqueue a mutation ────────────────────────────────────────────────────

  const enqueue = useCallback((mutation: Omit<QueuedMutation, 'id' | 'enqueuedAt'>) => {
    const queue = loadQueue();
    queue.push({
      ...mutation,
      id:         crypto.randomUUID(),
      enqueuedAt: new Date().toISOString(),
    });
    saveQueue(queue);
  }, []);

  // ── Queue stats ───────────────────────────────────────────────────────────

  const pendingCount = loadQueue().length;

  return { enqueue, replayQueue, pendingCount, isOnline };
}
