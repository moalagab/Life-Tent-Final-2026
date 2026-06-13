import { useState } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { useAreas, useCreateArea, useUpdateArea, useArchiveArea, useRestoreArea, useDeleteArea, Area } from '@/hooks/useAreas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ResponsiveSheet } from '@/components/ui/responsive-sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Plus, MoreVertical, Pencil, Archive, RotateCcw, Trash2, Layers, Calendar, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';
import { AreasDashboard } from './AreasDashboard';
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';

const colorOptions = [
  '#1D3672', '#2563EB', '#7C3AED', '#A855F7',
  '#EC4899', '#EF4444', '#F59E0B', '#10B981',
  '#14B8A6', '#06B6D4',
];

const cadenceOptions = [
  { value: 'weekly',    label: 'أسبوعي' },
  { value: 'monthly',   label: 'شهري' },
  { value: 'quarterly', label: 'ربع سنوي' },
  { value: 'yearly',    label: 'سنوي' },
];

export function AreasView() {
  const { t } = useLanguage();
  const [showArchived, setShowArchived]   = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [isDialogOpen, setIsDialogOpen]   = useState(false);
  const [editingArea, setEditingArea]     = useState<Area | null>(null);
  const [deleteId, setDeleteId]           = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#1D3672',
    review_cadence: 'monthly' as string,
  });

  useRealtimeSubscription({ table: 'areas', queryKey: ['areas'] });

  const { data: areas, isLoading } = useAreas(showArchived);
  const createArea  = useCreateArea();
  const updateArea  = useUpdateArea();
  const archiveArea = useArchiveArea();
  const restoreArea = useRestoreArea();
  const deleteArea  = useDeleteArea();

  const resetForm = () => {
    setFormData({ name: '', description: '', color: '#1D3672', review_cadence: 'monthly' });
    setEditingArea(null);
  };

  const handleOpenDialog = (area?: Area) => {
    if (area) {
      setEditingArea(area);
      setFormData({
        name: area.name,
        description: area.description || '',
        color: area.color || '#1D3672',
        review_cadence: area.review_cadence || 'monthly',
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) { toast.error('الاسم مطلوب'); return; }
    try {
      if (editingArea) {
        await updateArea.mutateAsync({ id: editingArea.id, ...formData });
        toast.success('تم تحديث المجال بنجاح');
      } else {
        await createArea.mutateAsync(formData);
        toast.success('تم إنشاء المجال بنجاح');
      }
      setIsDialogOpen(false);
      resetForm();
    } catch { toast.error('حدث خطأ'); }
  };

  const handleArchive = async (id: string) => {
    try { await archiveArea.mutateAsync(id); toast.success('تم أرشفة المجال'); }
    catch { toast.error('حدث خطأ'); }
  };

  const handleRestore = async (id: string) => {
    try { await restoreArea.mutateAsync(id); toast.success('تم استعادة المجال'); }
    catch { toast.error('حدث خطأ'); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try { await deleteArea.mutateAsync(deleteId); toast.success('تم حذف المجال'); setDeleteId(null); }
    catch { toast.error('حدث خطأ'); }
  };

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-28 rounded-2xl bg-muted/40" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">المجالات</h2>
          <p className="text-sm text-muted-foreground">المسؤوليات المستمرة التي تحتاج صيانة دائمة</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 bg-muted/50 rounded-xl px-3 py-1.5">
            <Switch id="show-archived" checked={showArchived} onCheckedChange={setShowArchived} />
            <Label htmlFor="show-archived" className="text-xs cursor-pointer">المؤرشف</Label>
          </div>
          <Button
            variant={showDashboard ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowDashboard(!showDashboard)}
            className="gap-2"
          >
            <BarChart3 className="w-4 h-4" />
            <span className="hidden sm:inline">لوحة التحكم</span>
          </Button>
          <Button variant="gold" size="sm" onClick={() => handleOpenDialog()} className="gap-2">
            <Plus className="w-4 h-4" />
            مجال جديد
          </Button>
        </div>
      </div>

      {showDashboard && <AreasDashboard />}

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {areas?.map((area) => (
          <div
            key={area.id}
            className={`glass-card relative overflow-hidden p-4 space-y-3 transition-all duration-200 ${
              area.status === 'archived' ? 'opacity-50' : ''
            }`}
          >
            {/* color bar */}
            <div
              className="absolute top-0 inset-x-0 h-0.5 rounded-t-2xl"
              style={{ backgroundColor: area.color || '#1D3672' }}
            />
            <div className="flex items-start justify-between pt-1">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${area.color || '#1D3672'}20` }}
                >
                  <Layers className="w-5 h-5" style={{ color: area.color || '#1D3672' }} />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-sm leading-tight line-clamp-1">{area.name}</p>
                  {area.status === 'archived' && (
                    <Badge variant="secondary" className="mt-1 text-xs">مؤرشف</Badge>
                  )}
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleOpenDialog(area)}>
                    <Pencil className="w-4 h-4 ml-2" />تعديل
                  </DropdownMenuItem>
                  {area.status === 'active' ? (
                    <DropdownMenuItem onClick={() => handleArchive(area.id)}>
                      <Archive className="w-4 h-4 ml-2" />أرشفة
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem onClick={() => handleRestore(area.id)}>
                      <RotateCcw className="w-4 h-4 ml-2" />استعادة
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={() => setDeleteId(area.id)} className="text-destructive">
                    <Trash2 className="w-4 h-4 ml-2" />حذف
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {area.description && (
              <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{area.description}</p>
            )}

            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar className="w-3 h-3 shrink-0" />
              <span>{cadenceOptions.find(c => c.value === area.review_cadence)?.label ?? 'شهري'}</span>
            </div>
          </div>
        ))}
      </div>

      {areas?.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <div className="w-16 h-16 rounded-2xl bg-muted/40 flex items-center justify-center mx-auto mb-4">
            <Layers className="w-8 h-8 opacity-40" />
          </div>
          <p className="font-medium mb-1">لا توجد مجالات حتى الآن</p>
          <p className="text-xs mb-4">أنشئ مجالاً لتتبع مسؤولياتك المستمرة</p>
          <Button variant="outline" size="sm" onClick={() => handleOpenDialog()}>
            <Plus className="w-4 h-4 ml-1" />أنشئ أول مجال
          </Button>
        </div>
      )}

      {/* Create / Edit Sheet */}
      <ResponsiveSheet
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        title={editingArea ? 'تعديل المجال' : 'مجال جديد'}
      >
        <div className="space-y-4 pb-4">
          <div>
            <Label className="text-xs font-semibold text-muted-foreground">الاسم</Label>
            <Input
              dir="auto"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="مثال: الصحة، العمل، العائلة..."
              className="bg-muted/50 border-border/50 mt-1"
            />
          </div>
          <div>
            <Label className="text-xs font-semibold text-muted-foreground">الوصف</Label>
            <Textarea
              dir="auto"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="وصف مختصر للمجال..."
              rows={3}
              className="bg-muted/50 border-border/50 mt-1 resize-none"
            />
          </div>
          <div>
            <Label className="text-xs font-semibold text-muted-foreground">فترة المراجعة</Label>
            <Select
              value={formData.review_cadence}
              onValueChange={(v) => setFormData({ ...formData, review_cadence: v as Area['review_cadence'] })}
            >
              <SelectTrigger className="bg-muted/50 border-border/50 mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {cadenceOptions.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs font-semibold text-muted-foreground">اللون</Label>
            <div className="flex gap-2 mt-2 flex-wrap">
              {colorOptions.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={`w-8 h-8 rounded-full transition-all active:scale-95 ${
                    formData.color === color ? 'ring-2 ring-offset-2 ring-primary scale-110' : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: color }}
                  onClick={() => setFormData({ ...formData, color })}
                />
              ))}
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setIsDialogOpen(false)}>إلغاء</Button>
            <Button variant="gold" className="flex-1" onClick={handleSubmit} disabled={createArea.isPending || updateArea.isPending}>
              {editingArea ? 'تحديث' : 'إنشاء'}
            </Button>
          </div>
        </div>
      </ResponsiveSheet>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
            <AlertDialogDescription>سيتم حذف هذا المجال نهائياً. لا يمكن التراجع.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">حذف</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
