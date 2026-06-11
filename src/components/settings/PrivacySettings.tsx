import { useState, useEffect } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Shield, Key, Eye, EyeOff, Loader2, Smartphone, Copy, CheckCircle2, AlertCircle, QrCode, Fingerprint, Trash2, Plus, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useWebAuthn } from '@/hooks/useWebAuthn';
import { formatDistanceToNow } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';

export function PrivacySettings() {
  const { t, currentLanguage } = useLanguage();
  const { user } = useAuth();
  const {
    isSupported: webAuthnSupported,
    isLoading:   webAuthnLoading,
    error:       webAuthnError,
    credentials: webAuthnCreds,
    register:    webAuthnRegister,
    authenticate: webAuthnAuthenticate,
    deleteCredential: webAuthnDelete,
  } = useWebAuthn();
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // 2FA States
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [showTwoFactorSetup, setShowTwoFactorSetup] = useState(false);
  const [totpSecret, setTotpSecret] = useState('');
  const [totpUri, setTotpUri] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [factorId, setFactorId] = useState<string | null>(null);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [copied, setCopied] = useState(false);

  // Check 2FA status on mount
  useEffect(() => {
    checkTwoFactorStatus();
  }, []);

  const checkTwoFactorStatus = async () => {
    try {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (error) throw error;
      
      const totpFactor = data?.totp?.find(f => f.status === 'verified');
      setTwoFactorEnabled(!!totpFactor);
      if (totpFactor) {
        setFactorId(totpFactor.id);
      }
    } catch (error) {
      console.error('Error checking 2FA status:', error);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error(t('auth.passwordsNotMatch'));
      return;
    }

    if (newPassword.length < 6) {
      toast.error(t('auth.passwordMinLength'));
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      toast.success(t('auth.passwordUpdated'));
      setShowPasswordForm(false);
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error(t('common.error'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const startTwoFactorEnrollment = async () => {
    setIsEnrolling(true);
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'LIFE TENT Authenticator'
      });

      if (error) throw error;

      if (data) {
        setTotpSecret(data.totp.secret);
        setTotpUri(data.totp.uri);
        setFactorId(data.id);
        setShowTwoFactorSetup(true);
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error(t('common.error'));
      }
    } finally {
      setIsEnrolling(false);
    }
  };

  const verifyAndEnableTwoFactor = async () => {
    if (!factorId || verificationCode.length !== 6) {
      toast.error(t('settings.enterValidCode'));
      return;
    }

    setIsVerifying(true);
    try {
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: factorId
      });

      if (challengeError) throw challengeError;

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: factorId,
        challengeId: challengeData.id,
        code: verificationCode
      });

      if (verifyError) throw verifyError;

      setTwoFactorEnabled(true);
      setShowTwoFactorSetup(false);
      setVerificationCode('');
      toast.success(t('settings.twoFactorEnabled'));
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error(t('settings.invalidCode'));
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const disableTwoFactor = async () => {
    if (!factorId) return;

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.mfa.unenroll({
        factorId: factorId
      });

      if (error) throw error;

      setTwoFactorEnabled(false);
      setFactorId(null);
      toast.success(t('settings.twoFactorDisabled'));
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error(t('common.error'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const copySecret = () => {
    navigator.clipboard.writeText(totpSecret);
    setCopied(true);
    toast.success(t('settings.secretCopied'));
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Password Change */}
      <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
            <Key className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h4 className="font-medium text-foreground">{t('settings.changePassword')}</h4>
            <p className="text-sm text-muted-foreground">{t('settings.changePasswordDesc')}</p>
          </div>
        </div>

        {!showPasswordForm ? (
          <Button variant="outline" onClick={() => setShowPasswordForm(true)}>
            {t('settings.changePassword')}
          </Button>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t('auth.newPassword')}</Label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t('auth.confirmPassword')}</Label>
              <Input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleChangePassword} disabled={isLoading}>
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin me-2" /> : null}
                {t('common.save')}
              </Button>
              <Button variant="outline" onClick={() => setShowPasswordForm(false)}>
                {t('common.cancel')}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Two-Factor Authentication */}
      <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <Shield className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h4 className="font-medium text-foreground">{t('settings.twoFactor')}</h4>
              <p className="text-sm text-muted-foreground">{t('settings.twoFactorDesc')}</p>
            </div>
          </div>
          {twoFactorEnabled ? (
            <div className="flex items-center gap-2">
              <span className="text-xs bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-2 py-1 rounded-full flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                {t('settings.active')}
              </span>
            </div>
          ) : null}
        </div>
        
        <div className="mt-4">
          {twoFactorEnabled ? (
            <Button 
              variant="destructive" 
              onClick={disableTwoFactor}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin me-2" /> : null}
              {t('settings.disableTwoFactor')}
            </Button>
          ) : (
            <Button 
              onClick={startTwoFactorEnrollment}
              disabled={isEnrolling}
              className="w-full"
            >
              {isEnrolling ? <Loader2 className="w-4 h-4 animate-spin me-2" /> : <Smartphone className="w-4 h-4 me-2" />}
              {t('settings.enableTwoFactor')}
            </Button>
          )}
        </div>
      </div>

      {/* Passkeys / Biometric Authentication */}
      <div className="p-4 rounded-xl bg-gradient-to-br from-violet-500/10 to-purple-500/10 border border-violet-500/20 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
              <Fingerprint className="w-5 h-5 text-violet-500" />
            </div>
            <div>
              <h4 className="font-medium text-foreground">
                {currentLanguage === 'ar' ? 'مفاتيح المرور (Passkeys)' : 'Passkeys / Biometrics'}
              </h4>
              <p className="text-sm text-muted-foreground">
                {currentLanguage === 'ar'
                  ? 'سجّل الدخول ببصمتك أو Face ID بدون كلمة مرور'
                  : 'Sign in with fingerprint, Face ID, or security key'}
              </p>
            </div>
          </div>
          {webAuthnCreds.length > 0 && (
            <span className="text-xs bg-violet-500/20 text-violet-500 px-2 py-1 rounded-full flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              {webAuthnCreds.length} {currentLanguage === 'ar' ? 'جهاز' : 'device(s)'}
            </span>
          )}
        </div>

        {/* Not supported */}
        {!webAuthnSupported && (
          <div className="flex items-center gap-2 text-sm text-amber-500 bg-amber-500/10 p-3 rounded-lg">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>
              {currentLanguage === 'ar'
                ? 'متصفحك لا يدعم Passkeys. استخدم Chrome أو Safari أو Edge.'
                : 'Your browser does not support Passkeys. Use Chrome, Safari, or Edge.'}
            </span>
          </div>
        )}

        {/* Error */}
        {webAuthnError && (
          <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{webAuthnError}</span>
          </div>
        )}

        {/* Registered devices list */}
        {webAuthnCreds.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {currentLanguage === 'ar' ? 'الأجهزة المسجّلة' : 'Registered devices'}
            </p>
            {webAuthnCreds.map((cred) => (
              <div
                key={cred.id}
                className="flex items-center justify-between p-3 rounded-xl bg-background/60 border border-border"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center shrink-0">
                    <Fingerprint className="w-4 h-4 text-violet-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {cred.device_name ?? (currentLanguage === 'ar' ? 'جهاز غير معروف' : 'Unknown device')}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>
                        {currentLanguage === 'ar' ? 'مُضاف' : 'Added'}{' '}
                        {formatDistanceToNow(new Date(cred.created_at), {
                          addSuffix: true,
                          locale: currentLanguage === 'ar' ? ar : enUS,
                        })}
                      </span>
                      {cred.last_used_at && (
                        <>
                          <span>·</span>
                          <Clock className="w-3 h-3" />
                          <span>
                            {formatDistanceToNow(new Date(cred.last_used_at), {
                              addSuffix: true,
                              locale: currentLanguage === 'ar' ? ar : enUS,
                            })}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={async () => {
                    await webAuthnDelete(cred.id);
                    toast.success(currentLanguage === 'ar' ? 'تم حذف الجهاز' : 'Device removed');
                  }}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
                  title={currentLanguage === 'ar' ? 'حذف الجهاز' : 'Remove device'}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        {webAuthnSupported && (
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={webAuthnLoading}
              onClick={async () => {
                const ok = await webAuthnRegister();
                if (ok) toast.success(currentLanguage === 'ar' ? 'تم تسجيل الجهاز بنجاح' : 'Device registered successfully');
              }}
              className="gap-2 border-violet-500/30 hover:border-violet-500/60 hover:bg-violet-500/5"
            >
              {webAuthnLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4 text-violet-500" />
              )}
              {currentLanguage === 'ar' ? 'إضافة جهاز جديد' : 'Add new device'}
            </Button>

            {webAuthnCreds.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                disabled={webAuthnLoading}
                onClick={async () => {
                  const ok = await webAuthnAuthenticate();
                  if (ok) toast.success(currentLanguage === 'ar' ? 'تم التحقق بنجاح ✓' : 'Verified successfully ✓');
                }}
                className="gap-2 text-muted-foreground"
              >
                <Fingerprint className="w-4 h-4" />
                {currentLanguage === 'ar' ? 'اختبار المصادقة' : 'Test authentication'}
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Sessions */}
      <div className="p-4 rounded-xl bg-muted/30 border border-border">
        <h4 className="font-medium text-foreground mb-2">{t('settings.activeSessions')}</h4>
        <p className="text-sm text-muted-foreground mb-4">{t('settings.activeSessionsDesc')}</p>
        <div className="p-3 rounded-lg bg-background border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">{t('settings.currentSession')}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
            <span className="text-xs bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-1 rounded-full flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {t('settings.active')}
            </span>
          </div>
        </div>
      </div>

      {/* 2FA Setup Dialog */}
      <Dialog open={showTwoFactorSetup} onOpenChange={setShowTwoFactorSetup}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-emerald-500" />
              {t('settings.setupTwoFactor')}
            </DialogTitle>
            <DialogDescription>
              {t('settings.setupTwoFactorDesc')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            {/* Step 1: QR Code */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs">1</span>
                {t('settings.scanQrCode')}
              </div>
              
              <div className="flex justify-center p-4 bg-white rounded-xl">
                {totpUri && (
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(totpUri)}`}
                    alt="QR Code"
                    className="w-48 h-48"
                  />
                )}
              </div>
            </div>

            {/* Step 2: Manual Entry */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <span className="w-6 h-6 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-xs">2</span>
                {t('settings.orEnterManually')}
              </div>
              
              <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                <code className="flex-1 text-xs font-mono break-all">{totpSecret}</code>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={copySecret}
                  className="shrink-0"
                >
                  {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            {/* Step 3: Verify */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <span className="w-6 h-6 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-xs">3</span>
                {t('settings.enterVerificationCode')}
              </div>
              
              <Input
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                className="text-center text-2xl tracking-widest font-mono"
                maxLength={6}
              />
            </div>

            <Button 
              onClick={verifyAndEnableTwoFactor} 
              disabled={isVerifying || verificationCode.length !== 6}
              className="w-full"
            >
              {isVerifying ? <Loader2 className="w-4 h-4 animate-spin me-2" /> : null}
              {t('settings.verifyAndEnable')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
