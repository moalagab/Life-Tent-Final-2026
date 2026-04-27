import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { useLanguage } from '@/hooks/useLanguage';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { DashboardTopBar } from '@/components/dashboard/DashboardTopBar';

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
  const { isRTL } = useLanguage();
  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen relative bg-background">
      {/* Single, very subtle ambient wash — no competing blobs */}
      <div className="fixed inset-0 -z-10 pointer-events-none bg-gradient-to-b from-primary/[0.02] via-transparent to-transparent" />

      <Sidebar />
      <main
        className={cn(
          'min-h-screen transition-all duration-300',
          isMobile ? 'mt-14' : isRTL ? 'mr-64' : 'ml-64'
        )}
      >
        {/* Top bar — shares h-14 with sidebar header, same border = one shelf line */}
        <div
          className={cn(
            'sticky top-0 z-40 flex items-center gap-2 px-4 lg:px-6 h-14',
            'bg-background/85 backdrop-blur-xl',
            'border-b border-sidebar-border/60',
            isMobile && 'top-14'
          )}
        >
          <DashboardTopBar />
        </div>

        <div className="p-4 lg:p-6 max-w-[1440px] mx-auto">{children}</div>
      </main>
    </div>
  );
}
