import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { formatHijriDate } from '@/lib/hijri';
import { MapPin, Sun, Sparkles, Clock, CalendarDays } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

interface GreetingInfo {
  greeting: string;
  subMessage: string;
  emoji: string;
}

function getGreetingInfo(lang: string): GreetingInfo {
  const hour = new Date().getHours();
  
  if (lang === 'ar') {
    if (hour < 5) {
      return { greeting: 'طابت ليلتك', subMessage: 'الراحة مهمة للإنتاجية', emoji: '🌙' };
    }
    if (hour < 12) {
      return { greeting: 'صباح الخير', subMessage: 'يوم جديد مليء بالفرص', emoji: '☀️' };
    }
    if (hour < 17) {
      return { greeting: 'مساء الخير', subMessage: 'استمر في تحقيق أهدافك', emoji: '🌤️' };
    }
    if (hour < 21) {
      return { greeting: 'مساء النور', subMessage: 'وقت مثالي لمراجعة إنجازاتك', emoji: '🌅' };
    }
    return { greeting: 'طابت ليلتك', subMessage: 'أحسنت اليوم، استرح جيداً', emoji: '🌙' };
  }
  
  if (hour < 5) {
    return { greeting: 'Good Night', subMessage: 'Rest is key to productivity', emoji: '🌙' };
  }
  if (hour < 12) {
    return { greeting: 'Good Morning', subMessage: 'A new day full of opportunities', emoji: '☀️' };
  }
  if (hour < 17) {
    return { greeting: 'Good Afternoon', subMessage: 'Keep achieving your goals', emoji: '🌤️' };
  }
  if (hour < 21) {
    return { greeting: 'Good Evening', subMessage: 'Perfect time to review your progress', emoji: '🌅' };
  }
  return { greeting: 'Good Night', subMessage: 'Great job today, rest well', emoji: '🌙' };
}

export function GreetingHeader() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const { currentLanguage, isRTL, t } = useLanguage();
  const { user } = useAuth();
  const greetingInfo = getGreetingInfo(currentLanguage);

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const gregorianDate = format(currentTime, currentLanguage === 'ar' ? 'EEEE، d MMMM yyyy' : 'EEEE, MMMM d, yyyy');
  const hijriDate = formatHijriDate(currentTime, 'ar');
  const timeString = format(currentTime, 'HH:mm');
  const seconds = format(currentTime, 'ss');

  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || (currentLanguage === 'ar' ? 'المستخدم' : 'User');

  return (
    <div className="relative overflow-hidden rounded-3xl mesh-header aurora-bg border border-border/40 p-6 lg:p-10 shadow-[0_8px_40px_-12px_hsl(var(--primary)/0.15)]">
      {/* Subtle grain overlay for depth */}
      <div
        className="absolute inset-0 opacity-[0.015] pointer-events-none mix-blend-overlay"
        style={{
          backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")',
        }}
      />

      <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        {/* Main Greeting Section */}
        <div className="space-y-4 flex-1">
          {/* Location & Weather Badge */}
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-2xl bg-muted/50 backdrop-blur-sm border border-border/30 shadow-sm">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <MapPin className="w-4 h-4" />
              <span>{currentLanguage === 'ar' ? 'الرياض، السعودية' : 'Riyadh, KSA'}</span>
            </div>
            <div className="w-px h-4 bg-border/50" />
            <div className="flex items-center gap-2 text-sm">
              <Sun className="w-4 h-4 text-primary" />
              <span className="text-foreground font-medium">34°</span>
              <span className="text-muted-foreground">{currentLanguage === 'ar' ? 'صافي' : 'Clear'}</span>
            </div>
          </div>

          {/* Greeting Text */}
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{greetingInfo.emoji}</span>
              <h1 className="text-3xl lg:text-5xl font-bold tracking-tight">
                <span className="text-foreground">{greetingInfo.greeting}</span>
                <span className="text-muted-foreground/50">، </span>
                <span className="relative inline-block">
                  <span className="gold-text">{userName}</span>
                  <Sparkles className="absolute -top-1 -right-5 w-5 h-5 text-primary animate-pulse" />
                </span>
              </h1>
            </div>
            <p className="text-muted-foreground text-base lg:text-lg flex items-center gap-2">
              {greetingInfo.subMessage}
            </p>
          </div>
        </div>

        {/* Time & Date Card */}
        <div 
          className={cn(
            "relative group flex-shrink-0",
            "p-5 lg:p-6 rounded-2xl",
            "bg-gradient-to-br from-muted/50 to-muted/20",
            "backdrop-blur-xl border border-border/30",
            "shadow-lg hover:shadow-xl transition-all duration-500",
            "hover:border-primary/30 hover:scale-[1.02]"
          )} 
          dir={isRTL ? 'rtl' : 'ltr'}
        >
          {/* Glow Effect */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          <div className="relative space-y-4">
            {/* Time Display */}
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              <div className="flex items-baseline gap-1">
                <span className="text-4xl lg:text-5xl font-bold gold-text tabular-nums tracking-tight">{timeString}</span>
                <span className="text-lg text-muted-foreground tabular-nums">:{seconds}</span>
              </div>
            </div>
            
            {/* Dates */}
            <div className="space-y-2 pt-2 border-t border-border/30">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="text-sm font-medium text-foreground">{hijriDate}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <CalendarDays className="w-3.5 h-3.5" />
                <span>{gregorianDate}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
