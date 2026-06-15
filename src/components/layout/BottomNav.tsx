/**
 * BottomNav — Apple Human Interface Guidelines tab bar.
 *
 * Layout:  5 equal tabs (Tasks | Finance | Home | Projects | More).
 * Style:   translucent, backdrop-blur, hairline top separator.
 * Active:  icon + label in primary color, heavier stroke weight.
 * Inactive: #8E8E93 (iOS systemGray).
 * More tab: opens a bottom sheet with all services (HIG-style sheet).
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

/* ── Primary tabs (4 visible + More) ──────────────────────────────── */
const PRIMARY_TABS = [
  { path: '/tasks',     icon: CheckSquare,     ar: 'المهام',    en: 'Tasks'    },
  { path: '/finance',   icon: Wallet,          ar: 'المالية',   en: 'Finance'  },
  { path: '/dashboard', icon: LayoutDashboard, ar: 'الرئيسية',  en: 'Home'     },
  { path: '/projects',  icon: FolderKanban,    ar: 'المشاريع',  en: 'Projects' },
];

/* ── Services shown in the More sheet ─────────────────────────────── */
const SERVICES = [
  { path: '/habits',   icon: Repeat,   ar: 'العادات',   en: 'Habits',    descAr: 'تتبع يومي',         descEn: 'Daily tracking',   from: 'from-green-500',   to: 'to-emerald-600'  },
  { path: '/calendar', icon: Calendar, ar: 'التقويم',   en: 'Calendar',  descAr: 'المواعيد',           descEn: 'Schedule',         from: 'from-sky-500',     to: 'to-blue-600'     },
  { path: '/knowledge',icon: BookOpen, ar: 'المعرفة',   en: 'Knowledge', descAr: 'ملاحظات ومقررات',   descEn: 'Notes & courses',  from: 'from-violet-500',  to: 'to-purple-600'   },
  { path: '/studio',   icon: Film,     ar: 'الاستوديو', en: 'Studio',    descAr: 'كتب وأفلام',         descEn: 'Books & films',    from: 'from-rose-500',    to: 'to-pink-600'     },
  { path: '/pomodoro', icon: Timer,    ar: 'بومودورو',  en: 'Pomodoro',  descAr: 'تركيز عميق',         descEn: 'Deep focus',       from: 'from-orange-500',  to: 'to-red-500'      },
  { path: '/goals',    icon: Target,   ar: 'الأهداف',   en: 'Goals',     descAr: 'OKR والرؤية',        descEn: 'OKRs & vision',    from: 'from-amber-500',   to: 'to-orange-500'   },
];

const ACCOUNT_ITEMS = [
  { path: '/profile',  icon: User,     ar: 'ملفي الشخصي', en: 'My Profile', from: 'from-primary',   to: 'to-primary/70' },
  { path: '/settings', icon: Settings, ar: 'الإعدادات',   en: 'Settings',   from: 'from-slate-500', to: 'to-slate-600'  },
];

/* ── Single tab button ─────────────────────────────────────────────── */
function TabBtn({
  path,
  icon: Icon,
  label,
  isActive,
}: {
  path: string;
  icon: React.ElementType;
  label: string;
  isActive: boolean;
}) {
  return (
    <NavLink
      to={path}
      className={cn('hig-tab-item', isActive && 'is-active')}
      aria-current={isActive ? 'page' : undefined}
    >
      <Icon
        className="transition-colors"
        style={{ width: 26, height: 26 }}
        strokeWidth={isActive ? 2.4 : 1.75}
      />
      <span className="transition-colors">{label}</span>
    </NavLink>
  );
}

