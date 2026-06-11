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

/**
 * MainLayout — sidebar + flush, seamless top bar.
 *
 * Cross-alignment trick: sidebar logo header and main top-bar share the same
 * height (h-14) and the same border treatment, so the two horizontal dividers
 * meet exactly across the screen as one continuous "command shelf".
 */
export function MainLayout({ children }: MainLayoutProps) {
  const { isRTL, currentLanguage } = useLanguage();
  const isMobile = useIsMobile();
  const isOnline = useOnlineStatus();

  return (
    <div className="min-h-screen relative bg-background">
      <div className="fixed inset-0 -z-10 pointer-events-none bg-gradient-to-b from-primary/[0.02] via-transparent to-transparent" />

      {isMobile ? (
        /* ── Mobile layout: top header + bottom nav (Al Rajhi style) ── */
        <>
          <MobileHeader />
          <main className="min-h-screen mt-14 pb-20">
            {/* Offline banner */}
            {!isOnline && (
              <div className="flex items-center justify-center gap-2 px-4 py-2 bg-destructive/90 text-destructive-foreground text-sm font-medium">
                <WifiOff className="w-4 h-4 shrink-0" />
                <span>
                  {currentLanguage === 'ar'
                    ? 'أنت غير متصل — يتم عرض البيانات المحفوظة مؤقتاً'
                    : 'You are offline — showing cached data'}
                </span>
              </div>
            )}
            <div className="p-4 max-w-[1440px] mx-auto">{children}</div>
          </main>
          <BottomNav />
        </>
      ) : (
        /* ── Desktop layout: sidebar + top bar (unchanged) ── */
        <>
          <Sidebar />
          <main
            className={cn(
              'min-h-screen transition-all duration-300',
              isRTL ? 'mr-64' : 'ml-64',
            )}
          >
            {/* Top bar */}
            <div className="sticky top-0 z-40 flex items-center gap-2 px-4 lg:px-6 h-14 bg-background/85 backdrop-blur-xl border-b border-sidebar-border/60">
              <DashboardTopBar />
            </div>

            {/* Offline banner */}
            {!isOnline && (
              <div className="flex items-center justify-center gap-2 px-4 py-2 bg-destructive/90 text-destructive-foreground text-sm font-medium">
                <WifiOff className="w-4 h-4 shrink-0" />
                <span>
                  {currentLanguage === 'ar'
                    ? 'أنت غير متصل — يتم عرض البيانات المحفوظة مؤقتاً'
                    : 'You are offline — showing cached data'}
                </span>
              </div>
            )}

            <div className="p-4 lg:p-6 max-w-[1440px] mx-auto">{children}</div>
          </main>
        </>
      )}
    </div>
  );
}
