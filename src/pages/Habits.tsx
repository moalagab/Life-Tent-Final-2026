import { MainLayout } from '@/components/layout/MainLayout';
import { Flame, Plus, TrendingUp, Smile, Frown, Meh, Zap, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Habit {
  id: string;
  name: string;
  icon: string;
  streak: number;
  completedDays: boolean[];
  color: string;
}

const mockHabits: Habit[] = [
  { id: '1', name: 'Morning Reading', icon: '📚', streak: 15, completedDays: [true, true, true, false, true, true, true], color: 'bg-primary' },
  { id: '2', name: 'Exercise', icon: '🏋️', streak: 8, completedDays: [true, false, true, true, true, false, true], color: 'bg-success' },
  { id: '3', name: 'Meditation', icon: '🧘', streak: 22, completedDays: [true, true, true, true, true, true, true], color: 'bg-purple-500' },
  { id: '4', name: 'Water Intake', icon: '💧', streak: 30, completedDays: [true, true, true, true, true, true, true], color: 'bg-blue-500' },
  { id: '5', name: 'Quran Reading', icon: '📖', streak: 45, completedDays: [true, true, true, true, true, true, true], color: 'bg-emerald-500' },
];

const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// Generate mock contribution data for the year
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

export default function Habits() {
  return (
    <MainLayout>
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Habits & Mood</h1>
            <p className="text-muted-foreground mt-1">Track your daily habits and emotional wellbeing</p>
          </div>
          <Button variant="gold" size="lg">
            <Plus className="w-5 h-5 mr-2" />
            New Habit
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Habits Tracker */}
        <div className="lg:col-span-2 glass-card p-5">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-semibold text-foreground">Daily Habits</h3>
            <div className="flex items-center gap-1 text-primary">
              <Flame className="w-5 h-5" />
              <span className="font-bold">{mockHabits.reduce((acc, h) => acc + h.streak, 0)} total days</span>
            </div>
          </div>

          <div className="space-y-3">
            {mockHabits.map((habit) => (
              <div
                key={habit.id}
                className="p-4 rounded-xl bg-muted/30 border border-border hover:border-primary/30 transition-all"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{habit.icon}</span>
                    <div>
                      <h4 className="font-medium text-foreground">{habit.name}</h4>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Flame className="w-3 h-3 text-destructive" />
                        <span>{habit.streak} day streak</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  {weekDays.map((day, i) => (
                    <div key={day} className="flex-1 text-center">
                      <span className="text-xs text-muted-foreground block mb-1">{day}</span>
                      <button
                        className={cn(
                          'w-full aspect-square rounded-lg transition-all',
                          habit.completedDays[i] 
                            ? `${habit.color} shadow-lg` 
                            : 'bg-muted/50 hover:bg-muted'
                        )}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Mood Tracker */}
        <div className="glass-card p-5">
          <h3 className="text-lg font-semibold text-foreground mb-5">Today's Mood</h3>

          <div className="space-y-6">
            {/* Mood Selection */}
            <div>
              <p className="text-sm text-muted-foreground mb-3">How are you feeling?</p>
              <div className="flex justify-between">
                {[
                  { icon: Frown, label: 'Bad', value: 1 },
                  { icon: Meh, label: 'Okay', value: 2 },
                  { icon: Smile, label: 'Good', value: 3 },
                ].map((mood) => (
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
              <p className="text-sm text-muted-foreground mb-3">Energy Level</p>
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
              <p className="text-sm text-muted-foreground mb-3">Sleep Quality</p>
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
                <span className="text-sm font-medium text-foreground">AI Insight</span>
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
        <h3 className="text-lg font-semibold text-foreground mb-5">Yearly Activity</h3>
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
          <span>Less</span>
          {[0, 1, 2, 3, 4].map((level) => (
            <div key={level} className={cn('w-3 h-3 rounded-sm', getContributionColor(level))} />
          ))}
          <span>More</span>
        </div>
      </div>
    </MainLayout>
  );
}
