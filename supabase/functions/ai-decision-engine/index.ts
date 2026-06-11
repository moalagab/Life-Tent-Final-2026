/**
 * ai-decision-engine — Gemini-powered deep analysis edge function.
 *
 * Called by the frontend when:
 *   - User opens the Morning Brief
 *   - Midday checkpoint fires
 *   - Evening reflection (new)
 *   - User explicitly requests AI analysis
 *   - Sunday morning: weekly summary (new)
 *
 * Input: { profile, tasks, trends, habits, goals, finance, doneToday, mode, userName, isWeekSummary }
 * Output: { brief, coaching, energy_tip, highlight, actions[] }
 */
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

// ── CORS ──────────────────────────────────────────────────────────────────────

const ALLOWED_ORIGINS = [
  "https://www.lifetent.online",
  "https://lifetent.online",
  "http://localhost:8080",
  "http://localhost:8081",
  "http://localhost:8082",
  "http://localhost:8083",
  // Capacitor Android (androidScheme: 'https')
  "https://localhost",
  // Capacitor iOS (scheme: 'lifetent')
  "lifetent://localhost",
  // Fallbacks
  "capacitor://localhost",
  "ionic://localhost",
];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("origin") ?? "";
  // Allow mobile apps with no origin header (native requests)
  const allowOrigin = !origin || ALLOWED_ORIGINS.includes(origin) ? (origin || "*") : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

// ── Auth + Rate Limiting ──────────────────────────────────────────────────────

// Returns the authenticated user's ID, or null if unauthorized.
async function verifyAuth(req: Request): Promise<string | null> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.replace("Bearer ", "");
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
  );
  const { data: { user }, error } = await supabase.auth.getUser(token);
  return error || !user ? null : user.id;
}

// Returns true if the user is within their rate limit window.
async function checkRateLimit(
  userId: string,
  functionName: string,
  maxRequests: number,
  windowSeconds: number,
): Promise<boolean> {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
  );
  const { data, error } = await supabase.rpc("check_rate_limit", {
    p_user_id:        userId,
    p_function:       functionName,
    p_max_requests:   maxRequests,
    p_window_seconds: windowSeconds,
  });
  if (error) {
    // Fail open — log but don't block if the rate limit check itself fails
    console.error("Rate limit check error:", error.message);
    return true;
  }
  return (data as number) <= maxRequests;
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface BehaviorProfile {
  completionRate: number;
  procrastinationScore: number;
  overcommitmentScore: number;
  peakHour: number;
  peakDay: number;
  energyEstimate: number;
  todayRiskLevel: "low" | "medium" | "high";
  insights: string[];
  stalledTaskIds: string[];
  fragileHabitIds: string[];
  distractionPatterns?: string[];
  completedToday?: number;
  focusTaskCount?: number;
  weekendProductivityRatio?: number;
}

interface ScoredTask {
  id: string;
  title: string;
  adaptiveScore: number;
  action: string;
  reasons: string[];
  suggestedTime?: string;
  estimatedMinutes?: number;
}

interface DerivedTrends {
  weeklyCompletionTrend: "improving" | "declining" | "stable";
  avgEnergy: number;
  preferredFocusWindow: "morning" | "afternoon" | "evening" | "unknown";
  totalTasksCompleted: number;
  snapshotCount: number;
}

interface HabitsSummary {
  totalActive: number;
  fragileCount: number;
  todayCompleted: number;
}

interface GoalsSummary {
  activeCount: number;
  avgProgress: number;
}

interface FinanceSummary {
  upcomingBillsCount: number;
  totalUpcomingAmount: number;
  overBudgetCategories: number;
  healthScore: "good" | "warning" | "critical";
}

interface RequestBody {
  profile: BehaviorProfile;
  tasks: ScoredTask[];
  trends: DerivedTrends;
  mode: "morning" | "midday" | "evening" | "full";
  userName?: string;
  habits?: HabitsSummary;
  goals?: GoalsSummary;
  finance?: FinanceSummary;
  doneToday?: number;
  isWeekSummary?: boolean;
}

interface AIAction {
  type: "focus" | "reschedule" | "delegate" | "review" | "habit" | "energy" | "finance";
  title: string;
  description: string;
  taskId?: string | null;
  priority: "high" | "medium" | "low";
  estimated_minutes?: number;
}

