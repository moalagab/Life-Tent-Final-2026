import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface ProjectMember {
  id:         string;
  project_id: string;
  user_id:    string;
  role:       'editor' | 'viewer';
  invited_by: string | null;
  created_at: string;
}

export function useProjectMembers(projectId: string | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['project-members', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_members')
        .select('*')
        .eq('project_id', projectId!);
      if (error) throw error;
      return (data ?? []) as ProjectMember[];
    },
    enabled: !!user && !!projectId,
    staleTime: 1000 * 60,
  });
}

export function useInviteProjectMember(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ email, role = 'viewer' }: { email: string; role?: 'editor' | 'viewer' }) => {
      const { data, error } = await supabase.rpc('invite_project_member', {
        p_project_id:    projectId,
        p_invitee_email: email.trim().toLowerCase(),
        p_role:          role,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-members', projectId] });
      toast.success('تمت الدعوة بنجاح');
    },
    onError: (err: Error) => {
      toast.error(err.message.includes('not found')
        ? 'لا يوجد مستخدم بهذا البريد الإلكتروني'
        : err.message,
      );
    },
  });
}

export function useRemoveProjectMember(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase.rpc('remove_project_member', {
        p_project_id: projectId,
        p_user_id:    userId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-members', projectId] });
      toast.success('تمت الإزالة');
    },
  });
}
