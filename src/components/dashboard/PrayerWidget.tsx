import { useEffect, useState } from 'react';
import { getTodayPrayerTimes, getNextPrayer, PrayerTimes } from '@/lib/prayer-times';
import { isRamadan, formatHijriDate } from '@/lib/hijri';
import { cn } from '@/lib/utils';
import { Moon, Sun, Sunrise, Sunset, Clock, MapPin, CloudSun, Loader2 } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { DashboardWidgetShell } from './DashboardWidgetShell';
import { format } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';

const prayerIcons: Record<string, React.ReactNode> = {
  Fajr: <Sunrise className="w-3.5 h-3.5" />,
  Sunrise: <Sun className="w-3.5 h-3.5" />,
  Dhuhr: <Sun className="w-3.5 h-3.5" />,
  Asr: <Sun className="w-3.5 h-3.5" />,
  Maghrib: <Sunset className="w-3.5 h-3.5" />,
  Isha: <Moon className="w-3.5 h-3.5" />,
};

interface Weather {
  temp: number;
  code: number;
  city: string;
}

// Open-Meteo WMO weather code → emoji + EN/AR label
const weatherDescriptor = (code: number, isAr: boolean) => {
  if (code === 0) return { emoji: '☀️', label: isAr ? 'صحو' : 'Clear' };
  if (code <= 3) return { emoji: '⛅', label: isAr ? 'غائم جزئيًا' : 'Partly cloudy' };
  if (code <= 48) return { emoji: '🌫️', label: isAr ? 'ضباب' : 'Fog' };
  if (code <= 67) return { emoji: '🌧️', label: isAr ? 'مطر' : 'Rain' };
  if (code <= 77) return { emoji: '❄️', label: isAr ? 'ثلج' : 'Snow' };
  if (code <= 82) return { emoji: '🌦️', label: isAr ? 'زخات مطر' : 'Showers' };
  if (code <= 99) return { emoji: '⛈️', label: isAr ? 'عاصفة رعدية' : 'Thunderstorm' };
  return { emoji: '🌡️', label: isAr ? 'الطقس' : 'Weather' };
};

const LS_KEY = 'lt.weatherCache.v1';

export function PrayerWidget() {
  const { t, currentLanguage } = useLanguage();
  const isAr = currentLanguage === 'ar';
  const [prayerTimes, setPrayerTimes] = useState<PrayerTimes | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [nextPrayer, setNextPrayer] = useState<{ prayer: any; remaining: string } | null>(null);
  // Re-evaluate Ramadan status daily so the widget stays correct across midnight
  const [isRamadanPeriod, setIsRamadanPeriod] = useState(isRamadan());
  const [weather, setWeather] = useState<Weather | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);

  const today = new Date();
  const gregorian = format(today, 'EEEE, d MMMM yyyy', {
    locale: isAr ? ar : enUS,
  });
  const hijri = formatHijriDate(today, isAr ? 'ar' : 'en');

  useEffect(() => {
    const times = getTodayPrayerTimes();
    setPrayerTimes(times);

    const updateNext = () => {
      setNextPrayer(getNextPrayer(times));
      // Refresh Ramadan status daily (re-check at every tick; cheap boolean call)
      setIsRamadanPeriod(isRamadan());
    };
    updateNext();
    const interval = setInterval(updateNext, 60000);
    return () => clearInterval(interval);
  }, []);

  // Weather via geolocation → Open-Meteo (no API key needed)
  useEffect(() => {
    // Cache for 30 minutes
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const cached = JSON.parse(raw) as { ts: number; data: Weather };
        if (Date.now() - cached.ts < 30 * 60 * 1000) {
          setWeather(cached.data);
          return;
        }
      }
    } catch { /* ignore cached parse errors */ }

    if (!('geolocation' in navigator)) return;
    setWeatherLoading(true);

    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const { latitude: lat, longitude: lon } = coords;
          // Current weather
          const wRes = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code`
          );
          const wJson = await wRes.json();
          // Reverse-geocode city name
          let city = '';
          try {
            const gRes = await fetch(
              `https://geocoding-api.open-meteo.com/v1/reverse?latitude=${lat}&longitude=${lon}&language=${isAr ? 'ar' : 'en'}&count=1`
            );
            const gJson = await gRes.json();
            city = gJson?.results?.[0]?.name || '';
          } catch { /* ignore geocoding errors */ }

          const data: Weather = {
            temp: Math.round(wJson?.current?.temperature_2m ?? 0),
            code: wJson?.current?.weather_code ?? 0,
            city,
          };
          setWeather(data);
          try {
            localStorage.setItem(LS_KEY, JSON.stringify({ ts: Date.now(), data }));
          } catch { /* ignore localStorage errors */ }
        } catch {
          // network/geocoding failure — silently skip
        } finally {
          setWeatherLoading(false);
        }
      },
      () => setWeatherLoading(false),
      { timeout: 10000, maximumAge: 30 * 60 * 1000 }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!prayerTimes || !nextPrayer) return null;

  const allPrayers = [
    prayerTimes.fajr,
    prayerTimes.dhuhr,
    prayerTimes.asr,
    prayerTimes.maghrib,
    prayerTimes.isha,
  ];

  const w = weather ? weatherDescriptor(weather.code, isAr) : null;

  return (
    <DashboardWidgetShell
      title={t('dashboard.prayerTimes')}
      icon={Moon}
      headerAction={
        isRamadanPeriod ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary/10 text-primary text-[11px] font-medium">
            <span aria-hidden="true">🌙</span>
            {isAr ? 'رمضان' : 'Ramadan'}
          </span>
        ) : undefined
      }
    >
      {/* Date + weather strip */}
      <div className="flex items-center justify-between gap-2 mb-3 text-[11px]">
        <div className="min-w-0">
          <p className="text-foreground font-medium truncate">{gregorian}</p>
          <p className="text-muted-foreground truncate">{hijri}</p>
        </div>
        <div className="shrink-0 text-end">
          {weatherLoading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
          ) : weather && w ? (
            <div className="flex items-center gap-1.5">
              <span className="text-base leading-none" aria-hidden="true">{w.emoji}</span>
              <div className="leading-tight">
                <p className="font-semibold text-foreground tabular-nums">
                  {weather.temp}°
                </p>
                {weather.city && (
                  <p className="text-muted-foreground flex items-center gap-0.5 justify-end">
                    <MapPin className="w-2.5 h-2.5" />
                    <span className="truncate max-w-[80px]">{weather.city}</span>
                  </p>
                )}
              </div>
            </div>
          ) : (
            <span className="text-muted-foreground inline-flex items-center gap-1">
              <CloudSun className="w-3 h-3" aria-hidden="true" />
              {isAr ? 'الطقس' : 'Weather'}
            </span>
          )}
        </div>
      </div>

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
              <span aria-hidden="true">🌙 </span>
              {isAr ? 'وقت الإفطار' : 'Iftar Time'}
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
