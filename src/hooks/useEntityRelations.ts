/**
 * useEntityRelations
 *
 * Data layer for the Entity Relation Graph system.
 * Relations are stored in the `entity_relations` table and can exist between
 * any two entity types (task, project, goal, area, habit, resource, note).
 *
 * Relation types (directed):
 *   contributes_to  — source feeds into / supports target
 *   blocks          — source prevents target from starting
 *   depends_on      — source cannot start until target is complete
 *   parent_of       — source is the hierarchical parent of target
 *   child_of        — source is a child / sub-item of target
 *
 * Weight: float 0 < w ≤ 1, default 1.0
 * source_label / target_label: stored for fast graph renders (denorm)
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

// ── Types ──────────────────────────────────────────────────────────────────────

export type EntityType =
  | 'task' | 'project' | 'goal' | 'area'
  | 'habit' | 'resource' | 'note';

export type RelationType =
  | 'contributes_to' | 'blocks' | 'depends_on'
  | 'parent_of' | 'child_of';

export interface EntityRelation {
  id: string;
  user_id: string;
  source_id: string;
  source_type: EntityType;
  source_label: string;
  target_id: string;
  target_type: EntityType;
  target_label: string;
  relation_type: RelationType;
  weight: number;
  notes: string | null;
  created_at: string;
}

export interface CreateRelationInput {
  source_id: string;
  source_type: EntityType;
  source_label: string;
  target_id: string;
  target_type: EntityType;
  target_label: string;
  relation_type: RelationType;
  weight?: number;
  notes?: string;
}

// ── Entity search result ───────────────────────────────────────────────────────

export interface EntitySearchResult {
  id: string;
  title: string;
  type: EntityType;
  subtitle?: string;
}

// ── Query key factory ──────────────────────────────────────────────────────────

const QK = {
  ego:  (entityId: string) => ['entity-relations', 'ego', entityId] as const,
  all:  (userId: string)   => ['entity-relations', 'all', userId]   as const,
};

// ── Fetch helpers ──────────────────────────────────────────────────────────────

async function fetchRelations(userId: string, entityId?: string): Promise<EntityRelation[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let q = (supabase as any)
    .from('entity_relations')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (entityId) {
    q = q.or(`source_id.eq.${entityId},target_id.eq.${entityId}`);
  }

  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as EntityRelation[];
}

// ── Hooks: read ───────────────────────────────────────────────────────────────

/** All relations touching a given entity (ego network) */
export function useEntityRelations(entityId: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: QK.ego(entityId),
    queryFn:  () => fetchRelations(user!.id, entityId),
    enabled:  !!user && !!entityId,
    staleTime: 30_000,
  });
}

/** Full user relation graph (all entity pairs) */
export function useAllRelations() {
  const { user } = useAuth();
  return useQuery({
    queryKey: QK.all(user?.id ?? ''),
    queryFn:  () => fetchRelations(user!.id),
    enabled:  !!user,
    staleTime: 30_000,
  });
}

// ── Hooks: mutations ──────────────────────────────────────────────────────────

export function useCreateRelation() {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateRelationInput) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('entity_relations')
        .insert({ ...input, user_id: user!.id, weight: input.weight ?? 1.0 })
        .select()
        .single();
      if (error) throw error;
      return data as EntityRelation;
    },
    onSuccess: (rel) => {
      qc.invalidateQueries({ queryKey: QK.ego(rel.source_id) });
      qc.invalidateQueries({ queryKey: QK.ego(rel.target_id) });
      qc.invalidateQueries({ queryKey: QK.all(user!.id) });
    },
  });
}

export function useDeleteRelation() {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, sourceId, targetId }: { id: string; sourceId: string; targetId: string }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('entity_relations')
        .delete()
        .eq('id', id)
        .eq('user_id', user!.id);
      if (error) throw error;
      return { sourceId, targetId };
    },
    onSuccess: ({ sourceId, targetId }) => {
      qc.invalidateQueries({ queryKey: QK.ego(sourceId) });
      qc.invalidateQueries({ queryKey: QK.ego(targetId) });
      qc.invalidateQueries({ queryKey: QK.all(user!.id) });
    },
  });
}

export function useUpdateRelationWeight() {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, weight, sourceId, targetId }: {
      id: string; weight: number; sourceId: string; targetId: string;
    }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('entity_relations')
        .update({ weight })
        .eq('id', id)
        .eq('user_id', user!.id);
      if (error) throw error;
      return { sourceId, targetId };
    },
    onSuccess: ({ sourceId, targetId }) => {
      qc.invalidateQueries({ queryKey: QK.ego(sourceId) });
      qc.invalidateQueries({ queryKey: QK.ego(targetId) });
      qc.invalidateQueries({ queryKey: QK.all(user!.id) });
    },
  });
}

