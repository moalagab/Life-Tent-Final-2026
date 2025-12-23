import { Flame, Check, Loader2, Trash2, Edit3, Sparkles, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/hooks/useLanguage';
import { useHabits, useHabitLogs, useLogHabit, useDeleteHabit, useUpdateHabit } from '@/hooks/useHabits';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { format, subDays } from 'date-fns';

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
      <div className="relative overflow-hidden rounded-2xl bg-card/50 backdrop-blur-xl border border-border/50 p-5 h-full flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const displayHabits = habits?.slice(0, 4) || [];
  const totalStreak = displayHabits.reduce((acc, h) => acc + getHabitStreak(h.id), 0);
  const completedToday = displayHabits.filter(h => isCompletedToday(h.id)).length;

  const habitColors = [
    { bg: 'bg-primary', gradient: 'from-primary to-primary/50' },
    { bg: 'bg-success', gradient: 'from-success to-success/50' },
    { bg: 'bg-blue-500', gradient: 'from-blue-500 to-blue-500/50' },
    { bg: 'bg-purple-500', gradient: 'from-purple-500 to-purple-500/50' },
  ];

  return (
    <div className="relative overflow-hidden rounded-2xl bg-card/50 backdrop-blur-xl border border-border/50 p-5 h-full">
      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-destructive/5 rounded-full blur-3xl" />
      
      <div className="relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center">
              <Flame className="w-4 h-4 text-destructive" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">{t('dashboard.habitStreaks')}</h3>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-destructive/20 to-primary/20 border border-destructive/20">
            <Zap className="w-4 h-4 text-destructive" />
            <span className="font-bold text-foreground">{totalStreak}</span>
          </div>
        </div>

        {displayHabits.length > 0 ? (
          <>
            {/* Habits Grid */}
            <div className="grid grid-cols-2 gap-3">
              {displayHabits.map((habit, index) => {
                const completed = isCompletedToday(habit.id);
                const streak = getHabitStreak(habit.id);
                const colorConfig = habitColors[index % habitColors.length];

                return (
                  <div
                    key={habit.id}
                    onClick={() => toggleHabit(habit.id)}
                    className={cn(
                      'group relative p-4 rounded-xl border-2 transition-all duration-300 cursor-pointer',
                      completed 
                        ? 'bg-gradient-to-br border-primary/50 shadow-lg' 
                        : 'bg-muted/30 border-border/50 hover:border-primary/30 hover:bg-muted/50',
                      completed && `bg-gradient-to-br ${colorConfig.gradient}`
                    )}
                  >
                    {/* Completed Check */}
                    {completed && (
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center shadow-lg ring-4 ring-card">
                        <Check className="w-3.5 h-3.5 text-primary-foreground" />
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="absolute top-2 left-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300">
                      <button
                        onClick={(e) => { e.stopPropagation(); setEditingHabit({ id: habit.id, name: habit.name }); }}
                        className="p-1.5 rounded-lg bg-background/80 backdrop-blur-sm hover:bg-background transition-colors"
                      >
                        <Edit3 className="w-3 h-3 text-muted-foreground" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(habit.id); }}
                        className="p-1.5 rounded-lg bg-background/80 backdrop-blur-sm hover:bg-destructive/10 transition-colors"
                      >
                        <Trash2 className="w-3 h-3 text-destructive" />
                      </button>
                    </div>
                    
                    {/* Habit Icon */}
                    <div className={cn(
                      'w-10 h-10 rounded-xl flex items-center justify-center text-lg mb-3 transition-transform duration-300 group-hover:scale-110',
                      completed ? 'bg-primary-foreground/20' : colorConfig.bg
                    )}>
                      {habit.icon || '✨'}
                    </div>
                    
                    {/* Habit Name */}
                    <p className={cn(
                      'text-sm font-medium truncate',
                      completed ? 'text-primary-foreground' : 'text-foreground'
                    )}>
                      {habit.name}
                    </p>
                    
                    {/* Streak */}
                    <div className="flex items-center gap-1 mt-2">
                      <Flame className={cn(
                        'w-3.5 h-3.5',
                        completed ? 'text-primary-foreground/70' : 'text-destructive'
                      )} />
                      <span className={cn(
                        'text-xs font-medium',
                        completed ? 'text-primary-foreground/70' : 'text-muted-foreground'
                      )}>
                        {streak} {t('habits.dayStreak')}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Today's Progress */}
            <div className="mt-5 pt-4 border-t border-border/50">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  {currentLanguage === 'ar' ? 'عادات اليوم' : "Today's Habits"}
                </span>
                <span className="text-sm font-bold gold-text">{completedToday}/{displayHabits.length}</span>
              </div>
              <div className="flex gap-1.5">
                {displayHabits.map((habit, index) => (
                  <div
                    key={habit.id}
                    className={cn(
                      'flex-1 h-2.5 rounded-full transition-all duration-500',
                      isCompletedToday(habit.id) 
                        ? `bg-gradient-to-r ${habitColors[index % habitColors.length].gradient}` 
                        : 'bg-muted'
                    )}
                  />
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
              <Flame className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-sm">{t('habits.noHabits')}</p>
          </div>
        )}
      </div>

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
    </div>
  );
}
