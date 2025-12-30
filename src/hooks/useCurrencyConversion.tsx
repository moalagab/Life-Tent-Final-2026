import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Supported currencies with their symbols
export const CURRENCIES = [
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

// Default exchange rates to SAR (updated December 2024)
export const DEFAULT_RATES_TO_SAR: Record<string, number> = {
  'USD': 3.75,
  'EUR': 4.10,
  'GBP': 4.75,
  'AED': 1.02,
  'KWD': 12.20,
  'QAR': 1.03,
  'BHD': 9.95,
  'OMR': 9.74,
  'EGP': 0.077,
  'SDG': 0.0062,
  'SAR': 1,
};

interface FxRate {
  id: string;
  from_currency: string;
  to_currency: string;
  rate: number;
  date: string;
  source: string;
}

export function useFxRates() {
  return useQuery({
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
}

export function useCurrencyConversion() {
  const { data: fxRates } = useFxRates();

  const getRate = useMemo(() => {
    return (from: string, to: string): number => {
      if (from === to) return 1;
      
      // Try to find a direct rate in the database
      const directRate = fxRates?.find(r => r.from_currency === from && r.to_currency === to);
      if (directRate) return directRate.rate;
      
      // Try inverse rate
      const inverseRate = fxRates?.find(r => r.from_currency === to && r.to_currency === from);
      if (inverseRate) return 1 / inverseRate.rate;
      
      // Use default rates via SAR
      const fromToSAR = DEFAULT_RATES_TO_SAR[from] || 1;
      const toToSAR = DEFAULT_RATES_TO_SAR[to] || 1;
      
      return fromToSAR / toToSAR;
    };
  }, [fxRates]);

  const convert = useMemo(() => {
    return (amount: number, from: string, to: string): number => {
      return amount * getRate(from, to);
    };
  }, [getRate]);

  const convertToSAR = useMemo(() => {
    return (amount: number, from: string): number => {
      return convert(amount, from, 'SAR');
    };
  }, [convert]);

  return { getRate, convert, convertToSAR, fxRates };
}

export function getCurrencySymbol(code: string): string {
  return CURRENCIES.find(c => c.code === code)?.symbol || code;
}

export function getCurrencyName(code: string, isArabic: boolean): string {
  const currency = CURRENCIES.find(c => c.code === code);
  return isArabic ? currency?.nameAr || code : currency?.name || code;
}
