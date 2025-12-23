import { MainLayout } from '@/components/layout/MainLayout';
import { User, Bell, Globe, Shield, Palette, Database, ArrowUpRight, Check, Sun, Moon, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/hooks/useLanguage';
import { useTheme } from '@/hooks/useTheme';
import { useNotifications } from '@/hooks/useNotifications';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { useTasks } from '@/hooks/useTasks';
import { useProjects } from '@/hooks/useProjects';
import { useHabits } from '@/hooks/useHabits';
import { useGoals } from '@/hooks/useGoals';
import { useTransactions, useAccounts } from '@/hooks/useFinance';
import { exportTasks, exportProjects, exportHabits, exportGoals, exportTransactions, exportAccounts } from '@/lib/export-utils';

export default function Settings() {
  const { t, currentLanguage, changeLanguage } = useLanguage();
  const { theme, setTheme } = useTheme();
  const { enabled, enableNotifications, disableNotifications, permission } = useNotifications();
  
  const { data: tasks } = useTasks();
  const { data: projects } = useProjects();
  const { data: habits } = useHabits();
  const { data: goals } = useGoals();
  const { data: transactions } = useTransactions();
  const { data: accounts } = useAccounts();

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

  const handleNotificationToggle = async () => {
    if (enabled) {
      disableNotifications();
      toast.success(t('settings.notificationsDisabled'));
    } else {
      const success = await enableNotifications();
      if (success) {
        toast.success(t('settings.notificationsEnabled'));
      } else {
        toast.error(t('settings.notificationPermissionDenied'));
      }
    }
  };

  const handleExport = (type: string) => {
    try {
      switch (type) {
        case 'tasks':
          if (tasks) exportTasks(tasks);
          break;
        case 'projects':
          if (projects) exportProjects(projects);
          break;
        case 'habits':
          if (habits) exportHabits(habits);
          break;
        case 'goals':
          if (goals) exportGoals(goals);
          break;
        case 'transactions':
          if (transactions) exportTransactions(transactions);
          break;
        case 'accounts':
          if (accounts) exportAccounts(accounts);
          break;
      }
      toast.success(t('common.exportSuccess'));
    } catch (error) {
      toast.error(t('common.exportError'));
    }
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

              {/* Notifications Settings */}
              {section.id === 'notifications' && (
                <div className="glass-card p-5 mt-2 ms-12 border-primary/20">
                  <h4 className="text-sm font-medium text-foreground mb-4">{t('settings.notificationSettings')}</h4>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{t('settings.enableNotifications')}</span>
                    <Switch checked={enabled} onCheckedChange={handleNotificationToggle} />
                  </div>
                  {permission === 'denied' && (
                    <p className="text-xs text-destructive mt-2">{t('settings.notificationPermissionDenied')}</p>
                  )}
                </div>
              )}

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

              {/* Data Export */}
              {section.id === 'data' && (
                <div className="glass-card p-5 mt-2 ms-12 border-primary/20">
                  <h4 className="text-sm font-medium text-foreground mb-4">{t('common.export')}</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <Button variant="outline" onClick={() => handleExport('tasks')} className="justify-start">
                      <Download className="w-4 h-4 me-2" />
                      {t('common.tasks')}
                    </Button>
                    <Button variant="outline" onClick={() => handleExport('projects')} className="justify-start">
                      <Download className="w-4 h-4 me-2" />
                      {t('common.projects')}
                    </Button>
                    <Button variant="outline" onClick={() => handleExport('habits')} className="justify-start">
                      <Download className="w-4 h-4 me-2" />
                      {t('common.habits')}
                    </Button>
                    <Button variant="outline" onClick={() => handleExport('goals')} className="justify-start">
                      <Download className="w-4 h-4 me-2" />
                      {t('common.goals')}
                    </Button>
                    <Button variant="outline" onClick={() => handleExport('transactions')} className="justify-start">
                      <Download className="w-4 h-4 me-2" />
                      {t('finance.recentTransactions')}
                    </Button>
                    <Button variant="outline" onClick={() => handleExport('accounts')} className="justify-start">
                      <Download className="w-4 h-4 me-2" />
                      {t('finance.addAccount')}
                    </Button>
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
