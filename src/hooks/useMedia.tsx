import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { useAuth } from './useAuth';

export type MediaItem = Tables<'media_items'>;

export function useBooks() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['books', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('media_items')
        .select('*')
        .eq('type', 'book')
        .order('updated_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useMovies() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['movies', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('media_items')
        .select('*')
        .in('type', ['movie', 'series'])
        .order('updated_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useReadingStats() {
  const { user } = useAuth();
  const currentYear = new Date().getFullYear();

  return useQuery({
    queryKey: ['reading-stats', user?.id, currentYear],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('media_items')
        .select('*')
        .eq('type', 'book')
        .eq('status', 'completed')
        .gte('end_date', `${currentYear}-01-01`)
        .lte('end_date', `${currentYear}-12-31`);
      
      if (error) throw error;
      return {
        booksRead: data.length,
        goal: 24, // Could be stored in user settings
      };
    },
    enabled: !!user,
  });
}

export function useCreateMediaItem() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (item: Omit<TablesInsert<'media_items'>, 'user_id'>) => {
      const { data, error } = await supabase
        .from('media_items')
        .insert({ ...item, user_id: user!.id })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['books'] });
      queryClient.invalidateQueries({ queryKey: ['movies'] });
      queryClient.invalidateQueries({ queryKey: ['reading-stats'] });
    },
  });
}

export function useUpdateMediaItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: TablesUpdate<'media_items'> & { id: string }) => {
      const { data, error } = await supabase
        .from('media_items')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] });
      queryClient.invalidateQueries({ queryKey: ['movies'] });
      queryClient.invalidateQueries({ queryKey: ['reading-stats'] });
    },
  });
}

export function useDeleteMediaItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('media_items')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] });
      queryClient.invalidateQueries({ queryKey: ['movies'] });
      queryClient.invalidateQueries({ queryKey: ['reading-stats'] });
    },
  });
}