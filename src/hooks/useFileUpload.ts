/**
 * useFileUpload — Supabase Storage integration
 *
 * Buckets used:
 *   avatars      — user profile pictures
 *   attachments  — task / note / project file attachments
 *   media        — Studio media covers / thumbnails
 *
 * Each file is stored under `{userId}/{uuid}.{ext}` so RLS can be
 * enforced on the user folder.
 */
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export type StorageBucket = 'avatars' | 'attachments' | 'media';

export interface UploadedFile {
  path: string;       // storage path
  url: string;        // public URL
  name: string;       // original filename
  size: number;
  type: string;
}

interface UseFileUploadOptions {
  bucket: StorageBucket;
  /** Max size in bytes. Default: 10 MB */
  maxSize?: number;
  /** Allowed MIME types. Default: any */
  accept?: string[];
}

interface UseFileUploadReturn {
  upload: (file: File) => Promise<UploadedFile | null>;
  remove: (path: string) => Promise<boolean>;
  uploading: boolean;
  progress: number;
}

function randomId() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
}

function ext(filename: string) {
  const parts = filename.split('.');
  return parts.length > 1 ? `.${parts.pop()!.toLowerCase()}` : '';
}

export function useFileUpload({
  bucket,
  maxSize = 10 * 1024 * 1024,
  accept,
}: UseFileUploadOptions): UseFileUploadReturn {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const upload = useCallback(async (file: File): Promise<UploadedFile | null> => {
    if (!user) {
      toast.error('يجب تسجيل الدخول أولاً');
      return null;
    }

    if (file.size > maxSize) {
      toast.error(`الملف كبير جداً (الحد الأقصى ${Math.round(maxSize / 1024 / 1024)} MB)`);
      return null;
    }

    if (accept && accept.length > 0 && !accept.includes(file.type)) {
      toast.error(`نوع الملف غير مدعوم (${file.type})`);
      return null;
    }

    setUploading(true);
    setProgress(10);

    try {
      const filePath = `${user.id}/${randomId()}${ext(file.name)}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      setProgress(80);

      // Only `avatars` is a public bucket. `attachments`/`media` are private
      // (owner-only RLS) — getPublicUrl() on those returns a URL that 403s,
      // so we sign it instead. Long expiry since the URL is persisted
      // (e.g. resources.source_url) and re-signing on every render isn't wired up.
      let url: string;
      if (bucket === 'avatars') {
        url = supabase.storage.from(bucket).getPublicUrl(filePath).data.publicUrl;
      } else {
        const { data: signedData, error: signError } = await supabase.storage
          .from(bucket)
          .createSignedUrl(filePath, 60 * 60 * 24 * 365 * 10); // ~10 years
        if (signError || !signedData) throw signError ?? new Error('تعذر إنشاء رابط الملف');
        url = signedData.signedUrl;
      }

      setProgress(100);

      return {
        path: filePath,
        url,
        name: file.name,
        size: file.size,
        type: file.type,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'فشل رفع الملف';
      toast.error(message);
      return null;
    } finally {
      setUploading(false);
      setTimeout(() => setProgress(0), 1000);
    }
  }, [user, bucket, maxSize, accept]);

  const remove = useCallback(async (path: string): Promise<boolean> => {
    const { error } = await supabase.storage.from(bucket).remove([path]);
    if (error) {
      toast.error('فشل حذف الملف');
      return false;
    }
    return true;
  }, [bucket]);

  return { upload, remove, uploading, progress };
}
