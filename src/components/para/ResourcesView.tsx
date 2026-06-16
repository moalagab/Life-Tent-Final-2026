import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/hooks/useLanguage';
import { useResources, useCreateResource, useUpdateResource, useArchiveResource, useRestoreResource, useDeleteResource, ResourceType, Resource } from '@/hooks/useResources';
import { useActiveAreas } from '@/hooks/useAreas';
import { useProjects } from '@/hooks/useProjects';
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
import { Plus, MoreVertical, Pencil, Archive, RotateCcw, Trash2, FileText, Link2, Film, BookOpen, File, ExternalLink, Search, Database, LayoutGrid, Filter, Layers, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { UnifiedResourcesView } from './UnifiedResourcesView';
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';
import { FileUploadZone, type UploadedFileInfo } from '@/components/ui/FileUploadZone';
import { useFileUpload } from '@/hooks/useFileUpload';

function getResourceTypes(isAr: boolean): {
  value: ResourceType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  from: string;
  to: string;
  activeBorder: string;
}[] {
  return [
    { value: 'note',     label: isAr ? 'ملاحظة' : 'Note',     icon: FileText, color: 'text-blue-500',   from: 'from-blue-500',   to: 'to-blue-600',    activeBorder: 'border-blue-400/40'   },
    { value: 'file',     label: isAr ? 'ملف'     : 'File',     icon: File,     color: 'text-purple-500', from: 'from-purple-500', to: 'to-violet-600',  activeBorder: 'border-purple-400/40' },
    { value: 'link',     label: isAr ? 'رابط'    : 'Link',     icon: Link2,    color: 'text-cyan-500',   from: 'from-cyan-500',   to: 'to-blue-500',    activeBorder: 'border-cyan-400/40'   },
    { value: 'course',   label: isAr ? 'دورة'    : 'Course',   icon: BookOpen, color: 'text-amber-500',  from: 'from-amber-500',  to: 'to-orange-500',  activeBorder: 'border-amber-400/40'  },
    { value: 'media',    label: isAr ? 'وسائط'   : 'Media',    icon: Film,     color: 'text-pink-500',   from: 'from-pink-500',   to: 'to-rose-500',    activeBorder: 'border-pink-400/40'   },
    { value: 'document', label: isAr ? 'مستند'   : 'Document', icon: FileText, color: 'text-green-500',  from: 'from-green-500',  to: 'to-emerald-600', activeBorder: 'border-green-400/40'  },
  ];
}

export function ResourcesView() {
  const { currentLanguage } = useLanguage();
  const isAr = currentLanguage === 'ar';
  const resourceTypes = getResourceTypes(isAr);
  const navigate = useNavigate();
  const [showArchived,    setShowArchived]    = useState(false);
  const [showUnified,     setShowUnified]     = useState(false);
  const [showFilters,     setShowFilters]     = useState(false);
  const [activeType,      setActiveType]      = useState<ResourceType | 'all'>('all');
  const [searchQuery,     setSearchQuery]     = useState('');
  const [filterAreaId,    setFilterAreaId]    = useState<string>('');
  const [filterProjectId, setFilterProjectId] = useState<string>('');
  const [isDialogOpen,    setIsDialogOpen]    = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [deleteId,        setDeleteId]        = useState<string | null>(null);
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
  const [uploadedFile, setUploadedFile] = useState<UploadedFileInfo | null>(null);

  const { upload: uploadFile, uploading: fileUploading, progress: fileProgress } = useFileUpload({
    bucket: 'attachments',
    maxSize: 50 * 1024 * 1024,
  });

  useRealtimeSubscription({ table: 'resources', queryKey: ['resources'] });

  const { data: areas }    = useActiveAreas();
  const { data: projects } = useProjects();
  const { data: resources, isLoading } = useResources({
    type: activeType === 'all' ? undefined : activeType,
    area_id: filterAreaId || undefined,
    project_id: filterProjectId || undefined,
    includeArchived: showArchived,
  });

  const createResource  = useCreateResource();
  const updateResource  = useUpdateResource();
  const archiveResource = useArchiveResource();
  const restoreResource = useRestoreResource();
  const deleteResource  = useDeleteResource();

  if (showUnified) {
    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground">{isAr ? 'الموارد الموحدة' : 'Unified Resources'}</h2>
          <Button variant="outline" size="sm" onClick={() => setShowUnified(false)}>{isAr ? 'العودة' : 'Back'}</Button>
        </div>
        <UnifiedResourcesView />
      </div>
    );
  }

  const filteredResources = resources?.filter((r) =>
    r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const resetForm = () => {
    setFormData({ type: 'note', title: '', description: '', content: '', source_url: '', area_id: '', project_id: '', tags: [] });
    setTagInput('');
    setEditingResource(null);
    setUploadedFile(null);
  };

  const handleFileUpload = async (file: File) => {
    const result = await uploadFile(file);
    if (result) {
      setUploadedFile(result);
      if (!formData.title) {
        setFormData(prev => ({ ...prev, source_url: result.url, title: file.name.replace(/\.[^.]+$/, '') }));
      } else {
        setFormData(prev => ({ ...prev, source_url: result.url }));
      }
    }
  };

  const handleOpenDialog = (resource?: Resource) => {
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
    if (!formData.title.trim()) { toast.error(isAr ? 'العنوان مطلوب' : 'Title is required'); return; }
    try {
      const payload = {
        ...formData,
        area_id:    formData.area_id    || null,
        project_id: formData.project_id || null,
      };
      if (editingResource) {
        await updateResource.mutateAsync({ id: editingResource.id, ...payload });
        toast.success(isAr ? 'تم تحديث المورد بنجاح' : 'Resource updated successfully');
      } else {
        await createResource.mutateAsync(payload);
        toast.success(isAr ? 'تم إنشاء المورد بنجاح' : 'Resource created successfully');
      }
      setIsDialogOpen(false);
      resetForm();
    } catch { toast.error(isAr ? 'حدث خطأ' : 'An error occurred'); }
  };

  const handleArchive = async (id: string) => {
    try { await archiveResource.mutateAsync(id); toast.success(isAr ? 'تم أرشفة المورد' : 'Resource archived'); }
    catch { toast.error(isAr ? 'حدث خطأ' : 'An error occurred'); }
  };

  const handleRestore = async (id: string) => {
    try { await restoreResource.mutateAsync(id); toast.success(isAr ? 'تم استعادة المورد' : 'Resource restored'); }
    catch { toast.error(isAr ? 'حدث خطأ' : 'An error occurred'); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteResource.mutateAsync(deleteId);
      toast.success(isAr ? 'تم حذف المورد' : 'Resource deleted');
      setDeleteId(null);
    } catch { toast.error(isAr ? 'حدث خطأ' : 'An error occurred'); }
  };

  const getTypeInfo = (type: ResourceType) => resourceTypes.find(t => t.value === type) ?? resourceTypes[0];
  const dateLocale = isAr ? ar : undefined;

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        {[1, 2, 3].map(i => <div key={i} className="h-28 rounded-2xl bg-muted/40" />)}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">{isAr ? 'الموارد' : 'Resources'}</h2>
          <p className="text-sm text-muted-foreground">{isAr ? 'ملاحظات، ملفات، روابط، دورات، ووسائط' : 'Notes, files, links, courses, and media'}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)} className="gap-2">
            <Filter className="w-4 h-4" />
            <span className="hidden sm:inline">{isAr ? 'فلاتر' : 'Filters'}</span>
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowUnified(true)} className="gap-2">
            <LayoutGrid className="w-4 h-4" />
            <span className="hidden sm:inline">{isAr ? 'موحد' : 'Unified'}</span>
          </Button>
          <Button variant="gold" size="sm" onClick={() => handleOpenDialog()} className="gap-2">
            <Plus className="w-4 h-4" />
            {isAr ? 'مورد جديد' : 'New Resource'}
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder={isAr ? 'بحث في الموارد...' : 'Search resources...'}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pr-10 bg-muted/50 border-border/50"
        />
      </div>

      {/* Advanced Filters (collapsible) */}
      {showFilters && (
        <div className="glass-card p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select value={filterAreaId} onValueChange={setFilterAreaId}>
              <SelectTrigger className="bg-muted/50 border-border/50">
                <SelectValue placeholder={isAr ? 'كل المجالات' : 'All Areas'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{isAr ? 'كل المجالات' : 'All Areas'}</SelectItem>
                {areas?.map((area) => (
                  <SelectItem key={area.id} value={area.id}>{area.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterProjectId} onValueChange={setFilterProjectId}>
              <SelectTrigger className="bg-muted/50 border-border/50">
                <SelectValue placeholder={isAr ? 'كل المشاريع' : 'All Projects'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{isAr ? 'كل المشاريع' : 'All Projects'}</SelectItem>
                {projects?.map((project) => (
                  <SelectItem key={project.id} value={project.id}>{project.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Switch id="show-archived-resources" checked={showArchived} onCheckedChange={setShowArchived} />
            <Label htmlFor="show-archived-resources" className="text-xs cursor-pointer">
              {isAr ? 'إظهار المؤرشف' : 'Show Archived'}
            </Label>
          </div>
        </div>
      )}

      {/* Type filter — Goals-style card grid (4 + 3) */}
      <div className="space-y-2">
        <div className="grid grid-cols-4 gap-2">
          {/* All card */}
          {(() => {
            const isSelected = activeType === 'all';
            const totalCount = resources?.length ?? 0;
            return (
              <button
                onClick={() => setActiveType('all')}
                className={cn(
                  'flex flex-col items-center justify-center gap-2 py-3 px-1 rounded-2xl transition-all duration-200 active:scale-95 border',
                  isSelected
                    ? 'bg-card/80 border-border/50 shadow-sm border-primary/30'
                    : 'border-transparent bg-muted/30 hover:bg-muted/50',
                )}
              >
                <span className="relative">
                  <Layers className={cn("w-7 h-7", isSelected ? "text-primary" : "text-muted-foreground")} strokeWidth={isSelected ? 2 : 1.75} />
                  {totalCount > 0 && (
                    <span className="absolute -top-2 -end-2 min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center shadow-sm">
                      {totalCount}
                    </span>
                  )}
                </span>
                <p className={cn('text-[10px] font-semibold text-center leading-tight', isSelected ? 'text-foreground' : 'text-foreground/60')}>
                  {isAr ? 'الكل' : 'All'}
                </p>
              </button>
            );
          })()}
          {/* First 3 type cards */}
          {resourceTypes.slice(0, 3).map((type) => {
            const isSelected = activeType === type.value;
            const count = resources?.filter(r => r.type === type.value).length ?? 0;
            const Icon = type.icon;
            return (
              <button
                key={type.value}
                onClick={() => setActiveType(type.value)}
                className={cn(
                  'flex flex-col items-center justify-center gap-2 py-3 px-1 rounded-2xl transition-all duration-200 active:scale-95 border',
                  isSelected
                    ? cn('bg-card/80 border-border/50 shadow-sm', type.activeBorder)
                    : 'border-transparent bg-muted/30 hover:bg-muted/50',
                )}
              >
                <span className="relative">
                  <Icon className={cn("w-7 h-7", isSelected ? "text-primary" : "text-muted-foreground")} strokeWidth={isSelected ? 2 : 1.75} />
                  {count > 0 && (
                    <span className="absolute -top-2 -end-2 min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center shadow-sm">
                      {count}
                    </span>
                  )}
                </span>
                <p className={cn('text-[10px] font-semibold text-center leading-tight', isSelected ? 'text-foreground' : 'text-foreground/60')}>
                  {type.label}
                </p>
              </button>
            );
          })}
        </div>
        {/* Second row — remaining 3 types */}
        <div className="grid grid-cols-3 gap-2">
          {resourceTypes.slice(3).map((type) => {
            const isSelected = activeType === type.value;
            const count = resources?.filter(r => r.type === type.value).length ?? 0;
            const Icon = type.icon;
            return (
              <button
                key={type.value}
                onClick={() => setActiveType(type.value)}
                className={cn(
                  'flex flex-col items-center justify-center gap-2 py-3 px-1 rounded-2xl transition-all duration-200 active:scale-95 border',
                  isSelected
                    ? cn('bg-card/80 border-border/50 shadow-sm', type.activeBorder)
                    : 'border-transparent bg-muted/30 hover:bg-muted/50',
                )}
              >
                <span className="relative">
                  <Icon className={cn("w-7 h-7", isSelected ? "text-primary" : "text-muted-foreground")} strokeWidth={isSelected ? 2 : 1.75} />
                  {count > 0 && (
                    <span className="absolute -top-2 -end-2 min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center shadow-sm">
                      {count}
                    </span>
                  )}
                </span>
                <p className={cn('text-[10px] font-semibold text-center leading-tight', isSelected ? 'text-foreground' : 'text-foreground/60')}>
                  {type.label}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Resources Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredResources?.map((resource) => {
          const typeInfo = getTypeInfo(resource.type);
          const TypeIcon = typeInfo.icon;
          return (
            <div
              key={resource.id}
              onClick={() => navigate(`/resources/${resource.id}`)}
              className={`glass-card p-4 space-y-2.5 transition-all duration-200 cursor-pointer hover:border-primary/30 ${
                resource.status === 'archived' ? 'opacity-50' : ''
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-muted/60 flex items-center justify-center shrink-0">
                    <TypeIcon className={`w-5 h-5 ${typeInfo.color}`} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm line-clamp-1">{resource.title}</p>
                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                      <Badge variant="outline" className="text-xs py-0">
                        {typeInfo.label}
                      </Badge>
                      {resource.status === 'archived' && (
                        <Badge variant="secondary" className="text-xs py-0">
                          {isAr ? 'مؤرشف' : 'Archived'}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                    {resource.source_url && (
                      <DropdownMenuItem onClick={() => window.open(resource.source_url!, '_blank')}>
                        {(resource.type === 'file' || resource.type === 'media') ? (
                          <Download className="w-4 h-4 ml-2" />
                        ) : (
                          <ExternalLink className="w-4 h-4 ml-2" />
                        )}
                        {resource.type === 'file'
                          ? (isAr ? 'تنزيل الملف' : 'Download File')
                          : resource.type === 'media'
                          ? (isAr ? 'فتح الوسائط' : 'Open Media')
                          : (isAr ? 'فتح الرابط' : 'Open Link')}
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => handleOpenDialog(resource)}>
                      <Pencil className="w-4 h-4 ml-2" />{isAr ? 'تعديل' : 'Edit'}
                    </DropdownMenuItem>
                    {resource.status === 'active' ? (
                      <DropdownMenuItem onClick={() => handleArchive(resource.id)}>
                        <Archive className="w-4 h-4 ml-2" />{isAr ? 'أرشفة' : 'Archive'}
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem onClick={() => handleRestore(resource.id)}>
                        <RotateCcw className="w-4 h-4 ml-2" />{isAr ? 'استعادة' : 'Restore'}
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => setDeleteId(resource.id)} className="text-destructive">
                      <Trash2 className="w-4 h-4 ml-2" />{isAr ? 'حذف' : 'Delete'}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {resource.description && (
                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{resource.description}</p>
              )}

              {resource.source_url && (resource.type === 'file' || resource.type === 'media') && (
                <a
                  href={resource.source_url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 text-xs text-primary hover:underline truncate"
                >
                  <Download className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">
                    {decodeURIComponent(resource.source_url.split('/').pop() ?? (isAr ? 'الملف' : 'File'))}
                  </span>
                </a>
              )}

              {resource.tags && resource.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {resource.tags.slice(0, 3).map((tag: string) => (
                    <Badge key={tag} variant="secondary" className="text-xs py-0">{tag}</Badge>
                  ))}
                  {resource.tags.length > 3 && (
                    <Badge variant="secondary" className="text-xs py-0">+{resource.tags.length - 3}</Badge>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between text-xs text-muted-foreground pt-0.5 border-t border-border/30">
                <span className="truncate max-w-[60%]">{resource.areas?.name || resource.projects?.title || '—'}</span>
                <span>{format(new Date(resource.updated_at), 'dd MMM', { locale: dateLocale })}</span>
              </div>
            </div>
          );
        })}
      </div>

      {filteredResources?.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <div className="w-16 h-16 rounded-2xl bg-muted/40 flex items-center justify-center mx-auto mb-4">
            <Database className="w-8 h-8 opacity-40" />
          </div>
          <p className="font-medium mb-1">{isAr ? 'لا توجد موارد' : 'No resources'}</p>
          <p className="text-xs mb-4">{isAr ? 'أضف ملاحظات، روابط، ملفات، أو دورات' : 'Add notes, links, files, or courses'}</p>
          <Button variant="outline" size="sm" onClick={() => handleOpenDialog()}>
            <Plus className="w-4 h-4 ml-1" />{isAr ? 'أضف أول مورد' : 'Add first resource'}
          </Button>
        </div>
      )}

      {/* Create / Edit Sheet */}
      <ResponsiveSheet
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        title={editingResource ? (isAr ? 'تعديل المورد' : 'Edit Resource') : (isAr ? 'مورد جديد' : 'New Resource')}
      >
        <div className="space-y-4 pb-4">
          <div>
            <Label className="text-xs font-semibold text-muted-foreground">{isAr ? 'النوع' : 'Type'}</Label>
            <Select
              value={formData.type}
              onValueChange={(v: ResourceType) => setFormData({ ...formData, type: v })}
            >
              <SelectTrigger className="bg-muted/50 border-border/50 mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {resourceTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex items-center gap-2">
                      <type.icon className={`w-4 h-4 ${type.color}`} />
                      {type.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs font-semibold text-muted-foreground">{isAr ? 'العنوان' : 'Title'}</Label>
            <Input
              dir="auto"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder={isAr ? 'عنوان المورد...' : 'Resource title...'}
              className="bg-muted/50 border-border/50 mt-1"
            />
          </div>
          <div>
            <Label className="text-xs font-semibold text-muted-foreground">{isAr ? 'الوصف' : 'Description'}</Label>
            <Textarea
              dir="auto"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder={isAr ? 'وصف مختصر...' : 'Brief description...'}
              rows={2}
              className="bg-muted/50 border-border/50 mt-1 resize-none"
            />
          </div>
          {(formData.type === 'link' || formData.type === 'course') && (
            <div>
              <Label className="text-xs font-semibold text-muted-foreground">{isAr ? 'الرابط' : 'URL'}</Label>
              <Input
                type="url"
                value={formData.source_url}
                onChange={(e) => setFormData({ ...formData, source_url: e.target.value })}
                placeholder="https://..."
                className="bg-muted/50 border-border/50 mt-1"
              />
            </div>
          )}
          {(formData.type === 'file' || formData.type === 'media') && (
            <div>
              <Label className="text-xs font-semibold text-muted-foreground mb-1.5 block">
                {formData.type === 'media' ? (isAr ? 'ملف الوسائط' : 'Media File') : (isAr ? 'الملف' : 'File')}
              </Label>
              <FileUploadZone
                onFileSelect={handleFileUpload}
                uploading={fileUploading}
                progress={fileProgress}
                uploaded={uploadedFile}
                onRemove={() => { setUploadedFile(null); setFormData(prev => ({ ...prev, source_url: '' })); }}
                accept={formData.type === 'media' ? 'image/*,video/*,audio/*' : '*/*'}
                maxSizeMb={50}
              />
              {!uploadedFile && (
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex-1 h-px bg-border/40" />
                  <span className="text-xs text-muted-foreground">{isAr ? 'أو أدخل رابطاً' : 'or enter a URL'}</span>
                  <div className="flex-1 h-px bg-border/40" />
                </div>
              )}
              {!uploadedFile && (
                <Input
                  type="url"
                  value={formData.source_url}
                  onChange={(e) => setFormData({ ...formData, source_url: e.target.value })}
                  placeholder="https://..."
                  className="bg-muted/50 border-border/50 mt-2"
                />
              )}
            </div>
          )}
          {(formData.type === 'note' || formData.type === 'document') && (
            <div>
              <Label className="text-xs font-semibold text-muted-foreground">{isAr ? 'المحتوى' : 'Content'}</Label>
              <Textarea
                dir="auto"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder={isAr ? 'محتوى المورد...' : 'Resource content...'}
                rows={4}
                className="bg-muted/50 border-border/50 mt-1 resize-none"
              />
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-semibold text-muted-foreground">{isAr ? 'المجال' : 'Area'}</Label>
              <Select
                value={formData.area_id || 'none'}
                onValueChange={(v) => setFormData({ ...formData, area_id: v === 'none' ? '' : v })}
              >
                <SelectTrigger className="bg-muted/50 border-border/50 mt-1">
                  <SelectValue placeholder={isAr ? 'اختر مجال' : 'Select area'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{isAr ? 'بدون' : 'None'}</SelectItem>
                  {areas?.map((area) => (
                    <SelectItem key={area.id} value={area.id}>{area.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-semibold text-muted-foreground">{isAr ? 'المشروع' : 'Project'}</Label>
              <Select
                value={formData.project_id || 'none'}
                onValueChange={(v) => setFormData({ ...formData, project_id: v === 'none' ? '' : v })}
              >
                <SelectTrigger className="bg-muted/50 border-border/50 mt-1">
                  <SelectValue placeholder={isAr ? 'اختر مشروع' : 'Select project'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{isAr ? 'بدون' : 'None'}</SelectItem>
                  {projects?.map((project) => (
                    <SelectItem key={project.id} value={project.id}>{project.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="text-xs font-semibold text-muted-foreground">{isAr ? 'الوسوم' : 'Tags'}</Label>
            <div className="flex gap-2 mt-1 mb-2">
              <Input
                dir="auto"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                placeholder={isAr ? 'أضف وسم واضغط Enter...' : 'Add tag and press Enter...'}
                className="flex-1 bg-muted/50 border-border/50"
              />
              <Button type="button" variant="outline" size="icon" onClick={handleAddTag}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-1">
              {formData.tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground transition-colors"
                  onClick={() => handleRemoveTag(tag)}
                >
                  {tag} ×
                </Badge>
              ))}
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setIsDialogOpen(false)}>
              {isAr ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button variant="gold" className="flex-1" onClick={handleSubmit} disabled={createResource.isPending || updateResource.isPending}>
              {editingResource ? (isAr ? 'تحديث' : 'Update') : (isAr ? 'إنشاء' : 'Create')}
            </Button>
          </div>
        </div>
      </ResponsiveSheet>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{isAr ? 'هل أنت متأكد؟' : 'Are you sure?'}</AlertDialogTitle>
            <AlertDialogDescription>
              {isAr ? 'سيتم حذف هذا المورد نهائياً. لا يمكن التراجع.' : 'This resource will be permanently deleted. This action cannot be undone.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{isAr ? 'إلغاء' : 'Cancel'}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              {isAr ? 'حذف' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
