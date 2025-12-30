import { BookOpen, Loader2, TrendingUp, Film } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { useCurrentlyReading, useReadingStats, useMediaItems } from '@/hooks/useMedia';
import { useProfile } from '@/hooks/useProfile';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { DashboardWidgetShell, DashboardEmptyState } from './DashboardWidgetShell';

export function StudioWidget() {
  const { t, currentLanguage } = useLanguage();
  const { data: currentlyReading, isLoading } = useCurrentlyReading();
  const { data: stats } = useReadingStats();
  const { data: profile } = useProfile();
  const { data: allMedia } = useMediaItems();

  const booksRead = stats?.booksRead || 0;
  const booksGoal = profile?.reading_goal_yearly || 24;
  const progress = Math.round((booksRead / booksGoal) * 100);
  
  // Calculate additional stats
  const inProgressCount = currentlyReading?.length || 0;
  const moviesWatched = allMedia?.filter(m => 
    (m.type === 'movie' || m.type === 'series') && 
    m.status === 'completed' &&
    m.end_date &&
    new Date(m.end_date).getFullYear() === new Date().getFullYear()
  ).length || 0;

  if (isLoading) {
    return (
      <DashboardWidgetShell
        title={t('common.studio')}
        subtitle={currentLanguage === 'ar' ? 'مكتبتك' : 'Library'}
        icon={BookOpen}
        iconColor="text-amber-500"
        iconBg="bg-amber-500/10"
        accentColor="bg-amber-500/10"
        linkTo="/studio"
        linkText={t('common.viewAll')}
      >
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
        </div>
      </DashboardWidgetShell>
    );
  }

  return (
    <DashboardWidgetShell
      title={t('common.studio')}
      subtitle={currentLanguage === 'ar' ? 'مكتبتك' : 'Library'}
      icon={BookOpen}
      iconColor="text-amber-500"
      iconBg="bg-amber-500/10"
      accentColor="bg-amber-500/10"
      linkTo="/studio"
      linkText={t('common.viewAll')}
    >
      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="text-center p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <p className="text-lg font-bold text-amber-500">{booksRead}</p>
          <p className="text-[9px] text-muted-foreground">
            {currentLanguage === 'ar' ? 'كتب مكتملة' : 'Books Read'}
          </p>
        </div>
        <div className="text-center p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
          <p className="text-lg font-bold text-blue-500">{moviesWatched}</p>
          <p className="text-[9px] text-muted-foreground">
            {currentLanguage === 'ar' ? 'أفلام' : 'Movies'}
          </p>
        </div>
        <div className="text-center p-2 rounded-lg bg-green-500/10 border border-green-500/20">
          <p className="text-lg font-bold text-green-500">{inProgressCount}</p>
          <p className="text-[9px] text-muted-foreground">
            {currentLanguage === 'ar' ? 'قيد القراءة' : 'In Progress'}
          </p>
        </div>
      </div>

      {/* Reading Goal */}
      <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500/10 to-amber-500/5 border border-amber-500/20 mb-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            {new Date().getFullYear()} {t('studio.readingGoal')}
          </span>
          <span className="text-xs font-bold text-amber-500">{progress}%</span>
        </div>
        <div className="h-2 bg-muted/50 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
        <p className="text-[10px] text-muted-foreground mt-1.5">
          {booksRead} {t('studio.booksOf')} {booksGoal} {t('studio.books').toLowerCase()}
        </p>
      </div>

      {/* Currently Reading/Watching */}
      <div>
        <h4 className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
          {currentLanguage === 'ar' ? 'قيد القراءة' : 'Reading Now'}
        </h4>
        {currentlyReading && currentlyReading.length > 0 ? (
          <div className="space-y-1.5">
            {currentlyReading.slice(0, 2).map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-2.5 p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <span className="text-lg">
                  {item.type === 'book' ? '📘' : 
                   item.type === 'movie' ? '🎬' : 
                   item.type === 'series' ? '📺' : '🎧'}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">{item.title}</p>
                  {item.progress !== null && item.progress > 0 && (
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full"
                          style={{ width: `${item.progress}%` }}
                        />
                      </div>
                      <span className="text-[9px] text-muted-foreground">{item.progress}%</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-xs text-muted-foreground">
              {currentLanguage === 'ar' ? 'لا يوجد شيء قيد القراءة' : 'Nothing in progress'}
            </p>
          </div>
        )}
      </div>
    </DashboardWidgetShell>
  );
}