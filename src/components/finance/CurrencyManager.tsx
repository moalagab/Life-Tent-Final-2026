import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  RefreshCw, Plus, ArrowRightLeft, Loader2, TrendingUp, TrendingDown,
  Globe, DollarSign
} from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface FxRate {
  id: string;
  from_currency: string;
  to_currency: string;
  rate: number;
  date: string;
  source: string;
}

const CURRENCIES = [
  { code: 'SAR', name: 'Saudi Riyal', symbol: 'ر.س', nameAr: 'ريال سعودي' },
  { code: 'USD', name: 'US Dollar', symbol: '$', nameAr: 'دولار أمريكي' },
  { code: 'EUR', name: 'Euro', symbol: '€', nameAr: 'يورو' },
  { code: 'GBP', name: 'British Pound', symbol: '£', nameAr: 'جنيه إسترليني' },
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', nameAr: 'درهم إماراتي' },
  { code: 'KWD', name: 'Kuwaiti Dinar', symbol: 'د.ك', nameAr: 'دينار كويتي' },
  { code: 'QAR', name: 'Qatari Riyal', symbol: 'ر.ق', nameAr: 'ريال قطري' },
  { code: 'BHD', name: 'Bahraini Dinar', symbol: 'د.ب', nameAr: 'دينار بحريني' },
  { code: 'OMR', name: 'Omani Rial', symbol: 'ر.ع', nameAr: 'ريال عماني' },
  { code: 'EGP', name: 'Egyptian Pound', symbol: 'ج.م', nameAr: 'جنيه مصري' },
  { code: 'SDG', name: 'Sudanese Pound', symbol: 'ج.س', nameAr: 'جنيه سوداني' },
];

// Default rates to SAR
const DEFAULT_RATES: Record<string, number> = {
  'USD': 3.75,
  'EUR': 4.08,
  'GBP': 4.75,
  'AED': 1.02,
  'KWD': 12.20,
  'QAR': 1.03,
  'BHD': 9.95,
  'OMR': 9.74,
  'EGP': 0.077,
  'SDG': 0.0062,
};

