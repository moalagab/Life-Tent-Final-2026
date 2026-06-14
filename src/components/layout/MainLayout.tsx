import { ReactNode, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { MobileHeader } from './MobileHeader';
import { useLanguage } from '@/hooks/useLanguage';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { DashboardTopBar } from '@/components/dashboard/DashboardTopBar';
import { useOfflineQueue } from '@/hooks/useOfflineQueue';
import { useToast } from '@/hooks/use-toast';
import { WifiOff } from 'lucide-react';
import { ModuleUnlockSheet } from '@/components/modules/ModuleUnlockSheet';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { isRTL, currentLanguage } = useLanguage();
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const { isOnline, conflicts, clearConflicts } = useOfflineQueue();

  // Show a toast when offline mutations were discarded due to server conflicts
  useEffect(() => {
    if (conflicts.length === 0) return;
    toast({
      title: currentLanguage === 'ar' ? 'تعارض في البيانات' : 'Sync conflict',
      description: currentLanguage === 'ar'
        ? `${conflicts.length} تعديل أُجري أثناء الانقطاع تم تجاهله — النظام يحتفظ بأحدث نسخة من الخادم.`
        : `${conflicts.length} offline edit(s) discarded — server version is newer.`,
      variant: 'destructive',
    });
    clearConflicts();
  }, [conflicts, clearConflicts, currentLanguage, toast]);

  return (
    <div className="min-h-screen bg-background">
      {/* Progressive module unlock prompt */}
      <ModuleUnlockSheet />
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

          {/* iOS-style main: respects nav bar + tab bar safe areas */}
          <main
            className="min-h-screen"
            style={{
              paddingTop:    'calc(44px + env(safe-area-inset-top, 0px))',
              paddingBottom: 'calc(49px + env(safe-area-inset-bottom, 0px))',
            }}
          >
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
            className="min-h-screen flex flex-col"
            style={{
              marginInlineStart: 'var(--sidebar-width, 240px)',
              transition: 'margin-inline-start 200ms ease-out',
            }}
          >
            {/* Fluent command bar — 48px, acrylic/blur */}
            <div className={cn(
              'fluent-command-bar',
              'px-5 lg:px-7',
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
