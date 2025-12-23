import { Flame, BookOpen, Dumbbell, Droplets, Brain, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/hooks/useLanguage';

interface Habit {
  id: string;
  name: string;
  nameAr: string;
  icon: React.ReactNode;
  streak: number;
  todayCompleted: boolean;
  color: string;
}

const mockHabits: Habit[] = [
  { id: '1', name: 'Reading', nameAr: 'القراءة', icon: <BookOpen className="w-4 h-4" />, streak: 15, todayCompleted: true, color: 'bg-primary' },
  { id: '2', name: 'Exercise', nameAr: 'الرياضة', icon: <Dumbbell className="w-4 h-4" />, streak: 8, todayCompleted: false, color: 'bg-success' },
  { id: '3', name: 'Hydration', nameAr: 'شرب الماء', icon: <Droplets className="w-4 h-4" />, streak: 22, todayCompleted: true, color: 'bg-blue-500' },
  { id: '4', name: 'Meditation', nameAr: 'التأمل', icon: <Brain className="w-4 h-4" />, streak: 5, todayCompleted: false, color: 'bg-purple-500' },
];

export function HabitStreaks() {
  const { t, currentLanguage } = useLanguage();
  const totalStreak = mockHabits.reduce((acc, h) => acc + h.streak, 0);
  const completedToday = mockHabits.filter(h => h.todayCompleted).length;

  return (
    <div className="glass-card p-5 h-full">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-lg font-semibold text-foreground">{t('dashboard.habitStreaks')}</h3>
        <div className="flex items-center gap-1 text-primary">
          <Flame className="w-5 h-5" />
          <span className="font-bold">{totalStreak}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {mockHabits.map((habit) => (
          <div
            key={habit.id}
            className={cn(
              'relative p-3 rounded-xl border transition-all duration-200',
              habit.todayCompleted 
                ? 'bg-primary/10 border-primary/30' 
                : 'bg-muted/30 border-border hover:border-primary/50'
            )}
          >
            {habit.todayCompleted && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                <Check className="w-3 h-3 text-primary-foreground" />
              </div>
            )}
            
            <div className="flex items-center gap-2 mb-2">
              <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', habit.color)}>
                {habit.icon}
              </div>
            </div>
            
            <p className="text-sm font-medium text-foreground">
              {currentLanguage === 'ar' ? habit.nameAr : habit.name}
            </p>
            <div className="flex items-center gap-1 mt-1">
              <Flame className="w-3 h-3 text-destructive" />
              <span className="text-xs text-muted-foreground">
                {habit.streak} {t('habits.dayStreak')}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Today's Progress */}
      <div className="mt-4 pt-4 border-t border-border">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">
            {currentLanguage === 'ar' ? 'عادات اليوم' : "Today's Habits"}
          </span>
          <span className="text-sm font-medium gold-text">{completedToday}/{mockHabits.length}</span>
        </div>
        <div className="flex gap-1 mt-2">
          {mockHabits.map((habit) => (
            <div
              key={habit.id}
              className={cn(
                'flex-1 h-2 rounded-full transition-all',
                habit.todayCompleted ? 'bg-primary' : 'bg-muted'
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
