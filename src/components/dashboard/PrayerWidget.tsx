import { useEffect, useState } from 'react';
import { getTodayPrayerTimes, getNextPrayer, PrayerTimes } from '@/lib/prayer-times';
import { isRamadan } from '@/lib/hijri';
import { cn } from '@/lib/utils';
import { Moon, Sun, Sunrise, Sunset, Clock } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';

const prayerIcons: Record<string, React.ReactNode> = {
  Fajr: <Sunrise className="w-4 h-4" />,
  Sunrise: <Sun className="w-4 h-4" />,
  Dhuhr: <Sun className="w-4 h-4" />,
  Asr: <Sun className="w-4 h-4" />,
  Maghrib: <Sunset className="w-4 h-4" />,
  Isha: <Moon className="w-4 h-4" />,
};

export function PrayerWidget() {
  const { t, currentLanguage } = useLanguage();
  const [prayerTimes, setPrayerTimes] = useState<PrayerTimes | null>(null);
  const [nextPrayer, setNextPrayer] = useState<{ prayer: any; remaining: string } | null>(null);
  const [isRamadanPeriod] = useState(isRamadan());

  useEffect(() => {
    const times = getTodayPrayerTimes();
    setPrayerTimes(times);

    const updateNext = () => {
      const next = getNextPrayer(times);
      setNextPrayer(next);
    };

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
    <div className="relative overflow-hidden rounded-2xl bg-card/50 backdrop-blur-xl border border-border/50 p-5 h-full">
      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-gold-500/10 rounded-full blur-2xl" />
      
      <div className="relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Moon className="w-4 h-4 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">{t('dashboard.prayerTimes')}</h3>
          </div>
          {isRamadanPeriod && (
            <span className="px-3 py-1.5 rounded-full bg-gradient-to-r from-primary/20 to-gold-500/20 text-primary text-xs font-medium border border-primary/20">
              رمضان كريم 🌙
            </span>
          )}
        </div>

        {/* Next Prayer Highlight */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary to-gold-600 p-5 mb-4">
          {/* Decorative Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-2 right-2 w-16 h-16 border-2 border-primary-foreground rounded-full" />
            <div className="absolute bottom-2 left-2 w-12 h-12 border-2 border-primary-foreground rounded-full" />
          </div>
          
          <div className="relative flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-primary-foreground/70 text-sm mb-1">
                <Clock className="w-4 h-4" />
                <span>{t('dashboard.nextPrayer')}</span>
              </div>
              <p className="text-2xl font-bold text-primary-foreground">
                {currentLanguage === 'ar' ? nextPrayer.prayer.nameAr : nextPrayer.prayer.name}
              </p>
            </div>
            <div className="text-end">
              <p className="text-3xl font-bold text-primary-foreground tabular-nums">
                {nextPrayer.prayer.time}
              </p>
              <p className="text-primary-foreground/70 text-sm mt-1">
                {currentLanguage === 'ar' ? `خلال ${nextPrayer.remaining}` : `in ${nextPrayer.remaining}`}
              </p>
            </div>
          </div>
          
          {isRamadanPeriod && nextPrayer.prayer.name === 'Maghrib' && (
            <div className="mt-4 pt-3 border-t border-primary-foreground/20 text-center">
              <p className="text-primary-foreground font-medium flex items-center justify-center gap-2">
                <span>🌙</span>
                {currentLanguage === 'ar' ? 'وقت الإفطار' : 'Iftar Time'}
              </p>
            </div>
          )}
        </div>

        {/* All Prayers List */}
        <div className="space-y-1">
          {allPrayers.map((prayer, index) => {
            const isNext = prayer.name === nextPrayer.prayer.name;
            const isPast = prayer.timestamp < new Date();
            
            return (
              <div
                key={prayer.name}
                className={cn(
                  'flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-300',
                  isNext && 'bg-primary/10 border border-primary/20 shadow-sm',
                  isPast && !isNext && 'opacity-40',
                  !isNext && !isPast && 'hover:bg-muted/50'
                )}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'w-8 h-8 rounded-lg flex items-center justify-center',
                    isNext ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  )}>
                    {prayerIcons[prayer.name]}
                  </div>
                  <span className={cn(
                    'text-sm font-medium',
                    isNext ? 'text-foreground' : 'text-muted-foreground'
                  )}>
                    {currentLanguage === 'ar' ? prayer.nameAr : prayer.name}
                  </span>
                </div>
                <span className={cn(
                  'text-sm font-semibold tabular-nums',
                  isNext ? 'text-primary' : 'text-foreground'
                )}>
                  {prayer.time}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
