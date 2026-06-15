import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  preferred_language: string | null;
  timezone: string | null;
  reading_goal_yearly: number | null;
  reading_reminder_enabled: boolean | null;
  reading_reminder_time: string | null;
  created_at: string;
  updated_at: string;
}

function toError(err: unknown, fallback = 'حدث خطأ'): Error {
  if (err instanceof Error) return err;
  if (err && typeof err === 'object' && 'message' in err) {
    return new Error(String((err as { message: unknown }).message) || fallback);
  }
  return new Error(fallback);
}

export function useProfile() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('profiles')
        .select('id, user_id, full_name, avatar_url, preferred_language, timezone, reading_goal_yearly, reading_reminder_enabled, reading_reminder_time, created_at, updated_at')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw toError(error);
      return data as Profile | null;
    },
    enabled: !!user,
  });
}

export function useUpdateProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: Partial<Profile>) => {
      if (!user) throw new Error('Not authenticated');

      // Check if profile exists
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        const { data, error } = await supabase
          .from('profiles')
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq('user_id', user.id)
          .select()
          .single();

        if (error) throw toError(error, 'فشل تحديث الملف الشخصي');
        return data;
      } else {
        const { data, error } = await supabase
          .from('profiles')
          .insert({ ...updates, user_id: user.id })
          .select()
          .single();

        if (error) throw toError(error, 'فشل إنشاء الملف الشخصي');
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}

export function useUploadAvatar() {
  const { user } = useAuth();
  const updateProfile = useUpdateProfile();

  return useMutation({
    mutationFn: async (file: File) => {
      if (!user) throw new Error('يجب تسجيل الدخول أولاً');

      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `avatar_${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true, contentType: file.type });

      if (uploadError) throw toError(uploadError, 'فشل رفع الصورة');

      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);

      await updateProfile.mutateAsync({ avatar_url: urlData.publicUrl });
      return urlData.publicUrl;
    },
  });
}
