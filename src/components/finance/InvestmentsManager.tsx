import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Plus, TrendingUp, TrendingDown, PieChart, Wallet, 
  ArrowUpRight, ArrowDownRight, BarChart3, Loader2,
  Briefcase, Coins, Bitcoin, Building2, CircleDollarSign
} from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { 
  useInvestmentPortfolios, useCreatePortfolio,
  useInvestmentAssets, useCreateAsset,
  useInvestmentHoldings, useCreateHolding,
  useInvestmentTransactions, useCreateInvestmentTransaction,
  InvestmentAsset, InvestmentHolding
} from '@/hooks/useAdvancedFinance';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { cn } from '@/lib/utils';

const ASSET_COLORS = {
  stock: 'hsl(var(--chart-1))',
  etf: 'hsl(var(--chart-2))',
  fund: 'hsl(var(--chart-3))',
  gold: 'hsl(45, 93%, 47%)',
  crypto: 'hsl(var(--chart-4))',
  bond: 'hsl(var(--chart-5))',
  real_estate: 'hsl(var(--primary))',
};

const ASSET_ICONS = {
  stock: BarChart3,
  etf: PieChart,
  fund: Briefcase,
  gold: Coins,
  crypto: Bitcoin,
  bond: CircleDollarSign,
  real_estate: Building2,
};

