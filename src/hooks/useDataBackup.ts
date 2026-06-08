/**
 * useDataBackup — triggers the export-user-data Edge Function and
 * downloads the result as a JSON file. Also optionally sends an
 * email confirmation using useEmailNotifications.
 */
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useEmailNotifications } from './useEmailNotifications';
import { toast } from 'sonner';

const LAST_BACKUP_KEY = 'last-backup-ts';

export function useDataBackup() {
  const [backing, setBacking] = useState(false);
  const { send: sendEmail } = useEmailNotifications();

  const lastBackup: string | null = (() => {
    try { return localStorage.getItem(LAST_BACKUP_KEY); } catch { return null; }
  })();

  const backup = useCallback(async () => {
    setBacking(true);
    toast.loading('جارٍ إنشاء النسخة الاحتياطية…', { id: 'backup' });

    try {
      const { data, error } = await supabase.functions.invoke('export-user-data');
      if (error) throw error;

      // Build downloadable JSON blob
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const ts = new Date().toISOString().slice(0, 10);
      const a = document.createElement('a');
      a.href = url;
      a.download = `lifetent-backup-${ts}.json`;
      a.click();
      URL.revokeObjectURL(url);

      const sizeKb = Math.round(blob.size / 1024);
      localStorage.setItem(LAST_BACKUP_KEY, new Date().toISOString());

      toast.success('تم إنشاء النسخة الاحتياطية وتنزيلها', { id: 'backup' });

      // Send confirmation email (non-blocking)
      sendEmail('backup_complete', {
        timestamp: new Date().toLocaleString('ar-SA'),
        size: `${sizeKb} KB`,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'حدث خطأ';
      toast.error(`فشل النسخ الاحتياطي: ${msg}`, { id: 'backup' });
    } finally {
      setBacking(false);
    }
  }, [sendEmail]);

  return { backup, backing, lastBackup };
}
