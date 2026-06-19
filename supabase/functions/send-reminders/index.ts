/**
 * send-reminders — Scans upcoming tasks / habits / events and dispatches
 * push notifications to subscribed users.
 *
 * Called in two ways:
 *   1. From the frontend (user JWT)  → sends reminders for that user only.
 *   2. From a scheduled cron job (service role) → fans out to all subscribers.
 *
 * Cron setup (pg_cron + pg_net, available on Supabase free tier):
 *   SELECT cron.schedule(
 *     'send-reminders-hourly',
 *     '0 7,9,12,18 * * *',
 *     $$ SELECT net.http_post(
 *          url    := '<SUPABASE_URL>/functions/v1/send-reminders',
 *          headers := jsonb_build_object(
 *            'Content-Type',  'application/json',
 *            'Authorization', 'Bearer <SERVICE_ROLE_KEY>'
 *          ),
 *          body   := '{}'::jsonb
 *        ) $$
 *   );
 */
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL      = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const ANON_KEY          = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

if (!SERVICE_ROLE_KEY) {
  throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured");
}

const CORS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function today(): string {
  return new Date().toISOString().split("T")[0];
}

function in90min(): string {
  return new Date(Date.now() + 90 * 60 * 1000).toISOString();
}

async function dispatchPush(userId: string, title: string, body: string, url: string) {
  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/send-push`, {
      method: "POST",
      headers: {
        "Content-Type":  "application/json",
        "Authorization": `Bearer ${SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({ user_id: userId, title, body, url }),
    });
    return res.status;
  } catch {
    return 0;
  }
}

// ── Per-user reminder logic ────────────────────────────────────────────────────

async function sendForUser(
  admin: ReturnType<typeof createClient>,
  userId: string,
  sent: { userId: string; type: string; status: number }[],
) {
  const todayStr  = today();
  const in90minTs = in90min();
  const nowTs     = new Date().toISOString();

  // ── Tasks due today (not done) ────────────────────────────────────────────
  const { data: tasks } = await admin
    .from("tasks")
    .select("id, title, due_date")
    .eq("user_id", userId)
    .eq("due_date", todayStr)
    .not("status", "in", '("done","cancelled")');

  if (tasks && tasks.length > 0) {
    const names = tasks.slice(0, 2).map((t: { title: string }) => t.title).join(" • ");
    const title = tasks.length === 1
      ? `📋 مهمة مستحقة اليوم`
      : `📋 ${tasks.length} مهام مستحقة اليوم`;
    const status = await dispatchPush(userId, title, names, "/tasks");
    sent.push({ userId, type: "tasks", status });
  }

  // ── Active habits not yet logged today ────────────────────────────────────
  const [habitsRes, logsRes] = await Promise.all([
    admin.from("habits").select("id, name").eq("user_id", userId).eq("is_active", true),
    admin.from("habit_logs").select("habit_id").eq("user_id", userId).eq("completed_at", todayStr),
  ]);
  const doneIds      = new Set(((logsRes.data ?? []) as { habit_id: string }[]).map((l) => l.habit_id));
  const pending      = ((habitsRes.data ?? []) as { id: string; name: string }[]).filter((h) => !doneIds.has(h.id));
  if (pending.length > 0) {
    const names  = pending.slice(0, 2).map((h) => h.name).join(" • ");
    const title  = pending.length === 1
      ? `🔄 عادة لم تكتمل بعد`
      : `🔄 ${pending.length} عادات لم تكتمل بعد`;
    const status = await dispatchPush(userId, title, names, "/habits");
    sent.push({ userId, type: "habits", status });
  }

  // ── Events starting within the next 90 minutes ───────────────────────────
  const { data: events } = await admin
    .from("events")
    .select("id, title, start_time")
    .eq("user_id", userId)
    .gte("start_time", nowTs)
    .lte("start_time", in90minTs)
    .order("start_time", { ascending: true })
    .limit(3);

  for (const ev of (events ?? []) as { id: string; title: string; start_time: string }[]) {
    const minutesLeft = Math.round((new Date(ev.start_time).getTime() - Date.now()) / 60000);
    const body   = `يبدأ خلال ${minutesLeft} دقيقة`;
    const status = await dispatchPush(userId, `📅 ${ev.title}`, body, "/calendar");
    sent.push({ userId, type: "event", status });
  }
}

// ── Handler ───────────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });

  const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  const authHeader  = req.headers.get("Authorization") ?? "";

  // Resolve target user IDs
  let userIds: string[];

  if (authHeader && authHeader !== `Bearer ${SERVICE_ROLE_KEY}`) {
    // User-level call — identify caller via JWT
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: CORS });
    }
    userIds = [user.id];
  } else {
    // Service role call (cron) — send for all subscribed users
    const { data: subs } = await adminClient
      .from("push_subscriptions")
      .select("user_id");
    userIds = [...new Set(((subs ?? []) as { user_id: string }[]).map((s) => s.user_id))];
  }

  if (!userIds.length) {
    return new Response(
      JSON.stringify({ processed: 0, sent: [] }),
      { status: 200, headers: { ...CORS, "Content-Type": "application/json" } },
    );
  }

  const sent: { userId: string; type: string; status: number }[] = [];

  await Promise.allSettled(userIds.map((uid) => sendForUser(adminClient, uid, sent)));

  return new Response(
    JSON.stringify({ processed: userIds.length, sent }),
    { status: 200, headers: { ...CORS, "Content-Type": "application/json" } },
  );
});
