import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

export type FocusArea = 'tasks' | 'projects' | 'finance' | 'habits' | 'goals' | 'knowledge';
export type DashboardPreset = 'focus' | 'finance' | 'execution';

export interface OnboardingData {
  displayName: string;
  focusAreas: FocusArea[];
  preset: DashboardPreset;
}

interface OnboardingContextType {
  isCompleted: boolean;
  loading: boolean;
  completeOnboarding: (data: OnboardingData) => void;
  skipOnboarding: () => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [isCompleted, setIsCompleted] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check Supabase DB (persists across devices/browsers)
  useEffect(() => {
    if (authLoading) return;
    if (!user) { setIsCompleted(false); setLoading(false); return; }

    let cancelled = false;
    supabase
      .from('profiles')
      .select('onboarding_completed')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return;
        // null row or query error → treat as completed (don't block existing users)
        // false → new user who hasn't done onboarding yet
        if (error || data === null) {
          setIsCompleted(true);
        } else {
          setIsCompleted(data.onboarding_completed !== false);
        }
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [user?.id, authLoading]);

  const markComplete = useCallback(async () => {
    if (!user) return;
    await supabase
      .from('profiles')
      .update({ onboarding_completed: true })
      .eq('user_id', user.id);
    setIsCompleted(true);
  }, [user]);

  const completeOnboarding = useCallback((data: OnboardingData) => {
    if (data.focusAreas.length > 0)
      localStorage.setItem('onboarding_focus_areas', JSON.stringify(data.focusAreas));
    if (data.preset)
      localStorage.setItem('dashboard_preset', data.preset);
    markComplete();
  }, [markComplete]);

  const skipOnboarding = useCallback(() => {
    markComplete();
  }, [markComplete]);

  return (
    <OnboardingContext.Provider value={{ isCompleted, loading, completeOnboarding, skipOnboarding }}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) throw new Error('useOnboarding must be used within OnboardingProvider');
  return context;
}
