import React, { useState, memo } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { useIsMobile } from '@/hooks/use-mobile';
import { useIsAdmin } from '@/hooks/useAdmin';
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
  ChevronRight,
  Tent,
  LogOut,
  Timer,
  Menu,
  X,
  ShieldCheck,
} from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

interface NavItem { path: string; icon: React.ElementType; labelKey: string; activeColor?: string; activeBg?: string; }

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
  return (
    <>
      {/* Logo */}
      <div className="flex items-center justify-between h-14 px-4 border-b border-sidebar-border/60">
        <div className={cn('flex items-center gap-2.5', collapsed && !isMobile && 'justify-center w-full')}>
          <div className="relative">
            <div className="w-9 h-9 rounded-xl bg-gradient-gold flex items-center justify-center shadow-gold-glow-sm">
              <Tent className="w-4 h-4 text-primary-foreground" />
            </div>
            <div className="absolute -bottom-0.5 -end-0.5 w-2.5 h-2.5 bg-success rounded-full border-2 border-sidebar" />
          </div>
          {(!collapsed || isMobile) && (
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-bold gold-text tracking-wide">LIFE TENT</span>
              <span className="text-[10px] text-muted-foreground -mt-0.5">نظام حياتك</span>
            </div>
          )}
        </div>
        {isMobile && (
          <button onClick={onClose} aria-label={t('common.close')} className="p-2 hover:bg-sidebar-accent rounded-lg">
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-1 p-3 mt-4 overflow-y-auto flex-1">
        {navItems.map((item) => {
          const isActive = locationPath === item.path;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onNavClick}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200',
                'hover:bg-sidebar-accent group relative',
                isActive && 'bg-sidebar-accent',
                collapsed && !isMobile && 'justify-center'
              )}
            >
              {isActive && (
                <div className="absolute top-1/2 -translate-y-1/2 start-0 w-1 h-8 bg-gradient-gold rounded-e-full" />
              )}
              <item.icon className={cn('w-5 h-5 transition-colors flex-shrink-0', isActive ? (item.activeColor || 'text-primary') : 'text-muted-foreground group-hover:text-foreground')} />
              {(!collapsed || isMobile) && (
                <span className={cn('text-sm font-medium transition-colors', isActive ? 'text-foreground font-semibold' : 'text-muted-foreground group-hover:text-foreground')}>
                  {t(item.labelKey)}
                </span>
              )}
              {collapsed && !isMobile && (
                <div className="absolute px-2 py-1 bg-popover text-popover-foreground text-sm rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 shadow-lg border border-border start-full ms-2">
                  {t(item.labelKey)}
                </div>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer — user profile + settings */}
      <div className="shrink-0 border-t border-sidebar-border/60 p-3 space-y-1">
        {/* Settings */}
        <NavLink
          to="/settings"
          onClick={onNavClick}
          className={cn('flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 hover:bg-sidebar-accent group', collapsed && !isMobile && 'justify-center')}
        >
          <Settings className="w-4.5 h-4.5 text-muted-foreground group-hover:text-foreground flex-shrink-0 w-[18px] h-[18px]" />
          {(!collapsed || isMobile) && (
            <span className="text-sm text-muted-foreground group-hover:text-foreground">{t('common.settings')}</span>
          )}
        </NavLink>

        {/* User row */}
        {(!collapsed || isMobile) ? (
          <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-sidebar-accent/60">
            <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center shrink-0">
              <span className="text-[10px] font-bold text-primary-foreground">{userInitials || '?'}</span>
            </div>
            <span className="text-sm font-medium text-foreground flex-1 truncate">{userName || 'User'}</span>
            <button
              onClick={onSignOut}
              className="p-1 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              title={t('common.signOut')}
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={onSignOut}
            className="flex items-center justify-center w-full py-2.5 rounded-xl hover:bg-destructive/15 group"
          >
            <LogOut className="w-[18px] h-[18px] text-muted-foreground group-hover:text-destructive" />
          </button>
        )}

        {/* Collapse toggle */}
        {!isMobile && (
          <button
            onClick={onToggleCollapse}
            aria-label={collapsed ? t('common.expand') : t('common.collapse')}
            className={cn('flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200 w-full hover:bg-sidebar-accent group', collapsed && 'justify-center')}
          >
            <ChevronLeft className={cn('w-4 h-4 text-muted-foreground group-hover:text-foreground transition-transform rtl:-scale-x-100', collapsed && 'rotate-180')} />
            {!collapsed && <span className="text-xs text-muted-foreground group-hover:text-foreground">{t('common.collapse')}</span>}
          </button>
        )}
      </div>
    </>
  );
});

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const { t, isRTL } = useLanguage();
  const isMobile = useIsMobile();
  const isAdmin = useIsAdmin();

  const navItems = [
    { path: '/dashboard',  icon: LayoutDashboard, labelKey: 'common.dashboard',  activeColor: 'text-blue-500',    activeBg: 'bg-blue-500' },
    { path: '/projects',   icon: FolderKanban,    labelKey: 'common.projects',   activeColor: 'text-purple-500',  activeBg: 'bg-purple-500' },
    { path: '/tasks',      icon: CheckSquare,     labelKey: 'common.tasks',      activeColor: 'text-blue-500',    activeBg: 'bg-blue-500' },
    { path: '/goals',      icon: Target,          labelKey: 'common.goals',      activeColor: 'text-amber-500',   activeBg: 'bg-amber-500' },
    { path: '/finance',    icon: Wallet,          labelKey: 'common.finance',    activeColor: 'text-emerald-500', activeBg: 'bg-emerald-500' },
    { path: '/knowledge',  icon: BookOpen,        labelKey: 'common.knowledge',  activeColor: 'text-violet-500',  activeBg: 'bg-violet-500' },
    { path: '/habits',     icon: Repeat,          labelKey: 'common.habits',     activeColor: 'text-green-500',   activeBg: 'bg-green-500' },
    { path: '/calendar',   icon: Calendar,        labelKey: 'common.calendar',   activeColor: 'text-sky-500',     activeBg: 'bg-sky-500' },
    { path: '/studio',     icon: Film,            labelKey: 'common.studio',     activeColor: 'text-rose-500',    activeBg: 'bg-rose-500' },
    { path: '/pomodoro',   icon: Timer,           labelKey: 'common.pomodoro',   activeColor: 'text-orange-500',  activeBg: 'bg-orange-500' },
    ...(isAdmin ? [{ path: '/admin', icon: ShieldCheck, labelKey: 'common.admin', activeColor: 'text-primary', activeBg: 'bg-primary' }] : []),
  ];

  const fullName = (
    user?.user_metadata?.full_name
    || user?.user_metadata?.name
    || user?.email?.split('@')[0]
    || ''
  );
  const userName = fullName.split(' ')[0] || user?.email?.split('@')[0] || '';
  const userInitials = fullName
    ? fullName.split(' ').filter(Boolean).slice(0, 2).map((w: string) => w[0].toUpperCase()).join('')
    : '?';

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleNavClick = () => {
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const sharedProps: SidebarContentProps = {
    collapsed, isMobile, navItems,
    locationPath: location.pathname,
    isRTL, t,
    onNavClick: handleNavClick,
    onSignOut: handleSignOut,
    onClose: () => setMobileOpen(false),
    onToggleCollapse: () => setCollapsed(c => !c),
    userName,
    userInitials,
  };

  // Mobile sidebar
  if (isMobile) {
    return (
      <>
        {/* Mobile header bar — matches desktop top-bar height (h-14) */}
        <div className="fixed top-0 inset-x-0 z-50 h-14 bg-sidebar/95 backdrop-blur-xl border-b border-sidebar-border/60 flex items-center justify-between px-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-gold flex items-center justify-center shadow-gold-glow-sm">
              <Tent className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="text-sm font-bold gold-text tracking-wide">LIFE TENT</span>
          </div>
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <button aria-label={t('common.expand')} className="p-2 hover:bg-sidebar-accent rounded-lg">
                <Menu className="w-6 h-6" aria-hidden="true" />
              </button>
            </SheetTrigger>
            <SheetContent side={isRTL ? 'right' : 'left'} className="p-0 w-72 bg-sidebar border-sidebar-border">
              <div className="flex flex-col h-full">
                <SidebarContent {...sharedProps} />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </>
    );
  }

  // Desktop sidebar
  return (
    <aside
      className={cn(
        'fixed top-0 z-40 h-screen transition-all duration-300 ease-in-out flex flex-col',
        'bg-sidebar',
        isRTL
          ? 'right-0 border-s border-sidebar-border/40 shadow-[-1px_0_12px_rgba(18,26,52,0.06)]'
          : 'left-0 border-e border-sidebar-border/40 shadow-[1px_0_12px_rgba(18,26,52,0.06)]',
        collapsed ? 'w-20' : 'w-64'
      )}
    >
      <SidebarContent {...sharedProps} />
    </aside>
  );
}
