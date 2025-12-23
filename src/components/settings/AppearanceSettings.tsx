import { useLanguage } from '@/hooks/useLanguage';
import { useTheme } from '@/hooks/useTheme';
import { Sun, Moon, Check, Monitor, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export function AppearanceSettings() {
  const { t } = useLanguage();
  const { theme, setTheme } = useTheme();

  const handleThemeChange = (newTheme: 'light' | 'dark') => {
    setTheme(newTheme);
    toast.success(t('settings.themeChanged'));
  };

  return (
    <div className="space-y-6">
      {/* Theme Selection */}
      <div>
        <h4 className="text-sm font-medium text-foreground mb-4">{t('settings.selectTheme')}</h4>
        <div className="grid grid-cols-2 gap-4">
          {/* Light Mode */}
          <button
            onClick={() => handleThemeChange('light')}
            className={cn(
              'relative flex flex-col items-center gap-3 p-6 rounded-2xl border-2 transition-all duration-300',
              theme === 'light'
                ? 'border-primary bg-gradient-to-br from-amber-100/50 to-orange-100/50 dark:from-amber-900/30 dark:to-orange-900/30 shadow-lg shadow-primary/10'
                : 'border-border hover:border-primary/50 hover:bg-muted/30'
            )}
          >
            {theme === 'light' && (
              <div className="absolute top-3 end-3 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                <Check className="w-4 h-4 text-primary-foreground" />
              </div>
            )}
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
              <Sun className="w-8 h-8 text-white" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-foreground">{t('settings.lightMode')}</p>
              <p className="text-xs text-muted-foreground">{t('settings.lightModeDesc')}</p>
            </div>
          </button>

          {/* Dark Mode */}
          <button
            onClick={() => handleThemeChange('dark')}
            className={cn(
              'relative flex flex-col items-center gap-3 p-6 rounded-2xl border-2 transition-all duration-300',
              theme === 'dark'
                ? 'border-primary bg-gradient-to-br from-indigo-100/50 to-purple-100/50 dark:from-indigo-900/30 dark:to-purple-900/30 shadow-lg shadow-primary/10'
                : 'border-border hover:border-primary/50 hover:bg-muted/30'
            )}
          >
            {theme === 'dark' && (
              <div className="absolute top-3 end-3 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                <Check className="w-4 h-4 text-primary-foreground" />
              </div>
            )}
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center shadow-lg">
              <Moon className="w-8 h-8 text-white" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-foreground">{t('settings.darkMode')}</p>
              <p className="text-xs text-muted-foreground">{t('settings.darkModeDesc')}</p>
            </div>
          </button>
        </div>
      </div>

      {/* Accent Color Preview */}
      <div className="p-4 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h4 className="font-medium text-foreground">{t('settings.accentColor')}</h4>
            <p className="text-sm text-muted-foreground">{t('settings.accentColorDesc')}</p>
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <div className="w-8 h-8 rounded-full bg-primary ring-2 ring-primary ring-offset-2 ring-offset-background"></div>
          <div className="w-8 h-8 rounded-full bg-primary/80"></div>
          <div className="w-8 h-8 rounded-full bg-primary/60"></div>
          <div className="w-8 h-8 rounded-full bg-primary/40"></div>
          <div className="w-8 h-8 rounded-full bg-primary/20"></div>
        </div>
      </div>
    </div>
  );
}
