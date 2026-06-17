import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { useAuth } from './useAuth';
import { vibrate }          from '@/lib/vibrate';
import { runSuccessLoop }   from '@/lib/successLoop';

export type Task = Tables<'tasks'>;
export type TaskInsert = TablesInsert<'tasks'>;
export type TaskUpdate = TablesUpdate<'tasks'>;

export function useTasks() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['tasks', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*, projects(title)')
        .order('position', { ascending: true });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useFocusTasks() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['focus-tasks', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('id, title, status, priority, due_date, is_focus, project_id, completed_at')
        .eq('is_focus', true)
        .in('status', ['backlog', 'todo', 'in_progress', 'review'])
        .order('priority', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useTodayTasks() {
  const { user } = useAuth();
  const today = new Date().toISOString().split('T')[0];

  return useQuery({
    queryKey: ['today-tasks', user?.id, today],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('id, title, status, priority, due_date, due_time, scheduled_at, is_focus, project_id')
        .eq('due_date', today)
        .in('status', ['backlog', 'todo', 'in_progress', 'review'])
        .order('due_time', { ascending: true, nullsFirst: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (task: Omit<TaskInsert, 'user_id'>) => {
      const { data, error } = await supabase
        .from('tasks')
        .insert({ ...task, user_id: user!.id })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['focus-tasks'] });
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: TaskUpdate & { id: string }) => {
      // Auto-archive and mark completed when status transitions to 'done'
      const finalUpdates =
        updates.status === 'done'
          ? {
              ...updates,
              completed_at: updates.completed_at ?? new Date().toISOString(),
              archived_at: updates.archived_at ?? new Date().toISOString(),
            }
          : updates;

      const { data, error } = await supabase
        .from('tasks')
        .update(finalUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['focus-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['archived-items'] });
      if (data?.status === 'done') {
        vibrate.success();
        // Fire success loop — cascade goal/project/cache/memory updates
        runSuccessLoop(queryClient, {
          id:         data.id,
          title:      data.title,
          goal_id:    (data as never as { goal_id?: string | null }).goal_id,
          project_id: data.project_id,
        }).catch(() => {});
      }
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['focus-tasks'] });
    },
  });
}