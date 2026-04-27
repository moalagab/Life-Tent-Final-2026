import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { useLanguage } from '@/hooks/useLanguage';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { DashboardTopBar } from '@/components/dashboard/DashboardTopBar';

interface MainLayoutProps {
  children: ReactNode;
}

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
          isMobile ? 'mt-16' : isRTL ? 'mr-64' : 'ml-64'
        )}
      >
        {/* Top bar — global search + create + notifications */}
        <div
          className={cn(
            'sticky top-0 z-40 flex items-center gap-2 px-4 lg:px-6 h-14 bg-background/85 backdrop-blur-xl border-b border-border/40',
            isMobile && 'top-16'
          )}
        >
          <DashboardTopBar />
        </div>

        <div className="p-4 lg:p-6 max-w-[1440px] mx-auto">{children}</div>
      </main>
    </div>
  );
}
