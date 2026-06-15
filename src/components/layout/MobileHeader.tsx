/**
 * MobileHeader — Apple Human Interface Guidelines navigation bar.
 *
 * iOS HIG pattern: navigation bar (top) + tab bar (bottom).
 * No hamburger drawer — all navigation lives in BottomNav + More sheet.
 *
 * Height: 44px base + safe-area-inset-top via .hig-nav-bar.
 * Material: translucent, backdrop-blur (vibrancy simulation).
 * Hairline separator: 0.5px rgba(60,60,67,0.29).
 */
import { useAuth }     from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { useTheme }    from '@/hooks/useTheme';
import { useLocation } from 'react-router-dom';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';
import { Tent, Sun, Moon } from 'lucide-react';

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

const PAGE_TITLES: Record<string, { ar: string; en: string }> = {
  '/dashboard': { ar: 'الرئيسية',     en: 'Dashboard' },
  '/tasks':     { ar: 'المهام',       en: 'Tasks'     },
  '/projects':  { ar: 'المشاريع',     en: 'Projects'  },
  '/goals':     { ar: 'الأهداف',      en: 'Goals'     },
  '/finance':   { ar: 'المالية',      en: 'Finance'   },
  '/knowledge': { ar: 'المعرفة',      en: 'Knowledge' },
  '/habits':    { ar: 'العادات',      en: 'Habits'    },
  '/calendar':  { ar: 'التقويم',      en: 'Calendar'  },
  '/studio':    { ar: 'الاستوديو',    en: 'Studio'    },
  '/pomodoro':  { ar: 'بومودورو',     en: 'Pomodoro'  },
  '/settings':  { ar: 'الإعدادات',    en: 'Settings'  },
  '/profile':   { ar: 'الملف الشخصي', en: 'Profile'   },
};

function getInitials(name: string): string {
  return name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('');
}

export function MobileHeader() {
  const { user }            = useAuth();
  const { currentLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const { pathname }        = useLocation();
  const isAr = currentLanguage === 'ar';

  const fullName  = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || '';
  const firstName = fullName.split(' ')[0];
  const initials  = fullName ? getInitials(fullName) : '?';
  const isDashboard = pathname === '/dashboard';
  const pageTitle   = PAGE_TITLES[pathname];

  return (
    <header className="hig-nav-bar">

      {/* ── Left: app icon + greeting or page title ── */}
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        <div className="w-7 h-7 rounded-ios-icon bg-primary flex items-center justify-center shrink-0 shadow-sm">
          <Tent className="w-3.5 h-3.5 text-primary-foreground" />
        </div>

        {isDashboard ? (
          /* Dashboard: greeting line + first name */
          <div className="leading-tight min-w-0">
            <p className="text-[11px] text-muted-foreground leading-none mb-0.5 truncate">
              {timeGreeting(currentLanguage)}
            </p>
            <p className="text-[15px] font-semibold text-foreground truncate leading-none">
              {firstName || 'Life Tent'}
            </p>
          </div>
        ) : pageTitle ? (
          /* Section pages: title in 17pt semibold (HIG headline) */
          <p className="text-[17px] font-semibold text-foreground truncate">
            {isAr ? pageTitle.ar : pageTitle.en}
          </p>
        ) : null}
      </div>

      {/* ── Right: theme toggle + notifications + avatar ── */}
      <div className="flex items-center gap-2.5 shrink-0">
        <button
          onClick={toggleTheme}
          className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          aria-label={theme === 'dark'
            ? (isAr ? 'الوضع النهاري' : 'Light mode')
            : (isAr ? 'الوضع الليلي' : 'Dark mode')}
        >
          {theme === 'dark'
            ? <Sun  className="w-4.5 h-4.5" strokeWidth={1.75} />
            : <Moon className="w-4.5 h-4.5" strokeWidth={1.75} />}
        </button>
        <NotificationCenter />

        <div
          className="w-8 h-8 rounded-full bg-primary flex items-center justify-center"
          aria-label={isAr ? 'الملف الشخصي' : 'Profile'}
        >
          <span className="text-[11px] font-bold text-primary-foreground leading-none">
            {initials}
          </span>
        </div>
      </div>
    </header>
  );
}
