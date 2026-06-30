/**
 * AgentPanel — Unified Agent Layer UI
 *
 * Three tab-switched panels:
 *   📋 Task Agent   — Day reorganization + suggestions
 *   💰 Finance Agent — Financial decisions + alerts
 *   🔁 Habit Agent  — Behavior-outcome correlations
 *
 * Each panel is lazy-rendered (no data fetched until tab opened).
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/hooks/useLanguage';
import {
  Brain, ListChecks, Wallet, RefreshCw, ArrowRight,
  AlertTriangle, Lightbulb, Bell, TrendingUp, Zap,
  CheckCircle2, Clock, Flame, Star, ChevronRight,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useTaskAgent,   type TaskAgentSuggestion  } from '@/hooks/useTaskAgent';
import { useFinanceAgent, type FinanceSuggestion    } from '@/hooks/useFinanceAgent';
import { useHabitAgent,  type HabitInsight, type HabitWithStats } from '@/hooks/useHabitAgent';
import { useUpdateTask } from '@/hooks/useTasks';

// ── Tab configuration ──────────────────────────────────────────────────────────

type AgentTab = 'tasks' | 'finance' | 'habits';

// ── Suggestion type icon ───────────────────────────────────────────────────────

function SuggestionIcon({ type }: { type: string }) {
  const cls = 'w-3.5 h-3.5 shrink-0';
  if (type === 'warning')     return <AlertTriangle className={cn(cls, 'text-red-500')} />;
  if (type === 'opportunity') return <TrendingUp    className={cn(cls, 'text-emerald-500')} />;
  if (type === 'reminder')    return <Bell          className={cn(cls, 'text-amber-500')} />;
  if (type === 'reorder')     return <ListChecks    className={cn(cls, 'text-blue-500')} />;
  if (type === 'defer')       return <Clock         className={cn(cls, 'text-slate-400')} />;
  if (type === 'focus')       return <Zap           className={cn(cls, 'text-indigo-500')} />;
  if (type === 'quickwin')    return <Star          className={cn(cls, 'text-amber-400')} />;
  if (type === 'correlation') return <Brain         className={cn(cls, 'text-purple-500')} />;
  if (type === 'streak')      return <Flame         className={cn(cls, 'text-orange-500')} />;
  if (type === 'achievement') return <CheckCircle2  className={cn(cls, 'text-emerald-500')} />;
  return <Lightbulb className={cn(cls, 'text-slate-400')} />;
}

const PRIO_BAR: Record<string, string> = {
  high:   'bg-red-500',
  medium: 'bg-amber-400',
  low:    'bg-slate-300 dark:bg-slate-600',
};

// ── Task Agent Panel ───────────────────────────────────────────────────────────

function TaskAgentPanel() {
  const navigate = useNavigate();
  const { currentLanguage } = useLanguage();
  const isAr = currentLanguage === 'ar';
  const { plan, isLoading } = useTaskAgent();
  const updateTask = useUpdateTask();

  if (isLoading) return <AgentSkeleton />;

  const { suggestions, morning, afternoon, evening, completedToday, totalTasks, overloaded, peakBlock } = plan;

  const blockMap = { morning, afternoon, evening };
  const blockLabels: Record<string, string> = {
    morning:   isAr ? '🌅 الصباح'    : '🌅 Morning',
    afternoon: isAr ? '☀️ بعد الظهر' : '☀️ Afternoon',
    evening:   isAr ? '🌙 المساء'    : '🌙 Evening',
  };

  return (
    <div className="space-y-3">
      {/* Header stat */}
      <div className="flex items-center gap-3">
        <div className="flex-1 flex items-center gap-2">
          <div className="text-2xl font-black text-foreground">{totalTasks}</div>
          <div className="text-xs text-muted-foreground leading-tight">
            <div>{isAr ? 'مهمة نشطة' : 'active tasks'}</div>
            {completedToday > 0 && (
              <div className="text-emerald-500 font-semibold">
                {completedToday} {isAr ? 'منجزة اليوم ✓' : 'done today ✓'}
              </div>
            )}
          </div>
        </div>
        {overloaded && (
          <span className="text-[10px] font-black text-red-500 bg-red-500/10 px-2 py-0.5 rounded-full">
            {isAr ? 'مكتظ' : 'Overloaded'}
          </span>
        )}
        <span className="text-[10px] text-muted-foreground">
          {isAr ? 'ذروتك في' : 'Peak at'} {blockLabels[peakBlock]}
        </span>
      </div>

      {/* Day time blocks */}
      {(Object.entries(blockMap) as [string, typeof morning][]).map(([block, tasks]) => {
        if (tasks.length === 0) return null;
        return (
          <div key={block} className="space-y-1">
            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">
              {blockLabels[block]}
            </div>
            {tasks.slice(0, 2).map(t => (
              <div
                key={t.id}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer group"
                onClick={() => navigate('/tasks')}
              >
                <div className={cn('w-1 h-4 rounded-full shrink-0', {
                  'bg-red-500':    t.priority === 'critical',
                  'bg-orange-400': t.priority === 'high',
                  'bg-blue-400':   t.priority === 'medium',
                  'bg-slate-300':  !t.priority || t.priority === 'low',
                })} />
                <span className="flex-1 text-xs text-foreground/90 truncate">{t.title}</span>
                <span className="text-[10px] text-muted-foreground/60 font-mono">
                  {t.score}
                </span>
                <button
                  onClick={e => {
                    e.stopPropagation();
                    updateTask.mutate({ id: t.id, status: 'in_progress' });
                  }}
                  className="opacity-0 group-hover:opacity-100 text-[9px] font-bold text-blue-500 border border-blue-400/30 rounded px-1.5 py-0.5 transition-opacity"
                >
                  {isAr ? 'ابدأ' : 'Start'}
                </button>
              </div>
            ))}
            {tasks.length > 2 && (
              <div className="text-[10px] text-muted-foreground/60 ps-2">
                + {tasks.length - 2} {isAr ? 'مهام أخرى' : 'more tasks'}
              </div>
            )}
          </div>
        );
      })}

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="space-y-1.5 pt-1 border-t border-border/40">
          <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">
            {isAr ? 'اقتراحات الوكيل' : 'Agent Suggestions'}
          </div>
          {suggestions.slice(0, 3).map(s => (
            <SuggestionRow key={s.id} suggestion={s} onNavigate={() => navigate('/tasks')} />
          ))}
        </div>
      )}
    </div>
  );
}

