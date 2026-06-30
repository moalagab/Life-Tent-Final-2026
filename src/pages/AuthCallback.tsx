/**
 * AuthCallback — OAuth redirect landing page.
 *
 * Supabase redirects here after Google/OAuth login.
 * The hash (#access_token=...) or code param is processed,
 * session is established, then user is forwarded to dashboard.
 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function handleCallback() {
      // Give Supabase JS time to detect + process the URL hash/code
      const { data: { session }, error } = await supabase.auth.getSession();

      if (cancelled) return;

      if (error) {
        console.error('[AuthCallback] session error:', error.message);
        setError(error.message);
        setTimeout(() => navigate('/auth', { replace: true }), 3000);
        return;
      }

      if (session) {
        navigate('/dashboard', { replace: true });
      } else {
        // Wait one tick — let onAuthStateChange fire first
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          (event, s) => {
            if (cancelled) return;
            if (s) {
              subscription.unsubscribe();
              navigate('/dashboard', { replace: true });
            } else if (event === 'INITIAL_SESSION') {
              subscription.unsubscribe();
              navigate('/auth', { replace: true });
            }
          }
        );
      }
    }

    handleCallback();
    return () => { cancelled = true; };
  }, [navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center p-6">
        <p className="text-destructive text-sm">{error}</p>
        <p className="text-muted-foreground text-xs">سيتم توجيهك لصفحة تسجيل الدخول…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        <p className="text-muted-foreground text-sm">جارٍ تسجيل الدخول…</p>
      </div>
    </div>
  );
}
