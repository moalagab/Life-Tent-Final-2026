import { MainLayout } from '@/components/layout/MainLayout';
import { Flame, Plus, TrendingUp, Smile, Frown, Meh, Zap, Moon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/hooks/useLanguage';
import { useHabitsWithLogs, useCreateHabit, useLogHabit } from '@/hooks/useHabits';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { format, subDays, isSameDay } from 'date-fns';

// Generate mock contribution data for the year (will be replaced with real data later)
const generateContributionData = () => {
  const data = [];
  for (let week = 0; week < 52; week++) {
    const weekData = [];
    for (let day = 0; day < 7; day++) {
      weekData.push(Math.random() > 0.3 ? Math.floor(Math.random() * 4) + 1 : 0);
    }
    data.push(weekData);
  }
  return data;
};

const contributionData = generateContributionData();

const getContributionColor = (level: number) => {
  switch (level) {
    case 0: return 'bg-muted/30';
    case 1: return 'bg-primary/25';
    case 2: return 'bg-primary/50';
    case 3: return 'bg-primary/75';
    case 4: return 'bg-primary';
    default: return 'bg-muted/30';
  }
};

const habitColors = ['bg-primary', 'bg-success', 'bg-purple-500', 'bg-blue-500', 'bg-emerald-500', 'bg-orange-500'];

export default function Habits() {
  const { t } = useLanguage();
  const { data: habits, isLoading } = useHabitsWithLogs();
  const createHabit = useCreateHabit();
  const logHabit = useLogHabit();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newHabit, setNewHabit] = useState({
    name: '',
    icon: '✨',
  });

  const today = new Date();
  const weekDates = Array.from({ length: 7 }, (_, i) => subDays(today, 6 - i));

  const weekDayLabels = [
    t('weekDays.mon'),
    t('weekDays.tue'),
    t('weekDays.wed'),
    t('weekDays.thu'),
    t('weekDays.fri'),
    t('weekDays.sat'),
    t('weekDays.sun')
  ];

  const moodOptions = [
    { icon: Frown, label: t('habits.bad'), value: 1 },
    { icon: Meh, label: t('habits.okay'), value: 2 },
    { icon: Smile, label: t('habits.good'), value: 3 },
  ];

  const handleCreateHabit = async () => {
    if (!newHabit.name.trim()) return;
    
    try {
      await createHabit.mutateAsync({
        name: newHabit.name,
        icon: newHabit.icon,
        color: habitColors[Math.floor(Math.random() * habitColors.length)],
      });
      toast.success(t('common.save'));
      setIsDialogOpen(false);
      setNewHabit({ name: '', icon: '✨' });
    } catch (error) {
      toast.error(t('auth.error'));
    }
  };

  const handleLogHabit = async (habitId: string, date: Date) => {
    try {
      await logHabit.mutateAsync({
        habit_id: habitId,
        completed_at: format(date, 'yyyy-MM-dd'),
      });
    } catch (error) {
      toast.error(t('auth.error'));
    }
  };

  const isHabitCompletedOnDate = (habit: typeof habits[0], date: Date) => {
    return habit.logs?.some(log => 
      isSameDay(new Date(log.completed_at), date)
    );
  };

  const getTotalStreak = () => {
    if (!habits) return 0;
    // Simple streak calculation - count consecutive days from today
    let streak = 0;
    for (let i = 0; i < 365; i++) {
      const date = subDays(today, i);
      const allHabitsCompleted = habits.every(h => 
        h.logs?.some(log => isSameDay(new Date(log.completed_at), date))
      );
      if (allHabitsCompleted && habits.length > 0) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }
    return streak;
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{t('habits.title')}</h1>
            <p className="text-muted-foreground mt-1">{t('habits.subtitle')}</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="gold" size="lg">
                <Plus className="w-5 h-5 me-2" />
                {t('habits.newHabit')}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('habits.newHabit')}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label>{t('habits.dailyHabits')}</Label>
                  <Input
                    value={newHabit.name}
                    onChange={(e) => setNewHabit({ ...newHabit, name: e.target.value })}
                    placeholder={t('habits.dailyHabits')}
                  />
                </div>
                <div>
                  <Label>Icon</Label>
                  <div className="flex gap-2 flex-wrap mt-2">
                    {['📚', '🏋️', '🧘', '💧', '📖', '🎯', '💪', '🏃', '🧠', '✍️'].map(icon => (
                      <button
                        key={icon}
                        type="button"
                        onClick={() => setNewHabit({ ...newHabit, icon })}
                        className={cn(
                          'text-2xl p-2 rounded-lg transition-all',
                          newHabit.icon === icon ? 'bg-primary/20 ring-2 ring-primary' : 'hover:bg-muted'
                        )}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>
                <Button onClick={handleCreateHabit} className="w-full" disabled={createHabit.isPending}>
                  {createHabit.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : t('common.save')}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Habits Tracker */}
        <div className="lg:col-span-2 glass-card p-5">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-semibold text-foreground">{t('habits.dailyHabits')}</h3>
            <div className="flex items-center gap-1 text-primary">
              <Flame className="w-5 h-5" />
              <span className="font-bold">{getTotalStreak()} {t('habits.totalDays')}</span>
            </div>
          </div>

          {habits && habits.length > 0 ? (
            <div className="space-y-3">
              {habits.map((habit, index) => (
                <div
                  key={habit.id}
                  className="p-4 rounded-xl bg-muted/30 border border-border hover:border-primary/30 transition-all"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{habit.icon || '✨'}</span>
                      <div>
                        <h4 className="font-medium text-foreground">{habit.name}</h4>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Flame className="w-3 h-3 text-destructive" />
                          <span>{habit.logs?.length || 0} {t('habits.dayStreak')}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {weekDates.map((date, i) => {
                      const isCompleted = isHabitCompletedOnDate(habit, date);
                      const dayIndex = date.getDay();
                      // Convert Sunday (0) to last, Monday (1) to first
                      const displayIndex = dayIndex === 0 ? 6 : dayIndex - 1;
                      
                      return (
                        <div key={i} className="flex-1 text-center">
                          <span className="text-xs text-muted-foreground block mb-1">
                            {weekDayLabels[displayIndex]}
                          </span>
                          <button
                            onClick={() => handleLogHabit(habit.id, date)}
                            disabled={logHabit.isPending}
                            className={cn(
                              'w-full aspect-square rounded-lg transition-all',
                              isCompleted 
                                ? `${habit.color || habitColors[index % habitColors.length]} shadow-lg` 
                                : 'bg-muted/50 hover:bg-muted'
                            )}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Flame className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">{t('common.noData')}</p>
              <Button variant="outline" className="mt-4" onClick={() => setIsDialogOpen(true)}>
                <Plus className="w-4 h-4 me-2" />
                {t('habits.newHabit')}
              </Button>
            </div>
          )}
        </div>

        {/* Mood Tracker */}
        <div className="glass-card p-5">
          <h3 className="text-lg font-semibold text-foreground mb-5">{t('habits.todaysMood')}</h3>

          <div className="space-y-6">
            {/* Mood Selection */}
            <div>
              <p className="text-sm text-muted-foreground mb-3">{t('habits.howFeeling')}</p>
              <div className="flex justify-between">
                {moodOptions.map((mood) => (
                  <button
                    key={mood.value}
                    className={cn(
                      'flex flex-col items-center gap-2 p-3 rounded-xl transition-all',
                      mood.value === 3 
                        ? 'bg-primary/10 border border-primary/30' 
                        : 'hover:bg-muted'
                    )}
                  >
                    <mood.icon className={cn(
                      'w-8 h-8',
                      mood.value === 3 ? 'text-primary' : 'text-muted-foreground'
                    )} />
                    <span className="text-xs text-muted-foreground">{mood.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Energy Level */}
            <div>
              <p className="text-sm text-muted-foreground mb-3">{t('habits.energyLevel')}</p>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-primary" />
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-gold rounded-full" style={{ width: '75%' }} />
                </div>
                <span className="text-sm font-medium">75%</span>
              </div>
            </div>

            {/* Sleep Quality */}
            <div>
              <p className="text-sm text-muted-foreground mb-3">{t('habits.sleepQuality')}</p>
              <div className="flex items-center gap-2">
                <Moon className="w-4 h-4 text-purple-500" />
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-purple-500 rounded-full" style={{ width: '85%' }} />
                </div>
                <span className="text-sm font-medium">85%</span>
              </div>
            </div>

            {/* AI Insight */}
            <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-foreground">{t('habits.aiInsight')}</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Your mood is 20% higher on days you complete morning reading. Keep it up!
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Contribution Graph */}
      <div className="glass-card p-5 mt-6">
        <h3 className="text-lg font-semibold text-foreground mb-5">{t('habits.yearlyActivity')}</h3>
        <div className="overflow-x-auto">
          <div className="flex gap-1 min-w-max">
            {contributionData.map((week, weekIndex) => (
              <div key={weekIndex} className="flex flex-col gap-1">
                {week.map((level, dayIndex) => (
                  <div
                    key={dayIndex}
                    className={cn(
                      'w-3 h-3 rounded-sm transition-colors',
                      getContributionColor(level)
                    )}
                    title={`${level} habits completed`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 mt-4 text-xs text-muted-foreground">
          <span>{t('habits.less')}</span>
          {[0, 1, 2, 3, 4].map((level) => (
            <div key={level} className={cn('w-3 h-3 rounded-sm', getContributionColor(level))} />
          ))}
          <span>{t('habits.more')}</span>
        </div>
      </div>
    </MainLayout>
  );
}