interface DailyTopTask {
  title: string;
  why: string;
  estimated_minutes: number;
}

// ── Prompt builder ────────────────────────────────────────────────────────────

function buildPrompt(body: RequestBody): string {
  const { profile, tasks, trends, mode, userName, habits, goals, finance, doneToday = 0, isWeekSummary = false } = body;
  const name     = userName ?? "المستخدم";
  const topTasks = tasks.slice(0, 7);

  const focusWindow =
    trends.preferredFocusWindow === "morning"   ? "الصباح"
    : trends.preferredFocusWindow === "afternoon" ? "بعد الظهر"
    : trends.preferredFocusWindow === "evening"   ? "المساء"
    : "غير محدد";

  const trendLabel =
    trends.weeklyCompletionTrend === "improving" ? "تحسّن 📈"
    : trends.weeklyCompletionTrend === "declining" ? "تراجع 📉"
    : "مستقر ➡️";

  const modeInstruction = (() => {
    if (isWeekSummary) {
      return "هذا الأحد — قدّم مراجعة استراتيجية أسبوعية شاملة. ماذا أنجز؟ ما الذي لم ينجز؟ ما أهم تعديل للأسبوع القادم؟";
    }
    switch (mode) {
      case "morning":
        return "ركّز على خطة اليوم، التحفيز على البداية القوية، وتوزيع الطاقة الصباحية على المهام الأهم.";
      case "midday":
        return "قيّم ما تم إنجازه حتى الآن، أعد تحديد الأولويات للنصف المتبقي، وتحقق من الطاقة الحالية.";
      case "evening":
        return "قدّم مراجعة نهاية اليوم: ما الذي أنجزه المستخدم، ما الذي لم ينجز، وكيف يستعد لغد أفضل. نبرة تأملية وهادئة.";
      default:
        return "قدّم تحليلاً شاملاً لأنماط الأداء وفرص التحسين الاستراتيجية على المدى البعيد.";
    }
  })();

  const habitsSection = habits
    ? `- العادات النشطة: ${habits.totalActive} | مكتملة اليوم: ${habits.todayCompleted} | هشة: ${habits.fragileCount}`
    : "- بيانات العادات غير متاحة";

  const goalsSection = goals
    ? `- الأهداف النشطة: ${goals.activeCount} | متوسط التقدم: ${Math.round(goals.avgProgress)}%`
    : "- بيانات الأهداف غير متاحة";

  const financeSection = finance
    ? `- الصحة المالية: ${finance.healthScore === "good" ? "جيدة ✅" : finance.healthScore === "warning" ? "تحتاج انتباهاً ⚠️" : "حرجة 🔴"}
- فواتير قادمة خلال 7 أيام: ${finance.upcomingBillsCount} (إجمالي: ${finance.totalUpcomingAmount.toFixed(0)})
- فئات تجاوزت الميزانية هذا الشهر: ${finance.overBudgetCategories}`
    : "- البيانات المالية غير متاحة";

  const distractionSection = profile.distractionPatterns?.length
    ? `\n### أنماط التشتت:\n${profile.distractionPatterns.map(p => `- ${p}`).join("\n")}`
    : "";

  const tasksSection = topTasks.length > 0
    ? topTasks.map((t, i) =>
        `${i + 1}. "${t.title}" — نقاط: ${t.adaptiveScore}/100 — إجراء: ${t.action}${t.estimatedMinutes ? ` — تقدير: ${t.estimatedMinutes} دقيقة` : ""}${t.suggestedTime ? ` — وقت مقترح: ${t.suggestedTime}` : ""}`
      ).join("\n")
    : "✅ لا توجد مهام معلقة — أنجز ${doneToday} مهمة اليوم!";

  const completedTodayLine = profile.completedToday !== undefined
    ? `- أُنجز اليوم: ${profile.completedToday} مهمة`
    : "";

  const focusCountLine = profile.focusTaskCount !== undefined
    ? `- مهام التركيز الحالية: ${profile.focusTaskCount}`
    : "";

  return `أنت مساعد ذكاء اصطناعي خبير في الإنتاجية الشخصية وإدارة الوقت والتمويل الشخصي. مهمتك تحليل بيانات المستخدم وتقديم توجيهات دقيقة وقابلة للتنفيذ.

## قواعد الاستجابة:
- تحدث بالعربية المحكية الطبيعية اليومية — لا فصحى رسمية ثقيلة
- كن صريحاً ومحدداً — لا عمومات أو كلام فارغ
- اربط كل توصية ببيانات حقيقية من السياق أدناه
- لا تكرر نفس الفكرة بصياغات مختلفة
- ${modeInstruction}

---

## سياق ${name}:

### ملف الأداء (آخر 30 يوماً):
- معدل الإنجاز: ${profile.completionRate}% ${profile.completionRate >= 80 ? "✅" : profile.completionRate >= 60 ? "⚠️" : "🔴"}
- التسويف: ${profile.procrastinationScore}/100 ${profile.procrastinationScore > 50 ? "(مرتفع)" : "(مقبول)"}
- الإفراط في الالتزام: ${profile.overcommitmentScore}/100
- طاقة اليوم: ${profile.energyEstimate}/5 نجوم
- مستوى الخطر: ${profile.todayRiskLevel === "high" ? "مرتفع 🔴" : profile.todayRiskLevel === "medium" ? "متوسط 🟡" : "منخفض 🟢"}
- ذروة الإنتاجية: الساعة ${profile.peakHour}:00
- مهام متوقفة (+3 أيام): ${profile.stalledTaskIds.length}
${completedTodayLine}
${focusCountLine}
${habitsSection}
${goalsSection}

### الوضع المالي:
${financeSection}

### اتجاه الأسبوع:
- اتجاه الإنجاز: ${trendLabel}
- متوسط الطاقة الأسبوعية: ${trends.avgEnergy.toFixed(1)}/5
- نافذة التركيز المفضلة: ${focusWindow}
- إجمالي المهام المنجزة تاريخياً: ${trends.totalTasksCompleted}
${distractionSection}

### قائمة المهام (الأعلى أولوية أولاً):
${tasksSection}

---

## المطلوب — أجب بـ JSON فقط، بدون أي نص خارجه:
{
  "decisions": [
    "قرار 1 — صِغه كسؤال اتخاذ قرار فعلي مبني على البيانات، مثل: 'هل تؤجّل مهمة X إلى الغد لتحافظ على طاقتك للمهمة الأهم؟'",
    "قرار 2 — قرار مختلف النوع (مالي أو عادة أو تفويض)",
    "قرار 3 — قرار استراتيجي لليوم"
  ],
  "top_tasks": [
    { "title": "عنوان المهمة الأولى من القائمة أعلاه", "why": "سبب كونها الأولى — جملة واحدة مرتبطة بالبيانات", "estimated_minutes": رقم },
    { "title": "المهمة الثانية", "why": "السبب", "estimated_minutes": رقم },
    { "title": "المهمة الثالثة", "why": "السبب", "estimated_minutes": رقم }
  ],
  "biggest_risk": "الخطر الأكبر اليوم في جملة واحدة — مرتبط ببيانات حقيقية (مهمة متأخرة، فاتورة، عادة هشة...)",
  "top_opportunity": "أهم فرصة لليوم في جملة واحدة — شيء إيجابي يمكن تحقيقه بناءً على الطاقة والبيانات",
  "day_forecast": "توقع اليوم في جملتين: كيف سيكون مستوى الإنتاجية والطاقة بناءً على البيانات، وماذا ينتظر المستخدم.",
  "brief": "فقرة واحدة من 3-4 جمل. ابدأ بمؤشر حقيقي من البيانات (إيجابي أو تحدٍّ)، ثم التحليل، ثم رسالة توجيهية واضحة. لا تبدأ بعبارات مثل 'أهلاً' أو 'واضح من البيانات'.",
  "highlight": "إنجاز أو نقطة قوة محددة مستندة للبيانات أعلاه — جملة واحدة.",
  "coaching": "نصيحة تكتيكية واحدة قابلة للتنفيذ الآن — محددة وعملية، مثل: 'ابدأ بمهمة X لأن طاقتك الآن ${profile.energyEstimate}/5'.",
  "energy_tip": "نصيحة قصيرة لإدارة الطاقة مناسبة لمستوى ${profile.energyEstimate}/5 وللوقت من اليوم — جملة واحدة.",
  "actions": [
    {
      "type": "focus|reschedule|delegate|review|habit|energy|finance",
      "title": "عنوان الإجراء (3-6 كلمات)",
      "description": "ما يجب فعله تحديداً — جملة واحدة عملية ومباشرة.",
      "taskId": "معرف المهمة إن ذُكر أو null",
      "priority": "high|medium|low",
      "estimated_minutes": رقم_تقريبي_للدقائق
    }
  ]
}

أنتج 4-5 إجراءات مرتبة من الأعلى أولوية للأدنى. إذا كان الوضع المالي warning أو critical، أضف إجراءً من نوع "finance". إذا كانت هناك عادات هشة، أضف إجراءً من نوع "habit".`;
}

