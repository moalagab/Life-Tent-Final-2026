/**
 * Studio — personal media library.
 * Al Rajhi-inspired mobile-first layout: pill tabs, colour-coded cards,
 * horizontal filter strip, FAB on mobile.
 */
import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import {
  BookOpen, Film, Plus, Search, Loader2, Archive, Headphones,
  Target, ShoppingCart, BarChart3, Tv2, Mic2, X, Film as FilmIcon,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/hooks/useLanguage';
import { useNavigate } from 'react-router-dom';
import {
  useMediaItems, useCreateMediaItem, useUpdateMediaItem,
  useDeleteMediaItem, useArchiveMediaItem, useRestoreMediaItem,
  useArchivedMediaItems, MediaItem,
} from '@/hooks/useMedia';
import { useGoals } from '@/hooks/useGoals';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

import { ReadingGoalCard } from '@/components/studio/ReadingGoalCard';
import { MediaItemCard } from '@/components/studio/MediaItemCard';
import { MediaFormDialog } from '@/components/studio/MediaFormDialog';
import { AddToWishlistDialog } from '@/components/studio/AddToWishlistDialog';
import { StudioStats } from '@/components/studio/StudioStats';
import { ReadingReminder } from '@/components/studio/ReadingReminder';

type MediaType   = 'book' | 'movie' | 'series' | 'podcast' | 'article';
type MediaStatus = 'want' | 'in_progress' | 'completed' | 'abandoned';
type ActiveTab   = 'books' | 'movies' | 'podcasts' | 'stats' | 'archived';

interface MediaFormData {
  title: string; author: string; type: MediaType; status: MediaStatus;
  total_pages: string; progress: number; rating: number; notes: string;
  goal_id: string; project_id: string;
}

/* ── Tab config ─────────────────────────────────────────────────────────────── */
const TAB_CFG: Record<ActiveTab, {
  Icon: React.ElementType;
  arLabel: string; enLabel: string;
  hue: string; activeBorder: string;
}> = {
  books:    { Icon: BookOpen,  arLabel: 'الكتب',      enLabel: 'Books',    hue: 'var(--lt-hue-task)',   activeBorder: 'border-border/40' },
  movies:   { Icon: FilmIcon,  arLabel: 'الأفلام',    enLabel: 'Movies',   hue: 'var(--lt-hue-studio)', activeBorder: 'border-border/40' },
  podcasts: { Icon: Mic2,      arLabel: 'البودكاست',  enLabel: 'Podcasts', hue: 'var(--lt-hue-proj)',   activeBorder: 'border-border/40' },
  stats:    { Icon: BarChart3, arLabel: 'الإحصاء',    enLabel: 'Stats',    hue: 'var(--lt-hue-habit)',  activeBorder: 'border-border/40' },
  archived: { Icon: Archive,   arLabel: 'الأرشيف',    enLabel: 'Archive',  hue: 'var(--lt-muted)',      activeBorder: 'border-border/40' },
};

export default function Studio() {
  const { currentLanguage } = useLanguage();
  const navigate = useNavigate();
  const isAr = currentLanguage === 'ar';

  const { data: mediaItems, isLoading } = useMediaItems();
  const { data: archivedItems } = useArchivedMediaItems();
  const { data: goals } = useGoals();

  const createMediaItem   = useCreateMediaItem();
  const updateMediaItem   = useUpdateMediaItem();
  const deleteMediaItem   = useDeleteMediaItem();
  const archiveMediaItem  = useArchiveMediaItem();
  const restoreMediaItem  = useRestoreMediaItem();

  const [activeTab,        setActiveTab]        = useState<ActiveTab>('books');
  const [isFormOpen,       setIsFormOpen]        = useState(false);
  const [editingItem,      setEditingItem]       = useState<MediaItem | null>(null);
  const [deleteOpen,       setDeleteOpen]        = useState(false);
  const [itemToDelete,     setItemToDelete]      = useState<string | null>(null);
  const [search,           setSearch]            = useState('');
  const [shelf,            setShelf]             = useState<string>('all');
  const [wishlistOpen,     setWishlistOpen]      = useState(false);
  const [wishlistItem,     setWishlistItem]      = useState<MediaItem | null>(null);
  const [linkGoalOpen,     setLinkGoalOpen]      = useState(false);
  const [linkGoalItem,     setLinkGoalItem]      = useState<MediaItem | null>(null);
  const [selectedGoalId,   setSelectedGoalId]    = useState('');

  /* ── Derived ── */
  const books    = mediaItems?.filter(i => i.type === 'book') ?? [];
  const movies   = mediaItems?.filter(i => ['movie','series'].includes(i.type)) ?? [];
  const podcasts = mediaItems?.filter(i => ['podcast','article'].includes(i.type)) ?? [];
  const booksRead = books.filter(b => b.status === 'completed').length;

  const filterItems = (items: MediaItem[]) => {
    let out = items.filter(i =>
      i.title.toLowerCase().includes(search.toLowerCase()) ||
      (i.author ?? '').toLowerCase().includes(search.toLowerCase())
    );
    if (shelf !== 'all') out = out.filter(i => i.status === shelf);
    return out;
  };

  const displayed = {
    books:    filterItems(books),
    movies:   filterItems(movies),
    podcasts: filterItems(podcasts),
  };

  /* ── Shelf labels per tab ── */
  const shelfFilters = [
    { id: 'all', arLabel: 'الكل', enLabel: 'All' },
    {
      id: 'in_progress',
      arLabel: activeTab === 'movies' ? 'جاري المشاهدة' : activeTab === 'podcasts' ? 'جاري الاستماع' : 'جاري القراءة',
      enLabel: activeTab === 'movies' ? 'Watching'      : activeTab === 'podcasts' ? 'Listening'     : 'Reading',
    },
    {
      id: 'want',
      arLabel: activeTab === 'movies' ? 'أريد المشاهدة' : activeTab === 'podcasts' ? 'أريد الاستماع' : 'أريد القراءة',
      enLabel: activeTab === 'movies' ? 'Want to Watch' : activeTab === 'podcasts' ? 'Want to Listen' : 'Want to Read',
    },
    {
      id: 'completed',
      arLabel: activeTab === 'movies' ? 'تمت المشاهدة' : 'مكتمل',
      enLabel: activeTab === 'movies' ? 'Watched'      : 'Completed',
    },
  ];

  /* ── Handlers ── */
  const handleOpenForm = (item?: MediaItem) => {
    setEditingItem(item ?? null);
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (data: MediaFormData) => {
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
    try {
      if (editingItem) {
        await updateMediaItem.mutateAsync({ id: editingItem.id, ...payload });
        toast.success(isAr ? 'تم التحديث' : 'Updated');
      } else {
        await createMediaItem.mutateAsync(payload);
        toast.success(isAr ? 'تمت الإضافة' : 'Added');
      }
      setIsFormOpen(false);
      setEditingItem(null);
    } catch {
      toast.error(isAr ? 'حدث خطأ' : 'Error occurred');
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    try {
      await deleteMediaItem.mutateAsync(itemToDelete);
      toast.success(isAr ? 'تم الحذف' : 'Deleted');
    } catch {
      toast.error(isAr ? 'حدث خطأ' : 'Error');
    }
    setDeleteOpen(false);
    setItemToDelete(null);
  };

  const handleArchive  = async (id: string) => { try { await archiveMediaItem.mutateAsync(id); toast.success(isAr ? 'تمت الأرشفة' : 'Archived'); } catch { toast.error(isAr ? 'حدث خطأ' : 'Error'); } };
  const handleRestore  = async (id: string) => { try { await restoreMediaItem.mutateAsync(id); toast.success(isAr ? 'تمت الاستعادة' : 'Restored'); } catch { toast.error(isAr ? 'حدث خطأ' : 'Error'); } };

  const handleUpdateProgress = async (item: MediaItem, newProgress: number) => {
    try {
      const newStatus = newProgress >= 100 ? 'completed' : newProgress > 0 ? 'in_progress' : item.status;
      await updateMediaItem.mutateAsync({
        id: item.id, progress: newProgress, status: newStatus as MediaStatus,
        end_date: newProgress >= 100 ? new Date().toISOString().split('T')[0] : item.end_date,
      });
      if (newProgress >= 100) toast.success(isAr ? '🎉 رائع! أكملت هذا العنصر' : '🎉 Completed!');
    } catch { toast.error(isAr ? 'حدث خطأ' : 'Error'); }
  };

  /* ── Render grid ── */
  const renderGrid = (items: MediaItem[], isArchived = false) => (
    items.length > 0 ? (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {items.map(item => (
          <MediaItemCard
            key={item.id}
            item={item}
            onEdit={handleOpenForm}
            onDelete={id => { setItemToDelete(id); setDeleteOpen(true); }}
            onArchive={handleArchive}
            onRestore={handleRestore}
            onAddToWishlist={i => { setWishlistItem(i); setWishlistOpen(true); }}
            onLinkToGoal={i => { setLinkGoalItem(i); setSelectedGoalId(i.goal_id || ''); setLinkGoalOpen(true); }}
            onUpdateProgress={handleUpdateProgress}
            isArchived={isArchived}
          />
        ))}
      </div>
    ) : (
      <EmptyState
        tab={activeTab}
        isAr={isAr}
        onAdd={() => handleOpenForm()}
      />
    )
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

  const tabCounts: Partial<Record<ActiveTab, number>> = {
    books:    books.length,
    movies:   movies.length,
    podcasts: podcasts.length,
    archived: archivedItems?.length ?? 0,
  };

  return (
    <MainLayout>
      {/* ── Page header ── */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm" style={{ background: 'linear-gradient(135deg, var(--lt-hue-studio), var(--lt-hue-proj))' }}>
            <Film className="w-5 h-5 text-white" strokeWidth={1.8} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground leading-tight">
              {isAr ? 'الاستديو' : 'Studio'}
            </h1>
            <p className="text-[11px] text-muted-foreground">
              {(mediaItems?.length ?? 0)} {isAr ? 'عنصر في مكتبتك' : 'items in your library'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ReadingReminder />
          <button
            onClick={() => handleOpenForm()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold transition-all active:scale-95 shadow-sm hover:shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">{isAr ? 'إضافة' : 'Add'}</span>
          </button>
        </div>
      </div>

      {/* ── Reading goal ── */}
      <ReadingGoalCard booksRead={booksRead} onNavigateToGoals={() => navigate('/goals')} />

      {/* ── Tab cards (gradient grid 3+2) ── */}
      <div className="mb-4 space-y-3">
        <div className="grid grid-cols-3 gap-3">
          {(Object.keys(TAB_CFG).slice(0, 3) as ActiveTab[]).map(tab => {
            const cfg = TAB_CFG[tab];
            const active = activeTab === tab;
            const count = tabCounts[tab];
            return (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); setShelf('all'); }}
                className={cn(
                  'flex flex-col items-center justify-center gap-2.5 py-4 px-2 rounded-2xl transition-all duration-200 active:scale-95 border',
                  active
                    ? cn('bg-card/80 border-border/50 shadow-sm', cfg.activeBorder)
                    : 'border-transparent bg-muted/30 hover:bg-muted/50',
                )}
              >
                <div
                  className={cn("w-12 h-12 rounded-xl flex items-center justify-center relative bg-muted/50", active && "shadow-sm")}
                  style={active ? { background: `color-mix(in srgb, ${cfg.hue} 18%, transparent)` } : undefined}
                >
                  <cfg.Icon className={cn("w-5 h-5", !active && "text-muted-foreground")} style={active ? { color: cfg.hue } : undefined} strokeWidth={1.8} />
                  {count !== undefined && count > 0 && (
                    <span className="absolute -top-1.5 -end-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-background text-foreground text-[10px] font-bold flex items-center justify-center border border-border/50 shadow-sm">
                      {count}
                    </span>
                  )}
                </div>
                <p className={cn(
                  'text-xs font-semibold text-center leading-tight',
                  active ? 'text-foreground' : 'text-foreground/70',
                )}>
                  {isAr ? cfg.arLabel : cfg.enLabel}
                </p>
              </button>
            );
          })}
        </div>
        <div className="grid grid-cols-2 gap-3">
          {(Object.keys(TAB_CFG).slice(3) as ActiveTab[]).map(tab => {
            const cfg = TAB_CFG[tab];
            const active = activeTab === tab;
            const count = tabCounts[tab];
            return (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); setShelf('all'); }}
                className={cn(
                  'flex flex-col items-center justify-center gap-2.5 py-4 px-2 rounded-2xl transition-all duration-200 active:scale-95 border',
                  active
                    ? cn('bg-card/80 border-border/50 shadow-sm', cfg.activeBorder)
                    : 'border-transparent bg-muted/30 hover:bg-muted/50',
                )}
              >
                <div
                  className={cn("w-12 h-12 rounded-xl flex items-center justify-center relative bg-muted/50", active && "shadow-sm")}
                  style={active ? { background: `color-mix(in srgb, ${cfg.hue} 18%, transparent)` } : undefined}
                >
                  <cfg.Icon className={cn("w-5 h-5", !active && "text-muted-foreground")} style={active ? { color: cfg.hue } : undefined} strokeWidth={1.8} />
                  {count !== undefined && count > 0 && (
                    <span className="absolute -top-1.5 -end-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-background text-foreground text-[10px] font-bold flex items-center justify-center border border-border/50 shadow-sm">
                      {count}
                    </span>
                  )}
                </div>
                <p className={cn(
                  'text-xs font-semibold text-center leading-tight',
                  active ? 'text-foreground' : 'text-foreground/70',
                )}>
                  {isAr ? cfg.arLabel : cfg.enLabel}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Search + shelf filters (not for stats/archived) ── */}
      {!['stats', 'archived'].includes(activeTab) && (
        <div className="mb-4 space-y-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={isAr ? 'ابحث في مكتبتك...' : 'Search your library...'}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="ps-10 bg-muted/40 border-border/50 rounded-xl"
              dir="auto"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute end-3 top-1/2 -translate-y-1/2">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
          </div>

          {/* Shelf pills */}
          <div className="flex gap-2 overflow-x-auto scrollbar-none">
            {shelfFilters.map(s => (
              <button
                key={s.id}
                onClick={() => setShelf(s.id)}
                className={cn(
                  'px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-150 shrink-0',
                  shelf === s.id
                    ? 'bg-foreground text-background'
                    : 'bg-muted/50 text-muted-foreground hover:bg-muted',
                )}
              >
                {isAr ? s.arLabel : s.enLabel}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Tab content ── */}
      <div className="pb-6">
        {activeTab === 'books'    && renderGrid(displayed.books)}
        {activeTab === 'movies'   && renderGrid(displayed.movies)}
        {activeTab === 'podcasts' && renderGrid(displayed.podcasts)}
        {activeTab === 'stats'    && <StudioStats />}
        {activeTab === 'archived' && renderGrid(archivedItems ?? [], true)}
      </div>

      {/* ── Mobile FAB ── */}
      <button
        onClick={() => handleOpenForm()}
        className="md:hidden fixed bottom-20 end-4 z-40 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-xl flex items-center justify-center active:scale-95 transition-transform"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* ── Dialogs ── */}
      <MediaFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleFormSubmit}
        initialData={editingItem}
        isLoading={createMediaItem.isPending || updateMediaItem.isPending}
      />

      <AddToWishlistDialog
        open={wishlistOpen}
        onOpenChange={setWishlistOpen}
        mediaItem={wishlistItem}
      />

      <Dialog open={linkGoalOpen} onOpenChange={setLinkGoalOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              {isAr ? 'ربط بهدف' : 'Link to Goal'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <Select
              value={selectedGoalId || 'none'}
              onValueChange={v => setSelectedGoalId(v === 'none' ? '' : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder={isAr ? 'اختر هدفًا' : 'Select a goal'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{isAr ? 'بدون هدف' : 'No Goal'}</SelectItem>
                {goals?.filter(g => !g.archived_at).map(g => (
                  <SelectItem key={g.id} value={g.id}>{g.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <button
              onClick={async () => {
                if (!linkGoalItem) return;
                try {
                  await updateMediaItem.mutateAsync({ id: linkGoalItem.id, goal_id: selectedGoalId || null });
                  toast.success(isAr ? 'تم الربط' : 'Linked');
                  setLinkGoalOpen(false);
                } catch { toast.error(isAr ? 'خطأ' : 'Error'); }
              }}
              disabled={updateMediaItem.isPending}
              className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm transition-all active:scale-98 disabled:opacity-60"
            >
              {updateMediaItem.isPending
                ? <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                : (isAr ? 'حفظ' : 'Save')}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{isAr ? 'تأكيد الحذف' : 'Confirm Delete'}</AlertDialogTitle>
            <AlertDialogDescription>
              {isAr ? 'هل أنت متأكد؟ لا يمكن التراجع عن هذا الإجراء.' : 'Are you sure? This cannot be undone.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{isAr ? 'إلغاء' : 'Cancel'}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {isAr ? 'حذف' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}

/* ── Empty state ── */
function EmptyState({ tab, isAr, onAdd }: { tab: ActiveTab; isAr: boolean; onAdd: () => void }) {
  const cfg = TAB_CFG[tab];
  const messages: Record<ActiveTab, { ar: string; en: string }> = {
    books:    { ar: 'أضف أول كتاب لك', en: 'Add your first book' },
    movies:   { ar: 'أضف أول فيلم أو مسلسل', en: 'Add your first movie or series' },
    podcasts: { ar: 'أضف أول بودكاست', en: 'Add your first podcast' },
    stats:    { ar: '', en: '' },
    archived: { ar: 'لا توجد عناصر مؤرشفة', en: 'No archived items' },
  };
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: cfg.hue }}>
        <cfg.Icon className="w-8 h-8 text-white" strokeWidth={1.5} />
      </div>
      <p className="text-muted-foreground mb-5 text-sm">{isAr ? messages[tab].ar : messages[tab].en}</p>
      {tab !== 'archived' && (
        <button
          onClick={onAdd}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          {isAr ? 'إضافة عنصر' : 'Add Item'}
        </button>
      )}
    </div>
  );
}
