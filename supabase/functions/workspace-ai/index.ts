/**
 * workspace-ai — Natural language CRUD for any workspace entity.
 *
 * Input:
 *   { command, context: { entity_type, entity_id, entity_title }, workspace_data }
 *
 * Output:
 *   { understood, operations: [{ type, entity, data }] }
 *
 * Operations:
 *   type: "create" | "update" | "delete"
 *   entity: "task" | "initiative" | "goal" | "project" | "table"
 *   data: { ...fields }
 */
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { rateLimit } from "../_shared/upstash.ts";
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
  const allowOrigin = !origin
    ? ALLOWED_ORIGINS[0]
    : ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

// ── Auth ──────────────────────────────────────────────────────────────────────

async function verifyAuth(req: Request): Promise<string | null> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.replace("Bearer ", "");
  const client = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
  );
  const { data: { user }, error } = await client.auth.getUser(token);
  return error || !user ? null : user.id;
}

// ── Gemini helper ─────────────────────────────────────────────────────────────

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") ?? "";
const GEMINI_MODEL   = "gemini-2.0-flash";

async function callGemini(prompt: string): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.1, maxOutputTokens: 800 },
    }),
  });
  if (!res.ok) throw new Error(`Gemini error: ${res.status}`);
  const json = await res.json();
  return json.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
}

// ── Main ──────────────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const userId = await verifyAuth(req);
  if (!userId) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  // Rate limiting: 30 requests per minute per user (Upstash Redis sliding window)
  const allowed = await rateLimit(userId, "workspace-ai", 30, 60);
  if (!allowed) {
    return new Response(JSON.stringify({ error: "Rate limit exceeded. Try again in a minute." }), {
      status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // deno-lint-ignore no-explicit-any
  let body: Record<string, any>;
  try { body = await req.json(); }
  catch { return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }); }

  const command       = String(body.command ?? "").trim();
  const context       = body.context ?? {};
  const workspaceData = body.workspace_data ?? {};

  if (!command) {
    return new Response(JSON.stringify({ error: "command required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const entityLabel = context.entity_title ?? context.entity_type ?? "workspace";
  const tasksList   = (workspaceData.tasks ?? []).slice(0, 10).map((t: { title: string; id: string }) => `- ${t.title} (id:${t.id})`).join("\n") || "لا توجد مهام";
  const initsList   = (workspaceData.initiatives ?? []).slice(0, 5).map((i: { title: string; id: string }) => `- ${i.title} (id:${i.id})`).join("\n") || "لا توجد مبادرات";

  const systemPrompt = `أنت مساعد ذكي لنظام Life Tent OS — نظام إنتاجية شخصي.
المستخدم يعمل داخل workspace: "${entityLabel}" (نوعه: ${context.entity_type ?? 'unknown'}, id: ${context.entity_id ?? 'unknown'}).

المهام الموجودة حالياً:
${tasksList}

المبادرات الموجودة:
${initsList}

أمر المستخدم: "${command}"

حوّل الأمر إلى عمليات JSON. أجب فقط بـ JSON صحيح بهذا الشكل:
{
  "understood": "وصف مختصر بالعربي لما سيتم تنفيذه",
  "operations": [
    {
      "type": "create|update|delete",
      "entity": "task|initiative|goal|project|table",
      "data": { ...الحقول المطلوبة }
    }
  ]
}

قواعد:
- للمهمة الجديدة: data يحتوي title, priority (low/medium/high/urgent), status (todo/in_progress), ${context.entity_type === 'project' ? 'project_id: "' + context.entity_id + '"' : context.entity_type === 'goal' ? 'goal_id: "' + context.entity_id + '"' : 'area_id: "' + context.entity_id + '"'}
- للمبادرة الجديدة: data يحتوي title, description, priority, ${context.entity_type === 'goal' ? 'goal_id: "' + context.entity_id + '"' : context.entity_type === 'project' ? 'project_id: "' + context.entity_id + '"' : 'area_id: "' + context.entity_id + '"'}
- للحذف: data يحتوي id فقط
- للتحديث: data يحتوي id + الحقول المراد تغييرها
- لجدول جديد: data يحتوي title, icon (emoji), entity_type: "${context.entity_type}", entity_id: "${context.entity_id}"
- أولوية: منخفضة=low, متوسطة=medium, عالية=high, عاجلة=urgent
- لا تضف operations فارغة
- إذا الأمر غير واضح أو خطر، اشرح في understood وأعد operations فارغة []`;

  let aiText = "";
  try {
    aiText = await callGemini(systemPrompt);
  } catch (e) {
    console.error("[workspace-ai] Gemini error:", e);
    return new Response(JSON.stringify({ error: "AI unavailable", understood: "فشل الاتصال بالذكاء الاصطناعي", operations: [] }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Extract JSON from response
  const jsonMatch = aiText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return new Response(JSON.stringify({ understood: "لم يتم فهم الأمر، حاول مرة أخرى", operations: [] }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // deno-lint-ignore no-explicit-any
  let result: Record<string, any>;
  try {
    result = JSON.parse(jsonMatch[0]);
  } catch {
    return new Response(JSON.stringify({ understood: "خطأ في معالجة الاستجابة", operations: [] }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  console.log(`[workspace-ai] user=${userId} ops=${result.operations?.length ?? 0}`);

  return new Response(JSON.stringify(result), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
