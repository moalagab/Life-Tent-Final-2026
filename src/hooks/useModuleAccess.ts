/**
 * useModuleAccess — Progressive module disclosure.
 *
 * New users start with 1 module (chosen during onboarding).
 * Additional slots open based on days since account creation:
 *
 *   Day  0 – 6  →  1 slot
 *   Day  7 – 13 →  2 slots
 *   Day 14+     →  3 slots
 *
 * Utility tools (dashboard, calendar, studio, pomodoro) are always
 * visible and are not counted against the slot quota.
 */
import { useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import type { FocusArea } from './useOnboarding';

// ── Constants ─────────────────────────────────────────────────────────────────

/** These routes are always accessible — no module slot required. */
export const ALWAYS_ON = new Set([
  'dashboard', 'calendar', 'studio', 'pomodoro',
]);

/** Full module pool — granted to existing users who pre-date progressive disclosure. */
const ALL_MODULES = ['tasks', 'projects', 'finance', 'habits', 'goals', 'knowledge'] as const;

const SLOT_SCHEDULE = [
  { minDays: 14, slots: 3 },
  { minDays:  7, slots: 2 },
  { minDays:  0, slots: 1 },
] as const;

// ── Helpers ───────────────────────────────────────────────────────────────────

function daysSince(isoDate: string): number {
  return Math.floor((Date.now() - new Date(isoDate).getTime()) / 86_400_000);
}

function slotsForDays(days: number): number {
  return SLOT_SCHEDULE.find(r => days >= r.minDays)?.slots ?? 1;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useModuleAccess() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['module-access', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('active_modules, created_at, onboarding_completed')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;

      // Defensive backfill: existing users who completed onboarding before
      // progressive disclosure was introduced have active_modules = [].
      // Silently grant all modules so they don't lose access.
      if (
        data &&
        data.onboarding_completed === true &&
        (!data.active_modules || data.active_modules.length === 0)
      ) {
        const allModules = [...ALL_MODULES];
        await supabase
          .from('profiles')
          .update({ active_modules: allModules })
          .eq('user_id', user.id);
        return { ...data, active_modules: allModules };
      }

      return data;
    },
    enabled:   !!user,
    staleTime: 1000 * 60 * 5,
  });

  const { activeModules, maxSlots, daysUntilNextUnlock } = useMemo(() => {
    if (!data) {
      return {
        activeModules:      [] as string[],
        maxSlots:           1,
        daysUntilNextUnlock: null as number | null,
      };
    }

    const modules: string[] = data.active_modules ?? [];
    const days  = daysSince(data.created_at);
    const slots = slotsForDays(days);

    // Days until the next slot threshold (null when already at max)
    let untilNext: number | null = null;
    if (slots < 3) {
      const next = slots === 1 ? 7 : 14;
      untilNext = Math.max(0, next - days);
    }

    return { activeModules: modules, maxSlots: slots, daysUntilNextUnlock: untilNext };
  }, [data]);

  /** True when the user has earned a new slot but hasn't used it yet. */
  const canUnlockMore = activeModules.length > 0 && activeModules.length < maxSlots;

  /** Returns true for utility tools and any module the user has unlocked. */
  const isModuleActive = useCallback(
    (module: string) => ALWAYS_ON.has(module) || activeModules.includes(module),
    [activeModules],
  );

  const { mutateAsync: unlockModule } = useMutation({
    mutationFn: async (module: FocusArea) => {
      if (!user) throw new Error('Not authenticated');
      const updated = [...new Set([...activeModules, module])];
      const { error } = await supabase
        .from('profiles')
        .update({ active_modules: updated })
        .eq('user_id', user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['module-access'] });
    },
  });

  return {
    activeModules,
    maxSlots,
    canUnlockMore,
    daysUntilNextUnlock,
    isModuleActive,
    unlockModule,
    loading: isLoading,
  };
}
