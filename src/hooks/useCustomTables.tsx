import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

// ── Types ─────────────────────────────────────────────────────────────────────

export type ColumnType =
  | 'text' | 'number' | 'date' | 'select'
  | 'multiselect' | 'checkbox' | 'url' | 'email';

export interface TableColumn {
  id: string;
  name: string;
  type: ColumnType;
  options?: string[];
  width?: number;
  required?: boolean;
}

export type EntityType = 'area' | 'project' | 'goal' | 'initiative' | 'global';

export interface CustomTable {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  icon: string;
  color: string;
  entity_type: EntityType | null;
  entity_id: string | null;
  columns: TableColumn[];
  status: 'active' | 'archived';
  created_at: string;
  updated_at: string;
}

export interface CustomTableRow {
  id: string;
  user_id: string;
  table_id: string;
  data: Record<string, unknown>;
  position: number;
  created_at: string;
  updated_at: string;
}

// ── Queries ───────────────────────────────────────────────────────────────────

export function useCustomTables(filter?: {
  entity_type?: EntityType;
  entity_id?: string;
}) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['custom-tables', user?.id, filter],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let q = (supabase as any)
        .from('custom_tables')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: true });

      if (filter?.entity_type) q = q.eq('entity_type', filter.entity_type);
      if (filter?.entity_id)   q = q.eq('entity_id',   filter.entity_id);

      const { data, error } = await q;
      if (error) throw error;
      return (data as CustomTable[]) ?? [];
    },
    enabled: !!user,
    staleTime: 30_000,
  });
}

export function useCustomTableRows(tableId: string | null) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['custom-table-rows', tableId],
    queryFn: async () => {
      if (!tableId) return [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('custom_table_rows')
        .select('*')
        .eq('table_id', tableId)
        .order('position', { ascending: true });
      if (error) throw error;
      return (data as CustomTableRow[]) ?? [];
    },
    enabled: !!user && !!tableId,
    staleTime: 15_000,
  });
}

// ── Mutations — Tables ────────────────────────────────────────────────────────

export function useCreateCustomTable() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: {
      title: string;
      description?: string;
      icon?: string;
      color?: string;
      entity_type?: EntityType;
      entity_id?: string;
      columns?: TableColumn[];
    }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('custom_tables')
        .insert({
          ...input,
          user_id: user!.id,
          columns: input.columns ?? [],
        })
        .select()
        .single();
      if (error) throw error;
      return data as CustomTable;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['custom-tables'] }),
  });
}

export function useUpdateCustomTable() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: Partial<Omit<CustomTable, 'id' | 'user_id' | 'created_at' | 'updated_at'>> & { id: string }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('custom_tables')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as CustomTable;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['custom-tables'] }),
  });
}

export function useDeleteCustomTable() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('custom_tables')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-tables'] });
      queryClient.invalidateQueries({ queryKey: ['custom-table-rows'] });
    },
  });
}

// ── Mutations — Rows ──────────────────────────────────────────────────────────

export function useCreateTableRow() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: {
      table_id: string;
      data: Record<string, unknown>;
      position?: number;
    }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('custom_table_rows')
        .insert({ ...input, user_id: user!.id })
        .select()
        .single();
      if (error) throw error;
      return data as CustomTableRow;
    },
    onSuccess: (_, vars) =>
      queryClient.invalidateQueries({ queryKey: ['custom-table-rows', vars.table_id] }),
  });
}

export function useUpdateTableRow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      table_id,
      ...updates
    }: { id: string; table_id: string } & Partial<Pick<CustomTableRow, 'data' | 'position'>>) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('custom_table_rows')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as CustomTableRow;
    },
    onSuccess: (_, vars) =>
      queryClient.invalidateQueries({ queryKey: ['custom-table-rows', vars.table_id] }),
  });
}

export function useDeleteTableRow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, table_id }: { id: string; table_id: string }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('custom_table_rows')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, vars) =>
      queryClient.invalidateQueries({ queryKey: ['custom-table-rows', vars.table_id] }),
  });
}