// ── Entity search (for RelationEditor autocomplete) ───────────────────────────

export function useEntitySearch(query: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['entity-search', query],
    queryFn: async (): Promise<EntitySearchResult[]> => {
      if (!query.trim() || query.length < 2) return [];
      const q = `%${query}%`;
      const uid = user!.id;

      const [tasks, projects, goals, areas, habits, resources] = await Promise.all([
        supabase.from('tasks').select('id,title,status').ilike('title', q).eq('user_id', uid).limit(5),
        supabase.from('projects').select('id,title,status').ilike('title', q).eq('user_id', uid).limit(5),
        supabase.from('goals').select('id,title,status').ilike('title', q).eq('user_id', uid).limit(5),
        supabase.from('areas').select('id,name').ilike('name', q).eq('user_id', uid).limit(5),
        supabase.from('habits').select('id,name,icon').ilike('name', q).eq('user_id', uid).limit(5),
        supabase.from('resources').select('id,title,type').ilike('title', q).eq('user_id', uid).limit(5),
      ]);

      const results: EntitySearchResult[] = [];

      (tasks.data ?? []).forEach(t =>
        results.push({ id: t.id, title: t.title, type: 'task', subtitle: t.status ?? undefined }));
      (projects.data ?? []).forEach(p =>
        results.push({ id: p.id, title: p.title, type: 'project', subtitle: p.status ?? undefined }));
      (goals.data ?? []).forEach(g =>
        results.push({ id: g.id, title: g.title, type: 'goal', subtitle: g.status ?? undefined }));
      (areas.data ?? []).forEach(a =>
        results.push({ id: a.id, title: a.name, type: 'area' }));
      (habits.data ?? []).forEach(h =>
        results.push({ id: h.id, title: h.name, type: 'habit' }));
      (resources.data ?? []).forEach(r =>
        results.push({ id: r.id, title: r.title, type: 'resource', subtitle: r.type ?? undefined }));

      return results;
    },
    enabled: !!user && query.length >= 2,
    staleTime: 10_000,
  });
}

// ── Derived helpers ───────────────────────────────────────────────────────────

/** Get relations split into outgoing / incoming from a given entity */
export function splitRelations(entityId: string, relations: EntityRelation[]) {
  return {
    outgoing: relations.filter(r => r.source_id === entityId),
    incoming: relations.filter(r => r.target_id === entityId),
  };
}

/** Config per relation type for UI */
export const RELATION_CFG: Record<RelationType, {
  labelAr: string; labelEn: string;
  color: string;
  dash?: string;
  animated?: boolean;
}> = {
  contributes_to: { labelAr: 'يساهم في',   labelEn: 'Contributes to', color: '#22c55e', animated: true  },
  blocks:         { labelAr: 'يحجب',       labelEn: 'Blocks',         color: '#ef4444', dash: '6,4'     },
  depends_on:     { labelAr: 'يعتمد على',  labelEn: 'Depends on',     color: '#f59e0b', dash: '3,3'     },
  parent_of:      { labelAr: 'أصل لـ',     labelEn: 'Parent of',      color: '#6366f1'                  },
  child_of:       { labelAr: 'فرع من',     labelEn: 'Child of',       color: '#8b5cf6'                  },
};

/** Config per entity type for UI */
export const ENTITY_CFG: Record<EntityType, {
  labelAr: string; labelEn: string;
  color: string;
  routePrefix: string;
}> = {
  task:     { labelAr: 'مهمة',     labelEn: 'Task',     color: '#6366f1', routePrefix: '/tasks'    },
  project:  { labelAr: 'مشروع',   labelEn: 'Project',  color: '#8b5cf6', routePrefix: '/projects' },
  goal:     { labelAr: 'هدف',     labelEn: 'Goal',     color: '#f59e0b', routePrefix: '/goals'    },
  area:     { labelAr: 'مجال',    labelEn: 'Area',     color: '#10b981', routePrefix: '/areas'    },
  habit:    { labelAr: 'عادة',    labelEn: 'Habit',    color: '#ec4899', routePrefix: '/habits'   },
  resource: { labelAr: 'مورد',    labelEn: 'Resource', color: '#0ea5e9', routePrefix: '/resources' },
  note:     { labelAr: 'ملاحظة', labelEn: 'Note',     color: '#64748b', routePrefix: '/notes'    },
};
