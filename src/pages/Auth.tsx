import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, Mail, Lock, User, Tent, ArrowLeft } from 'lucide-react';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().trim().email({ message: "Invalid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" })
});

const signupSchema = loginSchema.extend({
  fullName: z.string().trim().min(2, { message: "Name must be at least 2 characters" }).max(100)
});

const resetSchema = z.object({
  email: z.string().trim().email({ message: "Invalid email address" })
});

type AuthMode = 'login' | 'signup' | 'forgot';

export default function Auth() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [resetSent, setResetSent] = useState(false);

  const { signIn, signUp, resetPassword, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      if (mode === 'forgot') {
        const { error } = await resetPassword(email.trim());
        if (error) {
          toast({
            title: "خطأ",
            description: error.message,
            variant: "destructive"
          });
        } else {
          setResetSent(true);
          toast({
            title: "تم الإرسال!",
            description: "تحقق من بريدك الإلكتروني لإعادة تعيين كلمة المرور"
          });
        }
      } else if (mode === 'login') {
        const { error } = await signIn(email.trim(), password);
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            toast({
              title: "خطأ في تسجيل الدخول",
              description: "البريد الإلكتروني أو كلمة المرور غير صحيحة",
              variant: "destructive"
            });
          } else {
            toast({
              title: "خطأ",
              description: error.message,
              variant: "destructive"
            });
          }
        } else {
          toast({
            title: "مرحباً بك!",
            description: "تم تسجيل الدخول بنجاح"
          });
        }
      } else {
        const { error } = await signUp(email.trim(), password, fullName.trim());
        if (error) {
          if (error.message.includes('User already registered')) {
            toast({
              title: "المستخدم موجود",
              description: "هذا البريد الإلكتروني مسجل بالفعل. جرب تسجيل الدخول",
              variant: "destructive"
            });
          } else {
            toast({
              title: "خطأ",
              description: error.message,
              variant: "destructive"
            });
          }
        } else {
          toast({
            title: "تم إنشاء الحساب!",
            description: "مرحباً بك في LIFE TENT"
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
          <p className="text-muted-foreground">نظام إدارة الحياة المتكامل</p>
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
                  العودة
                </button>
                <h2 className="text-xl font-semibold text-foreground text-center">
                  استعادة كلمة المرور
                </h2>
                <p className="text-muted-foreground text-center text-sm mt-2">
                  أدخل بريدك الإلكتروني وسنرسل لك رابط لإعادة تعيين كلمة المرور
                </p>
              </div>

              {resetSent ? (
                <div className="text-center py-6">
                  <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                    <Mail className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-medium text-foreground mb-2">تحقق من بريدك</h3>
                  <p className="text-muted-foreground text-sm">
                    تم إرسال رابط إعادة تعيين كلمة المرور إلى {email}
                  </p>
                  <Button
                    type="button"
                    variant="ghost"
                    className="mt-4"
                    onClick={() => switchMode('login')}
                  >
                    العودة لتسجيل الدخول
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-foreground">
                      البريد الإلكتروني
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
                        جاري الإرسال...
                      </span>
                    ) : (
                      'إرسال رابط الاستعادة'
                    )}
                  </Button>
                </form>
              )}
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
                  تسجيل الدخول
                </Button>
                <Button
                  type="button"
                  variant={mode === 'signup' ? "gold" : "ghost"}
                  className="flex-1"
                  onClick={() => switchMode('signup')}
                >
                  حساب جديد
                </Button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {mode === 'signup' && (
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="text-foreground">
                      الاسم الكامل
                    </Label>
                    <div className="relative">
                      <User className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="fullName"
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="أدخل اسمك"
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
                    البريد الإلكتروني
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
                    كلمة المرور
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
                </div>

                {mode === 'login' && (
                  <div className="text-left">
                    <button
                      type="button"
                      onClick={() => switchMode('forgot')}
                      className="text-primary hover:underline text-sm font-medium"
                    >
                      نسيت كلمة المرور؟
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
                      جاري المعالجة...
                    </span>
                  ) : mode === 'login' ? (
                    'تسجيل الدخول'
                  ) : (
                    'إنشاء حساب'
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-muted-foreground text-sm">
                  {mode === 'login' ? 'ليس لديك حساب؟' : 'لديك حساب بالفعل؟'}
                  <button
                    type="button"
                    onClick={() => switchMode(mode === 'login' ? 'signup' : 'login')}
                    className="text-primary hover:underline mr-2 font-medium"
                  >
                    {mode === 'login' ? 'إنشاء حساب جديد' : 'تسجيل الدخول'}
                  </button>
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-muted-foreground text-sm mt-6 slide-up" style={{ animationDelay: '0.2s' }}>
          © 2025 LIFE TENT. جميع الحقوق محفوظة
        </p>
      </div>
    </div>
  );
}
