import { Flame, Check, Loader2, Trash2, Edit3, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/hooks/useLanguage';
import { useHabits, useHabitLogs, useLogHabit, useDeleteHabit, useUpdateHabit } from '@/hooks/useHabits';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { format, subDays } from 'date-fns';
import { DashboardWidgetShell, DashboardEmptyState } from './DashboardWidgetShell';

export function HabitStreaks() {
  const { t, currentLanguage } = useLanguage();
  const { data: habits, isLoading } = useHabits();
  const { data: logs } = useHabitLogs();
  const logHabit = useLogHabit();
  const deleteHabit = useDeleteHabit();
  const updateHabit = useUpdateHabit();

  const [editingHabit, setEditingHabit] = useState<{ id: string; name: string } | null>(null);

  const today = format(new Date(), 'yyyy-MM-dd');

  const getHabitStreak = (habitId: string) => {
    if (!logs) return 0;
    const habitLogs = logs
      .filter(log => log.habit_id === habitId)
      .map(log => log.completed_at)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    if (habitLogs.length === 0) return 0;

    let streak = 0;
    const currentDate = new Date();

    for (let i = 0; i < 365; i++) {
      const dateStr = format(subDays(currentDate, i), 'yyyy-MM-dd');
      if (habitLogs.includes(dateStr)) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }

    return streak;
  };

  const isCompletedToday = (habitId: string) => {
    if (!logs) return false;
    return logs.some(log => log.habit_id === habitId && log.completed_at === today);
  };

  const toggleHabit = async (habitId: string) => {
    if (isCompletedToday(habitId)) return;
    try {
      await logHabit.mutateAsync({ habit_id: habitId });
      toast.success(t('habits.habitLogged'));
    } catch {
      toast.error(t('common.error'));
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteHabit.mutateAsync(id);
      toast.success(t('habits.habitDeleted'));
    } catch {
      toast.error(t('common.error'));
    }
  };

  const handleEdit = async () => {
    if (!editingHabit) return;
    try {
      await updateHabit.mutateAsync({ id: editingHabit.id, name: editingHabit.name });
      toast.success(t('habits.habitUpdated'));
      setEditingHabit(null);
    } catch {
      toast.error(t('common.error'));
    }
  };

  const displayHabits = habits?.slice(0, 4) || [];
  const totalStreak = displayHabits.reduce((acc, h) => acc + getHabitStreak(h.id), 0);
  const completedToday = displayHabits.filter(h => isCompletedToday(h.id)).length;

  const habitColors = [
    { bg: 'bg-primary', light: 'bg-primary/20' },
    { bg: 'bg-success', light: 'bg-success/20' },
    { bg: 'bg-warning', light: 'bg-warning/20' },
    { bg: 'bg-destructive', light: 'bg-destructive/20' },
  ];

  if (isLoading) {
    return (
      <DashboardWidgetShell
        title={t('dashboard.habitStreaks')}
        icon={Flame}
        iconColor="text-destructive"
        iconBg="bg-destructive/10"
        accentColor="bg-destructive/10"
        headerAction={
          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-destructive/10">
            <Zap className="w-3.5 h-3.5 text-destructive" />
            <span className="text-xs font-bold text-foreground">0</span>
          </div>
        }
      >
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
        </div>
      </DashboardWidgetShell>
    );
  }

  return (
    <DashboardWidgetShell
      title={t('dashboard.habitStreaks')}
      icon={Flame}
      iconColor="text-destructive"
      iconBg="bg-destructive/10"
      accentColor="bg-destructive/10"
      headerAction={
        <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-destructive/10">
          <Zap className="w-3.5 h-3.5 text-destructive" />
          <span className="text-xs font-bold text-foreground">{totalStreak}</span>
        </div>
      }
    >
      {displayHabits.length > 0 ? (
        <>
          {/* Habits Grid */}
          <div className="grid grid-cols-2 gap-2.5">
            {displayHabits.map((habit, index) => {
              const completed = isCompletedToday(habit.id);
              const streak = getHabitStreak(habit.id);
              const colorConfig = habitColors[index % habitColors.length];

              return (
                <div
                  key={habit.id}
                  onClick={() => toggleHabit(habit.id)}
                  className={cn(
                    'group relative p-3 rounded-xl border transition-all duration-200 cursor-pointer',
                    completed 
                      ? `${colorConfig.bg} border-transparent` 
                      : 'bg-muted/30 border-border/40 hover:border-primary/30 hover:bg-muted/50'
                  )}
                >
                  {/* Completed Check */}
                  {completed && (
                    <div className="absolute -top-1.5 -end-1.5 w-5 h-5 bg-background rounded-full flex items-center justify-center shadow-sm ring-2 ring-background">
                      <Check className="w-3 h-3 text-success" />
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="absolute top-1.5 start-1.5 flex gap-0.5 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => { e.stopPropagation(); setEditingHabit({ id: habit.id, name: habit.name }); }}
                      className="p-1 rounded bg-background/80 hover:bg-background transition-colors"
                    >
                      <Edit3 className="w-2.5 h-2.5 text-muted-foreground" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(habit.id); }}
                      className="p-1 rounded bg-background/80 hover:bg-destructive/10 transition-colors"
                    >
                      <Trash2 className="w-2.5 h-2.5 text-destructive" />
                    </button>
                  </div>
                  
                  {/* Habit Icon */}
                  <div className={cn(
                    'w-8 h-8 rounded-lg flex items-center justify-center text-base mb-2',
                    completed ? 'bg-primary-foreground/20' : colorConfig.light
                  )}>
                    {habit.icon || '✨'}
                  </div>
                  
                  {/* Habit Name */}
                  <p className={cn(
                    'text-xs font-medium truncate',
                    completed ? 'text-primary-foreground' : 'text-foreground'
                  )}>
                    {habit.name}
                  </p>
                  
                  {/* Streak */}
                  <div className="flex items-center gap-1 mt-1">
                    <Flame className={cn('w-3 h-3', completed ? 'text-primary-foreground/70' : 'text-destructive')} />
                    <span className={cn('text-[10px] font-medium', completed ? 'text-primary-foreground/70' : 'text-muted-foreground')}>
                      {streak} {t('habits.dayStreak')}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Today's Progress */}
          <div className="mt-4 pt-3 border-t border-border/40">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-muted-foreground">
                {currentLanguage === 'ar' ? 'اليوم' : "Today"}
              </span>
              <span className="text-xs font-bold text-foreground">{completedToday}/{displayHabits.length}</span>
            </div>
            <div className="flex gap-1">
              {displayHabits.map((habit, index) => (
                <div
                  key={habit.id}
                  className={cn(
                    'flex-1 h-2 rounded-full transition-all duration-300',
                    isCompletedToday(habit.id) ? habitColors[index % habitColors.length].bg : 'bg-muted'
                  )}
                />
              ))}
            </div>
          </div>
        </>
      ) : (
        <DashboardEmptyState
          icon={Flame}
          message={t('habits.noHabits')}
        />
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingHabit} onOpenChange={() => setEditingHabit(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center">
                <Edit3 className="w-4 h-4 text-destructive" />
              </div>
              {t('habits.editHabit')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <Input
              value={editingHabit?.name || ''}
              onChange={(e) => setEditingHabit(prev => prev ? { ...prev, name: e.target.value } : null)}
              placeholder={t('habits.habitName')}
              className="bg-muted/50"
            />
            <Button onClick={handleEdit} className="w-full" disabled={updateHabit.isPending}>
              {updateHabit.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : t('common.save')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardWidgetShell>
  );
}