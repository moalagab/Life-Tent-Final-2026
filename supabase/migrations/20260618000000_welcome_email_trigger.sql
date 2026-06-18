-- ── Welcome email trigger ────────────────────────────────────────────────────
-- Fires the send-welcome-email edge function via pg_net whenever a new user
-- is inserted into auth.users (i.e., on every signup / OAuth / magic-link).
--
-- Prerequisites:
--   pg_net extension enabled (already done in setup_reminder_cron migration)
--   Supabase secrets: RESEND_API_KEY must be set on the edge function
--   Database settings:
--     ALTER DATABASE postgres SET "app.supabase_url"      = 'https://YOUR_PROJECT.supabase.co';
--     ALTER DATABASE postgres SET "app.service_role_key"  = 'YOUR_SERVICE_ROLE_KEY';
-- ─────────────────────────────────────────────────────────────────────────────

-- Ensure pg_net is available
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Drop previous version of the function/trigger if re-running
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user_welcome();

-- Trigger function: calls send-welcome-email edge function
CREATE OR REPLACE FUNCTION public.handle_new_user_welcome()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _url     text;
  _key     text;
  _payload jsonb;
BEGIN
  _url := current_setting('app.supabase_url', true) || '/functions/v1/send-welcome-email';
  _key := current_setting('app.service_role_key', true);

  _payload := jsonb_build_object(
    'record', jsonb_build_object(
      'email',               NEW.email,
      'raw_user_meta_data',  NEW.raw_user_meta_data
    )
  );

  -- Fire-and-forget HTTP POST (async, does not block the signup transaction)
  PERFORM net.http_post(
    url     := _url,
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || _key
    ),
    body    := _payload
  );

  RETURN NEW;
END;
$$;

-- Attach trigger to auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_welcome();

-- Grant execute to postgres role (required for SECURITY DEFINER across schemas)
GRANT EXECUTE ON FUNCTION public.handle_new_user_welcome() TO postgres;
