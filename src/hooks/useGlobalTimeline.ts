import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { subDays } from 'date-fns';

export type TimelineEntryType = 'task' | 'project' | 'goal' | 'habit_log' | 'resource' | 'media';
export type TimelineAction = 'created' | 'completed' | 'archived' | 'logged';

export interface TimelineEntry {
  id: string;
  entityId: string;
  type: TimelineEntryType;
  action: TimelineAction;
  title: string;
  date: string;
  route?: string;
  color?: string;
}

export function useGlobalTimeline(days = 30) {
  const { user } = useAuth();
  const since = subDays(new Date(), days).toISOString();

  return useQuery({
    queryKey: ['global-timeline', user?.id, days],
    queryFn: async () => {
      const [
        { data: tasks },
        { data: projects },
        { data: goals },
        { data: resources },
        { data: habitLogs },
        { data: habits },
        { data: media },
      ] = await Promise.all([
        supabase.from('tasks')
          .select('id, title, status, created_at, completed_at')
          .gte('updated_at', since)
          .order('updated_at', { ascending: false })
          .limit(60),
        supabase.from('projects')
          .select('id, title, status, created_at, color')
          .gte('created_at', since)
          .order('created_at', { ascending: false })
          .limit(20),
        supabase.from('goals')
          .select('id, title, created_at, perspective')
          .gte('created_at', since)
          .order('created_at', { ascending: false })
          .limit(20),
        supabase.from('resources')
          .select('id, title, type, created_at, status')
          .gte('created_at', since)
          .order('created_at', { ascending: false })
          .limit(30),
        supabase.from('habit_logs')
          .select('id, habit_id, completed_at')
          .gte('completed_at', since)
          .order('completed_at', { ascending: false })
          .limit(80),
        supabase.from('habits')
          .select('id, name, icon')
          .eq('is_active', true),
        supabase.from('media_items')
          .select('id, title, type, status, created_at')
          .gte('created_at', since)
          .order('created_at', { ascending: false })
          .limit(20),
      ]);

      const entries: TimelineEntry[] = [];
      const seen = new Set<string>();

      const add = (e: TimelineEntry) => {
        if (seen.has(e.id)) return;
        seen.add(e.id);
        entries.push(e);
      };

      tasks?.forEach(t => {
        if (t.completed_at && new Date(t.completed_at) >= new Date(since)) {
          add({ id: `task-done-${t.id}`, entityId: t.id, type: 'task', action: 'completed', title: t.title, date: t.completed_at, route: '/tasks' });
        } else {
          add({ id: `task-${t.id}`, entityId: t.id, type: 'task', action: 'created', title: t.title, date: t.created_at, route: '/tasks' });
        }
      });

      projects?.forEach(p => add({
        id: `project-${p.id}`, entityId: p.id, type: 'project', action: 'created',
        title: p.title, date: p.created_at, route: `/projects/${p.id}`, color: p.color ?? undefined,
      }));

      goals?.forEach(g => add({
        id: `goal-${g.id}`, entityId: g.id, type: 'goal', action: 'created',
        title: g.title, date: g.created_at, route: `/goals/${g.id}`,
      }));

      resources?.forEach(r => add({
        id: `resource-${r.id}`, entityId: r.id, type: 'resource',
        action: r.status === 'archived' ? 'archived' : 'created',
        title: r.title, date: r.created_at, route: `/resources/${r.id}`,
      }));

      const habitMap = new Map(habits?.map(h => [h.id, h]) ?? []);
      habitLogs?.forEach(log => {
        const habit = habitMap.get(log.habit_id);
        add({
          id: `habit-log-${log.id}`, entityId: log.habit_id, type: 'habit_log', action: 'logged',
          title: habit ? `${habit.icon ?? '✨'} ${habit.name}` : '✨ عادة',
          date: log.completed_at ?? new Date().toISOString(),
          route: `/habits/${log.habit_id}`,
        });
      });

      media?.forEach(m => add({
        id: `media-${m.id}`, entityId: m.id, type: 'media',
        action: m.status === 'completed' ? 'completed' : 'created',
        title: m.title, date: m.created_at, route: `/studio/${m.id}`,
      }));

      return entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    },
    enabled: !!user,
    staleTime: 2 * 60 * 1000,
  });
}
