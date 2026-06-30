/**
 * useGlobalSearch — searches tasks, projects, goals, notes, and transactions
 * in a single query burst. Used by the Cmd+K command palette.
 *
 * Each table is queried in parallel via Promise.allSettled so a missing table
 * or permission error on one doesn't block the others.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type SearchResultType = 'task' | 'project' | 'goal' | 'note' | 'transaction';

export interface SearchResult {
  id:        string;
  type:      SearchResultType;
  label:     string;
  sublabel?: string;
  path:      string;
}

export function useGlobalSearch(query: string) {
  const { user } = useAuth();
  const trimmed = query.trim();

  return useQuery({
    queryKey: ['global-search', trimmed],
    queryFn: async (): Promise<SearchResult[]> => {
      const q = `%${trimmed}%`;

      const [tasks, projects, goals, notes, transactions] = await Promise.allSettled([
        supabase
          .from('tasks')
          .select('id, title, status')
          .ilike('title', q)
          .limit(4),

        supabase
          .from('projects')
          .select('id, title, status')
          .ilike('title', q)
          .limit(4),

        supabase
          .from('goals')
          .select('id, title')
          .ilike('title', q)
          .limit(4),

        supabase
          .from('notes')
          .select('id, title, folder')
          .ilike('title', q)
          .limit(4),

        supabase
          .from('transactions')
          .select('id, description, category, amount')
          .not('description', 'is', null)
          .ilike('description', q)
          .limit(4),
      ]);

      const results: SearchResult[] = [];

      if (tasks.status === 'fulfilled' && tasks.value.data) {
        tasks.value.data.forEach(t =>
          results.push({ id: t.id, type: 'task', label: t.title, sublabel: t.status ?? undefined, path: '/tasks' }),
        );
      }
      if (projects.status === 'fulfilled' && projects.value.data) {
        projects.value.data.forEach(p =>
          results.push({ id: p.id, type: 'project', label: p.title, sublabel: p.status ?? undefined, path: '/projects' }),
        );
      }
      if (goals.status === 'fulfilled' && goals.value.data) {
        goals.value.data.forEach(g =>
          results.push({ id: g.id, type: 'goal', label: g.title, path: '/goals' }),
        );
      }
      if (notes.status === 'fulfilled' && notes.value.data) {
        notes.value.data.forEach(n =>
          results.push({ id: n.id, type: 'note', label: n.title, sublabel: n.folder ?? undefined, path: '/knowledge' }),
        );
      }
      if (transactions.status === 'fulfilled' && transactions.value.data) {
        transactions.value.data.forEach(tx => {
          if (tx.description) {
            results.push({
              id:       tx.id,
              type:     'transaction',
              label:    tx.description,
              sublabel: tx.category ?? undefined,
              path:     '/finance',
            });
          }
        });
      }

      return results;
    },
    enabled:   !!user && trimmed.length >= 2,
    staleTime: 1000 * 30,
    placeholderData: (prev) => prev, // keep previous while fetching
  });
}
