import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/hooks/useLanguage';
import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';
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
  Globe,
  ChevronDown,
  Play,
  Layers,
  MousePointerClick,
  Rocket,
  Award,
  LineChart
} from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();
  const { currentLanguage: language } = useLanguage();
  const { user } = useAuth();
  const isRTL = language === 'ar';
  const [scrolled, setScrolled] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);
  
  // Handle scroll for navbar effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  // Auto-rotate features
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % 8);
    }, 3000);
    return () => clearInterval(interval);
  }, []);
  
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
        ? 'حدد أهدافك وتتبع تقدمك نحو تحقيقها بطريقة ذكية مع مؤشرات الأداء'
        : 'Set your goals and track your progress with smart KPIs',
      color: 'from-amber-500 to-orange-600'
    },
    {
      icon: CheckCircle,
      title: isRTL ? 'إدارة المهام' : 'Task Management',
      description: isRTL 
        ? 'نظّم مهامك اليومية بكفاءة عالية وأولوية واضحة مع تذكيرات ذكية'
        : 'Organize tasks efficiently with smart reminders',
      color: 'from-emerald-500 to-teal-600'
    },
    {
      icon: Calendar,
      title: isRTL ? 'التقويم الذكي' : 'Smart Calendar',
      description: isRTL 
        ? 'تقويم هجري وميلادي متكامل مع أوقات الصلاة والمناسبات'
        : 'Integrated Hijri & Gregorian calendar with prayer times',
      color: 'from-blue-500 to-indigo-600'
    },
    {
      icon: Wallet,
      title: isRTL ? 'إدارة المالية' : 'Financial Management',
      description: isRTL 
        ? 'تحكم في ميزانيتك وتتبع نفقاتك ودخلك واستثماراتك'
        : 'Control budget, track expenses, income & investments',
      color: 'from-green-500 to-emerald-600'
    },
    {
      icon: BookOpen,
      title: isRTL ? 'مركز المعرفة' : 'Knowledge Center',
      description: isRTL 
        ? 'نظّم دوراتك التعليمية وملاحظاتك وبطاقات الحفظ الذكية'
        : 'Organize courses, notes, and smart flashcards',
      color: 'from-purple-500 to-violet-600'
    },
    {
      icon: BarChart3,
      title: isRTL ? 'إدارة المشاريع' : 'Project Management',
      description: isRTL 
        ? 'لوحة كانبان احترافية مع OKRs وتقارير الأداء'
        : 'Professional Kanban with OKRs and performance reports',
      color: 'from-rose-500 to-pink-600'
    },
    {
      icon: Clock,
      title: isRTL ? 'تقنية بومودورو' : 'Pomodoro Timer',
      description: isRTL 
        ? 'حسّن إنتاجيتك باستخدام تقنية إدارة الوقت المثبتة علمياً'
        : 'Boost productivity with scientifically proven technique',
      color: 'from-red-500 to-rose-600'
    },
    {
      icon: Heart,
      title: isRTL ? 'العادات والمزاج' : 'Habits & Mood',
      description: isRTL 
        ? 'تتبع عاداتك اليومية وحالتك المزاجية مع إحصائيات تفصيلية'
        : 'Track daily habits and mood with detailed statistics',
      color: 'from-pink-500 to-fuchsia-600'
    }
  ];

  const benefits = [
    {
      icon: Brain,
      title: isRTL ? 'تنظيم شامل' : 'Complete Organization',
      description: isRTL 
        ? 'كل ما تحتاجه في مكان واحد - وداعاً لعشرات التطبيقات'
        : 'Everything you need in one place - goodbye to dozens of apps'
    },
    {
      icon: Zap,
      title: isRTL ? 'إنتاجية مضاعفة' : 'Double Productivity',
      description: isRTL 
        ? 'أدوات ذكية تساعدك على إنجاز المزيد في وقت أقل'
        : 'Smart tools help you accomplish more in less time'
    },
    {
      icon: Shield,
      title: isRTL ? 'أمان متقدم' : 'Advanced Security',
      description: isRTL 
        ? 'بياناتك محمية بأعلى معايير التشفير والأمان'
        : 'Your data protected with highest encryption standards'
    },
    {
      icon: Globe,
      title: isRTL ? 'عربي وإنجليزي' : 'Arabic & English',
      description: isRTL 
        ? 'واجهة كاملة تدعم اللغتين بسلاسة تامة'
        : 'Full interface supporting both languages seamlessly'
    }
  ];

  const stats = [
    { value: '8+', label: isRTL ? 'أقسام متكاملة' : 'Integrated Modules', icon: Layers },
    { value: '24/7', label: isRTL ? 'متاح دائماً' : 'Always Available', icon: Clock },
    { value: '100%', label: isRTL ? 'مجاني للبدء' : 'Free to Start', icon: Rocket },
    { value: '∞', label: isRTL ? 'إمكانيات لا محدودة' : 'Unlimited', icon: TrendingUp }
  ];

  const testimonials = [
    {
      quote: isRTL 
        ? 'غيّر LIFE TENT طريقة إدارتي لحياتي تماماً. أصبحت أكثر إنتاجية وتنظيماً.'
        : 'LIFE TENT completely changed how I manage my life. I became more productive and organized.',
      author: isRTL ? 'أحمد محمد' : 'Ahmed Mohamed',
      role: isRTL ? 'رائد أعمال' : 'Entrepreneur'
    },
    {
      quote: isRTL 
        ? 'أخيراً وجدت تطبيقاً يجمع كل ما أحتاجه في مكان واحد مع دعم كامل للعربية.'
        : 'Finally found an app that combines everything I need in one place with full Arabic support.',
      author: isRTL ? 'سارة أحمد' : 'Sara Ahmed',
      role: isRTL ? 'مديرة مشاريع' : 'Project Manager'
    },
    {
      quote: isRTL 
        ? 'نظام إدارة المالية رائع! أستطيع تتبع كل شيء بسهولة مع التقارير التفصيلية.'
        : 'The financial management system is amazing! I can track everything easily with detailed reports.',
      author: isRTL ? 'خالد العلي' : 'Khalid Al-Ali',
      role: isRTL ? 'محاسب' : 'Accountant'
    }
  ];

  return (
    <div className="min-h-screen bg-background overflow-x-hidden" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled 
          ? 'bg-background/80 backdrop-blur-xl border-b border-border/50 shadow-lg' 
          : 'bg-transparent'
      }`}>
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 group cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="relative">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary via-primary/90 to-primary/70 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Tent className="w-6 h-6 text-primary-foreground" />
              </div>
              <div className="absolute -inset-1 bg-gradient-to-br from-primary/50 to-primary/20 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold gold-text tracking-wide">LIFE TENT</span>
              <span className="text-[10px] text-muted-foreground -mt-1 hidden sm:block">
                {isRTL ? 'نظام حياتك المتكامل' : 'Your Life System'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/auth')}
              className="hidden sm:flex hover:bg-primary/10 transition-colors"
            >
              {isRTL ? 'تسجيل الدخول' : 'Sign In'}
            </Button>
            <Button 
              variant="gold" 
              onClick={() => navigate('/auth')}
              className="gap-2 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              {isRTL ? 'ابدأ مجاناً' : 'Start Free'}
              {isRTL ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center pt-20 pb-10 px-4 overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* Gradient orbs */}
          <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-gradient-to-br from-primary/20 to-primary/5 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
          <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-gradient-to-tl from-primary/15 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s', animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-primary/10 to-transparent rounded-full" />
          
          {/* Floating particles */}
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-primary/30 rounded-full animate-float"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${5 + Math.random() * 5}s`
              }}
            />
          ))}
          
          {/* Grid pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,180,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,180,0,0.03)_1px,transparent_1px)] bg-[size:50px_50px]" />
        </div>

        <div className="container mx-auto text-center relative z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 border border-primary/30 text-primary mb-8 animate-fade-in backdrop-blur-sm">
            <Sparkles className="w-4 h-4 animate-pulse" />
            <span className="text-sm font-semibold tracking-wide">
              {isRTL ? 'نظام إدارة الحياة المتكامل #1' : '#1 Complete Life Management System'}
            </span>
            <Award className="w-4 h-4" />
          </div>

          {/* Main Heading */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black mb-8 leading-tight">
            <span className="block animate-fade-in" style={{ animationDelay: '0.1s' }}>
              <span className="bg-gradient-to-r from-primary via-yellow-500 to-primary bg-clip-text text-transparent animate-gradient bg-[length:200%_auto]">
                {isRTL ? 'نظّم حياتك' : 'Organize Life'}
              </span>
            </span>
            <span className="block text-foreground animate-fade-in" style={{ animationDelay: '0.2s' }}>
              {isRTL ? 'حقق أهدافك' : 'Achieve Goals'}
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl lg:text-2xl text-muted-foreground max-w-3xl mx-auto mb-12 animate-fade-in leading-relaxed" style={{ animationDelay: '0.3s' }}>
            {isRTL 
              ? 'منصة متكاملة لإدارة المهام والأهداف والمالية والمشاريع والمعرفة — كل ما تحتاجه لحياة منظمة وناجحة'
              : 'An all-in-one platform for tasks, goals, finances, projects & knowledge — everything for an organized, successful life'}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <Button 
              variant="gold" 
              size="lg" 
              onClick={() => navigate('/auth')}
              className="text-lg px-10 py-7 gap-3 shadow-2xl hover:shadow-primary/25 transition-all duration-300 hover:scale-105 group"
            >
              <Rocket className="w-5 h-5 group-hover:animate-bounce" />
              {isRTL ? 'ابدأ رحلتك مجاناً' : 'Start Your Journey Free'}
              {isRTL ? <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" /> : <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
              className="text-lg px-10 py-7 gap-3 border-2 hover:bg-primary/5 transition-all duration-300"
            >
              <Play className="w-5 h-5" />
              {isRTL ? 'شاهد المميزات' : 'See Features'}
            </Button>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto animate-fade-in" style={{ animationDelay: '0.5s' }}>
            {stats.map((stat, index) => (
              <div 
                key={index} 
                className="glass-card p-5 text-center group hover:scale-105 transition-all duration-300 cursor-default"
              >
                <stat.icon className="w-6 h-6 text-primary mx-auto mb-2 group-hover:scale-110 transition-transform" />
                <div className="text-3xl md:text-4xl font-bold gold-text mb-1">{stat.value}</div>
                <div className="text-xs text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Scroll indicator */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce hidden md:block">
            <ChevronDown className="w-8 h-8 text-primary/50" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-4 bg-gradient-to-b from-secondary/50 to-background relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,180,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,180,0,0.02)_1px,transparent_1px)] bg-[size:100px_100px]" />
        
        <div className="container mx-auto relative z-10">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary mb-6">
              <Layers className="w-4 h-4" />
              <span className="text-sm font-medium">{isRTL ? 'مميزات متكاملة' : 'Integrated Features'}</span>
            </div>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              {isRTL ? 'كل ما تحتاجه في' : 'Everything You Need'}
              <span className="gold-text"> {isRTL ? 'مكان واحد' : 'In One Place'}</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {isRTL 
                ? 'اكتشف مجموعة شاملة من الأدوات المصممة لمساعدتك على تحقيق أقصى إمكانياتك'
                : 'Discover a comprehensive set of tools designed to help you reach your full potential'}
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div 
                key={index}
                className={`glass-card p-6 cursor-pointer transition-all duration-500 group ${
                  activeFeature === index 
                    ? 'scale-105 shadow-2xl border-primary/50' 
                    : 'hover:scale-105 hover:shadow-xl'
                }`}
                onMouseEnter={() => setActiveFeature(index)}
              >
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                <div className={`h-1 bg-gradient-to-r ${feature.color} rounded-full mt-4 transition-all duration-500 ${
                  activeFeature === index ? 'w-full' : 'w-0 group-hover:w-full'
                }`} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24 px-4 relative overflow-hidden">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div className="order-2 lg:order-1">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary mb-6">
                <Star className="w-4 h-4" />
                <span className="text-sm font-medium">{isRTL ? 'لماذا نحن؟' : 'Why Us?'}</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-8">
                {isRTL ? 'لماذا تختار' : 'Why Choose'}
                <span className="gold-text"> LIFE TENT</span>
                {isRTL ? '؟' : '?'}
              </h2>
              <p className="text-lg text-muted-foreground mb-10 leading-relaxed">
                {isRTL 
                  ? 'صُمم LIFE TENT ليكون رفيقك الموثوق في رحلة تحقيق أهدافك وتنظيم حياتك بأفضل طريقة ممكنة. نحن نؤمن بأن التنظيم هو مفتاح النجاح.'
                  : 'LIFE TENT is designed to be your trusted companion in the journey of achieving your goals and organizing your life. We believe organization is the key to success.'}
              </p>
              <div className="space-y-6">
                {benefits.map((benefit, index) => (
                  <div 
                    key={index} 
                    className="flex items-start gap-5 group cursor-default p-4 rounded-xl hover:bg-primary/5 transition-all duration-300"
                  >
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center flex-shrink-0 group-hover:scale-110 group-hover:bg-primary/20 transition-all duration-300">
                      <benefit.icon className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg mb-1 group-hover:text-primary transition-colors">{benefit.title}</h3>
                      <p className="text-muted-foreground">{benefit.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="order-1 lg:order-2 relative">
              {/* Stats Cards */}
              <div className="relative">
                <div className="glass-card p-8 relative z-10">
                  <div className="grid grid-cols-2 gap-5">
                    <div className="glass-card p-6 text-center group hover:scale-105 transition-all duration-300">
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform shadow-lg">
                        <Target className="w-7 h-7 text-white" />
                      </div>
                      <div className="text-3xl font-bold gold-text mb-1">8+</div>
                      <div className="text-sm text-muted-foreground">{isRTL ? 'أقسام متكاملة' : 'Integrated Sections'}</div>
                    </div>
                    <div className="glass-card p-6 text-center group hover:scale-105 transition-all duration-300">
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform shadow-lg">
                        <Users className="w-7 h-7 text-white" />
                      </div>
                      <div className="text-3xl font-bold gold-text mb-1">∞</div>
                      <div className="text-sm text-muted-foreground">{isRTL ? 'مشاريع ومهام' : 'Projects & Tasks'}</div>
                    </div>
                    <div className="glass-card p-6 text-center group hover:scale-105 transition-all duration-300">
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform shadow-lg">
                        <LineChart className="w-7 h-7 text-white" />
                      </div>
                      <div className="text-3xl font-bold gold-text mb-1">100%</div>
                      <div className="text-sm text-muted-foreground">{isRTL ? 'تحكم كامل' : 'Full Control'}</div>
                    </div>
                    <div className="glass-card p-6 text-center group hover:scale-105 transition-all duration-300">
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform shadow-lg">
                        <Award className="w-7 h-7 text-white" />
                      </div>
                      <div className="text-3xl font-bold gold-text mb-1">5★</div>
                      <div className="text-sm text-muted-foreground">{isRTL ? 'تجربة مميزة' : 'Premium Experience'}</div>
                    </div>
                  </div>
                </div>
                {/* Decorative elements */}
                <div className="absolute -inset-4 bg-gradient-to-br from-primary/30 via-primary/10 to-transparent rounded-3xl blur-2xl -z-10" />
                <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-primary/40 to-transparent rounded-full blur-xl" />
                <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-gradient-to-tr from-primary/30 to-transparent rounded-full blur-xl" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 px-4 bg-gradient-to-b from-background via-secondary/30 to-background">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary mb-6">
              <Users className="w-4 h-4" />
              <span className="text-sm font-medium">{isRTL ? 'آراء المستخدمين' : 'User Reviews'}</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              {isRTL ? 'ماذا يقول' : 'What Our'}
              <span className="gold-text"> {isRTL ? 'مستخدمونا' : 'Users Say'}</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div 
                key={index}
                className="glass-card p-8 relative group hover:scale-105 transition-all duration-300"
              >
                <div className="absolute -top-3 -right-3 w-8 h-8 bg-gradient-to-br from-primary to-primary/70 rounded-full flex items-center justify-center shadow-lg">
                  <Star className="w-4 h-4 text-primary-foreground fill-current" />
                </div>
                <p className="text-lg mb-6 leading-relaxed text-foreground/90">"{testimonial.quote}"</p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center">
                    <span className="text-lg font-bold text-primary">{testimonial.author[0]}</span>
                  </div>
                  <div>
                    <div className="font-semibold">{testimonial.author}</div>
                    <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 relative overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-primary/10" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,180,0,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,180,0,0.05)_1px,transparent_1px)] bg-[size:50px_50px]" />
        
        <div className="container mx-auto text-center relative z-10">
          <div className="max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary mb-8">
              <Rocket className="w-4 h-4" />
              <span className="text-sm font-medium">{isRTL ? 'ابدأ الآن' : 'Get Started'}</span>
            </div>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-8">
              {isRTL ? 'جاهز لتغيير حياتك؟' : 'Ready to Transform Your Life?'}
            </h2>
            <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed">
              {isRTL 
                ? 'انضم إلى آلاف المستخدمين الذين غيّروا طريقة إدارتهم لحياتهم مع LIFE TENT'
                : 'Join thousands of users who have transformed the way they manage their lives with LIFE TENT'}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <Button 
                variant="gold" 
                size="lg" 
                onClick={() => navigate('/auth')}
                className="text-xl px-12 py-8 gap-3 shadow-2xl hover:shadow-primary/30 transition-all duration-300 hover:scale-105 group"
              >
                <MousePointerClick className="w-6 h-6 group-hover:animate-pulse" />
                {isRTL ? 'سجّل مجاناً الآن' : 'Sign Up Free Now'}
                {isRTL ? <ArrowLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" /> : <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-6">
              {isRTL ? 'لا حاجة لبطاقة ائتمان • إعداد في دقيقتين' : 'No credit card required • Setup in 2 minutes'}
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 px-4 border-t border-border/50 bg-secondary/20">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-4 group cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary via-primary/90 to-primary/70 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <Tent className="w-7 h-7 text-primary-foreground" />
              </div>
              <div>
                <span className="text-2xl font-bold gold-text block">LIFE TENT</span>
                <span className="text-xs text-muted-foreground">{isRTL ? 'نظام حياتك المتكامل' : 'Your Complete Life System'}</span>
              </div>
            </div>
            
            <p className="text-sm text-muted-foreground text-center">
              {isRTL 
                ? '© 2025 LIFE TENT. جميع الحقوق محفوظة.'
                : '© 2025 LIFE TENT. All rights reserved.'}
            </p>
            
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate('/auth')}
                className="hover:bg-primary/10"
              >
                {isRTL ? 'تسجيل الدخول' : 'Sign In'}
              </Button>
              <Button 
                variant="gold" 
                size="sm" 
                onClick={() => navigate('/auth')}
                className="shadow-lg"
              >
                {isRTL ? 'إنشاء حساب' : 'Sign Up'}
              </Button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
