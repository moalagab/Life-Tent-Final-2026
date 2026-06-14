-- ── Scheduled push reminders via pg_cron + pg_net ───────────────────────────
-- pg_cron and pg_net are available on the Supabase free tier.
-- This cron fires at 07:00, 09:00, 12:00, and 18:00 every day.
-- It calls the send-reminders edge function with the service role key so the
-- function fans out push notifications to all subscribed users.
--
-- Required: Set the following in Supabase Vault / project settings:
--   vault secret: supabase_url           = https://<project>.supabase.co
--   vault secret: service_role_key       = <service role key>
--   edge function secrets: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT

-- Enable extensions (idempotent)
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Remove stale job if re-running this migration
SELECT cron.unschedule('send-reminders-scheduled') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'send-reminders-scheduled'
);

-- Schedule: 07:00, 09:00, 12:00, 18:00 UTC every day
SELECT cron.schedule(
  'send-reminders-scheduled',
  '0 7,9,12,18 * * *',
  $$
    SELECT net.http_post(
      url     := current_setting('app.supabase_url', true) || '/functions/v1/send-reminders',
      headers := jsonb_build_object(
        'Content-Type',  'application/json',
        'Authorization', 'Bearer ' || current_setting('app.service_role_key', true)
      ),
      body    := '{}'::jsonb
    )
  $$
);

-- Note: set app.supabase_url and app.service_role_key in your database config:
--   ALTER DATABASE postgres SET "app.supabase_url"      = 'https://YOUR_PROJECT.supabase.co';
--   ALTER DATABASE postgres SET "app.service_role_key"  = 'YOUR_SERVICE_ROLE_KEY';
-- Or use pg_net with hardcoded values if vault integration is not available.
