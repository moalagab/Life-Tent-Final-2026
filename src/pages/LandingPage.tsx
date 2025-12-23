import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/hooks/useLanguage';
import { useAuth } from '@/hooks/useAuth';
import { useEffect } from 'react';
import { 
  Tent, 
  Target, 
  CheckCircle, 
  Calendar, 
  Wallet, 
  BookOpen, 
  BarChart3, 
  Clock, 
  Shield, 
  Sparkles,
  ArrowLeft,
  ArrowRight,
  Star,
  Zap,
  Users,
  TrendingUp,
  Brain,
  Heart,
  Globe
} from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();
  const { currentLanguage: language } = useLanguage();
  const { user } = useAuth();
  const isRTL = language === 'ar';
  
  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const features = [
    {
      icon: Target,
      title: isRTL ? 'إدارة الأهداف' : 'Goal Management',
      description: isRTL 
        ? 'حدد أهدافك وتتبع تقدمك نحو تحقيقها بطريقة ذكية'
        : 'Set your goals and track your progress towards achieving them smartly'
    },
    {
      icon: CheckCircle,
      title: isRTL ? 'إدارة المهام' : 'Task Management',
      description: isRTL 
        ? 'نظّم مهامك اليومية بكفاءة عالية وأولوية واضحة'
        : 'Organize your daily tasks efficiently with clear priorities'
    },
    {
      icon: Calendar,
      title: isRTL ? 'التقويم والمواعيد' : 'Calendar & Events',
      description: isRTL 
        ? 'تتبع مواعيدك وأحداثك المهمة مع التقويم الهجري والميلادي'
        : 'Track your appointments and important events with Hijri and Gregorian calendars'
    },
    {
      icon: Wallet,
      title: isRTL ? 'إدارة المالية' : 'Financial Management',
      description: isRTL 
        ? 'تحكم في ميزانيتك وتتبع نفقاتك ودخلك بسهولة'
        : 'Control your budget and track your expenses and income easily'
    },
    {
      icon: BookOpen,
      title: isRTL ? 'مركز المعرفة' : 'Knowledge Center',
      description: isRTL 
        ? 'نظّم دوراتك التعليمية وملاحظاتك وبطاقات الحفظ'
        : 'Organize your courses, notes, and flashcards'
    },
    {
      icon: BarChart3,
      title: isRTL ? 'إدارة المشاريع' : 'Project Management',
      description: isRTL 
        ? 'أدر مشاريعك بطريقة احترافية مع لوحة كانبان'
        : 'Manage your projects professionally with Kanban board'
    },
    {
      icon: Clock,
      title: isRTL ? 'تقنية بومودورو' : 'Pomodoro Technique',
      description: isRTL 
        ? 'حسّن إنتاجيتك باستخدام تقنية إدارة الوقت الفعالة'
        : 'Improve your productivity using effective time management technique'
    },
    {
      icon: Heart,
      title: isRTL ? 'العادات والمزاج' : 'Habits & Mood',
      description: isRTL 
        ? 'تتبع عاداتك اليومية وحالتك المزاجية لتحسين حياتك'
        : 'Track your daily habits and mood to improve your life'
    }
  ];

  const benefits = [
    {
      icon: Brain,
      title: isRTL ? 'تنظيم شامل' : 'Complete Organization',
      description: isRTL 
        ? 'كل ما تحتاجه في مكان واحد - لا حاجة لعشرات التطبيقات'
        : 'Everything you need in one place - no need for dozens of apps'
    },
    {
      icon: Zap,
      title: isRTL ? 'إنتاجية عالية' : 'High Productivity',
      description: isRTL 
        ? 'أدوات ذكية تساعدك على إنجاز المزيد في وقت أقل'
        : 'Smart tools help you accomplish more in less time'
    },
    {
      icon: Shield,
      title: isRTL ? 'أمان وخصوصية' : 'Security & Privacy',
      description: isRTL 
        ? 'بياناتك محمية بأعلى معايير الأمان والتشفير'
        : 'Your data is protected with the highest security standards'
    },
    {
      icon: Globe,
      title: isRTL ? 'دعم ثنائي اللغة' : 'Bilingual Support',
      description: isRTL 
        ? 'واجهة كاملة باللغتين العربية والإنجليزية'
        : 'Full interface in both Arabic and English'
    }
  ];

  const stats = [
    { value: '100%', label: isRTL ? 'مجاني للبدء' : 'Free to Start' },
    { value: '24/7', label: isRTL ? 'متاح دائماً' : 'Always Available' },
    { value: '∞', label: isRTL ? 'إمكانيات لا محدودة' : 'Unlimited Possibilities' }
  ];

  return (
    <div className="min-h-screen bg-background" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-border/50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center gold-glow">
              <Tent className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold gold-text">LIFE TENT</span>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/auth')}
              className="hidden sm:flex"
            >
              {isRTL ? 'تسجيل الدخول' : 'Sign In'}
            </Button>
            <Button 
              variant="gold" 
              onClick={() => navigate('/auth')}
              className="gap-2"
            >
              {isRTL ? 'ابدأ مجاناً' : 'Start Free'}
              {isRTL ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-3xl animate-pulse-slow" />
          <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-primary/5 rounded-full blur-3xl animate-float" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-radial from-primary/5 to-transparent rounded-full" />
        </div>

        <div className="container mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary mb-6 animate-fade-in">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium">
              {isRTL ? 'نظام إدارة الحياة المتكامل' : 'Complete Life Management System'}
            </span>
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <span className="gold-text">
              {isRTL ? 'نظّم حياتك' : 'Organize Your Life'}
            </span>
            <br />
            <span className="text-foreground">
              {isRTL ? 'حقق أهدافك' : 'Achieve Your Goals'}
            </span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            {isRTL 
              ? 'منصة متكاملة لإدارة المهام والأهداف والمالية والمشاريع والمعرفة - كل ما تحتاجه لحياة منظمة وناجحة في مكان واحد'
              : 'An integrated platform for managing tasks, goals, finances, projects, and knowledge - everything you need for an organized and successful life in one place'}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <Button 
              variant="gold" 
              size="lg" 
              onClick={() => navigate('/auth')}
              className="text-lg px-8 py-6 gap-2 gold-glow"
            >
              {isRTL ? 'ابدأ رحلتك الآن' : 'Start Your Journey Now'}
              {isRTL ? <ArrowLeft className="w-5 h-5" /> : <ArrowRight className="w-5 h-5" />}
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
              className="text-lg px-8 py-6"
            >
              {isRTL ? 'اكتشف المميزات' : 'Discover Features'}
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: '0.4s' }}>
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold gold-text mb-1">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-secondary/30">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {isRTL ? 'مميزات قوية لحياة منظمة' : 'Powerful Features for an Organized Life'}
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {isRTL 
                ? 'اكتشف مجموعة شاملة من الأدوات المصممة لمساعدتك على تحقيق أقصى إمكانياتك'
                : 'Discover a comprehensive set of tools designed to help you reach your full potential'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="glass-card p-6 hover:scale-105 transition-all duration-300 group cursor-pointer"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                {isRTL ? 'لماذا تختار LIFE TENT؟' : 'Why Choose LIFE TENT?'}
              </h2>
              <p className="text-muted-foreground mb-8">
                {isRTL 
                  ? 'صُمم LIFE TENT ليكون رفيقك الموثوق في رحلة تحقيق أهدافك وتنظيم حياتك بأفضل طريقة ممكنة.'
                  : 'LIFE TENT is designed to be your trusted companion in the journey of achieving your goals and organizing your life in the best possible way.'}
              </p>
              <div className="space-y-6">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <benefit.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">{benefit.title}</h3>
                      <p className="text-sm text-muted-foreground">{benefit.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="glass-card p-8 relative z-10">
                <div className="grid grid-cols-2 gap-4">
                  <div className="glass-card p-4 text-center">
                    <Target className="w-8 h-8 text-primary mx-auto mb-2" />
                    <div className="text-2xl font-bold gold-text">8+</div>
                    <div className="text-xs text-muted-foreground">{isRTL ? 'أقسام متكاملة' : 'Integrated Sections'}</div>
                  </div>
                  <div className="glass-card p-4 text-center">
                    <Users className="w-8 h-8 text-primary mx-auto mb-2" />
                    <div className="text-2xl font-bold gold-text">∞</div>
                    <div className="text-xs text-muted-foreground">{isRTL ? 'مشاريع ومهام' : 'Projects & Tasks'}</div>
                  </div>
                  <div className="glass-card p-4 text-center">
                    <TrendingUp className="w-8 h-8 text-primary mx-auto mb-2" />
                    <div className="text-2xl font-bold gold-text">100%</div>
                    <div className="text-xs text-muted-foreground">{isRTL ? 'تحكم كامل' : 'Full Control'}</div>
                  </div>
                  <div className="glass-card p-4 text-center">
                    <Star className="w-8 h-8 text-primary mx-auto mb-2" />
                    <div className="text-2xl font-bold gold-text">5★</div>
                    <div className="text-xs text-muted-foreground">{isRTL ? 'تجربة مميزة' : 'Premium Experience'}</div>
                  </div>
                </div>
              </div>
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent rounded-3xl blur-2xl -z-10 transform rotate-3" />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-primary/10 via-background to-primary/5">
        <div className="container mx-auto text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              {isRTL ? 'ابدأ رحلتك نحو حياة منظمة' : 'Start Your Journey to an Organized Life'}
            </h2>
            <p className="text-muted-foreground mb-8">
              {isRTL 
                ? 'انضم إلينا اليوم واكتشف كيف يمكن لـ LIFE TENT أن يغير طريقة إدارتك لحياتك'
                : 'Join us today and discover how LIFE TENT can change the way you manage your life'}
            </p>
            <Button 
              variant="gold" 
              size="lg" 
              onClick={() => navigate('/auth')}
              className="text-lg px-10 py-6 gap-2 gold-glow"
            >
              {isRTL ? 'سجّل مجاناً الآن' : 'Sign Up Free Now'}
              {isRTL ? <ArrowLeft className="w-5 h-5" /> : <ArrowRight className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-border/50">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
                <Tent className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold gold-text">LIFE TENT</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {isRTL 
                ? '© 2024 LIFE TENT. جميع الحقوق محفوظة.'
                : '© 2024 LIFE TENT. All rights reserved.'}
            </p>
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => navigate('/auth')}>
                {isRTL ? 'تسجيل الدخول' : 'Sign In'}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => navigate('/auth')}>
                {isRTL ? 'إنشاء حساب' : 'Sign Up'}
              </Button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
