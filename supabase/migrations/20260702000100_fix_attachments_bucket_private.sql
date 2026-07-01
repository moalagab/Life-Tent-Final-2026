-- ── Fix: attachments bucket was flipped from private to public ─────────────
-- 20260609011054_storage_buckets.sql created `attachments` as PRIVATE with a
-- mime whitelist and an owner-only RLS policy. 20260616000000_setup_attachments
-- _bucket.sql later set public = true, removed the mime whitelist, and added
-- an "attachments_read" policy granting SELECT to every authenticated user —
-- meaning any logged-in user (and, via the public bucket URL, anyone with a
-- guessed/leaked object path) could read any other user's task/project files.
-- This restores the original private, owner-only, mime-restricted behavior.
-- ─────────────────────────────────────────────────────────────────────────

UPDATE storage.buckets
SET public = false,
    file_size_limit = 52428800, -- keep the 50 MB limit from the later migration
    allowed_mime_types = ARRAY[
      'image/jpeg','image/png','image/webp','image/gif',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain','text/csv',
      'application/zip'
    ]
WHERE id = 'attachments';

-- Replace the "any authenticated user can read any attachment" policy with
-- an owner-only read policy (upload/update/delete policies are already
-- correctly owner-scoped and are left as-is).
DROP POLICY IF EXISTS "attachments_read" ON storage.objects;
CREATE POLICY "attachments_read" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'attachments'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
