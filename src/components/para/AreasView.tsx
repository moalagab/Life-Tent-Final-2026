import { useState } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { useAreas, useCreateArea, useUpdateArea, useArchiveArea, useRestoreArea, useDeleteArea, Area } from '@/hooks/useAreas';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Plus, MoreVertical, Pencil, Archive, RotateCcw, Trash2, Layers, Calendar } from 'lucide-react';
import { toast } from 'sonner';

const colorOptions = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f97316', 
  '#eab308', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6'
];

const cadenceOptions = [
  { value: 'weekly', label: 'أسبوعي' },
  { value: 'monthly', label: 'شهري' },
  { value: 'quarterly', label: 'ربع سنوي' },
  { value: 'yearly', label: 'سنوي' },
];

export function AreasView() {
  const { t } = useLanguage();
  const [showArchived, setShowArchived] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingArea, setEditingArea] = useState<Area | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#6366f1',
    review_cadence: 'monthly' as string,
  });

  const { data: areas, isLoading } = useAreas(showArchived);
  const createArea = useCreateArea();
  const updateArea = useUpdateArea();
  const archiveArea = useArchiveArea();
  const restoreArea = useRestoreArea();
  const deleteArea = useDeleteArea();

  const resetForm = () => {
    setFormData({ name: '', description: '', color: '#6366f1', review_cadence: 'monthly' });
    setEditingArea(null);
  };

  const handleOpenDialog = (area?: Area) => {
    if (area) {
      setEditingArea(area);
      setFormData({
        name: area.name,
        description: area.description || '',
        color: area.color || '#6366f1',
        review_cadence: area.review_cadence || 'monthly',
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error('الاسم مطلوب');
      return;
    }

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
    } catch (error) {
      toast.error('حدث خطأ');
    }
  };

  const handleArchive = async (id: string) => {
    try {
      await archiveArea.mutateAsync(id);
      toast.success('تم أرشفة المجال');
    } catch (error) {
      toast.error('حدث خطأ');
    }
  };

  const handleRestore = async (id: string) => {
    try {
      await restoreArea.mutateAsync(id);
      toast.success('تم استعادة المجال');
    } catch (error) {
      toast.error('حدث خطأ');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteArea.mutateAsync(deleteId);
      toast.success('تم حذف المجال');
      setDeleteId(null);
    } catch (error) {
      toast.error('حدث خطأ');
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center p-8">جارٍ التحميل...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">المجالات (Areas)</h2>
          <p className="text-muted-foreground">المسؤوليات المستمرة التي تحتاج صيانة دائمة</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch
              id="show-archived"
              checked={showArchived}
              onCheckedChange={setShowArchived}
            />
            <Label htmlFor="show-archived">إظهار المؤرشف</Label>
          </div>
          <Button onClick={() => handleOpenDialog()} className="bg-gradient-gold text-primary-foreground">
            <Plus className="w-4 h-4 ml-2" />
            مجال جديد
          </Button>
        </div>
      </div>

      {/* Areas Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {areas?.map((area) => (
          <Card 
            key={area.id} 
            className={`relative overflow-hidden transition-all duration-200 hover:shadow-lg ${
              area.status === 'archived' ? 'opacity-60' : ''
            }`}
          >
            <div 
              className="absolute top-0 left-0 right-0 h-1"
              style={{ backgroundColor: area.color || '#6366f1' }}
            />
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${area.color}20` }}
                  >
                    <Layers className="w-5 h-5" style={{ color: area.color || '#6366f1' }} />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{area.name}</CardTitle>
                    {area.status === 'archived' && (
                      <Badge variant="secondary" className="mt-1">مؤرشف</Badge>
                    )}
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleOpenDialog(area)}>
                      <Pencil className="w-4 h-4 ml-2" />
                      تعديل
                    </DropdownMenuItem>
                    {area.status === 'active' ? (
                      <DropdownMenuItem onClick={() => handleArchive(area.id)}>
                        <Archive className="w-4 h-4 ml-2" />
                        أرشفة
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem onClick={() => handleRestore(area.id)}>
                        <RotateCcw className="w-4 h-4 ml-2" />
                        استعادة
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem 
                      onClick={() => setDeleteId(area.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="w-4 h-4 ml-2" />
                      حذف
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent>
              {area.description && (
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                  {area.description}
                </p>
              )}
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar className="w-3 h-3" />
                <span>مراجعة: {cadenceOptions.find(c => c.value === area.review_cadence)?.label}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {areas?.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Layers className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>لا توجد مجالات حتى الآن</p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => handleOpenDialog()}
          >
            أنشئ أول مجال
          </Button>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingArea ? 'تعديل المجال' : 'مجال جديد'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>الاسم</Label>
              <Input
                dir="auto"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="مثال: الصحة، العمل، العائلة..."
              />
            </div>
            <div>
              <Label>الوصف</Label>
              <Textarea
                dir="auto"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="وصف مختصر للمجال..."
                rows={3}
              />
            </div>
            <div>
              <Label>فترة المراجعة</Label>
              <Select
                value={formData.review_cadence}
                onValueChange={(value: any) => setFormData({ ...formData, review_cadence: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {cadenceOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>اللون</Label>
              <div className="flex gap-2 mt-2">
                {colorOptions.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`w-8 h-8 rounded-full transition-all ${
                      formData.color === color ? 'ring-2 ring-offset-2 ring-primary' : ''
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setFormData({ ...formData, color })}
                  />
                ))}
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                إلغاء
              </Button>
              <Button onClick={handleSubmit} disabled={createArea.isPending || updateArea.isPending}>
                {editingArea ? 'تحديث' : 'إنشاء'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
            <AlertDialogDescription>
              سيتم حذف هذا المجال نهائياً. لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
