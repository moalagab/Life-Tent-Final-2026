import React, { useState } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { useCreateProject } from '@/hooks/useProjects';
import { ResponsiveSheet } from '@/components/ui/responsive-sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, FolderKanban } from 'lucide-react';
import { cn } from '@/lib/utils';

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

const EMPTY = {
  title: '', description: '', phase: 'initiation' as ProjectPhase,
  para_category: 'project' as ParaCategory, color: '#FFB400', vision: '',
  investment_notes: '', expected_roi: '', risk_level: 'medium',
  due_date: '', start_date: '', scope: '', outputs: '', owner: '', risks: '',
};

export function CreateProjectDialog({ open, onOpenChange }: CreateProjectDialogProps) {
  const { t, currentLanguage } = useLanguage();
  const ar = currentLanguage === 'ar';
  const createProject = useCreateProject();
  const [formData, setFormData] = useState({ ...EMPTY });
  const set = (patch: Partial<typeof EMPTY>) => setFormData(p => ({ ...p, ...patch }));

  const handleSubmit = async () => {
    if (!formData.title.trim()) { toast.error(t('common.fillAllFields')); return; }
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
      setFormData({ ...EMPTY });
    } catch { toast.error(t('common.error')); }
  };

  const SectionLabel = ({ children }: { children: React.ReactNode }) => (
    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70 mt-5 mb-2">{children}</p>
  );

  const titleNode = (
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-indigo-500/5 flex items-center justify-center shrink-0">
        <FolderKanban className="w-5 h-5 text-purple-500" />
      </div>
      <div>
        <span className="block font-bold">{t('projects.newProject')}</span>
        <span className="text-xs font-normal text-muted-foreground">{t('projects.subtitle')}</span>
      </div>
    </div>
  );

  return (
    <ResponsiveSheet open={open} onOpenChange={onOpenChange} title={titleNode}>
      <div className="space-y-3 pb-4">
        {/* Basics */}
        <SectionLabel>{ar ? 'الأساسيات' : 'Basics'}</SectionLabel>

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-muted-foreground">{t('projects.title')}</Label>
          <Input value={formData.title} onChange={(e) => set({ title: e.target.value })}
            placeholder={ar ? 'اسم المشروع' : 'Project name'}
            className="bg-muted/50 border-border/50" dir="auto" />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-muted-foreground">{ar ? 'الوصف' : 'Description'}</Label>
          <Textarea value={formData.description} onChange={(e) => set({ description: e.target.value })}
            placeholder={ar ? 'وصف المشروع' : 'Project description'} rows={2}
            className="bg-muted/50 border-border/50 resize-none" dir="auto" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground">{ar ? 'التصنيف (PARA)' : 'Category (PARA)'}</Label>
            <Select value={formData.para_category} onValueChange={(v: ParaCategory) => set({ para_category: v })}>
              <SelectTrigger className="bg-muted/50 border-border/50"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="project">{t('common.projects')}</SelectItem>
                <SelectItem value="area">{t('projects.areas')}</SelectItem>
                <SelectItem value="resource">{t('projects.resources')}</SelectItem>
                <SelectItem value="archive">{t('projects.archives')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground">{ar ? 'المرحلة (PMP)' : 'Phase (PMP)'}</Label>
            <Select value={formData.phase} onValueChange={(v: ProjectPhase) => set({ phase: v })}>
              <SelectTrigger className="bg-muted/50 border-border/50"><SelectValue /></SelectTrigger>
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground">{ar ? 'تاريخ البدء' : 'Start Date'}</Label>
            <Input type="date" value={formData.start_date} onChange={(e) => set({ start_date: e.target.value })} className="bg-muted/50 border-border/50" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground">{ar ? 'تاريخ الاستحقاق' : 'Due Date'}</Label>
            <Input type="date" value={formData.due_date} onChange={(e) => set({ due_date: e.target.value })} className="bg-muted/50 border-border/50" />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-muted-foreground">{ar ? 'المالك' : 'Owner'}</Label>
          <Input value={formData.owner} onChange={(e) => set({ owner: e.target.value })}
            placeholder={ar ? 'اسم مالك المشروع' : 'Project owner'} className="bg-muted/50 border-border/50" />
        </div>

        {/* Color */}
        <div className="space-y-2">
          <Label className="text-xs font-semibold text-muted-foreground">{ar ? 'اللون' : 'Color'}</Label>
          <div className="flex gap-2 flex-wrap">
            {colorOptions.map(c => (
              <button key={c} type="button" onClick={() => set({ color: c })}
                className={cn('w-8 h-8 rounded-full transition-all active:scale-95', formData.color === c && 'ring-2 ring-offset-2 ring-primary scale-110')}
                style={{ backgroundColor: c }} />
            ))}
          </div>
        </div>

        {/* Scope */}
        <SectionLabel>{ar ? 'النطاق' : 'Scope'}</SectionLabel>
        <Textarea value={formData.scope} onChange={(e) => set({ scope: e.target.value })}
          placeholder={ar ? 'نطاق المشروع...' : 'Project scope...'} rows={2}
          className="bg-muted/50 border-border/50 resize-none" dir="auto" />
        <Textarea value={formData.outputs} onChange={(e) => set({ outputs: e.target.value })}
          placeholder={ar ? 'المخرجات المتوقعة...' : 'Expected outputs...'} rows={2}
          className="bg-muted/50 border-border/50 resize-none" dir="auto" />

        {/* Vision */}
        <SectionLabel>{ar ? 'الرؤية' : 'Vision'}</SectionLabel>
        <Textarea value={formData.vision} onChange={(e) => set({ vision: e.target.value })}
          placeholder={ar ? 'الرؤية النهائية للمشروع...' : 'Final project vision...'} rows={2}
          className="bg-muted/50 border-border/50 resize-none" dir="auto" />

        {/* Investment */}
        <SectionLabel>{ar ? 'الاستثمار' : 'Investment'}</SectionLabel>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input value={formData.expected_roi} onChange={(e) => set({ expected_roi: e.target.value })}
            placeholder={ar ? 'العائد المتوقع (ROI)' : 'Expected ROI'} className="bg-muted/50 border-border/50" />
          <Select value={formData.risk_level} onValueChange={(v) => set({ risk_level: v })}>
            <SelectTrigger className="bg-muted/50 border-border/50"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="low">{ar ? 'منخفض' : 'Low'}</SelectItem>
              <SelectItem value="medium">{ar ? 'متوسط' : 'Medium'}</SelectItem>
              <SelectItem value="high">{ar ? 'عالي' : 'High'}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Textarea value={formData.investment_notes} onChange={(e) => set({ investment_notes: e.target.value })}
          placeholder={ar ? 'ملاحظات الاستثمار...' : 'Investment notes...'} rows={2}
          className="bg-muted/50 border-border/50 resize-none" dir="auto" />

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>{t('common.cancel')}</Button>
          <Button className="flex-1 h-11 font-semibold" onClick={handleSubmit} disabled={createProject.isPending}>
            {createProject.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : t('common.save')}
          </Button>
        </div>
      </div>
    </ResponsiveSheet>
  );
}
