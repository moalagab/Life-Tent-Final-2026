-- 1. Revoke EXECUTE on SECURITY DEFINER functions from public/anon/authenticated
-- These functions should only be called via triggers or service_role

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_account_balance() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.log_finance_activity() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_journal_balance() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_fx_rate() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_service_role() FROM PUBLIC, anon, authenticated;

-- update_updated_at_column is a trigger function but not security definer; safe to also revoke
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;

-- 2. RLS policies for the private 'tent' storage bucket
-- Files are organized under {user_id}/... so the first folder must equal auth.uid()

CREATE POLICY "Users can view own tent files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'tent'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can upload own tent files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'tent'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update own tent files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'tent'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete own tent files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'tent'
  AND auth.uid()::text = (storage.foldername(name))[1]
);