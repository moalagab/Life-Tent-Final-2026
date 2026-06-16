/**
 * useFinanceAgent — Financial Decision Intelligence
 *
 * Analyses accounts, transactions, debts, and subscriptions to surface
 * time-sensitive financial decisions and opportunities.
 *
 * Signals produced:
 *  - Upcoming debt payments (within 7 days)
 *  - Spending velocity vs monthly income (burn rate warning)
 *  - Subscription optimization (inactive or overlap)
 *  - Debt payoff opportunity (extra cashflow → high-interest debt)
 *  - Low balance alert (account < 10% of monthly expenses)
 *  - Positive savings milestone
 */
import { useMemo } from 'react';
import { differenceInDays, parseISO, startOfMonth, format } from 'date-fns';
import { useAccounts, useTransactions, useMonthlyStats, useSubscriptions } from './useFinance';
import { useDebts } from './useAdvancedFinance';

// ── Types ──────────────────────────────────────────────────────────────────────

export type FinanceSuggestionType =
  | 'warning'       // urgent: low balance, missed payment
  | 'opportunity'   // positive: save more, invest
  | 'reminder'      // routine: upcoming payment
  | 'insight';      // analytical: trend, pattern

export interface FinanceSuggestion {
  id:          string;
  type:        FinanceSuggestionType;
  priority:    'high' | 'medium' | 'low';
  title:       string;
  detail:      string;
  amount?:     number;
  currency?:   string;
  actionLabel?: string;
  actionRoute?: string;
}

