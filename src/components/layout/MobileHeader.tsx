/**
 * MobileHeader — premium top bar for mobile.
 * Shows: app logo | greeting + user name | avatar circle + notifications.
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

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0].toUpperCase())
    .join('');
}

export function MobileHeader() {
  const { user } = useAuth();
  const { currentLanguage } = useLanguage();
  const isAr = currentLanguage === 'ar';

  const fullName = (
    user?.user_metadata?.full_name
    || user?.user_metadata?.name
    || user?.email?.split('@')[0]
    || ''
  );
  const firstName = fullName.split(' ')[0];
  const initials = fullName ? getInitials(fullName) : '?';

  return (
    <header className="fixed top-0 inset-x-0 z-50 h-14 bg-background/96 backdrop-blur-xl border-b border-border/40 flex items-center justify-between px-4">
      {/* Left: Logo + greeting */}
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        <div className="w-8 h-8 rounded-xl bg-gradient-gold flex items-center justify-center shadow-gold-glow-sm shrink-0">
          <Tent className="w-3.5 h-3.5 text-primary-foreground" />
        </div>
        <div className="leading-tight min-w-0">
          <p className="text-[10px] text-muted-foreground leading-none mb-0.5 truncate">
            {timeGreeting(currentLanguage)}
          </p>
          <p className="text-sm font-bold text-foreground truncate max-w-[140px] leading-none">
            {firstName || 'Life Tent'}
          </p>
        </div>
      </div>

      {/* Right: notifications + avatar */}
      <div className="flex items-center gap-2 shrink-0">
        <NotificationCenter />
        {/* User avatar circle */}
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-sm">
          <span className="text-[11px] font-bold text-primary-foreground leading-none">
            {initials}
          </span>
        </div>
      </div>
    </header>
  );
}
