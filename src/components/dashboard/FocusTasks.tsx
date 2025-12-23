import { useState } from 'react';
import { Check, ArrowUpRight, Flag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/hooks/useLanguage';

interface Task {
  id: string;
  title: string;
  titleAr: string;
  priority: 'high' | 'medium' | 'low';
  project?: string;
  projectAr?: string;
  completed: boolean;
}

const priorityColors = {
  high: 'text-destructive',
  medium: 'text-primary',
  low: 'text-muted-foreground',
};

const mockTasks: Task[] = [
  { id: '1', title: 'Finalize Q4 budget proposal', titleAr: 'إنهاء اقتراح ميزانية الربع الرابع', priority: 'high', project: 'Finance', projectAr: 'المالية', completed: false },
  { id: '2', title: 'Review team performance reports', titleAr: 'مراجعة تقارير أداء الفريق', priority: 'medium', project: 'HR', projectAr: 'الموارد البشرية', completed: false },
  { id: '3', title: 'Prepare presentation for board meeting', titleAr: 'إعداد العرض التقديمي لاجتماع مجلس الإدارة', priority: 'high', project: 'Strategy', projectAr: 'الاستراتيجية', completed: false },
];

export function FocusTasks() {
  const [tasks, setTasks] = useState(mockTasks);
  const { t, currentLanguage } = useLanguage();

  const toggleTask = (id: string) => {
    setTasks(prev => prev.map(task => 
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
  };

  const completedCount = tasks.filter(t => t.completed).length;

  return (
    <div className="glass-card p-5 h-full">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-lg font-semibold text-foreground">{t('dashboard.focusTasks')}</h3>
          <p className="text-sm text-muted-foreground">{completedCount}/{tasks.length} {currentLanguage === 'ar' ? 'مكتمل' : 'completed'}</p>
        </div>
        <button className="text-primary text-sm font-medium hover:underline flex items-center gap-1">
          {t('common.viewAll')} <ArrowUpRight className="w-3 h-3" />
        </button>
      </div>

      <div className="space-y-3">
        {tasks.map((task, index) => (
          <div
            key={task.id}
            className={cn(
              'flex items-start gap-3 p-3 rounded-xl transition-all duration-200 cursor-pointer',
              'hover:bg-accent/50 group',
              task.completed && 'opacity-60'
            )}
            style={{ animationDelay: `${index * 100}ms` }}
            onClick={() => toggleTask(task.id)}
          >
            <button
              className={cn(
                'w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 mt-0.5',
                task.completed 
                  ? 'bg-primary border-primary' 
                  : 'border-muted-foreground group-hover:border-primary'
              )}
            >
              {task.completed && <Check className="w-3 h-3 text-primary-foreground" />}
            </button>
            
            <div className="flex-1 min-w-0">
              <p className={cn(
                'text-sm font-medium text-foreground transition-all',
                task.completed && 'line-through text-muted-foreground'
              )}>
                {currentLanguage === 'ar' ? task.titleAr : task.title}
              </p>
              {task.project && (
                <span className="text-xs text-muted-foreground">
                  {currentLanguage === 'ar' ? task.projectAr : task.project}
                </span>
              )}
            </div>

            <Flag className={cn('w-4 h-4 flex-shrink-0', priorityColors[task.priority])} />
          </div>
        ))}
      </div>

      {/* Progress Ring */}
      <div className="flex justify-center mt-6">
        <div className="relative w-20 h-20">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
            <circle
              cx="18"
              cy="18"
              r="16"
              fill="none"
              className="stroke-muted"
              strokeWidth="3"
            />
            <circle
              cx="18"
              cy="18"
              r="16"
              fill="none"
              className="stroke-primary"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={`${(completedCount / tasks.length) * 100}, 100`}
              style={{ transition: 'stroke-dasharray 0.5s ease' }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-bold gold-text">
              {Math.round((completedCount / tasks.length) * 100)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
