import { useState } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { useCreateProject } from '@/hooks/useProjects';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Loader2, Target, Eye, DollarSign } from 'lucide-react';

interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type ParaCategory = 'project' | 'area' | 'resource' | 'archive';
type ProjectPhase = 'initiation' | 'planning' | 'execution' | 'monitoring' | 'closing';

const colorOptions = [
  '#FFB400', '#10B981', '#3B82F6', '#8B5CF6', 
  '#EC4899', '#EF4444', '#F97316', '#06B6D4'
];

export function CreateProjectDialog({ open, onOpenChange }: CreateProjectDialogProps) {
  const { t } = useLanguage();
  const createProject = useCreateProject();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    phase: 'initiation' as ProjectPhase,
    para_category: 'project' as ParaCategory,
    color: '#FFB400',
    vision: '',
    investment_notes: '',
    expected_roi: '',
    risk_level: 'medium',
    due_date: '',
    start_date: '',
    scope: '',
    outputs: '',
    owner: '',
    risks: '',
  });

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      toast.error(t('common.fillAllFields'));
      return;
    }
    
    try {
      await createProject.mutateAsync({
        title: formData.title,
        description: formData.description || null,
        phase: formData.phase,
        para_category: formData.para_category,
        color: formData.color,
        vision: formData.vision || null,
        investment_notes: formData.investment_notes || null,
        expected_roi: formData.expected_roi || null,
        risk_level: formData.risk_level,
        due_date: formData.due_date || null,
        start_date: formData.start_date || null,
        scope: formData.scope || null,
        outputs: formData.outputs || null,
        owner: formData.owner || null,
        risks: formData.risks || null,
      });
      toast.success(t('projects.projectAdded'));
      onOpenChange(false);
      setFormData({
        title: '',
        description: '',
        phase: 'initiation',
        para_category: 'project',
        color: '#FFB400',
        vision: '',
        investment_notes: '',
        expected_roi: '',
        risk_level: 'medium',
        due_date: '',
        start_date: '',
        scope: '',
        outputs: '',
        owner: '',
        risks: '',
      });
    } catch (error) {
      toast.error(t('common.error'));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            {t('projects.newProject')}
          </DialogTitle>
          <DialogDescription>
            {t('projects.subtitle')}
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="basic" className="mt-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">الأساسيات</TabsTrigger>
            <TabsTrigger value="scope">النطاق</TabsTrigger>
            <TabsTrigger value="vision">الرؤية</TabsTrigger>
            <TabsTrigger value="investment">الاستثمار</TabsTrigger>
          </TabsList>
          
          <TabsContent value="basic" className="space-y-4 mt-4">
            <div>
              <Label>{t('projects.title')}</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="اسم المشروع"
              />
            </div>
            
            <div>
              <Label>الوصف</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="وصف المشروع"
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>التصنيف (PARA)</Label>
                <Select
                  value={formData.para_category}
                  onValueChange={(value: ParaCategory) => setFormData({ ...formData, para_category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="project">{t('common.projects')}</SelectItem>
                    <SelectItem value="area">{t('projects.areas')}</SelectItem>
                    <SelectItem value="resource">{t('projects.resources')}</SelectItem>
                    <SelectItem value="archive">{t('projects.archives')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>المرحلة (PMP)</Label>
                <Select
                  value={formData.phase}
                  onValueChange={(value: ProjectPhase) => setFormData({ ...formData, phase: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="initiation">{t('projects.phase.initiation')}</SelectItem>
                    <SelectItem value="planning">{t('projects.phase.planning')}</SelectItem>
                    <SelectItem value="execution">{t('projects.phase.execution')}</SelectItem>
                    <SelectItem value="monitoring">{t('projects.phase.monitoring')}</SelectItem>
                    <SelectItem value="closing">{t('projects.phase.closing')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>تاريخ البدء</Label>
                <Input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                />
              </div>
              <div>
                <Label>تاريخ الاستحقاق</Label>
                <Input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                />
              </div>
            </div>
            
            <div>
              <Label>المالك</Label>
              <Input
                value={formData.owner}
                onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
                placeholder="اسم مالك المشروع"
              />
            </div>
            
            <div>
              <Label>اللون</Label>
              <div className="flex gap-2 mt-2">
                {colorOptions.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFormData({ ...formData, color })}
                    className={`w-8 h-8 rounded-full transition-all ${
                      formData.color === color ? 'ring-2 ring-offset-2 ring-primary scale-110' : ''
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="scope" className="space-y-4 mt-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
              <Target className="w-4 h-4" />
              <span>حدد نطاق المشروع ومخرجاته والمخاطر المحتملة</span>
            </div>
            
            <div>
              <Label>نطاق المشروع</Label>
              <Textarea
                value={formData.scope}
                onChange={(e) => setFormData({ ...formData, scope: e.target.value })}
                placeholder="ما هو نطاق هذا المشروع؟ ما الذي يشمله وما الذي لا يشمله؟"
                rows={3}
              />
            </div>
            
            <div>
              <Label>المخرجات المتوقعة</Label>
              <Textarea
                value={formData.outputs}
                onChange={(e) => setFormData({ ...formData, outputs: e.target.value })}
                placeholder="ما هي المخرجات والتسليمات المتوقعة؟"
                rows={3}
              />
            </div>
            
            <div>
              <Label>المخاطر المحتملة</Label>
              <Textarea
                value={formData.risks}
                onChange={(e) => setFormData({ ...formData, risks: e.target.value })}
                placeholder="ما هي المخاطر المحتملة وكيف يمكن التعامل معها؟"
                rows={3}
              />
            </div>
          </TabsContent>

          <TabsContent value="vision" className="space-y-4 mt-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
              <Eye className="w-4 h-4" />
              <span>حدد رؤية واضحة للمشروع - أين تريد أن تصل؟</span>
            </div>
            
            <div>
              <Label>الرؤية</Label>
              <Textarea
                value={formData.vision}
                onChange={(e) => setFormData({ ...formData, vision: e.target.value })}
                placeholder="ما هي الرؤية النهائية لهذا المشروع؟"
                rows={4}
              />
            </div>
          </TabsContent>
          
          <TabsContent value="investment" className="space-y-4 mt-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
              <DollarSign className="w-4 h-4" />
              <span>حدد الاستثمار المطلوب والعائد المتوقع</span>
            </div>
            
            <div>
              <Label>ملاحظات الاستثمار</Label>
              <Textarea
                value={formData.investment_notes}
                onChange={(e) => setFormData({ ...formData, investment_notes: e.target.value })}
                placeholder="ما هي الموارد المطلوبة؟"
                rows={3}
              />
            </div>
            
            <div>
              <Label>العائد المتوقع (ROI)</Label>
              <Input
                value={formData.expected_roi}
                onChange={(e) => setFormData({ ...formData, expected_roi: e.target.value })}
                placeholder="مثال: 200% خلال سنة"
              />
            </div>
            
            <div>
              <Label>مستوى المخاطرة</Label>
              <Select
                value={formData.risk_level}
                onValueChange={(value) => setFormData({ ...formData, risk_level: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">منخفض</SelectItem>
                  <SelectItem value="medium">متوسط</SelectItem>
                  <SelectItem value="high">عالي</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </TabsContent>
        </Tabs>
        
        <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={createProject.isPending}>
            {createProject.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              t('common.save')
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