export function CurrencyManager() {
  const { currentLanguage } = useLanguage();
  const language = currentLanguage;
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isConverterOpen, setIsConverterOpen] = useState(false);
  const [newRate, setNewRate] = useState({
    from_currency: 'USD',
    to_currency: 'SAR',
    rate: '',
  });
  const [convertAmount, setConvertAmount] = useState('');
  const [convertFrom, setConvertFrom] = useState('USD');
  const [convertTo, setConvertTo] = useState('SAR');

  // Fetch FX rates
  const { data: fxRates, isLoading } = useQuery({
    queryKey: ['fx-rates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fx_rates')
        .select('*')
        .order('date', { ascending: false });
      
      if (error) throw error;
      return data as FxRate[];
    },
  });

  // Add rate mutation
  const addRateMutation = useMutation({
    mutationFn: async (rate: { from_currency: string; to_currency: string; rate: number }) => {
      const { data, error } = await supabase
        .from('fx_rates')
        .insert({
          from_currency: rate.from_currency,
          to_currency: rate.to_currency,
          rate: rate.rate,
          date: new Date().toISOString().split('T')[0],
          source: 'manual',
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fx-rates'] });
      toast.success(language === 'ar' ? 'تم إضافة سعر الصرف' : 'Exchange rate added');
      setIsDialogOpen(false);
      setNewRate({ from_currency: 'USD', to_currency: 'SAR', rate: '' });
    },
  });

  // Get latest rate for a currency pair
  const getLatestRate = (from: string, to: string): number | null => {
    if (from === to) return 1;
    
    // Try direct rate
    const direct = fxRates?.find(r => r.from_currency === from && r.to_currency === to);
    if (direct) return direct.rate;
    
    // Try inverse rate
    const inverse = fxRates?.find(r => r.from_currency === to && r.to_currency === from);
    if (inverse) return 1 / inverse.rate;
    
    // Use default rates via SAR
    if (to === 'SAR' && DEFAULT_RATES[from]) {
      return DEFAULT_RATES[from];
    }
    if (from === 'SAR' && DEFAULT_RATES[to]) {
      return 1 / DEFAULT_RATES[to];
    }
    
    return null;
  };

  // Convert amount
  const convertCurrency = (amount: number, from: string, to: string): number | null => {
    const rate = getLatestRate(from, to);
    return rate ? amount * rate : null;
  };

  const handleAddRate = () => {
    if (!newRate.rate) {
      toast.error(language === 'ar' ? 'يرجى إدخال السعر' : 'Please enter the rate');
      return;
    }
    addRateMutation.mutate({
      from_currency: newRate.from_currency,
      to_currency: newRate.to_currency,
      rate: parseFloat(newRate.rate),
    });
  };

  // Group rates by currency pair (latest only)
  const latestRates = fxRates?.reduce((acc, rate) => {
    const key = `${rate.from_currency}-${rate.to_currency}`;
    if (!acc[key] || new Date(rate.date) > new Date(acc[key].date)) {
      acc[key] = rate;
    }
    return acc;
  }, {} as Record<string, FxRate>);

  const convertedAmount = convertAmount 
    ? convertCurrency(parseFloat(convertAmount), convertFrom, convertTo)
    : null;

  if (isLoading) {
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
            {language === 'ar' ? 'العملات وأسعار الصرف' : 'Currencies & Exchange Rates'}
          </h2>
          <p className="text-muted-foreground">
            {language === 'ar' ? 'إدارة أسعار الصرف للعملات المتعددة' : 'Manage exchange rates for multiple currencies'}
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isConverterOpen} onOpenChange={setIsConverterOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <ArrowRightLeft className="w-4 h-4 me-2" />
                {language === 'ar' ? 'محول العملات' : 'Converter'}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{language === 'ar' ? 'محول العملات' : 'Currency Converter'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label>{language === 'ar' ? 'المبلغ' : 'Amount'}</Label>
                  <Input
                    type="number"
                    value={convertAmount}
                    onChange={(e) => setConvertAmount(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>{language === 'ar' ? 'من' : 'From'}</Label>
                    <Select value={convertFrom} onValueChange={setConvertFrom}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CURRENCIES.map(c => (
                          <SelectItem key={c.code} value={c.code}>
                            {c.code} - {language === 'ar' ? c.nameAr : c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>{language === 'ar' ? 'إلى' : 'To'}</Label>
                    <Select value={convertTo} onValueChange={setConvertTo}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CURRENCIES.map(c => (
                          <SelectItem key={c.code} value={c.code}>
                            {c.code} - {language === 'ar' ? c.nameAr : c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {convertedAmount !== null && (
                  <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 text-center">
                    <p className="text-sm text-muted-foreground">
                      {language === 'ar' ? 'النتيجة' : 'Result'}
                    </p>
                    <p className="text-2xl font-bold text-primary">
                      {convertedAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })} {convertTo}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      1 {convertFrom} = {getLatestRate(convertFrom, convertTo)?.toFixed(4)} {convertTo}
                    </p>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="gold">
                <Plus className="w-4 h-4 me-2" />
                {language === 'ar' ? 'إضافة سعر' : 'Add Rate'}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{language === 'ar' ? 'إضافة سعر صرف' : 'Add Exchange Rate'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>{language === 'ar' ? 'من' : 'From'}</Label>
                    <Select 
                      value={newRate.from_currency} 
                      onValueChange={(v) => setNewRate({ ...newRate, from_currency: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CURRENCIES.map(c => (
                          <SelectItem key={c.code} value={c.code}>{c.code}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>{language === 'ar' ? 'إلى' : 'To'}</Label>
                    <Select 
                      value={newRate.to_currency} 
                      onValueChange={(v) => setNewRate({ ...newRate, to_currency: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CURRENCIES.map(c => (
                          <SelectItem key={c.code} value={c.code}>{c.code}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>{language === 'ar' ? 'سعر الصرف' : 'Exchange Rate'}</Label>
                  <Input
                    type="number"
                    step="0.0001"
                    value={newRate.rate}
                    onChange={(e) => { const v = e.target.value; setNewRate(prev => ({ ...prev, rate: v })); }}
                    placeholder={`1 ${newRate.from_currency} = ? ${newRate.to_currency}`}
                  />
                </div>
                <Button onClick={handleAddRate} className="w-full" disabled={addRateMutation.isPending}>
                  {addRateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : (language === 'ar' ? 'إضافة' : 'Add')}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Supported Currencies */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              {language === 'ar' ? 'العملات المدعومة' : 'Supported Currencies'}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {CURRENCIES.map(c => (
              <Badge key={c.code} variant="outline" className="px-3 py-1">
                <span className="font-semibold">{c.code}</span>
                <span className="mx-2">•</span>
                <span>{language === 'ar' ? c.nameAr : c.name}</span>
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Exchange Rates Table */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              {language === 'ar' ? 'أسعار الصرف الحالية' : 'Current Exchange Rates'}
            </div>
          </CardTitle>
          <CardDescription>
            {language === 'ar' ? 'آخر أسعار الصرف المسجلة' : 'Latest recorded exchange rates'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {latestRates && Object.keys(latestRates).length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.values(latestRates).map(rate => (
                <div 
                  key={rate.id}
                  className="p-4 rounded-xl bg-muted/30 border border-border"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge>{rate.from_currency}</Badge>
                      <ArrowRightLeft className="w-4 h-4 text-muted-foreground" />
                      <Badge>{rate.to_currency}</Badge>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {rate.source}
                    </Badge>
                  </div>
                  <p className="text-2xl font-bold text-foreground">
                    {rate.rate.toFixed(4)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(rate.date), 'MMM d, yyyy')}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <RefreshCw className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-muted-foreground">
                {language === 'ar' ? 'لا توجد أسعار صرف مسجلة' : 'No exchange rates recorded'}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {language === 'ar' ? 'سيتم استخدام الأسعار الافتراضية' : 'Default rates will be used'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Default Rates */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>{language === 'ar' ? 'الأسعار الافتراضية (SAR)' : 'Default Rates (to SAR)'}</CardTitle>
          <CardDescription>
            {language === 'ar' ? 'تُستخدم عند عدم وجود سعر محدث' : 'Used when no updated rate is available'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Object.entries(DEFAULT_RATES).map(([currency, rate]) => (
              <div key={currency} className="p-3 rounded-lg bg-muted/30 text-center">
                <p className="font-semibold text-foreground">{currency}</p>
                <p className="text-lg text-primary">{rate.toFixed(2)} SAR</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
