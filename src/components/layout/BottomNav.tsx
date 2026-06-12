/**
 * BottomNav — premium bottom navigation.
 * Center Home button elevated above the bar (gold gradient).
 * Services sheet: full visual launcher grid.
 */
import { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, CheckSquare, Wallet, FolderKanban,
  LayoutGrid, BookOpen, Repeat, Calendar, Film,
  Timer, Settings, LogOut, User, Target, X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/hooks/useLanguage';
import { useAuth } from '@/hooks/useAuth';
import { useModuleAccess } from '@/hooks/useModuleAccess';
import { Sheet, SheetContent } from '@/components/ui/sheet';

/* ── Regular tabs — same style, equal flex-1 ─────────────────────────────── */
/* Order: Tasks | Finance | [HOME] | Projects | More  (5 slots, true center)  */
const SIDE_TABS = [
  { path: '/tasks',    icon: CheckSquare,  ar: 'المهام',   en: 'Tasks',    activeIcon: 'text-blue-400',    activePill: 'bg-blue-400/15'    },
  { path: '/finance',  icon: Wallet,       ar: 'المالية',  en: 'Finance',  activeIcon: 'text-emerald-400', activePill: 'bg-emerald-400/15' },
  // ← HOME injected here (center slot 3 of 5) →
  { path: '/projects', icon: FolderKanban, ar: 'المشاريع', en: 'Projects', activeIcon: 'text-purple-400',  activePill: 'bg-purple-400/15'  },
];

/* ── Services grid ───────────────────────────────────────────────────────── */
const SERVICES = [
  {
    path: '/habits',
    icon: Repeat,
    ar: 'العادات',
    en: 'Habits',
    descAr: 'تتبع يومي',
    descEn: 'Daily tracking',
    from: 'from-green-500',
    to: 'to-emerald-600',
    activeBorder: 'border-green-400/40',
  },
  {
    path: '/calendar',
    icon: Calendar,
    ar: 'التقويم',
    en: 'Calendar',
    descAr: 'المواعيد',
    descEn: 'Schedule',
    from: 'from-sky-500',
    to: 'to-blue-600',
    activeBorder: 'border-sky-400/40',
  },
  {
    path: '/knowledge',
    icon: BookOpen,
    ar: 'المعرفة',
    en: 'Knowledge',
    descAr: 'ملاحظات ومقررات',
    descEn: 'Notes & courses',
    from: 'from-violet-500',
    to: 'to-purple-600',
    activeBorder: 'border-violet-400/40',
  },
  {
    path: '/studio',
    icon: Film,
    ar: 'الاستوديو',
    en: 'Studio',
    descAr: 'كتب وأفلام',
    descEn: 'Books & films',
    from: 'from-rose-500',
    to: 'to-pink-600',
    activeBorder: 'border-rose-400/40',
  },
  {
    path: '/pomodoro',
    icon: Timer,
    ar: 'بومودورو',
    en: 'Pomodoro',
    descAr: 'تركيز عميق',
    descEn: 'Deep focus',
    from: 'from-orange-500',
    to: 'to-red-500',
    activeBorder: 'border-orange-400/40',
  },
  {
    path: '/tasks',
    icon: CheckSquare,
    ar: 'المهام',
    en: 'Tasks',
    descAr: 'قائمة الأعمال',
    descEn: 'To-do list',
    from: 'from-blue-500',
    to: 'to-indigo-600',
    activeBorder: 'border-blue-400/40',
  },
  {
    path: '/finance',
    icon: Wallet,
    ar: 'المالية',
    en: 'Finance',
    descAr: 'إدارة الأموال',
    descEn: 'Money management',
    from: 'from-emerald-500',
    to: 'to-teal-600',
    activeBorder: 'border-emerald-400/40',
  },
  {
    path: '/projects',
    icon: FolderKanban,
    ar: 'المشاريع',
    en: 'Projects',
    descAr: 'تتبع المشاريع',
    descEn: 'Project tracking',
    from: 'from-purple-500',
    to: 'to-indigo-600',
    activeBorder: 'border-purple-400/40',
  },
  {
    path: '/goals',
    icon: Target,
    ar: 'الأهداف',
    en: 'Goals',
    descAr: 'OKR والرؤية',
    descEn: 'OKRs & vision',
    from: 'from-amber-500',
    to: 'to-orange-500',
    activeBorder: 'border-amber-400/40',
  },
];

const ACCOUNT_ITEMS = [
  {
    path: '/profile',
    icon: User,
    ar: 'ملفي الشخصي',
    en: 'My Profile',
    from: 'from-primary',
    to: 'to-primary/70',
  },
  {
    path: '/settings',
    icon: Settings,
    ar: 'الإعدادات',
    en: 'Settings',
    from: 'from-slate-500',
    to: 'to-slate-600',
  },
];

const ALL_MORE = [...SERVICES, ...ACCOUNT_ITEMS];

/* ── Tab button ──────────────────────────────────────────────────────────── */
function TabBtn({ item, active, isAr }: { item: typeof SIDE_TABS[0]; active: boolean; isAr: boolean }) {
  return (
    <NavLink
      to={item.path}
      className="flex flex-col items-center gap-1 py-1 flex-1 min-w-0"
    >
      <div className={cn(
        'flex items-center justify-center w-11 h-7 rounded-full transition-all duration-200',
        active ? item.activePill : 'bg-transparent',
      )}>
        <item.icon
          className={cn('w-[18px] h-[18px] transition-colors duration-200',
            active ? item.activeIcon : 'text-muted-foreground')}
          strokeWidth={active ? 2.3 : 1.8}
        />
      </div>
      <span className={cn(
        'text-[10px] font-medium transition-colors duration-200 truncate',
        active ? item.activeIcon : 'text-muted-foreground',
      )}>
        {isAr ? item.ar : item.en}
      </span>
    </NavLink>
  );
}

/* ── Component ────────────────────────────────────────────────────────────── */
export function BottomNav() {
  const { pathname } = useLocation();
  const { currentLanguage } = useLanguage();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const { isModuleActive } = useModuleAccess();
  const [moreOpen, setMoreOpen] = useState(false);
  const isAr = currentLanguage === 'ar';

  // Filter primary tabs and services grid to active modules only
  const activeSideTabs = SIDE_TABS.filter(t => isModuleActive(t.path.slice(1)));
  const activeServices = SERVICES.filter(s => isModuleActive(s.path.slice(1)));

  const isHomeActive = pathname === '/dashboard';
  const isMoreActive = [...activeServices, ...ACCOUNT_ITEMS].some(item => pathname === item.path);

  return (
    <>
      {/* ── Bottom Tab Bar ── */}
      {/* 5 slots: Tasks | Finance | HOME↑ | Projects | More */}
      <nav className="fixed bottom-0 inset-x-0 z-50 h-[68px] bg-background/96 backdrop-blur-xl border-t border-border/40 flex items-end justify-around px-1 pb-2 overflow-visible">

        {/* Slots 1–2: first two active modules (left of HOME) */}
        {activeSideTabs.slice(0, 2).map(item => (
          <TabBtn key={item.path} item={item} active={pathname === item.path} isAr={isAr} />
        ))}

        {/* Slot 3 (center): Home — elevated */}
        <NavLink
          to="/dashboard"
          className="flex flex-col items-center gap-1 flex-1 min-w-0"
          style={{ marginTop: '-22px' }}
        >
          <div className={cn(
            'w-[52px] h-[52px] rounded-2xl flex items-center justify-center transition-all duration-300',
            'bg-gradient-gold border-[2.5px] border-background',
            isHomeActive
              ? 'shadow-gold-glow scale-[1.06]'
              : 'shadow-[0_6px_22px_rgba(18,26,52,0.45)]',
          )}>
            <LayoutDashboard className="w-[22px] h-[22px] text-white" strokeWidth={2} />
          </div>
          <span className={cn(
            'text-[10px] font-semibold transition-colors duration-200',
            isHomeActive ? 'text-yellow-500 dark:text-yellow-400' : 'text-muted-foreground',
          )}>
            {isAr ? 'الرئيسية' : 'Home'}
          </span>
        </NavLink>

        {/* Slot 4: third active module (right of HOME), if any */}
        {activeSideTabs.slice(2, 3).map(item => (
          <TabBtn key={item.path} item={item} active={pathname === item.path} isAr={isAr} />
        ))}

        {/* Slot 5: More — same height structure as TabBtn */}
        <button
          onClick={() => setMoreOpen(true)}
          className="flex flex-col items-center gap-0.5 py-1 flex-1 min-w-0"
          aria-label={isAr ? 'المزيد من الخدمات' : 'More services'}
          aria-haspopup="dialog"
        >
          <div className={cn(
            'flex items-center justify-center w-11 h-7 rounded-full transition-all duration-200',
            isMoreActive ? 'bg-muted/70' : 'bg-transparent',
          )}>
            <LayoutGrid
              className={cn('w-[18px] h-[18px] transition-colors duration-200',
                isMoreActive ? 'text-foreground' : 'text-muted-foreground')}
              strokeWidth={isMoreActive ? 2.2 : 1.8}
            />
          </div>
          <span className={cn(
            'text-[10px] font-medium transition-colors duration-200',
            isMoreActive ? 'text-foreground' : 'text-muted-foreground',
          )}>
            {isAr ? 'المزيد' : 'More'}
          </span>
        </button>
      </nav>

      {/* ── Services Sheet ── */}
      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent
          side="bottom"
          className="p-0 rounded-t-3xl border-0 bg-background max-h-[88vh] overflow-hidden flex flex-col"
        >
          {/* Drag handle */}
          <div className="flex justify-center pt-3 shrink-0">
            <div className="w-10 h-1 rounded-full bg-border/70" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-3 pb-3 shrink-0">
            <div>
              <h2 className="text-base font-bold text-foreground">
                {isAr ? 'جميع الخدمات' : 'All Services'}
              </h2>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {isAr ? `${activeServices.length} وحدة نشطة` : `${activeServices.length} active modules`}
              </p>
            </div>
            <button
              onClick={() => setMoreOpen(false)}
              className="w-8 h-8 rounded-full bg-muted/70 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto px-4 pb-10 space-y-5">

            {/* ── Main modules grid ── */}
            <div className="grid grid-cols-3 gap-3">
              {activeServices.map(item => {
                const active = pathname === item.path;
                return (
                  <button
                    key={item.path}
                    onClick={() => { navigate(item.path); setMoreOpen(false); }}
                    className={cn(
                      'flex flex-col items-center justify-center gap-2.5 py-4 px-2 rounded-2xl transition-all duration-200 active:scale-95',
                      'border border-transparent',
                      active
                        ? cn('bg-card/80 border-border/50 shadow-sm', item.activeBorder)
                        : 'bg-muted/30 hover:bg-muted/50',
                    )}
                  >
                    {/* Gradient icon */}
                    <div className={cn(
                      'w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br shadow-sm',
                      item.from, item.to,
                    )}>
                      <item.icon className="w-5 h-5 text-white" strokeWidth={1.8} />
                    </div>
                    {/* Label */}
                    <p className={cn(
                      'text-xs font-semibold text-center leading-tight',
                      active ? 'text-foreground' : 'text-foreground/80',
                    )}>
                      {isAr ? item.ar : item.en}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* ── Account section ── */}
            <div className="space-y-2">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-1">
                {isAr ? 'الحساب' : 'Account'}
              </p>
              <div className="grid grid-cols-2 gap-2.5">
                {ACCOUNT_ITEMS.map(item => {
                  const active = pathname === item.path;
                  return (
                    <button
                      key={item.path}
                      onClick={() => { navigate(item.path); setMoreOpen(false); }}
                      className={cn(
                        'flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 active:scale-95',
                        active ? 'bg-card border border-border/50' : 'bg-muted/30 hover:bg-muted/50',
                      )}
                    >
                      <div className={cn(
                        'w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-br shrink-0',
                        item.from, item.to,
                      )}>
                        <item.icon className="w-4.5 h-4.5 text-white w-[18px] h-[18px]" strokeWidth={1.8} />
                      </div>
                      <span className="text-sm font-medium text-foreground/80">
                        {isAr ? item.ar : item.en}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ── Sign out ── */}
            <div className="pt-1 border-t border-border/30">
              <button
                onClick={() => { signOut(); setMoreOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-destructive bg-destructive/8 hover:bg-destructive/12 active:scale-[0.98] transition-all duration-150"
              >
                <div className="w-9 h-9 rounded-xl bg-destructive/15 flex items-center justify-center shrink-0">
                  <LogOut className="w-4.5 h-4.5 text-destructive w-[18px] h-[18px]" strokeWidth={1.8} />
                </div>
                <span className="text-sm font-semibold">
                  {isAr ? 'تسجيل الخروج' : 'Sign Out'}
                </span>
              </button>
            </div>

          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
