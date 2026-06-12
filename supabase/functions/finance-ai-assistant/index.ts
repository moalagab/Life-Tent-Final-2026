/**
 * finance-ai-assistant — Gemini-powered financial AI assistant.
 *
 * Streams responses in OpenAI-compatible SSE format so the frontend
 * needs no changes (parses data.choices[0].delta.content).
 *
 * Previously used Lovable AI gateway — now calls Gemini directly.
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
  "https://localhost",
  "lifetent://localhost",
  "capacitor://localhost",
  "ionic://localhost",
];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("origin") ?? "";
  const allowOrigin = !origin || ALLOWED_ORIGINS.includes(origin) ? (origin || "*") : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

// ── Auth + Rate Limiting ──────────────────────────────────────────────────────

async function verifyAuth(req: Request): Promise<string | null> {
  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) return null;
  const token = authHeader.replace("Bearer ", "");
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
  );
  const { data: { user }, error } = await supabase.auth.getUser(token);
  return error || !user ? null : user.id;
}

async function checkRateLimit(
  userId: string,
  functionName: string,
  maxRequests: number,
  windowSeconds: number,
): Promise<boolean> {
  // Must use service_role key — the RPC has REVOKE EXECUTE FROM anon
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY") ?? "",
  );
  const { data, error } = await supabase.rpc("check_rate_limit", {
    p_user_id:        userId,
    p_function:       functionName,
    p_max_requests:   maxRequests,
    p_window_seconds: windowSeconds,
  });
  if (error) {
    console.error("Rate limit check error:", error.message);
    return true;
  }
  return (data as number) <= maxRequests;
}

// ── System prompts ────────────────────────────────────────────────────────────

function buildSystemPrompt(type: string, context: unknown): string {
  const ctxStr = context ? JSON.stringify(context, null, 2) : "لا توجد بيانات";

  switch (type) {
    case "finance-assistant":
      return `أنت مساعد مالي ذكي باللغة العربية. تساعد المستخدمين في:
- تحليل المصروفات والإيرادات
- تقديم نصائح مالية مخصصة
- المساعدة في وضع الميزانيات
- تحليل الديون واستراتيجيات السداد
- تقديم رؤى حول الادخار والاستثمار

السياق المالي الحالي:
${ctxStr}

قواعد: كن موجزاً ومفيداً، قدم نصائح عملية، استخدم الأرقام والنسب عند الإمكان.`;

    case "spending-analysis":
      return `أنت محلل مصروفات ذكي. حلل البيانات التالية وقدم:
1. تحليل أنماط الإنفاق
2. المجالات القابلة للتقليص
3. مقارنة الإنفاق الفعلي بالميزانية
4. توصيات محددة للتحسين

البيانات: ${ctxStr}`;

    case "debt-strategy":
      return `أنت خبير في استراتيجيات سداد الديون. قدم:
1. تحليل الديون الحالية
2. خطة سداد مُحسّنة
3. مقارنة استراتيجية كرة الثلج والانهيار الجليدي
4. التوفير المحتمل في الفوائد

معلومات الديون: ${ctxStr}`;

    case "budget-suggestions":
      return `أنت مستشار ميزانية محترف. بناءً على البيانات:
1. اقترح توزيع الميزانية الأمثل
2. حدد أولويات الإنفاق
3. اقترح صناديق ادخار مناسبة
4. نصائح لتحقيق الأهداف المالية

البيانات المالية: ${ctxStr}`;

    default:
      return "أنت مساعد ذكي متعدد الاستخدامات. ساعد المستخدم بشكل احترافي ومفيد.";
  }
}

// ── Gemini streaming → OpenAI SSE transformer ────────────────────────────────

/**
 * Reads Gemini's SSE stream and re-emits each text chunk in
 * OpenAI-compatible format: `data: {"choices":[{"delta":{"content":"…"}}]}`
 *
 * Gemini SSE chunk shape:
 * data: {"candidates":[{"content":{"parts":[{"text":"…"}]}}]}
 */
