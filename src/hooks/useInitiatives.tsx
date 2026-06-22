import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

// ── Types ─────────────────────────────────────────────────────────────────────

export type InitiativeStatus = 'active' | 'in_progress' | 'completed' | 'cancelled' | 'on_hold';
export type InitiativePriority = 'low' | 'medium' | 'high' | 'critical';

export interface Initiative {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  goal_id: string | null;
  project_id: string | null;
  area_id: string | null;
  status: InitiativeStatus;
  priority: InitiativePriority;
  progress: number;
  start_date: string | null;
  due_date: string | null;
  created_at: string;
  updated_at: string;
  // joined
  task_count?: number;
  completed_task_count?: number;
}

export interface CreateInitiativeInput {
  title: string;
  description?: string | null;
  goal_id?: string | null;
  project_id?: string | null;
  area_id?: string | null;
  status?: InitiativeStatus;
  priority?: InitiativePriority;
  start_date?: string | null;
  due_date?: string | null;
}

export interface UpdateInitiativeInput extends Partial<CreateInitiativeInput> {
  id: string;
  progress?: number;
}

// ── Queries ───────────────────────────────────────────────────────────────────

export function useInitiatives(filter?: {
  goal_id?: string;
  project_id?: string;
  area_id?: string;
}) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['initiatives', user?.id, filter],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let q = (supabase as any)
        .from('initiatives')
        .select('*')
        .order('created_at', { ascending: false });

      if (filter?.goal_id)    q = q.eq('goal_id',    filter.goal_id);
      if (filter?.project_id) q = q.eq('project_id', filter.project_id);
      if (filter?.area_id)    q = q.eq('area_id',    filter.area_id);

      const { data, error } = await q;
      if (error) throw error;
      return data as Initiative[];
    },
    enabled: !!user,
    staleTime: 30_000,
  });
}

export function useInitiativeTaskCounts(initiativeIds: string[]) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['initiative-task-counts', user?.id, initiativeIds.sort().join(',')],
    queryFn: async () => {
      if (!initiativeIds.length) return {} as Record<string, { total: number; done: number }>;

      const { data, error } = await supabase
        .from('tasks')
        .select('initiative_id, status')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .in('initiative_id' as any, initiativeIds);

      if (error) throw error;

      const counts: Record<string, { total: number; done: number }> = {};
      initiativeIds.forEach(id => { counts[id] = { total: 0, done: 0 }; });

      (data as Array<{ initiative_id: string; status: string }>).forEach(t => {
        if (!t.initiative_id) return;
        counts[t.initiative_id] ??= { total: 0, done: 0 };
        counts[t.initiative_id].total++;
        if (t.status === 'done' || t.status === 'completed') counts[t.initiative_id].done++;
      });

      return counts;
    },
    enabled: !!user && initiativeIds.length > 0,
    staleTime: 30_000,
  });
}

// ── Mutations ─────────────────────────────────────────────────────────────────

export function useCreateInitiative() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: CreateInitiativeInput) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('initiatives')
        .insert({ ...input, user_id: user!.id })
        .select()
        .single();
      if (error) throw error;
      return data as Initiative;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['initiatives'] });
    },
  });
}

export function useUpdateInitiative() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: UpdateInitiativeInput) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('initiatives')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as Initiative;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['initiatives'] });
    },
  });
}

export function useDeleteInitiative() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('initiatives')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['initiatives'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}
