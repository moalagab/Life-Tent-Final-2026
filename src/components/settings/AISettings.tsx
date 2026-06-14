import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Brain, Trash2, RefreshCw, Clock, Zap, Activity, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import type { AnalysisMode } from '@/hooks/useAIDecisionEngine';

const MODES: AnalysisMode[] = ['morning', 'midday', 'evening', 'full'];

const MODE_LABELS: Record<AnalysisMode, string> = {
  morning: 'الصباح (05:00–11:59)',
  midday: 'منتصف النهار (12:00–14:59)',
  evening: 'المساء (18:00–23:59)',
  full: 'التحليل الكامل',
};

const MODE_TTL: Record<AnalysisMode, string> = {
  morning: '2 ساعة',
  midday: '4 ساعات',
  evening: '8 ساعات',
  full: '4 ساعات',
};

function detectMode(): AnalysisMode {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 15) return 'midday';
  if (hour >= 18) return 'evening';
  return 'full';
}

interface CacheInfo {
  mode: AnalysisMode;
  cachedAt: string | null;
  ageMinutes: number | null;
}

export function AISettings() {
  const { user } = useAuth();
  const userId = user?.id ?? 'anonymous';
  const currentMode = detectMode();

  const [cacheInfos, setCacheInfos] = useState<CacheInfo[]>([]);
  const [cleared, setCleared] = useState<AnalysisMode | null>(null);

  const loadCacheInfos = () => {
    const infos: CacheInfo[] = MODES.map(mode => {
      try {
        const raw = localStorage.getItem(`lt.ai-decision.${userId}.${mode}`);
        if (!raw) return { mode, cachedAt: null, ageMinutes: null };
        const parsed = JSON.parse(raw);
        const computedAt = parsed.computedAt as string;
        const ageMs = Date.now() - new Date(computedAt).getTime();
        return { mode, cachedAt: computedAt, ageMinutes: Math.floor(ageMs / 60000) };
      } catch {
        return { mode, cachedAt: null, ageMinutes: null };
      }
    });
    setCacheInfos(infos);
  };

  useEffect(() => {
    loadCacheInfos();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const clearCache = (mode: AnalysisMode) => {
    try {
      localStorage.removeItem(`lt.ai-decision.${userId}.${mode}`);
      localStorage.removeItem(
        `lt.ai-done-actions.${userId}.${mode}.${format(new Date(), 'yyyy-MM-dd')}`
      );
    } catch { /* ignore */ }
    setCleared(mode);
    setTimeout(() => setCleared(null), 2000);
    loadCacheInfos();
  };

  const clearAllCache = () => {
    MODES.forEach(mode => clearCache(mode));
    // Also clear snapshot flag so next mount records a fresh one
    try {
      localStorage.removeItem(`lt.snapshot-recorded.${userId}.${format(new Date(), 'yyyy-MM-dd')}`);
    } catch { /* ignore */ }
  };

  const hasCached = cacheInfos.some(c => c.cachedAt !== null);

  return (
    <div className="space-y-6">
      {/* Status banner */}
      <div className="p-4 rounded-xl bg-gradient-to-br from-violet-500/10 to-purple-500/10 border border-violet-500/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center shrink-0">
            <Brain className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <h4 className="font-semibold text-foreground">محرك القرار الذكي</h4>
            <p className="text-sm text-muted-foreground">
              يحلل مهامك وعاداتك وأهدافك ليقدم توصيات شخصية مدعومة بـ Gemini 2.5 Flash
            </p>
          </div>
        </div>
      </div>

      {/* Current mode */}
      <div className="p-4 rounded-xl bg-muted/30 border border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>الوضع الحالي</span>
          </div>
          <span className={cn(
            "text-xs font-medium px-2.5 py-1 rounded-full",
            "bg-primary/15 text-primary border border-primary/25"
          )}>
            {MODE_LABELS[currentMode]}
          </span>
        </div>
      </div>

      {/* Analysis modes & cache */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
            <Activity className="w-4 h-4 text-muted-foreground" />
            أوضاع التحليل والكاش
          </h4>
          {hasCached && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-destructive hover:text-destructive h-7"
              onClick={clearAllCache}
            >
              <Trash2 className="w-3 h-3 me-1" />
              مسح الكل
            </Button>
          )}
        </div>

        <div className="space-y-2">
          {cacheInfos.map(info => (
            <div
              key={info.mode}
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg border transition-colors",
                info.mode === currentMode
                  ? "bg-primary/5 border-primary/20"
                  : "bg-muted/20 border-border"
              )}
            >
              <div className={cn(
                "w-2 h-2 rounded-full shrink-0",
                info.cachedAt ? "bg-success" : "bg-muted-foreground/40"
              )} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-medium text-foreground truncate">
                    {MODE_LABELS[info.mode]}
                  </span>
                  {info.mode === currentMode && (
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-primary/20 text-primary shrink-0">
                      الآن
                    </span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {info.cachedAt
                    ? `آخر تحليل: ${format(new Date(info.cachedAt), 'HH:mm')} — منذ ${info.ageMinutes} دقيقة • صلاحية: ${MODE_TTL[info.mode]}`
                    : `لا يوجد كاش • صلاحية: ${MODE_TTL[info.mode]}`}
                </div>
              </div>
              {info.cachedAt && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 shrink-0"
                  onClick={() => clearCache(info.mode)}
                  title="مسح الكاش"
                >
                  {cleared === info.mode
                    ? <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                    : <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />}
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Rate limits info */}
      <div className="p-4 rounded-xl bg-muted/30 border border-border space-y-3">
        <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
          <Zap className="w-4 h-4 text-warning" />
          حدود الاستخدام
        </h4>
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-background/50 border border-border text-center">
            <p className="text-lg font-bold text-foreground">50</p>
            <p className="text-xs text-muted-foreground">قرار / ساعة</p>
          </div>
          <div className="p-3 rounded-lg bg-background/50 border border-border text-center">
            <p className="text-lg font-bold text-foreground">30</p>
            <p className="text-xs text-muted-foreground">مساعد مالي / ساعة</p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          الكاش يقلل الاستهلاك — لن تُستهلك طلبات إضافية حتى انتهاء صلاحية التحليل الحالي
        </p>
      </div>

      {/* How it works */}
      <div className="p-4 rounded-xl bg-muted/30 border border-border space-y-3">
        <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-muted-foreground" />
          كيف يعمل المحرك
        </h4>
        <ul className="space-y-2 text-xs text-muted-foreground">
          <li className="flex items-start gap-2">
            <span className="w-4 h-4 rounded-full bg-violet-500/20 text-violet-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">1</span>
            <span>يجمع بيانات مهامك وعاداتك وأهدافك وإنجازات اليوم والوضع المالي</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-4 h-4 rounded-full bg-violet-500/20 text-violet-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">2</span>
            <span>يحسب درجة أولوية لكل مهمة بناءً على الطاقة المتوقعة وحالة التركيز</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-4 h-4 rounded-full bg-violet-500/20 text-violet-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">3</span>
            <span>يرسل الصورة الكاملة لـ Gemini 2.5 Flash ليولّد توصيات شخصية</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-4 h-4 rounded-full bg-violet-500/20 text-violet-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">4</span>
            <span>يحفظ النتيجة في الكاش المحلي ويعرضها في لوحة التحكم الرئيسية</span>
          </li>
        </ul>
      </div>

      {/* Tip */}
      <div className="flex items-start gap-2 p-3 rounded-lg bg-warning/10 border border-warning/20">
        <AlertCircle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground">
          لتفعيل التحليل الذكي، تأكد من ضبط <code className="font-mono bg-muted px-1 rounded">GEMINI_API_KEY</code> في إعدادات Supabase Edge Functions
        </p>
      </div>

      {/* Clear personalization memory */}
      <div className="p-4 rounded-xl bg-destructive/5 border border-destructive/15">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h4 className="text-sm font-medium text-foreground">إعادة تعيين ذاكرة التخصيص</h4>
            <p className="text-xs text-muted-foreground mt-1">
              يمسح سجل الأنماط السلوكية (30 لقطة). سيبدأ المحرك من صفحة بيضاء.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="shrink-0 text-destructive border-destructive/30 hover:bg-destructive/10"
            onClick={() => {
              try {
                localStorage.removeItem(`lt.personalization.v1.${userId}`);
              } catch { /* ignore */ }
            }}
          >
            <RefreshCw className="w-3.5 h-3.5 me-1.5" />
            إعادة تعيين
          </Button>
        </div>
      </div>
    </div>
  );
}
