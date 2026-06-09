import { useState } from 'react';
import { useResources, useCreateResource, useDeleteResource } from '@/hooks/useResources';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { Plus, MoreVertical, Trash2, FileText, Link2, Film, BookOpen, File, ExternalLink, Database } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useLanguage } from '@/hooks/useLanguage';

interface ProjectResourcesTabProps {
  projectId: string;
}

export function ProjectResourcesTab({ projectId }: ProjectResourcesTabProps) {
  const { currentLanguage } = useLanguage();

  const resourceTypes = [
    { value: 'note', label: currentLanguage === 'ar' ? 'ملاحظة' : 'Note', icon: FileText },
    { value: 'file', label: currentLanguage === 'ar' ? 'ملف' : 'File', icon: File },
    { value: 'link', label: currentLanguage === 'ar' ? 'رابط' : 'Link', icon: Link2 },
    { value: 'course', label: currentLanguage === 'ar' ? 'دورة' : 'Course', icon: BookOpen },
    { value: 'media', label: currentLanguage === 'ar' ? 'وسائط' : 'Media', icon: Film },
    { value: 'document', label: currentLanguage === 'ar' ? 'مستند' : 'Document', icon: FileText },
  ];
  const { data: allResources, isLoading } = useResources({ project_id: projectId });
  const createResource = useCreateResource();
  const deleteResource = useDeleteResource();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newResource, setNewResource] = useState({
     
    type: 'note' as any,
    title: '',
    description: '',
    content: '',
    source_url: '',
  });

  const handleCreate = async () => {
    if (!newResource.title.trim()) {
      toast.error(currentLanguage === 'ar' ? 'العنوان مطلوب' : 'Title is required');
      return;
    }

    try {
      await createResource.mutateAsync({
        ...newResource,
        project_id: projectId,
      });
      toast.success(currentLanguage === 'ar' ? 'تم إنشاء المورد' : 'Resource created');
      setIsCreateOpen(false);
      setNewResource({ type: 'note', title: '', description: '', content: '', source_url: '' });
    } catch (error) {
      toast.error(currentLanguage === 'ar' ? 'حدث خطأ' : 'An error occurred');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteResource.mutateAsync(id);
      toast.success(currentLanguage === 'ar' ? 'تم حذف المورد' : 'Resource deleted');
    } catch (error) {
      toast.error(currentLanguage === 'ar' ? 'حدث خطأ' : 'An error occurred');
    }
  };

  const getTypeIcon = (type: string) => {
    const typeInfo = resourceTypes.find(t => t.value === type);
    return typeInfo?.icon || FileText;
  };

  if (isLoading) {
    return <div className="flex items-center justify-center p-8">{currentLanguage === 'ar' ? 'جارٍ التحميل...' : 'Loading...'}</div>;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{allResources?.length || 0} {currentLanguage === 'ar' ? 'موارد' : 'resources'}</span>
        <Button onClick={() => setIsCreateOpen(true)} className="bg-gradient-gold text-primary-foreground">
          <Plus className="w-4 h-4 ml-2" />
          {currentLanguage === 'ar' ? 'مورد جديد' : 'New Resource'}
        </Button>
      </div>

      {/* Resources Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {allResources?.map((resource: any) => {
          const TypeIcon = getTypeIcon(resource.type);
          return (
            <Card key={resource.id} className="transition-all hover:shadow-md">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                      <TypeIcon className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div>
                      <h4 className="font-medium">{resource.title}</h4>
                      <Badge variant="outline" className="text-xs mt-1">
                        {resourceTypes.find(t => t.value === resource.type)?.label}
                      </Badge>
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
                          {currentLanguage === 'ar' ? 'فتح الرابط' : 'Open Link'}
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => handleDelete(resource.id)} className="text-destructive">
                        <Trash2 className="w-4 h-4 ml-2" />
                        {currentLanguage === 'ar' ? 'حذف' : 'Delete'}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                {resource.description && (
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{resource.description}</p>
                )}
                <div className="text-xs text-muted-foreground mt-2">
                  {format(new Date(resource.updated_at), 'dd MMM yyyy', { locale: ar })}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {allResources?.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <Database className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>{currentLanguage === 'ar' ? 'لا توجد موارد مرتبطة بهذا المشروع' : 'No resources linked to this project'}</p>
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{currentLanguage === 'ar' ? 'مورد جديد' : 'New Resource'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{currentLanguage === 'ar' ? 'النوع' : 'Type'}</Label>
              <Select value={newResource.type} onValueChange={(v) => setNewResource({ ...newResource, type: v as any })}>
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
              <Label>{currentLanguage === 'ar' ? 'العنوان' : 'Title'}</Label>
              <Input
                dir="auto"
                value={newResource.title}
                onChange={(e) => setNewResource({ ...newResource, title: e.target.value })}
                placeholder={currentLanguage === 'ar' ? 'عنوان المورد...' : 'Resource title...'}
              />
            </div>
            <div>
              <Label>{currentLanguage === 'ar' ? 'الوصف' : 'Description'}</Label>
              <Textarea
                dir="auto"
                value={newResource.description}
                onChange={(e) => setNewResource({ ...newResource, description: e.target.value })}
                rows={2}
              />
            </div>
            {(newResource.type === 'link' || newResource.type === 'course') && (
              <div>
                <Label>{currentLanguage === 'ar' ? 'الرابط' : 'URL'}</Label>
                <Input
                  type="url"
                  value={newResource.source_url}
                  onChange={(e) => setNewResource({ ...newResource, source_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>
            )}
            {(newResource.type === 'note' || newResource.type === 'document') && (
              <div>
                <Label>{currentLanguage === 'ar' ? 'المحتوى' : 'Content'}</Label>
                <Textarea
                  dir="auto"
                  value={newResource.content}
                  onChange={(e) => setNewResource({ ...newResource, content: e.target.value })}
                  rows={4}
                />
              </div>
            )}
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>{currentLanguage === 'ar' ? 'إلغاء' : 'Cancel'}</Button>
              <Button onClick={handleCreate} disabled={createResource.isPending}>{currentLanguage === 'ar' ? 'إنشاء' : 'Create'}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
