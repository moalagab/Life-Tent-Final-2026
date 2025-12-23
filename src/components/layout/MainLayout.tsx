import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { useLanguage } from '@/hooks/useLanguage';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { isRTL } = useLanguage();
  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen">
      <Sidebar />
      <main className={cn(
        'min-h-screen transition-all duration-300',
        isMobile ? 'mt-16' : (isRTL ? 'mr-64' : 'ml-64')
      )}>
        <div className={cn(
          'sticky top-0 z-40 flex justify-end p-4 bg-background/80 backdrop-blur-sm border-b border-border',
          isMobile && 'top-16'
        )}>
          <NotificationCenter />
        </div>
        <div className="p-4 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
