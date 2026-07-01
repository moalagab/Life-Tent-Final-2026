/**
 * ai-coach — Claude-powered personal life coach for Life Tent OS.
 *
 * Modes:
 *   "briefing"  — daily morning summary (tasks, habits, goals)
 *   "chat"      — free conversation with full user context
 *   "habit"     — habit-specific coaching after streak break/milestone
 *
 * Uses Claude Sonnet as primary LLM per AI Engineer SKILL.md spec.
 * Implements sliding window context management (max 20 messages).
 * Saves behavioral insights to user_ai_insights table.
 */
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { recallMemories, storeMemory } from "../_shared/pinecone.ts";
import Anthropic from "npm:@anthropic-ai/sdk";
import { createClient } from "jsr:@supabase/supabase-js@2";

// ── CORS ──────────────────────────────────────────────────────────────────────

const ALLOWED_ORIGINS = [
  "https://www.lifetent.online",
  "https://lifetent.online",
  "http://localhost:8080",
  "http://localhost:8081",
  "http://localhost:8082",
  "http://localhost:8083",
  "https://localhost",
  "lifetent://localhost",
  "capacitor://localhost",
  "ionic://localhost",
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

// ── Auth ──────────────────────────────────────────────────────────────────────

async function verifyAuth(req: Request, supabase: ReturnType<typeof createClient>): Promise<string | null> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.replace("Bearer ", "");
  const { data: { user }, error } = await supabase.auth.getUser(token);
  return error || !user ? null : user.id;
}

// ── Context builder ───────────────────────────────────────────────────────────

