import { useState } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { 
  usePlanningPipelines, 
  useCreatePlanningPipeline, 
  useUpdatePlanningPipeline,
  useDeletePlanningPipeline,
  useConvertToProject,
  PlanningPipeline 
} from '@/hooks/usePlanningPipeline';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { 
  Plus, Loader2, ChevronRight, CheckCircle, Circle, 
  Lightbulb, Search, DollarSign, Settings, Target,
  Trash2, Play, X, ArrowRight
} from 'lucide-react';
import { format } from 'date-fns';

const STAGES = [
  { id: 1, key: 'strategy', title: 'Strategy & Direction', titleAr: 'الاستراتيجية والاتجاه', subtitle: 'Where & Why', icon: Target },
  { id: 2, key: 'validation', title: 'Validation', titleAr: 'التحقق', subtitle: 'Should we build?', icon: Search },
  { id: 3, key: 'business', title: 'Business Model', titleAr: 'نموذج العمل', subtitle: 'How we make money', icon: DollarSign },
  { id: 4, key: 'feasibility', title: 'Feasibility', titleAr: 'الجدوى', subtitle: 'Can we survive?', icon: Settings },
  { id: 5, key: 'decision', title: 'Go / No-Go', titleAr: 'قرار التنفيذ', subtitle: 'Kill or commit', icon: Lightbulb },
];

