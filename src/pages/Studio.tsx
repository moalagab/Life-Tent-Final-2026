import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { 
  BookOpen, Film, Plus, Search, Loader2, Archive, Headphones, 
  Target, ShoppingCart, Grid3X3, List
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/hooks/useLanguage';
import { useNavigate } from 'react-router-dom';
import { 
  useMediaItems, useCreateMediaItem, useUpdateMediaItem, 
  useDeleteMediaItem, useArchiveMediaItem, useRestoreMediaItem,
  useArchivedMediaItems, MediaItem
} from '@/hooks/useMedia';
import { useGoals } from '@/hooks/useGoals';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// Components
import { ReadingGoalCard } from '@/components/studio/ReadingGoalCard';
import { MediaItemCard } from '@/components/studio/MediaItemCard';
import { MediaFormDialog } from '@/components/studio/MediaFormDialog';
import { AddToWishlistDialog } from '@/components/studio/AddToWishlistDialog';

type MediaType = 'book' | 'movie' | 'series' | 'podcast' | 'article';
type MediaStatus = 'want' | 'in_progress' | 'completed' | 'abandoned';
type ViewMode = 'grid' | 'list';

interface MediaFormData {
  title: string;
  author: string;
  type: MediaType;
  status: MediaStatus;
  total_pages: string;
  progress: number;
  rating: number;
  notes: string;
  goal_id: string;
  project_id: string;
}

export default function Studio() {
  const { t, currentLanguage } = useLanguage();
  const navigate = useNavigate();
  const { data: mediaItems, isLoading } = useMediaItems();
  const { data: archivedItems } = useArchivedMediaItems();
  const { data: goals } = useGoals();
  const createMediaItem = useCreateMediaItem();
  const updateMediaItem = useUpdateMediaItem();
  const deleteMediaItem = useDeleteMediaItem();
  const archiveMediaItem = useArchiveMediaItem();
  const restoreMediaItem = useRestoreMediaItem();

  // State
  const [activeTab, setActiveTab] = useState<'books' | 'movies' | 'podcasts' | 'archived'>('books');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MediaItem | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedShelf, setSelectedShelf] = useState<string>('all');
  const [wishlistDialogOpen, setWishlistDialogOpen] = useState(false);
  const [wishlistItem, setWishlistItem] = useState<MediaItem | null>(null);
  const [linkGoalDialogOpen, setLinkGoalDialogOpen] = useState(false);
  const [linkGoalItem, setLinkGoalItem] = useState<MediaItem | null>(null);
  const [selectedGoalId, setSelectedGoalId] = useState<string>('');

  // Filtered data
  const books = mediaItems?.filter(item => item.type === 'book') || [];
  const movies = mediaItems?.filter(item => ['movie', 'series'].includes(item.type)) || [];
  const podcasts = mediaItems?.filter(item => ['podcast', 'article'].includes(item.type)) || [];

  const filterItems = (items: MediaItem[]) => {
    let filtered = items.filter(item =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.author?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (selectedShelf !== 'all') {
      filtered = filtered.filter(b => b.status === selectedShelf);
    }

    return filtered;
  };

  const displayedBooks = filterItems(books);
  const displayedMovies = filterItems(movies);
  const displayedPodcasts = filterItems(podcasts);

  const booksRead = books.filter(b => b.status === 'completed').length;

  // Handlers
  const handleOpenForm = (item?: MediaItem) => {
    setEditingItem(item || null);
    setIsFormDialogOpen(true);
  };

  const handleFormSubmit = async (data: MediaFormData) => {
    try {
      const payload = {
        title: data.title,
        author: data.author || null,
        type: data.type,
        status: data.status,
        total_pages: data.total_pages ? parseInt(data.total_pages) : null,
        progress: data.progress,
        rating: data.rating || null,
        notes: data.notes || null,
        goal_id: data.goal_id || null,
        project_id: data.project_id || null,
      };

      if (editingItem) {
        await updateMediaItem.mutateAsync({ id: editingItem.id, ...payload });
        toast.success(currentLanguage === 'ar' ? 'تم تحديث العنصر' : 'Item updated');
      } else {
        await createMediaItem.mutateAsync(payload);
        toast.success(currentLanguage === 'ar' ? 'تمت إضافة العنصر' : 'Item added');
      }
      setIsFormDialogOpen(false);
      setEditingItem(null);
    } catch (error) {
      toast.error(currentLanguage === 'ar' ? 'حدث خطأ' : 'Error occurred');
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    try {
      await deleteMediaItem.mutateAsync(itemToDelete);
      toast.success(currentLanguage === 'ar' ? 'تم الحذف' : 'Item deleted');
    } catch (error) {
      toast.error(currentLanguage === 'ar' ? 'حدث خطأ' : 'Error occurred');
    }
    setDeleteConfirmOpen(false);
    setItemToDelete(null);
  };

  const handleArchive = async (id: string) => {
    try {
      await archiveMediaItem.mutateAsync(id);
      toast.success(currentLanguage === 'ar' ? 'تمت الأرشفة' : 'Item archived');
    } catch (error) {
      toast.error(currentLanguage === 'ar' ? 'حدث خطأ' : 'Error occurred');
    }
  };

  const handleRestore = async (id: string) => {
    try {
      await restoreMediaItem.mutateAsync(id);
      toast.success(currentLanguage === 'ar' ? 'تمت الاستعادة' : 'Item restored');
    } catch (error) {
      toast.error(currentLanguage === 'ar' ? 'حدث خطأ' : 'Error occurred');
    }
  };

  const handleUpdateProgress = async (item: MediaItem, newProgress: number) => {
    try {
      const newStatus = newProgress >= 100 ? 'completed' : newProgress > 0 ? 'in_progress' : item.status;
      await updateMediaItem.mutateAsync({
        id: item.id,
        progress: newProgress,
        status: newStatus as MediaStatus,
        end_date: newProgress >= 100 ? new Date().toISOString().split('T')[0] : item.end_date,
      });
      if (newProgress >= 100) {
        toast.success(currentLanguage === 'ar' ? '🎉 تهانينا! أكملت هذا العنصر' : '🎉 Congratulations! You completed this item');
      }
    } catch (error) {
      toast.error(currentLanguage === 'ar' ? 'حدث خطأ' : 'Error occurred');
    }
  };

  const handleAddToWishlist = (item: MediaItem) => {
    setWishlistItem(item);
    setWishlistDialogOpen(true);
  };

  const handleLinkToGoal = (item: MediaItem) => {
    setLinkGoalItem(item);
    setSelectedGoalId(item.goal_id || '');
    setLinkGoalDialogOpen(true);
  };

  const handleSaveLinkGoal = async () => {
    if (!linkGoalItem) return;
    try {
      await updateMediaItem.mutateAsync({
        id: linkGoalItem.id,
        goal_id: selectedGoalId || null,
      });
      toast.success(currentLanguage === 'ar' ? 'تم ربط العنصر بالهدف' : 'Item linked to goal');
      setLinkGoalDialogOpen(false);
      setLinkGoalItem(null);
    } catch (error) {
      toast.error(currentLanguage === 'ar' ? 'حدث خطأ' : 'Error occurred');
    }
  };

  const tabs = [
    { id: 'books' as const, label: currentLanguage === 'ar' ? 'الكتب' : 'Books', icon: BookOpen, count: books.length },
    { id: 'movies' as const, label: currentLanguage === 'ar' ? 'الأفلام' : 'Movies', icon: Film, count: movies.length },
    { id: 'podcasts' as const, label: currentLanguage === 'ar' ? 'البودكاست' : 'Podcasts', icon: Headphones, count: podcasts.length },
    { id: 'archived' as const, label: currentLanguage === 'ar' ? 'الأرشيف' : 'Archived', icon: Archive, count: archivedItems?.length || 0 },
  ];

  const shelfFilters = [
    { id: 'all', label: currentLanguage === 'ar' ? 'الكل' : 'All' },
    { id: 'in_progress', label: currentLanguage === 'ar' ? 'قيد القراءة' : 'Reading' },
    { id: 'want', label: currentLanguage === 'ar' ? 'أريد القراءة' : 'Want to Read' },
    { id: 'completed', label: currentLanguage === 'ar' ? 'مكتمل' : 'Completed' },
  ];

  const renderItemsGrid = (items: MediaItem[], isArchived = false) => (
    <div className={cn(
      'gap-4',
      viewMode === 'grid' 
        ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
        : 'flex flex-col'
    )}>
      {items.map((item) => (
        <MediaItemCard
          key={item.id}
          item={item}
          onEdit={handleOpenForm}
          onDelete={(id) => { setItemToDelete(id); setDeleteConfirmOpen(true); }}
          onArchive={handleArchive}
          onRestore={handleRestore}
          onAddToWishlist={handleAddToWishlist}
          onLinkToGoal={handleLinkToGoal}
          onUpdateProgress={handleUpdateProgress}
          isArchived={isArchived}
        />
      ))}
    </div>
  );

  const renderEmptyState = (icon: React.ElementType, message: string) => {
    const Icon = icon;
    return (
      <div className="text-center py-16">
        <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-muted/50 flex items-center justify-center">
          <Icon className="w-10 h-10 text-muted-foreground" />
        </div>
        <p className="text-muted-foreground mb-4">{message}</p>
        <Button variant="gold" onClick={() => handleOpenForm()}>
          <Plus className="w-4 h-4 me-2" />
          {currentLanguage === 'ar' ? 'أضف عنصرًا' : 'Add Item'}
        </Button>
      </div>
    );
  };

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
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {currentLanguage === 'ar' ? 'الاستديو' : 'Studio'}
            </h1>
            <p className="text-muted-foreground mt-1">
              {currentLanguage === 'ar' ? 'مكتبتك الشخصية للكتب والأفلام والمحتوى' : 'Your personal library for books, movies, and content'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => navigate('/finance')}
              title={currentLanguage === 'ar' ? 'قائمة الأمنيات' : 'Wishlist'}
            >
              <ShoppingCart className="w-4 h-4" />
            </Button>
            <Button variant="gold" size="lg" onClick={() => handleOpenForm()}>
              <Plus className="w-5 h-5 me-2" />
              {currentLanguage === 'ar' ? 'إضافة عنصر' : 'Add Item'}
            </Button>
          </div>
        </div>
      </div>

      {/* Reading Goal Card */}
      <ReadingGoalCard 
        booksRead={booksRead} 
        onNavigateToGoals={() => navigate('/goals')}
      />

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <TabsList className="h-auto p-1 flex-wrap">
            {tabs.map((tab) => (
              <TabsTrigger 
                key={tab.id} 
                value={tab.id} 
                className="flex items-center gap-2 px-4"
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.count > 0 && (
                  <span className="px-1.5 py-0.5 text-xs rounded-full bg-muted text-muted-foreground">
                    {tab.count}
                  </span>
                )}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setViewMode('grid')}
            >
              <Grid3X3 className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setViewMode('list')}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="glass-card p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={currentLanguage === 'ar' ? 'ابحث...' : 'Search...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="ps-10"
                dir="auto"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {shelfFilters.map((shelf) => (
                <button
                  key={shelf.id}
                  onClick={() => setSelectedShelf(shelf.id)}
                  className={cn(
                    'px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap',
                    selectedShelf === shelf.id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                  )}
                >
                  {shelf.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Books Tab */}
        <TabsContent value="books" className="mt-0">
          {displayedBooks.length > 0 
            ? renderItemsGrid(displayedBooks)
            : renderEmptyState(BookOpen, currentLanguage === 'ar' ? 'لا توجد كتب' : 'No books found')
          }
        </TabsContent>

        {/* Movies Tab */}
        <TabsContent value="movies" className="mt-0">
          {displayedMovies.length > 0 
            ? renderItemsGrid(displayedMovies)
            : renderEmptyState(Film, currentLanguage === 'ar' ? 'لا توجد أفلام' : 'No movies found')
          }
        </TabsContent>

        {/* Podcasts Tab */}
        <TabsContent value="podcasts" className="mt-0">
          {displayedPodcasts.length > 0 
            ? renderItemsGrid(displayedPodcasts)
            : renderEmptyState(Headphones, currentLanguage === 'ar' ? 'لا يوجد محتوى' : 'No content found')
          }
        </TabsContent>

        {/* Archived Tab */}
        <TabsContent value="archived" className="mt-0">
          {archivedItems && archivedItems.length > 0 
            ? renderItemsGrid(archivedItems, true)
            : renderEmptyState(Archive, currentLanguage === 'ar' ? 'لا توجد عناصر مؤرشفة' : 'No archived items')
          }
        </TabsContent>
      </Tabs>

      {/* Form Dialog */}
      <MediaFormDialog
        open={isFormDialogOpen}
        onOpenChange={setIsFormDialogOpen}
        onSubmit={handleFormSubmit}
        initialData={editingItem}
        isLoading={createMediaItem.isPending || updateMediaItem.isPending}
      />

      {/* Add to Wishlist Dialog */}
      <AddToWishlistDialog
        open={wishlistDialogOpen}
        onOpenChange={setWishlistDialogOpen}
        mediaItem={wishlistItem}
      />

      {/* Link to Goal Dialog */}
      <Dialog open={linkGoalDialogOpen} onOpenChange={setLinkGoalDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              {currentLanguage === 'ar' ? 'ربط بهدف' : 'Link to Goal'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <Select 
              value={selectedGoalId || 'none'} 
              onValueChange={(v) => setSelectedGoalId(v === 'none' ? '' : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder={currentLanguage === 'ar' ? 'اختر هدفًا' : 'Select a goal'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">
                  {currentLanguage === 'ar' ? 'بدون هدف' : 'No Goal'}
                </SelectItem>
                {goals?.filter(g => !g.archived_at).map((goal) => (
                  <SelectItem key={goal.id} value={goal.id}>
                    {goal.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button 
              onClick={handleSaveLinkGoal} 
              className="w-full" 
              variant="gold"
              disabled={updateMediaItem.isPending}
            >
              {updateMediaItem.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                currentLanguage === 'ar' ? 'حفظ' : 'Save'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {currentLanguage === 'ar' ? 'تأكيد الحذف' : 'Confirm Delete'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {currentLanguage === 'ar' 
                ? 'هل أنت متأكد من حذف هذا العنصر؟ لا يمكن التراجع عن هذا الإجراء.'
                : 'Are you sure you want to delete this item? This action cannot be undone.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {currentLanguage === 'ar' ? 'إلغاء' : 'Cancel'}
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete} 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {currentLanguage === 'ar' ? 'حذف' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}
