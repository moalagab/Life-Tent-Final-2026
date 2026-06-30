/**
 * StaleTasksSheet — Full lifecycle management panel.
 *
 * Four tabs: Aging / Stale / Dormant / Ghost
 *
 * Per task row:
 *  - Title + age badge + decay % + state dot
 *  - Action buttons: Keep / Archive / Downgrade priority
 *
 * Bulk actions:
 *  - "أرشفة كل الأشباح" (ghost bulk archive)
 *  - "تطبيق إعادة ترتيب الأولوية" (apply all reprioritize suggestions)
 */
import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  Archive, RotateCcw, TrendingDown, ChevronDown, ChevronUp,
  Loader2, AlertTriangle, Ghost, Flame,
} from 'lucide-react';
import {
  useLifecycleIntelligence, useArchiveGhosts, useResetDecay,
  useBatchReprioritize, STATE_LABELS, TaskLifecycle, LifecycleState,
} from '@/hooks/useLifecycleIntelligence';
import { useUpdateTask } from '@/hooks/useTasks';

// ── Priority labels ────────────────────────────────────────────────────────────

const PRIORITY_AR: Record<string, string> = {
  critical: 'حرجة', high: 'عالية', medium: 'متوسطة', low: 'منخفضة',
};

const PRIORITY_COLORS: Record<string, string> = {
  critical: 'text-destructive', high: 'text-orange-500',
  medium: 'text-amber-500', low: 'text-muted-foreground',
};

// ── Single task row ────────────────────────────────────────────────────────────

interface TaskRowProps {
  lc:         TaskLifecycle;
  onArchive:  (lc: TaskLifecycle) => void;
  onReset:    (lc: TaskLifecycle) => void;
  onDowngrade:(lc: TaskLifecycle) => void;
  loading:    boolean;
}

function TaskRow({ lc, onArchive, onReset, onDowngrade, loading }: TaskRowProps) {
  const [expanded, setExpanded] = useState(false);
  const cfg  = STATE_LABELS[lc.state];
  const pct  = Math.round(lc.decayFactor * 100);
  const needsDowngrade = lc.effectivePriority !== (lc.task.priority ?? 'medium');

  return (
    <div className="rounded-xl border border-border/40 overflow-hidden">
      {/* Main row */}
      <button
        onClick={() => setExpanded(s => !s)}
        className="w-full flex items-start gap-3 p-3 text-start hover:bg-muted/20 transition-colors"
      >
        {/* State dot */}
        <span className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ background: cfg.color }} />

        {/* Title + badges */}
        <div className="flex-1 min-w-0">
          <p className={cn(
            'text-sm font-medium leading-tight',
            lc.isExempt ? 'text-foreground' : 'text-muted-foreground',
          )}>
            {lc.task.title}
          </p>
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            {/* Stale days */}
            <span className="text-[10px] text-muted-foreground/70">
              {lc.staleDays} يوم بدون نشاط
            </span>
            {/* Decay badge */}
            <span
              className="text-[10px] font-bold px-1.5 py-0.5 rounded"
              style={{ background: `${cfg.color}18`, color: cfg.color }}
            >
              {pct}% قوة
            </span>
            {/* Priority */}
            {lc.task.priority && (
              <span className={cn('text-[10px] font-semibold', PRIORITY_COLORS[lc.task.priority])}>
                {PRIORITY_AR[lc.task.priority]}
              </span>
            )}
            {/* Exempt marker */}
            {lc.isExempt && (
              <Badge variant="outline" className="text-[9px] px-1 h-4">
                {lc.exemptReason}
              </Badge>
            )}
          </div>
        </div>

        {expanded ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />}
      </button>

      {/* Actions (expanded) */}
      {expanded && (
        <div className="flex items-center gap-1.5 px-3 pb-3 flex-wrap">
          <Button
            size="sm" variant="ghost"
            className="h-7 text-xs gap-1 text-muted-foreground"
            onClick={() => onReset(lc)}
            disabled={loading}
          >
            <RotateCcw className="w-3 h-3" />
            تجديد
          </Button>
          {needsDowngrade && (
            <Button
              size="sm" variant="ghost"
              className="h-7 text-xs gap-1 text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/20"
              onClick={() => onDowngrade(lc)}
              disabled={loading}
            >
              <TrendingDown className="w-3 h-3" />
              خفّض للـ {PRIORITY_AR[lc.effectivePriority]}
            </Button>
          )}
          <Button
            size="sm" variant="ghost"
            className="h-7 text-xs gap-1 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => onArchive(lc)}
            disabled={loading}
          >
            <Archive className="w-3 h-3" />
            أرشفة
          </Button>
        </div>
      )}
    </div>
  );
}

