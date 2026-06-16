/**
 * Sidebar — Fluent UI 2 nav rail.
 *
 * Desktop:  fixed left/right rail, collapsible (240px ↔ 52px).
 *           Active item: 3px accent bar + subtle tinted fill (fluent-fill-selected).
 *           Mica-simulated: near-white/near-black with backdrop blur.
 *
 * Mobile:   Sheet overlay (unchanged from previous behaviour).
 */
import React, { useState, memo } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { useIsMobile } from '@/hooks/use-mobile';
import { useIsAdmin } from '@/hooks/useAdmin';
import { useModuleAccess } from '@/hooks/useModuleAccess';
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Target,
  Wallet,
  BookOpen,
  Repeat,
  Calendar,
  Film,
  Settings,
  ChevronLeft,
  Tent,
  LogOut,
  Timer,
  X,
  ShieldCheck,
  Activity,
} from 'lucide-react';

interface NavItem { path: string; icon: React.ElementType; labelKey: string; hue?: string; }

interface SidebarContentProps {
  collapsed: boolean;
  isMobile: boolean;
  navItems: NavItem[];
  locationPath: string;
  isRTL: boolean;
  onNavClick: () => void;
  onSignOut: () => void;
  onClose: () => void;
  onToggleCollapse: () => void;
  t: (key: string) => string;
  userName?: string;
  userInitials?: string;
}

