import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { useLanguage } from '@/hooks/useLanguage';
import { cn } from '@/lib/utils';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { isRTL } = useLanguage();

  return (
    <div className="min-h-screen">
      <Sidebar />
      <main className={cn(
        'min-h-screen transition-all duration-300',
        isRTL ? 'mr-64' : 'ml-64'
      )}>
        <div className="p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