export function InvestmentsManager() {
  const { t, currentLanguage } = useLanguage();
  const language = currentLanguage;
  const { data: portfolios, isLoading: portfoliosLoading } = useInvestmentPortfolios();
  const { data: assets } = useInvestmentAssets();
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string | null>(null);
  const { data: holdings } = useInvestmentHoldings(selectedPortfolioId || undefined);
  const { data: transactions } = useInvestmentTransactions(selectedPortfolioId || undefined);
  const createPortfolio = useCreatePortfolio();
  const createAsset = useCreateAsset();
  const createHolding = useCreateHolding();
  const createTransaction = useCreateInvestmentTransaction();

  const [isPortfolioDialogOpen, setIsPortfolioDialogOpen] = useState(false);
  const [isAssetDialogOpen, setIsAssetDialogOpen] = useState(false);
  const [isTransactionDialogOpen, setIsTransactionDialogOpen] = useState(false);

  const [newPortfolio, setNewPortfolio] = useState({
    name: '',
    description: '',
    base_currency: 'SAR',
  });

  const [newAsset, setNewAsset] = useState({
    symbol: '',
    name: '',
    type: 'stock' as InvestmentAsset['type'],
    currency: 'SAR',
    exchange: '',
  });

  const [newTransaction, setNewTransaction] = useState({
    asset_id: '',
    type: 'buy' as 'buy' | 'sell' | 'dividend' | 'deposit' | 'withdrawal',
    quantity: '',
    price: '',
    fees: '0',
    date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  // Set first portfolio as selected
  if (portfolios?.length && !selectedPortfolioId) {
    setSelectedPortfolioId(portfolios[0].id);
  }

  // Calculate portfolio metrics
  const calculatePortfolioMetrics = () => {
    if (!holdings?.length) return { totalValue: 0, totalCost: 0, totalPL: 0, plPercent: 0 };

    let totalValue = 0;
    let totalCost = 0;

    holdings.forEach(h => {
      const currentPrice = h.current_price || h.avg_cost;
      totalValue += h.quantity * currentPrice;
      totalCost += h.quantity * h.avg_cost;
    });

    const totalPL = totalValue - totalCost;
    const plPercent = totalCost > 0 ? (totalPL / totalCost) * 100 : 0;

    return { totalValue, totalCost, totalPL, plPercent };
  };

  // Asset allocation data for pie chart
  const getAllocationData = () => {
    if (!holdings?.length) return [];

    const metrics = calculatePortfolioMetrics();
    const allocationMap: Record<string, number> = {};

    holdings.forEach(h => {
      const type = h.asset?.type || 'stock';
      const value = h.quantity * (h.current_price || h.avg_cost);
      allocationMap[type] = (allocationMap[type] || 0) + value;
    });

    return Object.entries(allocationMap).map(([type, value]) => ({
      name: t(`finance.assetTypes.${type}`) || type,
      value,
      percentage: metrics.totalValue > 0 ? (value / metrics.totalValue) * 100 : 0,
      color: ASSET_COLORS[type as keyof typeof ASSET_COLORS] || 'hsl(var(--muted))',
    }));
  };

  const handleCreatePortfolio = async () => {
    if (!newPortfolio.name) {
      toast.error(t('common.fillAllFields'));
      return;
    }
    try {
      await createPortfolio.mutateAsync(newPortfolio);
      toast.success(t('finance.portfolioCreated'));
      setIsPortfolioDialogOpen(false);
      setNewPortfolio({ name: '', description: '', base_currency: 'SAR' });
    } catch (error) {
      toast.error(t('common.error'));
    }
  };

  const handleCreateAsset = async () => {
    if (!newAsset.symbol || !newAsset.name) {
      toast.error(t('common.fillAllFields'));
      return;
    }
    try {
      await createAsset.mutateAsync(newAsset);
      toast.success(t('finance.assetCreated'));
      setIsAssetDialogOpen(false);
      setNewAsset({ symbol: '', name: '', type: 'stock', currency: 'SAR', exchange: '' });
    } catch (error) {
      toast.error(t('common.error'));
    }
  };

  const handleCreateTransaction = async () => {
    if (!selectedPortfolioId || !newTransaction.asset_id) {
      toast.error(t('common.fillAllFields'));
      return;
    }

    const quantity = parseFloat(newTransaction.quantity) || 0;
    const price = parseFloat(newTransaction.price) || 0;
    const fees = parseFloat(newTransaction.fees) || 0;

    try {
      await createTransaction.mutateAsync({
        portfolio_id: selectedPortfolioId,
        asset_id: newTransaction.asset_id,
        type: newTransaction.type,
        quantity,
        price,
        total_amount: quantity * price + fees,
        fees,
        date: newTransaction.date,
        notes: newTransaction.notes,
        currency: 'SAR',
      });
      toast.success(t('finance.transactionAdded'));
      setIsTransactionDialogOpen(false);
      setNewTransaction({
        asset_id: '',
        type: 'buy',
        quantity: '',
        price: '',
        fees: '0',
        date: new Date().toISOString().split('T')[0],
        notes: '',
      });
    } catch (error) {
      toast.error(t('common.error'));
    }
  };

  const metrics = calculatePortfolioMetrics();
  const allocationData = getAllocationData();

  if (portfoliosLoading) {
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
            {language === 'ar' ? 'الاستثمارات' : 'Investments'}
          </h2>
          <p className="text-muted-foreground">
            {language === 'ar' ? 'تتبع محفظتك الاستثمارية' : 'Track your investment portfolio'}
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isPortfolioDialogOpen} onOpenChange={setIsPortfolioDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="w-4 h-4 me-2" />
                {language === 'ar' ? 'محفظة جديدة' : 'New Portfolio'}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{language === 'ar' ? 'إنشاء محفظة' : 'Create Portfolio'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <Input
                  placeholder={language === 'ar' ? 'اسم المحفظة' : 'Portfolio name'}
                  value={newPortfolio.name}
                  onChange={(e) => setNewPortfolio({ ...newPortfolio, name: e.target.value })}
                />
                <Input
                  placeholder={language === 'ar' ? 'الوصف' : 'Description'}
                  value={newPortfolio.description}
                  onChange={(e) => setNewPortfolio({ ...newPortfolio, description: e.target.value })}
                />
                <Select 
                  value={newPortfolio.base_currency} 
                  onValueChange={(v) => setNewPortfolio({ ...newPortfolio, base_currency: v })}
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
                <Button onClick={handleCreatePortfolio} className="w-full" disabled={createPortfolio.isPending}>
                  {createPortfolio.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : t('common.create')}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isAssetDialogOpen} onOpenChange={setIsAssetDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="w-4 h-4 me-2" />
                {language === 'ar' ? 'أصل جديد' : 'New Asset'}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{language === 'ar' ? 'إضافة أصل' : 'Add Asset'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <Input
                  placeholder={language === 'ar' ? 'الرمز' : 'Symbol'}
                  value={newAsset.symbol}
                  onChange={(e) => setNewAsset({ ...newAsset, symbol: e.target.value.toUpperCase() })}
                />
                <Input
                  placeholder={language === 'ar' ? 'اسم الأصل' : 'Asset name'}
                  value={newAsset.name}
                  onChange={(e) => setNewAsset({ ...newAsset, name: e.target.value })}
                />
                <Select 
                  value={newAsset.type} 
                  onValueChange={(v: InvestmentAsset['type']) => setNewAsset({ ...newAsset, type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="stock">{language === 'ar' ? 'سهم' : 'Stock'}</SelectItem>
                    <SelectItem value="etf">{language === 'ar' ? 'صندوق متداول' : 'ETF'}</SelectItem>
                    <SelectItem value="fund">{language === 'ar' ? 'صندوق استثماري' : 'Fund'}</SelectItem>
                    <SelectItem value="gold">{language === 'ar' ? 'ذهب' : 'Gold'}</SelectItem>
                    <SelectItem value="crypto">{language === 'ar' ? 'عملة رقمية' : 'Crypto'}</SelectItem>
                    <SelectItem value="bond">{language === 'ar' ? 'سند' : 'Bond'}</SelectItem>
                    <SelectItem value="real_estate">{language === 'ar' ? 'عقار' : 'Real Estate'}</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  placeholder={language === 'ar' ? 'السوق' : 'Exchange'}
                  value={newAsset.exchange}
                  onChange={(e) => setNewAsset({ ...newAsset, exchange: e.target.value })}
                />
                <Button onClick={handleCreateAsset} className="w-full" disabled={createAsset.isPending}>
                  {createAsset.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : t('common.add')}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isTransactionDialogOpen} onOpenChange={setIsTransactionDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="gold">
                <Plus className="w-4 h-4 me-2" />
                {language === 'ar' ? 'عملية جديدة' : 'New Transaction'}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{language === 'ar' ? 'تسجيل عملية' : 'Record Transaction'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <Select 
                  value={newTransaction.asset_id} 
                  onValueChange={(v) => setNewTransaction({ ...newTransaction, asset_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={language === 'ar' ? 'اختر الأصل' : 'Select asset'} />
                  </SelectTrigger>
                  <SelectContent>
                    {assets?.map(a => (
                      <SelectItem key={a.id} value={a.id}>{a.symbol} - {a.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select 
                  value={newTransaction.type} 
                  onValueChange={(v: typeof newTransaction.type) => setNewTransaction({ ...newTransaction, type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="buy">{language === 'ar' ? 'شراء' : 'Buy'}</SelectItem>
                    <SelectItem value="sell">{language === 'ar' ? 'بيع' : 'Sell'}</SelectItem>
                    <SelectItem value="dividend">{language === 'ar' ? 'أرباح' : 'Dividend'}</SelectItem>
                    <SelectItem value="deposit">{language === 'ar' ? 'إيداع' : 'Deposit'}</SelectItem>
                    <SelectItem value="withdrawal">{language === 'ar' ? 'سحب' : 'Withdrawal'}</SelectItem>
                  </SelectContent>
                </Select>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    type="number"
                    placeholder={language === 'ar' ? 'الكمية' : 'Quantity'}
                    value={newTransaction.quantity}
                    onChange={(e) => setNewTransaction({ ...newTransaction, quantity: e.target.value })}
                  />
                  <Input
                    type="number"
                    placeholder={language === 'ar' ? 'السعر' : 'Price'}
                    value={newTransaction.price}
                    onChange={(e) => setNewTransaction({ ...newTransaction, price: e.target.value })}
                  />
                </div>
                <Input
                  type="number"
                  placeholder={language === 'ar' ? 'الرسوم' : 'Fees'}
                  value={newTransaction.fees}
                  onChange={(e) => setNewTransaction({ ...newTransaction, fees: e.target.value })}
                />
                <Input
                  type="date"
                  value={newTransaction.date}
                  onChange={(e) => setNewTransaction({ ...newTransaction, date: e.target.value })}
                />
                <Input
                  placeholder={language === 'ar' ? 'ملاحظات' : 'Notes'}
                  value={newTransaction.notes}
                  onChange={(e) => setNewTransaction({ ...newTransaction, notes: e.target.value })}
                />
                <Button onClick={handleCreateTransaction} className="w-full" disabled={createTransaction.isPending}>
                  {createTransaction.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : t('common.add')}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Portfolio Selector */}
      {portfolios && portfolios.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {portfolios.map(p => (
            <Button
              key={p.id}
              variant={selectedPortfolioId === p.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedPortfolioId(p.id)}
            >
              <Wallet className="w-4 h-4 me-2" />
              {p.name}
            </Button>
          ))}
        </div>
      )}

      {/* Portfolio Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {language === 'ar' ? 'إجمالي القيمة' : 'Total Value'}
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {metrics.totalValue.toLocaleString()} SAR
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Wallet className="w-5 h-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {language === 'ar' ? 'التكلفة' : 'Total Cost'}
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {metrics.totalCost.toLocaleString()} SAR
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center">
                <CircleDollarSign className="w-5 h-5 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {language === 'ar' ? 'الربح/الخسارة' : 'P/L'}
                </p>
                <p className={cn(
                  "text-2xl font-bold",
                  metrics.totalPL >= 0 ? "text-success" : "text-destructive"
                )}>
                  {metrics.totalPL >= 0 ? '+' : ''}{metrics.totalPL.toLocaleString()} SAR
                </p>
              </div>
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center",
                metrics.totalPL >= 0 ? "bg-success/10" : "bg-destructive/10"
              )}>
                {metrics.totalPL >= 0 ? (
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
                  {language === 'ar' ? 'نسبة العائد' : 'Return %'}
                </p>
                <p className={cn(
                  "text-2xl font-bold",
                  metrics.plPercent >= 0 ? "text-success" : "text-destructive"
                )}>
                  {metrics.plPercent >= 0 ? '+' : ''}{metrics.plPercent.toFixed(2)}%
                </p>
              </div>
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center",
                metrics.plPercent >= 0 ? "bg-success/10" : "bg-destructive/10"
              )}>
                {metrics.plPercent >= 0 ? (
                  <ArrowUpRight className="w-5 h-5 text-success" />
                ) : (
                  <ArrowDownRight className="w-5 h-5 text-destructive" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="holdings" className="space-y-4">
        <TabsList>
          <TabsTrigger value="holdings">
            {language === 'ar' ? 'الحيازات' : 'Holdings'}
          </TabsTrigger>
          <TabsTrigger value="allocation">
            {language === 'ar' ? 'توزيع الأصول' : 'Allocation'}
          </TabsTrigger>
          <TabsTrigger value="transactions">
            {language === 'ar' ? 'العمليات' : 'Transactions'}
          </TabsTrigger>
        </TabsList>

        {/* Holdings Tab */}
        <TabsContent value="holdings">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>{language === 'ar' ? 'الحيازات' : 'Holdings'}</CardTitle>
            </CardHeader>
            <CardContent>
              {holdings && holdings.length > 0 ? (
                <div className="space-y-3">
                  {holdings.map(h => {
                    const currentPrice = h.current_price || h.avg_cost;
                    const value = h.quantity * currentPrice;
                    const cost = h.quantity * h.avg_cost;
                    const pl = value - cost;
                    const plPercent = cost > 0 ? (pl / cost) * 100 : 0;
                    const AssetIcon = ASSET_ICONS[h.asset?.type || 'stock'];

                    return (
                      <div key={h.id} className="p-4 rounded-xl bg-muted/30 border border-border">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                              <AssetIcon className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-foreground">{h.asset?.symbol}</span>
                                <Badge variant="outline" className="text-xs">
                                  {h.asset?.type}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">{h.asset?.name}</p>
                            </div>
                          </div>
                          <div className="text-end">
                            <p className="font-semibold text-foreground">{value.toLocaleString()} SAR</p>
                            <p className={cn(
                              "text-sm flex items-center gap-1 justify-end",
                              pl >= 0 ? "text-success" : "text-destructive"
                            )}>
                              {pl >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                              {pl >= 0 ? '+' : ''}{pl.toLocaleString()} ({plPercent.toFixed(2)}%)
                            </p>
                          </div>
                        </div>
                        <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">{language === 'ar' ? 'الكمية' : 'Quantity'}</p>
                            <p className="font-medium text-foreground">{h.quantity}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">{language === 'ar' ? 'متوسط التكلفة' : 'Avg Cost'}</p>
                            <p className="font-medium text-foreground">{h.avg_cost.toFixed(2)} SAR</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">{language === 'ar' ? 'السعر الحالي' : 'Current Price'}</p>
                            <p className="font-medium text-foreground">{currentPrice.toFixed(2)} SAR</p>
                          </div>
                        </div>
                        {h.target_allocation && (
                          <div className="mt-3">
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-muted-foreground">{language === 'ar' ? 'التخصيص المستهدف' : 'Target Allocation'}</span>
                              <span className="font-medium">{h.target_allocation}%</span>
                            </div>
                            <Progress value={(value / metrics.totalValue) * 100} className="h-2" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Wallet className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                  <p className="text-muted-foreground">
                    {language === 'ar' ? 'لا توجد حيازات' : 'No holdings yet'}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {language === 'ar' ? 'أضف عملية شراء لبدء تتبع استثماراتك' : 'Add a buy transaction to start tracking'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Allocation Tab */}
        <TabsContent value="allocation">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>{language === 'ar' ? 'توزيع الأصول' : 'Asset Allocation'}</CardTitle>
              </CardHeader>
              <CardContent>
                {allocationData.length > 0 ? (
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPie>
                        <Pie
                          data={allocationData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {allocationData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value: number) => `${value.toLocaleString()} SAR`}
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                          }}
                        />
                        <Legend />
                      </RechartsPie>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <PieChart className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                    <p className="text-muted-foreground">
                      {language === 'ar' ? 'لا توجد بيانات' : 'No data available'}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader>
                <CardTitle>{language === 'ar' ? 'تفاصيل التوزيع' : 'Allocation Details'}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {allocationData.map((item, index) => (
                    <div key={index}>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium text-foreground">{item.name}</span>
                        <span className="text-sm text-muted-foreground">
                          {item.percentage.toFixed(1)}% ({item.value.toLocaleString()} SAR)
                        </span>
                      </div>
                      <Progress 
                        value={item.percentage} 
                        className="h-2"
                        style={{ '--progress-color': item.color } as React.CSSProperties}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Disclaimer */}
          <Card className="glass-card mt-6 border-warning/50">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">
                {language === 'ar' 
                  ? '⚠️ تنويه: هذا النظام للتتبع والتحليل فقط وليس توصية استثمارية. استشر مستشاراً مالياً مرخصاً قبل اتخاذ قرارات استثمارية.'
                  : '⚠️ Disclaimer: This system is for tracking and analysis only, not investment advice. Consult a licensed financial advisor before making investment decisions.'
                }
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Transactions Tab */}
        <TabsContent value="transactions">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>{language === 'ar' ? 'العمليات' : 'Transactions'}</CardTitle>
            </CardHeader>
            <CardContent>
              {transactions && transactions.length > 0 ? (
                <div className="space-y-3">
                  {transactions.map(tx => {
                    const isBuy = tx.type === 'buy' || tx.type === 'deposit';
                    return (
                      <div key={tx.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/30 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center",
                            isBuy ? "bg-success/10" : "bg-destructive/10"
                          )}>
                            {isBuy ? (
                              <ArrowUpRight className="w-5 h-5 text-success" />
                            ) : (
                              <ArrowDownRight className="w-5 h-5 text-destructive" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-foreground">
                                {tx.asset?.symbol || (language === 'ar' ? 'نقد' : 'Cash')}
                              </span>
                              <Badge variant="outline" className="text-xs capitalize">
                                {tx.type}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {tx.quantity && tx.price && `${tx.quantity} × ${tx.price.toFixed(2)}`}
                              {' • '}
                              {format(new Date(tx.date), 'MMM d, yyyy')}
                            </p>
                          </div>
                        </div>
                        <div className="text-end">
                          <p className={cn(
                            "font-semibold",
                            isBuy ? "text-success" : "text-destructive"
                          )}>
                            {isBuy ? '+' : '-'}{tx.total_amount.toLocaleString()} {tx.currency}
                          </p>
                          {tx.fees > 0 && (
                            <p className="text-xs text-muted-foreground">
                              {language === 'ar' ? 'رسوم' : 'Fees'}: {tx.fees.toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                  <p className="text-muted-foreground">
                    {language === 'ar' ? 'لا توجد عمليات' : 'No transactions yet'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
