/**
 * ai-decision-engine — Gemini-powered deep analysis edge function.
 *
 * Called by the frontend when:
 *   - User opens the Morning Brief
 *   - Midday checkpoint fires
 *   - User explicitly requests AI analysis
 *
 * Input: { profile, tasks, trends, habits, goals, doneToday, mode, userName }
 * Output: { brief, coaching, energy_tip, highlight, actions[] }
 */
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const ALLOWED_ORIGINS = [
  "https://www.lifetent.online",
  "https://lifetent.online",
  "http://localhost:8080",
  "http://localhost:8081",
  "http://localhost:8082",
  "http://localhost:8083",
];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("origin") ?? "";
  const allowOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

async function verifyAuth(req: Request): Promise<boolean> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return false;
  const token = authHeader.replace("Bearer ", "");
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
  );
  const { error } = await supabase.auth.getUser(token);
  return !error;
}

const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

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
}

interface ScoredTask {
  id: string;
  title: string;
  adaptiveScore: number;
  action: string;
  reasons: string[];
  suggestedTime?: string;
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

interface RequestBody {
  profile: BehaviorProfile;
  tasks: ScoredTask[];
  trends: DerivedTrends;
  mode: "morning" | "midday" | "full";
  userName?: string;
  habits?: HabitsSummary;
  goals?: GoalsSummary;
  doneToday?: number;
}

interface AIAction {
  type: "focus" | "reschedule" | "delegate" | "review" | "habit" | "energy";
  title: string;
  description: string;
  taskId?: string | null;
  priority: "high" | "medium" | "low";
  estimated_minutes?: number;
}

function buildPrompt(body: RequestBody): string {
  const { profile, tasks, trends, mode, userName, habits, goals, doneToday = 0 } = body;
  const name = userName ?? "المستخدم";
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

  const modeInstruction =
    mode === "morning"
      ? "ركّز على خطة اليوم، التحفيز على البداية القوية، وتوزيع الطاقة على المهام."
      : mode === "midday"
      ? "قيّم ما تم إنجازه حتى الآن، أعد تحديد الأولويات للنصف المتبقي من اليوم."
      : "قدّم تحليلاً شاملاً لأنماط الأداء وفرص التحسين الاستراتيجية.";

  const habitsSection = habits
    ? `- العادات النشطة: ${habits.totalActive} | مكتملة اليوم: ${habits.todayCompleted} | هشة: ${habits.fragileCount}`
    : "- بيانات العادات غير متاحة";

  const goalsSection = goals
    ? `- الأهداف النشطة: ${goals.activeCount} | متوسط التقدم: ${Math.round(goals.avgProgress)}%`
    : "- بيانات الأهداف غير متاحة";

  const distractionSection = profile.distractionPatterns?.length
    ? `\n### أنماط التشتت:\n${profile.distractionPatterns.map(p => `- ${p}`).join("\n")}`
    : "";

  return `أنت مساعد ذكاء اصطناعي خبير في الإنتاجية الشخصية وإدارة الوقت. مهمتك تحليل بيانات المستخدم وتقديم توجيهات دقيقة وقابلة للتنفيذ فوراً.

## قواعد الاستجابة:
- تحدث بالعربية الفصحى البسيطة فقط
- كن صريحاً ومحدداً — لا عمومات
- اربط كل توصية ببيانات حقيقية من السياق
- لا تكرر نفس الفكرة
- ${modeInstruction}

---

## سياق ${name} الآن:

### ملف الأداء (آخر 30 يوماً):
- معدل الإنجاز: ${profile.completionRate}% ${profile.completionRate >= 80 ? "✅" : profile.completionRate >= 60 ? "⚠️" : "🔴"}
- التسويف: ${profile.procrastinationScore}/100 ${profile.procrastinationScore > 50 ? "(مرتفع)" : "(مقبول)"}
- الإفراط في الالتزام: ${profile.overcommitmentScore}/100
- طاقة اليوم: ${profile.energyEstimate}/5 نجوم
- مستوى الخطر: ${profile.todayRiskLevel === "high" ? "مرتفع 🔴" : profile.todayRiskLevel === "medium" ? "متوسط 🟡" : "منخفض 🟢"}
- ذروة الإنتاجية: الساعة ${profile.peakHour}:00
- المهام المتوقفة (أكثر من 3 أيام): ${profile.stalledTaskIds.length}
- المهام المنجزة اليوم: ${doneToday}
${habitsSection}
${goalsSection}

### اتجاه الأسبوع:
- اتجاه الإنجاز: ${trendLabel}
- متوسط الطاقة الأسبوعية: ${trends.avgEnergy.toFixed(1)}/5
- نافذة التركيز المفضلة: ${focusWindow}
- إجمالي المهام المنجزة تاريخياً: ${trends.totalTasksCompleted}
${distractionSection}

### قائمة المهام المرتبة (الأعلى أولوية):
${topTasks.map((t, i) => `${i + 1}. "${t.title}" — نقاط التكيف: ${t.adaptiveScore}/100 — التوصية: ${t.action}${t.suggestedTime ? ` — الوقت المقترح: ${t.suggestedTime}` : ""}`).join("\n")}

---

## المطلوب — أجب بـ JSON فقط (بدون markdown):
{
  "brief": "فقرة واحدة من 3-4 جمل تحلل وضع ${name} اليوم بدقة. ابدأ بمؤشر إيجابي واحد، ثم التحدي الرئيسي، ثم رسالة توجيهية واضحة.",
  "highlight": "إنجاز أو نقطة قوة واحدة محددة تستحق الإشارة (جملة واحدة، استناداً للبيانات أعلاه)",
  "coaching": "نصيحة تكتيكية واحدة قابلة للتنفيذ الآن — مثال: 'ابدأ بمهمة X لأن الطاقة اليوم مناسبة لها'",
  "energy_tip": "نصيحة قصيرة لإدارة الطاقة بناءً على مستوى ${profile.energyEstimate}/5 والوقت من اليوم (جملة واحدة)",
  "actions": [
    {
      "type": "focus|reschedule|delegate|review|habit|energy",
      "title": "عنوان الإجراء (3-6 كلمات)",
      "description": "ما يجب فعله تحديداً (جملة واحدة عملية)",
      "taskId": "معرف المهمة إن وُجد أو null",
      "priority": "high|medium|low",
      "estimated_minutes": رقم_دقائق_التنفيذ_التقريبية
    }
  ]
}

أنتج 4-5 إجراءات مستندة للبيانات. رتّبها من الأعلى أولوية إلى الأدنى.`;
}

function buildFallback(mode: string): { brief: string; highlight: string; coaching: string; energy_tip: string; actions: AIAction[] } {
  if (mode === "morning") {
    return {
      brief: "يوم جديد يبدأ — راجع مهامك وحدد أهم ثلاثة أشياء تريد إنجازها اليوم. الوضوح في الأهداف هو نصف الإنجاز.",
      highlight: "وصلت إلى هنا وهذا يستحق الاعتراف.",
      coaching: "ابدأ بأصعب مهمة في قائمتك الآن — عقلك في أفضل حالاته في الصباح.",
      energy_tip: "اشرب كوب ماء قبل البدء — يساعد على التركيز وتنشيط الذاكرة العاملة.",
      actions: [
        { type: "focus", title: "حدد مهمتك الأولى", description: "اختر المهمة الأهم اليوم وابدأ بها مباشرة.", taskId: null, priority: "high", estimated_minutes: 5 },
        { type: "review", title: "راجع قائمة اليوم", description: "تأكد أن كل مهمة مجدولة لها وقت محدد.", taskId: null, priority: "medium", estimated_minutes: 10 },
      ],
    };
  }
  if (mode === "midday") {
    return {
      brief: "وصلت لمنتصف اليوم — الوقت المثالي لتقييم ما أنجزته وإعادة ترتيب أولوياتك للنصف الثاني.",
      highlight: "كل مهمة أنجزتها اليوم هي خطوة حقيقية للأمام.",
      coaching: "قيّم ثلاث مهام لم تنجزها بعد — هل لا تزال ضرورية؟ أجّل ما يمكن تأجيله.",
      energy_tip: "خذ استراحة 10 دقائق من الشاشة — يساعد على استعادة تركيز بقية اليوم.",
      actions: [
        { type: "review", title: "تقييم التقدم", description: "راجع كم مهمة أنجزتها مقارنة بالخطة الصباحية.", taskId: null, priority: "high", estimated_minutes: 5 },
        { type: "reschedule", title: "أعد جدولة المتأخرات", description: "انقل المهام غير المنجزة إلى الغد إن لزم.", taskId: null, priority: "medium", estimated_minutes: 5 },
      ],
    };
  }
  return {
    brief: "حلّل أنماط أدائك الأسبوعية وحدد فرص التحسين للأسبوع القادم.",
    highlight: "استمرارك في استخدام النظام هو في حد ذاته عادة إنتاجية.",
    coaching: "حدد النمط الوحيد الذي لو غيّرته سيحدث أكبر فرق في إنتاجيتك.",
    energy_tip: "الراحة الجيدة الليلة تصنع يوماً أفضل غداً.",
    actions: [
      { type: "review", title: "تحليل أسبوعي", description: "راجع ما أنجزته هذا الأسبوع وما لم ينجز.", taskId: null, priority: "high", estimated_minutes: 15 },
    ],
  };
}

Deno.serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const authenticated = await verifyAuth(req);
  if (!authenticated) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  try {
    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "GEMINI_API_KEY not configured" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const body: RequestBody = await req.json();
    const prompt = buildPrompt(body);

    const geminiRes = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.65,
          maxOutputTokens: 1536,
          responseMimeType: "application/json",
        },
      }),
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error(`Gemini API error ${geminiRes.status}:`, errText);
      // Return intelligent fallback instead of 500
      return new Response(JSON.stringify(buildFallback(body.mode)), {
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const geminiData = await geminiRes.json();
    const rawText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";

    let parsed: ReturnType<typeof buildFallback>;
    try {
      parsed = JSON.parse(rawText);
      // Ensure required fields exist
      if (!parsed.brief) parsed = buildFallback(body.mode);
    } catch {
      parsed = buildFallback(body.mode);
    }

    return new Response(JSON.stringify(parsed), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (err) {
    console.error("ai-decision-engine error:", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
