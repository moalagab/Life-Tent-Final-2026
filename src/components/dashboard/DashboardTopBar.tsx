import { useState, useEffect } from 'react';
import { Search, Plus, Command } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/hooks/useLanguage';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  CheckSquare,
  Target,
  Wallet,
  Calendar,
  FolderKanban,
  FileText,
  Timer,
  Repeat,
  BookOpen,
  Film,
  LayoutDashboard,
  Settings,
} from 'lucide-react';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';

/**
 * DashboardTopBar — single global control surface
 * - Global search (Cmd/Ctrl+K)
 * - Unified "Create" menu (replaces 6-item Quick Actions strip)
 * - Notifications
 * Replaces scattered shortcuts with one predictable bar.
 */
export function DashboardTopBar() {
  const { currentLanguage, isRTL } = useLanguage();
  const isAr = currentLanguage === 'ar';
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);

  // Cmd/Ctrl + K opens search
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setSearchOpen((open) => !open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const navItems = [
    { path: '/dashboard', label: isAr ? 'لوحة التحكم' : 'Dashboard', icon: LayoutDashboard },
    { path: '/projects', label: isAr ? 'المشاريع' : 'Projects', icon: FolderKanban },
    { path: '/tasks', label: isAr ? 'المهام' : 'Tasks', icon: CheckSquare },
    { path: '/goals', label: isAr ? 'الأهداف' : 'Goals', icon: Target },
    { path: '/finance', label: isAr ? 'المالية' : 'Finance', icon: Wallet },
    { path: '/calendar', label: isAr ? 'التقويم' : 'Calendar', icon: Calendar },
    { path: '/habits', label: isAr ? 'العادات' : 'Habits', icon: Repeat },
    { path: '/knowledge', label: isAr ? 'المعرفة' : 'Knowledge', icon: BookOpen },
    { path: '/studio', label: isAr ? 'الاستوديو' : 'Studio', icon: Film },
    { path: '/pomodoro', label: isAr ? 'بومودورو' : 'Pomodoro', icon: Timer },
    { path: '/settings', label: isAr ? 'الإعدادات' : 'Settings', icon: Settings },
  ];

  const createItems = [
    { label: isAr ? 'مهمة جديدة' : 'New Task', icon: CheckSquare, action: () => navigate('/tasks?new=1') },
    { label: isAr ? 'مشروع جديد' : 'New Project', icon: FolderKanban, action: () => navigate('/projects?new=1') },
    { label: isAr ? 'هدف جديد' : 'New Goal', icon: Target, action: () => navigate('/goals?new=1') },
    { label: isAr ? 'معاملة مالية' : 'Transaction', icon: Wallet, action: () => navigate('/finance?new=1') },
    { label: isAr ? 'حدث' : 'Event', icon: Calendar, action: () => navigate('/calendar?new=1') },
    { label: isAr ? 'ملاحظة' : 'Note', icon: FileText, action: () => navigate('/knowledge?new=1') },
    { label: isAr ? 'بدء بومودورو' : 'Start Pomodoro', icon: Timer, action: () => navigate('/pomodoro') },
  ];

  return (
    <>
      <div className="flex items-center gap-2 lg:gap-3 w-full">
        {/* Global search trigger */}
        <button
          onClick={() => setSearchOpen(true)}
          className="group flex-1 max-w-md flex items-center gap-2.5 h-10 px-3.5 rounded-xl bg-muted/40 hover:bg-muted/70 border border-border/40 hover:border-border transition-colors text-start"
        >
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          <span className="text-sm text-muted-foreground flex-1 truncate">
            {isAr ? 'ابحث عن أي شيء…' : 'Search anything…'}
          </span>
          <kbd className="hidden md:inline-flex items-center gap-0.5 px-1.5 h-5 rounded border border-border/60 bg-background text-[10px] font-mono text-muted-foreground">
            <Command className="w-2.5 h-2.5" />K
          </kbd>
        </button>

        <div className="flex-1 md:flex-none" />

        {/* Unified Create */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" className="h-10 gap-1.5 px-3.5 font-semibold">
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">{isAr ? 'إنشاء' : 'Create'}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align={isRTL ? 'start' : 'end'} className="w-56">
            <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
              {isAr ? 'إنشاء جديد' : 'Create new'}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {createItems.map((item) => (
              <DropdownMenuItem key={item.label} onClick={item.action} className="gap-2.5 cursor-pointer">
                <item.icon className="w-4 h-4 text-muted-foreground" />
                <span>{item.label}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Notifications */}
        <NotificationCenter />
      </div>

      {/* Command palette */}
      <CommandDialog open={searchOpen} onOpenChange={setSearchOpen}>
        <CommandInput placeholder={isAr ? 'ابحث في الأقسام والإجراءات…' : 'Search sections and actions…'} />
        <CommandList>
          <CommandEmpty>{isAr ? 'لا توجد نتائج' : 'No results.'}</CommandEmpty>
          <CommandGroup heading={isAr ? 'الانتقال' : 'Navigate'}>
            {navItems.map((item) => (
              <CommandItem
                key={item.path}
                onSelect={() => {
                  setSearchOpen(false);
                  navigate(item.path);
                }}
              >
                <item.icon className="w-4 h-4 me-2 text-muted-foreground" />
                {item.label}
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading={isAr ? 'إجراءات' : 'Actions'}>
            {createItems.map((item) => (
              <CommandItem
                key={item.label}
                onSelect={() => {
                  setSearchOpen(false);
                  item.action();
                }}
              >
                <Plus className="w-4 h-4 me-2 text-muted-foreground" />
                {item.label}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
