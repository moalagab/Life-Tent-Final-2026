/**
 * ModuleUnlockSheet — auto-surfaces when the user has earned a new module slot.
 *
 * Shows once per slot threshold (tracked in localStorage so it only fires once
 * per unlock event). The user picks which module to add, or dismisses it to
 * decide later.
 */
import { useEffect, useState } from 'react';
import { Sparkles, ListTodo, FolderKanban, Wallet, Flame, Target, BookOpen, X, Lock } from 'lucide-react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { useModuleAccess } from '@/hooks/useModuleAccess';
import { useLanguage } from '@/hooks/useLanguage';
import { cn } from '@/lib/utils';
import type { FocusArea } from '@/hooks/useOnboarding';

// ── Module catalogue (mirrors Onboarding.tsx — keep in sync) ─────────────────

const ALL_MODULES = [
  { id: 'tasks'     as FocusArea, icon: ListTodo,     labelAr: 'المهام',    labelEn: 'Tasks',     color: 'from-blue-500 to-indigo-600' },
  { id: 'habits'    as FocusArea, icon: Flame,        labelAr: 'العادات',   labelEn: 'Habits',    color: 'from-green-500 to-emerald-600' },
  { id: 'finance'   as FocusArea, icon: Wallet,       labelAr: 'المالية',   labelEn: 'Finance',   color: 'from-emerald-500 to-teal-600' },
  { id: 'projects'  as FocusArea, icon: FolderKanban, labelAr: 'المشاريع', labelEn: 'Projects',  color: 'from-purple-500 to-indigo-600' },
  { id: 'goals'     as FocusArea, icon: Target,       labelAr: 'الأهداف',  labelEn: 'Goals',     color: 'from-amber-500 to-orange-500' },
  { id: 'knowledge' as FocusArea, icon: BookOpen,     labelAr: 'المعرفة',  labelEn: 'Knowledge', color: 'from-violet-500 to-purple-600' },
];

// ── Persistence helpers ───────────────────────────────────────────────────────

const dismissedKey = (slot: number) => `module_unlock_dismissed_slot_${slot}`;

function isDismissed(slot: number) {
  return localStorage.getItem(dismissedKey(slot)) === '1';
}

function setDismissed(slot: number) {
  localStorage.setItem(dismissedKey(slot), '1');
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ModuleUnlockSheet() {
  const { activeModules, canUnlockMore, maxSlots, unlockModule } = useModuleAccess();
  const { currentLanguage } = useLanguage();
  const isAr = currentLanguage === 'ar';

  const [open,    setOpen]    = useState(false);
  const [loading, setLoading] = useState(false);

  // Open once per slot threshold
  useEffect(() => {
    if (!canUnlockMore) return;
    // The slot we're about to fill is activeModules.length + 1
    const slot = activeModules.length + 1;
    if (!isDismissed(slot)) {
      // Small delay so the app has fully loaded first
      const t = setTimeout(() => setOpen(true), 1200);
      return () => clearTimeout(t);
    }
  }, [canUnlockMore, activeModules.length]);

  const handleDismiss = () => {
    setDismissed(activeModules.length + 1);
    setOpen(false);
  };

  const handleSelect = async (module: FocusArea) => {
    setLoading(true);
    try {
      await unlockModule(module);
      setDismissed(activeModules.length + 1);
      setOpen(false);
    } finally {
      setLoading(false);
    }
  };

  // Modules not yet unlocked
  const lockedModules = ALL_MODULES.filter(m => !activeModules.includes(m.id));

  if (!canUnlockMore) return null;

  const slotNumber = activeModules.length + 1;
  const weekNumber = slotNumber === 2 ? 1 : 2;

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) handleDismiss(); }}>
      <SheetContent
        side="bottom"
        className="p-0 rounded-t-3xl border-0 bg-background max-h-[88vh] overflow-hidden flex flex-col"
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 shrink-0">
          <div className="w-10 h-1 rounded-full bg-border/70" />
        </div>

        {/* Header */}
        <div className="flex items-start justify-between px-5 pt-4 pb-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">
                {isAr ? `مرت ${weekNumber} أسبوع — وحدة جديدة لك!` : `Week ${weekNumber} milestone!`}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isAr
                  ? `فتح المودول ${slotNumber} — اختر ما يناسبك`
                  : `Slot ${slotNumber} unlocked — pick your next module`}
              </p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="w-8 h-8 rounded-full bg-muted/70 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Module grid */}
        <div className="flex-1 overflow-y-auto px-4 pb-8">
          <div className="grid grid-cols-3 gap-3">
            {lockedModules.map(m => (
              <button
                key={m.id}
                onClick={() => handleSelect(m.id)}
                disabled={loading}
                className={cn(
                  'flex flex-col items-center justify-center gap-2.5 py-4 px-2 rounded-2xl',
                  'border border-transparent bg-muted/30 hover:bg-muted/50',
                  'transition-all duration-200 active:scale-95',
                  loading && 'opacity-50 cursor-not-allowed',
                )}
              >
                <div className={cn(
                  'w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br shadow-sm',
                  m.color,
                )}>
                  <m.icon className="w-5 h-5 text-white" strokeWidth={1.8} />
                </div>
                <p className="text-xs font-semibold text-center text-foreground/80 leading-tight">
                  {isAr ? m.labelAr : m.labelEn}
                </p>
              </button>
            ))}
          </div>

          {/* "Decide later" nudge */}
          <div className="mt-5 flex items-center gap-2 px-3 py-2.5 rounded-xl bg-secondary/50 border border-border/40">
            <Lock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <p className="text-xs text-muted-foreground">
              {isAr
                ? `الوحدات الباقية (${maxSlots - slotNumber}) ستُفتح تدريجياً`
                : `Remaining modules (${maxSlots - slotNumber}) unlock progressively`}
            </p>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="w-full mt-3 text-muted-foreground text-xs"
          >
            {isAr ? 'سأختار لاحقاً' : 'Decide later'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
