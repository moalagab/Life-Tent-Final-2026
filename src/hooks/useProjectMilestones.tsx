import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface ProjectMilestone {
  id: string;
  user_id: string;
  project_id: string;
  title: string;
  description: string | null;
  due_date: string;
  completed_at: string | null;
  status: 'pending' | 'completed' | 'overdue';
  color: string | null;
  created_at: string;
  updated_at: string;
}

export function useProjectMilestones(projectId?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['project-milestones', projectId, user?.id],
    queryFn: async () => {
      let query = supabase
        .from('project_milestones')
        .select('*, projects(title)')
        .order('due_date', { ascending: true });

      if (projectId) {
        query = query.eq('project_id', projectId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as (ProjectMilestone & { projects: { title: string } })[];
    },
    enabled: !!user,
  });
}

export function useCreateMilestone() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (milestone: { project_id: string; title: string; description?: string; due_date: string; color?: string }) => {
      const { data, error } = await supabase
        .from('project_milestones')
        .insert({ ...milestone, user_id: user!.id } as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-milestones'] });
    },
  });
}

export function useUpdateMilestone() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; title?: string; description?: string; due_date?: string; status?: string; completed_at?: string | null }) => {
      const { data, error } = await supabase
        .from('project_milestones')
        .update(updates as any)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-milestones'] });
    },
  });
}

export function useDeleteMilestone() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('project_milestones')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-milestones'] });
    },
  });
}
