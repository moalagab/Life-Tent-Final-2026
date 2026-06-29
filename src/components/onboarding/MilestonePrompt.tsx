/**
 * MilestonePrompt
 *
 * Floating bottom-sheet shown once per milestone day.
 * Mounted globally in App.tsx — only renders when there's a pending milestone.
 *
 * Day 1  → Daily Ritual          (صباح الوضوح)
 * Day 3  → Progress Recap        (micro-celebration)
 * Day 5  → AI Soft Paywall       (3 free → upgrade)
 * Day 7  → Weekly Report         (streak badge)
 * Day 14 → Referral Prompt       (invite a friend)
 * Day 30 → Monthly Review        (share your wins)
 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Sparkles, Trophy, Flame, Users, BarChart2, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useOnboardingJourney, type Milestone } from '@/hooks/useOnboardingJourney';
import { useLanguage } from '@/hooks/useLanguage';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

// ── Milestone config ──────────────────────────────────────────────────────────

interface MilestoneConfig {
  icon:       React.ReactNode;
  color:      string;          // Tailwind bg utility for the icon ring
  titleAr:    string;
  titleEn:    string;
  bodyAr:     string;
  bodyEn:     string;
  ctaAr:      string;
  ctaEn:      string;
  ctaRoute?:  string;          // navigate to this route on CTA click
}

const CONFIGS: Record<Milestone, MilestoneConfig> = {
  day1_ritual: {
    icon:    <Sun className="w-6 h-6" />,
    color:   'bg-amber-500/15 text-amber-500',
    titleAr: 'صباح الوضوح ☀️',
    titleEn: 'Morning Clarity ☀️',
    bodyAr:  'يومك الأول في Life Tent. أكمل طقسك الصباحي — اطّلع على مهامك وحدد أولويتك الأولى.',
    bodyEn:  "Your first day in Life Tent. Complete your morning ritual — review tasks and set your #1 priority.",
    ctaAr:   'ابدأ طقسي الصباحي',
    ctaEn:   'Start Morning Ritual',
    ctaRoute: '/tasks',
  },
  day3_recap: {
    icon:    <Trophy className="w-6 h-6" />,
    color:   'bg-yellow-500/15 text-yellow-500',
    titleAr: 'رأيت تقدمك! 🎉',
    titleEn: 'Look at your progress! 🎉',
    bodyAr:  '3 أيام مضت — أنت تبني عادة. كل خطوة صغيرة تُراكم.',
    bodyEn:  "3 days in — you're building a habit. Every small step compounds.",
    ctaAr:   'اطّلع على تقدمي',
    ctaEn:   'View my progress',
    ctaRoute: '/dashboard',
  },
  day5_ai: {
    icon:    <Sparkles className="w-6 h-6" />,
    color:   'bg-primary/15 text-primary',
    titleAr: 'جرِّب AI Studio ✨',
    titleEn: 'Try AI Studio ✨',
    bodyAr:  'اسأل المساعد الذكي عن أهدافك، مهامك، أو أي شيء في ذهنك. لديك 3 استخدامات مجانية.',
    bodyEn:  'Ask the AI assistant about your goals, tasks, or anything on your mind. You have 3 free uses.',
    ctaAr:   'جرّب الذكاء الاصطناعي',
    ctaEn:   'Try AI now',
    ctaRoute: '/studio',
  },
  day7_report: {
    icon:    <Flame className="w-6 h-6" />,
    color:   'bg-orange-500/15 text-orange-500',
    titleAr: 'أسبوع كامل! 🏆',
    titleEn: 'Full week in! 🏆',
    bodyAr:  'أسبوع مضى — أنت من أكثر 20% الأكثر استمراراً. إليك تقرير أسبوعك.',
    bodyEn:  "A week in — you're in the top 20% most consistent users. Here's your weekly report.",
    ctaAr:   'اطّلع على تقرير الأسبوع',
    ctaEn:   'View weekly report',
    ctaRoute: '/dashboard',
  },
  day14_referral: {
    icon:    <Users className="w-6 h-6" />,
    color:   'bg-emerald-500/15 text-emerald-500',
    titleAr: 'ادعُ صديقاً معك 👥',
    titleEn: 'Bring a friend along 👥',
    bodyAr:  'أسبوعان من النمو! شارك Life Tent مع شخص يستحق — واربح شهراً Pro مجاناً.',
    bodyEn:  "Two weeks of growth! Share Life Tent with someone who deserves it — earn 1 month Pro free.",
    ctaAr:   'ادعُ صديقاً الآن',
    ctaEn:   'Invite a friend',
    ctaRoute: '/settings',
  },
  day30_review: {
    icon:    <BarChart2 className="w-6 h-6" />,
    color:   'bg-violet-500/15 text-violet-500',
    titleAr: 'شهر مضى! 🎊',
    titleEn: 'One month in! 🎊',
    bodyAr:  '30 يوماً من الإنجاز. راجع مسيرتك الكاملة — واحتفل بما أنجزت.',
    bodyEn:  "30 days of achievement. Review your full journey — celebrate what you've built.",
    ctaAr:   'مراجعة شهري',
    ctaEn:   'Monthly review',
    ctaRoute: '/dashboard',
  },
};

// ── Stats fetcher for Day 3 ───────────────────────────────────────────────────

function useDay3Stats(enabled: boolean) {
  const { user } = useAuth();
  const [stats, setStats] = useState({ tasks: 0, habits: 0 });

  useEffect(() => {
    if (!enabled || !user) return;
    let cancelled = false;
    Promise.all([
      supabase.from('tasks').select('id', { count: 'exact', head: true })
        .eq('user_id', user.id).eq('status', 'done'),
      supabase.from('habits').select('id', { count: 'exact', head: true })
        .eq('user_id', user.id),
    ]).then(([tasksRes, habitsRes]) => {
      if (cancelled) return;
      setStats({ tasks: tasksRes.count ?? 0, habits: habitsRes.count ?? 0 });
    });
    return () => { cancelled = true; };
  }, [enabled, user]);

  return stats;
}

// ── Email trigger ─────────────────────────────────────────────────────────────

async function triggerMilestoneEmail(milestone: Milestone, user: { id: string; email?: string }, data?: Record<string, unknown>) {
  try {
    await supabase.functions.invoke('onboarding-journey-email', {
      body: { milestone, user_id: user.id, email: user.email, data },
    });
  } catch { /* non-critical */ }
}

