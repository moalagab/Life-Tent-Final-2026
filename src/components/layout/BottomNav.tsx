/**
 * BottomNav — Apple Human Interface Guidelines tab bar.
 *
 * Layout:  5 equal tabs (Tasks | Finance | Home | Projects | More).
 * Style:   translucent, backdrop-blur, hairline top separator.
 * Active:  icon + label in primary color, heavier stroke weight.
 * Inactive: #8E8E93 (iOS systemGray).
 * More tab: opens AllServices sheet (lt-* design-system classes).
 */
import { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, CheckSquare, Wallet, FolderKanban, LayoutGrid,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/hooks/useLanguage';
import { useAuth } from '@/hooks/useAuth';
import { useModuleAccess } from '@/hooks/useModuleAccess';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { AllServices } from './AllServices';

/* ── Primary tabs (4 visible + More) ──────────────────────────────── */
const PRIMARY_TABS = [
  { path: '/tasks',     icon: CheckSquare,     ar: 'المهام',    en: 'Tasks',    hue: 'var(--lt-hue-task)'  },
  { path: '/finance',   icon: Wallet,          ar: 'المالية',   en: 'Finance',  hue: 'var(--lt-hue-money)' },
  { path: '/dashboard', icon: LayoutDashboard, ar: 'الرئيسية',  en: 'Home',     hue: 'var(--lt-primary)'   },
  { path: '/projects',  icon: FolderKanban,    ar: 'المشاريع',  en: 'Projects', hue: 'var(--lt-hue-proj)'  },
];

/* ── Routes that live inside the More sheet (for isMoreActive check) ── */
const MORE_PATHS = [
  '/habits', '/calendar', '/knowledge', '/studio',
  '/pomodoro', '/goals', '/profile', '/settings',
];

/* ── Single tab button ─────────────────────────────────────────────── */
function TabBtn({
  path,
  icon: Icon,
  label,
  isActive,
  hue,
}: {
  path: string;
  icon: React.ElementType;
  label: string;
  isActive: boolean;
  hue?: string;
}) {
  return (
    <NavLink
      to={path}
      className={cn('hig-tab-item', isActive && 'is-active')}
      aria-current={isActive ? 'page' : undefined}
      style={isActive && hue ? { color: hue } : undefined}
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

  const activePrimary = PRIMARY_TABS.filter(t => isModuleActive(t.path.slice(1)));

  // Build a Set of active module IDs for AllServices filtering
  const activeIds = new Set(
    ['knowledge','calendar','habits','tasks','pomodoro','studio','goals','projects','finance']
      .filter(id => isModuleActive(id))
  );

  const isMoreActive = MORE_PATHS.some(p => pathname === p);

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
            hue={tab.hue}
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

      {/* ── More sheet — uses AllServices (lt-* design system) ── */}
      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent
          side="bottom"
          className="p-0 border-0 bg-transparent max-h-[92vh] overflow-y-auto"
        >
          <AllServices
            activeIds={activeIds}
            onClose={() => setMoreOpen(false)}
            onNavigate={(path) => { navigate(path); setMoreOpen(false); }}
            onLogout={() => { signOut(); setMoreOpen(false); }}
          />
        </SheetContent>
      </Sheet>
    </>
  );
}

