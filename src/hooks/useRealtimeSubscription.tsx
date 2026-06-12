import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

type TableName =
  | 'tasks'
  | 'projects'
  | 'goals'
  | 'habits'
  | 'habit_logs'
  | 'transactions'
  | 'accounts'
  | 'events'
  | 'notes'
  | 'areas'
  | 'resources'
  | 'mood_logs';

interface UseRealtimeSubscriptionOptions {
  table: TableName;
  queryKey: string[];
  enabled?: boolean;
}

/**
 * Subscribe to Postgres changes for a single table.
 *
 * Realtime is a best-effort enhancement — if WebSocket is unavailable
 * (installed PWA, restricted browser, mixed-content policy) we silently
 * skip the subscription rather than crashing the page.
 */
export function useRealtimeSubscription({
  table,
  queryKey,
  enabled = true,
}: UseRealtimeSubscriptionOptions) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled) return;

    let channel: RealtimeChannel | null = null;

    try {
      channel = supabase
        .channel(`realtime-${table}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table },
          (payload) => {
            console.log(`[realtime] ${table}:`, payload.eventType);
            queryClient.invalidateQueries({ queryKey });
          },
        )
        .subscribe((status, err) => {
          if (err) {
            // Non-fatal — realtime is a nice-to-have; log and move on
            console.warn(`[realtime] ${table} subscription error:`, err.message ?? err);
          }
        });
    } catch (err) {
      // WebSocket unavailable (e.g. "The operation is insecure" in PWA context)
      console.warn('[realtime] WebSocket unavailable, skipping realtime for', table, err);
    }

    return () => {
      if (channel) {
        supabase.removeChannel(channel).catch(() => {});
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table, enabled]);
}

/** Subscribe to multiple tables — same error resilience as the single-table variant. */
export function useMultiTableRealtime(
  subscriptions: { table: TableName; queryKey: string[] }[],
  enabled = true,
) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled) return;

    const channels: RealtimeChannel[] = [];

    for (const { table, queryKey } of subscriptions) {
      try {
        const ch = supabase
          .channel(`realtime-${table}-${Date.now()}`)
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table },
            () => queryClient.invalidateQueries({ queryKey }),
          )
          .subscribe((status, err) => {
            if (err) console.warn(`[realtime] ${table}:`, err.message ?? err);
          });
        channels.push(ch);
      } catch (err) {
        console.warn('[realtime] WebSocket unavailable for', table, err);
      }
    }

    return () => {
      channels.forEach((ch) => supabase.removeChannel(ch).catch(() => {}));
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);
}
