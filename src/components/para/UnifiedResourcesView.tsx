import { useResources, Resource } from '@/hooks/useResources';
import { useNotes } from '@/hooks/useKnowledge';
import { useMediaItems } from '@/hooks/useMedia';
import { useProjects } from '@/hooks/useProjects';
import { useActiveAreas } from '@/hooks/useAreas';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Loader2, Search, FileText, Link2, BookOpen, Film, Music, 
  Folder, FolderKanban, ExternalLink, Calendar 
} from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn } from '@/lib/utils';

type UnifiedResource = {
  id: string;
  type: 'note' | 'link' | 'file' | 'book' | 'movie' | 'podcast' | 'course';
  title: string;
  description?: string | null;
  url?: string | null;
  projectId?: string | null;
  projectTitle?: string | null;
  areaId?: string | null;
  areaName?: string | null;
  tags?: string[] | null;
  createdAt: string;
  source: 'resources' | 'notes' | 'media';
};

export function UnifiedResourcesView() {
  const { currentLanguage } = useLanguage();
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [selectedArea, setSelectedArea] = useState<string>('all');

  const { data: resources, isLoading: resourcesLoading } = useResources({ includeArchived: false });
  const { data: notes, isLoading: notesLoading } = useNotes();
  const { data: media, isLoading: mediaLoading } = useMediaItems();
  const { data: projects } = useProjects();
  const { data: areas } = useActiveAreas();

  const isLoading = resourcesLoading || notesLoading || mediaLoading;

  const unifiedResources = useMemo(() => {
    const all: UnifiedResource[] = [];

    // Add resources
    resources?.forEach(r => {
      const project = projects?.find(p => p.id === r.project_id);
      const area = areas?.find(a => a.id === r.area_id);
      all.push({
        id: r.id,
        type: r.type as UnifiedResource['type'],
        title: r.title,
        description: r.description,
        url: r.content_ref || null,
        projectId: r.project_id,
        projectTitle: project?.title,
        areaId: r.area_id,
        areaName: area?.name,
        tags: r.tags,
        createdAt: r.created_at,
        source: 'resources',
      });
    });

    // Add notes (if not already in resources)
    notes?.forEach(n => {
      if (!n.is_archived) {
        const project = projects?.find(p => p.id === n.project_id);
        all.push({
          id: n.id,
          type: 'note',
          title: n.title,
          description: n.content?.slice(0, 100),
          projectId: n.project_id,
          projectTitle: project?.title,
          tags: n.tags,
          createdAt: n.created_at,
          source: 'notes',
        });
      }
    });

    // Add media items
    media?.forEach(m => {
      all.push({
        id: m.id,
        type: m.type === 'book' ? 'book' : m.type === 'movie' || m.type === 'series' ? 'movie' : 'podcast',
        title: m.title,
        description: m.author || m.notes,
        createdAt: m.created_at,
        source: 'media',
      });
    });

    return all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [resources, notes, media, projects, areas]);

  const filteredResources = useMemo(() => {
    return unifiedResources.filter(r => {
      const matchesSearch = !search || 
        r.title.toLowerCase().includes(search.toLowerCase()) ||
        r.description?.toLowerCase().includes(search.toLowerCase());
      const matchesType = selectedType === 'all' || r.type === selectedType;
      const matchesProject = selectedProject === 'all' || r.projectId === selectedProject;
      const matchesArea = selectedArea === 'all' || r.areaId === selectedArea;
      return matchesSearch && matchesType && matchesProject && matchesArea;
    });
  }, [unifiedResources, search, selectedType, selectedProject, selectedArea]);

  const typeIcons: Record<string, React.ReactNode> = {
    note: <FileText className="w-4 h-4" />,
    link: <Link2 className="w-4 h-4" />,
    file: <Folder className="w-4 h-4" />,
    book: <BookOpen className="w-4 h-4" />,
    movie: <Film className="w-4 h-4" />,
    podcast: <Music className="w-4 h-4" />,
    course: <BookOpen className="w-4 h-4" />,
  };

  const typeLabels: Record<string, { ar: string; en: string }> = {
    all: { ar: 'الكل', en: 'All' },
    note: { ar: 'ملاحظة', en: 'Note' },
    link: { ar: 'رابط', en: 'Link' },
    file: { ar: 'ملف', en: 'File' },
    book: { ar: 'كتاب', en: 'Book' },
    movie: { ar: 'فيلم', en: 'Movie' },
    podcast: { ar: 'بودكاست', en: 'Podcast' },
    course: { ar: 'دورة', en: 'Course' },
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">
          {currentLanguage === 'ar' ? 'الموارد الموحدة' : 'Unified Resources'}
        </h2>
        <p className="text-muted-foreground">
          {currentLanguage === 'ar' 
            ? 'جميع الملاحظات والروابط والوسائط في مكان واحد'
            : 'All notes, links, and media in one place'}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={currentLanguage === 'ar' ? 'بحث...' : 'Search...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="ps-9"
          />
        </div>

        <Select value={selectedType} onValueChange={setSelectedType}>
          <SelectTrigger className="w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.keys(typeLabels).map(key => (
              <SelectItem key={key} value={key}>
                {typeLabels[key][currentLanguage]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedProject} onValueChange={setSelectedProject}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={currentLanguage === 'ar' ? 'المشروع' : 'Project'} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              {currentLanguage === 'ar' ? 'جميع المشاريع' : 'All Projects'}
            </SelectItem>
            {projects?.map(p => (
              <SelectItem key={p.id} value={p.id}>
                <div className="flex items-center gap-2">
                  <div 
                    className="w-2 h-2 rounded-full" 
                    style={{ backgroundColor: p.color || '#6366f1' }} 
                  />
                  {p.title}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedArea} onValueChange={setSelectedArea}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={currentLanguage === 'ar' ? 'المجال' : 'Area'} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              {currentLanguage === 'ar' ? 'جميع المجالات' : 'All Areas'}
            </SelectItem>
            {areas?.map(a => (
              <SelectItem key={a.id} value={a.id}>
                <div className="flex items-center gap-2">
                  <div 
                    className="w-2 h-2 rounded-full" 
                    style={{ backgroundColor: a.color || '#6366f1' }} 
                  />
                  {a.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span>
          {filteredResources.length} {currentLanguage === 'ar' ? 'مورد' : 'resources'}
        </span>
        <div className="flex gap-2">
          {Object.entries(
            filteredResources.reduce((acc, r) => {
              acc[r.type] = (acc[r.type] || 0) + 1;
              return acc;
            }, {} as Record<string, number>)
          ).map(([type, count]) => (
            <Badge key={type} variant="secondary" className="gap-1">
              {typeIcons[type]}
              {count}
            </Badge>
          ))}
        </div>
      </div>

      {/* Resources Grid */}
      {filteredResources.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="text-center py-12">
            <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground">
              {currentLanguage === 'ar' ? 'لا توجد موارد' : 'No resources found'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredResources.map(resource => (
            <Card 
              key={`${resource.source}-${resource.id}`} 
              className="glass-card hover:shadow-lg transition-all duration-200 group"
            >
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <div className={cn(
                    'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                    resource.type === 'note' && 'bg-blue-500/10 text-blue-500',
                    resource.type === 'link' && 'bg-emerald-500/10 text-emerald-500',
                    resource.type === 'file' && 'bg-primary/10 text-primary',
                    resource.type === 'book' && 'bg-purple-500/10 text-purple-500',
                    resource.type === 'movie' && 'bg-pink-500/10 text-pink-500',
                    resource.type === 'podcast' && 'bg-indigo-500/10 text-indigo-500',
                    resource.type === 'course' && 'bg-primary/10 text-primary',
                  )}>
                    {typeIcons[resource.type]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-foreground truncate group-hover:text-primary transition-colors">
                      {resource.title}
                    </h3>
                    {resource.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                        {resource.description}
                      </p>
                    )}
                  </div>
                  {resource.url && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      asChild
                    >
                      <a href={resource.url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </Button>
                  )}
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {typeLabels[resource.type][currentLanguage]}
                  </Badge>
                  {resource.projectTitle && (
                    <Badge variant="secondary" className="text-xs gap-1">
                      <FolderKanban className="w-3 h-3" />
                      {resource.projectTitle}
                    </Badge>
                  )}
                  {resource.areaName && (
                    <Badge variant="secondary" className="text-xs">
                      {resource.areaName}
                    </Badge>
                  )}
                </div>

                <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="w-3 h-3" />
                  {format(new Date(resource.createdAt), 'PP', { 
                    locale: currentLanguage === 'ar' ? ar : undefined 
                  })}
                </div>

                {resource.tags && resource.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {resource.tags.slice(0, 3).map(tag => (
                      <Badge key={tag} variant="outline" className="text-xs bg-muted/50">
                        #{tag}
                      </Badge>
                    ))}
                    {resource.tags.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{resource.tags.length - 3}
                      </Badge>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
