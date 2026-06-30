/**
 * Sidebar — Fluent UI 2 nav rail with grouped navigation.
 *
 * Desktop:  fixed left/right rail, collapsible (240px ↔ 52px).
 *           Groups: Layers | Modules | More (collapsible)
 *           Active item: 3px accent bar + subtle tinted fill.
 *
 * Mobile:   returns null — navigation is via BottomNav.
 */
import React, { memo } from 'react';
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
  Network,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

interface NavItem { path: string; icon: React.ElementType; labelKey: string; }

interface NavGroup {
  labelAr?: string;
  labelEn?: string;
  items: NavItem[];
  collapsible?: boolean;
}

// ── Nav groups definition ─────────────────────────────────────────────────────

const BASE_GROUPS: NavGroup[] = [
  {
    labelAr: 'الطبقات',
    labelEn: 'Layers',
    items: [
      { path: '/dashboard', icon: LayoutDashboard, labelKey: 'common.home'     },
      { path: '/projects',  icon: FolderKanban,    labelKey: 'common.spaces'   },
      { path: '/calendar',  icon: Calendar,        labelKey: 'common.calendar' },
    ],
  },
  {
    labelAr: 'الوحدات',
    labelEn: 'Modules',
    items: [
      { path: '/finance', icon: Wallet,      labelKey: 'common.finance' },
      { path: '/tasks',   icon: CheckSquare, labelKey: 'common.tasks'   },
      { path: '/goals',   icon: Target,      labelKey: 'common.goals'   },
    ],
  },
  {
    labelAr: 'المزيد',
    labelEn: 'More',
    items: [
      { path: '/habits',    icon: Repeat,    labelKey: 'common.habits'   },
      { path: '/knowledge', icon: BookOpen,  labelKey: 'common.knowledge'},
      { path: '/studio',    icon: Film,      labelKey: 'common.studio'   },
      { path: '/pomodoro',  icon: Timer,     labelKey: 'common.pomodoro' },
      { path: '/timeline',  icon: Activity,  labelKey: 'common.timeline' },
      { path: '/graph',     icon: Network,   labelKey: 'common.graph'    },
    ],
  },
];

// ── SidebarContent ─────────────────────────────────────────────────────────────

interface SidebarContentProps {
  collapsed:        boolean;
  isMobile:         boolean;
  navGroups:        NavGroup[];
  locationPath:     string;
  isRTL:            boolean;
  onNavClick:       () => void;
  onSignOut:        () => void;
  onClose:          () => void;
  onToggleCollapse: () => void;
  t:                (key: string) => string;
  userName?:        string;
  userInitials?:    string;
}

const SidebarContent = memo(function SidebarContent({
  collapsed, isMobile, navGroups, locationPath, isRTL,
  onNavClick, onSignOut, onClose, onToggleCollapse, t, userName, userInitials,
}: SidebarContentProps) {
  const isCollapsed = collapsed && !isMobile;
  const isAr = isRTL;

  return (
    <div className="flex flex-col h-full">

      {/* ── Header ── */}
      <div className={cn(
        'flex items-center border-b border-sidebar-border/50 shrink-0',
        isCollapsed ? 'h-12 justify-center px-0' : 'h-12 justify-between px-3',
      )}>
        <div className={cn('flex items-center gap-2.5 min-w-0', isCollapsed && 'justify-center')}>
          <div className="w-8 h-8 rounded-fluent-sm bg-primary flex items-center justify-center shrink-0 shadow-sm">
            <Tent className="w-4 h-4 text-primary-foreground" />
          </div>
          {!isCollapsed && (
            <div className="leading-tight min-w-0">
              <p className="text-[13px] font-semibold text-foreground tracking-wide truncate">LIFE TENT</p>
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

      {/* ── Navigation — grouped ── */}
      <nav
        aria-label="Main navigation"
        className={cn(
          'flex-1 overflow-y-auto py-2',
          isCollapsed ? 'px-1.5' : 'px-2',
        )}
      >
        {navGroups.map((group, gi) => {
          if (group.items.length === 0) return null;
          const groupLabel = isAr ? group.labelAr : group.labelEn;
          return (
            <div key={gi} className={gi > 0 ? 'mt-2' : ''}>
              {/* Group separator when collapsed */}
              {isCollapsed && gi > 0 && (
                <div className="my-2 mx-1 h-px bg-border/40" />
              )}

              {/* Group label */}
              {!isCollapsed && groupLabel && (
                <p className="px-2 pt-1 pb-1.5 text-[9px] font-bold uppercase tracking-[0.12em] text-muted-foreground/40 select-none">
                  {groupLabel}
                </p>
              )}

              {/* Items — always visible */}
              {(
                <div className="space-y-0.5">
                  {group.items.map((item) => {
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
                </div>
              )}
            </div>
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
          className={cn('fluent-nav-item', isCollapsed && 'justify-center px-0 w-[36px] mx-auto')}
        >
          <Settings className={cn(
            'shrink-0 w-[18px] h-[18px] transition-colors',
            locationPath === '/settings' ? 'text-primary' : 'text-muted-foreground',
          )} />
          {!isCollapsed && <span className="flex-1">{t('common.settings')}</span>}
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

      </div>
    </div>
  );
});

// ── Main Sidebar ───────────────────────────────────────────────────────────────

export function Sidebar() {
  const collapsed = false; // always expanded — no collapse in web

  // Communicate sidebar width to MainLayout via CSS variable
  React.useEffect(() => {
    document.documentElement.style.setProperty('--sidebar-width', '240px');
  }, []);

  const location  = useLocation();
  const navigate  = useNavigate();
  const { signOut, user } = useAuth();
  const { t, isRTL }     = useLanguage();
  const isMobile         = useIsMobile();
  const isAdmin          = useIsAdmin();
  const { isModuleActive } = useModuleAccess();

  // Build filtered groups — only include active modules
  const navGroups: NavGroup[] = BASE_GROUPS.map(group => ({
    ...group,
    items: group.items.filter(item => {
      const module = item.path.slice(1);
      return isModuleActive(module);
    }),
  }));

  // Admin item — append to the "More" group
  if (isAdmin) {
    const moreGroup = navGroups.find(g => g.labelAr === 'المزيد');
    if (moreGroup) {
      moreGroup.items.push({ path: '/admin', icon: ShieldCheck, labelKey: 'common.admin' });
    }
  }

  const fullName     = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || '';
  const userName     = fullName.split(' ')[0] || user?.email?.split('@')[0] || '';
  const userInitials = fullName
    ? fullName.split(' ').filter(Boolean).slice(0, 2).map((w: string) => w[0].toUpperCase()).join('')
    : '?';

  const sharedProps: SidebarContentProps = {
    collapsed, isMobile, navGroups,
    locationPath: location.pathname,
    isRTL, t,
    onNavClick:       () => {},
    onSignOut:        async () => { await signOut(); navigate('/'); },
    onClose:          () => {},
    onToggleCollapse: () => {},
    userName,
    userInitials,
  };

  /* Mobile: null — navigation via BottomNav */
  if (isMobile) return null;

  /* Desktop: Fluent nav rail */
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
        'backdrop-blur-[1px]',
      )}
      style={{
        boxShadow: isRTL
          ? '-1px 0 12px rgba(18,26,52,0.04)'
          :  '1px 0 12px rgba(18,26,52,0.04)',
      }}
    >
      <SidebarContent {...sharedProps} />
    </aside>
  );
}
