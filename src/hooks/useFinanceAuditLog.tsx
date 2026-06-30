import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface FinanceAuditLog {
  id: string;
  user_id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  source: string | null;
  created_at: string;
}

export function useFinanceAuditLog(limit = 50) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['finance-audit-log', user?.id, limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('finance_audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as FinanceAuditLog[];
    },
    enabled: !!user,
  });
}

export function useFinanceActivityLog(limit = 100) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['finance-activity-log', user?.id, limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('finance_activity_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}
