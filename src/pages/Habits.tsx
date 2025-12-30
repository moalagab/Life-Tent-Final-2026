import { MainLayout } from '@/components/layout/MainLayout';
import { Flame, Plus, TrendingUp, Smile, Frown, Meh, Zap, Moon, Loader2, Edit3, Trash2, MoreVertical, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/hooks/useLanguage';
import { useHabitsWithLogs, useCreateHabit, useLogHabit, useUpdateHabit, useDeleteHabit } from '@/hooks/useHabits';
import { useTodayMoodLog, useUpsertMoodLog } from '@/hooks/useMoodLogs';
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { format, subDays, isSameDay } from 'date-fns';
import { Slider } from '@/components/ui/slider';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoodHabitCorrelation } from '@/components/habits/MoodHabitCorrelation';
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';

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
  const { data: todayMood } = useTodayMoodLog();
  const createHabit = useCreateHabit();
  const logHabit = useLogHabit();
  const updateHabit = useUpdateHabit();
  const deleteHabit = useDeleteHabit();
  const upsertMoodLog = useUpsertMoodLog();
  const [showCorrelation, setShowCorrelation] = useState(false);

  // Realtime subscriptions
  useRealtimeSubscription({ table: 'habits', queryKey: ['habits'] });
  useRealtimeSubscription({ table: 'habit_logs', queryKey: ['habits-with-logs'] });
  useRealtimeSubscription({ table: 'mood_logs', queryKey: ['mood-logs'] });
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<any>(null);
  const [newHabit, setNewHabit] = useState({
    name: '',
    icon: '✨',
  });

  // Mood state
  const [selectedMood, setSelectedMood] = useState<number>(3);
  const [energyLevel, setEnergyLevel] = useState<number>(75);
  const [sleepQuality, setSleepQuality] = useState<number>(85);

  // Load existing mood data
  useEffect(() => {
    if (todayMood) {
      setSelectedMood(todayMood.mood_score || 3);
      setEnergyLevel((todayMood.energy_level || 7.5) * 10);
      setSleepQuality(((10 - (todayMood.stress_level || 1.5)) / 10) * 100);
    }
  }, [todayMood]);

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

  const handleUpdateHabit = async () => {
    if (!editingHabit || !editingHabit.name.trim()) return;
    
    try {
      await updateHabit.mutateAsync({
        id: editingHabit.id,
        name: editingHabit.name,
        icon: editingHabit.icon,
      });
      toast.success(t('common.save'));
      setIsEditDialogOpen(false);
      setEditingHabit(null);
    } catch (error) {
      toast.error(t('auth.error'));
    }
  };

  const handleDeleteHabit = async (id: string) => {
    try {
      await deleteHabit.mutateAsync(id);
      toast.success(t('common.delete'));
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

  const handleMoodChange = async (mood: number) => {
    setSelectedMood(mood);
    try {
      await upsertMoodLog.mutateAsync({
        mood_score: mood,
        energy_level: Math.round(energyLevel / 10),
        stress_level: Math.round(10 - (sleepQuality / 10)),
      });
      toast.success(t('common.save'));
    } catch (error) {
      toast.error(t('auth.error'));
    }
  };

  const handleEnergyChange = async (value: number[]) => {
    const energy = value[0];
    setEnergyLevel(energy);
    try {
      await upsertMoodLog.mutateAsync({
        mood_score: selectedMood,
        energy_level: Math.round(energy / 10),
        stress_level: Math.round(10 - (sleepQuality / 10)),
      });
    } catch (error) {
      // Silent fail for slider updates
    }
  };

  const handleSleepChange = async (value: number[]) => {
    const sleep = value[0];
    setSleepQuality(sleep);
    try {
      await upsertMoodLog.mutateAsync({
        mood_score: selectedMood,
        energy_level: Math.round(energyLevel / 10),
        stress_level: Math.round(10 - (sleep / 10)),
      });
    } catch (error) {
      // Silent fail for slider updates
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
          <div className="flex gap-2">
            <Button 
              variant={showCorrelation ? 'default' : 'outline'} 
              onClick={() => setShowCorrelation(!showCorrelation)}
            >
              <BarChart3 className="w-5 h-5 me-2" />
              {t('habits.correlationInsight')}
            </Button>
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
      </div>

      {/* Mood-Habit Correlation Section */}
      {showCorrelation && (
        <div className="mb-6">
          <MoodHabitCorrelation />
        </div>
      )}

      {/* Edit Habit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('common.edit')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>{t('habits.dailyHabits')}</Label>
              <Input
                value={editingHabit?.name || ''}
                onChange={(e) => setEditingHabit({ ...editingHabit, name: e.target.value })}
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
                    onClick={() => setEditingHabit({ ...editingHabit, icon })}
                    className={cn(
                      'text-2xl p-2 rounded-lg transition-all',
                      editingHabit?.icon === icon ? 'bg-primary/20 ring-2 ring-primary' : 'hover:bg-muted'
                    )}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>
            <Button onClick={handleUpdateHabit} className="w-full" disabled={updateHabit.isPending}>
              {updateHabit.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : t('common.save')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Habits Tracker */}
        <div className="lg:col-span-2 glass-card p-5">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-semibold text-foreground">{t('habits.dailyHabits')}</h3>
            <div className="flex items-center gap-3">
              {/* Streak Badges */}
              {getTotalStreak() >= 7 && (
                <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30">
                  <span className="text-xs">🔥</span>
                  <span className="text-xs font-medium text-amber-500">
                    {getTotalStreak() >= 30 ? '🏆' : getTotalStreak() >= 14 ? '⭐' : '🎯'}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-1 text-primary">
                <Flame className="w-5 h-5" />
                <span className="font-bold">{getTotalStreak()} {t('habits.totalDays')}</span>
              </div>
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
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                          <MoreVertical className="w-4 h-4 text-muted-foreground" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => {
                          setEditingHabit(habit);
                          setIsEditDialogOpen(true);
                        }}>
                          <Edit3 className="w-4 h-4 me-2" />
                          {t('common.edit')}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDeleteHabit(habit.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="w-4 h-4 me-2" />
                          {t('common.delete')}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
                    onClick={() => handleMoodChange(mood.value)}
                    className={cn(
                      'flex flex-col items-center gap-2 p-3 rounded-xl transition-all',
                      selectedMood === mood.value 
                        ? 'bg-primary/10 border border-primary/30' 
                        : 'hover:bg-muted'
                    )}
                  >
                    <mood.icon className={cn(
                      'w-8 h-8',
                      selectedMood === mood.value ? 'text-primary' : 'text-muted-foreground'
                    )} />
                    <span className="text-xs text-muted-foreground">{mood.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Energy Level */}
            <div>
              <p className="text-sm text-muted-foreground mb-3">{t('habits.energyLevel')}</p>
              <div className="flex items-center gap-3">
                <Zap className="w-4 h-4 text-primary" />
                <Slider
                  value={[energyLevel]}
                  onValueChange={handleEnergyChange}
                  max={100}
                  step={10}
                  className="flex-1"
                />
                <span className="text-sm font-medium w-10">{Math.round(energyLevel)}%</span>
              </div>
            </div>

            {/* Sleep Quality */}
            <div>
              <p className="text-sm text-muted-foreground mb-3">{t('habits.sleepQuality')}</p>
              <div className="flex items-center gap-3">
                <Moon className="w-4 h-4 text-purple-500" />
                <Slider
                  value={[sleepQuality]}
                  onValueChange={handleSleepChange}
                  max={100}
                  step={10}
                  className="flex-1"
                />
                <span className="text-sm font-medium w-10">{Math.round(sleepQuality)}%</span>
              </div>
            </div>

            {/* Correlation Insight - Note: Shows correlation, not causation */}
            <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-foreground">{t('habits.correlationInsight')}</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {t('habits.correlationNote')}
              </p>
              <p className="text-xs text-muted-foreground/70 mt-2 italic">
                * {t('habits.correlationDisclaimer')}
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
