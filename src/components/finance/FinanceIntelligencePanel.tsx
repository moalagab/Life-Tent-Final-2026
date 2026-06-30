/**
 * FinanceIntelligencePanel — Four-tab financial intelligence UI.
 *
 * Tabs:
 *  📊 الالتزامات  — Commitment Graph (stacked bar, 6 months)
 *  📅 المستقبل   — Future Obligations (90-day timeline)
 *  💹 التدفق     — Cashflow Forecast (8-week chart + balance)
 *  🧠 السلوك     — Behavioral Spending Patterns
 */
import { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  BarChart2, CalendarDays, TrendingUp, Brain,
  AlertTriangle, Clock, CheckCircle2, ChevronRight,
  ArrowUpRight, ArrowDownRight, Minus,
  type LucideIcon,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  ComposedChart, Line, Cell, ReferenceLine,
} from 'recharts';
import { useFinanceIntelligence, type FutureObligation, type SpendingCategory } from '@/hooks/useFinanceIntelligence';
import { format, parseISO } from 'date-fns';
import { ar } from 'date-fns/locale';

// ── Tab config ─────────────────────────────────────────────────────────────────

type IntelTab = 'commitment' | 'obligations' | 'cashflow' | 'behavior';

const TABS: { id: IntelTab; label: string; icon: LucideIcon }[] = [
  { id: 'commitment',  label: 'الالتزامات', icon: BarChart2    },
  { id: 'obligations', label: 'المستقبل',   icon: CalendarDays },
  { id: 'cashflow',    label: 'التدفق',     icon: TrendingUp   },
  { id: 'behavior',    label: 'السلوك',     icon: Brain        },
];

// ── Colors ─────────────────────────────────────────────────────────────────────

const COLORS = {
  debt:   '#ef4444',
  subs:   '#f59e0b',
  income: '#22c55e',
  expense:'#ef4444',
  balance:'#6366f1',
  tight:  '#f97316',
};

const STATUS_CFG: Record<string, { color: string; label: string; icon: React.FC<any> }> = {
  overdue:   { color: 'text-red-500 bg-red-500/10 border-red-500/20',    label: 'متأخر',      icon: AlertTriangle },
  today:     { color: 'text-red-500 bg-red-500/10 border-red-500/20',    label: 'اليوم',      icon: AlertTriangle },
  this_week: { color: 'text-amber-500 bg-amber-400/10 border-amber-400/20', label: 'هذا الأسبوع', icon: Clock },
  upcoming:  { color: 'text-blue-500 bg-blue-400/10 border-blue-400/20', label: 'قادم',       icon: ChevronRight },
};

// ── Formatters ────────────────────────────────────────────────────────────────

function fmt(n: number, currency = 'SAR'): string {
  return `${n.toLocaleString('ar')} ${currency}`;
}

function fmtK(n: number): string {
  if (Math.abs(n) >= 1000) return `${Math.round(n / 1000)}K`;
  return String(Math.round(n));
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function PanelSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-6 w-40" />
      <Skeleton className="h-40 w-full rounded-xl" />
      <div className="space-y-2">
        {[0, 1, 2].map(i => <Skeleton key={i} className="h-12 rounded-lg" />)}
      </div>
    </div>
  );
}

// ── Custom tooltip ─────────────────────────────────────────────────────────────

interface TooltipPayload { dataKey: string; name: string; fill?: string; stroke?: string; value: number; }
function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: TooltipPayload[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-popover border border-border rounded-xl px-3 py-2 shadow-lg text-xs space-y-1">
      <div className="font-bold text-foreground mb-1">{label}</div>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: p.fill ?? p.stroke }} />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-bold">{fmtK(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

// ── Tab 1: Commitment Graph ────────────────────────────────────────────────────

