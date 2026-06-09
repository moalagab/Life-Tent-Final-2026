/* eslint-disable @typescript-eslint/no-explicit-any */
import { useFinanceAuditLog, useFinanceActivityLog } from '@/hooks/useFinanceAuditLog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Loader2, History, FileText, Clock, ArrowRight, Plus, Pencil, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useLanguage } from '@/hooks/useLanguage';
import { cn } from '@/lib/utils';

const actionIcons = {
  INSERT: Plus,
  UPDATE: Pencil,
  DELETE: Trash2,
};

const actionColors = {
  INSERT: 'bg-emerald-500/10 text-emerald-500',
  UPDATE: 'bg-amber-500/10 text-amber-500',
  DELETE: 'bg-destructive/10 text-destructive',
};

export function FinanceAuditLogView() {
  const { data: auditLogs, isLoading: auditLoading } = useFinanceAuditLog(50);
  const { data: activityLogs, isLoading: activityLoading } = useFinanceActivityLog(100);
  const { currentLanguage } = useLanguage();

  if (auditLoading || activityLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const getEntityLabel = (type: string) => {
    const labels: Record<string, { ar: string; en: string }> = {
      transactions: { ar: 'معاملة', en: 'Transaction' },
      accounts: { ar: 'حساب', en: 'Account' },
      budgets: { ar: 'ميزانية', en: 'Budget' },
      debts: { ar: 'دين', en: 'Debt' },
      subscriptions: { ar: 'اشتراك', en: 'Subscription' },
    };
    return labels[type]?.[currentLanguage] || type;
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, { ar: string; en: string }> = {
      INSERT: { ar: 'إضافة', en: 'Created' },
      UPDATE: { ar: 'تعديل', en: 'Updated' },
      DELETE: { ar: 'حذف', en: 'Deleted' },
    };
    return labels[action]?.[currentLanguage] || action;
  };

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="w-5 h-5 text-primary" />
          {currentLanguage === 'ar' ? 'سجل النشاط المالي' : 'Financial Activity Log'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="audit">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="audit" className="gap-2">
              <FileText className="w-4 h-4" />
              {currentLanguage === 'ar' ? 'سجل التدقيق' : 'Audit Log'}
            </TabsTrigger>
            <TabsTrigger value="activity" className="gap-2">
              <Clock className="w-4 h-4" />
              {currentLanguage === 'ar' ? 'النشاط' : 'Activity'}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="audit" className="mt-4">
            {!auditLogs || auditLogs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>{currentLanguage === 'ar' ? 'لا توجد سجلات تدقيق' : 'No audit logs'}</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {auditLogs.map((log) => {
                  const ActionIcon = actionIcons[log.action as keyof typeof actionIcons] || FileText;
                  return (
                    <div key={log.id} className="p-4 rounded-xl bg-muted/30 border border-border">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <div className={cn(
                            'w-8 h-8 rounded-lg flex items-center justify-center',
                            actionColors[log.action as keyof typeof actionColors]
                          )}>
                            <ActionIcon className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-foreground">
                                {getActionLabel(log.action)}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {getEntityLabel(log.entity_type)}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {format(new Date(log.created_at), 'PPpp', { 
                                locale: currentLanguage === 'ar' ? ar : undefined 
                              })}
                            </p>
                            {log.source && (
                              <Badge variant="secondary" className="mt-2 text-xs">
                                {log.source}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {log.action === 'UPDATE' && log.old_values && log.new_values && (
                        <div className="mt-3 p-2 rounded-lg bg-background/50 text-xs">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <span className="line-through">{JSON.stringify(log.old_values).slice(0, 50)}...</span>
                            <ArrowRight className="w-3 h-3" />
                            <span className="text-foreground">{JSON.stringify(log.new_values).slice(0, 50)}...</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="activity" className="mt-4">
            {!activityLogs || activityLogs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>{currentLanguage === 'ar' ? 'لا توجد أنشطة' : 'No activities'}</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {activityLogs.map((log: any) => {
                  const ActionIcon = actionIcons[log.action as keyof typeof actionIcons] || FileText;
                  return (
                    <div key={log.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/30 transition-colors">
                      <div className={cn(
                        'w-6 h-6 rounded flex items-center justify-center',
                        actionColors[log.action as keyof typeof actionColors]
                      )}>
                        <ActionIcon className="w-3 h-3" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground truncate">
                          {getActionLabel(log.action)} {getEntityLabel(log.entity_type)}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {format(new Date(log.created_at), 'HH:mm')}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
