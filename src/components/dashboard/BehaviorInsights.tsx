/**
 * BehaviorInsights — Behavioral patterns analysis panel.
 *
 * Improvements:
 *   - Insight cards are colour-coded: positive (green) / warning (amber) / critical (red)
 *   - Distraction patterns shown as a separate section
 *   - Score gauges include a short explanation label
 *   - Energy bar replaces the generic risk badge row
 */
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Brain, TrendingUp, TrendingDown, Minus,
  Clock, AlertTriangle, Flame, CheckCircle2,
  BarChart3, ShieldAlert, Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useBehaviorEngine } from '@/hooks/useBehaviorEngine';
import { usePersonalizationMemory } from '@/hooks/usePersonalizationMemory';
import { useLanguage } from '@/hooks/useLanguage';

// ── Helpers ───────────────────────────────────────────────────────────────────

const DAY_NAMES_AR = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
const DAY_NAMES_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function GaugeRow({
  label,
  sublabel,
  value,
  low = false,
}: {
  label: string;
  sublabel?: string;
  value: number;
  low?: boolean;
}) {
  const color =
    low
      ? value < 30 ? 'bg-success' : value < 60 ? 'bg-amber-500' : 'bg-destructive'
      : value >= 70 ? 'bg-success' : value >= 40 ? 'bg-amber-500' : 'bg-destructive';

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <div>
          <span className="text-foreground font-medium">{label}</span>
          {sublabel && <span className="text-muted-foreground mr-1 text-[10px]">({sublabel})</span>}
        </div>
        <span className="font-semibold">{value}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-500', color)}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color = 'text-foreground',
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
}) {
  return (
    <div className="p-3 rounded-xl bg-muted/30 border border-border/40 space-y-1">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="w-3.5 h-3.5" />
        {label}
      </div>
      <p className={cn('text-xl font-bold', color)}>{value}</p>
      {sub && <p className="text-[10px] text-muted-foreground">{sub}</p>}
    </div>
  );
}

// ── InsightCard — colour-coded by content ─────────────────────────────────────

function insightVariant(text: string): 'positive' | 'warning' | 'critical' {
  if (
    text.includes('ممتاز') || text.includes('جيد') || text.includes('ذروة') ||
    text.includes('صباح') || text.includes('بعد الظهر') || text.includes('مساء')
  ) return 'positive';
  if (
    text.includes('منخفض') || text.includes('متوقف') || text.includes('يحتاج') ||
    text.includes('مهمة')
  ) return 'critical';
  return 'warning';
}

const INSIGHT_STYLES = {
  positive: 'bg-success/5 border-success/25 text-success dark:text-green-400',
  warning:  'bg-amber-500/5 border-amber-500/25 text-amber-700 dark:text-amber-400',
  critical: 'bg-destructive/5 border-destructive/25 text-destructive',
};

const INSIGHT_DOTS = {
  positive: 'text-success',
  warning:  'text-amber-500',
  critical: 'text-destructive',
};

