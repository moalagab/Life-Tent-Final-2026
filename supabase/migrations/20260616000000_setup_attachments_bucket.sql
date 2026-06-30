-- Create attachments bucket (files, PDFs, images, documents)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'attachments',
  'attachments',
  true,
  52428800,  -- 50 MB limit
  NULL       -- allow all mime types
)
ON CONFLICT (id) DO UPDATE
  SET public = true,
      file_size_limit = 52428800;

-- Upload: authenticated users only, into their own folder
DROP POLICY IF EXISTS "attachments_upload" ON storage.objects;
CREATE POLICY "attachments_upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'attachments'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Update: own files only
DROP POLICY IF EXISTS "attachments_update" ON storage.objects;
CREATE POLICY "attachments_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'attachments'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Read: authenticated users can read all attachments (public URLs)
DROP POLICY IF EXISTS "attachments_read" ON storage.objects;
CREATE POLICY "attachments_read" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'attachments');

-- Delete: own files only
DROP POLICY IF EXISTS "attachments_delete" ON storage.objects;
CREATE POLICY "attachments_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'attachments'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
