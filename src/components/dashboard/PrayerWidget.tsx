import { useEffect, useState } from 'react';
import { getTodayPrayerTimes, getNextPrayer, PrayerTimes } from '@/lib/prayer-times';
import { isRamadan } from '@/lib/hijri';
import { cn } from '@/lib/utils';
import { Moon, Sun, Sunrise, Sunset } from 'lucide-react';

const prayerIcons: Record<string, React.ReactNode> = {
  Fajr: <Sunrise className="w-4 h-4" />,
  Sunrise: <Sun className="w-4 h-4" />,
  Dhuhr: <Sun className="w-4 h-4" />,
  Asr: <Sun className="w-4 h-4" />,
  Maghrib: <Sunset className="w-4 h-4" />,
  Isha: <Moon className="w-4 h-4" />,
};

export function PrayerWidget() {
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
    <div className="glass-card p-5 h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">Prayer Times</h3>
        {isRamadanPeriod && (
          <span className="px-2 py-1 rounded-full bg-primary/20 text-primary text-xs font-medium">
            رمضان كريم 🌙
          </span>
        )}
      </div>

      {/* Next Prayer Highlight */}
      <div className="bg-gradient-gold rounded-xl p-4 mb-4 shadow-gold-glow">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-primary-foreground/80 text-sm">Next Prayer</p>
            <p className="text-xl font-bold text-primary-foreground">
              {nextPrayer.prayer.name}
            </p>
            <p className="text-primary-foreground/80 text-sm" dir="rtl">
              {nextPrayer.prayer.nameAr}
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-primary-foreground">
              {nextPrayer.prayer.time}
            </p>
            <p className="text-primary-foreground/80 text-sm">
              in {nextPrayer.remaining}
            </p>
          </div>
        </div>
        
        {isRamadanPeriod && nextPrayer.prayer.name === 'Maghrib' && (
          <div className="mt-3 pt-3 border-t border-primary-foreground/20 text-center">
            <p className="text-primary-foreground font-medium">🌙 Iftar Time</p>
          </div>
        )}
      </div>

      {/* All Prayers List */}
      <div className="space-y-2">
        {allPrayers.map((prayer) => {
          const isNext = prayer.name === nextPrayer.prayer.name;
          const isPast = prayer.timestamp < new Date();
          
          return (
            <div
              key={prayer.name}
              className={cn(
                'flex items-center justify-between px-3 py-2 rounded-lg transition-all',
                isNext && 'bg-primary/10 border border-primary/20',
                isPast && !isNext && 'opacity-50'
              )}
            >
              <div className="flex items-center gap-2">
                <span className={cn(
                  'text-muted-foreground',
                  isNext && 'text-primary'
                )}>
                  {prayerIcons[prayer.name]}
                </span>
                <span className={cn(
                  'text-sm',
                  isNext ? 'font-medium text-foreground' : 'text-muted-foreground'
                )}>
                  {prayer.name}
                </span>
              </div>
              <span className={cn(
                'text-sm font-medium',
                isNext ? 'text-primary' : 'text-foreground'
              )}>
                {prayer.time}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
