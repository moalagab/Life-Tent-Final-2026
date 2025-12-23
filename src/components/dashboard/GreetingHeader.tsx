import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { formatHijriDate } from '@/lib/hijri';
import { MapPin, Sun, Cloud, Sparkles } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

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
  const seconds = format(currentTime, 'ss');

  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || (currentLanguage === 'ar' ? 'المستخدم' : 'User');

  return (
    <div className="relative mb-8 overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-gold-500/5 rounded-full blur-3xl animate-float" />
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        {/* Main Greeting Section */}
        <div className="space-y-4">
          {/* Location & Weather Badge */}
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-muted/50 backdrop-blur-sm border border-border/50">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <MapPin className="w-4 h-4" />
              <span>{currentLanguage === 'ar' ? 'الرياض، السعودية' : 'Riyadh, KSA'}</span>
            </div>
            <div className="w-px h-4 bg-border" />
            <div className="flex items-center gap-2 text-sm">
              <Sun className="w-4 h-4 text-primary" />
              <span className="text-foreground font-medium">34°</span>
              <span className="text-muted-foreground">{currentLanguage === 'ar' ? 'صافي' : 'Clear'}</span>
            </div>
          </div>

          {/* Greeting Text */}
          <div>
            <h1 className="text-4xl lg:text-6xl font-bold tracking-tight">
              <span className="text-foreground">{greeting}</span>
              <span className="text-muted-foreground/60">، </span>
              <span className="relative inline-block">
                <span className="gold-text">{userName}</span>
                <Sparkles className="absolute -top-1 -right-4 w-5 h-5 text-primary animate-pulse" />
              </span>
            </h1>
            <p className="text-muted-foreground text-lg mt-2 flex items-center gap-2">
              {currentLanguage === 'ar' ? 'لوحة تحكم شخصية لحياتك' : 'Your personal life dashboard'}
              <span className="inline-block animate-float">👋</span>
            </p>
          </div>
        </div>

        {/* Time & Date Card */}
        <div 
          className={cn(
            "relative group",
            "p-6 rounded-2xl",
            "bg-gradient-to-br from-card/80 to-card/40",
            "backdrop-blur-xl border border-border/50",
            "shadow-lg hover:shadow-xl transition-all duration-500",
            "hover:border-primary/30"
          )} 
          dir={isRTL ? 'rtl' : 'ltr'}
        >
          {/* Glow Effect */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          <div className="relative">
            {/* Time Display */}
            <div className="flex items-baseline gap-1 mb-3">
              <span className="text-4xl font-bold gold-text tabular-nums">{timeString}</span>
              <span className="text-lg text-muted-foreground tabular-nums">:{seconds}</span>
            </div>
            
            {/* Dates */}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="text-sm font-medium text-foreground">{hijriDate}</span>
              </div>
              <p className="text-xs text-muted-foreground ps-4">{gregorianDate}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
