import { MainLayout } from '@/components/layout/MainLayout';
import { Target, Plus, TrendingUp, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/hooks/useLanguage';
import { useGoals, useKeyResults, useCreateGoal } from '@/hooks/useGoals';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

const categoryColors: Record<string, string> = {
  financial: 'bg-primary/10 text-primary border-primary/20',
  customer: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  processes: 'bg-success/10 text-success border-success/20',
  learning: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
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
  const { t } = useLanguage();
  const { data: goals, isLoading } = useGoals();
  const { data: keyResults } = useKeyResults();
  const createGoal = useCreateGoal();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    perspective: 'financial' as 'financial' | 'customer' | 'processes' | 'learning',
    target_value: '',
    unit: '',
  });

  const categoryLabels: Record<string, string> = {
    financial: t('goals.category.financial'),
    customer: t('goals.category.customer'),
    processes: t('goals.category.processes'),
    learning: t('goals.category.learning'),
  };

  const tabs = [
    { id: null, label: t('goals.category.all') },
    { id: 'financial', label: t('goals.category.financial') },
    { id: 'customer', label: t('goals.category.customer') },
    { id: 'processes', label: t('goals.category.processes') },
    { id: 'learning', label: t('goals.category.learning') },
  ];

  const filteredGoals = goals?.filter(goal => 
    !selectedCategory || goal.perspective === selectedCategory
  ) || [];

  const getGoalKeyResults = (goalId: string) => {
    return keyResults?.filter(kr => kr.goal_id === goalId) || [];
  };

  const calculateProgress = (goalId: string) => {
    const krs = getGoalKeyResults(goalId);
    if (krs.length === 0) return 0;
    
    const totalProgress = krs.reduce((sum, kr) => {
      const progress = kr.target_value > 0 ? ((kr.current_value || 0) / kr.target_value) * 100 : 0;
      return sum + Math.min(progress, 100);
    }, 0);
    
    return Math.round(totalProgress / krs.length);
  };

  const handleCreateGoal = async () => {
    if (!newGoal.title) {
      toast.error(t('common.fillAllFields'));
      return;
    }

    try {
      await createGoal.mutateAsync({
        title: newGoal.title,
        description: newGoal.description || null,
        perspective: newGoal.perspective,
        target_value: newGoal.target_value ? parseFloat(newGoal.target_value) : null,
        unit: newGoal.unit || null,
      });
      toast.success(t('goals.goalAdded'));
      setIsDialogOpen(false);
      setNewGoal({ title: '', description: '', perspective: 'financial', target_value: '', unit: '' });
    } catch (error) {
      toast.error(t('common.error'));
    }
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
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
            <h1 className="text-3xl font-bold text-foreground">{t('goals.title')}</h1>
            <p className="text-muted-foreground mt-1">{t('goals.subtitle')}</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="gold" size="lg">
                <Plus className="w-5 h-5 me-2" />
                {t('goals.newObjective')}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('goals.newObjective')}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <Input
                  placeholder={t('goals.goalTitle')}
                  value={newGoal.title}
                  onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                />
                <Textarea
                  placeholder={t('goals.goalDescription')}
                  value={newGoal.description}
                  onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
                />
                <Select 
                  value={newGoal.perspective} 
                  onValueChange={(value: 'financial' | 'customer' | 'processes' | 'learning') => 
                    setNewGoal({ ...newGoal, perspective: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="financial">{t('goals.category.financial')}</SelectItem>
                    <SelectItem value="customer">{t('goals.category.customer')}</SelectItem>
                    <SelectItem value="processes">{t('goals.category.processes')}</SelectItem>
                    <SelectItem value="learning">{t('goals.category.learning')}</SelectItem>
                  </SelectContent>
                </Select>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    type="number"
                    placeholder={t('goals.targetValue')}
                    value={newGoal.target_value}
                    onChange={(e) => setNewGoal({ ...newGoal, target_value: e.target.value })}
                  />
                  <Input
                    placeholder={t('goals.unit')}
                    value={newGoal.unit}
                    onChange={(e) => setNewGoal({ ...newGoal, unit: e.target.value })}
                  />
                </div>
                <Button onClick={handleCreateGoal} className="w-full" disabled={createGoal.isPending}>
                  {createGoal.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : t('common.add')}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.id || 'all'}
            onClick={() => setSelectedCategory(tab.id)}
            className={cn(
              'px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap',
              selectedCategory === tab.id 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-muted/50 text-muted-foreground hover:bg-muted'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Objectives */}
      {filteredGoals.length > 0 ? (
        <div className="space-y-6">
          {filteredGoals.map((goal) => {
            const progress = calculateProgress(goal.id);
            const goalKeyResults = getGoalKeyResults(goal.id);

            return (
              <div key={goal.id} className="glass-card p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-gold flex items-center justify-center shadow-gold-glow-sm">
                      <Target className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">{goal.title}</h3>
                      {goal.perspective && (
                        <span className={cn(
                          'px-2 py-0.5 rounded-full text-xs font-medium border',
                          categoryColors[goal.perspective]
                        )}>
                          {categoryLabels[goal.perspective]}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getProgressIcon(progress)}
                    <span className="text-lg font-bold text-foreground">{progress}%</span>
                  </div>
                </div>

                {goal.description && (
                  <p className="text-sm text-muted-foreground mb-4">{goal.description}</p>
                )}

                {/* Overall Progress */}
                <div className="mb-6">
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <div
                      className={cn('h-full rounded-full transition-all duration-500', getProgressColor(progress))}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {/* Key Results */}
                {goalKeyResults.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium text-muted-foreground">{t('goals.keyResults')}</h4>
                    {goalKeyResults.map((kr) => {
                      const krProgress = Math.min((kr.current_value || 0) / kr.target_value * 100, 100);
                      
                      return (
                        <div key={kr.id} className="p-3 rounded-xl bg-muted/30 border border-border">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-foreground">{kr.title}</span>
                            <span className="text-sm font-medium text-muted-foreground">
                              {(kr.current_value || 0).toLocaleString()} / {kr.target_value.toLocaleString()} {kr.unit}
                            </span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className={cn('h-full rounded-full transition-all duration-500', getProgressColor(krProgress))}
                              style={{ width: `${krProgress}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="glass-card p-12 text-center">
          <Target className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium text-foreground mb-2">{t('goals.noGoals')}</h3>
          <p className="text-muted-foreground mb-4">{t('goals.noGoalsDescription')}</p>
          <Button variant="gold" onClick={() => setIsDialogOpen(true)}>
            <Plus className="w-5 h-5 me-2" />
            {t('goals.newObjective')}
          </Button>
        </div>
      )}
    </MainLayout>
  );
}
