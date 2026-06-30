import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface ReferralStats {
  referral_code: string | null;
  referral_count: number;
  reward_days: number;
}

export function useReferralStats() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['referral-stats', user?.id],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any).rpc('get_my_referral_stats');
      if (error) throw error;
      return data as ReferralStats;
    },
    enabled: !!user,
    staleTime: 60_000,
  });
}

export function useRecordReferral() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (referralCode: string) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any).rpc('record_referral', {
        p_referral_code: referralCode,
      });
      if (error) throw error;
      return data as boolean;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['referral-stats'] });
    },
  });
}
