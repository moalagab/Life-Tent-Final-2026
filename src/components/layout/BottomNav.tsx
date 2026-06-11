/**
 * BottomNav — Al Rajhi-style bottom navigation for mobile.
 * 4 primary tabs + "More" sheet for secondary pages.
 * Desktop: not rendered (handled by Sidebar).
 */
import { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, CheckSquare, Wallet, FolderKanban,
  MoreHorizontal, BookOpen, Repeat, Calendar, Film,
  Timer, Settings, LogOut, User, Target, Tent,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/hooks/useLanguage';
import { useAuth } from '@/hooks/useAuth';
import { Sheet, SheetContent } from '@/components/ui/sheet';

const PRIMARY = [
  { path: '/dashboard', icon: LayoutDashboard, ar: 'الرئيسية', en: 'Home' },
  { path: '/tasks',     icon: CheckSquare,     ar: 'المهام',    en: 'Tasks' },
  { path: '/finance',   icon: Wallet,          ar: 'المالية',   en: 'Finance' },
  { path: '/projects',  icon: FolderKanban,    ar: 'المشاريع',  en: 'Projects' },
];

const MORE = [
  { path: '/goals',     icon: Target,   ar: 'الأهداف',       en: 'Goals' },
  { path: '/habits',    icon: Repeat,   ar: 'العادات',        en: 'Habits' },
  { path: '/calendar',  icon: Calendar, ar: 'التقويم',        en: 'Calendar' },
  { path: '/knowledge', icon: BookOpen, ar: 'المعرفة',        en: 'Knowledge' },
  { path: '/studio',    icon: Film,     ar: 'الاستوديو',      en: 'Studio' },
  { path: '/pomodoro',  icon: Timer,    ar: 'البومودور',       en: 'Pomodoro' },
  { path: '/settings',  icon: Settings, ar: 'الإعدادات',      en: 'Settings' },
  { path: '/profile',   icon: User,     ar: 'الملف الشخصي',   en: 'Profile' },
];

export function BottomNav() {
  const { pathname } = useLocation();
  const { currentLanguage, isRTL } = useLanguage();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [moreOpen, setMoreOpen] = useState(false);
  const isAr = currentLanguage === 'ar';

  const isMoreActive = MORE.some(item => pathname === item.path);

  return (
    <>
      {/* ── Bar ── */}
      <nav
        className={cn(
          'fixed bottom-0 inset-x-0 z-50',
          'h-16 bg-background/95 backdrop-blur-xl',
          'border-t border-border/50',
          'flex items-center justify-around px-1',
          // safe-area-inset for notched phones
          'pb-safe',
        )}
      >
        {PRIMARY.map(item => {
          const active = pathname === item.path;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className="flex flex-col items-center gap-0.5 py-1 flex-1 min-w-0"
            >
              {/* pill indicator */}
              <div className={cn(
                'flex items-center justify-center w-12 h-7 rounded-full transition-all duration-200',
                active ? 'bg-primary/15' : 'bg-transparent',
              )}>
                <item.icon
                  className={cn('w-5 h-5 transition-colors duration-200',
                    active ? 'text-primary' : 'text-muted-foreground')}
                  strokeWidth={active ? 2.4 : 1.8}
                />
              </div>
              <span className={cn(
                'text-[10px] font-medium transition-colors duration-200 truncate',
                active ? 'text-primary' : 'text-muted-foreground',
              )}>
                {isAr ? item.ar : item.en}
              </span>
            </NavLink>
          );
        })}

        {/* More */}
        <button
          onClick={() => setMoreOpen(true)}
          className="flex flex-col items-center gap-0.5 py-1 flex-1 min-w-0"
        >
          <div className={cn(
            'flex items-center justify-center w-12 h-7 rounded-full transition-all duration-200',
            isMoreActive ? 'bg-primary/15' : 'bg-transparent',
          )}>
            <MoreHorizontal
              className={cn('w-5 h-5 transition-colors duration-200',
                isMoreActive ? 'text-primary' : 'text-muted-foreground')}
              strokeWidth={isMoreActive ? 2.4 : 1.8}
            />
          </div>
          <span className={cn(
            'text-[10px] font-medium transition-colors duration-200',
            isMoreActive ? 'text-primary' : 'text-muted-foreground',
          )}>
            {isAr ? 'المزيد' : 'More'}
          </span>
        </button>
      </nav>

      {/* ── More Sheet ── */}
      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent
          side={isRTL ? 'right' : 'left'}
          className="p-0 w-72 bg-background border-border/60"
        >
          <div className="flex flex-col h-full">
            {/* Brand header */}
            <div className="flex items-center gap-3 px-5 h-16 border-b border-border/50 shrink-0">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-violet-500 flex items-center justify-center shadow-md">
                <Tent className="w-4 h-4 text-white" />
              </div>
              <div className="leading-tight">
                <div className="text-sm font-bold text-foreground tracking-wide">LIFE TENT</div>
                <div className="text-[10px] text-muted-foreground">نظام حياتك</div>
              </div>
            </div>

            {/* Nav list */}
            <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
              {MORE.map(item => {
                const active = pathname === item.path;
                return (
                  <button
                    key={item.path}
                    onClick={() => { navigate(item.path); setMoreOpen(false); }}
                    className={cn(
                      'w-full flex items-center gap-3.5 px-3.5 py-3 rounded-xl text-start transition-colors duration-150',
                      active
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
                    )}
                  >
                    <item.icon className="w-5 h-5 shrink-0" strokeWidth={active ? 2.2 : 1.8} />
                    <span className="text-sm font-medium">{isAr ? item.ar : item.en}</span>
                  </button>
                );
              })}
            </nav>

            {/* Sign out */}
            <div className="p-3 border-t border-border/50 shrink-0">
              <button
                onClick={() => { signOut(); setMoreOpen(false); }}
                className="w-full flex items-center gap-3.5 px-3.5 py-3 rounded-xl text-destructive hover:bg-destructive/10 transition-colors duration-150"
              >
                <LogOut className="w-5 h-5 shrink-0" strokeWidth={1.8} />
                <span className="text-sm font-medium">{isAr ? 'تسجيل الخروج' : 'Sign Out'}</span>
              </button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
