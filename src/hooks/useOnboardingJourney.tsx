/**
 * useOnboardingJourney
 *
 * Tracks the user's post-registration journey day by day.
 * Returns the next pending milestone so MilestonePrompt can display it.
 *
 * Milestone schedule:
 *   Day  1 → daily_ritual   — first morning ritual prompt
 *   Day  3 → progress_recap — micro-celebration with real stats
 *   Day  5 → ai_paywall     — soft paywall: 3 free AI uses → upgrade
 *   Day  7 → weekly_report  — week 1 progress visual + streak badge
 *   Day 14 → referral       — invite a friend
 *   Day 30 → monthly_review — monthly review PDF
 */
import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

// ── Types ─────────────────────────────────────────────────────────────────────

export type Milestone =
  | 'day1_ritual'
  | 'day3_recap'
  | 'day5_ai'
  | 'day7_report'
  | 'day14_referral'
  | 'day30_review';

const MILESTONE_DAYS: Record<Milestone, number> = {
  day1_ritual:    1,
  day3_recap:     3,
  day5_ai:        5,
  day7_report:    7,
  day14_referral: 14,
  day30_review:   30,
};

// Ordered from most advanced → earliest so we show the newest unseen milestone
const MILESTONE_ORDER: Milestone[] = [
  'day30_review',
  'day14_referral',
  'day7_report',
  'day5_ai',
  'day3_recap',
  'day1_ritual',
];

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useOnboardingJourney() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['onboarding-journey', user?.id],
    queryFn: async () => {
      if (!user) return null;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any)
        .from('profiles')
        .select('created_at, onboarding_completed_at, journey_milestones, ai_uses_remaining, challenge')
        .eq('user_id', user.id)
        .maybeSingle();
      return data as {
        created_at:              string;
        onboarding_completed_at: string | null;
        journey_milestones:      Record<string, boolean>;
        ai_uses_remaining:       number;
        challenge:               string | null;
      } | null;
    },
    enabled:   !!user,
    staleTime: 1000 * 60 * 5,
  });

  // Days since account creation (or onboarding completion if available)
  const daysSince = useMemo(() => {
    const ref = profile?.onboarding_completed_at ?? profile?.created_at;
    if (!ref) return 0;
    return Math.floor((Date.now() - new Date(ref).getTime()) / 86_400_000);
  }, [profile]);

  const milestones: Record<string, boolean> = useMemo(
    () => profile?.journey_milestones ?? {},
    [profile?.journey_milestones],
  );

  // Find the highest-day unseen milestone the user has reached
  const pendingMilestone = useMemo((): Milestone | null => {
    for (const m of MILESTONE_ORDER) {
      if (daysSince >= MILESTONE_DAYS[m] && !milestones[m]) return m;
    }
    return null;
  }, [daysSince, milestones]);

  // Mark a milestone as seen in DB
  const { mutateAsync: markSeen } = useMutation({
    mutationFn: async (milestone: Milestone) => {
      if (!user) return;
      const updated = { ...milestones, [milestone]: true };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from('profiles')
        .update({ journey_milestones: updated })
        .eq('user_id', user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding-journey', user?.id] });
    },
  });

  // Decrement AI free uses (soft paywall). Returns false when exhausted.
  const { mutateAsync: decrementAiUses } = useMutation({
    mutationFn: async () => {
      if (!user || !profile) return false;
      const remaining = Math.max(0, (profile.ai_uses_remaining ?? 3) - 1);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from('profiles')
        .update({ ai_uses_remaining: remaining })
        .eq('user_id', user.id);
      return remaining;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding-journey', user?.id] });
    },
  });

  return {
    isLoading,
    daysSince,
    pendingMilestone,
    markSeen,
    aiUsesRemaining: profile?.ai_uses_remaining ?? 3,
    decrementAiUses,
    challenge: profile?.challenge ?? null,
  };
}
