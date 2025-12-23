import { useLanguage } from '@/hooks/useLanguage';
import { useTheme } from '@/hooks/useTheme';
import { Sun, Moon, Check } from 'lucide-react';
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
      <div>
        <h4 className="text-sm font-medium text-foreground mb-4">{t('settings.selectTheme')}</h4>
        <div className="flex gap-3">
          <button
            onClick={() => handleThemeChange('light')}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all',
              theme === 'light'
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border hover:border-primary/50 text-muted-foreground hover:text-foreground'
            )}
          >
            {theme === 'light' && <Check className="w-5 h-5" />}
            <Sun className="w-5 h-5" />
            <span className="font-medium">{t('settings.lightMode')}</span>
          </button>
          <button
            onClick={() => handleThemeChange('dark')}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all',
              theme === 'dark'
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border hover:border-primary/50 text-muted-foreground hover:text-foreground'
            )}
          >
            {theme === 'dark' && <Check className="w-5 h-5" />}
            <Moon className="w-5 h-5" />
            <span className="font-medium">{t('settings.darkMode')}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
