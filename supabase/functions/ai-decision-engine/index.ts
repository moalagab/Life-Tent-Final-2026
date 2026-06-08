/**
 * ai-decision-engine — Gemini-powered deep analysis edge function.
 *
 * Called by the frontend when:
 *   - User opens the Morning Brief
 *   - Midday checkpoint fires
 *   - User explicitly requests AI analysis
 *
 * Input: { profile: BehaviorProfile, tasks: ScoredTask[], trends: DerivedTrends, mode: 'morning'|'midday'|'full' }
 * Output: { brief: string, actions: AIAction[], coaching: string }
 */
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

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

interface RequestBody {
  profile: BehaviorProfile;
  tasks: ScoredTask[];
  trends: DerivedTrends;
  mode: "morning" | "midday" | "full";
  userName?: string;
}

interface AIAction {
  type: "focus" | "reschedule" | "delegate" | "review" | "habit" | "energy";
  title: string;
  description: string;
  taskId?: string;
  priority: "high" | "medium" | "low";
}

function buildPrompt(body: RequestBody): string {
  const { profile, tasks, trends, mode, userName } = body;
  const name = userName ?? "المستخدم";
  const topTasks = tasks.slice(0, 5);

  const modeLabel =
    mode === "morning" ? "إحاطة الصباح"
    : mode === "midday" ? "نقطة التفتيش في منتصف اليوم"
    : "تحليل شامل";

  return `أنت مساعد ذكاء اصطناعي متخصص في إدارة الوقت والإنتاجية الشخصية. تحدث بالعربية فقط. كن مباشراً وعملياً.

## ${modeLabel} لـ ${name}

### ملف السلوك اليوم:
- معدل الإنجاز (30 يوم): ${profile.completionRate}%
- درجة التسويف: ${profile.procrastinationScore}/100
- الإفراط في الالتزامات: ${profile.overcommitmentScore}/100
- مستوى الطاقة اليوم: ${profile.energyEstimate}/5
- مستوى الخطر: ${profile.todayRiskLevel}
- المهام المتوقفة: ${profile.stalledTaskIds.length}
- العادات الهشة: ${profile.fragileHabitIds.length}

### اتجاهات الأسبوع:
- اتجاه الإنجاز: ${trends.weeklyCompletionTrend === "improving" ? "تحسّن" : trends.weeklyCompletionTrend === "declining" ? "تراجع" : "مستقر"}
- متوسط الطاقة: ${trends.avgEnergy}/5
- نافذة التركيز المفضلة: ${trends.preferredFocusWindow}
- إجمالي المهام المنجزة: ${trends.totalTasksCompleted}

### أهم المهام اليوم (بعد الترتيب التكيفي):
${topTasks.map((t, i) => `${i + 1}. "${t.title}" — نقاط: ${t.adaptiveScore} — إجراء: ${t.action} — أسباب: ${t.reasons.join(", ")}`).join("\n")}

## المطلوب منك (أجب بـ JSON فقط، بدون markdown code block):
{
  "brief": "فقرة واحدة (3-4 جمل) تلخص وضع اليوم بأسلوب تحفيزي وصريح، مخصصة لـ ${name}",
  "coaching": "نصيحة واحدة محددة وقابلة للتنفيذ الآن (جملة واحدة أو اثنتان)",
  "actions": [
    {
      "type": "focus|reschedule|delegate|review|habit|energy",
      "title": "عنوان قصير للإجراء",
      "description": "وصف قابل للتنفيذ (جملة واحدة)",
      "taskId": "معرف المهمة إن وُجد أو null",
      "priority": "high|medium|low"
    }
  ]
}

أنتج 3-5 إجراءات ذات صلة فعلية بالبيانات أعلاه. لا تخترع بيانات.`;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  try {
    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "GEMINI_API_KEY not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
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
          temperature: 0.7,
          maxOutputTokens: 1024,
          responseMimeType: "application/json",
        },
      }),
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      throw new Error(`Gemini API error ${geminiRes.status}: ${errText}`);
    }

    const geminiData = await geminiRes.json();
    const rawText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";

    // Parse and validate
    let parsed: { brief: string; coaching: string; actions: AIAction[] };
    try {
      parsed = JSON.parse(rawText);
    } catch {
      // Fallback if Gemini returns malformed JSON
      parsed = {
        brief: "تحليل يومك الآن — راجع مهامك وابدأ بالأهم.",
        coaching: "ركّز على مهمة واحدة فقط في الساعة القادمة.",
        actions: [],
      };
    }

    return new Response(JSON.stringify(parsed), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
});
