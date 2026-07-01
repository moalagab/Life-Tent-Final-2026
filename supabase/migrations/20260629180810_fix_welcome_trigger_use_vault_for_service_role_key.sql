-- ============================================================
-- Security fix: replace hardcoded service_role key in
-- handle_new_user_welcome with a Vault lookup.
--
-- The secret is stored as 'supabase_service_role_key' in
-- vault.secrets — encrypted at rest, never in source code.
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user_welcome()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _url     text := 'https://oocddixbjiynladnvdfx.supabase.co/functions/v1/send-welcome-email';
  _key     text;
  _payload jsonb;
BEGIN
  -- Read service role key from Vault (encrypted at rest)
  SELECT decrypted_secret INTO _key
  FROM vault.decrypted_secrets
  WHERE name = 'supabase_service_role_key'
  LIMIT 1;

  IF _key IS NULL THEN
    RETURN NEW; -- skip silently if vault secret not set
  END IF;

  _payload := jsonb_build_object(
    'record', jsonb_build_object(
      'email',              NEW.email,
      'raw_user_meta_data', NEW.raw_user_meta_data
    )
  );

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

GRANT EXECUTE ON FUNCTION public.handle_new_user_welcome() TO postgres;
