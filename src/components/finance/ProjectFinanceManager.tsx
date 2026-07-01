import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Plus, Briefcase, TrendingUp, TrendingDown, 
  AlertTriangle, CheckCircle, Loader2, DollarSign,
  ArrowUpRight, ArrowDownRight, BarChart3
} from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { useProjectFinance, useCreateProjectFinance, ProjectFinance } from '@/hooks/useAdvancedFinance';
import { useProjects } from '@/hooks/useProjects';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { parseMoneyInput } from '@/lib/parseMoneyInput';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export function ProjectFinanceManager() {
  const { currentLanguage } = useLanguage();
  const language = currentLanguage;
  const { data: projects, isLoading: projectsLoading } = useProjects();
  const { data: projectFinances, isLoading: financesLoading } = useProjectFinance();
  const createProjectFinance = useCreateProjectFinance();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [newFinance, setNewFinance] = useState({
    planned_budget_total: '',
    currency: 'SAR',
    evm_enabled: false,
  });

  const handleCreate = async () => {
    if (!selectedProjectId || !newFinance.planned_budget_total) {
      toast.error(language === 'ar' ? 'يرجى ملء جميع الحقول' : 'Please fill all fields');
      return;
    }
    const plannedBudgetTotal = parseMoneyInput(newFinance.planned_budget_total);
    if (plannedBudgetTotal === null) {
      toast.error(language === 'ar' ? 'الميزانية غير صالحة' : 'Invalid budget amount');
      return;
    }
    try {
      await createProjectFinance.mutateAsync({
        project_id: selectedProjectId,
        planned_budget_total: plannedBudgetTotal,
        currency: newFinance.currency,
        evm_enabled: newFinance.evm_enabled,
        actual_spend_total: 0,
        planned_value: 0,
        earned_value: 0,
      });
      toast.success(language === 'ar' ? 'تم إنشاء ميزانية المشروع' : 'Project budget created');
      setIsDialogOpen(false);
      setSelectedProjectId('');
      setNewFinance({ planned_budget_total: '', currency: 'SAR', evm_enabled: false });
    } catch (error) {
      toast.error(language === 'ar' ? 'حدث خطأ' : 'An error occurred');
    }
  };

  // Get project details for each finance
  const getProjectDetails = (projectId: string) => {
    return projects?.find(p => p.id === projectId);
  };

  // Calculate variance
  const calculateVariance = (pf: ProjectFinance) => {
    const variance = pf.planned_budget_total - pf.actual_spend_total;
    const variancePercent = pf.planned_budget_total > 0 
      ? (variance / pf.planned_budget_total) * 100 
      : 0;
    return { variance, variancePercent };
  };

  // Calculate EVM metrics
  const calculateEVM = (pf: ProjectFinance) => {
    const cpi = pf.actual_spend_total > 0 ? pf.earned_value / pf.actual_spend_total : 1;
    const spi = pf.planned_value > 0 ? pf.earned_value / pf.planned_value : 1;
    const eac = pf.planned_budget_total / cpi; // Estimate at Completion
    return { cpi, spi, eac };
  };

  // Chart data
  const chartData = projectFinances?.map(pf => {
    const project = getProjectDetails(pf.project_id);
    return {
      name: project?.title?.substring(0, 15) || 'Project',
      planned: pf.planned_budget_total,
      actual: pf.actual_spend_total,
      variance: pf.planned_budget_total - pf.actual_spend_total,
    };
  }) || [];

  // Summary stats
  const totalPlanned = projectFinances?.reduce((sum, pf) => sum + pf.planned_budget_total, 0) || 0;
  const totalActual = projectFinances?.reduce((sum, pf) => sum + pf.actual_spend_total, 0) || 0;
  const totalVariance = totalPlanned - totalActual;
  const overBudgetCount = projectFinances?.filter(pf => pf.actual_spend_total > pf.planned_budget_total).length || 0;

  if (projectsLoading || financesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            {language === 'ar' ? 'مالية المشاريع' : 'Project Finance'}
          </h2>
          <p className="text-muted-foreground">
            {language === 'ar' ? 'تتبع ميزانيات المشاريع والمصروفات' : 'Track project budgets and spending'}
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="gold">
              <Plus className="w-4 h-4 me-2" />
              {language === 'ar' ? 'إضافة ميزانية مشروع' : 'Add Project Budget'}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {language === 'ar' ? 'إنشاء ميزانية مشروع' : 'Create Project Budget'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                <SelectTrigger>
                  <SelectValue placeholder={language === 'ar' ? 'اختر المشروع' : 'Select Project'} />
                </SelectTrigger>
                <SelectContent>
                  {projects?.filter(p => !projectFinances?.some(pf => pf.project_id === p.id)).map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="number"
                placeholder={language === 'ar' ? 'الميزانية المخططة' : 'Planned Budget'}
                value={newFinance.planned_budget_total}
                onChange={(e) => setNewFinance({ ...newFinance, planned_budget_total: e.target.value })}
              />
              <Select 
                value={newFinance.currency} 
                onValueChange={(v) => setNewFinance({ ...newFinance, currency: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SAR">SAR</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="AED">AED</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleCreate} className="w-full" disabled={createProjectFinance.isPending}>
                {createProjectFinance.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : (language === 'ar' ? 'إنشاء' : 'Create')}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {language === 'ar' ? 'إجمالي الميزانية' : 'Total Budget'}
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {totalPlanned.toLocaleString()} SAR
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {language === 'ar' ? 'الإنفاق الفعلي' : 'Actual Spend'}
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {totalActual.toLocaleString()} SAR
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {language === 'ar' ? 'الفرق' : 'Variance'}
                </p>
                <p className={cn(
                  "text-2xl font-bold",
                  totalVariance >= 0 ? "text-success" : "text-destructive"
                )}>
                  {totalVariance >= 0 ? '+' : ''}{totalVariance.toLocaleString()} SAR
                </p>
              </div>
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center",
                totalVariance >= 0 ? "bg-success/10" : "bg-destructive/10"
              )}>
                {totalVariance >= 0 ? (
                  <TrendingUp className="w-5 h-5 text-success" />
                ) : (
                  <TrendingDown className="w-5 h-5 text-destructive" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {language === 'ar' ? 'تجاوز الميزانية' : 'Over Budget'}
                </p>
                <p className={cn(
                  "text-2xl font-bold",
                  overBudgetCount > 0 ? "text-destructive" : "text-success"
                )}>
                  {overBudgetCount} {language === 'ar' ? 'مشروع' : 'projects'}
                </p>
              </div>
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center",
                overBudgetCount > 0 ? "bg-destructive/10" : "bg-success/10"
              )}>
                {overBudgetCount > 0 ? (
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                ) : (
                  <CheckCircle className="w-5 h-5 text-success" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Budget vs Actual Chart */}
      {chartData.length > 0 && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>
              {language === 'ar' ? 'الميزانية مقابل الفعلي' : 'Budget vs Actual'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Bar 
                    dataKey="planned" 
                    name={language === 'ar' ? 'المخطط' : 'Planned'} 
                    fill="hsl(var(--primary))" 
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar 
                    dataKey="actual" 
                    name={language === 'ar' ? 'الفعلي' : 'Actual'} 
                    fill="hsl(var(--chart-2))" 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Project List */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>{language === 'ar' ? 'تفاصيل المشاريع' : 'Project Details'}</CardTitle>
        </CardHeader>
        <CardContent>
          {projectFinances && projectFinances.length > 0 ? (
            <div className="space-y-4">
              {projectFinances.map(pf => {
                const project = getProjectDetails(pf.project_id);
                const { variance, variancePercent } = calculateVariance(pf);
                const burnRate = pf.planned_budget_total > 0 
                  ? (pf.actual_spend_total / pf.planned_budget_total) * 100 
                  : 0;
                const evm = pf.evm_enabled ? calculateEVM(pf) : null;

                return (
                  <div key={pf.id} className="p-4 rounded-xl bg-muted/30 border border-border">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                          <Briefcase className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-foreground">{project?.title || 'Project'}</h4>
                          <p className="text-sm text-muted-foreground">{pf.currency}</p>
                        </div>
                      </div>
                      <Badge variant={variance >= 0 ? 'default' : 'destructive'}>
                        {variance >= 0 ? (language === 'ar' ? 'ضمن الميزانية' : 'Under Budget') : (language === 'ar' ? 'تجاوز الميزانية' : 'Over Budget')}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-muted-foreground">{language === 'ar' ? 'المخطط' : 'Planned'}</p>
                        <p className="font-semibold text-foreground">{pf.planned_budget_total.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">{language === 'ar' ? 'الفعلي' : 'Actual'}</p>
                        <p className="font-semibold text-foreground">{pf.actual_spend_total.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">{language === 'ar' ? 'الفرق' : 'Variance'}</p>
                        <p className={cn(
                          "font-semibold flex items-center gap-1",
                          variance >= 0 ? "text-success" : "text-destructive"
                        )}>
                          {variance >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                          {Math.abs(variance).toLocaleString()} ({variancePercent.toFixed(1)}%)
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">{language === 'ar' ? 'المتبقي' : 'Remaining'}</p>
                        <p className="font-semibold text-foreground">
                          {Math.max(0, pf.planned_budget_total - pf.actual_spend_total).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-muted-foreground">{language === 'ar' ? 'معدل الحرق' : 'Burn Rate'}</span>
                        <span className={cn(
                          "font-medium",
                          burnRate > 100 ? "text-destructive" : burnRate > 80 ? "text-warning" : "text-success"
                        )}>
                          {burnRate.toFixed(1)}%
                        </span>
                      </div>
                      <Progress 
                        value={Math.min(burnRate, 100)} 
                        className={cn(
                          "h-2",
                          burnRate > 100 ? "[&>div]:bg-destructive" : burnRate > 80 ? "[&>div]:bg-warning" : ""
                        )}
                      />
                    </div>

                    {evm && (
                      <div className="mt-4 pt-4 border-t border-border grid grid-cols-3 gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground">CPI</p>
                          <p className={cn(
                            "font-semibold",
                            evm.cpi >= 1 ? "text-success" : "text-destructive"
                          )}>
                            {evm.cpi.toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">SPI</p>
                          <p className={cn(
                            "font-semibold",
                            evm.spi >= 1 ? "text-success" : "text-destructive"
                          )}>
                            {evm.spi.toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">EAC</p>
                          <p className="font-semibold text-foreground">{evm.eac.toLocaleString()}</p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <Briefcase className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-muted-foreground">
                {language === 'ar' ? 'لا توجد ميزانيات مشاريع' : 'No project budgets yet'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
