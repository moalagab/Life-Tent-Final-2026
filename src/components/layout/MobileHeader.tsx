/**
 * MobileHeader — Al Rajhi-style top bar for mobile.
 * Replaces the sidebar's hamburger bar on phones.
 * Shows: app logo + greeting + user name | notifications.
 */
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';
import { Tent } from 'lucide-react';

function timeGreeting(lang: string): string {
  const h = new Date().getHours();
  if (lang === 'ar') {
    if (h >= 5  && h < 12) return 'صباح الخير';
    if (h >= 12 && h < 17) return 'مساء النور';
    if (h >= 17 && h < 21) return 'مساء الخير';
    return 'أهلاً بك';
  }
  if (h >= 5  && h < 12) return 'Good morning';
  if (h >= 12 && h < 17) return 'Good afternoon';
  if (h >= 17 && h < 21) return 'Good evening';
  return 'Welcome back';
}

export function MobileHeader() {
  const { user } = useAuth();
  const { currentLanguage } = useLanguage();
  const isAr = currentLanguage === 'ar';

  const firstName = (
    user?.user_metadata?.full_name?.split(' ')[0]
    || user?.user_metadata?.name?.split(' ')[0]
    || user?.email?.split('@')[0]
    || ''
  );

  return (
    <header className="fixed top-0 inset-x-0 z-50 h-14 bg-background/95 backdrop-blur-xl border-b border-border/50 flex items-center justify-between px-4">
      {/* Logo + greeting */}
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-violet-500 flex items-center justify-center shadow-sm shrink-0">
          <Tent className="w-3.5 h-3.5 text-white" />
        </div>
        <div className="leading-tight min-w-0">
          <p className="text-[10px] text-muted-foreground leading-none mb-0.5">
            {timeGreeting(currentLanguage)}
          </p>
          <p className="text-sm font-semibold text-foreground truncate max-w-[160px] leading-none">
            {firstName || 'Life Tent'}
          </p>
        </div>
      </div>

      {/* Notification bell */}
      <div className="flex items-center gap-1 shrink-0">
        <NotificationCenter />
      </div>
    </header>
  );
}
