/**
 * FieldError — inline validation error below a form field.
 * Renders nothing when message is empty/null.
 *
 * Standard: validation errors → FieldError (inline). Network errors → toast.
 */
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FieldErrorProps {
  message?:   string | null;
  className?: string;
}

export function FieldError({ message, className }: FieldErrorProps) {
  if (!message) return null;
  return (
    <p className={cn('flex items-center gap-1.5 text-xs text-destructive mt-1', className)}>
      <AlertCircle className="w-3 h-3 shrink-0" />
      {message}
    </p>
  );
}
