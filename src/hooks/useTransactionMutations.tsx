import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { TablesUpdate } from '@/integrations/supabase/types';

export function useUpdateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<TablesUpdate<'transactions'>>) => {
      const { data, error } = await supabase
        .from('transactions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['monthly-stats'] });
    },
  });
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['monthly-stats'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });
}

export function useUploadReceipt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ transactionId, file }: { transactionId: string; file: File }) => {
      const fileExt = file.name.split('.').pop();
      const fileName = `${transactionId}-${Date.now()}.${fileExt}`;
      const filePath = `receipts/${fileName}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('uploads')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('uploads')
        .getPublicUrl(filePath);

      // Update transaction with receipt URL
      const { data, error } = await supabase
        .from('transactions')
        .update({ receipt_url: urlData.publicUrl })
        .eq('id', transactionId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
}