// ── Fallback responses ────────────────────────────────────────────────────────

interface FullAIResponse {
  brief: string;
  highlight: string;
  coaching: string;
  energy_tip: string;
  actions: AIAction[];
  decisions: string[];
  top_tasks: DailyTopTask[];
  biggest_risk: string;
  top_opportunity: string;
  day_forecast: string;
}

function buildFallback(mode: string): FullAIResponse {
  const decisionsFallback = [
    "هل تبدأ بأصعب مهمة الآن أم تُحضّر ذهنك أولاً بمهمة أسهل؟",
    "هل تُبقي جلسة التركيز 90 دقيقة أم تقسّمها على بومودور؟",
    "هل تُفوّض أي مهمة من قائمتك اليوم لتوفير وقتك للأهم؟",
  ];
  const topTasksFallback: DailyTopTask[] = [
    { title: "راجع مهامك وحدد أهم ثلاثة",   why: "الوضوح في البداية يرفع الإنتاجية 40%", estimated_minutes: 10 },
    { title: "أنجز مهمة واحدة بالكامل",       why: "إنجاز مهمة كاملة يُطلق دوبامين يحفّزك", estimated_minutes: 45 },
    { title: "تحقق من مواعيد اليوم",           why: "تجنّب المفاجآت والتعارضات الزمنية",      estimated_minutes: 5  },
  ];

  switch (mode) {
    case "morning":
      return {
        brief: "يوم جديد يبدأ — راجع مهامك وحدد أهم ثلاثة أشياء تريد إنجازها اليوم. الوضوح في الأهداف هو نصف الإنجاز.",
        highlight: "كل يوم تفتح فيه هذا النظام هو خطوة نحو الانضباط.",
        coaching: "ابدأ بأصعب مهمة في قائمتك الآن — عقلك في أفضل حالاته صباحاً.",
        energy_tip: "اشرب كوب ماء قبل البدء — يُنشّط التركيز والذاكرة العاملة.",
        decisions: decisionsFallback,
        top_tasks: topTasksFallback,
        biggest_risk: "عدم تحديد أولويات واضحة قد يُشتّت طاقتك على مهام ثانوية.",
        top_opportunity: "الصباح هو أفضل وقت لإنجاز المهمة الأصعب — لا تضيّع هذه النافذة.",
        day_forecast: "يوم بمستوى طاقة متوسط إلى جيد. ركّز على مهمة أو مهمتين رئيسيتين وحافظ على تدفق العمل.",
        actions: [
          { type: "focus",  title: "حدد مهمتك الأولى",  description: "اختر المهمة الأهم اليوم وابدأ بها مباشرة.", taskId: null, priority: "high",   estimated_minutes: 5  },
          { type: "review", title: "راجع قائمة اليوم",   description: "تأكد أن كل مهمة مجدولة لها وقت محدد.",       taskId: null, priority: "medium", estimated_minutes: 10 },
        ],
      };
    case "midday":
      return {
        brief: "وصلت لمنتصف اليوم — الوقت المثالي لتقييم ما أنجزته وإعادة ترتيب أولوياتك للنصف الثاني.",
        highlight: "كل مهمة أنجزتها اليوم هي خطوة حقيقية للأمام.",
        coaching: "قيّم ثلاث مهام لم تنجزها بعد — هل لا تزال ضرورية؟ أجّل ما يمكن تأجيله.",
        energy_tip: "خذ استراحة 10 دقائق من الشاشة — يُعيد تركيز النصف الثاني من اليوم.",
        decisions: [
          "هل تُكمل المهام المتبقية أم تُعيد ترتيبها حسب الأهمية الحالية؟",
          "هل طاقتك تسمح بجلسة تركيز عميق الآن أم أفضل مهام أقل تعقيداً؟",
          "هل تحتاج تأجيل أي موعد أو التزام لليوم؟",
        ],
        top_tasks: topTasksFallback,
        biggest_risk: "التشتت في النصف الثاني من اليوم بسبب انخفاض الطاقة الطبيعي.",
        top_opportunity: "إنجاز مهمة واحدة كبيرة في الساعتين القادمتين قبل انخفاض الطاقة.",
        day_forecast: "الطاقة في تراجع طبيعي بعد الظهر. خصّص المهام المعقدة للآن وأبقِ المراسلات للمساء.",
        actions: [
          { type: "review",     title: "تقييم التقدم",       description: "راجع كم مهمة أنجزتها مقارنة بالخطة الصباحية.", taskId: null, priority: "high",   estimated_minutes: 5 },
          { type: "reschedule", title: "أعد جدولة المتأخرات", description: "انقل المهام غير المنجزة إلى الغد إن لزم.",      taskId: null, priority: "medium", estimated_minutes: 5 },
        ],
      };
    case "evening":
      return {
        brief: "انتهى يوم آخر — خذ دقيقتين للتأمل فيما أنجزته وما لم ينجز. كل يوم يعلّمك شيئاً عن أسلوبك في العمل.",
        highlight: "إغلاق اليوم بوعي هو عادة المنتجين الحقيقيين.",
        coaching: "سجّل ثلاثة أشياء أنجزتها اليوم قبل النوم — يُعزز الحافز الداخلي.",
        energy_tip: "ابتعد عن الشاشات 30 دقيقة قبل النوم للحصول على نوم أعمق.",
        decisions: [
          "هل تُعدّ قائمة مهام الغد الآن أم تتركها للصباح؟",
          "هل تحتاج إضافة مهام لم تنجزها اليوم إلى قائمة الغد؟",
          "ما الشيء الواحد الذي لو فعلته الغد سيُحسّن مسارك هذا الأسبوع؟",
        ],
        top_tasks: topTasksFallback,
        biggest_risk: "الذهاب للنوم دون تسجيل ما لم ينجز يُفقدك السياق والزخم للغد.",
        top_opportunity: "الاسترخاء الجيد الليلة يُضاعف إنتاجيتك غداً.",
        day_forecast: "وقت للتعافي والاستعداد. ركّز على الراحة وإغلاق الحلقات الذهنية المفتوحة.",
        actions: [
          { type: "review", title: "مراجعة نهاية اليوم",    description: "ما الذي أنجزته اليوم؟ ما الذي تأجّل وسببه؟",       taskId: null, priority: "high",   estimated_minutes: 5  },
          { type: "focus",  title: "خطط لمهمة الغد الأولى", description: "حدد الآن أهم مهمة ستبدأ بها صباح الغد.",           taskId: null, priority: "medium", estimated_minutes: 3  },
          { type: "habit",  title: "تحقق من العادات اليومية", description: "هل سجّلت عاداتك اليوم؟ لا تنسَ قبل النوم.",       taskId: null, priority: "low",    estimated_minutes: 2  },
        ],
      };
    default:
      return {
        brief: "حلّل أنماط أدائك وحدد فرص التحسين للأسبوع القادم.",
        highlight: "استمرارك في استخدام النظام هو في حد ذاته عادة إنتاجية.",
        coaching: "حدد النمط الواحد الذي لو غيّرته سيحدث أكبر فرق في إنتاجيتك.",
        energy_tip: "الراحة الجيدة الليلة تصنع يوماً أفضل غداً.",
        decisions: decisionsFallback,
        top_tasks: topTasksFallback,
        biggest_risk: "الاستمرار في نفس الأنماط دون مراجعة يُبطئ نموك.",
        top_opportunity: "تحليل نمط واحد ضعيف وتغييره يصنع فرقاً كبيراً تراكمياً.",
        day_forecast: "وقت للتحليل الاستراتيجي. راجع بياناتك وحدد أهم تعديل للأسبوع القادم.",
        actions: [
          { type: "review", title: "تحليل أسبوعي", description: "راجع ما أنجزته هذا الأسبوع وما لم ينجز ولماذا.", taskId: null, priority: "high", estimated_minutes: 15 },
        ],
      };
  }
}

