import { useNavigate } from 'react-router-dom';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { cn } from '@/lib/utils';

interface BackButtonProps {
  to?:       string;         // explicit route; if omitted → go back in history
  label?:    string;         // override label
  className?: string;
}

export function BackButton({ to, label, className }: BackButtonProps) {
  const navigate  = useNavigate();
  const { isRTL } = useLanguage();
  const Icon = isRTL ? ChevronRight : ChevronLeft;

  const handleClick = () => {
    if (to) navigate(to);
    else navigate(-1);
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        'inline-flex items-center gap-1.5 text-sm text-muted-foreground',
        'hover:text-foreground transition-colors group',
        className,
      )}
    >
      <Icon className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
      {label ?? (isRTL ? 'رجوع' : 'Back')}
    </button>
  );
}
