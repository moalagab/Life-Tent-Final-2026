import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { formatHijriDate } from '@/lib/hijri';
import { useLanguage } from '@/hooks/useLanguage';
import { useAuth } from '@/hooks/useAuth';

/**
 * GreetingSlim — minimal one-line greeting.
 * Replaces the heavy hero card. Hierarchy via size/weight, not color or decoration.
 */
export function GreetingSlim() {
  const [now, setNow] = useState(new Date());
  const { currentLanguage } = useLanguage();
  const { user } = useAuth();
  const isAr = currentLanguage === 'ar';

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(id);
  }, []);

  const hour = now.getHours();
  const greeting = isAr
    ? hour < 12
      ? 'صباح الخير'
      : hour < 17
      ? 'مساء الخير'
      : hour < 21
      ? 'مساء النور'
      : 'طابت ليلتك'
    : hour < 12
    ? 'Good morning'
    : hour < 17
    ? 'Good afternoon'
    : hour < 21
    ? 'Good evening'
    : 'Good night';

  const userName =
    user?.user_metadata?.full_name ||
    user?.email?.split('@')[0] ||
    (isAr ? 'المستخدم' : 'User');

  const dateLine = isAr
    ? `${formatHijriDate(now, 'ar')} · ${format(now, 'EEEE, d MMMM')}`
    : `${format(now, 'EEEE, MMMM d')} · ${formatHijriDate(now, 'ar')}`;

  return (
    <div className="space-y-1">
      <h1 className="text-2xl lg:text-3xl font-bold text-foreground tracking-tight">
        {greeting},{' '}
        <span className="gold-text">{userName}</span>
      </h1>
      <p className="text-sm text-muted-foreground">{dateLine}</p>
    </div>
  );
}