const SidebarContent = memo(function SidebarContent({
  collapsed, isMobile, navItems, locationPath, isRTL,
  onNavClick, onSignOut, onClose, onToggleCollapse, t, userName, userInitials,
}: SidebarContentProps) {
  const isCollapsed = collapsed && !isMobile;

  return (
    <div className="flex flex-col h-full">

      {/* ── Header — Fluent top area ── */}
      <div className={cn(
        'flex items-center border-b border-sidebar-border/50',
        isCollapsed ? 'h-12 justify-center px-0' : 'h-12 justify-between px-3',
      )}>
        <div className={cn(
          'flex items-center gap-2.5 min-w-0',
          isCollapsed && 'justify-center',
        )}>
          {/* App icon — Fluent rounded square */}
          <div className="w-8 h-8 rounded-fluent-sm bg-primary flex items-center justify-center shrink-0 shadow-sm">
            <Tent className="w-4 h-4 text-primary-foreground" />
          </div>
          {!isCollapsed && (
            <div className="leading-tight min-w-0">
              <p className="text-[13px] font-semibold text-foreground tracking-wide truncate">
                LIFE TENT
              </p>
              <p className="text-[10px] text-muted-foreground leading-none">نظام حياتك</p>
            </div>
          )}
        </div>

        {isMobile && (
          <button
            onClick={onClose}
            aria-label={t('common.close')}
            className="p-1.5 rounded-fluent-sm text-muted-foreground hover:bg-[var(--fluent-fill-hover,rgba(0,0,0,0.06))] hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* ── Navigation items ── */}
      <nav
        aria-label="Main navigation"
        className={cn(
          'flex-1 overflow-y-auto py-2 space-y-0.5',
          isCollapsed ? 'px-1.5' : 'px-2',
        )}
      >
        {navItems.map((item) => {
          const isActive = locationPath === item.path;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onNavClick}
              aria-current={isActive ? 'page' : undefined}
              title={isCollapsed ? t(item.labelKey) : undefined}
              className={cn(
                'fluent-nav-item',
                isCollapsed && 'justify-center px-0 w-[36px] mx-auto',
              )}
            >
              <item.icon
                className={cn(
                  'shrink-0 w-[18px] h-[18px] transition-colors',
                  isActive ? 'text-primary' : 'text-muted-foreground',
                )}
              />
              {!isCollapsed && (
                <span className="flex-1 truncate">{t(item.labelKey)}</span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* ── Footer — settings + user + collapse ── */}
      <div className={cn(
        'shrink-0 border-t border-sidebar-border/50 py-2 space-y-0.5',
        isCollapsed ? 'px-1.5' : 'px-2',
      )}>
        {/* Settings */}
        <NavLink
          to="/settings"
          onClick={onNavClick}
          aria-current={locationPath === '/settings' ? 'page' : undefined}
          title={isCollapsed ? t('common.settings') : undefined}
          className={cn(
            'fluent-nav-item',
            isCollapsed && 'justify-center px-0 w-[36px] mx-auto',
          )}
        >
          <Settings className={cn(
            'shrink-0 transition-colors',
            isCollapsed ? 'w-[18px] h-[18px]' : 'w-[18px] h-[18px]',
            locationPath === '/settings' ? 'text-primary' : 'text-muted-foreground',
          )} />
          {!isCollapsed && (
            <span className="flex-1">{t('common.settings')}</span>
          )}
        </NavLink>

        {/* User row */}
        {!isCollapsed ? (
          <div className="flex items-center gap-2 px-2 py-2 rounded-fluent-sm bg-sidebar-accent/50 mt-1">
            <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center shrink-0">
              <span className="text-[9px] font-bold text-primary-foreground leading-none">
                {userInitials ?? '?'}
              </span>
            </div>
            <span className="text-[13px] font-medium text-foreground flex-1 truncate">
              {userName ?? 'User'}
            </span>
            <button
              onClick={onSignOut}
              title={t('common.signOut')}
              className="p-1 rounded-fluent-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={onSignOut}
            title={t('common.signOut')}
            className="fluent-nav-item justify-center px-0 w-[36px] mx-auto"
          >
            <LogOut className="w-[18px] h-[18px] text-muted-foreground" />
          </button>
        )}

        {/* Collapse toggle (desktop only) */}
        {!isMobile && (
          <button
            onClick={onToggleCollapse}
            aria-label={isCollapsed ? t('common.expand') : t('common.collapse')}
            className={cn(
              'fluent-nav-item mt-1',
              isCollapsed && 'justify-center px-0 w-[36px] mx-auto',
            )}
          >
            <ChevronLeft
              className={cn(
                'w-[18px] h-[18px] text-muted-foreground transition-transform duration-200',
                isRTL    && '-scale-x-100',
                isCollapsed && 'rotate-180',
              )}
            />
            {!isCollapsed && (
              <span className="text-xs text-muted-foreground flex-1">
                {t('common.collapse')}
              </span>
            )}
          </button>
        )}
      </div>
    </div>
  );
});

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Communicate sidebar width to MainLayout via CSS variable
  React.useEffect(() => {
    document.documentElement.style.setProperty(
      '--sidebar-width',
      collapsed ? '52px' : '240px',
    );
  }, [collapsed]);
  const location  = useLocation();
  const navigate  = useNavigate();
  const { signOut, user } = useAuth();
  const { t, isRTL }     = useLanguage();
  const isMobile         = useIsMobile();
  const isAdmin          = useIsAdmin();
  const { isModuleActive } = useModuleAccess();

  const allNavItems: NavItem[] = [
    { path: '/dashboard',  icon: LayoutDashboard, labelKey: 'common.dashboard'  },
    { path: '/projects',   icon: FolderKanban,    labelKey: 'common.projects',   hue: 'var(--lt-hue-proj)'   },
    { path: '/tasks',      icon: CheckSquare,     labelKey: 'common.tasks',      hue: 'var(--lt-hue-task)'   },
    { path: '/goals',      icon: Target,          labelKey: 'common.goals',      hue: 'var(--lt-hue-goal)'   },
    { path: '/finance',    icon: Wallet,          labelKey: 'common.finance',    hue: 'var(--lt-hue-money)'  },
    { path: '/knowledge',  icon: BookOpen,        labelKey: 'common.knowledge',  hue: 'var(--lt-hue-know)'   },
    { path: '/habits',     icon: Repeat,          labelKey: 'common.habits',     hue: 'var(--lt-hue-habit)'  },
    { path: '/calendar',   icon: Calendar,        labelKey: 'common.calendar',   hue: 'var(--lt-hue-cal)'    },
    { path: '/studio',     icon: Film,            labelKey: 'common.studio',     hue: 'var(--lt-hue-studio)' },
    { path: '/pomodoro',   icon: Timer,           labelKey: 'common.pomodoro',   hue: 'var(--lt-hue-pomo)'   },
    { path: '/timeline',   icon: Activity,        labelKey: 'common.timeline'   },
    ...(isAdmin ? [{ path: '/admin', icon: ShieldCheck, labelKey: 'common.admin' }] : []),
  ];

  const navItems = allNavItems.filter(item => {
    const module = item.path.slice(1);
    return module === 'admin' || isModuleActive(module);
  });

  const fullName     = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || '';
  const userName     = fullName.split(' ')[0] || user?.email?.split('@')[0] || '';
  const userInitials = fullName
    ? fullName.split(' ').filter(Boolean).slice(0, 2).map((w: string) => w[0].toUpperCase()).join('')
    : '?';

  const sharedProps: SidebarContentProps = {
    collapsed, isMobile, navItems,
    locationPath: location.pathname,
    isRTL, t,
    onNavClick:      () => { if (isMobile) setMobileOpen(false); },
    onSignOut:       async () => { await signOut(); navigate('/'); },
    onClose:         () => setMobileOpen(false),
    onToggleCollapse: () => setCollapsed(c => !c),
    userName,
    userInitials,
  };

  /* ── Mobile: null — all navigation via BottomNav (Apple HIG pattern) ── */
  if (isMobile) return null;

  /* ── Desktop: Fluent nav rail ── */
  const railWidth = collapsed ? 'w-[52px]' : 'w-60';

  return (
    <aside
      className={cn(
        'fixed top-0 z-40 h-screen flex flex-col',
        'bg-sidebar transition-[width] duration-200 ease-out',
        isRTL
          ? 'right-0 border-s border-sidebar-border/50'
          : 'left-0  border-e border-sidebar-border/50',
        railWidth,
        // Mica simulation: very light blur over underlying content
        'backdrop-blur-[1px]',
      )}
      style={{
        boxShadow: isRTL
          ? '-1px 0 12px rgba(18,26,52,0.05)'
          :  '1px 0 12px rgba(18,26,52,0.05)',
      }}
    >
      <SidebarContent {...sharedProps} />
    </aside>
  );
}