// ── Response validator ────────────────────────────────────────────────────────

function validateResponse(data: unknown, mode: string): FullAIResponse {
  if (!data || typeof data !== "object") return buildFallback(mode);
  const d = data as Record<string, unknown>;

  const brief    = typeof d.brief    === "string" && d.brief.length    > 10 ? d.brief    : null;
  const coaching = typeof d.coaching === "string" && d.coaching.length > 10 ? d.coaching : null;
  if (!brief || !coaching) return buildFallback(mode);

  const actions: AIAction[] = [];
  if (Array.isArray(d.actions)) {
    for (const a of d.actions) {
      if (!a || typeof a !== "object") continue;
      const action = a as Record<string, unknown>;
      if (typeof action.title !== "string" || typeof action.description !== "string") continue;
      actions.push({
        type:               (action.type as AIAction["type"])     || "focus",
        title:               action.title,
        description:         action.description,
        taskId:             (action.taskId as string | null)      ?? null,
        priority:           (action.priority as AIAction["priority"]) || "medium",
        estimated_minutes:  typeof action.estimated_minutes === "number" ? action.estimated_minutes : undefined,
      });
    }
  }

  // Validate decisions[]
  const fallback = buildFallback(mode);
  const decisions: string[] = [];
  if (Array.isArray(d.decisions)) {
    for (const dec of d.decisions) {
      if (typeof dec === "string" && dec.length > 5) decisions.push(dec);
    }
  }

  // Validate top_tasks[]
  const top_tasks: DailyTopTask[] = [];
  if (Array.isArray(d.top_tasks)) {
    for (const t of d.top_tasks) {
      if (!t || typeof t !== "object") continue;
      const task = t as Record<string, unknown>;
      if (typeof task.title === "string" && task.title.length > 2) {
        top_tasks.push({
          title:              task.title,
          why:                typeof task.why === "string" ? task.why : "",
          estimated_minutes:  typeof task.estimated_minutes === "number" ? task.estimated_minutes : 30,
        });
      }
    }
  }

  return {
    brief,
    highlight:       typeof d.highlight       === "string" ? d.highlight       : "",
    coaching,
    energy_tip:      typeof d.energy_tip      === "string" ? d.energy_tip      : "",
    biggest_risk:    typeof d.biggest_risk    === "string" ? d.biggest_risk    : fallback.biggest_risk,
    top_opportunity: typeof d.top_opportunity === "string" ? d.top_opportunity : fallback.top_opportunity,
    day_forecast:    typeof d.day_forecast    === "string" ? d.day_forecast    : fallback.day_forecast,
    decisions:       decisions.length  > 0 ? decisions  : fallback.decisions,
    top_tasks:       top_tasks.length  > 0 ? top_tasks  : fallback.top_tasks,
    actions:         actions.length    > 0 ? actions    : fallback.actions,
  };
}

