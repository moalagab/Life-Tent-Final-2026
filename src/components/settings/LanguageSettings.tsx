import { useLanguage } from '@/hooks/useLanguage';
import { Check, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export function LanguageSettings() {
  const { t, currentLanguage, changeLanguage } = useLanguage();

  const handleLanguageChange = (lang: 'ar' | 'en') => {
    changeLanguage(lang);
    toast.success(t('settings.languageChanged'));
  };

  return (
    <div className="space-y-6">
      {/* Language Selection */}
      <div>
        <h4 className="text-sm font-medium text-foreground mb-4">{t('settings.selectLanguage')}</h4>
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => handleLanguageChange('ar')}
            className={cn(
              'relative flex flex-col items-center gap-3 p-6 rounded-2xl border-2 transition-all duration-300',
              currentLanguage === 'ar'
                ? 'border-primary bg-primary/10 shadow-lg shadow-primary/10'
                : 'border-border hover:border-primary/50 hover:bg-muted/30'
            )}
          >
            {currentLanguage === 'ar' && (
              <div className="absolute top-3 end-3 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                <Check className="w-4 h-4 text-primary-foreground" />
              </div>
            )}
            <span className="text-4xl">🇸🇦</span>
            <div className="text-center">
              <p className="font-semibold text-foreground">{t('settings.arabic')}</p>
              <p className="text-xs text-muted-foreground">العربية</p>
            </div>
          </button>
          
          <button
            onClick={() => handleLanguageChange('en')}
            className={cn(
              'relative flex flex-col items-center gap-3 p-6 rounded-2xl border-2 transition-all duration-300',
              currentLanguage === 'en'
                ? 'border-primary bg-primary/10 shadow-lg shadow-primary/10'
                : 'border-border hover:border-primary/50 hover:bg-muted/30'
            )}
          >
            {currentLanguage === 'en' && (
              <div className="absolute top-3 end-3 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                <Check className="w-4 h-4 text-primary-foreground" />
              </div>
            )}
            <span className="text-4xl">🇺🇸</span>
            <div className="text-center">
              <p className="font-semibold text-foreground">{t('settings.english')}</p>
              <p className="text-xs text-muted-foreground">English</p>
            </div>
          </button>
        </div>
      </div>

      {/* Calendar Format Info */}
      <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
            <Globe className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h4 className="font-medium text-foreground">{t('settings.calendarFormat')}</h4>
            <p className="text-sm text-muted-foreground">{t('settings.calendarFormatDesc')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
