import { MainLayout } from '@/components/layout/MainLayout';
import { BookOpen, Film, Plus, Search, Star, Target, ArrowUpRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/hooks/useLanguage';
import { useMediaItems, useCreateMediaItem } from '@/hooks/useMedia';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

export default function Studio() {
  const { t } = useLanguage();
  const { data: mediaItems, isLoading } = useMediaItems();
  const createMediaItem = useCreateMediaItem();

  const [activeTab, setActiveTab] = useState<'books' | 'movies'>('books');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [newItem, setNewItem] = useState({
    title: '',
    author: '',
    type: 'book' as 'book' | 'movie' | 'series' | 'podcast' | 'article',
    status: 'want' as 'want' | 'in_progress' | 'completed' | 'abandoned',
    total_pages: '',
  });

  const books = mediaItems?.filter(item => item.type === 'book') || [];
  const movies = mediaItems?.filter(item => ['movie', 'series'].includes(item.type)) || [];

  const filteredBooks = books.filter(book =>
    book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    book.author?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredMovies = movies.filter(movie =>
    movie.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const booksRead = books.filter(b => b.status === 'completed').length;
  const booksGoal = 24;

  const statusColors: Record<string, string> = {
    in_progress: 'bg-primary/10 text-primary border-primary/20',
    want: 'bg-muted text-muted-foreground border-muted',
    completed: 'bg-success/10 text-success border-success/20',
    abandoned: 'bg-destructive/10 text-destructive border-destructive/20',
  };

  const statusLabels: Record<string, string> = {
    in_progress: t('studio.status.reading'),
    want: t('studio.status.wantToRead'),
    completed: t('studio.status.read'),
    abandoned: t('studio.status.abandoned'),
  };

  const tabs = [
    { id: 'books' as const, label: t('studio.books'), icon: BookOpen },
    { id: 'movies' as const, label: t('studio.moviesShows'), icon: Film },
  ];

  const shelfFilters = [
    { id: null, label: t('common.all') },
    { id: 'in_progress', label: t('studio.status.reading') },
    { id: 'want', label: t('studio.status.wantToRead') },
    { id: 'completed', label: t('studio.status.read') },
  ];

  const [selectedShelf, setSelectedShelf] = useState<string | null>(null);

  const displayedBooks = selectedShelf 
    ? filteredBooks.filter(b => b.status === selectedShelf)
    : filteredBooks;

  const handleCreateItem = async () => {
    if (!newItem.title) {
      toast.error(t('common.fillAllFields'));
      return;
    }

    try {
      await createMediaItem.mutateAsync({
        title: newItem.title,
        author: newItem.author || null,
        type: newItem.type,
        status: newItem.status,
        total_pages: newItem.total_pages ? parseInt(newItem.total_pages) : null,
      });
      toast.success(t('studio.itemAdded'));
      setIsDialogOpen(false);
      setNewItem({ title: '', author: '', type: 'book', status: 'want', total_pages: '' });
    } catch (error) {
      toast.error(t('common.error'));
    }
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
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{t('studio.title')}</h1>
            <p className="text-muted-foreground mt-1">{t('studio.subtitle')}</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="gold" size="lg">
                <Plus className="w-5 h-5 me-2" />
                {t('studio.addItem')}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('studio.addItem')}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <Input
                  placeholder={t('studio.itemTitle')}
                  value={newItem.title}
                  onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                />
                <Input
                  placeholder={t('studio.author')}
                  value={newItem.author}
                  onChange={(e) => setNewItem({ ...newItem, author: e.target.value })}
                />
                <Select 
                  value={newItem.type} 
                  onValueChange={(value: 'book' | 'movie' | 'series' | 'podcast' | 'article') => 
                    setNewItem({ ...newItem, type: value })
                  }
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
                  value={newItem.status} 
                  onValueChange={(value: 'want' | 'in_progress' | 'completed' | 'abandoned') => 
                    setNewItem({ ...newItem, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="want">{t('studio.status.wantToRead')}</SelectItem>
                    <SelectItem value="in_progress">{t('studio.status.reading')}</SelectItem>
                    <SelectItem value="completed">{t('studio.status.read')}</SelectItem>
                    <SelectItem value="abandoned">{t('studio.status.abandoned')}</SelectItem>
                  </SelectContent>
                </Select>
                {newItem.type === 'book' && (
                  <Input
                    type="number"
                    placeholder={t('studio.totalPages')}
                    value={newItem.total_pages}
                    onChange={(e) => setNewItem({ ...newItem, total_pages: e.target.value })}
                  />
                )}
                <Button onClick={handleCreateItem} className="w-full" disabled={createMediaItem.isPending}>
                  {createMediaItem.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : t('common.add')}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
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
              <h3 className="font-semibold text-foreground">2024 {t('studio.readingGoal')}</h3>
              <p className="text-sm text-muted-foreground">{booksRead} {t('studio.booksOf')} {booksGoal} {t('studio.books').toLowerCase()}</p>
            </div>
          </div>
          <span className="text-2xl font-bold gold-text">{Math.round((booksRead / booksGoal) * 100)}%</span>
        </div>
        <div className="h-3 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-gold rounded-full transition-all duration-500"
            style={{ width: `${(booksRead / booksGoal) * 100}%` }}
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all',
              activeTab === tab.id 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-muted/50 text-muted-foreground hover:bg-muted'
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Books Section */}
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
                <div
                  key={book.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border hover:border-primary/30 transition-all cursor-pointer group"
                >
                  <span className="text-3xl">{book.cover_url || '📘'}</span>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-foreground text-sm truncate group-hover:text-primary transition-colors">
                      {book.title}
                    </h4>
                    {book.author && (
                      <p className="text-xs text-muted-foreground">{book.author}</p>
                    )}
                    {book.progress && book.progress > 0 && (
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${book.progress}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">{book.progress}%</span>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {book.rating && book.rating > 0 && (
                      <div className="flex items-center gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={cn(
                              'w-3 h-3',
                              i < book.rating! ? 'text-primary fill-primary' : 'text-muted'
                            )}
                          />
                        ))}
                      </div>
                    )}
                    {book.status && (
                      <span className={cn(
                        'px-2 py-0.5 rounded-full text-xs font-medium border',
                        statusColors[book.status]
                      )}>
                        {statusLabels[book.status]}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-muted-foreground">{t('studio.noBooks')}</p>
            </div>
          )}
        </div>

        {/* Movies Section */}
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-semibold text-foreground">{t('studio.moviesShows')}</h3>
            <button className="text-primary text-sm font-medium hover:underline flex items-center gap-1">
              {t('common.viewAll')} <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>

          {filteredMovies.length > 0 ? (
            <div className="space-y-3">
              {filteredMovies.map((movie) => (
                <div
                  key={movie.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border hover:border-primary/30 transition-all cursor-pointer group"
                >
                  <span className="text-3xl">{movie.cover_url || '🎬'}</span>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-foreground text-sm truncate group-hover:text-primary transition-colors">
                      {movie.title}
                    </h4>
                    {movie.author && (
                      <p className="text-xs text-muted-foreground">{movie.author}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {movie.rating && movie.rating > 0 && (
                      <div className="flex items-center gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={cn(
                              'w-3 h-3',
                              i < movie.rating! ? 'text-primary fill-primary' : 'text-muted'
                            )}
                          />
                        ))}
                      </div>
                    )}
                    {movie.status && (
                      <span className={cn(
                        'px-2 py-0.5 rounded-full text-xs font-medium border',
                        statusColors[movie.status]
                      )}>
                        {statusLabels[movie.status]}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Film className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-muted-foreground">{t('studio.noMovies')}</p>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