// ── Handler ───────────────────────────────────────────────────────────────────

const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

Deno.serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const userId = await verifyAuth(req);
  if (!userId) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  // 50 AI requests per hour per user
  const withinLimit = await checkRateLimit(userId, "ai-decision-engine", 50, 3600);
  if (!withinLimit) {
    return new Response(JSON.stringify({ error: "تجاوزت الحد المسموح من طلبات الذكاء الاصطناعي. يرجى المحاولة بعد ساعة." }), {
      status: 429,
      headers: { "Content-Type": "application/json", "Retry-After": "3600", ...corsHeaders },
    });
  }

  let body: RequestBody;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) {
    console.error("GEMINI_API_KEY not configured — returning fallback");
    return new Response(JSON.stringify(buildFallback(body.mode)), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  const prompt = buildPrompt(body);

  let geminiRes: Response;
  try {
    geminiRes = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature:       0.55,   // Slightly lower for more consistent structure
          maxOutputTokens:   2048,   // More room for evening/full modes
          responseMimeType:  "application/json",
        },
      }),
    });
  } catch (networkErr) {
    console.error("Gemini network error:", networkErr);
    return new Response(JSON.stringify(buildFallback(body.mode)), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  if (!geminiRes.ok) {
    const errText = await geminiRes.text();
    console.error(`Gemini API ${geminiRes.status}:`, errText);
    return new Response(JSON.stringify(buildFallback(body.mode)), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  let rawText = "{}";
  try {
    const geminiData = await geminiRes.json();
    rawText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";
  } catch (parseErr) {
    console.error("Gemini response parse error:", parseErr);
    return new Response(JSON.stringify(buildFallback(body.mode)), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    parsed = null;
  }

  const validated = validateResponse(parsed, body.mode);

  return new Response(JSON.stringify(validated), {
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
});
