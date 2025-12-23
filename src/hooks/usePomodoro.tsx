import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface PomodoroSession {
  id: string;
  user_id: string;
  task_id: string | null;
  session_type: 'work' | 'shortBreak' | 'longBreak';
  duration_minutes: number;
  completed_at: string;
  notes: string | null;
  created_at: string;
}

export function usePomodoroSessions() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['pomodoro-sessions', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('pomodoro_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false });
      
      if (error) throw error;
      return data as PomodoroSession[];
    },
    enabled: !!user,
  });
}

export function useTodaySessions() {
  const { user } = useAuth();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return useQuery({
    queryKey: ['pomodoro-sessions-today', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('pomodoro_sessions')
        .select('*')
        .eq('user_id', user.id)
        .gte('completed_at', today.toISOString())
        .order('completed_at', { ascending: false });
      
      if (error) throw error;
      return data as PomodoroSession[];
    },
    enabled: !!user,
  });
}

export function useWeeklySessions() {
  const { user } = useAuth();
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  weekAgo.setHours(0, 0, 0, 0);

  return useQuery({
    queryKey: ['pomodoro-sessions-weekly', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('pomodoro_sessions')
        .select('*')
        .eq('user_id', user.id)
        .gte('completed_at', weekAgo.toISOString())
        .order('completed_at', { ascending: true });
      
      if (error) throw error;
      return data as PomodoroSession[];
    },
    enabled: !!user,
  });
}

export function useCreatePomodoroSession() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (session: Omit<PomodoroSession, 'id' | 'user_id' | 'created_at'>) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('pomodoro_sessions')
        .insert({
          ...session,
          user_id: user.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pomodoro-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['pomodoro-sessions-today'] });
      queryClient.invalidateQueries({ queryKey: ['pomodoro-sessions-weekly'] });
    },
  });
}

export function usePomodoroStats() {
  const { data: sessions } = usePomodoroSessions();
  const { data: todaySessions } = useTodaySessions();
  const { data: weeklySessions } = useWeeklySessions();

  const workSessions = sessions?.filter(s => s.session_type === 'work') || [];
  const todayWorkSessions = todaySessions?.filter(s => s.session_type === 'work') || [];
  const weeklyWorkSessions = weeklySessions?.filter(s => s.session_type === 'work') || [];

  const totalMinutes = workSessions.reduce((acc, s) => acc + s.duration_minutes, 0);
  const todayMinutes = todayWorkSessions.reduce((acc, s) => acc + s.duration_minutes, 0);
  const weeklyMinutes = weeklyWorkSessions.reduce((acc, s) => acc + s.duration_minutes, 0);

  // Calculate daily breakdown for the week
  const dailyBreakdown = getDailyBreakdown(weeklySessions || []);

  return {
    totalSessions: workSessions.length,
    todaySessions: todayWorkSessions.length,
    weeklySessions: weeklyWorkSessions.length,
    totalMinutes,
    todayMinutes,
    weeklyMinutes,
    dailyBreakdown,
  };
}

function getDailyBreakdown(sessions: PomodoroSession[]) {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const today = new Date();
  const result = [];

  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);
    
    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + 1);

    const daySessions = sessions.filter(s => {
      const sessionDate = new Date(s.completed_at);
      return sessionDate >= date && sessionDate < nextDate && s.session_type === 'work';
    });

    const minutes = daySessions.reduce((acc, s) => acc + s.duration_minutes, 0);
    const sessionsCount = daySessions.length;

    result.push({
      day: days[date.getDay()],
      date: date.toLocaleDateString(),
      minutes,
      sessions: sessionsCount,
      hours: Math.round(minutes / 60 * 10) / 10,
    });
  }

  return result;
}
