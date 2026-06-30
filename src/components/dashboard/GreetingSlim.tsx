import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { formatHijriDate } from '@/lib/hijri';
import { useLanguage } from '@/hooks/useLanguage';
import { useAuth } from '@/hooks/useAuth';

/**
 * GreetingSlim — quiet one-line greeting.
 * Hierarchy via weight + size only. No decorative color.
 */
export function GreetingSlim() {
  const [now, setNow] = useState(new Date());
  const { currentLanguage } = useLanguage();
  const { user } = useAuth();
  const isAr = currentLanguage === 'ar';

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(id);
  }, []);

  const hour = now.getHours();
  const greeting = isAr
    ? hour < 12 ? 'صباح الخير' : hour < 17 ? 'مساء الخير' : hour < 21 ? 'مساء النور' : 'طابت ليلتك'
    : hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : hour < 21 ? 'Good evening' : 'Good night';

  const userName =
    user?.user_metadata?.full_name?.split(' ')[0] ||
    user?.email?.split('@')[0] ||
    (isAr ? 'صديقي' : 'there');

  const dateLine = isAr
    ? `${format(now, 'EEEE، d MMMM')} · ${formatHijriDate(now, 'ar')}`
    : `${format(now, 'EEEE, MMMM d')}`;

  return (
    <header className="flex items-baseline justify-between gap-4 flex-wrap">
      <h1 className="text-2xl lg:text-[28px] font-semibold text-foreground tracking-tight">
        {greeting}، <span className="text-muted-foreground font-normal">{userName}</span>
      </h1>
      <p className="text-xs text-muted-foreground/80 tabular-nums">{dateLine}</p>
    </header>
  );
}
