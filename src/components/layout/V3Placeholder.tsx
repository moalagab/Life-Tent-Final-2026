import { Sparkles } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';

export function V3Placeholder() {
  const { t } = useLanguage();

  return (
    <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-muted/30 border border-border/30 opacity-60">
      <Sparkles className="w-4 h-4 text-violet-400 shrink-0" />
      <span className="text-xs text-muted-foreground">{t('layout.v3Coming')}</span>
    </div>
  );
}
