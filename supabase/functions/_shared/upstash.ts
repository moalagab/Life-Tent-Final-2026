/**
 * _shared/upstash.ts — Upstash Redis utilities for Supabase Edge Functions.
 *
 * Provides:
 *   - rateLimit()     Sliding-window rate limiting (replaces Postgres RPC)
 *   - cache()         Get/set with TTL
 *   - idempotency()   One-time key guard for webhooks
 *   - dedupe()        Prevent duplicate notifications
 */

const REDIS_URL   = Deno.env.get("UPSTASH_REDIS_REST_URL")!;
const REDIS_TOKEN = Deno.env.get("UPSTASH_REDIS_REST_TOKEN")!;

// ── Raw Redis command ─────────────────────────────────────────────────────────

async function redis<T = unknown>(...args: (string | number)[]): Promise<T> {
  const res = await fetch(`${REDIS_URL}/${args.map(encodeURIComponent).join("/")}`, {
    headers: { Authorization: `Bearer ${REDIS_TOKEN}` },
  });
  const json = await res.json() as { result: T; error?: string };
  if (json.error) throw new Error(`[Upstash] ${json.error}`);
  return json.result;
}

// ── Rate limiting — sliding window ───────────────────────────────────────────
// Returns true if the request is allowed, false if rate limited.

export async function rateLimit(
  userId: string,
  fn: string,
  maxRequests: number,
  windowSeconds: number,
): Promise<boolean> {
  const key = `rl:${fn}:${userId}`;
  const now = Date.now();
  const windowMs = windowSeconds * 1000;

  try {
    // MULTI pipeline via pipeline endpoint
    const pipe = await fetch(`${REDIS_URL}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${REDIS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([
        ["ZREMRANGEBYSCORE", key, "-inf", now - windowMs],
        ["ZADD", key, now, `${now}`],
        ["ZCARD", key],
        ["EXPIRE", key, windowSeconds],
      ]),
    });
    const results = await pipe.json() as { result: unknown }[];
    const count = results[2]?.result as number ?? 0;
    return count <= maxRequests;
  } catch (err) {
    console.error("[Upstash] rateLimit error:", err);
    return true; // fail-open to avoid blocking users on Redis outage
  }
}

// ── Cache — get/set with TTL ─────────────────────────────────────────────────

export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const val = await redis<string | null>("GET", key);
    return val ? JSON.parse(val) as T : null;
  } catch {
    return null;
  }
}

export async function cacheSet(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  try {
    await redis("SET", key, JSON.stringify(value), "EX", ttlSeconds);
  } catch (err) {
    console.error("[Upstash] cacheSet error:", err);
  }
}

// ── Idempotency — one-time key guard for webhooks ────────────────────────────
// Returns true if this is the FIRST time we've seen this key (safe to process).
// Returns false if the key was already seen (duplicate — skip processing).

export async function idempotencyCheck(key: string, ttlSeconds = 86400): Promise<boolean> {
  try {
    // SET NX returns "OK" on first set, null if key already exists
    const result = await redis<string | null>("SET", `idempotent:${key}`, "1", "EX", ttlSeconds, "NX");
    return result === "OK";
  } catch {
    return true; // fail-open
  }
}

// ── Deduplication — prevent sending the same notification twice ──────────────
// Returns true if this notification has NOT been sent recently.

export async function dedupeCheck(
  userId: string,
  notifType: string,
  key: string,
  ttlSeconds = 3600,
): Promise<boolean> {
  const redisKey = `dedupe:${notifType}:${userId}:${key}`;
  try {
    const result = await redis<string | null>("SET", redisKey, "1", "EX", ttlSeconds, "NX");
    return result === "OK";
  } catch {
    return true; // fail-open
  }
}
