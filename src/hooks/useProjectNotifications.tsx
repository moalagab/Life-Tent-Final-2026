import { useMemo } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { useProjects } from '@/hooks/useProjects';
import { useTasks } from '@/hooks/useTasks';
import { differenceInDays } from 'date-fns';

export function useProjectNotifications() {
  const { currentLanguage } = useLanguage();
  const { data: projects } = useProjects();
  const { data: tasks } = useTasks();

  // Check for upcoming deadlines and project issues
  const notifications = useMemo(() => {
    const items: Array<{
      id: string;
      type: 'warning' | 'info' | 'success';
      title: string;
      message: string;
      projectId?: string;
    }> = [];

    const now = new Date();

    // Check projects due soon
    projects?.forEach(project => {
      if (project.due_date && project.status === 'active') {
        const dueDate = new Date(project.due_date);
        const daysUntilDue = differenceInDays(dueDate, now);

        if (daysUntilDue <= 0 && daysUntilDue > -7) {
          items.push({
            id: `overdue-${project.id}`,
            type: 'warning',
            title: currentLanguage === 'ar' ? 'مشروع متأخر!' : 'Project Overdue!',
            message: currentLanguage === 'ar' 
              ? `المشروع "${project.title}" تجاوز موعده`
              : `Project "${project.title}" is past due`,
            projectId: project.id,
          });
        } else if (daysUntilDue <= 7 && daysUntilDue > 0) {
          items.push({
            id: `due-soon-${project.id}`,
            type: 'info',
            title: currentLanguage === 'ar' ? 'موعد قريب' : 'Due Soon',
            message: currentLanguage === 'ar'
              ? `المشروع "${project.title}" يستحق خلال ${daysUntilDue} أيام`
              : `Project "${project.title}" is due in ${daysUntilDue} days`,
            projectId: project.id,
          });
        }
      }

      // Check for stalled projects (no progress in a while)
      if (project.status === 'active' && (project.progress || 0) < 50) {
        const lastUpdate = new Date(project.updated_at);
        const daysSinceUpdate = differenceInDays(now, lastUpdate);

        if (daysSinceUpdate > 14) {
          items.push({
            id: `stalled-${project.id}`,
            type: 'warning',
            title: currentLanguage === 'ar' ? 'مشروع متوقف' : 'Stalled Project',
            message: currentLanguage === 'ar'
              ? `المشروع "${project.title}" لم يتم تحديثه منذ ${daysSinceUpdate} يوم`
              : `Project "${project.title}" hasn't been updated in ${daysSinceUpdate} days`,
            projectId: project.id,
          });
        }
      }
    });

    // Check tasks with upcoming deadlines for active projects
    tasks?.forEach(task => {
      if (task.due_date && task.status !== 'done' && task.project_id) {
        const dueDate = new Date(task.due_date);
        const daysUntilDue = differenceInDays(dueDate, now);

        if (daysUntilDue <= 1 && daysUntilDue >= 0) {
          items.push({
            id: `task-due-${task.id}`,
            type: 'info',
            title: currentLanguage === 'ar' ? 'مهمة مستحقة قريباً' : 'Task Due Soon',
            message: currentLanguage === 'ar'
              ? `المهمة "${task.title}" مستحقة ${daysUntilDue === 0 ? 'اليوم' : 'غداً'}`
              : `Task "${task.title}" is due ${daysUntilDue === 0 ? 'today' : 'tomorrow'}`,
            projectId: task.project_id,
          });
        }
      }
    });

    // Success notifications for completed projects
    projects?.filter(p => p.status === 'completed').slice(0, 3).forEach(project => {
      const completedRecently = differenceInDays(now, new Date(project.updated_at)) <= 7;
      if (completedRecently) {
        items.push({
          id: `completed-${project.id}`,
          type: 'success',
          title: currentLanguage === 'ar' ? 'مشروع مكتمل!' : 'Project Completed!',
          message: currentLanguage === 'ar'
            ? `تهانينا! المشروع "${project.title}" اكتمل بنجاح`
            : `Congratulations! Project "${project.title}" has been completed`,
          projectId: project.id,
        });
      }
    });

    return items;
  }, [projects, tasks, currentLanguage]);

  return notifications;
}
