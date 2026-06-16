import React, { useRef, useEffect } from 'react';
import { Sparkles, Send, X, AlertCircle } from 'lucide-react';
import { useNaturalCapture } from '@/hooks/useNaturalCapture';
import { useLanguage } from '@/hooks/useLanguage';
import { cn } from '@/lib/utils';

const PLACEHOLDERS_AR = [
  'سدد إيجار المكتب يوم 5 يوليو 2500 ريال...',
  'دفعت فاتورة الكهرباء 180 ريال...',
  'اشتراك نتفليكس 65 ريال...',
  'راجع تقرير المبيعات يوم الأحد...',
  'استلمت راتب الشهر 12000 ريال...',
  'اتصل بالعميل غداً...',
];

const PLACEHOLDERS_EN = [
  'Paid office rent July 5 — 2500 SAR...',
  'Paid electricity bill 180 SAR...',
  'Netflix subscription 65 SAR...',
  'Review sales report on Sunday...',
  'Received monthly salary 12000 SAR...',
  'Call the client tomorrow...',
];

function useCyclingPlaceholder(items: string[], intervalMs = 4000) {
  const [idx, setIdx] = React.useState(0);
  useEffect(() => {
    const id = setInterval(() => setIdx(i => (i + 1) % items.length), intervalMs);
    return () => clearInterval(id);
  }, [items.length, intervalMs]);
  return items[idx];
}

// Confidence ring color
function confidenceColor(c: number) {
  if (c >= 75) return 'text-emerald-500';
  if (c >= 50) return 'text-amber-500';
  return 'text-slate-500';
}

export function NaturalCapture() {
  const { text, setText, parsed, isCreating, error, submit, reset } =
    useNaturalCapture();
  const { currentLanguage } = useLanguage();
  const isAr = currentLanguage === 'ar';
  const PLACEHOLDERS = isAr ? PLACEHOLDERS_AR : PLACEHOLDERS_EN;
  const inputRef     = useRef<HTMLTextAreaElement>(null);
  const placeholder  = useCyclingPlaceholder(PLACEHOLDERS);

  // Auto-resize textarea
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [text]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (parsed && !isCreating) submit();
    }
    if (e.key === 'Escape') reset();
  };

  const hasContent = text.trim().length >= 3;

  return (
    <div className="w-full rounded-2xl border border-border/40 bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 pt-3 pb-1">
        <Sparkles className="w-3.5 h-3.5 text-violet-500" />
        <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-widest">
          {isAr ? 'التقاط ذكي' : 'Smart Capture'}
        </span>
        {parsed && hasContent && (
          <span className={cn('mr-auto text-[10px] font-medium', confidenceColor(parsed.confidence))}>
            {parsed.confidence}% {isAr ? 'دقة' : 'conf.'}
          </span>
        )}
      </div>

      {/* Input */}
      <div className="relative px-4 pb-2">
        <textarea
          ref={inputRef}
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={1}
          dir="rtl"
          className={cn(
            'w-full resize-none bg-transparent text-right text-sm text-foreground',
            'placeholder:text-muted-foreground/40 outline-none leading-relaxed',
            'transition-all',
          )}
        />
        {hasContent && (
          <button
            onClick={reset}
            className="absolute left-4 top-1 text-muted-foreground/40 hover:text-muted-foreground transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Parsed chips */}
      {parsed && hasContent && parsed.fields.length > 0 && (
        <div
          className={cn(
            'px-4 pb-3 flex flex-wrap gap-1.5 border-t border-border/30 pt-2.5',
            'transition-all',
          )}
          dir="rtl"
        >
          {parsed.fields.map(f => (
            <span
              key={f.key}
              className={cn(
                'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px]',
                'font-medium border',
                f.color,
              )}
            >
              <span className="opacity-60 text-[9px]">{f.label}</span>
              {f.value}
            </span>
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mx-4 mb-2 flex items-start gap-1.5 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2">
          <AlertCircle className="w-3.5 h-3.5 text-red-400 mt-0.5 shrink-0" />
          <p className="text-[11px] text-red-400 leading-snug" dir="rtl">{error}</p>
        </div>
      )}

      {/* Footer action */}
      {hasContent && parsed && (
        <div className="flex items-center justify-between px-4 pb-3 pt-1">
          <span className="text-[10px] text-muted-foreground/50">
            {isAr ? 'Enter للحفظ · Esc للإلغاء' : 'Enter to save · Esc to cancel'}
          </span>
          <button
            onClick={submit}
            disabled={isCreating}
            className={cn(
              'flex items-center gap-1.5 rounded-xl px-3 py-1.5',
              'text-[12px] font-semibold',
              'bg-violet-600 hover:bg-violet-500 text-white',
              'transition-all disabled:opacity-50 disabled:cursor-not-allowed',
            )}
          >
            {isCreating ? (
              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Send className="w-3 h-3" />
            )}
            {isCreating ? (isAr ? 'جاري الحفظ...' : 'Saving...') : `${isAr ? 'حفظ' : 'Save'} ${parsed.typeLabel}`}
          </button>
        </div>
      )}
    </div>
  );
}
