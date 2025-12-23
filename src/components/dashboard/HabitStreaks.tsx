import { Flame, Check, Loader2, Trash2, Edit3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/hooks/useLanguage';
import { useHabits, useHabitLogs, useLogHabit, useDeleteHabit, useUpdateHabit } from '@/hooks/useHabits';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { format, subDays, differenceInDays, parseISO } from 'date-fns';

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
    let currentDate = new Date();

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
    } catch (error) {
      toast.error(t('common.error'));
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteHabit.mutateAsync(id);
      toast.success(t('habits.habitDeleted'));
    } catch (error) {
      toast.error(t('common.error'));
    }
  };

  const handleEdit = async () => {
    if (!editingHabit) return;
    try {
      await updateHabit.mutateAsync({ id: editingHabit.id, name: editingHabit.name });
      toast.success(t('habits.habitUpdated'));
      setEditingHabit(null);
    } catch (error) {
      toast.error(t('common.error'));
    }
  };

  if (isLoading) {
    return (
      <div className="glass-card p-5 h-full flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const displayHabits = habits?.slice(0, 4) || [];
  const totalStreak = displayHabits.reduce((acc, h) => acc + getHabitStreak(h.id), 0);
  const completedToday = displayHabits.filter(h => isCompletedToday(h.id)).length;

  const habitColors = ['bg-primary', 'bg-success', 'bg-blue-500', 'bg-purple-500'];

  return (
    <div className="glass-card p-5 h-full">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-lg font-semibold text-foreground">{t('dashboard.habitStreaks')}</h3>
        <div className="flex items-center gap-1 text-primary">
          <Flame className="w-5 h-5" />
          <span className="font-bold">{totalStreak}</span>
        </div>
      </div>

      {displayHabits.length > 0 ? (
        <div className="grid grid-cols-2 gap-3">
          {displayHabits.map((habit, index) => {
            const completed = isCompletedToday(habit.id);
            const streak = getHabitStreak(habit.id);

            return (
              <div
                key={habit.id}
                onClick={() => toggleHabit(habit.id)}
                className={cn(
                  'relative p-3 rounded-xl border transition-all duration-200 cursor-pointer group',
                  completed 
                    ? 'bg-primary/10 border-primary/30' 
                    : 'bg-muted/30 border-border hover:border-primary/50'
                )}
              >
                {completed && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 text-primary-foreground" />
                  </div>
                )}

                <div className="absolute top-1 left-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => { e.stopPropagation(); setEditingHabit({ id: habit.id, name: habit.name }); }}
                    className="p-1 rounded hover:bg-muted"
                  >
                    <Edit3 className="w-3 h-3 text-muted-foreground" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(habit.id); }}
                    className="p-1 rounded hover:bg-destructive/10"
                  >
                    <Trash2 className="w-3 h-3 text-destructive" />
                  </button>
                </div>
                
                <div className="flex items-center gap-2 mb-2">
                  <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center text-white', habit.color || habitColors[index % habitColors.length])}>
                    {habit.icon || '✨'}
                  </div>
                </div>
                
                <p className="text-sm font-medium text-foreground">
                  {habit.name}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  <Flame className="w-3 h-3 text-destructive" />
                  <span className="text-xs text-muted-foreground">
                    {streak} {t('habits.dayStreak')}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-muted-foreground text-sm">{t('habits.noHabits')}</p>
        </div>
      )}

      {/* Today's Progress */}
      {displayHabits.length > 0 && (
        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">
              {currentLanguage === 'ar' ? 'عادات اليوم' : "Today's Habits"}
            </span>
            <span className="text-sm font-medium gold-text">{completedToday}/{displayHabits.length}</span>
          </div>
          <div className="flex gap-1 mt-2">
            {displayHabits.map((habit) => (
              <div
                key={habit.id}
                className={cn(
                  'flex-1 h-2 rounded-full transition-all',
                  isCompletedToday(habit.id) ? 'bg-primary' : 'bg-muted'
                )}
              />
            ))}
          </div>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingHabit} onOpenChange={() => setEditingHabit(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('habits.editHabit')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <Input
              value={editingHabit?.name || ''}
              onChange={(e) => setEditingHabit(prev => prev ? { ...prev, name: e.target.value } : null)}
              placeholder={t('habits.habitName')}
            />
            <Button onClick={handleEdit} className="w-full" disabled={updateHabit.isPending}>
              {updateHabit.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : t('common.save')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
