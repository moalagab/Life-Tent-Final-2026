import { useState, useMemo } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { 
  Target, Plus, TrendingUp, Loader2, Search, Filter,
  User, Users, Cog, GraduationCap, LayoutGrid, List, Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/hooks/useLanguage';
import { useGoals, useKeyResults, useCreateGoal, useCreateKeyResult } from '@/hooks/useGoals';
import { GoalFormDialog } from '@/components/goals/GoalFormDialog';
import { GoalCard } from '@/components/goals/GoalCard';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type CategoryFilter = 'all' | 'personal' | 'financial' | 'customer' | 'processes' | 'learning';

const categoryConfig = {
  all: { icon: LayoutGrid, color: 'bg-foreground text-background' },
  personal: { icon: User, color: 'bg-amber-500 text-white' },
  financial: { icon: TrendingUp, color: 'bg-primary text-primary-foreground' },
  customer: { icon: Users, color: 'bg-blue-500 text-white' },
  processes: { icon: Cog, color: 'bg-success text-white' },
  learning: { icon: GraduationCap, color: 'bg-purple-500 text-white' },
};

export default function Goals() {
  const { t, currentLanguage } = useLanguage();
  const { data: goals, isLoading } = useGoals();
  const { data: keyResults } = useKeyResults();
  const createGoal = useCreateGoal();
  const createKeyResult = useCreateKeyResult();

  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Key Result Dialog
  const [krDialogOpen, setKrDialogOpen] = useState(false);
  const [krGoalId, setKrGoalId] = useState<string | null>(null);
  const [newKeyResult, setNewKeyResult] = useState({
    title: '',
    target_value: '',
    unit: '',
  });

  const tabs = [
    { id: 'all' as const, label: t('goals.category.all'), icon: LayoutGrid },
    { id: 'personal' as const, label: t('goals.category.personal'), icon: User },
    { id: 'financial' as const, label: t('goals.category.financial'), icon: TrendingUp },
    { id: 'customer' as const, label: t('goals.category.customer'), icon: Users },
    { id: 'processes' as const, label: t('goals.category.processes'), icon: Cog },
    { id: 'learning' as const, label: t('goals.category.learning'), icon: GraduationCap },
  ];

  // Stats
  const stats = useMemo(() => {
    if (!goals) return { total: 0, personal: 0, completed: 0 };
    const personal = goals.filter(g => g.perspective === 'personal').length;
    const completed = goals.filter(g => {
      const krs = keyResults?.filter(kr => kr.goal_id === g.id) || [];
      if (krs.length === 0) return false;
      const progress = krs.reduce((sum, kr) => sum + ((kr.current_value || 0) / kr.target_value * 100), 0) / krs.length;
      return progress >= 100;
    }).length;
    return { total: goals.length, personal, completed };
  }, [goals, keyResults]);

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

  const filteredGoals = useMemo(() => {
    let filtered = goals || [];
    
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(goal => goal.perspective === selectedCategory);
    }
    
    if (searchQuery) {
      filtered = filtered.filter(goal => 
        goal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        goal.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return filtered;
  }, [goals, selectedCategory, searchQuery]);

  const handleCreateGoal = async (formData: any) => {
    try {
      await createGoal.mutateAsync({
        title: formData.title,
        description: formData.description || null,
        perspective: formData.perspective,
        target_value: formData.target_value ? parseFloat(formData.target_value) : null,
        current_value: formData.current_value ? parseFloat(formData.current_value) : 0,
        unit: formData.unit || null,
        start_date: formData.start_date ? format(formData.start_date, 'yyyy-MM-dd') : null,
        end_date: formData.end_date ? format(formData.end_date, 'yyyy-MM-dd') : null,
      });
      toast.success(t('goals.goalAdded'));
      setIsDialogOpen(false);
    } catch (error) {
      toast.error(t('common.error'));
    }
  };

  const handleAddKeyResult = (goalId: string) => {
    setKrGoalId(goalId);
    setKrDialogOpen(true);
  };

  const handleCreateKeyResult = async () => {
    if (!krGoalId || !newKeyResult.title || !newKeyResult.target_value) {
      toast.error(t('common.fillAllFields'));
      return;
    }

    try {
      await createKeyResult.mutateAsync({
        goal_id: krGoalId,
        title: newKeyResult.title,
        target_value: parseFloat(newKeyResult.target_value),
        unit: newKeyResult.unit || null,
      });
      toast.success(t('goals.keyResultAdded'));
      setKrDialogOpen(false);
      setNewKeyResult({ title: '', target_value: '', unit: '' });
      setKrGoalId(null);
    } catch (error) {
      toast.error(t('common.error'));
    }
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center space-y-4">
            <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
            <p className="text-muted-foreground">{t('common.loading')}</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{t('goals.title')}</h1>
            <p className="text-muted-foreground mt-1">{t('goals.subtitle')}</p>
          </div>
          <Button 
            onClick={() => setIsDialogOpen(true)}
            className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/25"
          >
            <Plus className="w-5 h-5 me-2" />
            {t('goals.newObjective')}
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <Target className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                <p className="text-xs text-muted-foreground">{t('goals.activeGoals')}</p>
              </div>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-gradient-to-br from-amber-500/10 to-amber-500/5 border border-amber-500/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                <User className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.personal}</p>
                <p className="text-xs text-muted-foreground">{t('goals.personalGoals')}</p>
              </div>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-gradient-to-br from-success/10 to-success/5 border border-success/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-success/20 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.completed}</p>
                <p className="text-xs text-muted-foreground">{t('goals.completedGoals')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={currentLanguage === 'ar' ? 'البحث في الأهداف...' : 'Search goals...'}
              className="w-full ps-10 pe-4 py-2.5 rounded-xl bg-muted/50 border border-border/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant={viewMode === 'grid' ? 'default' : 'outline'} 
              size="icon"
              onClick={() => setViewMode('grid')}
              className="rounded-xl"
            >
              <LayoutGrid className="w-4 h-4" />
            </Button>
            <Button 
              variant={viewMode === 'list' ? 'default' : 'outline'} 
              size="icon"
              onClick={() => setViewMode('list')}
              className="rounded-xl"
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-2 px-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isSelected = selectedCategory === tab.id;
            const config = categoryConfig[tab.id];
            
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedCategory(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap',
                  isSelected 
                    ? config.color + ' shadow-lg'
                    : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Goals Grid/List */}
        {filteredGoals.length > 0 ? (
          <div className={cn(
            viewMode === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4' 
              : 'space-y-4'
          )}>
            {filteredGoals.map((goal, index) => (
              <div 
                key={goal.id} 
                className="animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <GoalCard
                  goal={goal}
                  keyResults={getGoalKeyResults(goal.id)}
                  progress={calculateProgress(goal.id)}
                  onAddKeyResult={() => handleAddKeyResult(goal.id)}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 rounded-2xl border-2 border-dashed border-border/50 bg-muted/20">
            <div className="w-20 h-20 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
              <Target className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">{t('goals.noGoals')}</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">{t('goals.noGoalsDescription')}</p>
            <Button onClick={() => setIsDialogOpen(true)} className="shadow-lg">
              <Plus className="w-5 h-5 me-2" />
              {t('goals.newObjective')}
            </Button>
          </div>
        )}
      </div>

      {/* Goal Form Dialog */}
      <GoalFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSubmit={handleCreateGoal}
        isLoading={createGoal.isPending}
      />

      {/* Key Result Dialog */}
      <Dialog open={krDialogOpen} onOpenChange={setKrDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Target className="w-5 h-5 text-primary" />
              </div>
              {t('goals.addKeyResult')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>{t('goals.keyResultTitle')}</Label>
              <Input
                value={newKeyResult.title}
                onChange={(e) => setNewKeyResult({ ...newKeyResult, title: e.target.value })}
                placeholder={currentLanguage === 'ar' ? 'مثال: قراءة 12 كتاب' : 'e.g., Read 12 books'}
                className="bg-muted/50"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('goals.targetValue')}</Label>
                <Input
                  type="number"
                  value={newKeyResult.target_value}
                  onChange={(e) => setNewKeyResult({ ...newKeyResult, target_value: e.target.value })}
                  placeholder="12"
                  className="bg-muted/50"
                />
              </div>
              <div className="space-y-2">
                <Label>{t('goals.unit')}</Label>
                <Input
                  value={newKeyResult.unit}
                  onChange={(e) => setNewKeyResult({ ...newKeyResult, unit: e.target.value })}
                  placeholder={currentLanguage === 'ar' ? 'كتاب' : 'books'}
                  className="bg-muted/50"
                />
              </div>
            </div>
            <Button 
              onClick={handleCreateKeyResult} 
              className="w-full" 
              disabled={createKeyResult.isPending}
            >
              {createKeyResult.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Plus className="w-4 h-4 me-2" />
                  {t('common.add')}
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
