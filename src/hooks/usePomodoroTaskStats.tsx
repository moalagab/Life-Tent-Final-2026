import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useMemo } from 'react';

export interface TaskPomodoroStats {
  taskId: string;
  taskTitle: string;
  projectTitle: string | null;
  totalSessions: number;
  totalMinutes: number;
  lastSession: string | null;
}

export function usePomodoroTaskStats() {
  const { user } = useAuth();

  const { data: sessions, isLoading: sessionsLoading } = useQuery({
    queryKey: ['pomodoro-sessions-with-tasks', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pomodoro_sessions')
        .select('*, tasks(id, title, project_id, projects(title))')
        .eq('session_type', 'work')
        .not('task_id', 'is', null)
        .order('completed_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const taskStats = useMemo(() => {
    if (!sessions) return [];

    const statsMap = new Map<string, TaskPomodoroStats>();

    sessions.forEach(session => {
      if (!session.task_id || !session.tasks) return;

      const existing = statsMap.get(session.task_id);
      if (existing) {
        existing.totalSessions++;
        existing.totalMinutes += session.duration_minutes;
        if (!existing.lastSession || session.completed_at > existing.lastSession) {
          existing.lastSession = session.completed_at;
        }
      } else {
        statsMap.set(session.task_id, {
          taskId: session.task_id,
          taskTitle: (session.tasks as any).title,
          projectTitle: (session.tasks as any).projects?.title || null,
          totalSessions: 1,
          totalMinutes: session.duration_minutes,
          lastSession: session.completed_at,
        });
      }
    });

    return Array.from(statsMap.values()).sort((a, b) => b.totalMinutes - a.totalMinutes);
  }, [sessions]);

  return {
    data: taskStats,
    isLoading: sessionsLoading,
  };
}

export function useTaskPomodoroTime(taskId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['task-pomodoro-time', user?.id, taskId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pomodoro_sessions')
        .select('duration_minutes, session_type, completed_at')
        .eq('task_id', taskId)
        .eq('session_type', 'work')
        .order('completed_at', { ascending: false });

      if (error) throw error;
      
      const totalMinutes = data.reduce((sum, s) => sum + s.duration_minutes, 0);
      return {
        sessions: data,
        totalSessions: data.length,
        totalMinutes,
        totalHours: Math.floor(totalMinutes / 60),
        remainingMinutes: totalMinutes % 60,
      };
    },
    enabled: !!user && !!taskId,
  });
}
