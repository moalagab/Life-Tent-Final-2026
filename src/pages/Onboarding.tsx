import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { Tent, CheckCircle, ArrowLeft, ArrowRight, Sparkles, Sun, Moon, Globe, LayoutDashboard, ListTodo, FolderKanban, Wallet, Flame, Target, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useOnboarding, FocusArea, DashboardPreset } from '@/hooks/useOnboarding';
import { useLanguage } from '@/hooks/useLanguage';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

// ─── Step definitions ────────────────────────────────────────────────────────

const TOTAL_STEPS = 5;

// ─── Focus area cards ────────────────────────────────────────────────────────

interface AreaCard {
  id: FocusArea;
  icon: React.ReactNode;
  labelAr: string;
  labelEn: string;
  descAr: string;
  descEn: string;
}

const AREA_CARDS: AreaCard[] = [
  { id: 'tasks',     icon: <ListTodo className="w-6 h-6" />,     labelAr: 'المهام',     labelEn: 'Tasks',     descAr: 'تنظيم مهامك اليومية', descEn: 'Organize your daily tasks' },
  { id: 'projects',  icon: <FolderKanban className="w-6 h-6" />, labelAr: 'المشاريع',   labelEn: 'Projects',  descAr: 'تتبع مشاريعك ولوحات كانبان', descEn: 'Track projects & kanban boards' },
  { id: 'finance',   icon: <Wallet className="w-6 h-6" />,       labelAr: 'المالية',    labelEn: 'Finance',   descAr: 'ميزانيات ومصروفات وتقارير', descEn: 'Budgets, expenses & reports' },
  { id: 'habits',    icon: <Flame className="w-6 h-6" />,        labelAr: 'العادات',    labelEn: 'Habits',    descAr: 'بناء عادات يومية متسقة', descEn: 'Build consistent daily habits' },
  { id: 'goals',     icon: <Target className="w-6 h-6" />,       labelAr: 'الأهداف',   labelEn: 'Goals',     descAr: 'أهداف OKR وخطط طويلة المدى', descEn: 'OKR goals & long-term plans' },
  { id: 'knowledge', icon: <BookOpen className="w-6 h-6" />,     labelAr: 'المعرفة',   labelEn: 'Knowledge', descAr: 'ملاحظات ومصادر وقاعدة بيانات', descEn: 'Notes, resources & knowledge base' },
];

// ─── Dashboard preset cards ───────────────────────────────────────────────────

interface PresetCard {
  id: DashboardPreset;
  labelAr: string;
  labelEn: string;
  descAr: string;
  descEn: string;
  areas: string[];
}

const PRESET_CARDS: PresetCard[] = [
  {
    id: 'focus',
    labelAr: 'التركيز',
    labelEn: 'Focus',
    descAr: 'مهام وعادات وأهداف في المقدمة',
    descEn: 'Tasks, habits & goals front and center',
    areas: ['tasks', 'habits', 'goals'],
  },
  {
    id: 'finance',
    labelAr: 'المالية',
    labelEn: 'Finance',
    descAr: 'لوحة مالية شاملة مع تقارير',
    descEn: 'Full financial dashboard with reports',
    areas: ['finance', 'projects', 'goals'],
  },
  {
    id: 'execution',
    labelAr: 'التنفيذ',
    labelEn: 'Execution',
    descAr: 'مشاريع ومهام وأدوات الإنتاجية',
    descEn: 'Projects, tasks & productivity tools',
    areas: ['projects', 'tasks', 'knowledge'],
  },
];

// ─── ProgressBar ─────────────────────────────────────────────────────────────

function ProgressBar({ step }: { step: number }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'h-1.5 flex-1 rounded-full transition-all duration-500',
            i < step ? 'bg-primary' : 'bg-border'
          )}
        />
      ))}
    </div>
  );
}

// ─── Step 1: Welcome ─────────────────────────────────────────────────────────

function StepWelcome({ name, onNameChange, isRTL }: { name: string; onNameChange: (v: string) => void; isRTL: boolean }) {
  return (
    <div className="text-center space-y-6 animate-fade-in">
      <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-primary/70 shadow-2xl shadow-primary/20 mb-2">
        <Tent className="w-10 h-10 text-primary-foreground" />
      </div>
      <div>
        <h2 className="text-3xl font-bold gold-text mb-2">
          {isRTL ? 'مرحباً بك في LIFE TENT' : 'Welcome to LIFE TENT'}
        </h2>
        <p className="text-muted-foreground">
          {isRTL ? 'لنبدأ بإعداد مساحتك الشخصية' : "Let's set up your personal workspace"}
        </p>
      </div>
      <div className="max-w-sm mx-auto space-y-2">
        <label className="text-sm font-medium text-foreground block text-start">
          {isRTL ? 'ما اسمك؟' : 'What should we call you?'}
        </label>
        <Input
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder={isRTL ? 'أدخل اسمك...' : 'Enter your name...'}
          className="text-center text-lg h-12 bg-secondary/50"
          dir={isRTL ? 'rtl' : 'ltr'}
          autoFocus
        />
      </div>
    </div>
  );
}