function CommitmentGraph() {
  const { commitmentMonths, totalMonthlyCommitment, commitmentRatio } = useFinanceIntelligence();

  const ratioColor =
    commitmentRatio >= 0.6 ? 'text-red-500' :
    commitmentRatio >= 0.4 ? 'text-amber-500' :
    'text-emerald-500';

  return (
    <div className="space-y-4">
      {/* Header stat */}
      <div className="flex items-center gap-4">
        <div>
          <div className={cn('text-2xl font-black tabular-nums', ratioColor)}>
            {Math.round(commitmentRatio * 100)}%
          </div>
          <div className="text-[10px] text-muted-foreground">من الدخل مُلتزَم</div>
        </div>
        <div className="flex-1 space-y-1">
          <div className="text-xs text-muted-foreground">
            إجمالي الالتزامات الشهرية:
            <span className="font-black text-foreground ms-1">{fmtK(totalMonthlyCommitment)}</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-all',
                commitmentRatio >= 0.6 ? 'bg-red-500' :
                commitmentRatio >= 0.4 ? 'bg-amber-400' : 'bg-emerald-500',
              )}
              style={{ width: `${Math.min(100, commitmentRatio * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Stacked bar chart */}
      <div dir="ltr" className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={commitmentMonths} barSize={28} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
            <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={fmtK} width={30} />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(99,102,241,0.06)' }} />
            <Bar dataKey="debtPayments" name="ديون" fill={COLORS.debt} stackId="a" radius={[0,0,4,4]} />
            <Bar dataKey="subscriptions" name="اشتراكات" fill={COLORS.subs} stackId="a" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex gap-4 text-[10px] text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-1.5 rounded-full" style={{ background: COLORS.debt }} />
          <span>أقساط ديون</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-1.5 rounded-full" style={{ background: COLORS.subs }} />
          <span>اشتراكات</span>
        </div>
      </div>

      {/* Month breakdown table */}
      <div className="space-y-1.5">
        {commitmentMonths.map(m => (
          <div key={m.monthKey} className="flex items-center gap-2 text-xs">
            <span className="w-16 text-muted-foreground font-medium">{m.month}</span>
            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-red-500 to-amber-400"
                style={{ width: `${Math.min(100, (m.total / (totalMonthlyCommitment * 1.2)) * 100)}%` }}
              />
            </div>
            <span className="font-bold tabular-nums text-foreground/80 w-16 text-end">
              {fmtK(m.total)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Tab 2: Future Obligations ──────────────────────────────────────────────────

function ObligationRow({ o }: { o: FutureObligation }) {
  const cfg = STATUS_CFG[o.status];
  const Icon = cfg.icon;

  return (
    <div className={cn(
      'flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-colors',
      o.status === 'overdue' || o.status === 'today'
        ? 'border-red-500/20 bg-red-500/[0.03]'
        : o.status === 'this_week'
        ? 'border-amber-400/20 bg-amber-400/[0.03]'
        : 'border-border/30 bg-transparent',
    )}>
      <div className={cn(
        'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
        o.type === 'debt' ? 'bg-red-500/10' : 'bg-amber-400/10',
      )}>
        <Icon className={cn('w-4 h-4', o.type === 'debt' ? 'text-red-500' : 'text-amber-500')} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="text-xs font-bold text-foreground/90 truncate">{o.name}</div>
        <div className="text-[10px] text-muted-foreground">
          {format(parseISO(o.date), 'd MMMM', { locale: ar })}
          {' '}·{' '}
          {o.type === 'debt' ? 'قسط' : 'اشتراك'}
        </div>
      </div>

      <div className="text-end shrink-0 space-y-0.5">
        <div className="text-sm font-black tabular-nums text-foreground">
          {fmtK(o.amount)}
        </div>
        <div className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded-full border', cfg.color)}>
          {o.status === 'overdue'   ? 'متأخر' :
           o.status === 'today'     ? 'اليوم' :
           o.daysUntil === 1       ? 'غداً' :
           `${o.daysUntil} يوم`}
        </div>
      </div>
    </div>
  );
}

function FutureObligationsView() {
  const { futureObligations } = useFinanceIntelligence();

  const urgent    = futureObligations.filter(o => o.status === 'overdue' || o.status === 'today');
  const thisWeek  = futureObligations.filter(o => o.status === 'this_week');
  const later     = futureObligations.filter(o => o.status === 'upcoming');

  const totalNext30 = futureObligations
    .filter(o => o.daysUntil >= 0 && o.daysUntil <= 30)
    .reduce((s, o) => s + o.amount, 0);

  if (futureObligations.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-10">
        <CheckCircle2 className="w-8 h-8 text-emerald-500/60" />
        <p className="text-xs text-muted-foreground text-center">لا التزامات مسجلة</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Next 30 days summary */}
      <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border/30">
        <div>
          <div className="text-lg font-black tabular-nums">{fmtK(totalNext30)}</div>
          <div className="text-[10px] text-muted-foreground">إجمالي 30 يوماً القادمة</div>
        </div>
        <div className="flex-1" />
        <div className="text-[10px] text-muted-foreground text-end">
          <div><span className="font-bold text-foreground">{urgent.length + thisWeek.length}</span> هذا الأسبوع</div>
          <div><span className="font-bold text-foreground">{later.length}</span> لاحقاً</div>
        </div>
      </div>

      {/* Urgent */}
      {urgent.length > 0 && (
        <div className="space-y-1.5">
          <div className="text-[10px] font-bold text-red-500 uppercase tracking-wide">عاجل</div>
          {urgent.map(o => <ObligationRow key={o.id} o={o} />)}
        </div>
      )}

      {/* This week */}
      {thisWeek.length > 0 && (
        <div className="space-y-1.5">
          <div className="text-[10px] font-bold text-amber-500 uppercase tracking-wide">هذا الأسبوع</div>
          {thisWeek.map(o => <ObligationRow key={o.id} o={o} />)}
        </div>
      )}

      {/* Later */}
      {later.length > 0 && (
        <div className="space-y-1.5">
          <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">
            خلال 90 يوماً
          </div>
          {later.slice(0, 8).map(o => <ObligationRow key={o.id} o={o} />)}
          {later.length > 8 && (
            <p className="text-[10px] text-muted-foreground/60 text-center py-1">
              + {later.length - 8} التزامات أخرى
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Tab 3: Cashflow Forecast ───────────────────────────────────────────────────

function CashflowForecast() {
  const { cashflowWeeks, liquidBalance } = useFinanceIntelligence();

  const lowestBalance = Math.min(...cashflowWeeks.map(w => w.runningBalance));
  const isRisk = lowestBalance < 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div>
          <div className="text-xl font-black tabular-nums">{fmtK(liquidBalance)}</div>
          <div className="text-[10px] text-muted-foreground">الرصيد الحالي</div>
        </div>
        <div className="flex-1" />
        {isRisk && (
          <div className="flex items-center gap-1 text-[10px] font-bold text-red-500 bg-red-500/10 px-2 py-1 rounded-full">
            <AlertTriangle className="w-3 h-3" />
            رصيد سلبي متوقع
          </div>
        )}
      </div>

      {/* Composed chart */}
      <div dir="ltr" className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={cashflowWeeks} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
            <XAxis dataKey="weekLabel" tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={fmtK} width={32} />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(99,102,241,0.06)' }} />
            <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="3 3" />
            <Bar dataKey="projectedIncome" name="دخل" fill={COLORS.income} radius={[3,3,0,0]} maxBarSize={20} />
            <Bar dataKey="projectedExpenses" name="مصروف" fill={COLORS.expense} radius={[3,3,0,0]} maxBarSize={20} opacity={0.75} />
            <Line
              dataKey="runningBalance"
              name="الرصيد"
              stroke={COLORS.balance}
              strokeWidth={2}
              dot={(props: { cx: number; cy: number; index: number }) => {
                const isTight = cashflowWeeks[props.index]?.isTight;
                return (
                  <circle
                    key={props.index}
                    cx={props.cx} cy={props.cy} r={3}
                    fill={isTight ? COLORS.tight : COLORS.balance}
                    stroke="none"
                  />
                );
              }}
              type="monotone"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex gap-4 text-[10px] text-muted-foreground">
        {[
          { color: COLORS.income,  label: 'دخل متوقع'  },
          { color: COLORS.expense, label: 'مصروف متوقع' },
          { color: COLORS.balance, label: 'الرصيد المتوقع' },
        ].map(item => (
          <div key={item.label} className="flex items-center gap-1.5">
            <div className="w-3 h-1.5 rounded-full" style={{ background: item.color }} />
            <span>{item.label}</span>
          </div>
        ))}
      </div>

      {/* Weekly table */}
      <div className="space-y-1">
        {cashflowWeeks.map(w => (
          <div
            key={w.weekLabel}
            className={cn(
              'flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs',
              w.isCurrentWeek ? 'bg-muted/50' : '',
              w.isTight ? 'border border-orange-500/20' : '',
            )}
          >
            <span className={cn('font-bold w-8 shrink-0', w.isCurrentWeek && 'text-primary')}>
              {w.weekLabel}
            </span>
            <span className="text-muted-foreground text-[10px] w-14 shrink-0">{w.dateRange}</span>
            <div className="flex-1" />
            {w.netCashflow >= 0 ? (
              <ArrowUpRight className="w-3 h-3 text-emerald-500 shrink-0" />
            ) : (
              <ArrowDownRight className="w-3 h-3 text-red-500 shrink-0" />
            )}
            <span className={cn(
              'font-bold tabular-nums w-16 text-end',
              w.netCashflow >= 0 ? 'text-emerald-500' : 'text-red-500',
            )}>
              {w.netCashflow >= 0 ? '+' : ''}{fmtK(w.netCashflow)}
            </span>
            <span className="text-muted-foreground tabular-nums w-16 text-end">
              {fmtK(w.runningBalance)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Tab 4: Spending Behavior ───────────────────────────────────────────────────

function CategoryBar({ cat, maxTotal }: { cat: SpendingCategory; maxTotal: number }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 text-xs">
        <span className="flex-1 truncate font-medium">{cat.name}</span>
        <span className="text-muted-foreground text-[10px]">{cat.percentOfTotal}%</span>
        <span className="font-black tabular-nums w-16 text-end">{fmtK(cat.total)}</span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-violet-500 to-purple-400 transition-all duration-700"
          style={{ width: `${(cat.total / maxTotal) * 100}%` }}
        />
      </div>
    </div>
  );
}

const DAY_NAMES_SHORT = ['أح', 'ات', 'ثل', 'أر', 'خم', 'جم', 'سب'];

function SpendingHeatmap({ spendingByDay }: { spendingByDay: number[] }) {
  const max = Math.max(...spendingByDay, 1);
  return (
    <div>
      <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-2">
        متوسط الإنفاق اليومي
      </div>
      <div className="flex gap-1">
        {spendingByDay.map((val, i) => {
          const intensity = val / max;
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div
                className="w-full rounded-lg transition-all duration-500"
                style={{
                  height: `${Math.max(4, intensity * 40)}px`,
                  background: `rgba(139, 92, 246, ${0.15 + intensity * 0.85})`,
                }}
              />
              <span className="text-[8px] text-muted-foreground">{DAY_NAMES_SHORT[i]}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SpendingPatterns() {
  const { spendingBehavior } = useFinanceIntelligence();
  const {
    impulseScore, weekendMultiplier, peakSpendingDay,
    avgTransactionAmount, spendingByDay, topCategories,
    totalSpent90d, avgMonthlyExpense, behaviorInsights,
  } = spendingBehavior;

  const impulseColor =
    impulseScore >= 70 ? 'text-red-500' :
    impulseScore >= 40 ? 'text-amber-500' :
    'text-emerald-500';

  const maxCategoryTotal = topCategories[0]?.total ?? 1;

  return (
    <div className="space-y-5">
      {/* Top stats */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'إنفاق 90 يوم',     value: fmtK(totalSpent90d),         sub: 'ريال' },
          { label: 'متوسط شهري',        value: fmtK(avgMonthlyExpense),      sub: 'ريال' },
          { label: 'متوسط المعاملة',   value: fmtK(avgTransactionAmount),   sub: 'ريال' },
        ].map(s => (
          <div key={s.label} className="bg-muted/30 rounded-xl p-2.5 text-center">
            <div className="text-base font-black tabular-nums">{s.value}</div>
            <div className="text-[9px] text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Behavioral scores */}
      <div className="grid grid-cols-2 gap-2">
        {/* Impulse score */}
        <div className="rounded-xl border border-border/40 p-3 space-y-1.5">
          <div className="text-[10px] text-muted-foreground font-bold">نزعة الإنفاق العفوي</div>
          <div className={cn('text-2xl font-black', impulseColor)}>{impulseScore}</div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className={cn('h-full rounded-full', impulseScore >= 70 ? 'bg-red-500' : impulseScore >= 40 ? 'bg-amber-400' : 'bg-emerald-500')}
              style={{ width: `${impulseScore}%` }}
            />
          </div>
          <div className="text-[9px] text-muted-foreground">
            {impulseScore >= 70 ? 'مرتفع — تقلب كبير' : impulseScore >= 40 ? 'متوسط' : 'منخفض — منتظم'}
          </div>
        </div>

        {/* Weekend multiplier */}
        <div className="rounded-xl border border-border/40 p-3 space-y-1.5">
          <div className="text-[10px] text-muted-foreground font-bold">معامل العطلة</div>
          <div className={cn('text-2xl font-black', weekendMultiplier > 1.3 ? 'text-amber-500' : 'text-foreground')}>
            ×{weekendMultiplier.toFixed(1)}
          </div>
          <div className="text-[9px] text-muted-foreground">
            {weekendMultiplier > 1.3
              ? `تنفق ${Math.round((weekendMultiplier - 1) * 100)}% أكثر في العطلة`
              : 'إنفاق متوازن طوال الأسبوع'}
          </div>
        </div>
      </div>

      {/* Day heatmap */}
      <SpendingHeatmap spendingByDay={spendingByDay} />

      {/* Category breakdown */}
      {topCategories.length > 0 && (
        <div className="space-y-2.5">
          <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">
            أكثر الفئات إنفاقاً (90 يوم)
          </div>
          {topCategories.map(cat => (
            <CategoryBar key={cat.name} cat={cat} maxTotal={maxCategoryTotal} />
          ))}
        </div>
      )}

      {/* Behavioral insights */}
      {behaviorInsights.length > 0 && (
        <div className="space-y-2">
          <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">
            رؤى سلوكية
          </div>
          {behaviorInsights.map((insight, i) => (
            <div key={i} className="flex items-start gap-2 text-[11px] text-foreground/80">
              <div className="w-1 h-1 rounded-full bg-violet-400 mt-1.5 shrink-0" />
              {insight}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Panel ─────────────────────────────────────────────────────────────────

export function FinanceIntelligencePanel() {
  const [activeTab, setActiveTab] = useState<IntelTab>('commitment');
  const { isLoading } = useFinanceIntelligence();

  return (
    <div className="space-y-4">
      {/* Tab bar */}
      <div className="flex gap-1 bg-muted/40 rounded-xl p-1">
        {TABS.map(tab => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex-1 flex flex-col items-center gap-1 py-2 px-1 rounded-lg text-[10px] font-bold transition-all',
                active
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <Icon className={cn('w-4 h-4', active && 'text-primary')} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Panel body */}
      <div className="rounded-2xl border border-border/50 bg-card/60 p-4">
        {isLoading ? (
          <PanelSkeleton />
        ) : (
          <>
            {activeTab === 'commitment'  && <CommitmentGraph />}
            {activeTab === 'obligations' && <FutureObligationsView />}
            {activeTab === 'cashflow'    && <CashflowForecast />}
            {activeTab === 'behavior'    && <SpendingPatterns />}
          </>
        )}
      </div>
    </div>
  );
}
