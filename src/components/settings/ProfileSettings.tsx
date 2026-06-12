import { useState, useEffect, useRef } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { useProfile, useUpdateProfile, useUploadAvatar } from '@/hooks/useProfile';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Camera, User, Mail, Clock, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';

const timezones = [
  { value: 'Asia/Riyadh', label: 'الرياض (GMT+3)' },
  { value: 'Asia/Dubai', label: 'دبي (GMT+4)' },
  { value: 'Asia/Kuwait', label: 'الكويت (GMT+3)' },
  { value: 'Africa/Cairo', label: 'القاهرة (GMT+2)' },
  { value: 'Europe/London', label: 'لندن (GMT+0)' },
  { value: 'America/New_York', label: 'نيويورك (GMT-5)' },
];

export function ProfileSettings() {
  const { t, currentLanguage } = useLanguage();
  const { user } = useAuth();
  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  const uploadAvatar = useUploadAvatar();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fullName, setFullName] = useState('');
  const [timezone, setTimezone] = useState('Asia/Riyadh');
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setTimezone(profile.timezone || 'Asia/Riyadh');
    }
  }, [profile]);

  const handleSave = async () => {
    try {
      await updateProfile.mutateAsync({ 
        full_name: fullName,
        timezone: timezone 
      });
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
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(msg || t('common.error'));
    } finally {
      setIsUploading(false);
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
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
      {/* Avatar Section */}
      <div className="flex items-center gap-6 p-4 rounded-xl bg-primary/5 border border-primary/20">
        <div className="relative group shrink-0">
          <Avatar className="w-24 h-24 ring-4 ring-background shadow-xl">
            <AvatarImage src={profile?.avatar_url || ''} />
            <AvatarFallback className="bg-primary/10 text-primary text-2xl">
              {fullName ? getInitials(fullName) : <User className="w-10 h-10" />}
            </AvatarFallback>
          </Avatar>
          {/* Desktop hover overlay */}
          <label className="absolute inset-0 sm:flex hidden items-center justify-center bg-black/50 rounded-full sm:opacity-0 sm:group-hover:opacity-100 cursor-pointer transition-opacity">
            {isUploading ? (
              <Loader2 className="w-6 h-6 animate-spin text-primary-foreground" />
            ) : (
              <Camera className="w-6 h-6 text-primary-foreground" />
            )}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
              disabled={isUploading}
            />
          </label>
          {/* Mobile always-visible camera button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="absolute bottom-0 end-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex sm:hidden items-center justify-center shadow-lg"
          >
            {isUploading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Camera className="w-4 h-4" />
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
            disabled={isUploading}
          />
        </div>
        <div className="min-w-0">
          <h4 className="font-semibold text-foreground truncate">{fullName || t('auth.fullName')}</h4>
          <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
          <p className="text-xs text-muted-foreground mt-1">{t('profile.clickToChange')}</p>
        </div>
      </div>

      {/* Form Fields */}
      <div className="grid gap-4">
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <User className="w-4 h-4" />
            {t('auth.fullName')}
          </Label>
          <Input 
            value={fullName} 
            onChange={(e) => setFullName(e.target.value)} 
            placeholder={t('auth.enterName')} 
            className="h-12"
          />
        </div>

        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Mail className="w-4 h-4" />
            {t('auth.email')}
          </Label>
          <Input 
            value={user?.email || ''} 
            disabled 
            className="h-12 bg-muted/50" 
          />
          <p className="text-xs text-muted-foreground">{t('profile.emailCannotChange')}</p>
        </div>

        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            {t('profile.timezone')}
          </Label>
          <Select value={timezone} onValueChange={setTimezone}>
            <SelectTrigger className="h-12">
              <SelectValue placeholder={t('profile.timezone')} />
            </SelectTrigger>
            <SelectContent>
              {timezones.map((tz) => (
                <SelectItem key={tz.value} value={tz.value}>
                  {tz.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Account Info */}
      <div className="p-4 rounded-xl bg-muted/30 border border-border">
        <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          {t('profile.accountInfo')}
        </h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">{t('profile.memberSince')}</p>
            <p className="font-medium text-foreground" dir="ltr">
              {user?.created_at ? format(new Date(user.created_at), 'yyyy/MM/dd', { locale: currentLanguage === 'ar' ? ar : enUS }) : '-'}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">{t('profile.lastSignIn')}</p>
            <p className="font-medium text-foreground" dir="ltr">
              {user?.last_sign_in_at ? format(new Date(user.last_sign_in_at), 'yyyy/MM/dd HH:mm', { locale: currentLanguage === 'ar' ? ar : enUS }) : '-'}
            </p>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <Button 
        onClick={handleSave} 
        disabled={updateProfile.isPending}
        className="w-full h-12"
      >
        {updateProfile.isPending ? <Loader2 className="w-4 h-4 animate-spin me-2" /> : null}
        {t('common.save')}
      </Button>
    </div>
  );
}
