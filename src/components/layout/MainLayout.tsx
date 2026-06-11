import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { MobileHeader } from './MobileHeader';
import { useLanguage } from '@/hooks/useLanguage';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { DashboardTopBar } from '@/components/dashboard/DashboardTopBar';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { WifiOff } from 'lucide-react';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { isRTL, currentLanguage } = useLanguage();
  const isMobile = useIsMobile();
  const isOnline = useOnlineStatus();

  return (
    <div className="min-h-screen bg-background">
      {/* Ambient background glow — subtle, navy-tinted */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.03] via-transparent to-transparent" />
      </div>

      {isMobile ? (
        /* ────────────────────────────────────────────────
           Mobile layout — full-bleed, bottom-nav shell
        ──────────────────────────────────────────────── */
        <>
          <MobileHeader />

          <main className="min-h-screen pt-14 pb-[72px]">
            {/* Offline banner */}
            {!isOnline && (
              <div className="flex items-center justify-center gap-2 px-4 py-2.5 bg-destructive/90 text-destructive-foreground text-xs font-medium">
                <WifiOff className="w-3.5 h-3.5 shrink-0" />
                <span>
                  {currentLanguage === 'ar'
                    ? 'أنت غير متصل — يتم عرض البيانات المحفوظة مؤقتاً'
                    : 'You are offline — showing cached data'}
                </span>
              </div>
            )}

            {/* Page content — slide-up entrance */}
            <div className="animate-slide-up px-4 py-5 max-w-[640px] mx-auto">
              {children}
            </div>
          </main>

          <BottomNav />
        </>
      ) : (
        /* ────────────────────────────────────────────────
           Desktop layout — sidebar + content shell
        ──────────────────────────────────────────────── */
        <>
          <Sidebar />

          <main
            className={cn(
              'min-h-screen flex flex-col transition-all duration-300',
              isRTL ? 'mr-64' : 'ml-64',
            )}
          >
            {/* Top command bar */}
            <div className={cn(
              'sticky top-0 z-40 h-14 flex items-center gap-3',
              'px-5 lg:px-7',
              'bg-background/90 backdrop-blur-2xl',
              'border-b border-border/50',
              'shadow-[0_1px_3px_rgba(18,26,52,0.04)]',
            )}>
              <DashboardTopBar />
            </div>

            {/* Offline banner */}
            {!isOnline && (
              <div className="flex items-center justify-center gap-2 px-4 py-2.5 bg-destructive/90 text-destructive-foreground text-xs font-medium shrink-0">
                <WifiOff className="w-3.5 h-3.5 shrink-0" />
                <span>
                  {currentLanguage === 'ar'
                    ? 'أنت غير متصل — يتم عرض البيانات المحفوظة مؤقتاً'
                    : 'You are offline — showing cached data'}
                </span>
              </div>
            )}

            {/* Page content area */}
            <div className="flex-1 animate-fade-in">
              <div className="px-5 lg:px-8 py-6 max-w-[1440px] mx-auto">
                {children}
              </div>
            </div>
          </main>
        </>
      )}
    </div>
  );
}
