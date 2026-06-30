import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface ArchivedItem {
  id: string;
  type: 'project' | 'area' | 'goal' | 'task' | 'resource' | 'customer';
  title: string;
  description?: string | null;
  archived_at: string;
  original_data: Record<string, unknown>;
}

export function useArchivedItems() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['archived-items', user?.id],
    queryFn: async () => {
      const items: ArchivedItem[] = [];

      // Fetch archived projects
      const { data: projects } = await supabase
        .from('projects')
        .select('*')
        .eq('para_category', 'archive')
        .order('updated_at', { ascending: false });

      if (projects) {
        items.push(...projects.map(p => ({
          id: p.id,
          type: 'project' as const,
          title: p.title,
          description: p.description,
          archived_at: p.archived_at || p.updated_at,
          original_data: p,
        })));
      }

      // Fetch archived areas
      const { data: areas } = await supabase
        .from('areas')
        .select('*')
        .eq('status', 'archived')
        .order('archived_at', { ascending: false });

      if (areas) {
        items.push(...areas.map(a => ({
          id: a.id,
          type: 'area' as const,
          title: a.name,
          description: a.description,
          archived_at: a.archived_at || a.updated_at,
          original_data: a,
        })));
      }

      // Fetch archived goals
      const { data: goals } = await supabase
        .from('goals')
        .select('*')
        .eq('is_active', false)
        .order('updated_at', { ascending: false });

      if (goals) {
        items.push(...goals.map(g => ({
          id: g.id,
          type: 'goal' as const,
          title: g.title,
          description: g.description,
          archived_at: g.archived_at || g.updated_at,
          original_data: g,
        })));
      }

      // Fetch archived tasks
      const { data: tasks } = await supabase
        .from('tasks')
        .select('*')
        .not('archived_at', 'is', null)
        .order('archived_at', { ascending: false });

      if (tasks) {
        items.push(...tasks.map(t => ({
          id: t.id,
          type: 'task' as const,
          title: t.title,
          description: t.description,
          archived_at: t.archived_at || t.updated_at,
          original_data: t,
        })));
      }

      // Fetch archived resources
      const { data: resources } = await supabase
        .from('resources')
        .select('*')
        .eq('status', 'archived')
        .order('archived_at', { ascending: false });

      if (resources) {
        items.push(...resources.map(r => ({
          id: r.id,
          type: 'resource' as const,
          title: r.title,
          description: r.description,
          archived_at: r.archived_at || r.updated_at,
          original_data: r,
        })));
      }

      // Fetch archived customers
      const { data: customers } = await supabase
        .from('customers')
        .select('*')
        .not('archived_at', 'is', null)
        .order('archived_at', { ascending: false });

      if (customers) {
        items.push(...customers.map(c => ({
          id: c.id,
          type: 'customer' as const,
          title: c.name,
          description: c.notes,
          archived_at: c.archived_at || c.updated_at,
          original_data: c,
        })));
      }

      // Sort all items by archived_at
      return items.sort((a, b) => 
        new Date(b.archived_at).getTime() - new Date(a.archived_at).getTime()
      );
    },
    enabled: !!user,
  });
}
