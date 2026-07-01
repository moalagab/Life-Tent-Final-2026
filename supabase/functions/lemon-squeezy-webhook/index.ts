/**
 * lemon-squeezy-webhook
 *
 * Receives Lemon Squeezy subscription events and updates user_subscriptions.
 *
 * Required env vars (set in Supabase → Project Settings → Edge Functions → Secrets):
 *   LS_WEBHOOK_SECRET       — from Lemon Squeezy → Settings → Webhooks → Signing secret
 *   LS_PRO_VARIANT_IDS      — comma-separated variant IDs for Pro plan (monthly,annual)
 *   LS_BUSINESS_VARIANT_IDS — comma-separated variant IDs for Business plan
 *
 * Injected automatically by Supabase:
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { idempotencyCheck } from "../_shared/upstash.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

// ── Config ────────────────────────────────────────────────────────────────────

const WEBHOOK_SECRET = Deno.env.get("LS_WEBHOOK_SECRET") ?? "";
const PRO_IDS = (Deno.env.get("LS_PRO_VARIANT_IDS") ?? "")
  .split(",").map((s) => s.trim()).filter(Boolean);
const BIZ_IDS = (Deno.env.get("LS_BUSINESS_VARIANT_IDS") ?? "")
  .split(",").map((s) => s.trim()).filter(Boolean);

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Timing-safe HMAC-SHA256 comparison */
async function verifySignature(body: string, signature: string): Promise<boolean> {
  if (!WEBHOOK_SECRET || !signature) return false;
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw", enc.encode(WEBHOOK_SECRET),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
  );
  const signed = await crypto.subtle.sign("HMAC", key, enc.encode(body));
  const computed = Array.from(new Uint8Array(signed))
    .map((b) => b.toString(16).padStart(2, "0")).join("");

  if (computed.length !== signature.length) return false;
  let diff = 0;
  for (let i = 0; i < computed.length; i++) {
    diff |= computed.charCodeAt(i) ^ signature.charCodeAt(i);
  }
  return diff === 0;
}

function mapPlan(variantId: string): "pro" | "business" {
  if (BIZ_IDS.includes(variantId)) return "business";
  if (PRO_IDS.includes(variantId)) return "pro";
  return "pro"; // default: treat any paid variant as pro
}

function mapStatus(
  lsStatus: string,
): "active" | "cancelled" | "expired" | "trial" {
  switch (lsStatus) {
    case "active":    return "active";
    case "on_trial":  return "trial";
    case "cancelled": return "cancelled";
    case "past_due":  return "active"; // still access until period ends
    case "paused":
    case "unpaid":
    case "expired":   return "expired";
    default:          return "active";
  }
}

