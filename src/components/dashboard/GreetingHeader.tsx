import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { formatHijriDate } from '@/lib/hijri';
import { MapPin, Sun } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { useAuth } from '@/hooks/useAuth';

function getGreeting(lang: string): string {
  const hour = new Date().getHours();
  if (lang === 'ar') {
    if (hour < 5) return 'طابت ليلتك';
    if (hour < 12) return 'صباح الخير';
    if (hour < 17) return 'مساء الخير';
    if (hour < 21) return 'مساء النور';
    return 'طابت ليلتك';
  }
  if (hour < 5) return 'Good Night';
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  if (hour < 21) return 'Good Evening';
  return 'Good Night';
}

export function GreetingHeader() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const { currentLanguage, isRTL } = useLanguage();
  const { user } = useAuth();
  const greeting = getGreeting(currentLanguage);

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const gregorianDate = format(currentTime, 'EEEE, MMMM d, yyyy');
  const hijriDate = formatHijriDate(currentTime, 'ar');
  const timeString = format(currentTime, 'HH:mm');

  // Get user name from email or metadata
  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || (currentLanguage === 'ar' ? 'المستخدم' : 'User');

  return (
    <div className="mb-8">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
            <MapPin className="w-4 h-4" />
            <span>{currentLanguage === 'ar' ? 'الرياض، المملكة العربية السعودية' : 'Riyadh, Saudi Arabia'}</span>
            <span className="mx-2">•</span>
            <Sun className="w-4 h-4 text-primary" />
            <span>{currentLanguage === 'ar' ? '٣٤° صافي' : '34°C Clear'}</span>
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold mb-2">
            <span className="text-foreground">{greeting}، </span>
            <span className="gold-text">{userName}</span>
          </h1>
          <p className="text-muted-foreground text-lg">
            {currentLanguage === 'ar' ? 'لوحة تحكم شخصية لحياتك' : 'Your personal life dashboard'} 👋
          </p>
        </div>

        <div className="glass-card p-4" dir={isRTL ? 'rtl' : 'ltr'}>
          <div className="text-3xl font-bold gold-text mb-1">{timeString}</div>
          <div className="text-sm text-foreground">{hijriDate}</div>
          <div className="text-xs text-muted-foreground mt-1">{gregorianDate}</div>
        </div>
      </div>
    </div>
  );
}
