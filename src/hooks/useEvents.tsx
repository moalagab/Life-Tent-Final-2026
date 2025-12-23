import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { useAuth } from './useAuth';
import { startOfMonth, endOfMonth, format } from 'date-fns';

export type Event = Tables<'events'>;
export type EventInsert = TablesInsert<'events'>;
export type EventUpdate = TablesUpdate<'events'>;

export function useEvents(month?: Date) {
  const { user } = useAuth();
  const targetMonth = month || new Date();
  const monthStart = startOfMonth(targetMonth);
  const monthEnd = endOfMonth(targetMonth);

  return useQuery({
    queryKey: ['events', user?.id, format(monthStart, 'yyyy-MM')],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .gte('start_time', monthStart.toISOString())
        .lte('start_time', monthEnd.toISOString())
        .order('start_time', { ascending: true });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useUpcomingEvents(limit = 5) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['upcoming-events', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .gte('start_time', new Date().toISOString())
        .order('start_time', { ascending: true })
        .limit(limit);
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useCreateEvent() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (event: Omit<EventInsert, 'user_id'>) => {
      const { data, error } = await supabase
        .from('events')
        .insert({ ...event, user_id: user!.id })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['upcoming-events'] });
    },
  });
}

export function useUpdateEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: EventUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('events')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['upcoming-events'] });
    },
  });
}

export function useDeleteEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['upcoming-events'] });
    },
  });
}