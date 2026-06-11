import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Plus, TrendingUp, TrendingDown, PieChart, Wallet, 
  ArrowUpRight, ArrowDownRight, BarChart3, Loader2,
  Briefcase, Coins, Bitcoin, Building2, CircleDollarSign,
  AlertTriangle, Target, Bell, Percent, Calculator,
  RefreshCw, Eye, DollarSign
} from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { 
  useInvestmentPortfolios, useCreatePortfolio,
  useInvestmentAssets, useCreateAsset,
  useInvestmentHoldings, useCreateHolding, useUpdateHolding,
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

const ZAKAT_RATE = 0.025; // 2.5%

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
  const updateHolding = useUpdateHolding();
  const createTransaction = useCreateInvestmentTransaction();

  const [activeTab, setActiveTab] = useState('holdings');
  const [isPortfolioDialogOpen, setIsPortfolioDialogOpen] = useState(false);
  const [isAssetDialogOpen, setIsAssetDialogOpen] = useState(false);
  const [isTransactionDialogOpen, setIsTransactionDialogOpen] = useState(false);
  const [isHoldingDialogOpen, setIsHoldingDialogOpen] = useState(false);

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

  const [newHolding, setNewHolding] = useState({
    asset_id: '',
    quantity: '',
    avg_cost: '',
    current_price: '',
    target_allocation: '',
    is_zakatable: true,
    entry_target_price: '',
    stop_loss_price: '',
    take_profit_price: '',
    investment_journal: '',
  });

  // Set first portfolio as selected
  if (portfolios?.length && !selectedPortfolioId) {
    setSelectedPortfolioId(portfolios[0].id);
  }

  // Calculate portfolio metrics
  const calculatePortfolioMetrics = () => {
    if (!holdings?.length) return { totalValue: 0, totalCost: 0, totalPL: 0, plPercent: 0, zakatAmount: 0 };

    let totalValue = 0;
    let totalCost = 0;
    let zakatableValue = 0;

    holdings.forEach(h => {
      const currentPrice = h.current_price || h.avg_cost;
      const value = h.quantity * currentPrice;
      totalValue += value;
      totalCost += h.quantity * h.avg_cost;
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((h as any).is_zakatable) {
        zakatableValue += value;
      }
    });

    const totalPL = totalValue - totalCost;
    const plPercent = totalCost > 0 ? (totalPL / totalCost) * 100 : 0;
    const zakatAmount = zakatableValue * ZAKAT_RATE;

    return { totalValue, totalCost, totalPL, plPercent, zakatAmount };
  };

  // Get allocation data with rebalancing info
  const getAllocationData = () => {
    if (!holdings?.length) return [];

    const metrics = calculatePortfolioMetrics();
    const allocationMap: Record<string, { value: number; target: number }> = {};

    holdings.forEach(h => {
      const type = h.asset?.type || 'stock';
      const value = h.quantity * (h.current_price || h.avg_cost);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const target = (h as any).target_allocation_percent || 0;
      
      if (!allocationMap[type]) {
        allocationMap[type] = { value: 0, target: 0 };
      }
      allocationMap[type].value += value;
      allocationMap[type].target = Math.max(allocationMap[type].target, target);
    });

    return Object.entries(allocationMap).map(([type, data]) => {
      const currentPercent = metrics.totalValue > 0 ? (data.value / metrics.totalValue) * 100 : 0;
      const deviation = currentPercent - data.target;
      let rebalanceStatus: 'balanced' | 'buy' | 'sell' = 'balanced';
      
      if (deviation > 5) rebalanceStatus = 'sell';
      else if (deviation < -5) rebalanceStatus = 'buy';

      return {
        name: t(`finance.assetTypes.${type}`) || type,
        type,
        value: data.value,
        currentPercent,
        targetPercent: data.target,
        deviation,
        rebalanceStatus,
        color: ASSET_COLORS[type as keyof typeof ASSET_COLORS] || 'hsl(var(--muted))',
      };
    });
  };

  // Get price alerts
  const getPriceAlerts = () => {
    if (!holdings?.length) return [];
    
    return holdings.filter(h => {
      const currentPrice = h.current_price || h.avg_cost;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const entryTarget = (h as any).entry_target_price;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const stopLoss = (h as any).stop_loss_price;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const takeProfit = (h as any).take_profit_price;

      if (entryTarget && currentPrice <= entryTarget) return true;
      if (stopLoss && currentPrice <= stopLoss) return true;
      if (takeProfit && currentPrice >= takeProfit) return true;
      
      return false;
    }).map(h => {
      const currentPrice = h.current_price || h.avg_cost;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const entryTarget = (h as any).entry_target_price;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const stopLoss = (h as any).stop_loss_price;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const takeProfit = (h as any).take_profit_price;

      let alertType: 'opportunity' | 'stop_loss' | 'take_profit' = 'opportunity';
      if (stopLoss && currentPrice <= stopLoss) alertType = 'stop_loss';
      else if (takeProfit && currentPrice >= takeProfit) alertType = 'take_profit';
      
      return { holding: h, alertType };
    });
  };

  // Get rebalancing suggestions
  const getRebalancingSuggestions = () => {
    const allocationData = getAllocationData();
    return allocationData.filter(a => a.rebalanceStatus !== 'balanced');
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

  const handleCreateHolding = async () => {
    if (!selectedPortfolioId || !newHolding.asset_id) {
      toast.error(t('common.fillAllFields'));
      return;
    }

    try {
      await createHolding.mutateAsync({
        portfolio_id: selectedPortfolioId,
        asset_id: newHolding.asset_id,
        quantity: parseFloat(newHolding.quantity) || 0,
        avg_cost: parseFloat(newHolding.avg_cost) || 0,
        current_price: parseFloat(newHolding.current_price) || null,
        target_allocation: parseFloat(newHolding.target_allocation) || null,
      });
      toast.success(language === 'ar' ? 'تمت إضافة الحيازة' : 'Holding added');
      setIsHoldingDialogOpen(false);
      setNewHolding({
        asset_id: '',
        quantity: '',
        avg_cost: '',
        current_price: '',
        target_allocation: '',
        is_zakatable: true,
        entry_target_price: '',
        stop_loss_price: '',
        take_profit_price: '',
        investment_journal: '',
      });
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
  const priceAlerts = getPriceAlerts();
  const rebalancingSuggestions = getRebalancingSuggestions();

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
            {language === 'ar' ? 'إدارة محفظتك الاستثمارية باحترافية' : 'Manage your investment portfolio professionally'}
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isPortfolioDialogOpen} onOpenChange={setIsPortfolioDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="w-4 h-4 me-2" />
                {language === 'ar' ? 'محفظة' : 'Portfolio'}
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
                  onChange={(e) => { const v = e.target.value; setNewPortfolio(prev => ({ ...prev, name: v })); }}
                />
                <Input
                  placeholder={language === 'ar' ? 'الوصف' : 'Description'}
                  value={newPortfolio.description}
                  onChange={(e) => { const v = e.target.value; setNewPortfolio(prev => ({ ...prev, description: v })); }}
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
              <Button variant="outline" size="sm">
                <Plus className="w-4 h-4 me-2" />
                {language === 'ar' ? 'أصل' : 'Asset'}
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
                  onChange={(e) => { const v = e.target.value; setNewAsset(prev => ({ ...prev, name: v })); }}
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
                  onChange={(e) => { const v = e.target.value; setNewAsset(prev => ({ ...prev, exchange: v })); }}
                />
                <Button onClick={handleCreateAsset} className="w-full" disabled={createAsset.isPending}>
                  {createAsset.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : t('common.add')}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isHoldingDialogOpen} onOpenChange={setIsHoldingDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="w-4 h-4 me-2" />
                {language === 'ar' ? 'حيازة' : 'Holding'}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{language === 'ar' ? 'إضافة حيازة' : 'Add Holding'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <Select 
                  value={newHolding.asset_id} 
                  onValueChange={(v) => setNewHolding({ ...newHolding, asset_id: v })}
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
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>{language === 'ar' ? 'الكمية' : 'Quantity'}</Label>
                    <Input
                      type="number"
                      value={newHolding.quantity}
                      onChange={(e) => { const v = e.target.value; setNewHolding(prev => ({ ...prev, quantity: v })); }}
                    />
                  </div>
                  <div>
                    <Label>{language === 'ar' ? 'متوسط التكلفة' : 'Avg Cost'}</Label>
                    <Input
                      type="number"
                      value={newHolding.avg_cost}
                      onChange={(e) => { const v = e.target.value; setNewHolding(prev => ({ ...prev, avg_cost: v })); }}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>{language === 'ar' ? 'السعر الحالي' : 'Current Price'}</Label>
                    <Input
                      type="number"
                      value={newHolding.current_price}
                      onChange={(e) => { const v = e.target.value; setNewHolding(prev => ({ ...prev, current_price: v })); }}
                    />
                  </div>
                  <div>
                    <Label>{language === 'ar' ? 'التخصيص المستهدف %' : 'Target Allocation %'}</Label>
                    <Input
                      type="number"
                      value={newHolding.target_allocation}
                      onChange={(e) => { const v = e.target.value; setNewHolding(prev => ({ ...prev, target_allocation: v })); }}
                    />
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-muted/50 space-y-3">
                  <h4 className="font-medium text-sm">{language === 'ar' ? 'تنبيهات السعر' : 'Price Alerts'}</h4>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <Label className="text-xs">{language === 'ar' ? 'سعر الدخول' : 'Entry Target'}</Label>
                      <Input
                        type="number"
                        value={newHolding.entry_target_price}
                        onChange={(e) => { const v = e.target.value; setNewHolding(prev => ({ ...prev, entry_target_price: v })); }}
                        className="h-8"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">{language === 'ar' ? 'وقف الخسارة' : 'Stop Loss'}</Label>
                      <Input
                        type="number"
                        value={newHolding.stop_loss_price}
                        onChange={(e) => { const v = e.target.value; setNewHolding(prev => ({ ...prev, stop_loss_price: v })); }}
                        className="h-8"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">{language === 'ar' ? 'جني الأرباح' : 'Take Profit'}</Label>
                      <Input
                        type="number"
                        value={newHolding.take_profit_price}
                        onChange={(e) => { const v = e.target.value; setNewHolding(prev => ({ ...prev, take_profit_price: v })); }}
                        className="h-8"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2">
                    <Calculator className="w-4 h-4 text-primary" />
                    <Label>{language === 'ar' ? 'خاضع للزكاة' : 'Zakatable'}</Label>
                  </div>
                  <Switch
                    checked={newHolding.is_zakatable}
                    onCheckedChange={(c) => setNewHolding({ ...newHolding, is_zakatable: c })}
                  />
                </div>

                <div>
                  <Label>{language === 'ar' ? 'يوميات المستثمر' : 'Investment Journal'}</Label>
                  <Textarea
                    placeholder={language === 'ar' ? 'لماذا هذا الاستثمار؟ ما هي استراتيجية الخروج؟' : 'Why this investment? Exit strategy?'}
                    value={newHolding.investment_journal}
                    onChange={(e) => { const v = e.target.value; setNewHolding(prev => ({ ...prev, investment_journal: v })); }}
                    rows={3}
                  />
                </div>

                <Button onClick={handleCreateHolding} className="w-full" disabled={createHolding.isPending}>
                  {createHolding.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : t('common.add')}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isTransactionDialogOpen} onOpenChange={setIsTransactionDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="gold">
                <DollarSign className="w-4 h-4 me-2" />
                {language === 'ar' ? 'عملية' : 'Transaction'}
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
                    onChange={(e) => { const v = e.target.value; setNewTransaction(prev => ({ ...prev, quantity: v })); }}
                  />
                  <Input
                    type="number"
                    placeholder={language === 'ar' ? 'السعر' : 'Price'}
                    value={newTransaction.price}
                    onChange={(e) => { const v = e.target.value; setNewTransaction(prev => ({ ...prev, price: v })); }}
                  />
                </div>
                <Input
                  type="number"
                  placeholder={language === 'ar' ? 'الرسوم' : 'Fees'}
                  value={newTransaction.fees}
                  onChange={(e) => { const v = e.target.value; setNewTransaction(prev => ({ ...prev, fees: v })); }}
                />
                <Input
                  type="date"
                  value={newTransaction.date}
                  onChange={(e) => { const v = e.target.value; setNewTransaction(prev => ({ ...prev, date: v })); }}
                />
                <Input
                  placeholder={language === 'ar' ? 'ملاحظات' : 'Notes'}
                  value={newTransaction.notes}
                  onChange={(e) => { const v = e.target.value; setNewTransaction(prev => ({ ...prev, notes: v })); }}
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

      {/* Smart Alerts Bar */}
      {(priceAlerts.length > 0 || rebalancingSuggestions.length > 0) && (
        <div className="glass-card p-4 border-l-4 border-l-primary">
          <div className="flex items-center gap-2 mb-3">
            <Bell className="w-5 h-5 text-primary animate-pulse" />
            <h3 className="font-semibold">{language === 'ar' ? 'تنبيهات ذكية' : 'Smart Alerts'}</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {priceAlerts.map((alert, i) => (
              <Badge 
                key={i} 
                variant={alert.alertType === 'stop_loss' ? 'destructive' : alert.alertType === 'take_profit' ? 'default' : 'secondary'}
                className="gap-1"
              >
                {alert.alertType === 'opportunity' && '🔥'}
                {alert.alertType === 'stop_loss' && '🛑'}
                {alert.alertType === 'take_profit' && '🎯'}
                {alert.holding.asset?.symbol}
              </Badge>
            ))}
            {rebalancingSuggestions.map((item, i) => (
              <Badge key={i} variant="outline" className="gap-1">
                {item.rebalanceStatus === 'buy' ? '🟢 شراء' : '🔻 بيع'} {item.name}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* KPIs Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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
                  {language === 'ar' ? 'التكلفة الإجمالية' : 'Total Cost'}
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {metrics.totalCost.toLocaleString()} SAR
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {language === 'ar' ? 'الربح/الخسارة الصافي' : 'Net P/L'}
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
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Percent className="w-5 h-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-l-4 border-l-green-600">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {language === 'ar' ? 'الزكاة المستحقة' : 'Zakat Due'}
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {metrics.zakatAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })} SAR
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-green-600/10 flex items-center justify-center">
                <Calculator className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4" dir={language === 'ar' ? 'rtl' as const : 'ltr' as const}>
          <TabsTrigger value="holdings">{language === 'ar' ? 'الحيازات' : 'Holdings'}</TabsTrigger>
          <TabsTrigger value="allocation">{language === 'ar' ? 'التوزيع' : 'Allocation'}</TabsTrigger>
          <TabsTrigger value="rebalance">{language === 'ar' ? 'إعادة التوازن' : 'Rebalance'}</TabsTrigger>
          <TabsTrigger value="transactions">{language === 'ar' ? 'العمليات' : 'Transactions'}</TabsTrigger>
        </TabsList>

        {/* Holdings Tab */}
        <TabsContent value="holdings" className="space-y-4 mt-6">
          {holdings?.map(h => {
            const currentPrice = h.current_price || h.avg_cost;
            const value = h.quantity * currentPrice;
            const cost = h.quantity * h.avg_cost;
            const pl = value - cost;
            const plPercent = cost > 0 ? (pl / cost) * 100 : 0;
            const Icon = ASSET_ICONS[h.asset?.type as keyof typeof ASSET_ICONS] || BarChart3;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const targetAlloc = (h as any).target_allocation_percent || 0;
            const currentAlloc = metrics.totalValue > 0 ? (value / metrics.totalValue) * 100 : 0;

            return (
              <div key={h.id} className="glass-card p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: `${ASSET_COLORS[h.asset?.type as keyof typeof ASSET_COLORS] || 'hsl(var(--muted))'}20` }}
                    >
                      <Icon 
                        className="w-5 h-5"
                        style={{ color: ASSET_COLORS[h.asset?.type as keyof typeof ASSET_COLORS] || 'hsl(var(--muted))' }}
                      />
                    </div>
                    <div>
                      <h4 className="font-semibold">{h.asset?.symbol}</h4>
                      <p className="text-sm text-muted-foreground">{h.asset?.name}</p>
                    </div>
                  </div>
                  <div className="text-end">
                    <p className="font-bold">{value.toLocaleString()} SAR</p>
                    <p className={cn("text-sm", pl >= 0 ? "text-success" : "text-destructive")}>
                      {pl >= 0 ? '+' : ''}{pl.toLocaleString()} ({plPercent.toFixed(1)}%)
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-4 gap-4 mt-4 pt-4 border-t border-border/50 text-sm">
                  <div>
                    <p className="text-muted-foreground">{language === 'ar' ? 'الكمية' : 'Qty'}</p>
                    <p className="font-medium">{h.quantity}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">{language === 'ar' ? 'متوسط التكلفة' : 'Avg Cost'}</p>
                    <p className="font-medium">{h.avg_cost.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">{language === 'ar' ? 'السعر الحالي' : 'Current'}</p>
                    <p className="font-medium">{currentPrice.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">{language === 'ar' ? 'التخصيص' : 'Allocation'}</p>
                    <p className="font-medium">
                      {currentAlloc.toFixed(1)}%
                      {targetAlloc > 0 && (
                        <span className="text-muted-foreground"> / {targetAlloc}%</span>
                      )}
                    </p>
                  </div>
                </div>

                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {(h as any).investment_journal && (
                  <div className="mt-3 p-2 rounded-lg bg-muted/30 text-sm">
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    <p className="text-muted-foreground line-clamp-2">{(h as any).investment_journal}</p>
                  </div>
                )}
              </div>
            );
          })}

          {(!holdings || holdings.length === 0) && (
            <div className="text-center py-12">
              <Wallet className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-muted-foreground">{language === 'ar' ? 'لا توجد حيازات' : 'No holdings yet'}</p>
            </div>
          )}
        </TabsContent>

        {/* Allocation Tab */}
        <TabsContent value="allocation" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-primary" />
                  {language === 'ar' ? 'التوزيع الحالي' : 'Current Allocation'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {allocationData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
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
                      />
                      <Legend />
                    </RechartsPie>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    {language === 'ar' ? 'لا توجد بيانات' : 'No data'}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-lg">{language === 'ar' ? 'تفاصيل التوزيع' : 'Allocation Details'}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {allocationData.map((item, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                        <span>{item.name}</span>
                      </div>
                      <span className="font-medium">{item.currentPercent.toFixed(1)}%</span>
                    </div>
                    <Progress value={item.currentPercent} className="h-2" />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{item.value.toLocaleString()} SAR</span>
                      {item.targetPercent > 0 && (
                        <span>{language === 'ar' ? 'الهدف:' : 'Target:'} {item.targetPercent}%</span>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
          
          <div className="mt-4 p-4 rounded-lg bg-muted/30 text-sm text-muted-foreground">
            <AlertTriangle className="w-4 h-4 inline me-2" />
            {language === 'ar' 
              ? 'هذا النظام للتتبع والتحليل فقط وليس نصيحة استثمارية.'
              : 'This system is for tracking and analysis only, not investment advice.'}
          </div>
        </TabsContent>

        {/* Rebalance Tab */}
        <TabsContent value="rebalance" className="mt-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-primary" />
                {language === 'ar' ? 'اقتراحات إعادة التوازن' : 'Rebalancing Suggestions'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {allocationData.map((item, i) => {
                const status = item.rebalanceStatus;
                
                return (
                  <div key={i} className={cn(
                    "p-4 rounded-lg border",
                    status === 'balanced' && "bg-muted/30 border-border/50",
                    status === 'buy' && "bg-success/5 border-success/30",
                    status === 'sell' && "bg-destructive/5 border-destructive/30"
                  )}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="font-medium">{item.name}</span>
                      </div>
                      <Badge variant={status === 'balanced' ? 'secondary' : status === 'buy' ? 'default' : 'destructive'}>
                        {status === 'balanced' && '⚖️ متوازن'}
                        {status === 'buy' && '🟢 شراء'}
                        {status === 'sell' && '🔻 بيع'}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">{language === 'ar' ? 'الحالي' : 'Current'}</p>
                        <p className="font-medium">{item.currentPercent.toFixed(1)}%</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">{language === 'ar' ? 'المستهدف' : 'Target'}</p>
                        <p className="font-medium">{item.targetPercent || 0}%</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">{language === 'ar' ? 'الانحراف' : 'Deviation'}</p>
                        <p className={cn(
                          "font-medium",
                          item.deviation > 0 ? "text-destructive" : item.deviation < 0 ? "text-success" : ""
                        )}>
                          {item.deviation > 0 ? '+' : ''}{item.deviation.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}

              {allocationData.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  {language === 'ar' ? 'أضف حيازات لرؤية اقتراحات التوازن' : 'Add holdings to see rebalancing suggestions'}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Transactions Tab */}
        <TabsContent value="transactions" className="space-y-4 mt-6">
          {transactions?.map(tx => {
            const asset = assets?.find(a => a.id === tx.asset_id);
            
            return (
              <div key={tx.id} className="glass-card p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center",
                      tx.type === 'buy' || tx.type === 'deposit' ? "bg-success/10" : "bg-destructive/10"
                    )}>
                      {tx.type === 'buy' || tx.type === 'deposit' ? (
                        <ArrowUpRight className="w-5 h-5 text-success" />
                      ) : (
                        <ArrowDownRight className="w-5 h-5 text-destructive" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-semibold">{asset?.symbol || '-'}</h4>
                      <p className="text-sm text-muted-foreground capitalize">{tx.type}</p>
                    </div>
                  </div>
                  <div className="text-end">
                    <p className={cn(
                      "font-bold",
                      tx.type === 'buy' || tx.type === 'deposit' ? "text-success" : "text-destructive"
                    )}>
                      {tx.type === 'buy' || tx.type === 'deposit' ? '+' : '-'}{tx.total_amount.toLocaleString()} SAR
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(tx.date), 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>
                {tx.quantity && tx.price && (
                  <div className="mt-2 pt-2 border-t border-border/50 text-sm text-muted-foreground">
                    {tx.quantity} × {tx.price.toLocaleString()} SAR
                    {tx.fees && tx.fees > 0 && ` + ${tx.fees} ${language === 'ar' ? 'رسوم' : 'fees'}`}
                  </div>
                )}
              </div>
            );
          })}

          {(!transactions || transactions.length === 0) && (
            <div className="text-center py-12">
              <DollarSign className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-muted-foreground">{language === 'ar' ? 'لا توجد عمليات' : 'No transactions yet'}</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}