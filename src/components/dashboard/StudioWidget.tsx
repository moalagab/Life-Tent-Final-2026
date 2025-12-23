import { BookOpen, Film, ArrowUpRight, Loader2 } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { useCurrentlyReading, useReadingStats } from '@/hooks/useMedia';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

export function StudioWidget() {
  const { t, currentLanguage } = useLanguage();
  const { data: currentlyReading, isLoading } = useCurrentlyReading();
  const { data: stats } = useReadingStats();

  const booksRead = stats?.booksRead || 0;
  const booksGoal = stats?.goal || 24;
  const progress = Math.round((booksRead / booksGoal) * 100);

  if (isLoading) {
    return (
      <div className="glass-card p-5">
        <div className="flex items-center justify-center h-32">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-gold flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{t('common.studio')}</h3>
            <p className="text-xs text-muted-foreground">
              {currentLanguage === 'ar' ? 'مكتبتك الإعلامية' : 'Your media library'}
            </p>
          </div>
        </div>
        <Link 
          to="/studio" 
          className="text-primary text-sm font-medium hover:underline flex items-center gap-1"
        >
          {t('common.viewAll')} <ArrowUpRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Reading Goal Mini Progress */}
      <div className="mb-4 p-3 rounded-lg bg-muted/30">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">
            {new Date().getFullYear()} {t('studio.readingGoal')}
          </span>
          <span className="text-sm font-bold gold-text">{progress}%</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-gold rounded-full transition-all duration-500"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {booksRead} {t('studio.booksOf')} {booksGoal} {t('studio.books').toLowerCase()}
        </p>
      </div>

      {/* Currently Reading/Watching */}
      <div>
        <h4 className="text-sm font-medium text-foreground mb-3">
          {currentLanguage === 'ar' ? 'قيد القراءة/المشاهدة' : 'Currently Reading/Watching'}
        </h4>
        {currentlyReading && currentlyReading.length > 0 ? (
          <div className="space-y-2">
            {currentlyReading.slice(0, 3).map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 p-2 rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors"
              >
                <span className="text-xl">
                  {item.type === 'book' ? '📘' : 
                   item.type === 'movie' ? '🎬' : 
                   item.type === 'series' ? '📺' : '🎧'}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
                  {item.progress !== null && item.progress > 0 && (
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
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground">
              {currentLanguage === 'ar' ? 'لا يوجد شيء قيد القراءة حالياً' : 'Nothing in progress'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}