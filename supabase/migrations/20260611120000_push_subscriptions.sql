-- ── Push Subscriptions ────────────────────────────────────────────────────────
-- Stores Web Push API subscriptions per user/device so the server can send
-- real push notifications via VAPID.

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id         uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  endpoint   text        NOT NULL,
  p256dh     text        NOT NULL,   -- ECDH public key (base64url)
  auth       text        NOT NULL,   -- Auth secret (base64url)
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, endpoint)
);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own push subscriptions"
  ON push_subscriptions
  FOR ALL
  TO authenticated
  USING      (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Service role can read all subscriptions (needed for server-side push sending)
CREATE POLICY "Service role can read subscriptions"
  ON push_subscriptions
  FOR SELECT
  TO service_role
  USING (true);

-- ── WebAuthn Credentials ───────────────────────────────────────────────────────
-- Stores passkey / biometric credentials registered via the Web Authentication API.

CREATE TABLE IF NOT EXISTS webauthn_credentials (
  id                  uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id             uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  credential_id       text        NOT NULL UNIQUE,   -- base64url encoded credential ID
  public_key          text        NOT NULL,          -- COSE-encoded public key (base64url)
  counter             bigint      NOT NULL DEFAULT 0,
  device_name         text,                          -- e.g. "iPhone 15 - Face ID"
  aaguid              text,                          -- authenticator AAGUID
  transports          text[],                        -- ['internal','hybrid']
  created_at          timestamptz DEFAULT now(),
  last_used_at        timestamptz
);

ALTER TABLE webauthn_credentials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own webauthn credentials"
  ON webauthn_credentials
  FOR ALL
  TO authenticated
  USING      (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role full access webauthn"
  ON webauthn_credentials
  FOR ALL
  TO service_role
  USING (true);

-- Index for fast lookup by credential_id during authentication
CREATE INDEX IF NOT EXISTS idx_webauthn_credential_id ON webauthn_credentials (credential_id);
CREATE INDEX IF NOT EXISTS idx_webauthn_user_id       ON webauthn_credentials (user_id);
