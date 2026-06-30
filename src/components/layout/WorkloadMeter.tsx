import { useCognitiveLoad } from '@/hooks/useCognitiveLoad';
import { useLanguage } from '@/hooks/useLanguage';
import { cn } from '@/lib/utils';

export function WorkloadMeter() {
  const { budgetScore } = useCognitiveLoad();
  const { t } = useLanguage();

  const isLight  = budgetScore < 65;
  const isMedium = budgetScore >= 65 && budgetScore < 85;
  const isHeavy  = budgetScore >= 85;

  const label = isHeavy
    ? t('layout.workloadHeavy')
    : isMedium
      ? t('layout.workloadMedium')
      : t('layout.workloadLight');

  const barColor = isHeavy
    ? 'bg-destructive'
    : isMedium
      ? 'bg-amber-500'
      : 'bg-emerald-500';

  const textColor = isHeavy
    ? 'text-destructive'
    : isMedium
      ? 'text-amber-500'
      : 'text-emerald-500';

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-1.5 rounded-full bg-muted/50 overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-700', barColor)}
          style={{ width: `${budgetScore}%` }}
        />
      </div>
      <span className={cn('text-[10px] font-semibold shrink-0', textColor)}>
        {label}
      </span>
    </div>
  );
}
