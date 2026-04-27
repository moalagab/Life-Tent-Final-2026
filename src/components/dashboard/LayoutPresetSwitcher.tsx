import { LayoutGrid, Wallet, Zap, Target } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { cn } from '@/lib/utils';

export type DashboardPreset = 'focus' | 'finance' | 'execution';

interface Props {
  value: DashboardPreset;
  onChange: (next: DashboardPreset) => void;
}

/**
 * LayoutPresetSwitcher — switch between curated dashboard arrangements:
 *  - focus     → Today's Rhythm + Focus Tasks first
 *  - finance   → Overview + Finance-heavy first
 *  - execution → Active Work first (projects + tasks + events)
 *
 * Selection persists per user (managed by parent via usePersistedState).
 */
export function LayoutPresetSwitcher({ value, onChange }: Props) {
  const { currentLanguage } = useLanguage();
  const isAr = currentLanguage === 'ar';

  const presets: { id: DashboardPreset; label: string; icon: typeof LayoutGrid; hint: string }[] = [
    {
      id: 'focus',
      label: isAr ? 'تركيز' : 'Focus',
      icon: Target,
      hint: isAr ? 'إيقاع اليوم والمهام أولاً' : 'Rhythm & focus tasks first',
    },
    {
      id: 'finance',
      label: isAr ? 'مالية' : 'Finance',
      icon: Wallet,
      hint: isAr ? 'المؤشرات والمالية أولاً' : 'KPIs & finance first',
    },
    {
      id: 'execution',
      label: isAr ? 'تنفيذ' : 'Execution',
      icon: Zap,
      hint: isAr ? 'المشاريع والمهام أولاً' : 'Active work first',
    },
  ];

  return (
    <div
      role="tablist"
      aria-label={isAr ? 'تخطيط لوحة التحكم' : 'Dashboard layout preset'}
      className="inline-flex items-center gap-1 p-1 rounded-xl bg-muted/40 border border-border/40"
    >
      {presets.map((p) => {
        const active = p.id === value;
        return (
          <button
            key={p.id}
            role="tab"
            aria-selected={active}
            title={p.hint}
            onClick={() => onChange(p.id)}
            className={cn(
              'flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-xs font-medium transition-colors',
              active
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <p.icon className="w-3.5 h-3.5" />
            <span>{p.label}</span>
          </button>
        );
      })}
    </div>
  );
}
