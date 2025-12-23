import { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { useIsMobile } from '@/hooks/use-mobile';
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
} from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const { t, isRTL } = useLanguage();
  const isMobile = useIsMobile();

  const navItems = [
    { path: '/', icon: LayoutDashboard, labelKey: 'common.dashboard' },
    { path: '/projects', icon: FolderKanban, labelKey: 'common.projects' },
    { path: '/tasks', icon: CheckSquare, labelKey: 'common.tasks' },
    { path: '/goals', icon: Target, labelKey: 'common.goals' },
    { path: '/finance', icon: Wallet, labelKey: 'common.finance' },
    { path: '/knowledge', icon: BookOpen, labelKey: 'common.knowledge' },
    { path: '/habits', icon: Repeat, labelKey: 'common.habits' },
    { path: '/calendar', icon: Calendar, labelKey: 'common.calendar' },
    { path: '/studio', icon: Film, labelKey: 'common.studio' },
    { path: '/pomodoro', icon: Timer, labelKey: 'common.pomodoro' },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const handleNavClick = () => {
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="flex items-center justify-between h-20 px-4 border-b border-sidebar-border">
        <div className={cn('flex items-center gap-3', collapsed && !isMobile && 'justify-center w-full')}>
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-gold flex items-center justify-center shadow-gold-glow-sm">
              <Tent className="w-5 h-5 text-primary-foreground" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-success rounded-full border-2 border-sidebar" />
          </div>
          {(!collapsed || isMobile) && (
            <div className="flex flex-col">
              <span className="text-lg font-bold gold-text">LIFE TENT</span>
              <span className="text-[10px] text-muted-foreground -mt-1">نظام حياتك</span>
            </div>
          )}
        </div>
        {isMobile && (
          <button onClick={() => setMobileOpen(false)} className="p-2 hover:bg-sidebar-accent rounded-lg">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-1 p-3 mt-4 overflow-y-auto flex-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={handleNavClick}
              className={cn(
                'flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200',
                'hover:bg-sidebar-accent group relative',
                isActive && 'bg-sidebar-accent',
                collapsed && !isMobile && 'justify-center'
              )}
            >
              {isActive && (
                <div className={cn(
                  'absolute top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-gold rounded-full',
                  isRTL ? 'right-0 rounded-l-full rounded-r-none' : 'left-0 rounded-r-full rounded-l-none'
                )} />
              )}
              <item.icon
                className={cn(
                  'w-5 h-5 transition-colors flex-shrink-0',
                  isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
                )}
              />
              {(!collapsed || isMobile) && (
                <span
                  className={cn(
                    'text-sm font-medium transition-colors',
                    isActive ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground'
                  )}
                >
                  {t(item.labelKey)}
                </span>
              )}
              {collapsed && !isMobile && (
                <div className={cn(
                  'absolute px-2 py-1 bg-popover text-popover-foreground text-sm rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 shadow-lg border border-border',
                  isRTL ? 'right-full mr-2' : 'left-full ml-2'
                )}>
                  {t(item.labelKey)}
                </div>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Settings & Collapse */}
      <div className="p-3 border-t border-sidebar-border mt-auto">
        <NavLink
          to="/settings"
          onClick={handleNavClick}
          className={cn(
            'flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200',
            'hover:bg-sidebar-accent group',
            collapsed && !isMobile && 'justify-center'
          )}
        >
          <Settings className="w-5 h-5 text-muted-foreground group-hover:text-foreground flex-shrink-0" />
          {(!collapsed || isMobile) && (
            <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground">
              {t('common.settings')}
            </span>
          )}
        </NavLink>

        <button
          onClick={handleSignOut}
          className={cn(
            'flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 w-full mt-1',
            'hover:bg-destructive/20 group text-destructive',
            collapsed && !isMobile && 'justify-center'
          )}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {(!collapsed || isMobile) && (
            <span className="text-sm font-medium">
              {t('common.signOut')}
            </span>
          )}
        </button>
        
        {!isMobile && (
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={cn(
              'flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 w-full mt-1',
              'hover:bg-sidebar-accent group',
              collapsed && 'justify-center'
            )}
          >
            {collapsed ? (
              isRTL ? (
                <ChevronLeft className="w-5 h-5 text-muted-foreground group-hover:text-foreground" />
              ) : (
                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground" />
              )
            ) : (
              <>
                {isRTL ? (
                  <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground" />
                ) : (
                  <ChevronLeft className="w-5 h-5 text-muted-foreground group-hover:text-foreground" />
                )}
                <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground">
                  {t('common.collapse')}
                </span>
              </>
            )}
          </button>
        )}
      </div>
    </>
  );

  // Mobile sidebar
  if (isMobile) {
    return (
      <>
        {/* Mobile header bar */}
        <div className="fixed top-0 left-0 right-0 z-50 h-16 bg-sidebar border-b border-sidebar-border flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-gold flex items-center justify-center shadow-gold-glow-sm">
              <Tent className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold gold-text">LIFE TENT</span>
          </div>
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <button className="p-2 hover:bg-sidebar-accent rounded-lg">
                <Menu className="w-6 h-6" />
              </button>
            </SheetTrigger>
            <SheetContent side={isRTL ? 'right' : 'left'} className="p-0 w-72 bg-sidebar border-sidebar-border">
              <div className="flex flex-col h-full">
                <SidebarContent />
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
        'bg-sidebar border-sidebar-border',
        isRTL ? 'right-0 border-l' : 'left-0 border-r',
        collapsed ? 'w-20' : 'w-64'
      )}
    >
      <SidebarContent />
    </aside>
  );
}