// ─── Step 2: Language & Theme ─────────────────────────────────────────────────

function StepAppearance({ isRTL }: { isRTL: boolean }) {
  const { theme, setTheme } = useTheme();
  const { currentLanguage, changeLanguage } = useLanguage();

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          {isRTL ? 'المظهر واللغة' : 'Appearance & Language'}
        </h2>
        <p className="text-muted-foreground text-sm">
          {isRTL ? 'اختر ما يناسبك — يمكنك تغييره لاحقاً' : 'Choose what suits you — you can change it later'}
        </p>
      </div>

      {/* Language */}
      <div className="space-y-3">
        <p className="text-sm font-medium text-foreground flex items-center gap-2">
          <Globe className="w-4 h-4 text-primary" />
          {isRTL ? 'اللغة' : 'Language'}
        </p>
        <div className="grid grid-cols-2 gap-3">
          {(['ar', 'en'] as const).map((lang) => (
            <button
              key={lang}
              onClick={() => changeLanguage(lang)}
              className={cn(
                'p-4 rounded-xl border-2 transition-all duration-200 text-center',
                currentLanguage === lang
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-secondary/40 text-foreground hover:border-primary/50'
              )}
            >
              <div className="text-2xl mb-1">{lang === 'ar' ? '🇸🇦' : '🇺🇸'}</div>
              <div className="font-semibold">{lang === 'ar' ? 'العربية' : 'English'}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Theme */}
      <div className="space-y-3">
        <p className="text-sm font-medium text-foreground flex items-center gap-2">
          <Sun className="w-4 h-4 text-primary" />
          {isRTL ? 'المظهر' : 'Theme'}
        </p>
        <div className="grid grid-cols-2 gap-3">
          {(['light', 'dark'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTheme(t)}
              className={cn(
                'p-4 rounded-xl border-2 transition-all duration-200 text-center',
                theme === t
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-secondary/40 text-foreground hover:border-primary/50'
              )}
            >
              <div className="flex justify-center mb-1">
                {t === 'light' ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
              </div>
              <div className="font-semibold">
                {t === 'light' ? (isRTL ? 'فاتح' : 'Light') : (isRTL ? 'داكن' : 'Dark')}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Step 3: Focus Areas ──────────────────────────────────────────────────────

function StepFocusAreas({ selected, onToggle, isRTL }: { selected: FocusArea[]; onToggle: (id: FocusArea) => void; isRTL: boolean }) {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          {isRTL ? 'ما الذي تريد تتبعه؟' : 'What do you want to track?'}
        </h2>
        <p className="text-muted-foreground text-sm">
          {isRTL ? 'اختر واحداً أو أكثر — يمكن تغييره لاحقاً' : 'Pick one or more — you can change this later'}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {AREA_CARDS.map((area) => {
          const isSelected = selected.includes(area.id);
          return (
            <button
              key={area.id}
              onClick={() => onToggle(area.id)}
              className={cn(
                'p-4 rounded-xl border-2 transition-all duration-200 text-start relative',
                isSelected
                  ? 'border-primary bg-primary/10'
                  : 'border-border bg-secondary/40 hover:border-primary/50'
              )}
            >
              {isSelected && (
                <CheckCircle className="w-4 h-4 text-primary absolute top-2.5 end-2.5" />
              )}
              <div className={cn('mb-2', isSelected ? 'text-primary' : 'text-muted-foreground')}>
                {area.icon}
              </div>
              <div className="font-semibold text-foreground text-sm">
                {isRTL ? area.labelAr : area.labelEn}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {isRTL ? area.descAr : area.descEn}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Step 4: Dashboard Preset ─────────────────────────────────────────────────

function StepPreset({ selected, onSelect, isRTL }: { selected: DashboardPreset; onSelect: (p: DashboardPreset) => void; isRTL: boolean }) {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          {isRTL ? 'اختر تخطيط لوحتك' : 'Choose your dashboard layout'}
        </h2>
        <p className="text-muted-foreground text-sm">
          {isRTL ? 'ما الذي يناسب أسلوبك في العمل؟' : 'What fits your working style?'}
        </p>
      </div>
      <div className="space-y-3">
        {PRESET_CARDS.map((preset) => {
          const isSelected = selected === preset.id;
          return (
            <button
              key={preset.id}
              onClick={() => onSelect(preset.id)}
              className={cn(
                'w-full p-4 rounded-xl border-2 transition-all duration-200 text-start flex items-center gap-4',
                isSelected
                  ? 'border-primary bg-primary/10'
                  : 'border-border bg-secondary/40 hover:border-primary/50'
              )}
            >
              <div className={cn(
                'w-10 h-10 rounded-lg flex items-center justify-center shrink-0',
                isSelected ? 'bg-primary/20 text-primary' : 'bg-secondary text-muted-foreground'
              )}>
                <LayoutDashboard className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-foreground">
                  {isRTL ? preset.labelAr : preset.labelEn}
                </div>
                <div className="text-sm text-muted-foreground">
                  {isRTL ? preset.descAr : preset.descEn}
                </div>
              </div>
              {isSelected && (
                <CheckCircle className="w-5 h-5 text-primary shrink-0" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Step 5: All Done ─────────────────────────────────────────────────────────

function StepDone({ name, isRTL }: { name: string; isRTL: boolean }) {
  return (
    <div className="text-center space-y-6 animate-fade-in">
      <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 mb-2">
        <Sparkles className="w-12 h-12 text-primary" />
      </div>
      <div>
        <h2 className="text-3xl font-bold text-foreground mb-2">
          {isRTL
            ? `جاهز يا ${name || 'صديق'}!`
            : `You're all set${name ? `, ${name}` : ''}!`}
        </h2>
        <p className="text-muted-foreground max-w-xs mx-auto">
          {isRTL
            ? 'تم إعداد مساحتك الشخصية. حان وقت الانطلاق.'
            : 'Your personal workspace is ready. Time to get started.'}
        </p>
      </div>
      <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-primary" />
          <span>{isRTL ? 'اللغة والمظهر تم ضبطهما' : 'Language & theme configured'}</span>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-primary" />
          <span>{isRTL ? 'مجالات التركيز محددة' : 'Focus areas selected'}</span>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-primary" />
          <span>{isRTL ? 'تخطيط اللوحة جاهز' : 'Dashboard layout ready'}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Main Onboarding Page ─────────────────────────────────────────────────────

export default function Onboarding() {
  const navigate = useNavigate();
  const { completeOnboarding, skipOnboarding, isCompleted } = useOnboarding();
  const { currentLanguage } = useLanguage();
  const { user } = useAuth();
  const isRTL = currentLanguage === 'ar';

  const [step, setStep] = useState(1);
  const [name, setName] = useState(
    user?.user_metadata?.full_name ?? ''
  );
  const [focusAreas, setFocusAreas] = useState<FocusArea[]>(['tasks', 'goals']);
  const [preset, setPreset] = useState<DashboardPreset>('focus');

  // If already completed, redirect immediately (must use <Navigate> not navigate() in render)
  if (isCompleted) {
    return <Navigate to="/dashboard" replace />;
  }

  const toggleArea = (id: FocusArea) => {
    setFocusAreas((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  };

  const canProceed = () => {
    if (step === 1) return name.trim().length >= 1;
    if (step === 3) return focusAreas.length >= 1;
    return true;
  };

  const handleNext = () => {
    if (step < TOTAL_STEPS) {
      setStep((s) => s + 1);
    } else {
      completeOnboarding({ displayName: name.trim(), focusAreas, preset });
      navigate('/dashboard', { replace: true });
    }
  };

  const handleBack = () => {
    if (step > 1) setStep((s) => s - 1);
  };

  const handleSkip = () => {
    skipOnboarding();
    navigate('/dashboard', { replace: true });
  };

  const nextLabel = () => {
    if (step === TOTAL_STEPS) return isRTL ? 'ابدأ الآن' : 'Get Started';
    return isRTL ? 'التالي' : 'Next';
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-secondary/20 relative overflow-hidden"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-gradient-to-br from-primary/8 to-primary/[0.02] rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-gradient-to-tl from-primary/5 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s', animationDelay: '1s' }} />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,180,0,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,180,0,0.01)_1px,transparent_1px)] bg-[size:60px_60px]" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Card */}
        <div className="glass-card p-8 backdrop-blur-xl border border-border/50">
          <ProgressBar step={step} />

          {/* Step content */}
          {step === 1 && <StepWelcome name={name} onNameChange={setName} isRTL={isRTL} />}
          {step === 2 && <StepAppearance isRTL={isRTL} />}
          {step === 3 && <StepFocusAreas selected={focusAreas} onToggle={toggleArea} isRTL={isRTL} />}
          {step === 4 && <StepPreset selected={preset} onSelect={setPreset} isRTL={isRTL} />}
          {step === 5 && <StepDone name={name} isRTL={isRTL} />}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 gap-3">
            {step > 1 ? (
              <Button
                variant="ghost"
                onClick={handleBack}
                className="gap-2"
              >
                {isRTL ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
                {isRTL ? 'السابق' : 'Back'}
              </Button>
            ) : (
              <Button variant="ghost" onClick={handleSkip} className="text-muted-foreground">
                {isRTL ? 'تخطي' : 'Skip'}
              </Button>
            )}

            <Button
              variant="gold"
              onClick={handleNext}
              disabled={!canProceed()}
              className="gap-2 px-6"
            >
              {nextLabel()}
              {step < TOTAL_STEPS && (
                isRTL ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />
              )}
              {step === TOTAL_STEPS && <Sparkles className="w-4 h-4" />}
            </Button>
          </div>

          {/* Step counter */}
          <p className="text-center text-xs text-muted-foreground mt-4">
            {isRTL ? `${step} من ${TOTAL_STEPS}` : `${step} of ${TOTAL_STEPS}`}
          </p>
        </div>
      </div>
    </div>
  );
}
