import { BookOpen, Loader2 } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { useCurrentlyReading, useReadingStats } from '@/hooks/useMedia';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { DashboardWidgetShell, DashboardEmptyState } from './DashboardWidgetShell';

export function StudioWidget() {
  const { t, currentLanguage } = useLanguage();
  const { data: currentlyReading, isLoading } = useCurrentlyReading();
  const { data: stats } = useReadingStats();

  const booksRead = stats?.booksRead || 0;
  const booksGoal = stats?.goal || 24;
  const progress = Math.round((booksRead / booksGoal) * 100);

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
      {/* Reading Goal */}
      <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500/10 to-amber-500/5 border border-amber-500/20 mb-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-muted-foreground">
            {new Date().getFullYear()} {t('studio.readingGoal')}
          </span>
          <span className="text-xs font-bold text-amber-500">{progress}%</span>
        </div>
        <div className="h-1.5 bg-muted/50 rounded-full overflow-hidden">
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
            {currentlyReading.slice(0, 3).map((item) => (
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