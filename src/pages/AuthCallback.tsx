/**
 * AuthCallback — PKCE OAuth code exchange.
 *
 * Flow:
 *  1. Extract ?code= from URL
 *  2. Call exchangeCodeForSession (PKCE code → session)
 *  3. Wait for AuthProvider to update user state
 *  4. Navigate to /dashboard (or /onboarding for new users)
 */
import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export default function AuthCallback() {
  const navigate   = useNavigate();
  const { user, loading } = useAuth();
  const exchanged  = useRef(false);
  const redirected = useRef(false);

  // Step 1 — exchange code once
  useEffect(() => {
    if (exchanged.current) return;
    exchanged.current = true;

    const code = new URLSearchParams(window.location.search).get('code');

    if (!code) {
      navigate('/auth', { replace: true });
      return;
    }

    supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
      if (error) {
        console.error('[AuthCallback] exchange error:', error.message);
        navigate('/auth', { replace: true });
      }
      // On success, onAuthStateChange in AuthProvider fires → user state updates
      // Step 2 (below) watches for user to be set then navigates
    });
  }, [navigate]);

  // Step 2 — navigate once auth state is ready
  useEffect(() => {
    if (redirected.current) return;
    if (loading) return;          // still initialising
    if (!exchanged.current) return; // exchange hasn't fired yet

    redirected.current = true;
    if (user) {
      navigate('/dashboard', { replace: true });
    } else {
      // exchange may still be in-flight; wait one more tick via onAuthStateChange
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (event, session) => {
          if (redirected.current) return;
          if (session) {
            redirected.current = true;
            subscription.unsubscribe();
            navigate('/dashboard', { replace: true });
          } else if (event === 'SIGNED_OUT') {
            redirected.current = true;
            subscription.unsubscribe();
            navigate('/auth', { replace: true });
          }
        }
      );
    }
  }, [loading, user, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        <p className="text-muted-foreground text-sm">جارٍ تسجيل الدخول…</p>
      </div>
    </div>
  );
}
