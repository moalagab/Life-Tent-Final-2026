import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Area {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  owner_id: string | null;
  status: 'active' | 'archived';
  review_cadence: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  kpi_json: Record<string, unknown> | null;
  color: string | null;
  icon: string | null;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
}

export type AreaInsert = Omit<Area, 'id' | 'created_at' | 'updated_at' | 'user_id'>;
export type AreaUpdate = Partial<AreaInsert> & { id: string };

export function useAreas(includeArchived = false) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['areas', user?.id, includeArchived],
    queryFn: async () => {
      let query = supabase
        .from('areas')
        .select('*')
        .order('created_at', { ascending: false });

      if (!includeArchived) {
        query = query.eq('status', 'active');
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Area[];
    },
    enabled: !!user,
  });
}

export function useActiveAreas() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['areas', 'active', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('areas')
        .select('*')
        .eq('status', 'active')
        .order('name', { ascending: true });

      if (error) throw error;
      return data as Area[];
    },
    enabled: !!user,
  });
}

export function useCreateArea() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (area: { name: string; description?: string; color?: string; review_cadence?: string }) => {
      const { data, error } = await supabase
        .from('areas')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .insert({ ...area, user_id: user!.id, status: 'active' } as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['areas'] });
    },
  });
}

export function useUpdateArea() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; name?: string; description?: string; color?: string; review_cadence?: string }) => {
      const { data, error } = await supabase
        .from('areas')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .update(updates as any)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['areas'] });
    },
  });
}

export function useArchiveArea() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('areas')
        .update({ status: 'archived', archived_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['areas'] });
    },
  });
}

export function useRestoreArea() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('areas')
        .update({ status: 'active', archived_at: null })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['areas'] });
    },
  });
}

export function useDeleteArea() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('areas')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['areas'] });
    },
  });
}
