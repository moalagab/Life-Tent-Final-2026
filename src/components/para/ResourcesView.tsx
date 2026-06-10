import { useState } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { useResources, useCreateResource, useUpdateResource, useArchiveResource, useRestoreResource, useDeleteResource, ResourceType } from '@/hooks/useResources';
import { useActiveAreas } from '@/hooks/useAreas';
import { useProjects } from '@/hooks/useProjects';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, MoreVertical, Pencil, Archive, RotateCcw, Trash2, FileText, Link2, Film, BookOpen, File, ExternalLink, Search, Database, LayoutGrid } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { UnifiedResourcesView } from './UnifiedResourcesView';
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';

 
const resourceTypes: { value: ResourceType; label: string; icon: any }[] = [
  { value: 'note', label: 'ملاحظة', icon: FileText },
  { value: 'file', label: 'ملف', icon: File },
  { value: 'link', label: 'رابط', icon: Link2 },
  { value: 'course', label: 'دورة', icon: BookOpen },
  { value: 'media', label: 'وسائط', icon: Film },
  { value: 'document', label: 'مستند', icon: FileText },
];

export function ResourcesView() {
  const { t } = useLanguage();
  const [showArchived, setShowArchived] = useState(false);
  const [showUnified, setShowUnified] = useState(false);
  const [activeType, setActiveType] = useState<ResourceType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAreaId, setFilterAreaId] = useState<string>('');
  const [filterProjectId, setFilterProjectId] = useState<string>('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
   
  const [editingResource, setEditingResource] = useState<any | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    type: 'note' as ResourceType,
    title: '',
    description: '',
    content: '',
    source_url: '',
    area_id: '',
    project_id: '',
    tags: [] as string[],
  });
  const [tagInput, setTagInput] = useState('');

  // Realtime subscription
  useRealtimeSubscription({ table: 'resources', queryKey: ['resources'] });

  const { data: areas } = useActiveAreas();
  const { data: projects } = useProjects();
  const { data: resources, isLoading } = useResources({
    type: activeType === 'all' ? undefined : activeType,
    area_id: filterAreaId || undefined,
    project_id: filterProjectId || undefined,
    includeArchived: showArchived,
  });

  const createResource = useCreateResource();
  const updateResource = useUpdateResource();
  const archiveResource = useArchiveResource();
  const restoreResource = useRestoreResource();
  const deleteResource = useDeleteResource();

  // If showing unified view
  if (showUnified) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-foreground">الموارد الموحدة</h2>
          <Button variant="outline" onClick={() => setShowUnified(false)}>
            العودة للعرض العادي
          </Button>
        </div>
        <UnifiedResourcesView />
      </div>
    );
  }

   
  const filteredResources = resources?.filter((r: any) =>
    r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const resetForm = () => {
    setFormData({
      type: 'note',
      title: '',
      description: '',
      content: '',
      source_url: '',
      area_id: '',
      project_id: '',
      tags: [],
    });
    setTagInput('');
    setEditingResource(null);
  };

   
  const handleOpenDialog = (resource?: any) => {
    if (resource) {
      setEditingResource(resource);
      setFormData({
        type: resource.type,
        title: resource.title,
        description: resource.description || '',
        content: resource.content || '',
        source_url: resource.source_url || '',
        area_id: resource.area_id || '',
        project_id: resource.project_id || '',
        tags: resource.tags || [],
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({ ...formData, tags: [...formData.tags, tagInput.trim()] });
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) });
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      toast.error('العنوان مطلوب');
      return;
    }

    try {
      const payload = {
        ...formData,
        area_id: formData.area_id || null,
        project_id: formData.project_id || null,
      };

      if (editingResource) {
        await updateResource.mutateAsync({ id: editingResource.id, ...payload });
        toast.success('تم تحديث المورد بنجاح');
      } else {
        await createResource.mutateAsync(payload);
        toast.success('تم إنشاء المورد بنجاح');
      }
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      toast.error('حدث خطأ');
    }
  };

  const handleArchive = async (id: string) => {
    try {
      await archiveResource.mutateAsync(id);
      toast.success('تم أرشفة المورد');
    } catch (error) {
      toast.error('حدث خطأ');
    }
  };

  const handleRestore = async (id: string) => {
    try {
      await restoreResource.mutateAsync(id);
      toast.success('تم استعادة المورد');
    } catch (error) {
      toast.error('حدث خطأ');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteResource.mutateAsync(deleteId);
      toast.success('تم حذف المورد');
      setDeleteId(null);
    } catch (error) {
      toast.error('حدث خطأ');
    }
  };

  const getTypeIcon = (type: ResourceType) => {
    const typeInfo = resourceTypes.find(t => t.value === type);
    return typeInfo?.icon || FileText;
  };

  if (isLoading) {
    return <div className="flex items-center justify-center p-8">جارٍ التحميل...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">الموارد (Resources)</h2>
          <p className="text-muted-foreground">ملاحظات، ملفات، روابط، دورات، ووسائط</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowUnified(true)}>
            <LayoutGrid className="w-4 h-4 ml-2" />
            عرض موحد
          </Button>
          <Button onClick={() => handleOpenDialog()} className="bg-gradient-gold text-primary-foreground">
            <Plus className="w-4 h-4 ml-2" />
            مورد جديد
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="بحث في الموارد..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10"
          />
        </div>
        <Select value={filterAreaId} onValueChange={setFilterAreaId}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="كل المجالات" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل المجالات</SelectItem>
            {areas?.map((area) => (
              <SelectItem key={area.id} value={area.id}>{area.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterProjectId} onValueChange={setFilterProjectId}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="كل المشاريع" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل المشاريع</SelectItem>
            {projects?.map((project: any) => (
              <SelectItem key={project.id} value={project.id}>{project.title}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2">
          <Switch
            id="show-archived-resources"
            checked={showArchived}
            onCheckedChange={setShowArchived}
          />
          <Label htmlFor="show-archived-resources">إظهار المؤرشف</Label>
        </div>
      </div>

      {/* Type Tabs */}
      <Tabs value={activeType} onValueChange={(v) => setActiveType(v as any)}>
        <TabsList className="bg-muted/50">
          <TabsTrigger value="all">الكل</TabsTrigger>
          {resourceTypes.map((type) => (
            <TabsTrigger key={type.value} value={type.value}>
              <type.icon className="w-4 h-4 ml-1" />
              {type.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={activeType} className="mt-4">
          {/* Resources Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredResources?.map((resource: any) => {
              const TypeIcon = getTypeIcon(resource.type);
              return (
                <Card 
                  key={resource.id} 
                  className={`relative overflow-hidden transition-all duration-200 hover:shadow-lg ${
                    resource.status === 'archived' ? 'opacity-60' : ''
                  }`}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                          <TypeIcon className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <div>
                          <CardTitle className="text-base line-clamp-1">{resource.title}</CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {resourceTypes.find(t => t.value === resource.type)?.label}
                            </Badge>
                            {resource.status === 'archived' && (
                              <Badge variant="secondary">مؤرشف</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {resource.source_url && (
                            <DropdownMenuItem onClick={() => window.open(resource.source_url, '_blank')}>
                              <ExternalLink className="w-4 h-4 ml-2" />
                              فتح الرابط
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => handleOpenDialog(resource)}>
                            <Pencil className="w-4 h-4 ml-2" />
                            تعديل
                          </DropdownMenuItem>
                          {resource.status === 'active' ? (
                            <DropdownMenuItem onClick={() => handleArchive(resource.id)}>
                              <Archive className="w-4 h-4 ml-2" />
                              أرشفة
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => handleRestore(resource.id)}>
                              <RotateCcw className="w-4 h-4 ml-2" />
                              استعادة
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem 
                            onClick={() => setDeleteId(resource.id)}
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
                    {resource.description && (
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {resource.description}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-1 mb-2">
                      {resource.tags?.slice(0, 3).map((tag: string) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{resource.areas?.name || resource.projects?.title || ''}</span>
                      <span>{format(new Date(resource.updated_at), 'dd MMM', { locale: ar })}</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {filteredResources?.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Database className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>لا توجد موارد</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => handleOpenDialog()}
              >
                أضف أول مورد
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingResource ? 'تعديل المورد' : 'مورد جديد'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>النوع</Label>
              <Select
                value={formData.type}
                onValueChange={(value: ResourceType) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {resourceTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <type.icon className="w-4 h-4" />
                        {type.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>العنوان</Label>
              <Input
                dir="auto"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="عنوان المورد..."
              />
            </div>
            <div>
              <Label>الوصف</Label>
              <Textarea
                dir="auto"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="وصف مختصر..."
                rows={2}
              />
            </div>
            {(formData.type === 'link' || formData.type === 'course') && (
              <div>
                <Label>الرابط</Label>
                <Input
                  type="url"
                  value={formData.source_url}
                  onChange={(e) => setFormData({ ...formData, source_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>
            )}
            {(formData.type === 'note' || formData.type === 'document') && (
              <div>
                <Label>المحتوى</Label>
                <Textarea
                  dir="auto"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="محتوى المورد..."
                  rows={4}
                />
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>المجال</Label>
                <Select
                  value={formData.area_id || 'none'}
                  onValueChange={(value) => setFormData({ ...formData, area_id: value === 'none' ? '' : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر مجال" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">بدون</SelectItem>
                    {areas?.map((area) => (
                      <SelectItem key={area.id} value={area.id}>{area.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>المشروع</Label>
                <Select
                  value={formData.project_id || 'none'}
                  onValueChange={(value) => setFormData({ ...formData, project_id: value === 'none' ? '' : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر مشروع" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">بدون</SelectItem>
                    {projects?.map((project: any) => (
                      <SelectItem key={project.id} value={project.id}>{project.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>الوسوم</Label>
              <div className="flex gap-2 mb-2">
                <Input
                  dir="auto"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                  placeholder="أضف وسم..."
                  className="flex-1"
                />
                <Button type="button" variant="outline" onClick={handleAddTag}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-1">
                {formData.tags.map((tag) => (
                  <Badge 
                    key={tag} 
                    variant="secondary"
                    className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                    onClick={() => handleRemoveTag(tag)}
                  >
                    {tag} ×
                  </Badge>
                ))}
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                إلغاء
              </Button>
              <Button onClick={handleSubmit} disabled={createResource.isPending || updateResource.isPending}>
                {editingResource ? 'تحديث' : 'إنشاء'}
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
              سيتم حذف هذا المورد نهائياً. لا يمكن التراجع عن هذا الإجراء.
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
