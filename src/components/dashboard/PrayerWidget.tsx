import { useEffect, useState } from 'react';
import { getTodayPrayerTimes, getNextPrayer, PrayerTimes } from '@/lib/prayer-times';
import { isRamadan } from '@/lib/hijri';
import { cn } from '@/lib/utils';
import { Moon, Sun, Sunrise, Sunset, Clock } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { DashboardWidgetShell } from './DashboardWidgetShell';

const prayerIcons: Record<string, React.ReactNode> = {
  Fajr: <Sunrise className="w-3.5 h-3.5" />,
  Sunrise: <Sun className="w-3.5 h-3.5" />,
  Dhuhr: <Sun className="w-3.5 h-3.5" />,
  Asr: <Sun className="w-3.5 h-3.5" />,
  Maghrib: <Sunset className="w-3.5 h-3.5" />,
  Isha: <Moon className="w-3.5 h-3.5" />,
};

export function PrayerWidget() {
  const { t, currentLanguage } = useLanguage();
  const isAr = currentLanguage === 'ar';
  const [prayerTimes, setPrayerTimes] = useState<PrayerTimes | null>(null);
  const [nextPrayer, setNextPrayer] = useState<{ prayer: any; remaining: string } | null>(null);
  const [isRamadanPeriod] = useState(isRamadan());

  useEffect(() => {
    const times = getTodayPrayerTimes();
    setPrayerTimes(times);

    const updateNext = () => setNextPrayer(getNextPrayer(times));
    updateNext();
    const interval = setInterval(updateNext, 60000);
    return () => clearInterval(interval);
  }, []);

  if (!prayerTimes || !nextPrayer) return null;

  const allPrayers = [
    prayerTimes.fajr,
    prayerTimes.dhuhr,
    prayerTimes.asr,
    prayerTimes.maghrib,
    prayerTimes.isha,
  ];

  return (
    <DashboardWidgetShell
      title={t('dashboard.prayerTimes')}
      icon={Moon}
      headerAction={
        isRamadanPeriod ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary/10 text-primary text-[11px] font-medium">
            🌙 {isAr ? 'رمضان' : 'Ramadan'}
          </span>
        ) : undefined
      }
    >
      {/* Next Prayer — quiet highlight strip */}
      <div className="rounded-xl bg-primary/5 border border-primary/15 p-3 mb-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mb-0.5">
              <Clock className="w-3 h-3" />
              <span>{t('dashboard.nextPrayer')}</span>
            </div>
            <p className="text-sm font-semibold text-foreground truncate">
              {isAr ? nextPrayer.prayer.nameAr : nextPrayer.prayer.name}
            </p>
          </div>
          <div className="text-end shrink-0">
            <p className="text-lg font-semibold text-primary tabular-nums leading-none">
              {nextPrayer.prayer.time}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">
              {isAr ? `بعد ${nextPrayer.remaining}` : `in ${nextPrayer.remaining}`}
            </p>
          </div>
        </div>

        {isRamadanPeriod && nextPrayer.prayer.name === 'Maghrib' && (
          <div className="mt-2.5 pt-2.5 border-t border-primary/15 text-center">
            <p className="text-xs font-medium text-primary">
              🌙 {isAr ? 'وقت الإفطار' : 'Iftar Time'}
            </p>
          </div>
        )}
      </div>

      {/* All Prayers — uniform rows */}
      <div className="space-y-0.5">
        {allPrayers.map((prayer) => {
          const isNext = prayer.name === nextPrayer.prayer.name;
          const isPast = prayer.timestamp < new Date();

          return (
            <div
              key={prayer.name}
              className={cn(
                'flex items-center justify-between px-2.5 py-1.5 rounded-lg transition-colors',
                isNext && 'bg-primary/10',
                isPast && !isNext && 'opacity-40',
                !isNext && !isPast && 'hover:bg-muted/40'
              )}
            >
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className={cn(
                    'w-6 h-6 rounded-md flex items-center justify-center shrink-0',
                    isNext ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  )}
                >
                  {prayerIcons[prayer.name]}
                </div>
                <span
                  className={cn(
                    'text-xs font-medium truncate',
                    isNext ? 'text-foreground' : 'text-muted-foreground'
                  )}
                >
                  {isAr ? prayer.nameAr : prayer.name}
                </span>
              </div>
              <span
                className={cn(
                  'text-xs font-semibold tabular-nums shrink-0',
                  isNext ? 'text-primary' : 'text-foreground'
                )}
              >
                {prayer.time}
              </span>
            </div>
          );
        })}
      </div>
    </DashboardWidgetShell>
  );
}
