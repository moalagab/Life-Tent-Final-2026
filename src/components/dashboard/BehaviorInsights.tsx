/**
 * BehaviorInsights — Behavioral patterns analysis panel.
 *
 * Displays: completion trend, peak hour, procrastination gauge,
 * overcommitment gauge, fragile habits count, stalled tasks count,
 * and long-term streaks / total completed.
 */
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Brain, TrendingUp, TrendingDown, Minus,
  Clock, AlertTriangle, Flame, CheckCircle2,
  BarChart3,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useBehaviorEngine } from '@/hooks/useBehaviorEngine';
import { usePersonalizationMemory } from '@/hooks/usePersonalizationMemory';

// ── Helpers ───────────────────────────────────────────────────────────────────

const DAY_NAMES = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

function GaugeRow({
  label, value, low = false,
}: { label: string; value: number; low?: boolean }) {
  const color =
    low
      ? value < 30 ? 'bg-success' : value < 60 ? 'bg-amber-500' : 'bg-destructive'
      : value >= 70 ? 'bg-success' : value >= 40 ? 'bg-amber-500' : 'bg-destructive';

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{value}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all', color)}
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

// ── Main component ────────────────────────────────────────────────────────────

export function BehaviorInsights() {
  const { data: profile, isLoading } = useBehaviorEngine();
  const { trends } = usePersonalizationMemory();

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Brain className="w-4 h-4 text-violet-400" />
            تحليل السلوك
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

  const trendIcon =
    trends.weeklyCompletionTrend === 'improving' ? TrendingUp
    : trends.weeklyCompletionTrend === 'declining' ? TrendingDown
    : Minus;

  const trendColor =
    trends.weeklyCompletionTrend === 'improving' ? 'text-success'
    : trends.weeklyCompletionTrend === 'declining' ? 'text-destructive'
    : 'text-muted-foreground';

  const TrendIcon = trendIcon;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Brain className="w-4 h-4 text-violet-400" />
            تحليل السلوك
          </CardTitle>
          <div className="flex items-center gap-1.5">
            <TrendIcon className={cn('w-3.5 h-3.5', trendColor)} />
            <span className={cn('text-xs', trendColor)}>
              {trends.weeklyCompletionTrend === 'improving' ? 'تحسّن' : trends.weeklyCompletionTrend === 'declining' ? 'تراجع' : 'مستقر'}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-2">
          <StatCard
            icon={CheckCircle2}
            label="إجمالي المنجز"
            value={trends.totalTasksCompleted}
            sub="مهمة منجزة"
            color="text-success"
          />
          <StatCard
            icon={Clock}
            label="ذروة الإنتاجية"
            value={`${profile.peakHour.toString().padStart(2, '0')}:00`}
            sub={DAY_NAMES[profile.peakDay]}
          />
          <StatCard
            icon={Flame}
            label="عادات هشة"
            value={profile.fragileHabitIds.length}
            sub="تحتاج تعزيز"
            color={profile.fragileHabitIds.length > 0 ? 'text-amber-500' : 'text-success'}
          />
          <StatCard
            icon={AlertTriangle}
            label="مهام متوقفة"
            value={profile.stalledTaskIds.length}
            sub="+3 أيام تأخير"
            color={profile.stalledTaskIds.length > 0 ? 'text-destructive' : 'text-success'}
          />
        </div>

        {/* Gauges */}
        <div className="space-y-3 pt-1">
          <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
            <BarChart3 className="w-3.5 h-3.5" /> مؤشرات الأداء
          </p>
          <GaugeRow label="معدل الإنجاز" value={profile.completionRate} />
          <GaugeRow label="التسويف" value={profile.procrastinationScore} low />
          <GaugeRow label="الإفراط في الالتزام" value={profile.overcommitmentScore} low />
        </div>

        {/* Insights */}
        {profile.insights.length > 0 && (
          <div className="space-y-1.5 pt-1">
            {profile.insights.map((insight, i) => (
              <div
                key={i}
                className="flex items-start gap-2 text-xs text-muted-foreground p-2 rounded-lg bg-muted/20"
              >
                <span className="mt-0.5 text-primary">•</span>
                {insight}
              </div>
            ))}
          </div>
        )}

        {/* Risk badge */}
        <div className="flex items-center justify-between pt-1">
          <span className="text-xs text-muted-foreground">مستوى الخطر اليوم</span>
          <Badge
            className={cn(
              'text-xs',
              profile.todayRiskLevel === 'high' && 'bg-destructive/20 text-destructive border-destructive/30',
              profile.todayRiskLevel === 'medium' && 'bg-amber-500/20 text-amber-600 border-amber-500/30',
              profile.todayRiskLevel === 'low' && 'bg-success/20 text-success border-success/30',
            )}
            variant="outline"
          >
            {profile.todayRiskLevel === 'high' ? 'مرتفع' : profile.todayRiskLevel === 'medium' ? 'متوسط' : 'منخفض'}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