/* ── Component ─────────────────────────────────────────────────────── */
export function BottomNav() {
  const { pathname }         = useLocation();
  const { currentLanguage }  = useLanguage();
  const { signOut }          = useAuth();
  const navigate             = useNavigate();
  const { isModuleActive }   = useModuleAccess();
  const [moreOpen, setMoreOpen] = useState(false);
  const isAr = currentLanguage === 'ar';

  const activePrimary  = PRIMARY_TABS.filter(t => isModuleActive(t.path.slice(1)));
  const activeServices = SERVICES.filter(s => isModuleActive(s.path.slice(1)));

  const isMoreActive = [...SERVICES, ...ACCOUNT_ITEMS].some(item => pathname === item.path);

  return (
    <>
      {/* ── iOS tab bar ── */}
      <nav
        className="hig-tab-bar"
        aria-label={isAr ? 'التنقل الرئيسي' : 'Main navigation'}
      >
        {activePrimary.map(tab => (
          <TabBtn
            key={tab.path}
            path={tab.path}
            icon={tab.icon}
            label={isAr ? tab.ar : tab.en}
            isActive={pathname === tab.path}
          />
        ))}

        {/* More tab */}
        <button
          className={cn('hig-tab-item', isMoreActive && 'is-active')}
          onClick={() => setMoreOpen(true)}
          aria-label={isAr ? 'المزيد من الخدمات' : 'More services'}
          aria-haspopup="dialog"
        >
          <LayoutGrid
            style={{ width: 26, height: 26 }}
            strokeWidth={isMoreActive ? 2.4 : 1.75}
            className="transition-colors"
          />
          <span className="transition-colors">{isAr ? 'المزيد' : 'More'}</span>
        </button>
      </nav>

      {/* ── Services sheet — iOS-style bottom sheet ── */}
      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent
          side="bottom"
          className={cn(
            'p-0 border-0',
            'bg-background',
            'rounded-t-[20px]',   /* iOS sheet corner radius */
            'max-h-[88vh] overflow-hidden flex flex-col',
          )}
        >
          {/* iOS drag handle */}
          <div className="flex justify-center pt-2.5 pb-1 shrink-0">
            <div className="w-9 h-1 rounded-full bg-muted-foreground/25" />
          </div>

          {/* Sheet header */}
          <div className="flex items-center justify-between px-4 pt-1 pb-3 shrink-0">
            <div>
              <h2 className="text-[17px] font-semibold text-foreground">
                {isAr ? 'جميع الخدمات' : 'All Services'}
              </h2>
              <p className="text-[13px] text-muted-foreground mt-0.5">
                {isAr
                  ? `${activeServices.length} وحدة نشطة`
                  : `${activeServices.length} active modules`}
              </p>
            </div>
            <button
              onClick={() => setMoreOpen(false)}
              className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground"
              aria-label={isAr ? 'إغلاق' : 'Close'}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Sheet content — scrollable */}
          <div className="flex-1 overflow-y-auto px-4 pb-8 space-y-6">

            {/* Services grid — iOS 3-col */}
            <div className="grid grid-cols-3 gap-3">
              {activeServices.map(item => {
                const active = pathname === item.path;
                return (
                  <button
                    key={item.path}
                    onClick={() => { navigate(item.path); setMoreOpen(false); }}
                    className={cn(
                      'flex flex-col items-center justify-center gap-2.5 py-4 px-2',
                      'rounded-ios-cell transition-all duration-200 active:scale-95',
                      active ? 'bg-card shadow-sm' : 'bg-muted/60 dark:bg-card/60',
                    )}
                  >
                    <div className={cn(
                      'w-12 h-12 rounded-ios-icon flex items-center justify-center',
                      'bg-gradient-to-br shadow-sm',
                      item.from, item.to,
                    )}>
                      <item.icon className="w-5 h-5 text-white" strokeWidth={1.8} />
                    </div>
                    <p className="text-[12px] font-semibold text-foreground text-center leading-tight">
                      {isAr ? item.ar : item.en}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Account section */}
            <div className="hig-section">
              {ACCOUNT_ITEMS.map((item, i) => {
                const active = pathname === item.path;
                return (
                  <button
                    key={item.path}
                    onClick={() => { navigate(item.path); setMoreOpen(false); }}
                    className={cn(
                      'hig-cell w-full transition-colors active:bg-[hsl(var(--ios-gray-5))]',
                      i === 0 && 'rounded-t-ios-cell',
                      i === ACCOUNT_ITEMS.length - 1 && 'rounded-b-ios-cell border-b-0',
                    )}
                  >
                    <div className={cn(
                      'w-9 h-9 rounded-ios-icon flex items-center justify-center bg-gradient-to-br shrink-0',
                      item.from, item.to,
                    )}>
                      <item.icon className="w-[18px] h-[18px] text-white" strokeWidth={1.8} />
                    </div>
                    <span className={cn(
                      'flex-1 text-[16px] text-start',
                      active ? 'text-foreground font-medium' : 'text-foreground',
                    )}>
                      {isAr ? item.ar : item.en}
                    </span>
                    {/* iOS disclosure chevron */}
                    <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
                  </button>
                );
              })}
            </div>

            {/* Sign out — iOS destructive row */}
            <div className="hig-section">
              <button
                onClick={() => { signOut(); setMoreOpen(false); }}
                className="hig-cell w-full rounded-ios-cell border-b-0 text-destructive"
              >
                <div className="w-9 h-9 rounded-ios-icon bg-destructive/15 flex items-center justify-center shrink-0">
                  <LogOut className="w-[18px] h-[18px] text-destructive" strokeWidth={1.8} />
                </div>
                <span className="flex-1 text-[16px] font-semibold text-start">
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

/* inline import for chevron used in sheet */
function ChevronRight({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}
