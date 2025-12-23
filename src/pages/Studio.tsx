import { MainLayout } from '@/components/layout/MainLayout';
import { 
  BookOpen, Film, Plus, Search, Star, Target, Loader2, 
  MoreVertical, Edit3, Trash2, Archive, RotateCcw, Headphones, FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/hooks/useLanguage';
import { 
  useMediaItems, useCreateMediaItem, useUpdateMediaItem, 
  useDeleteMediaItem, useArchiveMediaItem, useRestoreMediaItem,
  useArchivedMediaItems, MediaItem
} from '@/hooks/useMedia';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';

type MediaType = 'book' | 'movie' | 'series' | 'podcast' | 'article';
type MediaStatus = 'want' | 'in_progress' | 'completed' | 'abandoned';

interface MediaFormData {
  title: string;
  author: string;
  type: MediaType;
  status: MediaStatus;
  total_pages: string;
  progress: number;
  rating: number;
  notes: string;
}

const emptyFormData: MediaFormData = {
  title: '',
  author: '',
  type: 'book',
  status: 'want',
  total_pages: '',
  progress: 0,
  rating: 0,
  notes: '',
};

export default function Studio() {
  const { t, currentLanguage } = useLanguage();
  const { data: mediaItems, isLoading } = useMediaItems();
  const { data: archivedItems } = useArchivedMediaItems();
  const createMediaItem = useCreateMediaItem();
  const updateMediaItem = useUpdateMediaItem();
  const deleteMediaItem = useDeleteMediaItem();
  const archiveMediaItem = useArchiveMediaItem();
  const restoreMediaItem = useRestoreMediaItem();

  const [activeTab, setActiveTab] = useState<'books' | 'movies' | 'podcasts' | 'archived'>('books');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingItem, setEditingItem] = useState<MediaItem | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState<MediaFormData>(emptyFormData);
  const [selectedShelf, setSelectedShelf] = useState<string | null>(null);

  const books = mediaItems?.filter(item => item.type === 'book') || [];
  const movies = mediaItems?.filter(item => ['movie', 'series'].includes(item.type)) || [];
  const podcasts = mediaItems?.filter(item => ['podcast', 'article'].includes(item.type)) || [];

  const filteredBooks = books.filter(book =>
    book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    book.author?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredMovies = movies.filter(movie =>
    movie.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredPodcasts = podcasts.filter(item =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const booksRead = books.filter(b => b.status === 'completed').length;
  const booksGoal = 24;

  const statusColors: Record<string, string> = {
    in_progress: 'bg-primary/10 text-primary border-primary/20',
    want: 'bg-muted text-muted-foreground border-muted',
    completed: 'bg-green-500/10 text-green-600 border-green-500/20',
    abandoned: 'bg-destructive/10 text-destructive border-destructive/20',
  };

  const getStatusLabel = (status: string, type: string) => {
    if (['movie', 'series'].includes(type)) {
      if (status === 'in_progress') return t('studio.status.watching');
      if (status === 'want') return t('studio.status.wantToWatch');
      if (status === 'completed') return t('studio.status.watched');
    }
    if (status === 'in_progress') return t('studio.status.reading');
    if (status === 'want') return t('studio.status.wantToRead');
    if (status === 'completed') return t('studio.status.read');
    if (status === 'abandoned') return t('studio.status.abandoned');
    return status;
  };

  const tabs = [
    { id: 'books' as const, label: t('studio.books'), icon: BookOpen },
    { id: 'movies' as const, label: t('studio.moviesShows'), icon: Film },
    { id: 'podcasts' as const, label: t('studio.podcasts'), icon: Headphones },
    { id: 'archived' as const, label: t('studio.archived'), icon: Archive },
  ];

  const shelfFilters = [
    { id: null, label: t('common.all') },
    { id: 'in_progress', label: t('studio.status.reading') },
    { id: 'want', label: t('studio.status.wantToRead') },
    { id: 'completed', label: t('studio.status.read') },
  ];

  const displayedBooks = selectedShelf 
    ? filteredBooks.filter(b => b.status === selectedShelf)
    : filteredBooks;

  const handleOpenDialog = (item?: MediaItem) => {
    if (item) {
      setIsEditMode(true);
      setEditingItem(item);
      setFormData({
        title: item.title,
        author: item.author || '',
        type: item.type as MediaType,
        status: item.status as MediaStatus,
        total_pages: item.total_pages?.toString() || '',
        progress: item.progress || 0,
        rating: item.rating || 0,
        notes: item.notes || '',
      });
    } else {
      setIsEditMode(false);
      setEditingItem(null);
      setFormData(emptyFormData);
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.title) {
      toast.error(t('common.fillAllFields'));
      return;
    }

    try {
      if (isEditMode && editingItem) {
        await updateMediaItem.mutateAsync({
          id: editingItem.id,
          title: formData.title,
          author: formData.author || null,
          type: formData.type,
          status: formData.status,
          total_pages: formData.total_pages ? parseInt(formData.total_pages) : null,
          progress: formData.progress,
          rating: formData.rating || null,
          notes: formData.notes || null,
        });
        toast.success(t('studio.itemUpdated'));
      } else {
        await createMediaItem.mutateAsync({
          title: formData.title,
          author: formData.author || null,
          type: formData.type,
          status: formData.status,
          total_pages: formData.total_pages ? parseInt(formData.total_pages) : null,
          progress: formData.progress,
          rating: formData.rating || null,
          notes: formData.notes || null,
        });
        toast.success(t('studio.itemAdded'));
      }
      setIsDialogOpen(false);
      setFormData(emptyFormData);
      setIsEditMode(false);
      setEditingItem(null);
    } catch (error) {
      toast.error(t('common.error'));
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    try {
      await deleteMediaItem.mutateAsync(itemToDelete);
      toast.success(t('studio.itemDeleted'));
    } catch (error) {
      toast.error(t('common.error'));
    }
    setDeleteConfirmOpen(false);
    setItemToDelete(null);
  };

  const handleArchive = async (id: string) => {
    try {
      await archiveMediaItem.mutateAsync(id);
      toast.success(t('studio.itemArchived'));
    } catch (error) {
      toast.error(t('common.error'));
    }
  };

  const handleRestore = async (id: string) => {
    try {
      await restoreMediaItem.mutateAsync(id);
      toast.success(t('studio.itemRestored'));
    } catch (error) {
      toast.error(t('common.error'));
    }
  };

  const handleUpdateProgress = async (item: MediaItem, newProgress: number) => {
    try {
      await updateMediaItem.mutateAsync({
        id: item.id,
        progress: newProgress,
        status: newProgress >= 100 ? 'completed' : newProgress > 0 ? 'in_progress' : item.status,
      });
      toast.success(t('studio.progressUpdated'));
    } catch (error) {
      toast.error(t('common.error'));
    }
  };

  const MediaCard = ({ item, showRestore = false }: { item: MediaItem; showRestore?: boolean }) => (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border hover:border-primary/30 transition-all group">
      <span className="text-3xl">
        {item.type === 'book' ? '📘' : 
         item.type === 'movie' ? '🎬' : 
         item.type === 'series' ? '📺' :
         item.type === 'podcast' ? '🎧' : '📄'}
      </span>
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-foreground text-sm truncate group-hover:text-primary transition-colors">
          {item.title}
        </h4>
        {item.author && (
          <p className="text-xs text-muted-foreground">{item.author}</p>
        )}
        {item.progress !== null && item.progress > 0 && item.status !== 'completed' && (
          <div className="flex items-center gap-2 mt-1">
            <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full"
                style={{ width: `${item.progress}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground">{item.progress}%</span>
          </div>
        )}
      </div>
      <div className="flex flex-col items-end gap-1">
        {item.rating && item.rating > 0 && (
          <div className="flex items-center gap-0.5">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={cn(
                  'w-3 h-3',
                  i < item.rating! ? 'text-primary fill-primary' : 'text-muted'
                )}
              />
            ))}
          </div>
        )}
        {item.status && (
          <span className={cn(
            'px-2 py-0.5 rounded-full text-xs font-medium border',
            statusColors[item.status]
          )}>
            {getStatusLabel(item.status, item.type)}
          </span>
        )}
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
            <MoreVertical className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {!showRestore ? (
            <>
              <DropdownMenuItem onClick={() => handleOpenDialog(item)}>
                <Edit3 className="w-4 h-4 me-2" />
                {t('common.edit')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleArchive(item.id)}>
                <Archive className="w-4 h-4 me-2" />
                {t('studio.archiveItem')}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => { setItemToDelete(item.id); setDeleteConfirmOpen(true); }}
                className="text-destructive"
              >
                <Trash2 className="w-4 h-4 me-2" />
                {t('common.delete')}
              </DropdownMenuItem>
            </>
          ) : (
            <>
              <DropdownMenuItem onClick={() => handleRestore(item.id)}>
                <RotateCcw className="w-4 h-4 me-2" />
                {t('studio.restoreItem')}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => { setItemToDelete(item.id); setDeleteConfirmOpen(true); }}
                className="text-destructive"
              >
                <Trash2 className="w-4 h-4 me-2" />
                {t('common.delete')}
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{t('studio.title')}</h1>
            <p className="text-muted-foreground mt-1">{t('studio.subtitle')}</p>
          </div>
          <Button variant="gold" size="lg" onClick={() => handleOpenDialog()}>
            <Plus className="w-5 h-5 me-2" />
            {t('studio.addItem')}
          </Button>
        </div>
      </div>

      {/* Reading Goal */}
      <div className="glass-card p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-gold flex items-center justify-center shadow-gold-glow-sm">
              <Target className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">{new Date().getFullYear()} {t('studio.readingGoal')}</h3>
              <p className="text-sm text-muted-foreground">{booksRead} {t('studio.booksOf')} {booksGoal} {t('studio.books').toLowerCase()}</p>
            </div>
          </div>
          <span className="text-2xl font-bold gold-text">{Math.round((booksRead / booksGoal) * 100)}%</span>
        </div>
        <div className="h-3 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-gold rounded-full transition-all duration-500"
            style={{ width: `${Math.min((booksRead / booksGoal) * 100, 100)}%` }}
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList className="mb-6">
          {tabs.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-2">
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Books Tab */}
        <TabsContent value="books">
          <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-foreground">{t('studio.books')}</h3>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder={t('studio.searchBooks')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 rounded-xl bg-muted/50 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 w-48"
                />
              </div>
            </div>

            {/* Shelf Filters */}
            <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
              {shelfFilters.map((shelf) => (
                <button
                  key={shelf.id || 'all'}
                  onClick={() => setSelectedShelf(shelf.id)}
                  className={cn(
                    'px-3 py-1 rounded-full text-xs font-medium transition-all whitespace-nowrap',
                    selectedShelf === shelf.id 
                      ? 'bg-primary/10 text-primary' 
                      : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                  )}
                >
                  {shelf.label}
                </button>
              ))}
            </div>

            {displayedBooks.length > 0 ? (
              <div className="space-y-3">
                {displayedBooks.map((book) => (
                  <MediaCard key={book.id} item={book} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-muted-foreground">{t('studio.noBooks')}</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Movies Tab */}
        <TabsContent value="movies">
          <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-foreground">{t('studio.moviesShows')}</h3>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder={t('studio.searchMovies')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 rounded-xl bg-muted/50 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 w-48"
                />
              </div>
            </div>

            {filteredMovies.length > 0 ? (
              <div className="space-y-3">
                {filteredMovies.map((movie) => (
                  <MediaCard key={movie.id} item={movie} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Film className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-muted-foreground">{t('studio.noMovies')}</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Podcasts Tab */}
        <TabsContent value="podcasts">
          <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-foreground">{t('studio.podcasts')} & {t('studio.articles')}</h3>
            </div>

            {filteredPodcasts.length > 0 ? (
              <div className="space-y-3">
                {filteredPodcasts.map((item) => (
                  <MediaCard key={item.id} item={item} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Headphones className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-muted-foreground">{t('common.noData')}</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Archived Tab */}
        <TabsContent value="archived">
          <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-foreground">{t('studio.archived')}</h3>
            </div>

            {archivedItems && archivedItems.length > 0 ? (
              <div className="space-y-3">
                {archivedItems.map((item) => (
                  <MediaCard key={item.id} item={item} showRestore />
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Archive className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-muted-foreground">{t('studio.noArchivedItems')}</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{isEditMode ? t('studio.editItem') : t('studio.addItem')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <Input
              placeholder={t('studio.itemTitle')}
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
            <Input
              placeholder={t('studio.author')}
              value={formData.author}
              onChange={(e) => setFormData({ ...formData, author: e.target.value })}
            />
            <Select 
              value={formData.type} 
              onValueChange={(value: MediaType) => setFormData({ ...formData, type: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="book">{t('studio.book')}</SelectItem>
                <SelectItem value="movie">{t('studio.movie')}</SelectItem>
                <SelectItem value="series">{t('studio.series')}</SelectItem>
                <SelectItem value="podcast">{t('studio.podcast')}</SelectItem>
                <SelectItem value="article">{t('studio.article')}</SelectItem>
              </SelectContent>
            </Select>
            <Select 
              value={formData.status} 
              onValueChange={(value: MediaStatus) => setFormData({ ...formData, status: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="want">{t('studio.status.wantToRead')}</SelectItem>
                <SelectItem value="in_progress">{t('studio.status.reading')}</SelectItem>
                <SelectItem value="completed">{t('studio.status.read')}</SelectItem>
              </SelectContent>
            </Select>
            {formData.type === 'book' && (
              <Input
                type="number"
                placeholder={t('studio.totalPages')}
                value={formData.total_pages}
                onChange={(e) => setFormData({ ...formData, total_pages: e.target.value })}
              />
            )}
            
            {/* Progress Slider */}
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">{t('common.progress')}: {formData.progress}%</label>
              <Slider
                value={[formData.progress]}
                onValueChange={(v) => setFormData({ ...formData, progress: v[0] })}
                max={100}
                step={5}
              />
            </div>

            {/* Rating */}
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">{t('studio.rating')}</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setFormData({ ...formData, rating: star })}
                    className="p-1"
                  >
                    <Star className={cn(
                      'w-6 h-6 transition-colors',
                      star <= formData.rating ? 'text-primary fill-primary' : 'text-muted'
                    )} />
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <Textarea
              placeholder={t('studio.notes')}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
            />

            <Button onClick={handleSubmit} className="w-full" disabled={createMediaItem.isPending || updateMediaItem.isPending}>
              {(createMediaItem.isPending || updateMediaItem.isPending) 
                ? <Loader2 className="w-4 h-4 animate-spin" /> 
                : isEditMode ? t('common.save') : t('common.add')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('studio.deleteItem')}</AlertDialogTitle>
            <AlertDialogDescription>{t('studio.confirmDelete')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}