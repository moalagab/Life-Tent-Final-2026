import { useState } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { 
  useProjectOkrsWithKeyResults,
  useCreateProjectOkr,
  useCreateProjectKeyResult,
  useUpdateProjectKeyResult,
  ProjectOkr
} from '@/hooks/useProjectOkrs';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { 
  Target, Plus, ChevronRight, ChevronDown, 
  Loader2, TrendingUp, Edit3 
} from 'lucide-react';

interface ProjectOkrsViewProps {
  projectId: string;
}

export function ProjectOkrsView({ projectId }: ProjectOkrsViewProps) {
  const { t, currentLanguage } = useLanguage();
  const { data: okrs, isLoading } = useProjectOkrsWithKeyResults(projectId);
  const createOkr = useCreateProjectOkr();
  const createKeyResult = useCreateProjectKeyResult();
  const updateKeyResult = useUpdateProjectKeyResult();
  
  const [isCreateOkrOpen, setIsCreateOkrOpen] = useState(false);
  const [isCreateKrOpen, setIsCreateKrOpen] = useState(false);
  const [selectedOkrId, setSelectedOkrId] = useState<string | null>(null);
  const [expandedOkrs, setExpandedOkrs] = useState<Set<string>>(new Set());
  
  const [newOkr, setNewOkr] = useState({ objective: '', description: '', quarter: 'Q1' });
  const [newKr, setNewKr] = useState({ title: '', target_value: '', unit: '' });

  const toggleOkrExpand = (okrId: string) => {
    const newExpanded = new Set(expandedOkrs);
    if (newExpanded.has(okrId)) {
      newExpanded.delete(okrId);
    } else {
      newExpanded.add(okrId);
    }
    setExpandedOkrs(newExpanded);
  };

  const handleCreateOkr = async () => {
    if (!newOkr.objective.trim()) return;
    
    try {
      await createOkr.mutateAsync({
        project_id: projectId,
        objective: newOkr.objective,
        description: newOkr.description,
        quarter: newOkr.quarter,
      });
      toast.success(t('common.success'));
      setIsCreateOkrOpen(false);
      setNewOkr({ objective: '', description: '', quarter: 'Q1' });
    } catch (error) {
      toast.error(t('common.error'));
    }
  };

  const handleCreateKeyResult = async () => {
    if (!selectedOkrId || !newKr.title.trim() || !newKr.target_value) return;
    
    try {
      await createKeyResult.mutateAsync({
        okr_id: selectedOkrId,
        title: newKr.title,
        target_value: parseFloat(newKr.target_value),
        unit: newKr.unit || null,
      });
      toast.success(t('common.success'));
      setIsCreateKrOpen(false);
      setNewKr({ title: '', target_value: '', unit: '' });
      setSelectedOkrId(null);
    } catch (error) {
      toast.error(t('common.error'));
    }
  };

  const handleUpdateProgress = async (krId: string, currentValue: number, targetValue: number) => {
    const newValue = Math.min(currentValue + (targetValue * 0.1), targetValue);
    try {
      await updateKeyResult.mutateAsync({ id: krId, current_value: newValue });
    } catch (error) {
      toast.error(t('common.error'));
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <Target className="w-5 h-5 text-primary" />
          {currentLanguage === 'ar' ? 'الأهداف والنتائج الرئيسية (OKRs)' : 'Objectives & Key Results'}
        </h3>
        <Button size="sm" onClick={() => setIsCreateOkrOpen(true)}>
          <Plus className="w-4 h-4 me-1" />
          {currentLanguage === 'ar' ? 'هدف جديد' : 'New Objective'}
        </Button>
      </div>

      {okrs && okrs.length > 0 ? (
        <div className="space-y-3">
          {okrs.map((okr: ProjectOkr & { calculatedProgress: number }) => {
            const isExpanded = expandedOkrs.has(okr.id);
            const keyResults = okr.key_results || [];
            
            return (
              <div key={okr.id} className="glass-card overflow-hidden">
                {/* OKR Header */}
                <div 
                  className="flex items-center gap-3 p-4 cursor-pointer hover:bg-muted/20 transition-colors"
                  onClick={() => toggleOkrExpand(okr.id)}
                >
                  <button className="text-muted-foreground">
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </button>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-foreground">{okr.objective}</h4>
                      {okr.quarter && (
                        <span className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary">
                          {okr.quarter}
                        </span>
                      )}
                    </div>
                    {okr.description && (
                      <p className="text-sm text-muted-foreground mt-0.5">{okr.description}</p>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-sm font-medium text-foreground">
                        {okr.calculatedProgress}%
                      </span>
                      <div className="w-24">
                        <Progress value={okr.calculatedProgress} className="h-1.5" />
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Key Results */}
                {isExpanded && (
                  <div className="border-t border-border/50 bg-muted/10 p-4 space-y-3">
                    {keyResults.length > 0 ? (
                      keyResults.map((kr: any) => {
                        const progress = kr.target_value > 0 
                          ? Math.round((kr.current_value / kr.target_value) * 100) 
                          : 0;
                        
                        return (
                          <div key={kr.id} className="flex items-center gap-3 p-3 rounded-lg bg-background/50">
                            <TrendingUp className="w-4 h-4 text-success shrink-0" />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-foreground">{kr.title}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Progress value={progress} className="h-1.5 flex-1" />
                                <span className="text-xs text-muted-foreground whitespace-nowrap">
                                  {kr.current_value || 0} / {kr.target_value} {kr.unit || ''}
                                </span>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleUpdateProgress(kr.id, kr.current_value || 0, kr.target_value)}
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-2">
                        {currentLanguage === 'ar' ? 'لا توجد نتائج رئيسية' : 'No key results yet'}
                      </p>
                    )}
                    
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        setSelectedOkrId(okr.id);
                        setIsCreateKrOpen(true);
                      }}
                    >
                      <Plus className="w-4 h-4 me-1" />
                      {currentLanguage === 'ar' ? 'نتيجة رئيسية جديدة' : 'Add Key Result'}
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8 bg-muted/20 rounded-xl">
          <Target className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
          <p className="text-muted-foreground">
            {currentLanguage === 'ar' ? 'لا توجد أهداف بعد' : 'No objectives yet'}
          </p>
          <Button 
            variant="outline" 
            className="mt-3"
            onClick={() => setIsCreateOkrOpen(true)}
          >
            <Plus className="w-4 h-4 me-1" />
            {currentLanguage === 'ar' ? 'إضافة هدف' : 'Add Objective'}
          </Button>
        </div>
      )}

      {/* Create OKR Dialog */}
      <Dialog open={isCreateOkrOpen} onOpenChange={setIsCreateOkrOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {currentLanguage === 'ar' ? 'هدف جديد' : 'New Objective'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>{currentLanguage === 'ar' ? 'الهدف' : 'Objective'}</Label>
              <Input
                value={newOkr.objective}
                onChange={(e) => setNewOkr({ ...newOkr, objective: e.target.value })}
                placeholder={currentLanguage === 'ar' ? 'مثال: زيادة الإيرادات' : 'e.g., Increase revenue'}
              />
            </div>
            <div>
              <Label>{currentLanguage === 'ar' ? 'الوصف' : 'Description'}</Label>
              <Textarea
                value={newOkr.description}
                onChange={(e) => setNewOkr({ ...newOkr, description: e.target.value })}
                placeholder={currentLanguage === 'ar' ? 'وصف الهدف' : 'Describe the objective'}
                rows={2}
              />
            </div>
            <div>
              <Label>{currentLanguage === 'ar' ? 'الربع' : 'Quarter'}</Label>
              <Input
                value={newOkr.quarter}
                onChange={(e) => setNewOkr({ ...newOkr, quarter: e.target.value })}
                placeholder="Q1, Q2, Q3, Q4"
              />
            </div>
            <Button onClick={handleCreateOkr} className="w-full" disabled={createOkr.isPending}>
              {createOkr.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : t('common.save')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Key Result Dialog */}
      <Dialog open={isCreateKrOpen} onOpenChange={setIsCreateKrOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {currentLanguage === 'ar' ? 'نتيجة رئيسية جديدة' : 'New Key Result'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>{currentLanguage === 'ar' ? 'العنوان' : 'Title'}</Label>
              <Input
                value={newKr.title}
                onChange={(e) => setNewKr({ ...newKr, title: e.target.value })}
                placeholder={currentLanguage === 'ar' ? 'مثال: زيادة المبيعات بنسبة 20%' : 'e.g., Increase sales by 20%'}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{currentLanguage === 'ar' ? 'القيمة المستهدفة' : 'Target Value'}</Label>
                <Input
                  type="number"
                  value={newKr.target_value}
                  onChange={(e) => setNewKr({ ...newKr, target_value: e.target.value })}
                  placeholder="100"
                />
              </div>
              <div>
                <Label>{currentLanguage === 'ar' ? 'الوحدة' : 'Unit'}</Label>
                <Input
                  value={newKr.unit}
                  onChange={(e) => setNewKr({ ...newKr, unit: e.target.value })}
                  placeholder="%، ر.س، عميل"
                />
              </div>
            </div>
            <Button onClick={handleCreateKeyResult} className="w-full" disabled={createKeyResult.isPending}>
              {createKeyResult.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : t('common.save')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
