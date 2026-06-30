/**
 * ErrorCard — full-section error display with optional retry.
 * Use for fatal/page-level errors (network failures, permission denied, etc.)
 *
 * Standard: network errors → toast. Fatal errors → ErrorCard.
 */
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ErrorCardProps {
  /** Short headline — defaults to generic message */
  title?:   string;
  /** Detailed error message */
  message:  string;
  /** Retry callback — if omitted, no retry button is shown */
  onRetry?: () => void;
  className?: string;
}

export function ErrorCard({ title, message, onRetry, className }: ErrorCardProps) {
  return (
    <div className={cn(
      'flex flex-col items-center justify-center gap-4 py-12 px-6 text-center',
      'rounded-2xl border border-destructive/20 bg-destructive/5',
      className,
    )}>
      <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
        <AlertTriangle className="w-6 h-6 text-destructive" />
      </div>
      <div className="space-y-1 max-w-xs">
        <p className="font-semibold text-foreground">
          {title ?? 'حدث خطأ'}
        </p>
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="gap-2">
          <RefreshCw className="w-3.5 h-3.5" />
          إعادة المحاولة
        </Button>
      )}
    </div>
  );
}