export function PlanningPipelineView() {
  const { t, currentLanguage } = useLanguage();
  const { data: pipelines, isLoading } = usePlanningPipelines();
  const createPipeline = useCreatePlanningPipeline();
  const updatePipeline = useUpdatePlanningPipeline();
  const deletePipeline = useDeletePlanningPipeline();
  const convertToProject = useConvertToProject();
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedPipeline, setSelectedPipeline] = useState<PlanningPipeline | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    
    try {
      await createPipeline.mutateAsync({ 
        title: newTitle, 
        description: newDescription,
        current_stage: 1
      });
      toast.success(t('common.success'));
      setIsCreateOpen(false);
      setNewTitle('');
      setNewDescription('');
    } catch (error) {
      toast.error(t('common.error'));
    }
  };

  const handleConvert = async (pipeline: PlanningPipeline) => {
    try {
      await convertToProject.mutateAsync(pipeline.id);
      toast.success(t('common.success'));
      setSelectedPipeline(null);
    } catch (error) {
      toast.error(t('common.error'));
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deletePipeline.mutateAsync(id);
      toast.success(t('common.success'));
      setSelectedPipeline(null);
    } catch (error) {
      toast.error(t('common.error'));
    }
  };

  const getPipelinesForStage = (stage: number) => {
    return pipelines?.filter(p => p.current_stage === stage && p.status !== 'converted') || [];
  };

  const getStageProgress = (pipeline: PlanningPipeline) => {
    const completedStages = [
      pipeline.strategy_completed,
      pipeline.validation_completed,
      pipeline.business_completed,
      pipeline.feasibility_completed,
      pipeline.decision === 'go' || pipeline.decision === 'no_go',
    ].filter(Boolean).length;
    return (completedStages / 5) * 100;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">
            {currentLanguage === 'ar' ? 'خط أنابيب التخطيط' : 'Planning Pipeline'}
          </h2>
          <p className="text-sm text-muted-foreground">
            {currentLanguage === 'ar' 
              ? 'المشاريع في مرحلة التأسيس والتخطيط' 
              : 'Projects in ideation and planning phase'}
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="w-4 h-4 me-2" />
          {currentLanguage === 'ar' ? 'فكرة جديدة' : 'New Idea'}
        </Button>
      </div>

      {/* Pipeline Stages */}
      <div className="grid gap-4">
        {STAGES.map((stage, index) => {
          const Icon = stage.icon;
          const stagePipelines = getPipelinesForStage(stage.id);
          
          return (
            <div key={stage.id} className="glass-card p-4">
              {/* Stage Header */}
              <div className="flex items-center gap-3 mb-4">
                <div className={cn(
                  'w-10 h-10 rounded-xl flex items-center justify-center',
                  stagePipelines.length > 0 
                    ? 'bg-primary/10 text-primary' 
                    : 'bg-muted text-muted-foreground'
                )}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-muted-foreground">
                      {stage.id})
                    </span>
                    <h3 className="font-semibold text-foreground">
                      {currentLanguage === 'ar' ? stage.titleAr : stage.title}
                    </h3>
                  </div>
                  <p className="text-xs text-muted-foreground">{stage.subtitle}</p>
                </div>
                <span className="text-sm font-medium text-muted-foreground">
                  {stagePipelines.length}
                </span>
              </div>

              {/* Pipeline Items */}
              {stagePipelines.length > 0 ? (
                <div className="grid gap-2">
                  {stagePipelines.map((pipeline) => (
                    <div
                      key={pipeline.id}
                      onClick={() => setSelectedPipeline(pipeline)}
                      className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 cursor-pointer transition-colors group"
                    >
                      <div className="flex-1">
                        <h4 className="font-medium text-foreground group-hover:text-primary transition-colors">
                          {pipeline.title}
                        </h4>
                        {pipeline.description && (
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {pipeline.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-gold rounded-full"
                            style={{ width: `${getStageProgress(pipeline)}%` }}
                          />
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-2">
                  {currentLanguage === 'ar' ? 'لا توجد مشاريع في هذه المرحلة' : 'No projects in this stage'}
                </p>
              )}
              
              {index < STAGES.length - 1 && (
                <div className="flex justify-center mt-3">
                  <ArrowRight className="w-4 h-4 text-muted-foreground/50 rotate-90" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {currentLanguage === 'ar' ? 'فكرة مشروع جديدة' : 'New Project Idea'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>{currentLanguage === 'ar' ? 'عنوان الفكرة' : 'Idea Title'}</Label>
              <Input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder={currentLanguage === 'ar' ? 'مثال: تطبيق إدارة المهام' : 'e.g., Task Management App'}
              />
            </div>
            <div>
              <Label>{currentLanguage === 'ar' ? 'الوصف' : 'Description'}</Label>
              <Textarea
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder={currentLanguage === 'ar' ? 'وصف مختصر للفكرة' : 'Brief description of the idea'}
                rows={3}
              />
            </div>
            <Button onClick={handleCreate} className="w-full" disabled={createPipeline.isPending}>
              {createPipeline.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Plus className="w-4 h-4 me-2" />
                  {currentLanguage === 'ar' ? 'إضافة' : 'Add'}
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Pipeline Detail Dialog */}
      <PipelineDetailDialog
        pipeline={selectedPipeline}
        onClose={() => setSelectedPipeline(null)}
        onUpdate={updatePipeline.mutateAsync}
        onDelete={handleDelete}
        onConvert={handleConvert}
        isConverting={convertToProject.isPending}
      />
    </div>
  );
}

interface PipelineDetailDialogProps {
  pipeline: PlanningPipeline | null;
  onClose: () => void;
  onUpdate: (data: Partial<PlanningPipeline> & { id: string }) => Promise<unknown>;
  onDelete: (id: string) => void;
  onConvert: (pipeline: PlanningPipeline) => void;
  isConverting: boolean;
}

function PipelineDetailDialog({ pipeline, onClose, onUpdate, onDelete, onConvert, isConverting }: PipelineDetailDialogProps) {
  const { currentLanguage } = useLanguage();
  const [activeStage, setActiveStage] = useState(1);
  const [formData, setFormData] = useState<Partial<PlanningPipeline>>({});

  if (!pipeline) return null;

  const handleFieldChange = async (field: keyof PlanningPipeline, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      await onUpdate({ id: pipeline.id, ...formData });
      toast.success('تم الحفظ');
    } catch (error) {
      toast.error('خطأ في الحفظ');
    }
  };

  const handleStageComplete = async (stageKey: string) => {
    const completedField = `${stageKey}_completed` as keyof PlanningPipeline;
    const nextStage = Math.min(activeStage + 1, 5);
    
    try {
      await onUpdate({ 
        id: pipeline.id, 
        [completedField]: true,
        current_stage: nextStage,
        ...formData
      });
      setActiveStage(nextStage);
      toast.success('تم إكمال المرحلة');
    } catch (error) {
      toast.error('خطأ');
    }
  };

  const currentStage = STAGES[activeStage - 1];
  const Icon = currentStage.icon;

  return (
    <Dialog open={!!pipeline} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className="w-5 h-5 text-primary" />
            {pipeline.title}
          </DialogTitle>
        </DialogHeader>

        {/* Stage Navigation */}
        <div className="flex items-center gap-1 mb-6 overflow-x-auto pb-2">
          {STAGES.map((stage) => {
            const isCompleted = stage.id < (pipeline.current_stage || 1);
            const isCurrent = stage.id === activeStage;
            
            return (
              <button
                key={stage.id}
                onClick={() => setActiveStage(stage.id)}
                className={cn(
                  'flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors',
                  isCurrent 
                    ? 'bg-primary text-primary-foreground' 
                    : isCompleted
                      ? 'bg-success/10 text-success'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                )}
              >
                {isCompleted ? (
                  <CheckCircle className="w-3 h-3" />
                ) : (
                  <Circle className="w-3 h-3" />
                )}
                {stage.id}
              </button>
            );
          })}
        </div>

        {/* Stage Content */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Icon className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">
              {currentLanguage === 'ar' ? currentStage.titleAr : currentStage.title}
            </h3>
            <span className="text-xs text-muted-foreground">({currentStage.subtitle})</span>
          </div>

          {activeStage === 1 && (
            <>
              <div>
                <Label>الرؤية</Label>
                <Textarea
                  defaultValue={pipeline.strategy_vision || ''}
                  onChange={(e) => handleFieldChange('strategy_vision', e.target.value)}
                  placeholder="ما هي الرؤية النهائية؟"
                  rows={3}
                />
              </div>
              <div>
                <Label>لماذا؟ (Why)</Label>
                <Textarea
                  defaultValue={pipeline.strategy_why || ''}
                  onChange={(e) => handleFieldChange('strategy_why', e.target.value)}
                  placeholder="لماذا هذا المشروع مهم؟"
                  rows={2}
                />
              </div>
              <div>
                <Label>إلى أين؟ (Where)</Label>
                <Textarea
                  defaultValue={pipeline.strategy_where || ''}
                  onChange={(e) => handleFieldChange('strategy_where', e.target.value)}
                  placeholder="أين نريد أن نصل؟"
                  rows={2}
                />
              </div>
            </>
          )}

          {activeStage === 2 && (
            <>
              <div>
                <Label>المشكلة</Label>
                <Textarea
                  defaultValue={pipeline.validation_problem || ''}
                  onChange={(e) => handleFieldChange('validation_problem', e.target.value)}
                  placeholder="ما هي المشكلة التي نحلها؟"
                  rows={3}
                />
              </div>
              <div>
                <Label>الحل</Label>
                <Textarea
                  defaultValue={pipeline.validation_solution || ''}
                  onChange={(e) => handleFieldChange('validation_solution', e.target.value)}
                  placeholder="كيف نحل هذه المشكلة؟"
                  rows={2}
                />
              </div>
              <div>
                <Label>السوق المستهدف</Label>
                <Textarea
                  defaultValue={pipeline.validation_target_market || ''}
                  onChange={(e) => handleFieldChange('validation_target_market', e.target.value)}
                  placeholder="من هم العملاء المستهدفون؟"
                  rows={2}
                />
              </div>
            </>
          )}

          {activeStage === 3 && (
            <>
              <div>
                <Label>نموذج الإيرادات</Label>
                <Textarea
                  defaultValue={pipeline.business_revenue_model || ''}
                  onChange={(e) => handleFieldChange('business_revenue_model', e.target.value)}
                  placeholder="كيف سنجني المال؟"
                  rows={3}
                />
              </div>
              <div>
                <Label>هيكل التكاليف</Label>
                <Textarea
                  defaultValue={pipeline.business_cost_structure || ''}
                  onChange={(e) => handleFieldChange('business_cost_structure', e.target.value)}
                  placeholder="ما هي التكاليف المتوقعة؟"
                  rows={2}
                />
              </div>
              <div>
                <Label>القيمة المقدمة</Label>
                <Textarea
                  defaultValue={pipeline.business_value_proposition || ''}
                  onChange={(e) => handleFieldChange('business_value_proposition', e.target.value)}
                  placeholder="ما القيمة التي نقدمها للعملاء؟"
                  rows={2}
                />
              </div>
            </>
          )}

          {activeStage === 4 && (
            <>
              <div>
                <Label>الجدوى التقنية</Label>
                <Textarea
                  defaultValue={pipeline.feasibility_technical || ''}
                  onChange={(e) => handleFieldChange('feasibility_technical', e.target.value)}
                  placeholder="هل لدينا القدرة التقنية؟"
                  rows={2}
                />
              </div>
              <div>
                <Label>الجدوى المالية</Label>
                <Textarea
                  defaultValue={pipeline.feasibility_financial || ''}
                  onChange={(e) => handleFieldChange('feasibility_financial', e.target.value)}
                  placeholder="هل المشروع مجدي ماليا؟"
                  rows={2}
                />
              </div>
              <div>
                <Label>الجدول الزمني</Label>
                <Textarea
                  defaultValue={pipeline.feasibility_timeline || ''}
                  onChange={(e) => handleFieldChange('feasibility_timeline', e.target.value)}
                  placeholder="كم يستغرق التنفيذ؟"
                  rows={2}
                />
              </div>
              <div>
                <Label>الموارد المطلوبة</Label>
                <Textarea
                  defaultValue={pipeline.feasibility_resources || ''}
                  onChange={(e) => handleFieldChange('feasibility_resources', e.target.value)}
                  placeholder="ما الموارد التي نحتاجها؟"
                  rows={2}
                />
              </div>
            </>
          )}

          {activeStage === 5 && (
            <>
              <div>
                <Label>القرار</Label>
                <div className="flex gap-2 mt-2">
                  <Button
                    variant={formData.decision === 'go' || (!formData.decision && pipeline.decision === 'go') ? 'default' : 'outline'}
                    onClick={() => handleFieldChange('decision', 'go')}
                    className="flex-1"
                  >
                    <Play className="w-4 h-4 me-2" />
                    GO - تنفيذ
                  </Button>
                  <Button
                    variant={formData.decision === 'no_go' || (!formData.decision && pipeline.decision === 'no_go') ? 'destructive' : 'outline'}
                    onClick={() => handleFieldChange('decision', 'no_go')}
                    className="flex-1"
                  >
                    <X className="w-4 h-4 me-2" />
                    NO-GO - إلغاء
                  </Button>
                </div>
              </div>
              <div>
                <Label>ملاحظات القرار</Label>
                <Textarea
                  defaultValue={pipeline.decision_notes || ''}
                  onChange={(e) => handleFieldChange('decision_notes', e.target.value)}
                  placeholder="أسباب القرار..."
                  rows={3}
                />
              </div>
            </>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between gap-2 mt-6 pt-4 border-t">
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive"
            onClick={() => onDelete(pipeline.id)}
          >
            <Trash2 className="w-4 h-4 me-1" />
            حذف
          </Button>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleSave}>
              حفظ
            </Button>
            
            {activeStage < 5 && (
              <Button onClick={() => handleStageComplete(STAGES[activeStage - 1].key)}>
                <CheckCircle className="w-4 h-4 me-2" />
                إكمال المرحلة
              </Button>
            )}
            
            {activeStage === 5 && (formData.decision === 'go' || pipeline.decision === 'go') && (
              <Button 
                onClick={() => onConvert(pipeline)}
                disabled={isConverting}
                className="bg-success hover:bg-success/90"
              >
                {isConverting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <ArrowRight className="w-4 h-4 me-2" />
                    تحويل لمشروع
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