function SuggestionRow({
  suggestion: s,
  onNavigate,
}: {
  suggestion: TaskAgentSuggestion | FinanceSuggestion;
  onNavigate: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate();

  return (
    <div
      className="rounded-lg border border-border/30 bg-background/60 overflow-hidden"
      onClick={() => setExpanded(e => !e)}
    >
      <div className="flex items-center gap-2 px-2.5 py-2 cursor-pointer">
        <div className={cn('w-0.5 h-6 rounded-full shrink-0', PRIO_BAR[s.priority])} />
        <SuggestionIcon type={s.type} />
        <span className="flex-1 text-xs font-semibold text-foreground/90 truncate">{s.title}</span>
        <ChevronRight className={cn('w-3 h-3 text-muted-foreground/40 transition-transform shrink-0', expanded && 'rotate-90')} />
      </div>
      {expanded && (
        <div className="px-4 pb-2.5 pt-0.5 space-y-2">
          <p className="text-[11px] text-muted-foreground leading-relaxed">{s.detail}</p>
          {(s as FinanceSuggestion).actionLabel && (
            <button
              onClick={e => { e.stopPropagation(); navigate((s as FinanceSuggestion).actionRoute ?? '/finance'); }}
              className="flex items-center gap-1 text-[10px] font-bold text-primary hover:underline"
            >
              {(s as FinanceSuggestion).actionLabel}
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Finance Agent Panel ────────────────────────────────────────────────────────

function FinanceAgentPanel() {
  const navigate = useNavigate();
  const { currentLanguage } = useLanguage();
  const isAr = currentLanguage === 'ar';
  const { suggestions, healthScore, healthLabel, savingsRate, burnDays, isLoading } = useFinanceAgent();

  if (isLoading) return <AgentSkeleton />;

  const scoreColor =
    healthScore >= 75 ? 'text-emerald-500' :
    healthScore >= 50 ? 'text-amber-500' :
    'text-red-500';

  const scoreBarColor =
    healthScore >= 75 ? 'bg-emerald-500' :
    healthScore >= 50 ? 'bg-amber-400' :
    'bg-red-500';

  return (
    <div className="space-y-3">
      {/* Health header */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <div className={cn('text-2xl font-black', scoreColor)}>{healthScore}</div>
          <div className="text-xs text-muted-foreground">{healthLabel}</div>
        </div>
        <div className="text-end text-[10px] text-muted-foreground space-y-0.5">
          <div>
            {isAr ? 'توفير' : 'Savings'}{' '}
            <span className="font-bold text-foreground">{savingsRate}%</span>
          </div>
          <div>
            {isAr ? 'احتياطي' : 'Reserve'}{' '}
            <span className="font-bold text-foreground">{burnDays > 365 ? '+365' : burnDays}</span>{' '}
            {isAr ? 'يوم' : 'days'}
          </div>
        </div>
      </div>

      {/* Health bar */}
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-700', scoreBarColor)}
          style={{ width: `${healthScore}%` }}
        />
      </div>

      {/* Suggestions */}
      {suggestions.length === 0 ? (
        <div className="text-center py-4 text-xs text-muted-foreground">
          {isAr ? 'لا توجد قرارات مالية عاجلة الآن' : 'No urgent financial decisions right now'}
        </div>
      ) : (
        <div className="space-y-1.5">
          {suggestions.map(s => (
            <SuggestionRow key={s.id} suggestion={s} onNavigate={() => navigate('/finance')} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Habit Agent Panel ──────────────────────────────────────────────────────────

function HabitRing({ completionRate }: { completionRate: number }) {
  const r = 16;
  const circ = 2 * Math.PI * r;
  const dash = (completionRate / 100) * circ;
  return (
    <svg width="40" height="40" className="shrink-0 -rotate-90">
      <circle cx="20" cy="20" r={r} fill="none" strokeWidth="3" className="stroke-muted" />
      <circle
        cx="20" cy="20" r={r} fill="none" strokeWidth="3"
        className="stroke-violet-500"
        strokeDasharray={`${dash} ${circ - dash}`}
        strokeLinecap="round"
      />
    </svg>
  );
}

function HabitCard({ habit, isAr }: { habit: HabitWithStats; isAr: boolean }) {
  return (
    <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg bg-muted/30">
      <div
        className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-sm"
        style={{ background: habit.color ? `${habit.color}25` : undefined }}
      >
        {habit.icon ?? '⚡'}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-semibold text-foreground/90 truncate">{habit.name}</div>
        <div className="flex items-center gap-1 mt-0.5">
          {habit.streakDays > 0 && (
            <span className="text-[9px] font-bold text-orange-500 flex items-center gap-0.5">
              <Flame className="w-2.5 h-2.5" />{habit.streakDays}
            </span>
          )}
          {habit.completedToday && (
            <span className="text-[9px] font-bold text-emerald-500">
              {isAr ? '✓ اليوم' : '✓ Today'}
            </span>
          )}
          {!habit.completedToday && (
            <span className="text-[9px] text-muted-foreground/60">
              {isAr ? 'لم تُنجز اليوم' : 'Not done today'}
            </span>
          )}
        </div>
      </div>
      <HabitRing completionRate={habit.completionRate} />
    </div>
  );
}

function HabitInsightRow({ insight }: { insight: HabitInsight }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div
      className="rounded-lg border border-border/30 bg-background/60 overflow-hidden cursor-pointer"
      onClick={() => setExpanded(e => !e)}
    >
      <div className="flex items-center gap-2 px-2.5 py-2">
        <div className={cn('w-0.5 h-6 rounded-full shrink-0', PRIO_BAR[insight.priority])} />
        <SuggestionIcon type={insight.type} />
        <span className="flex-1 text-xs font-semibold text-foreground/90 truncate">{insight.title}</span>
        <ChevronRight className={cn('w-3 h-3 text-muted-foreground/40 shrink-0 transition-transform', expanded && 'rotate-90')} />
      </div>
      {expanded && (
        <div className="px-4 pb-2.5 pt-0.5">
          <p className="text-[11px] text-muted-foreground leading-relaxed">{insight.detail}</p>
        </div>
      )}
    </div>
  );
}

function HabitAgentPanel() {
  const navigate = useNavigate();
  const { currentLanguage } = useLanguage();
  const isAr = currentLanguage === 'ar';
  const { topHabits, atRisk, insights, overallScore, overallLabel, isLoading } = useHabitAgent();

  if (isLoading) return <AgentSkeleton />;

  const scoreColor =
    overallScore >= 75 ? 'text-violet-500' :
    overallScore >= 50 ? 'text-amber-500' :
    'text-red-500';

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className={cn('text-2xl font-black', scoreColor)}>{overallScore}%</div>
        <div className="text-xs text-muted-foreground flex-1">{overallLabel}</div>
        {atRisk.length > 0 && (
          <span className="text-[10px] font-black text-red-500 bg-red-500/10 px-2 py-0.5 rounded-full">
            {atRisk.length} {isAr ? 'في خطر' : 'at risk'}
          </span>
        )}
      </div>

      {/* At-risk habits */}
      {atRisk.length > 0 && (
        <div className="space-y-1">
          <div className="text-[10px] font-bold text-red-500/80 uppercase tracking-wide">
            {isAr ? 'عادات تحتاج اهتماماً' : 'Habits Needing Attention'}
          </div>
          {atRisk.slice(0, 2).map(h => <HabitCard key={h.id} habit={h} isAr={isAr} />)}
        </div>
      )}

      {/* Top habits */}
      {topHabits.length > 0 && (
        <div className="space-y-1">
          <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">
            {isAr ? 'أبرز العادات' : 'Top Habits'}
          </div>
          {topHabits.slice(0, 3).map(h => <HabitCard key={h.id} habit={h} isAr={isAr} />)}
        </div>
      )}

      {/* Insights */}
      {insights.length > 0 && (
        <div className="space-y-1.5 pt-1 border-t border-border/40">
          <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">
            {isAr ? 'رؤى الوكيل' : 'Agent Insights'}
          </div>
          {insights.slice(0, 3).map(i => (
            <HabitInsightRow key={i.id} insight={i} />
          ))}
        </div>
      )}

      <button
        onClick={() => navigate('/habits')}
        className="w-full flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors py-1"
      >
        {isAr ? 'عرض كل العادات' : 'View all habits'} <ArrowRight className="w-3 h-3" />
      </button>
    </div>
  );
}

// ── Skeleton ───────────────────────────────────────────────────────────────────

function AgentSkeleton() {
  return (
    <div className="space-y-2.5">
      <div className="flex gap-2">
        <Skeleton className="h-8 w-12 rounded-lg" />
        <div className="space-y-1.5 flex-1">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-2 w-16" />
        </div>
      </div>
      {[0, 1, 2].map(i => (
        <Skeleton key={i} className="h-10 w-full rounded-lg" />
      ))}
    </div>
  );
}

// ── Main AgentPanel ────────────────────────────────────────────────────────────

export function AgentPanel() {
  const [activeTab, setActiveTab] = useState<AgentTab>('tasks');
  const { currentLanguage } = useLanguage();
  const isAr = currentLanguage === 'ar';

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const TABS: { id: AgentTab; label: string; icon: React.FC<any>; color: string }[] = [
    { id: 'tasks',   label: isAr ? 'يومي'  : 'Daily',   icon: ListChecks, color: 'text-blue-500'    },
    { id: 'finance', label: isAr ? 'مالي'  : 'Finance', icon: Wallet,     color: 'text-emerald-500' },
    { id: 'habits',  label: isAr ? 'عادات' : 'Habits',  icon: RefreshCw,  color: 'text-violet-500'  },
  ];

  return (
    <div className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 pt-3.5 pb-2.5 border-b border-border/40">
        <Brain className="w-4 h-4 text-primary shrink-0" />
        <span className="text-sm font-black text-foreground">
          {isAr ? 'وكلاء الذكاء' : 'AI Agents'}
        </span>
        <span className="text-[10px] text-muted-foreground/60 flex-1">Agent Layer</span>

        {/* Tab switcher */}
        <div className="flex items-center gap-0.5 bg-muted/50 rounded-lg p-0.5">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold transition-all',
                  active
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <Icon className={cn('w-3 h-3', active && tab.color)} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Panel body */}
      <div className="p-4">
        {activeTab === 'tasks'   && <TaskAgentPanel   />}
        {activeTab === 'finance' && <FinanceAgentPanel />}
        {activeTab === 'habits'  && <HabitAgentPanel  />}
      </div>
    </div>
  );
}