function transformGeminiStream(geminiBody: ReadableStream<Uint8Array>): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  let buffer = "";

  return new ReadableStream({
    async start(controller) {
      const reader = geminiBody.getReader();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? ""; // keep incomplete last line

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const raw = line.slice(6).trim();
            if (!raw || raw === "[DONE]") continue;

            let text = "";
            try {
              const parsed = JSON.parse(raw);
              text = parsed?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
            } catch {
              continue;
            }

            if (!text) continue;

            // Emit in OpenAI-compatible format
            const openaiChunk = JSON.stringify({
              choices: [{ delta: { content: text }, finish_reason: null, index: 0 }],
            });
            controller.enqueue(encoder.encode(`data: ${openaiChunk}\n\n`));
          }
        }

        // Flush remaining buffer
        if (buffer.startsWith("data: ")) {
          const raw = buffer.slice(6).trim();
          if (raw && raw !== "[DONE]") {
            try {
              const parsed = JSON.parse(raw);
              const text = parsed?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
              if (text) {
                const openaiChunk = JSON.stringify({
                  choices: [{ delta: { content: text }, finish_reason: null, index: 0 }],
                });
                controller.enqueue(encoder.encode(`data: ${openaiChunk}\n\n`));
              }
            } catch { /* skip */ }
          }
        }

        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      } catch (err) {
        console.error("Stream transform error:", err);
      } finally {
        controller.close();
      }
    },
  });
}

// ── Handler ───────────────────────────────────────────────────────────────────

const GEMINI_STREAM_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse";

Deno.serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const userId = await verifyAuth(req);
  if (!userId) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // 30 finance AI requests per hour per user
  const withinLimit = await checkRateLimit(userId, "finance-ai-assistant", 30, 3600);
  if (!withinLimit) {
    return new Response(JSON.stringify({ error: "تجاوزت الحد المسموح من طلبات المساعد المالي. يرجى المحاولة بعد ساعة." }), {
      status: 429,
      headers: { ...corsHeaders, "Content-Type": "application/json", "Retry-After": "3600" },
    });
  }

  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "GEMINI_API_KEY not configured" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  let messages: { role: string; content: string }[];
  let type: string;
  let context: unknown;

  try {
    ({ messages, type, context } = await req.json());
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const systemPrompt = buildSystemPrompt(type, context);

  // Convert messages to Gemini contents format
  const geminiContents = [
    { role: "user", parts: [{ text: systemPrompt }] },
    { role: "model", parts: [{ text: "مفهوم. كيف يمكنني مساعدتك؟" }] },
    ...messages.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    })),
  ];

  let geminiRes: Response;
  try {
    geminiRes = await fetch(`${GEMINI_STREAM_URL}&key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: geminiContents,
        generationConfig: {
          temperature:     0.7,
          maxOutputTokens: 2048,
        },
      }),
    });
  } catch (networkErr) {
    console.error("Gemini network error:", networkErr);
    return new Response(
      JSON.stringify({ error: "تعذّر الاتصال بالمساعد الذكي. يرجى المحاولة لاحقاً." }),
      { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  if (!geminiRes.ok) {
    const errText = await geminiRes.text();
    console.error(`Gemini API ${geminiRes.status}:`, errText);

    if (geminiRes.status === 429) {
      return new Response(
        JSON.stringify({ error: "تم تجاوز حد الطلبات. يرجى المحاولة لاحقاً." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    return new Response(
      JSON.stringify({ error: "حدث خطأ في الخدمة. يرجى المحاولة لاحقاً." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  if (!geminiRes.body) {
    return new Response(
      JSON.stringify({ error: "لم يُعَد أي محتوى من المساعد." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const transformed = transformGeminiStream(geminiRes.body);

  return new Response(transformed, {
    headers: {
      ...corsHeaders,
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "X-Accel-Buffering": "no",
    },
  });
});
