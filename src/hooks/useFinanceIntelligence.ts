/**
 * useFinanceIntelligence — Financial Intelligence Engine
 *
 * Transforms raw financial data into four analytical views:
 *
 *  1. Commitment Graph     — monthly stacked obligations (debt + subscriptions)
 *  2. Future Obligations   — next 90 days payment schedule with urgency signals
 *  3. Cashflow Forecast    — 8-week projected income vs expenses + running balance
 *  4. Spending Behavior    — category breakdown + behavioral pattern analysis
 *
 * All computations are pure useMemo — no mutations.
 */
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  addDays, addMonths, differenceInDays, format,
  getDay, parseISO, startOfWeek, subDays,
} from 'date-fns';
import { ar } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useAccounts, useSubscriptions, useMonthlyStats } from './useFinance';
import { useDebts } from './useAdvancedFinance';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface CommitmentMonth {
  month:          string;   // 'يناير'
  monthKey:       string;   // '2026-01'
  debtPayments:   number;
  subscriptions:  number;
  total:          number;
}

export type ObligationStatus = 'overdue' | 'today' | 'this_week' | 'upcoming';

export interface FutureObligation {
  id:         string;
  date:       string;
  name:       string;
  amount:     number;
  currency:   string;
  type:       'debt' | 'subscription';
  daysUntil:  number;
  status:     ObligationStatus;
}

export interface CashflowWeek {
  weekLabel:          string;
  dateRange:          string;
  projectedIncome:    number;
  projectedExpenses:  number;
  knownCommitments:   number;
  netCashflow:        number;
  runningBalance:     number;
  isCurrentWeek:      boolean;
  isTight:            boolean;   // balance < 2× monthly expenses
}

export interface SpendingCategory {
  name:             string;
  total:            number;
  avgMonthly:       number;
  percentOfTotal:   number;
  trend:            'up' | 'down' | 'stable';
}

export interface SpendingBehavior {
  impulseScore:            number;        // 0-100: spending variability
  weekendMultiplier:       number;        // > 1 = spend more on weekends
  peakSpendingDay:         number;        // 0-6 (day of week)
  avgTransactionAmount:    number;
  spendingByDay:           number[];      // 7 values — avg spend per day
  topCategories:           SpendingCategory[];
  totalSpent90d:           number;
  avgMonthlyExpense:       number;
  behaviorInsights:        string[];
}

