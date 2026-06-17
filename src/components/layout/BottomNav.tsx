/**
 * BottomNav — Apple Human Interface Guidelines tab bar.
 *
 * Layout:  Home | Spaces | [Capture FAB] | Calendar | Finance
 * Style:   translucent, backdrop-blur, hairline top separator.
 * Active:  icon + label in primary color, heavier stroke weight.
 * Inactive: #8E8E93 (iOS systemGray).
 * Center:  Capture FAB — opens NaturalCapture bottom sheet.
 */
import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, FolderKanban, Wallet, Calendar, Plus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/hooks/useLanguage';
import { useModuleAccess } from '@/hooks/useModuleAccess';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { NaturalCapture } from '@/components/capture/NaturalCapture';

/* ── Primary tabs (2 left + 2 right around centre FAB) ───────────── */
const LEFT_TABS = [
  { path: '/dashboard', icon: LayoutDashboard, ar: 'الرئيسية', en: 'Home'   },
  { path: '/projects',  icon: FolderKanban,    ar: 'الفضاءات', en: 'Spaces' },
];
const RIGHT_TABS = [
  { path: '/calendar', icon: Calendar, ar: 'التقويم', en: 'Calendar' },
  { path: '/finance',  icon: Wallet,   ar: 'المالية', en: 'Finance'  },
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
  const { isModuleActive }   = useModuleAccess();
  const [captureOpen, setCaptureOpen] = useState(false);
  const isAr = currentLanguage === 'ar';

  const leftTabs  = LEFT_TABS.filter(t => isModuleActive(t.path.slice(1)));
  const rightTabs = RIGHT_TABS.filter(t => isModuleActive(t.path.slice(1)));

  return (
    <>
      {/* ── iOS tab bar ── */}
      <nav
        className="hig-tab-bar"
        aria-label={isAr ? 'التنقل الرئيسي' : 'Main navigation'}
      >
        {/* Left tabs */}
        {leftTabs.map(tab => (
          <TabBtn
            key={tab.path}
            path={tab.path}
            icon={tab.icon}
            label={isAr ? tab.ar : tab.en}
            isActive={pathname === tab.path}
          />
        ))}

        {/* Centre capture FAB */}
        <button
          onClick={() => setCaptureOpen(true)}
          aria-label={isAr ? 'التقاط' : 'Capture'}
          className="hig-tab-item"
        >
          <div className="w-[42px] h-[42px] rounded-full bg-primary flex items-center justify-center shadow-md -mt-3 transition-transform active:scale-90">
            <Plus className="w-6 h-6 text-primary-foreground" strokeWidth={2.5} />
          </div>
          <span className="transition-colors text-primary">{isAr ? 'التقاط' : 'Capture'}</span>
        </button>

        {/* Right tabs */}
        {rightTabs.map(tab => (
          <TabBtn
            key={tab.path}
            path={tab.path}
            icon={tab.icon}
            label={isAr ? tab.ar : tab.en}
            isActive={pathname === tab.path}
          />
        ))}
      </nav>

      {/* ── Capture sheet ── */}
      <Sheet open={captureOpen} onOpenChange={setCaptureOpen}>
        <SheetContent
          side="bottom"
          className="p-4 border-0 bg-background/95 backdrop-blur-xl max-h-[80vh] overflow-y-auto rounded-t-2xl"
        >
          <NaturalCapture />
        </SheetContent>
      </Sheet>
    </>
  );
}
