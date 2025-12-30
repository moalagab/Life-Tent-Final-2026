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

export function useRealtimeSubscription({
  table,
  queryKey,
  enabled = true,
}: UseRealtimeSubscriptionOptions) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled) return;

    const channel: RealtimeChannel = supabase
      .channel(`realtime-${table}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: table,
        },
        (payload) => {
          console.log(`Realtime update for ${table}:`, payload.eventType);
          queryClient.invalidateQueries({ queryKey });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, queryKey, enabled, queryClient]);
}

// Hook for multiple tables subscription
export function useMultiTableRealtime(
  subscriptions: { table: TableName; queryKey: string[] }[],
  enabled = true
) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled) return;

    const channels: RealtimeChannel[] = subscriptions.map(({ table, queryKey }) => {
      return supabase
        .channel(`realtime-${table}-${Date.now()}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: table,
          },
          () => {
            queryClient.invalidateQueries({ queryKey });
          }
        )
        .subscribe();
    });

    return () => {
      channels.forEach((channel) => supabase.removeChannel(channel));
    };
  }, [subscriptions, enabled, queryClient]);
}
