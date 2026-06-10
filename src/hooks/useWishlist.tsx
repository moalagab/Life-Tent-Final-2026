import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface WishlistItem {
  id: string;
  name: string;
  description?: string;
  estimated_price?: number;
  currency?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category?: string;
  url?: string;
  image_url?: string;
  target_date?: string;
  status: 'pending' | 'saved_for' | 'purchased' | 'cancelled';
  saved_amount?: number;
  linked_envelope_id?: string;
  linked_sinking_fund_id?: string;
  linked_media_id?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export function useWishlistItems() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['wishlist-items', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('wishlist_items')
        .select('*')
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as WishlistItem[];
    },
    enabled: !!user,
  });
}

export function useCreateWishlistItem() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (item: Partial<WishlistItem>) => {
      const { data, error } = await supabase
        .from('wishlist_items')
        .insert({ ...item, user_id: user!.id } as any)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist-items'] });
    },
  });
}

export function useUpdateWishlistItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<WishlistItem> & { id: string }) => {
      const { data, error } = await supabase
        .from('wishlist_items')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist-items'] });
    },
  });
}

export function useDeleteWishlistItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('wishlist_items')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist-items'] });
    },
  });
}
