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
    <div className="min-h-screen relative">
      {/* Ambient backdrop — kept subtle */}
      <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
        <div className="absolute -top-1/4 -right-1/4 w-[60vw] h-[60vw] rounded-full bg-primary/[0.04] blur-3xl" />
        <div className="absolute -bottom-1/4 -left-1/4 w-[50vw] h-[50vw] rounded-full bg-primary/[0.03] blur-3xl" />
      </div>

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
