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
  const { currentLanguage: language, t } = useLanguage();
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
      title: t('landing.goalManagement'),
      description: t('landing.goalManagementDesc'),
      color: 'from-amber-500 to-orange-600'
    },
    {
      icon: CheckCircle,
      title: t('landing.taskManagement'),
      description: t('landing.taskManagementDesc'),
      color: 'from-emerald-500 to-teal-600'
    },
    {
      icon: Calendar,
      title: t('landing.smartCalendar'),
      description: t('landing.smartCalendarDesc'),
      color: 'from-blue-500 to-indigo-600'
    },
    {
      icon: Wallet,
      title: t('landing.financialManagement'),
      description: t('landing.financialManagementDesc'),
      color: 'from-green-500 to-emerald-600'
    },
    {
      icon: BookOpen,
      title: t('landing.knowledgeCenter'),
      description: t('landing.knowledgeCenterDesc'),
      color: 'from-purple-500 to-violet-600'
    },
    {
      icon: BarChart3,
      title: t('landing.projectManagement'),
      description: t('landing.projectManagementDesc'),
      color: 'from-rose-500 to-pink-600'
    },
    {
      icon: Clock,
      title: t('landing.pomodoroTimer'),
      description: t('landing.pomodoroTimerDesc'),
      color: 'from-red-500 to-rose-600'
    },
    {
      icon: Heart,
      title: t('landing.habitsMood'),
      description: t('landing.habitsMoodDesc'),
      color: 'from-pink-500 to-fuchsia-600'
    }
  ];

  const benefits = [
    {
      icon: Brain,
      title: t('landing.completeOrganization'),
      description: t('landing.completeOrganizationDesc')
    },
    {
      icon: Zap,
      title: t('landing.doubleProductivity'),
      description: t('landing.doubleProductivityDesc')
    },
    {
      icon: Shield,
      title: t('landing.advancedSecurity'),
      description: t('landing.advancedSecurityDesc')
    },
    {
      icon: Globe,
      title: t('landing.arabicEnglish'),
      description: t('landing.arabicEnglishDesc')
    }
  ];

  const stats = [
    { value: '8+', label: t('landing.integratedModules'), icon: Layers },
    { value: '24/7', label: t('landing.alwaysAvailable'), icon: Clock },
    { value: '3', label: t('landing.freeTrialBadge'), icon: Rocket },
    { value: '∞', label: t('landing.unlimited'), icon: TrendingUp }
  ];

  const showcaseFeatures = [
    {
      icon: BarChart3,
      title: t('landing.feature1Title'),
      description: t('landing.feature1Desc')
    },
    {
      icon: LineChart,
      title: t('landing.feature2Title'),
      description: t('landing.feature2Desc')
    },
    {
      icon: Globe,
      title: t('landing.feature3Title'),
      description: t('landing.feature3Desc')
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
                {t('landing.yourLifeSystem')}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/auth')}
              className="hidden sm:flex hover:bg-primary/10 transition-colors"
            >
              {t('landing.signIn')}
            </Button>
            <Button 
              variant="gold" 
              onClick={() => navigate('/auth')}
              className="gap-2 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              {t('landing.startFree')}
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
          <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-gradient-to-br from-primary/10 to-primary/[0.02] rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
          <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-gradient-to-tl from-primary/8 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s', animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-primary/5 to-transparent rounded-full" />
          
          {/* Floating particles */}
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-primary/20 rounded-full animate-float"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${5 + Math.random() * 5}s`
              }}
            />
          ))}
          
          {/* Grid pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,180,0,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,180,0,0.015)_1px,transparent_1px)] bg-[size:50px_50px]" />
        </div>

        <div className="container mx-auto text-center relative z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 border border-primary/30 text-primary mb-8 animate-fade-in backdrop-blur-sm">
            <Sparkles className="w-4 h-4 animate-pulse" />
            <span className="text-sm font-semibold tracking-wide">
              {t('landing.systemBadge')}
            </span>
            <Award className="w-4 h-4" />
          </div>

          {/* Main Heading */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black mb-8 leading-tight">
            <span className="block animate-fade-in" style={{ animationDelay: '0.1s' }}>
              <span className="bg-gradient-to-r from-primary via-yellow-500 to-primary bg-clip-text text-transparent animate-gradient bg-[length:200%_auto]">
                {t('landing.heroTitle1')}
              </span>
            </span>
            <span className="block text-foreground animate-fade-in" style={{ animationDelay: '0.2s' }}>
              {t('landing.heroTitle2')}
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl lg:text-2xl text-muted-foreground max-w-3xl mx-auto mb-12 animate-fade-in leading-relaxed" style={{ animationDelay: '0.3s' }}>
            {t('landing.heroSubtitle')}
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
              {t('landing.startJourneyFree')}
              {isRTL ? <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" /> : <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
              className="text-lg px-10 py-7 gap-3 border-2 hover:bg-primary/5 transition-all duration-300"
            >
              <Play className="w-5 h-5" />
              {t('landing.seeFeatures')}
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
              <span className="text-sm font-medium">{t('landing.integratedFeatures')}</span>
            </div>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              {t('landing.everythingYouNeed')}
              <span className="gold-text"> {t('landing.onePlace')}</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t('landing.featuresDescription')}
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
                <span className="text-sm font-medium">{t('landing.whyChoose')}</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-8">
                {t('landing.whyChoose')}
                <span className="gold-text"> LIFE TENT</span>
                {isRTL ? '؟' : '?'}
              </h2>
              <p className="text-lg text-muted-foreground mb-10 leading-relaxed">
                {t('landing.benefitsDescription')}
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
                      <div className="text-sm text-muted-foreground">{t('landing.integratedModules')}</div>
                    </div>
                    <div className="glass-card p-6 text-center group hover:scale-105 transition-all duration-300">
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform shadow-lg">
                        <Clock className="w-7 h-7 text-white" />
                      </div>
                      <div className="text-3xl font-bold gold-text mb-1">24/7</div>
                      <div className="text-sm text-muted-foreground">{t('landing.alwaysAvailable')}</div>
                    </div>
                    <div className="glass-card p-6 text-center group hover:scale-105 transition-all duration-300">
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform shadow-lg">
                        <Rocket className="w-7 h-7 text-white" />
                      </div>
                      <div className="text-3xl font-bold gold-text mb-1">3</div>
                      <div className="text-sm text-muted-foreground">{t('landing.freeTrialBadge')}</div>
                    </div>
                    <div className="glass-card p-6 text-center group hover:scale-105 transition-all duration-300">
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform shadow-lg">
                        <TrendingUp className="w-7 h-7 text-white" />
                      </div>
                      <div className="text-3xl font-bold gold-text mb-1">∞</div>
                      <div className="text-sm text-muted-foreground">{t('landing.unlimited')}</div>
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

      {/* Features Showcase Section */}
      <section className="py-24 px-4 bg-gradient-to-b from-background via-secondary/30 to-background">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary mb-6">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-medium">{t('landing.featuresShowcase')}</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              {t('landing.featuresShowcase')}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {showcaseFeatures.map((feature, index) => (
              <div 
                key={index}
                className="glass-card p-8 relative group hover:scale-105 transition-all duration-300 text-center"
              >
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                  <feature.icon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
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
              <span className="text-sm font-medium">{t('landing.startFree')}</span>
            </div>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-8">
              {t('landing.readyToTransform')}
            </h2>
            <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed">
              {t('landing.ctaDescription')}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <Button 
                variant="gold" 
                size="lg" 
                onClick={() => navigate('/auth')}
                className="text-xl px-12 py-8 gap-3 shadow-2xl hover:shadow-primary/30 transition-all duration-300 hover:scale-105 group"
              >
                <MousePointerClick className="w-6 h-6 group-hover:animate-pulse" />
                {t('landing.startNowFree')}
                {isRTL ? <ArrowLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" /> : <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-6">
              {t('landing.noCardRequired')}
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
                <span className="text-xs text-muted-foreground">{t('landing.yourLifeSystem')}</span>
              </div>
            </div>
            
            <p className="text-sm text-muted-foreground text-center">
              {t('landing.copyright')}
            </p>
            
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate('/auth')}
                className="hover:bg-primary/10"
              >
                {t('landing.signIn')}
              </Button>
              <Button 
                variant="gold" 
                size="sm" 
                onClick={() => navigate('/auth')}
                className="shadow-lg"
              >
                {t('landing.startFree')}
              </Button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
