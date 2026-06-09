import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';

const STORAGE_KEY = 'onboarding_completed';

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

function getStorageKey(userId?: string) {
  return userId ? `${STORAGE_KEY}_${userId}` : STORAGE_KEY;
}

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [isCompleted, setIsCompleted] = useState(false);
  const [loading, setLoading] = useState(true);

  // Re-check localStorage after auth resolves — prevents false redirect to /onboarding
  useEffect(() => {
    if (authLoading) return;
    const key = getStorageKey(user?.id);
    setIsCompleted(localStorage.getItem(key) === 'true');
    setLoading(false);
  }, [user?.id, authLoading]);

  const completeOnboarding = useCallback((data: OnboardingData) => {
    const key = getStorageKey(user?.id);
    localStorage.setItem(key, 'true');
    if (data.focusAreas.length > 0) {
      localStorage.setItem('onboarding_focus_areas', JSON.stringify(data.focusAreas));
    }
    if (data.preset) {
      localStorage.setItem('dashboard_preset', data.preset);
    }
    setIsCompleted(true);
  }, [user?.id]);

  const skipOnboarding = useCallback(() => {
    const key = getStorageKey(user?.id);
    localStorage.setItem(key, 'true');
    setIsCompleted(true);
  }, [user?.id]);

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