// ── Main component ────────────────────────────────────────────────────────────

export function MilestonePrompt() {
  const { pendingMilestone, markSeen, aiUsesRemaining } = useOnboardingJourney();
  const { currentLanguage } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isRTL = currentLanguage === 'ar';

  const [visible, setVisible] = useState(false);
  const [shown,   setShown]   = useState<Milestone | null>(null);

  const day3Stats = useDay3Stats(pendingMilestone === 'day3_recap');

  // Show with a short delay after mount so it doesn't flash on navigation
  useEffect(() => {
    if (!pendingMilestone || shown === pendingMilestone) return;
    const t = setTimeout(() => {
      setVisible(true);
      setShown(pendingMilestone);
      // Trigger email for email-based milestones
      if (['day3_recap', 'day7_report', 'day14_referral', 'day30_review'].includes(pendingMilestone) && user) {
        triggerMilestoneEmail(pendingMilestone, { id: user.id, email: user.email ?? undefined },
          pendingMilestone === 'day3_recap' ? day3Stats : undefined);
      }
    }, 1200);
    return () => clearTimeout(t);
  }, [pendingMilestone, shown, user, day3Stats]);

  if (!visible || !pendingMilestone) return null;

  const cfg = CONFIGS[pendingMilestone];

  const handleDismiss = async () => {
    setVisible(false);
    await markSeen(pendingMilestone);
  };

  const handleCta = async () => {
    setVisible(false);
    await markSeen(pendingMilestone);
    if (cfg.ctaRoute) navigate(cfg.ctaRoute);
  };

  // Enrich body for day3 with real stats
  const body = (() => {
    if (pendingMilestone === 'day3_recap') {
      return isRTL
        ? `أنجزت ${day3Stats.tasks} مهمة وبدأت ${day3Stats.habits} عادة — أنت تبني زخماً حقيقياً! 🎉`
        : `You've completed ${day3Stats.tasks} tasks and started ${day3Stats.habits} habits — real momentum! 🎉`;
    }
    if (pendingMilestone === 'day5_ai') {
      return isRTL
        ? `${cfg.bodyAr} (تبقّى لك ${aiUsesRemaining} استخدامات)`
        : `${cfg.bodyEn} (${aiUsesRemaining} uses left)`;
    }
    return isRTL ? cfg.bodyAr : cfg.bodyEn;
  })();

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-background/60 backdrop-blur-sm z-40 animate-fade-in"
        onClick={handleDismiss}
      />

      {/* Sheet */}
      <div
        dir={isRTL ? 'rtl' : 'ltr'}
        className={cn(
          'fixed bottom-0 inset-x-0 z-50 p-4 pb-safe',
          'sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2 sm:left-1/2 sm:-translate-x-1/2',
          'sm:w-full sm:max-w-sm sm:p-0',
          'animate-slide-up sm:animate-fade-in',
        )}
      >
        <div className="glass-card p-6 rounded-3xl shadow-2xl border border-border/60 relative">
          {/* Close */}
          <button
            onClick={handleDismiss}
            className="absolute top-4 end-4 w-7 h-7 rounded-full bg-muted/60 flex items-center justify-center hover:bg-muted transition-colors"
          >
            <X className="w-3.5 h-3.5 text-muted-foreground" />
          </button>

          {/* Icon */}
          <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center mb-4', cfg.color)}>
            {cfg.icon}
          </div>

          {/* Content */}
          <h3 className="text-lg font-bold text-foreground mb-2">
            {isRTL ? cfg.titleAr : cfg.titleEn}
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed mb-5">
            {body}
          </p>

          {/* Actions */}
          <div className="flex gap-2.5">
            <Button onClick={handleCta} variant="gold" className="flex-1 gap-1.5" size="sm">
              {isRTL ? cfg.ctaAr : cfg.ctaEn}
            </Button>
            <Button onClick={handleDismiss} variant="outline" size="sm" className="shrink-0">
              {isRTL ? 'لاحقاً' : 'Later'}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