export interface FinanceAgentResult {
  suggestions:       FinanceSuggestion[];
  netWorth:          number;
  monthlyIncome:     number;
  monthlyExpenses:   number;
  savingsRate:       number;
  burnDays:          number;    // how many days of runway at current burn
  healthScore:       number;    // 0-100 financial health
  healthLabel:       string;
  isLoading:         boolean;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function healthScore(savingsRate: number, burnDays: number, debtRatio: number): number {
  let s = 50;
  s += Math.min(25, savingsRate * 0.5);
  s += Math.min(20, burnDays * 0.2);
  s -= Math.min(45, debtRatio * 50);
  return Math.max(0, Math.min(100, Math.round(s)));
}

function healthLabel(score: number): string {
  if (score >= 75) return 'صحة مالية ممتازة';
  if (score >= 55) return 'صحة مالية جيدة';
  if (score >= 35) return 'تحتاج مراجعة';
  return 'وضع حرج';
}

// ── Main hook ──────────────────────────────────────────────────────────────────

export function useFinanceAgent(): FinanceAgentResult {
  const { data: accounts     = [], isLoading: aL } = useAccounts();
  const { data: txRaw        = [], isLoading: tL } = useTransactions(60);
  const { data: stats,             isLoading: sL } = useMonthlyStats();
  const { data: subscriptions = [], isLoading: subL } = useSubscriptions();
  const { data: debtsRaw     = [], isLoading: afL } = useDebts();

  const result = useMemo<Omit<FinanceAgentResult, 'isLoading'>>(() => {
    const netWorth        = stats?.netWorth        ?? 0;
    const monthlyIncome   = stats?.monthlyIncome   ?? 0;
    const monthlyExpenses = stats?.monthlyExpenses ?? 0;
    const savingsRate     = stats?.savingsRate     ?? 0;

    const burnDays = monthlyExpenses > 0
      ? Math.round((netWorth / monthlyExpenses) * 30)
      : 999;

    // Debt ratio (total debt / net worth)
    const debts = debtsRaw;
    const totalDebt = debts.reduce((s: number, d: any) => s + (d.remaining_amount ?? 0), 0);
    const debtRatio = netWorth > 0 ? totalDebt / netWorth : 0;

    const score = healthScore(savingsRate, Math.min(burnDays, 90), debtRatio);
    const suggestions: FinanceSuggestion[] = [];

    // ── 1. Upcoming debt payments ─────────────────────────────────────────
    debts
      .filter((d: any) => d.status === 'active' && d.monthly_payment_date)
      .forEach((d: any) => {
        const today = new Date();
        const payDay = d.monthly_payment_date as number;
        const thisMonth = new Date(today.getFullYear(), today.getMonth(), payDay);
        const daysUntil = differenceInDays(thisMonth, today);

        if (daysUntil >= 0 && daysUntil <= 7) {
          suggestions.push({
            id:          `debt-payment-${d.id}`,
            type:        daysUntil <= 2 ? 'warning' : 'reminder',
            priority:    daysUntil <= 2 ? 'high' : 'medium',
            title:       `دفعة ${d.name} خلال ${daysUntil === 0 ? 'اليوم' : `${daysUntil} يوم`}`,
            detail:      `المبلغ المطلوب: ${(d.monthly_payment ?? d.minimum_payment ?? 0).toLocaleString('ar')} — الدين المتبقي: ${d.remaining_amount.toLocaleString('ar')}`,
            amount:      d.monthly_payment ?? d.minimum_payment ?? 0,
            currency:    d.currency ?? 'SAR',
            actionLabel: 'تسجيل الدفعة',
            actionRoute: '/finance/debts',
          });
        }
      });

    // ── 2. Burn rate warning ──────────────────────────────────────────────
    if (monthlyExpenses > monthlyIncome * 1.1 && monthlyIncome > 0) {
      suggestions.push({
        id:       'burn-warning',
        type:     'warning',
        priority: 'high',
        title:    'الإنفاق يتجاوز الدخل',
        detail:   `تنفق ${Math.round(monthlyExpenses - monthlyIncome).toLocaleString('ar')} زيادة عن دخلك هذا الشهر`,
        amount:   monthlyExpenses - monthlyIncome,
        actionLabel: 'راجع المصروفات',
        actionRoute: '/finance',
      });
    } else if (savingsRate >= 20) {
      suggestions.push({
        id:       'savings-good',
        type:     'opportunity',
        priority: 'low',
        title:    `توفير ${savingsRate}% من الدخل`,
        detail:   'معدل توفير ممتاز — فكّر في توجيه الفائض للاستثمار أو سداد ديون بفائدة عالية',
        actionRoute: '/finance',
      });
    }

    // ── 3. Low balance alert ──────────────────────────────────────────────
    const monthlyThreshold = monthlyExpenses * 0.1;
    accounts
      .filter((a: any) => a.balance !== null && a.balance < monthlyThreshold && a.balance >= 0)
      .slice(0, 2)
      .forEach((a: any) => {
        suggestions.push({
          id:       `low-balance-${a.id}`,
          type:     'warning',
          priority: 'high',
          title:    `رصيد منخفض — ${a.name}`,
          detail:   `الرصيد ${a.balance.toLocaleString('ar')} أقل من 10% من مصروفاتك الشهرية`,
          amount:   a.balance,
          currency: a.currency ?? 'SAR',
          actionRoute: '/finance',
        });
      });

    // ── 4. Subscription audit ─────────────────────────────────────────────
    const upcomingSubs = subscriptions.filter((s: any) => {
      if (!s.next_billing_date) return false;
      const days = differenceInDays(parseISO(s.next_billing_date), new Date());
      return days >= 0 && days <= 5;
    });
    if (upcomingSubs.length > 0) {
      const total = upcomingSubs.reduce((sum: number, s: any) => sum + (s.amount ?? 0), 0);
      suggestions.push({
        id:       'subscriptions-due',
        type:     'reminder',
        priority: 'medium',
        title:    `${upcomingSubs.length} اشتراك سيُجدَّد قريباً`,
        detail:   `إجمالي ${total.toLocaleString('ar')} — تأكد من رغبتك في الاستمرار`,
        amount:   total,
        actionLabel: 'مراجعة الاشتراكات',
        actionRoute: '/finance',
      });
    }

    // ── 5. Debt payoff opportunity ────────────────────────────────────────
    const cashflow = monthlyIncome - monthlyExpenses;
    const highInterestDebt = debts
      .filter((d: any) => d.status === 'active' && d.interest_rate && d.interest_rate > 10)
      .sort((a: any, b: any) => (b.interest_rate ?? 0) - (a.interest_rate ?? 0))[0];

    if (cashflow > 500 && highInterestDebt) {
      suggestions.push({
        id:       'debt-payoff',
        type:     'opportunity',
        priority: 'medium',
        title:    'فرصة تسريع سداد الدين',
        detail:   `لديك ${cashflow.toLocaleString('ar')} فائض شهري — سدّد جزءاً إضافياً من "${highInterestDebt.name}" (${highInterestDebt.interest_rate}% فائدة)`,
        amount:   cashflow,
        actionRoute: '/finance/debts',
      });
    }

    // ── 6. Runway insight ─────────────────────────────────────────────────
    if (burnDays < 60 && monthlyExpenses > 0) {
      suggestions.push({
        id:       'runway',
        type:     burnDays < 30 ? 'warning' : 'insight',
        priority: burnDays < 30 ? 'high' : 'low',
        title:    `احتياطيك يكفي ${burnDays} يوماً`,
        detail:   burnDays < 30
          ? 'احتياطيك المالي منخفض جداً — ابنِ صندوق طوارئ'
          : 'فكّر في توجيه الاحتياطي الزائد للاستثمار',
        actionRoute: '/finance',
      });
    }

    // Sort: high priority first, then warning > opportunity > reminder > insight
    const TYPE_ORDER: Record<FinanceSuggestionType, number> = {
      warning: 0, opportunity: 1, reminder: 2, insight: 3,
    };
    const PRIO_ORDER = { high: 0, medium: 1, low: 2 };
    suggestions.sort((a, b) =>
      PRIO_ORDER[a.priority] - PRIO_ORDER[b.priority] ||
      TYPE_ORDER[a.type] - TYPE_ORDER[b.type]
    );

    return {
      suggestions: suggestions.slice(0, 6),
      netWorth,
      monthlyIncome,
      monthlyExpenses,
      savingsRate,
      burnDays,
      healthScore: score,
      healthLabel: healthLabel(score),
    };
  }, [accounts, txRaw, stats, subscriptions, advFinance]);

  return {
    ...result,
    isLoading: aL || tL || sL || subL || afL,
  };
}
