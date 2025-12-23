import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { formatHijriDate } from '@/lib/hijri';
import { MapPin, Cloud, Sun, CloudRain } from 'lucide-react';

function getGreeting(): { en: string; ar: string } {
  const hour = new Date().getHours();
  if (hour < 5) return { en: 'Good Night', ar: 'طابت ليلتك' };
  if (hour < 12) return { en: 'Good Morning', ar: 'صباح الخير' };
  if (hour < 17) return { en: 'Good Afternoon', ar: 'مساء الخير' };
  if (hour < 21) return { en: 'Good Evening', ar: 'مساء النور' };
  return { en: 'Good Night', ar: 'طابت ليلتك' };
}

export function GreetingHeader() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const greeting = getGreeting();

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const gregorianDate = format(currentTime, 'EEEE, MMMM d, yyyy');
  const hijriDate = formatHijriDate(currentTime, 'ar');
  const timeString = format(currentTime, 'HH:mm');

  return (
    <div className="mb-8">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
            <MapPin className="w-4 h-4" />
            <span>Riyadh, Saudi Arabia</span>
            <span className="mx-2">•</span>
            <Sun className="w-4 h-4 text-primary" />
            <span>34°C Clear</span>
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold mb-2">
            <span className="text-foreground">{greeting.en}, </span>
            <span className="gold-text">User</span>
          </h1>
          <p className="text-muted-foreground text-lg" dir="rtl">
            {greeting.ar} 👋
          </p>
        </div>

        <div className="glass-card p-4 text-right" dir="rtl">
          <div className="text-3xl font-bold gold-text mb-1">{timeString}</div>
          <div className="text-sm text-foreground">{hijriDate}</div>
          <div className="text-xs text-muted-foreground mt-1">{gregorianDate}</div>
        </div>
      </div>
    </div>
  );
}
