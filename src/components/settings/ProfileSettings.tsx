import { useState } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { useProfile, useUpdateProfile, useUploadAvatar } from '@/hooks/useProfile';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Camera, User } from 'lucide-react';
import { toast } from 'sonner';

export function ProfileSettings() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  const uploadAvatar = useUploadAvatar();
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [isUploading, setIsUploading] = useState(false);

  const handleSave = async () => {
    try {
      await updateProfile.mutateAsync({ full_name: fullName });
      toast.success(t('profile.profileUpdated'));
    } catch {
      toast.error(t('common.error'));
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error(t('profile.fileTooLarge'));
      return;
    }

    setIsUploading(true);
    try {
      await uploadAvatar.mutateAsync(file);
      toast.success(t('profile.avatarUpdated'));
    } catch {
      toast.error(t('common.error'));
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="relative">
          <Avatar className="w-20 h-20">
            <AvatarImage src={profile?.avatar_url || ''} />
            <AvatarFallback className="bg-primary/10 text-primary text-xl">
              <User className="w-8 h-8" />
            </AvatarFallback>
          </Avatar>
          <label className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity">
            {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
            <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} disabled={isUploading} />
          </label>
        </div>
        <p className="text-sm text-muted-foreground">{t('profile.clickToChange')}</p>
      </div>

      <div className="space-y-2">
        <Label>{t('auth.fullName')}</Label>
        <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder={t('auth.enterName')} />
      </div>

      <div className="space-y-2">
        <Label>{t('auth.email')}</Label>
        <Input value={user?.email || ''} disabled className="bg-muted/50" />
        <p className="text-xs text-muted-foreground">{t('profile.emailCannotChange')}</p>
      </div>

      <Button onClick={handleSave} disabled={updateProfile.isPending}>
        {updateProfile.isPending ? <Loader2 className="w-4 h-4 animate-spin me-2" /> : null}
        {t('common.save')}
      </Button>
    </div>
  );
}
