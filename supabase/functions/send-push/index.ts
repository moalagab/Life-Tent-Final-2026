/**
 * send-push — VAPID Web Push notification sender.
 *
 * Called by other edge functions (e.g. scheduled jobs, triggers) or
 * directly from the frontend (admin only).
 *
 * Required secrets:
 *   VAPID_PUBLIC_KEY   — base64url VAPID public key
 *   VAPID_PRIVATE_KEY  — base64url VAPID private key
 *   VAPID_SUBJECT      — mailto: or https: contact URI
 *
 * Body (JSON):
 *   user_id  — target user
 *   title    — notification title
 *   body     — notification body
 *   url?     — optional deep-link URL (opened on click)
 *   icon?    — optional icon URL
 */
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

// ── CORS ──────────────────────────────────────────────────────────────────────

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

// ── VAPID JWT ─────────────────────────────────────────────────────────────────

function b64url(data: Uint8Array): string {
  return btoa(String.fromCharCode(...data))
    .replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function b64urlDecode(s: string): Uint8Array {
  const pad = "=".repeat((4 - s.length % 4) % 4);
  const b64 = (s + pad).replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(atob(b64), c => c.charCodeAt(0));
}

async function buildVapidJwt(audience: string): Promise<{ authorization: string; cryptoKey: string }> {
  const privateKeyB64 = Deno.env.get("VAPID_PRIVATE_KEY") ?? "";
  const publicKeyB64  = Deno.env.get("VAPID_PUBLIC_KEY")  ?? "";
  const subject       = Deno.env.get("VAPID_SUBJECT")     ?? "";

  const header  = b64url(new TextEncoder().encode(JSON.stringify({ typ: "JWT", alg: "ES256" })));
  const now     = Math.floor(Date.now() / 1000);
  const payload = b64url(new TextEncoder().encode(JSON.stringify({ aud: audience, exp: now + 43200, sub: subject })));
  const toSign  = `${header}.${payload}`;

  // Import the raw EC private key (32 bytes for P-256)
  const rawKey = b64urlDecode(privateKeyB64);

  // Build PKCS#8 wrapper for P-256 private key
  // OID for P-256: 1.2.840.10045.3.1.7
  const oidP256 = new Uint8Array([0x06, 0x08, 0x2a, 0x86, 0x48, 0xce, 0x3d, 0x03, 0x01, 0x07]);
  const oidEcPublicKey = new Uint8Array([0x06, 0x07, 0x2a, 0x86, 0x48, 0xce, 0x3d, 0x02, 0x01]);
  const ecPrivateKey = new Uint8Array([
    0x30, 0x31,              // SEQUENCE (49 bytes)
    0x02, 0x01, 0x01,        // INTEGER version = 1
    0x04, 0x20, ...rawKey,   // OCTET STRING (32 bytes private key)
    0xa0, 0x0a,              // [0] EXPLICIT
    ...oidP256,
  ]);
  const algorithmIdentifier = new Uint8Array([
    0x30, 0x13,              // SEQUENCE
    ...oidEcPublicKey,
    ...oidP256,
  ]);
  const pkcs8 = new Uint8Array([
    0x30, 0x41,              // SEQUENCE
    0x02, 0x01, 0x00,        // INTEGER version = 0
    ...algorithmIdentifier,
    0x04, 0x37,              // OCTET STRING
    ...ecPrivateKey,
  ]);

  let privateKey: CryptoKey;
  try {
    privateKey = await crypto.subtle.importKey(
      "pkcs8", pkcs8,
      { name: "ECDSA", namedCurve: "P-256" },
      false, ["sign"],
    );
  } catch {
    // Fallback: import as raw key if PKCS8 wrapping fails
    // (Some VAPID key generators output raw 32-byte keys)
    throw new Error("Could not import VAPID private key — ensure VAPID_PRIVATE_KEY is raw base64url (32 bytes)");
  }

  const sigBytes = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    privateKey,
    new TextEncoder().encode(toSign),
  );
  const sig = b64url(new Uint8Array(sigBytes));

  return {
    authorization: `vapid t=${toSign}.${sig},k=${publicKeyB64}`,
    cryptoKey: `dh=${publicKeyB64}`,
  };
}

// ── Encrypt push message (RFC 8291) ──────────────────────────────────────────

