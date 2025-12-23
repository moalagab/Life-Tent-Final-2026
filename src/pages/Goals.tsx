import { MainLayout } from '@/components/layout/MainLayout';
import { Target, Plus, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface KeyResult {
  id: string;
  title: string;
  current: number;
  target: number;
  unit: string;
}

interface Objective {
  id: string;
  title: string;
  category: 'Financial' | 'Customer' | 'Processes' | 'Learning';
  progress: number;
  keyResults: KeyResult[];
}

const mockObjectives: Objective[] = [
  {
    id: '1',
    title: 'Achieve Financial Independence',
    category: 'Financial',
    progress: 45,
    keyResults: [
      { id: 'kr1', title: 'Increase net worth', current: 245780, target: 500000, unit: 'SAR' },
      { id: 'kr2', title: 'Build emergency fund', current: 6, target: 12, unit: 'months' },
      { id: 'kr3', title: 'Investment portfolio growth', current: 15, target: 20, unit: '%' },
    ]
  },
  {
    id: '2',
    title: 'Master New Skills',
    category: 'Learning',
    progress: 70,
    keyResults: [
      { id: 'kr4', title: 'Complete online courses', current: 7, target: 10, unit: 'courses' },
      { id: 'kr5', title: 'Read books', current: 18, target: 24, unit: 'books' },
      { id: 'kr6', title: 'Practice Arabic writing', current: 280, target: 365, unit: 'days' },
    ]
  },
  {
    id: '3',
    title: 'Improve Health & Fitness',
    category: 'Processes',
    progress: 60,
    keyResults: [
      { id: 'kr7', title: 'Weekly workouts', current: 4, target: 5, unit: 'sessions' },
      { id: 'kr8', title: 'Reach target weight', current: 78, target: 75, unit: 'kg' },
      { id: 'kr9', title: 'Sleep quality score', current: 82, target: 90, unit: '%' },
    ]
  },
];

const categoryColors: Record<string, string> = {
  Financial: 'bg-primary/10 text-primary border-primary/20',
  Customer: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  Processes: 'bg-success/10 text-success border-success/20',
  Learning: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
};

function getProgressColor(progress: number): string {
  if (progress >= 80) return 'bg-success';
  if (progress >= 50) return 'bg-primary';
  return 'bg-destructive';
}

function getProgressIcon(progress: number) {
  if (progress >= 80) return <CheckCircle className="w-4 h-4 text-success" />;
  if (progress >= 50) return <TrendingUp className="w-4 h-4 text-primary" />;
  return <AlertCircle className="w-4 h-4 text-destructive" />;
}

export default function Goals() {
  return (
    <MainLayout>
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Goals & OKRs</h1>
            <p className="text-muted-foreground mt-1">Balanced Scorecard strategy center</p>
          </div>
          <Button variant="gold" size="lg">
            <Plus className="w-5 h-5 mr-2" />
            New Objective
          </Button>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {['All', 'Financial', 'Customer', 'Processes', 'Learning'].map((tab) => (
          <button
            key={tab}
            className={cn(
              'px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap',
              tab === 'All' 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-muted/50 text-muted-foreground hover:bg-muted'
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Objectives */}
      <div className="space-y-6">
        {mockObjectives.map((objective) => (
          <div key={objective.id} className="glass-card p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-gold flex items-center justify-center shadow-gold-glow-sm">
                  <Target className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">{objective.title}</h3>
                  <span className={cn(
                    'px-2 py-0.5 rounded-full text-xs font-medium border',
                    categoryColors[objective.category]
                  )}>
                    {objective.category}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {getProgressIcon(objective.progress)}
                <span className="text-lg font-bold text-foreground">{objective.progress}%</span>
              </div>
            </div>

            {/* Overall Progress */}
            <div className="mb-6">
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div
                  className={cn('h-full rounded-full transition-all duration-500', getProgressColor(objective.progress))}
                  style={{ width: `${objective.progress}%` }}
                />
              </div>
            </div>

            {/* Key Results */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground">Key Results</h4>
              {objective.keyResults.map((kr) => {
                const progress = Math.min((kr.current / kr.target) * 100, 100);
                
                return (
                  <div key={kr.id} className="p-3 rounded-xl bg-muted/30 border border-border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-foreground">{kr.title}</span>
                      <span className="text-sm font-medium text-muted-foreground">
                        {kr.current.toLocaleString()} / {kr.target.toLocaleString()} {kr.unit}
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={cn('h-full rounded-full transition-all duration-500', getProgressColor(progress))}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </MainLayout>
  );
}
