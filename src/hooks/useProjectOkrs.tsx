import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface ProjectOkr {
  id: string;
  project_id: string;
  user_id: string;
  objective: string;
  description: string | null;
  quarter: string | null;
  year: number | null;
  progress: number | null;
  status: string | null;
  created_at: string;
  updated_at: string;
  key_results?: ProjectKeyResult[];
}

export interface ProjectKeyResult {
  id: string;
  okr_id: string;
  user_id: string;
  title: string;
  target_value: number;
  current_value: number | null;
  unit: string | null;
  created_at: string;
  updated_at: string;
}

export function useProjectOkrs(projectId?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['project-okrs', projectId, user?.id],
    queryFn: async () => {
      let query = supabase
        .from('project_okrs')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (projectId) {
        query = query.eq('project_id', projectId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as ProjectOkr[];
    },
    enabled: !!user,
  });
}

export function useProjectOkrsWithKeyResults(projectId?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['project-okrs-with-kr', projectId, user?.id],
    queryFn: async () => {
      let okrsQuery = supabase
        .from('project_okrs')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (projectId) {
        okrsQuery = okrsQuery.eq('project_id', projectId);
      }
      
      const { data: okrs, error: okrsError } = await okrsQuery;
      if (okrsError) throw okrsError;

      const okrIds = okrs.map(okr => okr.id);
      
      const { data: keyResults, error: krError } = await supabase
        .from('project_key_results')
        .select('*')
        .in('okr_id', okrIds.length > 0 ? okrIds : ['empty'])
        .order('created_at', { ascending: true });
      
      if (krError) throw krError;

      return okrs.map(okr => {
        const okrKRs = keyResults?.filter(kr => kr.okr_id === okr.id) || [];
        const progress = okrKRs.length > 0
          ? Math.round(okrKRs.reduce((sum, kr) => {
              const krProgress = kr.target_value > 0 
                ? ((kr.current_value || 0) / kr.target_value) * 100 
                : 0;
              return sum + krProgress;
            }, 0) / okrKRs.length)
          : 0;
        
        return {
          ...okr,
          key_results: okrKRs,
          calculatedProgress: progress,
        } as ProjectOkr & { calculatedProgress: number };
      });
    },
    enabled: !!user,
  });
}

export function useCreateProjectOkr() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (okr: { project_id: string; objective: string; description?: string; quarter?: string }) => {
      const { data, error } = await supabase
        .from('project_okrs')
        .insert({ ...okr, user_id: user!.id })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-okrs'] });
      queryClient.invalidateQueries({ queryKey: ['project-okrs-with-kr'] });
    },
  });
}

export function useUpdateProjectOkr() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; objective?: string; description?: string; status?: string; progress?: number }) => {
      const { data, error } = await supabase
        .from('project_okrs')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-okrs'] });
      queryClient.invalidateQueries({ queryKey: ['project-okrs-with-kr'] });
    },
  });
}

export function useDeleteProjectOkr() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('project_okrs')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-okrs'] });
      queryClient.invalidateQueries({ queryKey: ['project-okrs-with-kr'] });
    },
  });
}

export function useCreateProjectKeyResult() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (kr: { okr_id: string; title: string; target_value: number; unit?: string }) => {
      const { data, error } = await supabase
        .from('project_key_results')
        .insert({ ...kr, user_id: user!.id })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-okrs-with-kr'] });
    },
  });
}

export function useUpdateProjectKeyResult() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; current_value?: number; title?: string; target_value?: number }) => {
      const { data, error } = await supabase
        .from('project_key_results')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-okrs-with-kr'] });
    },
  });
}
