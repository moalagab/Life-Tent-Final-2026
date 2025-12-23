import { MainLayout } from '@/components/layout/MainLayout';
import { BookOpen, Film, Plus, Search, Star, Target, ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Book {
  id: string;
  title: string;
  author: string;
  cover: string;
  rating: number;
  status: 'reading' | 'want-to-read' | 'read' | 'abandoned';
  progress?: number;
}

interface Movie {
  id: string;
  title: string;
  year: number;
  poster: string;
  rating: number;
  status: 'watching' | 'want-to-watch' | 'watched';
}

const mockBooks: Book[] = [
  { id: '1', title: 'Atomic Habits', author: 'James Clear', cover: '📘', rating: 5, status: 'reading', progress: 65 },
  { id: '2', title: 'The Psychology of Money', author: 'Morgan Housel', cover: '📗', rating: 5, status: 'reading', progress: 30 },
  { id: '3', title: 'Deep Work', author: 'Cal Newport', cover: '📕', rating: 4, status: 'read' },
  { id: '4', title: 'The 7 Habits', author: 'Stephen Covey', cover: '📙', rating: 5, status: 'read' },
];

const mockMovies: Movie[] = [
  { id: '1', title: 'The Shawshank Redemption', year: 1994, poster: '🎬', rating: 5, status: 'watched' },
  { id: '2', title: 'Oppenheimer', year: 2023, poster: '🎥', rating: 4, status: 'watching' },
  { id: '3', title: 'Dune: Part Two', year: 2024, poster: '🎞️', rating: 0, status: 'want-to-watch' },
];

const statusColors = {
  reading: 'bg-primary/10 text-primary border-primary/20',
  'want-to-read': 'bg-muted text-muted-foreground border-muted',
  read: 'bg-success/10 text-success border-success/20',
  abandoned: 'bg-destructive/10 text-destructive border-destructive/20',
  watching: 'bg-primary/10 text-primary border-primary/20',
  'want-to-watch': 'bg-muted text-muted-foreground border-muted',
  watched: 'bg-success/10 text-success border-success/20',
};

const booksRead = 18;
const booksGoal = 24;

export default function Studio() {
  return (
    <MainLayout>
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Studio</h1>
            <p className="text-muted-foreground mt-1">Your personal media library</p>
          </div>
          <Button variant="gold" size="lg">
            <Plus className="w-5 h-5 mr-2" />
            Add Item
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
              <h3 className="font-semibold text-foreground">2024 Reading Goal</h3>
              <p className="text-sm text-muted-foreground">{booksRead} of {booksGoal} books</p>
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
        {[
          { id: 'books', label: 'Books', icon: BookOpen },
          { id: 'movies', label: 'Movies & Shows', icon: Film },
        ].map((tab) => (
          <button
            key={tab.id}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all',
              tab.id === 'books' 
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
            <h3 className="text-lg font-semibold text-foreground">Books</h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by title or ISBN..."
                className="pl-10 pr-4 py-2 rounded-xl bg-muted/50 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 w-48"
              />
            </div>
          </div>

          {/* Shelf Filters */}
          <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
            {['All', 'Reading', 'Want to Read', 'Read'].map((shelf) => (
              <button
                key={shelf}
                className={cn(
                  'px-3 py-1 rounded-full text-xs font-medium transition-all whitespace-nowrap',
                  shelf === 'All' 
                    ? 'bg-primary/10 text-primary' 
                    : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                )}
              >
                {shelf}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {mockBooks.map((book) => (
              <div
                key={book.id}
                className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border hover:border-primary/30 transition-all cursor-pointer group"
              >
                <span className="text-3xl">{book.cover}</span>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-foreground text-sm truncate group-hover:text-primary transition-colors">
                    {book.title}
                  </h4>
                  <p className="text-xs text-muted-foreground">{book.author}</p>
                  {book.progress && (
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
                  <div className="flex items-center gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={cn(
                          'w-3 h-3',
                          i < book.rating ? 'text-primary fill-primary' : 'text-muted'
                        )}
                      />
                    ))}
                  </div>
                  <span className={cn(
                    'px-2 py-0.5 rounded-full text-xs font-medium border',
                    statusColors[book.status]
                  )}>
                    {book.status.replace('-', ' ')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Movies Section */}
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-semibold text-foreground">Movies & Shows</h3>
            <button className="text-primary text-sm font-medium hover:underline flex items-center gap-1">
              View All <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-3">
            {mockMovies.map((movie) => (
              <div
                key={movie.id}
                className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border hover:border-primary/30 transition-all cursor-pointer group"
              >
                <span className="text-3xl">{movie.poster}</span>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-foreground text-sm truncate group-hover:text-primary transition-colors">
                    {movie.title}
                  </h4>
                  <p className="text-xs text-muted-foreground">{movie.year}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  {movie.rating > 0 && (
                    <div className="flex items-center gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={cn(
                            'w-3 h-3',
                            i < movie.rating ? 'text-primary fill-primary' : 'text-muted'
                          )}
                        />
                      ))}
                    </div>
                  )}
                  <span className={cn(
                    'px-2 py-0.5 rounded-full text-xs font-medium border',
                    statusColors[movie.status]
                  )}>
                    {movie.status.replace('-', ' ')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
