/**
 * semantic-search — Vector similarity search across user data.
 *
 * POST body:
 * {
 *   query: string,
 *   types?: ('tasks' | 'notes' | 'goals')[],  // default: all
 *   topK?: number                               // default: 8
 * }
 *
 * Returns ranked results with type, id, score, and metadata.
 */
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { searchItems } from "../_shared/pinecone.ts";
import { rateLimit } from "../_shared/upstash.ts";

const ALLOWED_ORIGINS = [
  "https://www.lifetent.online",
  "https://lifetent.online",
  "http://localhost:8080",
  "http://localhost:8081",
];

function corsHeaders(req: Request) {
  const origin = req.headers.get("origin") ?? "";
  const allow = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

async function verifyAuth(req: Request): Promise<string | null> {
  const token = req.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) return null;
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
  );
  const { data: { user }, error } = await supabase.auth.getUser(token);
  return error || !user ? null : user.id;
}

Deno.serve(async (req) => {
  const cors = corsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  const userId = await verifyAuth(req);
  if (!userId) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  // Rate limit: 60 searches per minute
  const allowed = await rateLimit(userId, "semantic-search", 60, 60);
  if (!allowed) {
    return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
      status: 429, headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  try {
    const { query, types = ["tasks", "notes", "goals"], topK = 8 } =
      await req.json() as { query: string; types?: string[]; topK?: number };

    if (!query?.trim()) {
      return new Response(JSON.stringify({ error: "query is required" }), {
        status: 400, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    // Search all requested types in parallel
    const searches = (types as ("tasks" | "notes" | "goals")[]).map(type =>
      searchItems(userId, type, query, topK)
        .then(matches => matches.map(m => ({ ...m, type })))
        .catch(() => [])
    );

    const results = (await Promise.all(searches))
      .flat()
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);

    return new Response(JSON.stringify({ results, query }), {
      status: 200, headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[semantic-search]", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
