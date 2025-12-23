import { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
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
} from 'lucide-react';

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard', labelAr: 'لوحة التحكم' },
  { path: '/projects', icon: FolderKanban, label: 'Projects', labelAr: 'المشاريع' },
  { path: '/tasks', icon: CheckSquare, label: 'Tasks', labelAr: 'المهام' },
  { path: '/goals', icon: Target, label: 'Goals', labelAr: 'الأهداف' },
  { path: '/finance', icon: Wallet, label: 'Finance', labelAr: 'المالية' },
  { path: '/knowledge', icon: BookOpen, label: 'Knowledge', labelAr: 'المعرفة' },
  { path: '/habits', icon: Repeat, label: 'Habits', labelAr: 'العادات' },
  { path: '/calendar', icon: Calendar, label: 'Calendar', labelAr: 'التقويم' },
  { path: '/studio', icon: Film, label: 'Studio', labelAr: 'الاستوديو' },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, user } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <aside
      className={cn(
        'fixed top-0 left-0 z-40 h-screen transition-all duration-300 ease-in-out',
        'bg-sidebar border-r border-sidebar-border',
        collapsed ? 'w-20' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-between h-20 px-4 border-b border-sidebar-border">
        <div className={cn('flex items-center gap-3', collapsed && 'justify-center w-full')}>
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-gold flex items-center justify-center shadow-gold-glow-sm">
              <Tent className="w-5 h-5 text-primary-foreground" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-success rounded-full border-2 border-sidebar" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-lg font-bold gold-text">LIFE TENT</span>
              <span className="text-[10px] text-muted-foreground -mt-1">نظام حياتك</span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-1 p-3 mt-4">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200',
                'hover:bg-sidebar-accent group relative',
                isActive && 'bg-sidebar-accent',
                collapsed && 'justify-center'
              )}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-gold rounded-r-full" />
              )}
              <item.icon
                className={cn(
                  'w-5 h-5 transition-colors',
                  isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
                )}
              />
              {!collapsed && (
                <span
                  className={cn(
                    'text-sm font-medium transition-colors',
                    isActive ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground'
                  )}
                >
                  {item.label}
                </span>
              )}
              {collapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-popover text-popover-foreground text-sm rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 shadow-lg border border-border">
                  {item.label}
                </div>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Settings & Collapse */}
      <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-sidebar-border">
        <NavLink
          to="/settings"
          className={cn(
            'flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200',
            'hover:bg-sidebar-accent group',
            collapsed && 'justify-center'
          )}
        >
          <Settings className="w-5 h-5 text-muted-foreground group-hover:text-foreground" />
          {!collapsed && (
            <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground">
              Settings
            </span>
          )}
        </NavLink>

        <button
          onClick={handleSignOut}
          className={cn(
            'flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 w-full mt-1',
            'hover:bg-destructive/20 group text-destructive',
            collapsed && 'justify-center'
          )}
        >
          <LogOut className="w-5 h-5" />
          {!collapsed && (
            <span className="text-sm font-medium">
              تسجيل خروج
            </span>
          )}
        </button>
        
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            'flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 w-full mt-1',
            'hover:bg-sidebar-accent group',
            collapsed && 'justify-center'
          )}
        >
          {collapsed ? (
            <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground" />
          ) : (
            <>
              <ChevronLeft className="w-5 h-5 text-muted-foreground group-hover:text-foreground" />
              <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground">
                Collapse
              </span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
