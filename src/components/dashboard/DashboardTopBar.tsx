import { useCallback, useEffect, useMemo } from 'react';
import { Search, Plus, Command, type LucideIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/hooks/useLanguage';
import { usePersistedState } from '@/hooks/usePersistedState';
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
  CommandSeparator,
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
  Filter,
  AlertTriangle,
  Flame,
  Activity,
  ArrowRight,
} from 'lucide-react';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';

type CommandGroupKey = 'navigate' | 'create' | 'filters' | 'jump';

interface CommandEntry {
  id: string;
  group: CommandGroupKey;
  label: string;
  keywords: string[]; // boost matching across AR/EN
  icon: LucideIcon;
  run: () => void;
  shortcut?: string;
}

/**
 * DashboardTopBar — global control surface.
 * Search is a typed command palette: navigation + create + dashboard filters/jumps.
 */
export function DashboardTopBar() {
  const { currentLanguage, isRTL } = useLanguage();
  const isAr = currentLanguage === 'ar';
  const navigate = useNavigate();
  // Persist palette open state and last-used filter id, per user
  const [searchOpen, setSearchOpen] = usePersistedState<boolean>('palette.open', false);
  const [lastFilterId, setLastFilterId] = usePersistedState<string | null>('palette.lastFilter', null);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setSearchOpen((open) => !open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [setSearchOpen]);

  const go = (path: string) => {
    setSearchOpen(false);
    navigate(path);
  };

  const commands: CommandEntry[] = useMemo(() => [
    // ---- Navigate ----
    { id: 'nav-dashboard', group: 'navigate', label: isAr ? 'لوحة التحكم' : 'Dashboard', keywords: ['home', 'dashboard', 'لوحة', 'الرئيسية'], icon: LayoutDashboard, run: () => go('/dashboard') },
    { id: 'nav-projects', group: 'navigate', label: isAr ? 'المشاريع' : 'Projects', keywords: ['projects', 'مشاريع'], icon: FolderKanban, run: () => go('/projects') },
    { id: 'nav-tasks', group: 'navigate', label: isAr ? 'المهام' : 'Tasks', keywords: ['tasks', 'todo', 'مهام'], icon: CheckSquare, run: () => go('/tasks') },
    { id: 'nav-goals', group: 'navigate', label: isAr ? 'الأهداف' : 'Goals', keywords: ['goals', 'okr', 'أهداف'], icon: Target, run: () => go('/goals') },
    { id: 'nav-finance', group: 'navigate', label: isAr ? 'المالية' : 'Finance', keywords: ['finance', 'money', 'مال', 'مالية'], icon: Wallet, run: () => go('/finance') },
    { id: 'nav-calendar', group: 'navigate', label: isAr ? 'التقويم' : 'Calendar', keywords: ['calendar', 'events', 'تقويم'], icon: Calendar, run: () => go('/calendar') },
    { id: 'nav-habits', group: 'navigate', label: isAr ? 'العادات' : 'Habits', keywords: ['habits', 'عادات'], icon: Repeat, run: () => go('/habits') },
    { id: 'nav-knowledge', group: 'navigate', label: isAr ? 'المعرفة' : 'Knowledge', keywords: ['knowledge', 'notes', 'معرفة', 'ملاحظات'], icon: BookOpen, run: () => go('/knowledge') },
    { id: 'nav-studio', group: 'navigate', label: isAr ? 'الاستوديو' : 'Studio', keywords: ['studio', 'media', 'books', 'استوديو', 'كتب'], icon: Film, run: () => go('/studio') },
    { id: 'nav-pomodoro', group: 'navigate', label: isAr ? 'بومودورو' : 'Pomodoro', keywords: ['pomodoro', 'focus', 'بومودورو', 'تركيز'], icon: Timer, run: () => go('/pomodoro') },
    { id: 'nav-settings', group: 'navigate', label: isAr ? 'الإعدادات' : 'Settings', keywords: ['settings', 'preferences', 'إعدادات'], icon: Settings, run: () => go('/settings') },

    // ---- Create ----
    { id: 'new-task', group: 'create', label: isAr ? 'مهمة جديدة' : 'New task', keywords: ['new', 'task', 'add', 'مهمة'], icon: CheckSquare, run: () => go('/tasks?new=1') },
    { id: 'new-project', group: 'create', label: isAr ? 'مشروع جديد' : 'New project', keywords: ['new', 'project', 'مشروع'], icon: FolderKanban, run: () => go('/projects?new=1') },
    { id: 'new-goal', group: 'create', label: isAr ? 'هدف جديد' : 'New goal', keywords: ['new', 'goal', 'okr', 'هدف'], icon: Target, run: () => go('/goals?new=1') },
    { id: 'new-tx', group: 'create', label: isAr ? 'معاملة مالية' : 'New transaction', keywords: ['new', 'transaction', 'finance', 'معاملة'], icon: Wallet, run: () => go('/finance?new=1') },
    { id: 'new-event', group: 'create', label: isAr ? 'حدث جديد' : 'New event', keywords: ['new', 'event', 'calendar', 'حدث'], icon: Calendar, run: () => go('/calendar?new=1') },
    { id: 'new-note', group: 'create', label: isAr ? 'ملاحظة جديدة' : 'New note', keywords: ['new', 'note', 'knowledge', 'ملاحظة'], icon: FileText, run: () => go('/knowledge?new=1') },
    { id: 'new-pomo', group: 'create', label: isAr ? 'بدء بومودورو' : 'Start Pomodoro', keywords: ['start', 'pomodoro', 'focus', 'بومودورو'], icon: Timer, run: () => go('/pomodoro') },

    // ---- Filters / dashboard jumps ----
    { id: 'filter-overdue', group: 'filters', label: isAr ? 'عرض المهام المتأخرة' : 'View overdue tasks', keywords: ['overdue', 'late', 'متأخرة'], icon: AlertTriangle, run: () => go('/tasks?filter=overdue') },
    { id: 'filter-today', group: 'filters', label: isAr ? 'مهام اليوم' : 'Tasks due today', keywords: ['today', 'due', 'اليوم'], icon: Flame, run: () => go('/tasks?filter=today') },
    { id: 'filter-active-projects', group: 'filters', label: isAr ? 'المشاريع النشطة' : 'Active projects', keywords: ['active', 'projects', 'نشطة'], icon: Activity, run: () => go('/projects?status=active') },
    { id: 'filter-stalled', group: 'filters', label: isAr ? 'المشاريع المتوقفة' : 'Stalled projects', keywords: ['on hold', 'stalled', 'متوقفة'], icon: Filter, run: () => go('/projects?status=on_hold') },
    { id: 'filter-month-finance', group: 'filters', label: isAr ? 'المالية - هذا الشهر' : 'Finance — this month', keywords: ['finance', 'month', 'شهر'], icon: Wallet, run: () => go('/finance?range=month') },
    { id: 'jump-calendar-today', group: 'jump', label: isAr ? 'انتقل إلى تقويم اليوم' : 'Jump to today in calendar', keywords: ['calendar', 'today', 'اليوم'], icon: Calendar, run: () => go('/calendar?date=today') },
    { id: 'jump-attention', group: 'jump', label: isAr ? 'بنود تحتاج انتباه' : 'Items needing attention', keywords: ['attention', 'urgent', 'انتباه'], icon: AlertTriangle, run: () => go('/dashboard#attention') },
  ], [isAr]);

  // When the user picks a filter/jump, remember it so it appears as a "Recent" entry next time.
  const runWithMemory = useCallback(
    (item: CommandEntry) => {
      if (item.group === 'filters' || item.group === 'jump') {
        setLastFilterId(item.id);
      }
      item.run();
    },
    [setLastFilterId]
  );

  const grouped = useMemo(() => {
    const g: Record<CommandGroupKey, CommandEntry[]> = { navigate: [], create: [], filters: [], jump: [] };
    commands.forEach((c) => g[c.group].push(c));
    return g;
  }, [commands]);

  const lastFilter = useMemo(
    () => (lastFilterId ? commands.find((c) => c.id === lastFilterId) ?? null : null),
    [commands, lastFilterId]
  );

  const groupHeadings: Record<CommandGroupKey, string> = {
    navigate: isAr ? 'الانتقال' : 'Navigate',
    create: isAr ? 'إنشاء' : 'Create',
    filters: isAr ? 'فلاتر' : 'Filters',
    jump: isAr ? 'اختصارات' : 'Jump to',
  };

  // Create-button menu uses the same dataset
  const createItems = grouped.create;

  return (
    <>
      <div className="flex items-center gap-2 lg:gap-3 w-full">
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
              <DropdownMenuItem key={item.id} onClick={item.run} className="gap-2.5 cursor-pointer">
                <item.icon className="w-4 h-4 text-muted-foreground" />
                <span>{item.label}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <NotificationCenter />
      </div>

      <CommandDialog open={searchOpen} onOpenChange={setSearchOpen}>
        <CommandInput placeholder={isAr ? 'ابحث في الأقسام، الفلاتر والإجراءات…' : 'Search sections, filters and actions…'} />
        <CommandList>
          <CommandEmpty>{isAr ? 'لا توجد نتائج' : 'No results.'}</CommandEmpty>
          {lastFilter && (
            <>
              <CommandGroup heading={isAr ? 'الأخير' : 'Recent'}>
                <CommandItem
                  key={`recent-${lastFilter.id}`}
                  value={`recent ${lastFilter.label} ${lastFilter.keywords.join(' ')}`}
                  onSelect={() => runWithMemory(lastFilter)}
                >
                  <lastFilter.icon className="w-4 h-4 me-2 text-muted-foreground" />
                  <span className="flex-1">{lastFilter.label}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/60 rtl:-scale-x-100" />
                </CommandItem>
              </CommandGroup>
              <CommandSeparator />
            </>
          )}
          {(Object.keys(grouped) as CommandGroupKey[]).map((key, idx) => {
            const items = grouped[key];
            if (items.length === 0) return null;
            return (
              <div key={key}>
                {idx > 0 && <CommandSeparator />}
                <CommandGroup heading={groupHeadings[key]}>
                  {items.map((item) => (
                    <CommandItem
                      key={item.id}
                      value={`${item.label} ${item.keywords.join(' ')}`}
                      onSelect={() => runWithMemory(item)}
                    >
                      <item.icon className="w-4 h-4 me-2 text-muted-foreground" />
                      <span className="flex-1">{item.label}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/60 rtl:-scale-x-100" />
                    </CommandItem>
                  ))}
                </CommandGroup>
              </div>
            );
          })}
        </CommandList>
      </CommandDialog>
    </>
  );
}
