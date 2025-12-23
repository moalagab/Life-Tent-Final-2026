import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, Mail, Lock, User, Tent, ArrowLeft, Shield, AlertTriangle, CheckCircle } from 'lucide-react';
import { z } from 'zod';
import { useLanguage } from '@/hooks/useLanguage';
import { Progress } from '@/components/ui/progress';

type AuthMode = 'login' | 'signup' | 'forgot';

// Rate limiting for login attempts
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 5 * 60 * 1000; // 5 minutes

export default function Auth() {
  const { t, currentLanguage: language } = useLanguage();
  
  // Strong password validation for signup
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  
  const loginSchema = z.object({
    email: z.string().trim().toLowerCase().email({ message: t('validation.invalidEmail') }),
    password: z.string().min(6, { message: t('validation.passwordMinLength') })
  });

  const signupSchema = z.object({
    email: z.string().trim().toLowerCase().email({ message: t('validation.invalidEmail') }),
    password: z.string()
      .min(8, { message: language === 'ar' ? 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' : 'Password must be at least 8 characters' })
      .regex(/[a-z]/, { message: language === 'ar' ? 'يجب أن تحتوي على حرف صغير' : 'Must contain a lowercase letter' })
      .regex(/[A-Z]/, { message: language === 'ar' ? 'يجب أن تحتوي على حرف كبير' : 'Must contain an uppercase letter' })
      .regex(/\d/, { message: language === 'ar' ? 'يجب أن تحتوي على رقم' : 'Must contain a number' })
      .regex(/[@$!%*?&]/, { message: language === 'ar' ? 'يجب أن تحتوي على رمز خاص (@$!%*?&)' : 'Must contain a special character (@$!%*?&)' }),
    fullName: z.string().trim().min(2, { message: t('validation.nameMinLength') }).max(100)
  });

  const resetSchema = z.object({
    email: z.string().trim().toLowerCase().email({ message: t('validation.invalidEmail') })
  });

  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [resetSent, setResetSent] = useState(false);
  const [signupComplete, setSignupComplete] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  
  // Security: Rate limiting state
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);
  const [lockoutRemaining, setLockoutRemaining] = useState(0);
  
  // Password strength indicator
  const [passwordStrength, setPasswordStrength] = useState(0);

  const { signIn, signUp, resetPassword, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Calculate password strength
  const calculatePasswordStrength = useCallback((pwd: string) => {
    let strength = 0;
    if (pwd.length >= 8) strength += 25;
    if (/[a-z]/.test(pwd)) strength += 25;
    if (/[A-Z]/.test(pwd)) strength += 25;
    if (/\d/.test(pwd)) strength += 12.5;
    if (/[@$!%*?&]/.test(pwd)) strength += 12.5;
    return Math.min(100, strength);
  }, []);
  
  // Update password strength on change
  useEffect(() => {
    if (mode === 'signup') {
      setPasswordStrength(calculatePasswordStrength(password));
    }
  }, [password, mode, calculatePasswordStrength]);
  
  // Lockout timer
  useEffect(() => {
    if (lockoutUntil) {
      const interval = setInterval(() => {
        const remaining = lockoutUntil - Date.now();
        if (remaining <= 0) {
          setLockoutUntil(null);
          setLoginAttempts(0);
          setLockoutRemaining(0);
        } else {
          setLockoutRemaining(Math.ceil(remaining / 1000));
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [lockoutUntil]);

  useEffect(() => {
    if (user) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  const validateForm = () => {
    let schema;
    let data;
    
    if (mode === 'forgot') {
      schema = resetSchema;
      data = { email };
    } else if (mode === 'login') {
      schema = loginSchema;
      data = { email, password };
    } else {
      schema = signupSchema;
      data = { email, password, fullName };
    }
    
    const result = schema.safeParse(data);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach(err => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      return false;
    }
    setErrors({});
    return true;
  };

  // Check if locked out
  const isLockedOut = lockoutUntil && Date.now() < lockoutUntil;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check lockout for login attempts
    if (mode === 'login' && isLockedOut) {
      toast({
        title: language === 'ar' ? 'تم إيقاف الحساب مؤقتاً' : 'Account Temporarily Locked',
        description: language === 'ar' 
          ? `يرجى الانتظار ${lockoutRemaining} ثانية قبل المحاولة مرة أخرى`
          : `Please wait ${lockoutRemaining} seconds before trying again`,
        variant: "destructive"
      });
      return;
    }
    
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      if (mode === 'forgot') {
        const { error } = await resetPassword(email.trim().toLowerCase());
        if (error) {
          toast({
            title: t('auth.error'),
            description: error.message,
            variant: "destructive"
          });
        } else {
          setResetSent(true);
          toast({
            title: t('auth.sent'),
            description: t('auth.checkEmailReset')
          });
        }
      } else if (mode === 'login') {
        const { error } = await signIn(email.trim().toLowerCase(), password);
        if (error) {
          // Increment login attempts on failure
          const newAttempts = loginAttempts + 1;
          setLoginAttempts(newAttempts);
          
          if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
            setLockoutUntil(Date.now() + LOCKOUT_DURATION);
            toast({
              title: language === 'ar' ? 'تم إيقاف الحساب مؤقتاً' : 'Account Temporarily Locked',
              description: language === 'ar' 
                ? 'تم تجاوز عدد المحاولات المسموح. يرجى الانتظار 5 دقائق.'
                : 'Too many failed attempts. Please wait 5 minutes.',
              variant: "destructive"
            });
          } else if (error.message.includes('Invalid login credentials')) {
            toast({
              title: t('auth.loginError'),
              description: `${t('auth.invalidCredentials')} (${MAX_LOGIN_ATTEMPTS - newAttempts} ${language === 'ar' ? 'محاولات متبقية' : 'attempts remaining'})`,
              variant: "destructive"
            });
          } else {
            toast({
              title: t('auth.error'),
              description: error.message,
              variant: "destructive"
            });
          }
        } else {
          // Reset attempts on successful login
          setLoginAttempts(0);
          setLockoutUntil(null);
          toast({
            title: t('auth.welcome'),
            description: t('auth.loginSuccess')
          });
        }
      } else {
        const { error } = await signUp(email.trim().toLowerCase(), password, fullName.trim());
        if (error) {
          if (error.message.includes('User already registered')) {
            toast({
              title: t('auth.userExists'),
              description: t('auth.emailRegistered'),
              variant: "destructive"
            });
          } else {
            toast({
              title: t('auth.error'),
              description: error.message,
              variant: "destructive"
            });
          }
        } else {
          // Show email verification message
          setSignupComplete(true);
          setRegisteredEmail(email.trim().toLowerCase());
          toast({
            title: t('auth.accountCreated'),
            description: language === 'ar' 
              ? 'يرجى التحقق من بريدك الإلكتروني لتفعيل حسابك'
              : 'Please check your email to verify your account'
          });
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    setErrors({});
    setResetSent(false);
    setSignupComplete(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-primary/5 rounded-full blur-3xl animate-float" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo Section */}
        <div className="text-center mb-8 slide-up">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl glass-card gold-glow mb-4">
            <Tent className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-3xl font-bold gold-text mb-2">LIFE TENT</h1>
          <p className="text-muted-foreground">{t('auth.tagline')}</p>
        </div>

        {/* Auth Card */}
        <div className="glass-card p-8 slide-up" style={{ animationDelay: '0.1s' }}>
          {mode === 'forgot' ? (
            <>
              {/* Forgot Password Header */}
              <div className="mb-6">
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className="text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-2 mb-4"
                >
                  <ArrowLeft className="w-4 h-4" />
                  {t('auth.back')}
                </button>
                <h2 className="text-xl font-semibold text-foreground text-center">
                  {t('auth.resetPassword')}
                </h2>
                <p className="text-muted-foreground text-center text-sm mt-2">
                  {t('auth.resetDesc')}
                </p>
              </div>

              {resetSent ? (
                <div className="text-center py-6">
                  <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                    <Mail className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-medium text-foreground mb-2">{t('auth.checkEmail')}</h3>
                  <p className="text-muted-foreground text-sm">
                    {t('auth.resetSent')} {email}
                  </p>
                  <Button
                    type="button"
                    variant="ghost"
                    className="mt-4"
                    onClick={() => switchMode('login')}
                  >
                    {t('auth.backToSignIn')}
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-foreground">
                      {t('auth.email')}
                    </Label>
                    <div className="relative">
                      <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="example@email.com"
                        className="pr-10 bg-secondary/50 border-border focus:border-primary"
                        dir="ltr"
                      />
                    </div>
                    {errors.email && (
                      <p className="text-destructive text-sm">{errors.email}</p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    variant="gold"
                    className="w-full h-12 text-lg font-semibold"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        {t('auth.sending')}
                      </span>
                    ) : (
                      t('auth.sendResetLink')
                    )}
                  </Button>
                </form>
              )}
            </>
          ) : signupComplete ? (
            <>
              {/* Email Verification Message */}
              <div className="text-center py-6">
                <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-8 h-8 text-green-500" />
                </div>
                <h3 className="text-lg font-medium text-foreground mb-2">
                  {language === 'ar' ? 'تحقق من بريدك الإلكتروني' : 'Check Your Email'}
                </h3>
                <p className="text-muted-foreground text-sm mb-4">
                  {language === 'ar' 
                    ? `أرسلنا رابط التحقق إلى ${registeredEmail}` 
                    : `We sent a verification link to ${registeredEmail}`}
                </p>
                <div className="bg-secondary/50 rounded-lg p-4 mb-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Shield className="w-4 h-4 text-primary" />
                    <span>
                      {language === 'ar' 
                        ? 'لن تتمكن من الدخول حتى تتحقق من بريدك الإلكتروني'
                        : 'You cannot sign in until you verify your email'}
                    </span>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  className="mt-2"
                  onClick={() => switchMode('login')}
                >
                  {language === 'ar' ? 'العودة لتسجيل الدخول' : 'Back to Sign In'}
                </Button>
              </div>
            </>
          ) : (
            <>
              {/* Login/Signup Tabs */}
              <div className="flex gap-2 mb-6">
                <Button
                  type="button"
                  variant={mode === 'login' ? "gold" : "ghost"}
                  className="flex-1"
                  onClick={() => switchMode('login')}
                >
                  {t('auth.signIn')}
                </Button>
                <Button
                  type="button"
                  variant={mode === 'signup' ? "gold" : "ghost"}
                  className="flex-1"
                  onClick={() => switchMode('signup')}
                >
                  {t('auth.signUp')}
                </Button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {mode === 'signup' && (
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="text-foreground">
                      {t('auth.fullName')}
                    </Label>
                    <div className="relative">
                      <User className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="fullName"
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder={t('auth.enterName')}
                        className="pr-10 bg-secondary/50 border-border focus:border-primary text-right"
                        dir="rtl"
                      />
                    </div>
                    {errors.fullName && (
                      <p className="text-destructive text-sm">{errors.fullName}</p>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-foreground">
                    {t('auth.email')}
                  </Label>
                  <div className="relative">
                    <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="example@email.com"
                      className="pr-10 bg-secondary/50 border-border focus:border-primary"
                      dir="ltr"
                    />
                  </div>
                  {errors.email && (
                    <p className="text-destructive text-sm">{errors.email}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-foreground">
                    {t('auth.password')}
                  </Label>
                  <div className="relative">
                    <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="pr-10 pl-10 bg-secondary/50 border-border focus:border-primary"
                      dir="ltr"
                      autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-destructive text-sm">{errors.password}</p>
                  )}
                  
                  {/* Password Strength Indicator for Signup */}
                  {mode === 'signup' && password && (
                    <div className="space-y-2 mt-2">
                      <div className="flex items-center gap-2">
                        <Progress value={passwordStrength} className="h-2 flex-1" />
                        <span className={`text-xs font-medium ${
                          passwordStrength < 50 ? 'text-destructive' : 
                          passwordStrength < 75 ? 'text-yellow-500' : 'text-green-500'
                        }`}>
                          {passwordStrength < 50 
                            ? (language === 'ar' ? 'ضعيفة' : 'Weak')
                            : passwordStrength < 75 
                              ? (language === 'ar' ? 'متوسطة' : 'Medium')
                              : (language === 'ar' ? 'قوية' : 'Strong')
                          }
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground space-y-1">
                        <div className="flex items-center gap-1">
                          {password.length >= 8 ? <CheckCircle className="w-3 h-3 text-green-500" /> : <AlertTriangle className="w-3 h-3 text-muted-foreground" />}
                          <span>{language === 'ar' ? '8 أحرف على الأقل' : 'At least 8 characters'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {/[A-Z]/.test(password) ? <CheckCircle className="w-3 h-3 text-green-500" /> : <AlertTriangle className="w-3 h-3 text-muted-foreground" />}
                          <span>{language === 'ar' ? 'حرف كبير' : 'Uppercase letter'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {/[a-z]/.test(password) ? <CheckCircle className="w-3 h-3 text-green-500" /> : <AlertTriangle className="w-3 h-3 text-muted-foreground" />}
                          <span>{language === 'ar' ? 'حرف صغير' : 'Lowercase letter'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {/\d/.test(password) ? <CheckCircle className="w-3 h-3 text-green-500" /> : <AlertTriangle className="w-3 h-3 text-muted-foreground" />}
                          <span>{language === 'ar' ? 'رقم' : 'Number'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {/[@$!%*?&]/.test(password) ? <CheckCircle className="w-3 h-3 text-green-500" /> : <AlertTriangle className="w-3 h-3 text-muted-foreground" />}
                          <span>{language === 'ar' ? 'رمز خاص (@$!%*?&)' : 'Special character (@$!%*?&)'}</span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Lockout Warning */}
                  {mode === 'login' && loginAttempts > 0 && loginAttempts < MAX_LOGIN_ATTEMPTS && (
                    <div className="flex items-center gap-2 text-yellow-500 text-xs mt-1">
                      <Shield className="w-4 h-4" />
                      <span>
                        {language === 'ar' 
                          ? `${MAX_LOGIN_ATTEMPTS - loginAttempts} محاولات متبقية قبل الإيقاف المؤقت`
                          : `${MAX_LOGIN_ATTEMPTS - loginAttempts} attempts remaining before lockout`
                        }
                      </span>
                    </div>
                  )}
                  
                  {/* Lockout Active */}
                  {mode === 'login' && isLockedOut && (
                    <div className="flex items-center gap-2 text-destructive text-xs mt-1">
                      <AlertTriangle className="w-4 h-4" />
                      <span>
                        {language === 'ar' 
                          ? `الحساب موقوف مؤقتاً. يرجى الانتظار ${lockoutRemaining} ثانية`
                          : `Account locked. Please wait ${lockoutRemaining} seconds`
                        }
                      </span>
                    </div>
                  )}
                </div>

                {mode === 'login' && (
                  <div className="text-left">
                    <button
                      type="button"
                      onClick={() => switchMode('forgot')}
                      className="text-primary hover:underline text-sm font-medium"
                    >
                      {t('auth.forgotPassword')}
                    </button>
                  </div>
                )}

                <Button
                  type="submit"
                  variant="gold"
                  className="w-full h-12 text-lg font-semibold"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      {t('auth.processing')}
                    </span>
                  ) : mode === 'login' ? (
                    t('auth.signIn')
                  ) : (
                    t('auth.signUp')
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-muted-foreground text-sm">
                  {mode === 'login' ? t('auth.noAccount') : t('auth.haveAccount')}
                  <button
                    type="button"
                    onClick={() => switchMode(mode === 'login' ? 'signup' : 'login')}
                    className="text-primary hover:underline mr-2 font-medium"
                  >
                    {mode === 'login' ? t('auth.createAccount') : t('auth.signIn')}
                  </button>
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-muted-foreground text-sm mt-6 slide-up" style={{ animationDelay: '0.2s' }}>
          {t('auth.copyright')}
        </p>
      </div>
    </div>
  );
}