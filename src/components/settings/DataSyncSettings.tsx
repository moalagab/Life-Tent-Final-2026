import { useLanguage } from '@/hooks/useLanguage';
import { Button } from '@/components/ui/button';
import { Download, Cloud, Database, Loader2, Shield, Clock } from 'lucide-react';
import { useTasks } from '@/hooks/useTasks';
import { useProjects } from '@/hooks/useProjects';
import { useHabits } from '@/hooks/useHabits';
import { useGoals } from '@/hooks/useGoals';
import { useTransactions, useAccounts } from '@/hooks/useFinance';
import { exportTasks, exportProjects, exportHabits, exportGoals, exportTransactions, exportAccounts } from '@/lib/export-utils';
import { useDataBackup } from '@/hooks/useDataBackup';
import { toast } from 'sonner';
import { format } from 'date-fns';

export function DataSyncSettings() {
  const { t } = useLanguage();
  
  const { data: tasks, isLoading: tasksLoading } = useTasks();
  const { data: projects, isLoading: projectsLoading } = useProjects();
  const { data: habits, isLoading: habitsLoading } = useHabits();
  const { data: goals, isLoading: goalsLoading } = useGoals();
  const { data: transactions, isLoading: transactionsLoading } = useTransactions();
  const { data: accounts, isLoading: accountsLoading } = useAccounts();

  const isLoading = tasksLoading || projectsLoading || habitsLoading || goalsLoading || transactionsLoading || accountsLoading;
  const { backup, backing, lastBackup } = useDataBackup();

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
        case 'all':
          exportAllData();
          break;
      }
      toast.success(t('common.exportSuccess'));
    } catch {
      toast.error(t('common.exportError'));
    }
  };

  const exportAllData = () => {
    const allData = {
      exportDate: new Date().toISOString(),
      tasks: tasks || [],
      projects: projects || [],
      habits: habits || [],
      goals: goals || [],
      transactions: transactions || [],
      accounts: accounts || [],
    };

    const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `life-tent-backup-${format(new Date(), 'yyyy-MM-dd')}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cloud Sync Status */}
      <div className="p-4 rounded-xl bg-success/10 border border-success/20">
        <div className="flex items-center gap-3">
          <Cloud className="w-5 h-5 text-success" />
          <div>
            <h4 className="font-medium text-foreground">{t('settings.syncStatus')}</h4>
            <p className="text-sm text-success">{t('settings.syncedWithCloud')}</p>
          </div>
        </div>
      </div>

      {/* Data Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div className="p-3 rounded-lg bg-muted/30 border border-border text-center">
          <p className="text-2xl font-bold text-foreground">{tasks?.length || 0}</p>
          <p className="text-xs text-muted-foreground">{t('common.tasks')}</p>
        </div>
        <div className="p-3 rounded-lg bg-muted/30 border border-border text-center">
          <p className="text-2xl font-bold text-foreground">{projects?.length || 0}</p>
          <p className="text-xs text-muted-foreground">{t('common.projects')}</p>
        </div>
        <div className="p-3 rounded-lg bg-muted/30 border border-border text-center">
          <p className="text-2xl font-bold text-foreground">{habits?.length || 0}</p>
          <p className="text-xs text-muted-foreground">{t('common.habits')}</p>
        </div>
        <div className="p-3 rounded-lg bg-muted/30 border border-border text-center">
          <p className="text-2xl font-bold text-foreground">{goals?.length || 0}</p>
          <p className="text-xs text-muted-foreground">{t('common.goals')}</p>
        </div>
        <div className="p-3 rounded-lg bg-muted/30 border border-border text-center">
          <p className="text-2xl font-bold text-foreground">{transactions?.length || 0}</p>
          <p className="text-xs text-muted-foreground">{t('finance.recentTransactions')}</p>
        </div>
        <div className="p-3 rounded-lg bg-muted/30 border border-border text-center">
          <p className="text-2xl font-bold text-foreground">{accounts?.length || 0}</p>
          <p className="text-xs text-muted-foreground">{t('finance.addAccount')}</p>
        </div>
      </div>

      {/* Export Options */}
      <div>
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

      {/* Full Local Export */}
      <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Database className="w-5 h-5 text-primary" />
            <div>
              <h4 className="font-medium text-foreground">{t('settings.fullBackup')}</h4>
              <p className="text-sm text-muted-foreground">{t('settings.fullBackupDesc')}</p>
            </div>
          </div>
          <Button variant="outline" onClick={() => handleExport('all')}>
            <Download className="w-4 h-4 me-2" />
            CSV
          </Button>
        </div>
      </div>

      {/* Full Cloud Backup */}
      <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <Shield className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <h4 className="font-medium text-foreground">نسخة احتياطية شاملة (JSON)</h4>
              <p className="text-sm text-muted-foreground">جميع بياناتك في ملف واحد قابل للاستعادة</p>
              {lastBackup && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                  <Clock className="w-3 h-3" />
                  آخر نسخة: {format(new Date(lastBackup), 'yyyy/MM/dd HH:mm')}
                </div>
              )}
            </div>
          </div>
          <Button onClick={backup} disabled={backing} className="shrink-0">
            {backing ? <Loader2 className="w-4 h-4 animate-spin me-2" /> : <Download className="w-4 h-4 me-2" />}
            {backing ? 'جارٍ النسخ…' : 'نسخ احتياطي'}
          </Button>
        </div>
      </div>
    </div>
  );
}
