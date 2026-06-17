import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useMemo } from 'react';

export type CalendarEventType = 'task' | 'event' | 'milestone' | 'debt' | 'subscription';

export interface UnifiedCalendarEvent {
  id: string;
  type: CalendarEventType;
  title: string;
  description?: string | null;
  date: string;
  endDate?: string | null;
  color: string;
  sourceId: string;
  sourceType: string;
  metadata?: Record<string, unknown>;
}

export function useUnifiedCalendarEvents(startDate: Date, endDate: Date) {
  const { user } = useAuth();
  const startStr = startDate.toISOString().split('T')[0];
  const endStr = endDate.toISOString().split('T')[0];

  // Tasks with scheduled_at (precise time)
  const { data: scheduledTasks } = useQuery({
    queryKey: ['calendar-tasks', user?.id, startStr, endStr],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('id, title, description, scheduled_at, due_date, due_time, status, priority, project_id, projects(title)')
        .not('scheduled_at', 'is', null)
        .gte('scheduled_at', startStr)
        .lte('scheduled_at', endStr + 'T23:59:59')
        .neq('status', 'done');
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Tasks with due_date (no scheduled_at)
  const { data: dueTasks } = useQuery({
    queryKey: ['calendar-due-tasks', user?.id, startStr, endStr],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('id, title, description, scheduled_at, due_date, due_time, status, priority, project_id, projects(title)')
        .is('scheduled_at', null)
        .not('due_date', 'is', null)
        .gte('due_date', startStr)
        .lte('due_date', endStr)
        .neq('status', 'done');
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Calendar events
  const { data: events } = useQuery({
    queryKey: ['calendar-events', user?.id, startStr, endStr],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .gte('start_time', startStr)
        .lte('start_time', endStr + 'T23:59:59');
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Project milestones
  const { data: milestones } = useQuery({
    queryKey: ['calendar-milestones', user?.id, startStr, endStr],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_milestones')
        .select('*, projects(title)')
        .gte('due_date', startStr)
        .lte('due_date', endStr);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Debts with payment dates
  const { data: debts } = useQuery({
    queryKey: ['calendar-debts', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('debts')
        .select('id, name, monthly_payment, monthly_payment_date, status')
        .eq('status', 'active');
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Subscriptions
  const { data: subscriptions } = useQuery({
    queryKey: ['calendar-subscriptions', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('id, name, amount, billing_cycle, next_billing_date, status')
        .eq('status', 'active');
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const unifiedEvents = useMemo(() => {
    const allEvents: UnifiedCalendarEvent[] = [];

    // Scheduled tasks (have specific time)
    scheduledTasks?.forEach((task) => {
      const taskColor = task.priority === 'high' ? '#ef4444' : task.priority === 'medium' ? '#f97316' : '#22c55e';
      allEvents.push({
        id: `task-${task.id}`,
        type: 'task',
        title: task.title,
        description: task.description,
        date: task.scheduled_at!,
        color: taskColor,
        sourceId: task.id,
        sourceType: 'tasks',
        metadata: { project: (task.projects as { title?: string } | null)?.title, status: task.status, priority: task.priority },
      });
    });

    // Due tasks (date-only deadline)
    dueTasks?.forEach((task) => {
      // Build full datetime: due_date + due_time (or midnight)
      const dateStr = task.due_time
        ? `${task.due_date}T${task.due_time}`
        : task.due_date!;
      const taskColor = task.priority === 'high' ? '#ef4444' : task.priority === 'urgent' ? '#dc2626' : '#f59e0b';
      allEvents.push({
        id: `due-${task.id}`,
        type: 'task',
        title: task.title,
        description: task.description,
        date: dateStr,
        color: taskColor,
        sourceId: task.id,
        sourceType: 'tasks',
        metadata: { project: (task.projects as { title?: string } | null)?.title, status: task.status, isDue: true, due_time: task.due_time },
      });
    });

    // Calendar events
    events?.forEach((event) => {
      allEvents.push({
        id: `event-${event.id}`,
        type: 'event',
        title: event.title,
        description: event.description,
        date: event.start_time,
        endDate: event.end_time,
        color: event.color || '#6366f1',
        sourceId: event.id,
        sourceType: 'events',
        metadata: { location: event.location, allDay: event.all_day },
      });
    });

    // Milestones
    milestones?.forEach((milestone) => {
      allEvents.push({
        id: `milestone-${milestone.id}`,
        type: 'milestone',
        title: `🎯 ${milestone.title}`,
        description: milestone.description,
        date: milestone.due_date,
        color: milestone.color || '#8b5cf6',
        sourceId: milestone.id,
        sourceType: 'project_milestones',
        metadata: { project: (milestone.projects as { title?: string } | null)?.title, status: milestone.status },
      });
    });

    // Debt payments
    debts?.forEach((debt) => {
      if (debt.monthly_payment_date) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        for (let d = new Date(start); d <= end; d.setMonth(d.getMonth() + 1)) {
          const paymentDate = new Date(d.getFullYear(), d.getMonth(), debt.monthly_payment_date);
          if (paymentDate >= start && paymentDate <= end) {
            allEvents.push({
              id: `debt-${debt.id}-${paymentDate.toISOString()}`,
              type: 'debt',
              title: `💳 ${debt.name}`,
              description: `دفعة شهرية: ${debt.monthly_payment}`,
              date: paymentDate.toISOString(),
              color: '#ef4444',
              sourceId: debt.id,
              sourceType: 'debts',
              metadata: { amount: debt.monthly_payment },
            });
          }
        }
      }
    });

    // Subscription renewals
    subscriptions?.forEach((sub) => {
      if (sub.next_billing_date) {
        const billingDate = new Date(sub.next_billing_date);
        if (billingDate >= startDate && billingDate <= endDate) {
          allEvents.push({
            id: `sub-${sub.id}`,
            type: 'subscription',
            title: `🔄 ${sub.name}`,
            description: `تجديد الاشتراك: ${sub.amount}`,
            date: sub.next_billing_date,
            color: '#06b6d4',
            sourceId: sub.id,
            sourceType: 'subscriptions',
            metadata: { amount: sub.amount, cycle: sub.billing_cycle },
          });
        }
      }
    });

    return allEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [scheduledTasks, dueTasks, events, milestones, debts, subscriptions, startDate, endDate]);

  return { events: unifiedEvents };
}