function InsightCard({ text }: { text: string }) {
  const variant = insightVariant(text);
  return (
    <div className={cn('flex items-start gap-2 text-xs p-2.5 rounded-lg border', INSIGHT_STYLES[variant])}>
      <span className={cn('mt-0.5 font-bold', INSIGHT_DOTS[variant])}>•</span>
      <span>{text}</span>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function BehaviorInsights() {
  const { data: profile, isLoading } = useBehaviorEngine();
  const { trends } = usePersonalizationMemory();
  const { currentLanguage } = useLanguage();

  const DAY_NAMES = currentLanguage === 'ar' ? DAY_NAMES_AR : DAY_NAMES_EN;

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Brain className="w-4 h-4 text-violet-400" />
            {currentLanguage === 'ar' ? 'تحليل السلوك' : 'Behavior Analysis'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!profile) return null;

  const TrendIcon =
    trends.weeklyCompletionTrend === 'improving' ? TrendingUp
    : trends.weeklyCompletionTrend === 'declining' ? TrendingDown
    : Minus;

  const trendColor =
    trends.weeklyCompletionTrend === 'improving' ? 'text-success'
    : trends.weeklyCompletionTrend === 'declining' ? 'text-destructive'
    : 'text-muted-foreground';

  const riskBadgeStyle = {
    high:   'bg-destructive/15 text-destructive border-destructive/25',
    medium: 'bg-amber-500/15 text-amber-600 border-amber-500/25',
    low:    'bg-success/15 text-success border-success/25',
  }[profile.todayRiskLevel];

  const riskLabel = currentLanguage === 'ar'
    ? (profile.todayRiskLevel === 'high' ? 'مرتفع' : profile.todayRiskLevel === 'medium' ? 'متوسط' : 'منخفض')
    : (profile.todayRiskLevel === 'high' ? 'High' : profile.todayRiskLevel === 'medium' ? 'Medium' : 'Low');

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Brain className="w-4 h-4 text-violet-400" />
            {currentLanguage === 'ar' ? 'تحليل السلوك' : 'Behavior Analysis'}
          </CardTitle>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <TrendIcon className={cn('w-3.5 h-3.5', trendColor)} />
              <span className={cn('text-xs', trendColor)}>
                {currentLanguage === 'ar'
                  ? (trends.weeklyCompletionTrend === 'improving' ? 'تحسّن' : trends.weeklyCompletionTrend === 'declining' ? 'تراجع' : 'مستقر')
                  : (trends.weeklyCompletionTrend === 'improving' ? 'Improving' : trends.weeklyCompletionTrend === 'declining' ? 'Declining' : 'Stable')}
              </span>
            </div>
            <Badge className={cn('text-[10px] border', riskBadgeStyle)} variant="outline">
              <ShieldAlert className="w-2.5 h-2.5 me-1" />
              {riskLabel}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-2">
          <StatCard
            icon={CheckCircle2}
            label={currentLanguage === 'ar' ? 'إجمالي المنجز' : 'Total Completed'}
            value={trends.totalTasksCompleted}
            sub={currentLanguage === 'ar' ? 'مهمة في السجل' : 'tasks on record'}
            color="text-success"
          />
          <StatCard
            icon={Clock}
            label={currentLanguage === 'ar' ? 'ذروة الإنتاجية' : 'Peak Productivity'}
            value={`${profile.peakHour.toString().padStart(2, '0')}:00`}
            sub={DAY_NAMES[profile.peakDay]}
          />
          <StatCard
            icon={Flame}
            label={currentLanguage === 'ar' ? 'عادات هشة' : 'Fragile Habits'}
            value={profile.fragileHabitIds.length}
            sub={currentLanguage === 'ar' ? 'تحتاج تعزيز' : 'need reinforcement'}
            color={profile.fragileHabitIds.length > 0 ? 'text-amber-500' : 'text-success'}
          />
          <StatCard
            icon={AlertTriangle}
            label={currentLanguage === 'ar' ? 'مهام متوقفة' : 'Stalled Tasks'}
            value={profile.stalledTaskIds.length}
            sub={currentLanguage === 'ar' ? '+3 أيام تأخير' : '+3 days overdue'}
            color={profile.stalledTaskIds.length > 0 ? 'text-destructive' : 'text-success'}
          />
        </div>

        {/* Performance gauges */}
        <div className="space-y-3 pt-1">
          <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
            <BarChart3 className="w-3.5 h-3.5" /> {currentLanguage === 'ar' ? 'مؤشرات الأداء' : 'Performance Indicators'}
          </p>
          <GaugeRow
            label={currentLanguage === 'ar' ? 'معدل الإنجاز' : 'Completion Rate'}
            sublabel={currentLanguage === 'ar' ? 'كلما ارتفع أفضل' : 'higher is better'}
            value={profile.completionRate}
          />
          <GaugeRow
            label={currentLanguage === 'ar' ? 'التسويف' : 'Procrastination'}
            sublabel={currentLanguage === 'ar' ? 'كلما انخفض أفضل' : 'lower is better'}
            value={profile.procrastinationScore}
            low
          />
          <GaugeRow
            label={currentLanguage === 'ar' ? 'الإفراط في الالتزام' : 'Overcommitment'}
            sublabel={currentLanguage === 'ar' ? 'كلما انخفض أفضل' : 'lower is better'}
            value={profile.overcommitmentScore}
            low
          />
        </div>

        {/* Insights */}
        {profile.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Zap className="w-3.5 h-3.5" /> {currentLanguage === 'ar' ? 'رؤى مخصصة' : 'Personalized Insights'}
            </p>
            {profile.insights.map((insight, i) => (
              <InsightCard key={i} text={insight} />
            ))}
          </div>
        )}

        {/* Distraction patterns */}
        {profile.distractionPatterns && profile.distractionPatterns.length > 0 && (
          <div className="space-y-1.5 pt-1">
            <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> {currentLanguage === 'ar' ? 'أنماط التشتت' : 'Distraction Patterns'}
            </p>
            {profile.distractionPatterns.map((p, i) => (
              <div
                key={i}
                className="flex items-start gap-2 text-xs p-2.5 rounded-lg bg-amber-500/5 border border-amber-500/20 text-amber-700 dark:text-amber-400"
              >
                <span className="text-amber-500 font-bold mt-0.5">→</span>
                <span>{p}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