// ── Main handler ──────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  // 1. Read raw body BEFORE any parsing (signature covers the raw bytes)
  const rawBody = await req.text();
  const signature = req.headers.get("x-signature") ??
    req.headers.get("X-Signature") ?? "";

  // 2. Verify signature — reject early
  if (!(await verifySignature(rawBody, signature))) {
    console.error("[LS] Invalid signature");
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // 3. Parse payload
  // deno-lint-ignore no-explicit-any
  let payload: Record<string, any>;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const eventName: string = payload?.meta?.event_name ?? "";
  // deno-lint-ignore no-explicit-any
  const data: Record<string, any> = payload?.data ?? {};
  // deno-lint-ignore no-explicit-any
  const attrs: Record<string, any> = data?.attributes ?? {};
  // deno-lint-ignore no-explicit-any
  const customData: Record<string, any> = payload?.meta?.custom_data ?? {};

  console.log(`[LS] event=${eventName} variant=${attrs?.variant_id}`);

  // Idempotency: skip duplicate webhook deliveries (Lemon Squeezy retries on timeout)
  const eventId = String(payload?.meta?.event_id ?? payload?.meta?.test_mode ?? `${eventName}-${data?.id}`);
  const isNew = await idempotencyCheck(`ls:${eventId}`, 86400);
  if (!isNew) {
    console.log(`[LS] duplicate event ${eventId} — skipping`);
    return new Response(JSON.stringify({ ok: true, skipped: "duplicate" }), {
      status: 200, headers: { "Content-Type": "application/json" },
    });
  }

  // 4. Admin Supabase client (bypasses RLS)
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  // 5. Resolve user_id
  //    Priority: custom_data.user_id (passed in checkout URL) → email lookup
  let userId: string | null = customData?.user_id ?? null;

  if (!userId && attrs?.user_email) {
    const { data: authUser, error: lookupErr } = await supabase.auth.admin
      .getUserByEmail(String(attrs.user_email));
    if (lookupErr) console.error("[LS] email lookup:", lookupErr.message);
    userId = authUser?.user?.id ?? null;
  }

  if (!userId) {
    // Return 200 so Lemon Squeezy doesn't keep retrying for unknown users
    console.warn(`[LS] user not found for event=${eventName} email=${attrs?.user_email}`);
    return new Response(JSON.stringify({ ok: true, skipped: "user_not_found" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  const lsSubId      = String(data?.id ?? "") || null;
  const lsVariantId  = String(attrs?.variant_id ?? "");
  const lsCustomerId = String(attrs?.customer_id ?? "") || null;
  const lsStatus     = String(attrs?.status ?? "active");
  const plan         = mapPlan(lsVariantId);
  const status       = mapStatus(lsStatus);
  const periodEnd    = (attrs?.renews_at ?? attrs?.ends_at ?? null) as string | null;
  const trialEnds    = (attrs?.trial_ends_at ?? null) as string | null;

  // 6. Route by event
  switch (eventName) {
    // ── Activation ────────────────────────────────────────────────────────────
    case "subscription_created":
    case "subscription_updated":
    case "subscription_resumed":
    case "subscription_unpaused":
    case "subscription_payment_success": {
      const { error } = await supabase.from("user_subscriptions").upsert({
        user_id:            userId,
        plan,
        status,
        ls_subscription_id: lsSubId,
        ls_customer_id:     lsCustomerId,
        ls_variant_id:      lsVariantId || null,
        ls_status:          lsStatus,
        current_period_end: periodEnd,
        trial_ends_at:      trialEnds,
        cancelled_at:       null,
      }, { onConflict: "user_id" });

      if (error) {
        console.error("[LS] upsert error:", error.message);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }
      console.log(`[LS] user=${userId} → plan=${plan} status=${status}`);
      break;
    }

    // ── Cancellation (plan stays active until period ends) ────────────────────
    case "subscription_cancelled": {
      const { error } = await supabase.from("user_subscriptions").upsert({
        user_id:            userId,
        plan,
        status:             "cancelled",
        ls_subscription_id: lsSubId,
        ls_customer_id:     lsCustomerId,
        ls_variant_id:      lsVariantId || null,
        ls_status:          lsStatus,
        current_period_end: periodEnd,
        cancelled_at:       new Date().toISOString(),
      }, { onConflict: "user_id" });

      if (error) {
        console.error("[LS] cancel error:", error.message);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }
      console.log(`[LS] user=${userId} cancelled (active until ${periodEnd})`);
      break;
    }

    // ── Expiry — downgrade to free ─────────────────────────────────────────────
    case "subscription_expired": {
      const { error } = await supabase.from("user_subscriptions").upsert({
        user_id:            userId,
        plan:               "free",
        status:             "expired",
        ls_status:          lsStatus,
        current_period_end: new Date().toISOString(),
      }, { onConflict: "user_id" });

      if (error) {
        console.error("[LS] expire error:", error.message);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }
      console.log(`[LS] user=${userId} downgraded to free`);
      break;
    }

    default:
      console.log(`[LS] unhandled event: ${eventName}`);
  }

  return new Response(JSON.stringify({ ok: true, event: eventName }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
