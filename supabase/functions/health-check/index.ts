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

function corsHeaders(req: Request) {
  const origin = req.headers.get("origin") ?? "";
  const allow = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  };
}

Deno.serve(async (req: Request): Promise<Response> => {
  const cors = corsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: cors });
  }

  const start = Date.now();

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Check DB connectivity
    const { error: dbError } = await supabase
      .from("profiles")
      .select("count", { count: "exact", head: true });

    const dbOk = !dbError;
    const latency = Date.now() - start;

    const status = {
      status: dbOk ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
      latency_ms: latency,
      services: {
        database: dbOk ? "ok" : "error",
        edge_functions: "ok",
      },
      ...(dbError && { db_error: dbError.message }),
    };

    return new Response(JSON.stringify(status), {
      status: dbOk ? 200 : 503,
      headers: { "Content-Type": "application/json", ...cors },
    });
  } catch (error: unknown) {
    return new Response(
      JSON.stringify({
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        latency_ms: Date.now() - start,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 503, headers: { "Content-Type": "application/json", ...cors } }
    );
  }
});
