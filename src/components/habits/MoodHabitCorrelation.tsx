import { useMoodHabitCorrelation, CorrelationData } from '@/hooks/useMoodHabitCorrelation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Loader2, TrendingUp, TrendingDown, Minus, Sparkles, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/hooks/useLanguage';

interface CorrelationBarProps {
  data: CorrelationData;
}

function CorrelationBar({ data }: CorrelationBarProps) {
  const { currentLanguage } = useLanguage();
  const percentage = ((data.correlation + 1) / 2) * 100; // Convert -1..1 to 0..100
  const isPositive = data.correlation > 0.1;
  const isNegative = data.correlation < -0.1;
  const isNeutral = !isPositive && !isNegative;

  return (
    <div className="p-4 rounded-xl bg-muted/30 border border-border hover:border-primary/30 transition-all">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{data.habitIcon || '✨'}</span>
          <div>
            <h4 className="font-medium text-foreground">{data.habitName}</h4>
            <p className="text-xs text-muted-foreground">
              {data.completionDays} / {data.totalDays} {currentLanguage === 'ar' ? 'يوم' : 'days'}
            </p>
          </div>
        </div>
        <div className={cn(
          'flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
          isPositive && 'bg-emerald-500/10 text-emerald-500',
          isNegative && 'bg-destructive/10 text-destructive',
          isNeutral && 'bg-muted text-muted-foreground'
        )}>
          {isPositive && <TrendingUp className="w-3 h-3" />}
          {isNegative && <TrendingDown className="w-3 h-3" />}
          {isNeutral && <Minus className="w-3 h-3" />}
          {isPositive ? (currentLanguage === 'ar' ? 'إيجابي' : 'Positive') :
           isNegative ? (currentLanguage === 'ar' ? 'سلبي' : 'Negative') :
           (currentLanguage === 'ar' ? 'محايد' : 'Neutral')}
        </div>
      </div>

      <div className="relative h-2 bg-muted rounded-full overflow-hidden">
        <div 
          className={cn(
            'absolute top-0 h-full rounded-full transition-all duration-500',
            isPositive && 'bg-gradient-to-r from-primary to-emerald-500',
            isNegative && 'bg-gradient-to-r from-destructive to-orange-500',
            isNeutral && 'bg-muted-foreground'
          )}
          style={{ 
            left: isNegative ? `${percentage}%` : '50%',
            width: `${Math.abs(percentage - 50)}%`,
          }}
        />
        <div className="absolute top-0 left-1/2 w-0.5 h-full bg-foreground/20" />
      </div>

      <div className="flex justify-between mt-3 text-xs text-muted-foreground">
        <span>
          {currentLanguage === 'ar' ? 'مع العادة:' : 'With habit:'}{' '}
          <span className="text-foreground font-medium">
            {data.avgMoodWithHabit.toFixed(1)} ⭐
          </span>
        </span>
        <span>
          {currentLanguage === 'ar' ? 'بدون العادة:' : 'Without:'}{' '}
          <span className="text-foreground font-medium">
            {data.avgMoodWithoutHabit.toFixed(1)} ⭐
          </span>
        </span>
      </div>
    </div>
  );
}

export function MoodHabitCorrelation() {
  const { data, isLoading } = useMoodHabitCorrelation(30);
  const { currentLanguage } = useLanguage();

  if (isLoading) {
    return (
      <Card className="glass-card">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            {currentLanguage === 'ar' ? 'تحليل العلاقة بين المزاج والعادات' : 'Mood-Habit Correlation'}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <p className="text-muted-foreground">
            {currentLanguage === 'ar' 
              ? 'سجّل المزاج والعادات لمدة أسبوع على الأقل لرؤية الارتباطات'
              : 'Log mood and habits for at least a week to see correlations'}
          </p>
        </CardContent>
      </Card>
    );
  }

  const positiveCorrelations = data.filter(d => d.correlation > 0.1);
  const negativeCorrelations = data.filter(d => d.correlation < -0.1);

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-500" />
          {currentLanguage === 'ar' ? 'تحليل العلاقة بين المزاج والعادات' : 'Mood-Habit Correlation'}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {currentLanguage === 'ar' 
            ? 'ارتباطات وليست علاقات سببية - آخر 30 يوم'
            : 'Correlations, not causations - last 30 days'}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {positiveCorrelations.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-emerald-500 mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              {currentLanguage === 'ar' ? 'عادات تحسّن المزاج' : 'Mood-Boosting Habits'}
            </h4>
            <div className="space-y-3">
              {positiveCorrelations.map(d => (
                <CorrelationBar key={d.habitId} data={d} />
              ))}
            </div>
          </div>
        )}

        {negativeCorrelations.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-destructive mb-3 flex items-center gap-2">
              <TrendingDown className="w-4 h-4" />
              {currentLanguage === 'ar' ? 'عادات تحتاج مراجعة' : 'Habits to Review'}
            </h4>
            <div className="space-y-3">
              {negativeCorrelations.map(d => (
                <CorrelationBar key={d.habitId} data={d} />
              ))}
            </div>
          </div>
        )}

        {data.filter(d => Math.abs(d.correlation) <= 0.1).length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
              <Minus className="w-4 h-4" />
              {currentLanguage === 'ar' ? 'عادات محايدة' : 'Neutral Habits'}
            </h4>
            <div className="space-y-3">
              {data.filter(d => Math.abs(d.correlation) <= 0.1).map(d => (
                <CorrelationBar key={d.habitId} data={d} />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
