import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

// ── CORS — restricted to known origins only ──────────────────────────────────
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
    "Access-Control-Allow-Origin":  allowOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

const handler = async (req: Request): Promise<Response> => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Missing Authorization header" }), {
      status: 401,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const [
      profileResult,
      projectsResult,
      tasksResult,
      goalsResult,
      habitsResult,
      habitLogsResult,
      transactionsResult,
      accountsResult,
      budgetsResult,
      eventsResult,
      notesResult,
      coursesResult,
    ] = await Promise.all([
      supabase.from("profiles").select("*").eq("user_id", user.id).single(),
      supabase.from("projects").select("*").order("created_at", { ascending: false }),
      supabase.from("tasks").select("*").order("created_at", { ascending: false }),
      supabase.from("goals").select("*").order("created_at", { ascending: false }),
      supabase.from("habits").select("*").order("created_at", { ascending: false }),
      supabase.from("habit_logs").select("*").order("logged_at", { ascending: false }),
      supabase.from("transactions").select("*").order("date", { ascending: false }),
      supabase.from("accounts").select("*"),
      supabase.from("budgets").select("*"),
      supabase.from("events").select("*").order("start_at", { ascending: false }),
      supabase.from("notes").select("*").order("created_at", { ascending: false }),
      supabase.from("courses").select("*").order("created_at", { ascending: false }),
    ]);

    const exportData = {
      exported_at: new Date().toISOString(),
      user_id:     user.id,
      email:       user.email,
      data: {
        profile:      profileResult.data,
        projects:     projectsResult.data     ?? [],
        tasks:        tasksResult.data        ?? [],
        goals:        goalsResult.data        ?? [],
        habits:       habitsResult.data       ?? [],
        habit_logs:   habitLogsResult.data    ?? [],
        transactions: transactionsResult.data ?? [],
        accounts:     accountsResult.data     ?? [],
        budgets:      budgetsResult.data      ?? [],
        events:       eventsResult.data       ?? [],
        notes:        notesResult.data        ?? [],
        courses:      coursesResult.data      ?? [],
      },
      stats: {
        projects_count:     projectsResult.data?.length     ?? 0,
        tasks_count:        tasksResult.data?.length        ?? 0,
        goals_count:        goalsResult.data?.length        ?? 0,
        habits_count:       habitsResult.data?.length       ?? 0,
        transactions_count: transactionsResult.data?.length ?? 0,
      },
    };

    return new Response(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="life-tent-export-${new Date().toISOString().split("T")[0]}.json"`,
        ...corsHeaders,
      },
    });
  } catch (error: unknown) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Export failed" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

Deno.serve(handler);