async function encryptPayload(
  payload: string,
  subP256dh: string,
  subAuth: string,
): Promise<{ ciphertext: Uint8Array; salt: Uint8Array; serverPublicKey: Uint8Array }> {
  const encoder    = new TextEncoder();
  const plaintext  = encoder.encode(payload);
  const salt       = crypto.getRandomValues(new Uint8Array(16));

  // Generate server ephemeral ECDH key pair
  const serverKeyPair = await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveKey", "deriveBits"]);

  // Import subscriber public key
  const subKeyRaw     = b64urlDecode(subP256dh);
  const subscriberKey = await crypto.subtle.importKey("raw", subKeyRaw, { name: "ECDH", namedCurve: "P-256" }, false, []);

  // ECDH shared secret
  const sharedSecret = await crypto.subtle.deriveBits({ name: "ECDH", public: subscriberKey }, serverKeyPair.privateKey, 256);

  // Export server public key (uncompressed, 65 bytes)
  const serverPubKeyRaw = new Uint8Array(await crypto.subtle.exportKey("raw", serverKeyPair.publicKey));

  // Auth secret
  const authSecret = b64urlDecode(subAuth);

  // HKDF-SHA-256: PRK_key = HKDF(auth || sharedSecret, "WebPush: info", salt=auth)
  const hkdfKeyMaterial = await crypto.subtle.importKey("raw", sharedSecret, "HKDF", false, ["deriveBits"]);
  const authInfo = encoder.encode("WebPush: info\x00");
  const prk = await crypto.subtle.deriveBits(
    { name: "HKDF", hash: "SHA-256", salt: authSecret, info: concatBytes(authInfo, subKeyRaw, serverPubKeyRaw) },
    hkdfKeyMaterial, 256,
  );

  // HKDF for content encryption key (16 bytes) and nonce (12 bytes)
  const prkKey   = await crypto.subtle.importKey("raw", prk, "HKDF", false, ["deriveBits"]);
  const cekInfo  = encoder.encode("Content-Encoding: aes128gcm\x00");
  const nonceInfo= encoder.encode("Content-Encoding: nonce\x00");

  const cek   = new Uint8Array(await crypto.subtle.deriveBits({ name: "HKDF", hash: "SHA-256", salt, info: cekInfo },   prkKey, 128));
  const nonce = new Uint8Array(await crypto.subtle.deriveBits({ name: "HKDF", hash: "SHA-256", salt, info: nonceInfo }, prkKey,  96));

  // Encrypt with AES-128-GCM — add 2-byte padding delimiter
  const aesKey = await crypto.subtle.importKey("raw", cek, { name: "AES-GCM" }, false, ["encrypt"]);
  const paddedPlaintext = concatBytes(plaintext, new Uint8Array([0x02])); // padding delimiter
  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonce }, aesKey, paddedPlaintext)
  );

  return { ciphertext, salt, serverPublicKey: serverPubKeyRaw };
}

function concatBytes(...arrays: Uint8Array[]): Uint8Array {
  const total = arrays.reduce((n, a) => n + a.length, 0);
  const out   = new Uint8Array(total);
  let offset  = 0;
  for (const a of arrays) { out.set(a, offset); offset += a.length; }
  return out;
}

// ── Build aes128gcm encrypted body per RFC 8188 ───────────────────────────────

function buildAes128GcmBody(ciphertext: Uint8Array, salt: Uint8Array, serverPublicKey: Uint8Array): Uint8Array {
  // Header: salt(16) + rs(4, big-endian) + idlen(1) + keyid(65)
  const rs     = new DataView(new ArrayBuffer(4)); rs.setUint32(0, 4096, false);
  const header = concatBytes(salt, new Uint8Array(rs.buffer), new Uint8Array([serverPublicKey.length]), serverPublicKey);
  return concatBytes(header, ciphertext);
}

// ── Handler ───────────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  const cors = corsHeaders(req);

  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  // Auth — require service role key (cron/edge-function callers) OR admin user JWT
  const authHeader     = req.headers.get("Authorization") ?? "";
  const token          = authHeader.replace("Bearer ", "");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const supabaseUrl    = Deno.env.get("SUPABASE_URL") ?? "";

  const isServiceRole = token.length > 0 && token === serviceRoleKey;

  if (!isServiceRole) {
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY") ?? "");
    const { data: { user }, error: authErr } = await anonClient.auth.getUser(token);
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: cors });
    }
    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: profile } = await adminClient
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    if (profile?.role !== "admin") {
      return new Response(JSON.stringify({ error: "Forbidden — admin role required" }), { status: 403, headers: cors });
    }
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  let body: { user_id: string; title: string; body: string; url?: string; icon?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400, headers: cors });
  }

  if (!body.user_id || !body.title) {
    return new Response(JSON.stringify({ error: "user_id and title required" }), { status: 400, headers: cors });
  }

  // Fetch all subscriptions for this user
  const { data: subs, error: dbErr } = await supabase
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth")
    .eq("user_id", body.user_id);

  if (dbErr || !subs?.length) {
    return new Response(JSON.stringify({ error: "No subscriptions found" }), { status: 404, headers: cors });
  }

  const payload = JSON.stringify({
    title: body.title,
    body:  body.body  ?? "",
    url:   body.url   ?? "/dashboard",
    icon:  body.icon  ?? "/favicon.ico",
  });

  const results = await Promise.allSettled(subs.map(async (sub) => {
    const url      = new URL(sub.endpoint);
    const audience = `${url.protocol}//${url.host}`;
    const { authorization } = await buildVapidJwt(audience);
    const { ciphertext, salt, serverPublicKey } = await encryptPayload(payload, sub.p256dh, sub.auth);
    const body2 = buildAes128GcmBody(ciphertext, salt, serverPublicKey);

    const res = await fetch(sub.endpoint, {
      method:  "POST",
      headers: {
        "Authorization":    authorization,
        "Content-Type":     "application/octet-stream",
        "Content-Encoding": "aes128gcm",
        "TTL":              "86400",
      },
      body: body2,
    });

    if (!res.ok && res.status === 410) {
      // Subscription expired — clean up
      await supabase.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
    }

    return res.status;
  }));

  const sent   = results.filter(r => r.status === "fulfilled").length;
  const failed = results.filter(r => r.status === "rejected").length;

  return new Response(JSON.stringify({ sent, failed }), {
    headers: { ...cors, "Content-Type": "application/json" },
  });
});