// deno-lint-ignore no-explicit-any
async function buildUserContext(userId: string, sb: ReturnType<typeof createClient>): Promise<string> {
  const today = new Date().toISOString().split("T")[0];

  const [tasksRes, habitsRes, goalsRes, insightsRes] = await Promise.all([
    sb.from("tasks")
      .select("id, title, status, priority, due_date")
      .in("status", ["backlog", "todo", "in_progress"])
      .order("due_date", { ascending: true })
      .limit(10),

    sb.from("habits")
      .select("id, name, streak, target_days")
      .limit(8),

    sb.from("goals")
      .select("id, title, progress, status")
      .eq("status", "active")
      .limit(5),

    sb.from("user_ai_insights")
      .select("insight_type, content")
      .eq("user_id", userId)
      .or("expires_at.is.null,expires_at.gt." + new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const tasks  = tasksRes.data  ?? [];
  const habits = habitsRes.data ?? [];
  const goals  = goalsRes.data  ?? [];
  const insights = insightsRes.data ?? [];

  const overdue   = tasks.filter((t: any) => t.due_date && t.due_date < today);
  const dueToday  = tasks.filter((t: any) => t.due_date === today);
  const upcoming  = tasks.filter((t: any) => t.due_date && t.due_date > today);
  const pending   = tasks.filter((t: any) => !t.due_date);

  const habitLines = habits.map((h: any) =>
    `- ${h.name}: سلسلة ${h.streak ?? 0} يوم`
  ).join("\n") || "لا توجد عادات مسجلة";

  const goalLines = goals.map((g: any) =>
    `- ${g.title}: ${g.progress ?? 0}% مكتمل`
  ).join("\n") || "لا توجد أهداف نشطة";

  const insightLines = insights.map((i: any) => `- ${i.content}`).join("\n");

  return `
## سياق المستخدم (${today})

**المهام:**
- متأخرة: ${overdue.length} مهمة
- اليوم: ${dueToday.length} مهمة
- قادمة: ${upcoming.length} مهمة
- بدون تاريخ: ${pending.length} مهمة
${dueToday.length > 0 ? `\nأهم مهام اليوم:\n${dueToday.slice(0, 3).map((t: any) => `- ${t.title} [${t.priority}]`).join("\n")}` : ""}
${overdue.length > 0 ? `\nمتأخرة:\n${overdue.slice(0, 3).map((t: any) => `- ${t.title} (كانت ${t.due_date})`).join("\n")}` : ""}

**العادات:**
${habitLines}

**الأهداف:**
${goalLines}
${insightLines ? `\n**ما تعلمته عنك:**\n${insightLines}` : ""}
`.trim();
}

// ── Sliding window context ─────────────────────────────────────────────────────

const MAX_MESSAGES = 20;

// deno-lint-ignore no-explicit-any
function manageContext(messages: any[]): any[] {
  if (messages.length <= MAX_MESSAGES) return messages;
  return messages.slice(-MAX_MESSAGES);
}

// ── System prompts ────────────────────────────────────────────────────────────

const IDENTITY_PROMPT = `أنت مساعد Life Tent الشخصي — مدرب حياة ذكي يعرف سياق حياة المستخدم كاملاً.

قواعد ثابتة:
- تحدث بالعربية المحكية الطبيعية (لا فصحى رسمية جامدة)
- كن مباشراً وإيجابياً — لا تمدح بشكل مبالغ
- لا تعطِ نصائح طبية أو قانونية أو مالية احترافية
- إذا لم تعرف شيئاً، قل "ما عندي معلومة كافية عن هذا"
- احترم خصوصية المستخدم — لا تُحلّل أكثر مما طُلب منك
- لا guilt-tripping أبداً — إذا فشلت سلسلة: "يصير، الأهم تكمل"
- الأرقام بالأرقام الغربية (1,2,3) لا الهندية
- أقصى اقتراحين في الرد الواحد`;

const BRIEFING_INSTRUCTION = `قدّم ملخصاً صباحياً مفيداً ومشجعاً بالعربية المحكية.
يشمل:
1. تحية طبيعية مرتبطة بالوقت
2. أهم 3 مهام لهذا اليوم (مرتبة بالأولوية)
3. العادات التي تحتاج اهتماماً (بدون guilt)
4. تحفيز واحد مرتبط بأهدافه الحقيقية

الأسلوب: محادثة طبيعية، لا bullet points جافة. الطول: 80-120 كلمة.`;

// ── Main ──────────────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
  );

  const userId = await verifyAuth(req, supabaseClient);
  if (!userId) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // deno-lint-ignore no-explicit-any
  let body: Record<string, any>;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const mode: "briefing" | "chat" | "habit" = body.mode ?? "chat";
  const message: string = String(body.message ?? "").trim();
  const sessionMessages: { role: "user" | "assistant"; content: string }[] = body.session_messages ?? [];

  // Build user context from DB
  const userContext = await buildUserContext(userId, supabaseClient);

  // Recall relevant memories from Pinecone (chat mode only)
  let memoryContext = "";
  if (mode === "chat" && message) {
    try {
      const memories = await recallMemories(userId, message, 5);
      const relevant = memories.filter(m => m.score > 0.75);
      if (relevant.length > 0) {
        memoryContext = "\n\n## ذاكرة المحادثات السابقة (ذات صلة):\n" +
          relevant.map(m => `- ${m.metadata?.role ?? "?"}: ${m.metadata?.content ?? m.id}`).join("\n");
      }
    } catch (e) {
      console.warn("[ai-coach] memory recall failed:", e);
    }
  }

  // Store user message in Pinecone for future recall (fire-and-forget)
  if (mode === "chat" && message) {
    const memId = `${userId}:${Date.now()}:user`;
    storeMemory(userId, memId, "user", message).catch(() => {});
  }

  // Select model: Haiku for briefings (short output), Sonnet for chat
  const model = mode === "briefing" ? "claude-haiku-4-5-20251001" : "claude-sonnet-4-6";

  // Build system prompt
  const systemPrompt = [
    IDENTITY_PROMPT,
    "",
    userContext,
    memoryContext,
    ...(mode === "briefing" ? ["", BRIEFING_INSTRUCTION] : []),
  ].join("\n");

  // Build messages array
  const messages = manageContext([
    ...sessionMessages,
    ...(mode === "briefing"
      ? [{ role: "user" as const, content: "قدم لي ملخصي الصباحي" }]
      : message
      ? [{ role: "user" as const, content: message }]
      : []),
  ]);

  if (messages.length === 0) {
    return new Response(JSON.stringify({ error: "message required" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const anthropic = new Anthropic({ apiKey: Deno.env.get("ANTHROPIC_API_KEY") ?? "" });

  // Stream the response
  try {
    const stream = await anthropic.messages.stream({
      model,
      max_tokens: mode === "briefing" ? 400 : 1024,
      system: systemPrompt,
      messages,
    });

    console.log(`[ai-coach] user=${userId} mode=${mode} model=${model}`);

    return new Response(stream.toReadableStream(), {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
      },
    });
  } catch (err) {
    console.error("[ai-coach] Claude error:", err);
    return new Response(
      JSON.stringify({ error: "AI unavailable", message: "فشل الاتصال بالذكاء الاصطناعي" }),
      { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
