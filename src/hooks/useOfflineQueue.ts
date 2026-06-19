/**
 * useOfflineQueue — Offline-first mutation queue with conflict detection.
 *
 * When the device loses connectivity, mutations are stored in localStorage
 * instead of being dropped. When the connection is restored, the queue
 * is replayed in order.
 *
 * ── Conflict Detection (update ops) ──────────────────────────────────────────
 *
 * Pass `expectedUpdatedAt` when enqueueing an update. This is the server row's
 * `updated_at` value at the time the offline edit was made.
 *
 * During replay, the mutation adds `.eq('updated_at', expectedUpdatedAt)` to
 * the Supabase update query. Postgres will only apply the update if the row
 * hasn't been modified since — the same "optimistic locking" pattern used
 * by SQL SELECT FOR UPDATE SKIP LOCKED.
 *
 * If the row WAS modified on the server (count = 0 rows updated), the stale
 * mutation is silently discarded and the server version is preserved.
 * Callers can inspect `conflicts` returned by the hook to show a toast.
 *
 * Usage:
 *   const { enqueue, conflicts } = useOfflineQueue();
 *
 *   // Simple insert — no conflict detection needed
 *   enqueue({ table: 'tasks', op: 'insert', payload: { title: '...' } });
 *
 *   // Update with conflict detection
 *   enqueue({
 *     table:             'tasks',
 *     op:                'update',
 *     payload:           { title: 'New title', updated_at: now },
 *     filter:            { id: task.id },
 *     expectedUpdatedAt: task.updated_at,  // ← server value before edit
 *   });
 *
 * Conflict outcome: server wins (stale offline edit is discarded).
 * The row's server state remains intact. A conflict record is returned
 * so the UI can show "Some offline changes were discarded".
 */
import { useEffect, useCallback, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOnlineStatus } from './useOnlineStatus';

// ── Types ─────────────────────────────────────────────────────────────────────

type Op = 'insert' | 'update' | 'delete' | 'upsert';

export interface QueuedMutation {
  id:         string;
  table:      string;
  op:         Op;
  payload:    Record<string, unknown>;
  /** For update/delete: row filter, e.g. { id: 'abc' } */
  filter?:    Record<string, unknown>;
  enqueuedAt: string; // ISO string
  /**
   * For `update` ops: the server row's `updated_at` at the time of queuing.
   * If provided, replay will only apply the mutation if the row hasn't changed.
   * Omit for inserts, deletes, or updates where conflicts are acceptable.
   */
  expectedUpdatedAt?: string;
}

/** Describes a mutation that was discarded due to a server-side conflict. */
export interface ConflictRecord {
  mutation:   QueuedMutation;
  detectedAt: string; // ISO string
}

const QUEUE_KEY = 'offline-mutation-queue';

function loadQueue(): QueuedMutation[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? (JSON.parse(raw) as QueuedMutation[]) : [];
  } catch {
    return [];
  }
}

function saveQueue(queue: QueuedMutation[]): void {
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch { /* storage full — drop silently */ }
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useOfflineQueue() {
  const isOnline     = useOnlineStatus();
  const queryClient  = useQueryClient();
  const replayingRef = useRef(false);

  /** Conflicts detected during the last replay. Reset on each new replay. */
  const [conflicts, setConflicts] = useState<ConflictRecord[]>([]);

  // ── Replay the queue when back online ──────────────────────────────────────

  const replayQueue = useCallback(async () => {
    if (replayingRef.current) return;
    const queue = loadQueue();
    if (!queue.length) return;

    replayingRef.current = true;

    const failed:    QueuedMutation[] = [];
    const detected:  ConflictRecord[] = [];

    for (const mutation of queue) {
      try {
        await applyMutation(mutation, detected);
      } catch (err) {
        console.error(
          `[OfflineQueue] Replay failed for ${mutation.table}:${mutation.op}`,
          err,
        );
        // Keep failed mutation for the next reconnect attempt
        failed.push(mutation);
      }
    }

    saveQueue(failed);
    setConflicts(detected);

    if (detected.length > 0) {
      console.warn(
        `[OfflineQueue] ${detected.length} offline update(s) discarded — server version was newer.`,
        detected.map(c => ({ table: c.mutation.table, filter: c.mutation.filter })),
      );
    }

    // Invalidate all queries so UI reflects the authoritative server state
    await queryClient.invalidateQueries();
    replayingRef.current = false;
  }, [queryClient]);

  useEffect(() => {
    if (isOnline) {
      replayQueue();
    }
  }, [isOnline, replayQueue]);

  // ── Enqueue a mutation ────────────────────────────────────────────────────

  const enqueue = useCallback(
    (mutation: Omit<QueuedMutation, 'id' | 'enqueuedAt'>) => {
      const queue = loadQueue();
      queue.push({
        ...mutation,
        id:         crypto.randomUUID(),
        enqueuedAt: new Date().toISOString(),
      });
      saveQueue(queue);
    },
    [],
  );

  // ── Clear conflicts after the UI has acknowledged them ──────────────────

  const clearConflicts = useCallback(() => setConflicts([]), []);

  // ── Queue stats ───────────────────────────────────────────────────────────

  const pendingCount = loadQueue().length;

  return { enqueue, replayQueue, pendingCount, isOnline, conflicts, clearConflicts };
}

// ── applyMutation — pure async, no React state ───────────────────────────────

const ALLOWED_OFFLINE_TABLES = new Set([
  'tasks', 'projects', 'goals', 'habits', 'habit_logs', 'notes', 'courses',
  'resources', 'areas', 'events', 'finance_transactions', 'media_items',
  'push_subscriptions', 'customers', 'cases', 'communications',
]);

async function applyMutation(
  mutation: QueuedMutation,
  detected: ConflictRecord[],
): Promise<void> {
  if (!ALLOWED_OFFLINE_TABLES.has(mutation.table)) {
    throw new Error(`Offline queue: disallowed table "${mutation.table}"`);
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const table = supabase.from(mutation.table as any);

  switch (mutation.op) {
    case 'insert': {
      const { error } = await table.insert(mutation.payload as never);
      if (error) throw error;
      break;
    }

    case 'upsert': {
      const { error } = await table.upsert(mutation.payload as never);
      if (error) throw error;
      break;
    }

    case 'delete': {
      if (!mutation.filter) break;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let q: any = table.delete();
      for (const [col, val] of Object.entries(mutation.filter)) {
        q = q.eq(col, val as string);
      }
      const { error } = await q;
      if (error) throw error;
      break;
    }

    case 'update': {
      if (!mutation.filter) break;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let q: any = table.update(mutation.payload as never);

      // Apply row filter (e.g. { id: 'abc' })
      for (const [col, val] of Object.entries(mutation.filter)) {
        q = q.eq(col, val as string);
      }

      if (mutation.expectedUpdatedAt) {
        // ── Conflict detection ──────────────────────────────────────────────
        // Only apply the update if the server row hasn't changed since we
        // queued the mutation (optimistic locking via updated_at match).
        q = q.eq('updated_at', mutation.expectedUpdatedAt);

        // Ask Postgres to return the matched rows so we can count them.
        const { data, error } = await q.select('id');
        if (error) throw error;

        const rowsAffected = Array.isArray(data) ? data.length : 0;

        if (rowsAffected === 0) {
          // The row was modified on the server after we went offline.
          // Discard this mutation and preserve the server version.
          detected.push({ mutation, detectedAt: new Date().toISOString() });
          return; // not an error — intentional discard
        }
      } else {
        // No conflict check requested — apply unconditionally (last write wins).
        const { error } = await q;
        if (error) throw error;
      }
      break;
    }
  }
}
