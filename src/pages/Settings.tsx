import { MainLayout } from '@/components/layout/MainLayout';
import { User, Bell, Globe, Shield, Palette, Database, ArrowUpRight, Check, Sun, Moon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/hooks/useLanguage';
import { useTheme } from '@/hooks/useTheme';
import { toast } from 'sonner';

export default function Settings() {
  const { t, currentLanguage, changeLanguage } = useLanguage();
  const { theme, setTheme } = useTheme();

  const settingsSections = [
    { id: 'profile', label: t('settings.profile'), icon: User, description: t('settings.profileDesc') },
    { id: 'notifications', label: t('settings.notifications'), icon: Bell, description: t('settings.notificationsDesc') },
    { id: 'language', label: t('settings.language'), icon: Globe, description: t('settings.languageDesc') },
    { id: 'appearance', label: t('settings.appearance'), icon: Palette, description: t('settings.appearanceDesc') },
    { id: 'privacy', label: t('settings.privacy'), icon: Shield, description: t('settings.privacyDesc') },
    { id: 'data', label: t('settings.dataSync'), icon: Database, description: t('settings.dataSyncDesc') },
  ];

  const handleLanguageChange = (lang: 'ar' | 'en') => {
    changeLanguage(lang);
    toast.success(t('settings.languageChanged'));
  };

  const handleThemeChange = (newTheme: 'light' | 'dark') => {
    setTheme(newTheme);
    toast.success(t('settings.themeChanged'));
  };

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">{t('settings.title')}</h1>
          <p className="text-muted-foreground mt-1">{t('settings.subtitle')}</p>
        </div>

        <div className="space-y-4">
          {settingsSections.map((section) => (
            <div key={section.id}>
              <div className="glass-card p-5 hover:border-primary/30 transition-all cursor-pointer group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <section.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                      {section.label}
                    </h3>
                    <p className="text-sm text-muted-foreground">{section.description}</p>
                  </div>
                  <ArrowUpRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </div>

              {/* Language Selection */}
              {section.id === 'language' && (
                <div className="glass-card p-5 mt-2 ms-12 border-primary/20">
                  <h4 className="text-sm font-medium text-foreground mb-4">{t('settings.selectLanguage')}</h4>
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleLanguageChange('ar')}
                      className={cn(
                        'flex-1 flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all',
                        currentLanguage === 'ar'
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border hover:border-primary/50 text-muted-foreground hover:text-foreground'
                      )}
                    >
                      {currentLanguage === 'ar' && <Check className="w-5 h-5" />}
                      <span className="font-medium">{t('settings.arabic')}</span>
                      <span className="text-lg">🇸🇦</span>
                    </button>
                    <button
                      onClick={() => handleLanguageChange('en')}
                      className={cn(
                        'flex-1 flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all',
                        currentLanguage === 'en'
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border hover:border-primary/50 text-muted-foreground hover:text-foreground'
                      )}
                    >
                      {currentLanguage === 'en' && <Check className="w-5 h-5" />}
                      <span className="font-medium">{t('settings.english')}</span>
                      <span className="text-lg">🇺🇸</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Theme Selection */}
              {section.id === 'appearance' && (
                <div className="glass-card p-5 mt-2 ms-12 border-primary/20">
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
              )}
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">LIFE TENT v1.0.0</p>
          <p className="text-xs text-muted-foreground mt-1">Built with ❤️ for the Middle East</p>
        </div>
      </div>
    </MainLayout>
  );
}
