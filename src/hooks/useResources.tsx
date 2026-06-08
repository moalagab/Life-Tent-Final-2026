import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type ResourceType = 'note' | 'file' | 'link' | 'course' | 'media' | 'document';

export interface Resource {
  id: string;
  user_id: string;
  type: ResourceType;
  title: string;
  description: string | null;
  content: string | null;
  content_ref: string | null;
  source_url: string | null;
  area_id: string | null;
  project_id: string | null;
  tags: string[] | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata: Record<string, any> | null;
  last_used_at: string | null;
  status: 'active' | 'archived';
  created_at: string;
  updated_at: string;
  archived_at: string | null;
}

export type ResourceInsert = Omit<Resource, 'id' | 'created_at' | 'updated_at' | 'user_id'>;
export type ResourceUpdate = Partial<ResourceInsert> & { id: string };

export interface ResourceFilters {
  type?: ResourceType;
  area_id?: string;
  project_id?: string;
  tag?: string;
  includeArchived?: boolean;
}

export function useResources(filters: ResourceFilters = {}) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['resources', user?.id, filters],
    queryFn: async () => {
      let query = supabase
        .from('resources')
        .select('*, areas(name), projects(title)')
        .order('updated_at', { ascending: false });

      if (!filters.includeArchived) {
        query = query.eq('status', 'active');
      }

      if (filters.type) {
        query = query.eq('type', filters.type);
      }

      if (filters.area_id) {
        query = query.eq('area_id', filters.area_id);
      }

      if (filters.project_id) {
        query = query.eq('project_id', filters.project_id);
      }

      if (filters.tag) {
        query = query.contains('tags', [filters.tag]);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useCreateResource() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (resource: { type: ResourceType; title: string; description?: string | null; content?: string | null; source_url?: string | null; area_id?: string | null; project_id?: string | null; tags?: string[] | null }) => {
      const { data, error } = await supabase
        .from('resources')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .insert({ ...resource, user_id: user!.id, status: 'active' } as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources'] });
    },
  });
}

export function useUpdateResource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: ResourceUpdate) => {
      const { data, error } = await supabase
        .from('resources')
        .update({ ...updates, last_used_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources'] });
    },
  });
}

export function useArchiveResource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('resources')
        .update({ status: 'archived', archived_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources'] });
    },
  });
}

export function useRestoreResource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('resources')
        .update({ status: 'active', archived_at: null })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources'] });
    },
  });
}

export function useDeleteResource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('resources')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources'] });
    },
  });
}