// ── Tab panel ──────────────────────────────────────────────────────────────────

interface TabPanelProps {
  items:      TaskLifecycle[];
  state:      LifecycleState;
  onArchive:  (lc: TaskLifecycle) => void;
  onReset:    (lc: TaskLifecycle) => void;
  onDowngrade:(lc: TaskLifecycle) => void;
  loading:    boolean;
}

function TabPanel({ items, state, onArchive, onReset, onDowngrade, loading }: TabPanelProps) {
  const cfg = STATE_LABELS[state];

  if (items.length === 0) {
    return (
      <div className="py-10 text-center text-muted-foreground text-sm">
        لا توجد مهام في هذه الفئة 🎉
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-[10px] text-muted-foreground">
        {items.length} مهمة · {cfg.days}
      </p>
      {items.map(lc => (
        <TaskRow
          key={lc.task.id}
          lc={lc}
          onArchive={onArchive}
          onReset={onReset}
          onDowngrade={onDowngrade}
          loading={loading}
        />
      ))}
    </div>
  );
}

// ── Main sheet ────────────────────────────────────────────────────────────────

const TABS: { state: LifecycleState; icon: typeof Ghost }[] = [
  { state: 'aging',   icon: Flame },
  { state: 'stale',   icon: AlertTriangle },
  { state: 'dormant', icon: Archive },
  { state: 'ghost',   icon: Ghost },
];

interface StaleTasksSheetProps {
  open:         boolean;
  onOpenChange: (v: boolean) => void;
}

export function StaleTasksSheet({ open, onOpenChange }: StaleTasksSheetProps) {
  const [activeTab, setActiveTab] = useState<LifecycleState>('stale');
  const [loading,   setLoading]   = useState(false);

  const report          = useLifecycleIntelligence();
  const archiveGhosts   = useArchiveGhosts();
  const resetDecay      = useResetDecay();
  const batchReprioritize = useBatchReprioritize();
  const updateTask      = useUpdateTask();

  // Auto-select first non-empty tab
  const activeItems = report.byState[activeTab] ?? [];

  const handleReset = async (lc: TaskLifecycle) => {
    setLoading(true);
    try {
      await resetDecay(lc.task.id);
      toast('تم تجديد المهمة — ستظهر كنشطة مجدداً');
    } catch { toast.error('حدث خطأ') }
    setLoading(false);
  };

  const handleArchive = async (lc: TaskLifecycle) => {
    setLoading(true);
    try {
      await archiveGhosts([lc]);
      toast('تم أرشفة المهمة');
    } catch { toast.error('حدث خطأ') }
    setLoading(false);
  };

  const handleDowngrade = async (lc: TaskLifecycle) => {
    setLoading(true);
    try {
      await updateTask.mutateAsync({
        id: lc.task.id,
        priority: lc.effectivePriority as Parameters<typeof updateTask.mutateAsync>[0]['priority'],
      });
      toast(`تم تخفيض الأولوية إلى "${PRIORITY_AR[lc.effectivePriority]}"`);
    } catch { toast.error('حدث خطأ') }
    setLoading(false);
  };

  const handleBulkArchiveGhosts = async () => {
    const ghosts = report.byState.ghost;
    if (!ghosts.length) return;
    setLoading(true);
    try {
      await archiveGhosts(ghosts);
      toast.success(`تم أرشفة ${ghosts.length} مهام أشباح`);
    } catch { toast.error('حدث خطأ') }
    setLoading(false);
  };

  const handleBulkReprioritize = async () => {
    const suggestions = report.reprioritizeSuggestions;
    if (!suggestions.length) return;
    setLoading(true);
    try {
      await batchReprioritize(suggestions);
      toast.success(`تم إعادة ترتيب أولوية ${suggestions.length} مهمة`);
    } catch { toast.error('حدث خطأ') }
    setLoading(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg flex flex-col p-0">
        <SheetHeader className="px-5 pt-5 pb-3 border-b border-border/50">
          <SheetTitle className="flex items-center gap-2 text-base">
            <div className="w-7 h-7 rounded-lg bg-amber-500/15 flex items-center justify-center">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            </div>
            مراجعة دورة حياة المهام
          </SheetTitle>

          {/* Health summary */}
          <div className="flex items-center gap-3 mt-1">
            <div className="flex-1 h-1.5 bg-muted/60 rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full',
                  report.healthScore >= 75 ? 'bg-success' :
                  report.healthScore >= 50 ? 'bg-amber-500' : 'bg-destructive',
                )}
                style={{ width: `${report.healthScore}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground">{report.healthScore}%</span>
            <span className="text-xs text-muted-foreground">
              {report.totalDecayed} متأثرة بالتقادم
            </span>
          </div>
        </SheetHeader>

        {/* Tabs */}
        <div className="flex border-b border-border/50 px-5 overflow-x-auto scrollbar-none">
          {TABS.map(({ state, icon: Icon }) => {
            const cfg   = STATE_LABELS[state];
            const count = report.byState[state].length;
            const isActive = activeTab === state;
            return (
              <button
                key={state}
                onClick={() => setActiveTab(state)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap shrink-0',
                  isActive
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground',
                )}
              >
                <Icon className="w-3.5 h-3.5" style={isActive ? { color: cfg.color } : {}} />
                {cfg.ar}
                {count > 0 && (
                  <span
                    className="text-[10px] font-black px-1.5 py-0.5 rounded-full"
                    style={{ background: `${cfg.color}20`, color: cfg.color }}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        <ScrollArea className="flex-1 px-5 py-4">
          {report.isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <TabPanel
              items={activeItems}
              state={activeTab}
              onArchive={handleArchive}
              onReset={handleReset}
              onDowngrade={handleDowngrade}
              loading={loading}
            />
          )}
        </ScrollArea>

        {/* Bulk actions footer */}
        {(report.byState.ghost.length > 0 || report.reprioritizeSuggestions.length > 0) && (
          <>
            <Separator />
            <div className="px-5 py-3 space-y-2">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                إجراءات جماعية
              </p>
              <div className="flex flex-wrap gap-2">
                {report.byState.ghost.length > 0 && (
                  <Button
                    size="sm" variant="destructive"
                    className="gap-1.5 text-xs h-8"
                    onClick={handleBulkArchiveGhosts}
                    disabled={loading}
                  >
                    {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Ghost className="w-3 h-3" />}
                    أرشفة {report.byState.ghost.length} شبح
                  </Button>
                )}
                {report.reprioritizeSuggestions.length > 0 && (
                  <Button
                    size="sm" variant="outline"
                    className="gap-1.5 text-xs h-8"
                    onClick={handleBulkReprioritize}
                    disabled={loading}
                  >
                    {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <TrendingDown className="w-3 h-3" />}
                    إعادة ترتيب {report.reprioritizeSuggestions.length} أولوية
                  </Button>
                )}
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