export interface FinanceIntelligenceData {
  commitmentMonths:       CommitmentMonth[];
  futureObligations:      FutureObligation[];
  cashflowWeeks:          CashflowWeek[];
  spendingBehavior:       SpendingBehavior;
  liquidBalance:          number;
  totalMonthlyCommitment: number;
  commitmentRatio:        number;   // commitments / income 0-1
  isLoading:              boolean;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const DAY_NAMES_AR = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
const MONTHS_AR    = ['يناير','فبراير','مارس','أبريل','مايو','يونيو',
                      'يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];

function obligationStatus(daysUntil: number): ObligationStatus {
  if (daysUntil < 0)   return 'overdue';
  if (daysUntil === 0) return 'today';
  if (daysUntil <= 7)  return 'this_week';
  return 'upcoming';
}

function stdDev(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((s, n) => s + n, 0) / values.length;
  const variance = values.reduce((s, n) => s + (n - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

// ── Hook ───────────────────────────────────────────────────────────────────────

export function useFinanceIntelligence(): FinanceIntelligenceData {
  const { user } = useAuth();

  const { data: accounts     = [], isLoading: aL } = useAccounts();
  const { data: debtsRaw     = [], isLoading: dL } = useDebts();
  const { data: subscriptions = [], isLoading: sL } = useSubscriptions();
  const { data: stats,             isLoading: stL } = useMonthlyStats();

  const { data: txns = [], isLoading: tL } = useQuery({
    queryKey: ['finance-intel-txns', user?.id],
    staleTime: 1000 * 60 * 30,
    queryFn: async () => {
      const { data } = await supabase
        .from('transactions')
        .select('amount, type, date, category, description')
        .gte('date', format(subDays(new Date(), 90), 'yyyy-MM-dd'))
        .order('date', { ascending: false });
      return (data ?? []) as Array<{
        amount: number;
        type: string;
        date: string;
        category: string | null;
        description: string | null;
      }>;
    },
    enabled: !!user,
  });

  const data = useMemo<Omit<FinanceIntelligenceData, 'isLoading'>>(() => {
    const debts = (debtsRaw as any[]).filter(d => d.status === 'active');
    const subs  = (subscriptions as any[]).filter(s => s.is_active);
    const today = new Date();
    const todayStr = format(today, 'yyyy-MM-dd');

    // ── Liquid balance ─────────────────────────────────────────────────────
    const liquidBalance = (accounts as any[]).reduce(
      (s, a) => s + (a.balance ?? 0), 0,
    );

    // ── Monthly commitments ────────────────────────────────────────────────
    const monthlyDebt = debts.reduce(
      (s, d) => s + (d.monthly_payment ?? d.minimum_payment ?? 0), 0,
    );
    const monthlySubs = subs.reduce((s, sub) => s + (sub.amount ?? 0), 0);
    const totalMonthlyCommitment = monthlyDebt + monthlySubs;
    const monthlyIncome = stats?.monthlyIncome ?? 0;
    const commitmentRatio = monthlyIncome > 0
      ? Math.min(1, totalMonthlyCommitment / monthlyIncome) : 0;

    // ── 1. Commitment months (6 forward) ──────────────────────────────────
    const commitmentMonths: CommitmentMonth[] = Array.from({ length: 6 }, (_, i) => {
      const date     = addMonths(today, i);
      const monthKey = format(date, 'yyyy-MM');

      const debtTotal = debts
        .filter(d => {
          if (!d.end_date) return true;
          return monthKey <= format(parseISO(d.end_date), 'yyyy-MM');
        })
        .reduce((s, d) => s + (d.monthly_payment ?? d.minimum_payment ?? 0), 0);

      const subTotal = subs.reduce((s, sub) => s + (sub.amount ?? 0), 0);

      return {
        month:         MONTHS_AR[date.getMonth()],
        monthKey,
        debtPayments:  Math.round(debtTotal),
        subscriptions: Math.round(subTotal),
        total:         Math.round(debtTotal + subTotal),
      };
    });

    // ── 2. Future obligations (90 days) ───────────────────────────────────
    const futureObligations: FutureObligation[] = [];

    debts.forEach((d: any) => {
      const payDay = d.monthly_payment_date ?? 1;
      for (let m = 0; m < 3; m++) {
        const date = new Date(today.getFullYear(), today.getMonth() + m, Math.min(payDay, 28));
        const dateStr   = format(date, 'yyyy-MM-dd');
        const daysUntil = differenceInDays(date, today);
        if (daysUntil >= -5 && daysUntil <= 90) {
          futureObligations.push({
            id:         `debt-${d.id}-m${m}`,
            date:       dateStr,
            name:       d.name,
            amount:     d.monthly_payment ?? d.minimum_payment ?? 0,
            currency:   d.currency ?? 'SAR',
            type:       'debt',
            daysUntil,
            status:     obligationStatus(daysUntil),
          });
        }
      }
    });

    subs.forEach((sub: any) => {
      if (!sub.next_billing_date) return;
      const daysUntil = differenceInDays(parseISO(sub.next_billing_date), today);
      if (daysUntil >= 0 && daysUntil <= 90) {
        futureObligations.push({
          id:         `sub-${sub.id}`,
          date:       sub.next_billing_date,
          name:       sub.name ?? 'اشتراك',
          amount:     sub.amount ?? 0,
          currency:   'SAR',
          type:       'subscription',
          daysUntil,
          status:     obligationStatus(daysUntil),
        });
      }
    });

    futureObligations.sort((a, b) => a.date.localeCompare(b.date));

    // ── 3. Cashflow forecast (8 weeks) ─────────────────────────────────────
    const incomeTxns  = txns.filter(t => t.type === 'income');
    const expenseTxns = txns.filter(t => t.type === 'expense');

    const weeklyIncome = monthlyIncome > 0
      ? monthlyIncome / 4.33
      : incomeTxns.reduce((s, t) => s + t.amount, 0) / 12.86; // 90d ÷ 7

    const baseWeeklyExpense = stats?.monthlyExpenses
      ? stats.monthlyExpenses / 4.33
      : expenseTxns.reduce((s, t) => s + t.amount, 0) / 12.86;

    let runningBalance = liquidBalance;

    const cashflowWeeks: CashflowWeek[] = Array.from({ length: 8 }, (_, i) => {
      const weekStart = addDays(startOfWeek(today), i * 7);
      const weekEnd   = addDays(weekStart, 6);
      const wStartStr = format(weekStart, 'yyyy-MM-dd');
      const wEndStr   = format(weekEnd, 'yyyy-MM-dd');

      const weekCommitments = futureObligations
        .filter(o => o.date >= wStartStr && o.date <= wEndStr)
        .reduce((s, o) => s + o.amount, 0);

      const projectedExpenses = baseWeeklyExpense + weekCommitments;
      const netCashflow = weeklyIncome - projectedExpenses;
      runningBalance += netCashflow;

      const monthlyExpenses = stats?.monthlyExpenses ?? baseWeeklyExpense * 4.33;

      return {
        weekLabel:         `أ${i + 1}`,
        dateRange:         format(weekStart, 'd MMM', { locale: ar }),
        projectedIncome:   Math.round(weeklyIncome),
        projectedExpenses: Math.round(projectedExpenses),
        knownCommitments:  Math.round(weekCommitments),
        netCashflow:       Math.round(netCashflow),
        runningBalance:    Math.round(runningBalance),
        isCurrentWeek:     i === 0,
        isTight:           runningBalance < monthlyExpenses * 2,
      };
    });

    // ── 4. Spending behavior ───────────────────────────────────────────────
    const expenses = expenseTxns;
    const totalSpent90d = expenses.reduce((s, t) => s + t.amount, 0);

    // By category
    const byCategory: Record<string, number> = {};
    expenses.forEach(t => {
      const cat = t.category ?? 'أخرى';
      byCategory[cat] = (byCategory[cat] ?? 0) + t.amount;
    });
    const topCategories: SpendingCategory[] = Object.entries(byCategory)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, total]) => ({
        name,
        total,
        avgMonthly: Math.round(total / 3),
        percentOfTotal: totalSpent90d > 0 ? Math.round((total / totalSpent90d) * 100) : 0,
        trend: 'stable' as const,
      }));

    // By day of week
    const sumByDay   = new Array(7).fill(0);
    const countByDay = new Array(7).fill(0);
    expenses.forEach(t => {
      try {
        const d = getDay(parseISO(t.date));
        sumByDay[d]   += t.amount;
        countByDay[d] += 1;
      } catch { /* bad date */ }
    });
    const spendingByDay = sumByDay.map((s, i) =>
      countByDay[i] > 0 ? Math.round(s / countByDay[i]) : 0,
    );
    const peakSpendingDay = spendingByDay.indexOf(Math.max(...spendingByDay));

    // Impulse score (coefficient of variation of daily totals)
    const dailyTotals: Record<string, number> = {};
    expenses.forEach(t => {
      dailyTotals[t.date] = (dailyTotals[t.date] ?? 0) + t.amount;
    });
    const dailyValues = Object.values(dailyTotals);
    const mean = dailyValues.length > 0
      ? dailyValues.reduce((s, n) => s + n, 0) / dailyValues.length : 0;
    const cv = mean > 0 ? stdDev(dailyValues) / mean : 0;
    const impulseScore = Math.min(100, Math.round(cv * 80));

    // Weekend vs weekday multiplier
    const wkendSpend = (sumByDay[5] + sumByDay[6]);
    const wkdaySpend = sumByDay.slice(0, 5).reduce((s, n) => s + n, 0);
    const wkendDays  = (countByDay[5] + countByDay[6]) || 1;
    const wkdayDays  = countByDay.slice(0, 5).reduce((s, n) => s + n, 0) || 1;
    const weekendMultiplier = Math.round(
      ((wkendSpend / wkendDays) / (wkdaySpend / wkdayDays)) * 100,
    ) / 100 || 1;

    const avgTransactionAmount = expenses.length > 0
      ? Math.round(totalSpent90d / expenses.length) : 0;

    // Behavioral insights
    const behaviorInsights: string[] = [];
    if (impulseScore > 60)
      behaviorInsights.push(`إنفاقك متذبذب — فارق كبير بين أيام الإنفاق العالية والمنخفضة`);
    if (weekendMultiplier > 1.4)
      behaviorInsights.push(`تنفق ${Math.round((weekendMultiplier - 1) * 100)}% أكثر في عطلة نهاية الأسبوع`);
    if (peakSpendingDay >= 0)
      behaviorInsights.push(`${DAY_NAMES_AR[peakSpendingDay]} هو يوم إنفاقك الأعلى تاريخياً`);
    if (topCategories[0])
      behaviorInsights.push(`"${topCategories[0].name}" تستهلك ${topCategories[0].percentOfTotal}% من إجمالي إنفاقك`);
    if (commitmentRatio > 0.5)
      behaviorInsights.push(`${Math.round(commitmentRatio * 100)}% من دخلك مُلتزم مسبقاً — هامش التصرف ضيق`);
    if (commitmentRatio < 0.2 && monthlyIncome > 0)
      behaviorInsights.push('التزاماتك منخفضة — فرصة لزيادة الادخار أو الاستثمار');

    return {
      commitmentMonths,
      futureObligations,
      cashflowWeeks,
      spendingBehavior: {
        impulseScore,
        weekendMultiplier,
        peakSpendingDay,
        avgTransactionAmount,
        spendingByDay,
        topCategories,
        totalSpent90d,
        avgMonthlyExpense: Math.round(totalSpent90d / 3),
        behaviorInsights,
      },
      liquidBalance,
      totalMonthlyCommitment,
      commitmentRatio,
    };
  }, [accounts, debtsRaw, subscriptions, stats, txns]);

  return {
    ...data,
    isLoading: aL || dL || sL || stL || tL,
  };
}
