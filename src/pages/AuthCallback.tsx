import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

export default function AuthCallback() {
  const navigate = useNavigate();
  const completed = useRef(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const completeLogin = () => {
      if (completed.current || !active) return;
      completed.current = true;
      window.history.replaceState({}, document.title, '/auth/callback');
      navigate('/dashboard', { replace: true });
    };

    const failLogin = (message: string) => {
      if (!active || completed.current) return;
      setErrorMessage(message);
    };

    // detectSessionInUrl:true means Supabase auto-exchanges ?code= — no manual call needed
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) completeLogin();
    });

    // Also check if session already exists (e.g. fast exchange)
    supabase.auth.getSession().then(({ data, error }) => {
      if (error) { failLogin(error.message); return; }
      if (data.session) completeLogin();
    });

    const timeout = window.setTimeout(() => {
      failLogin('تعذر إكمال تسجيل الدخول. أعد المحاولة من صفحة تسجيل الدخول.');
    }, 10_000);

    return () => {
      active = false;
      window.clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, [navigate]);

  if (errorMessage) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a', color: '#f1f5f9' }}>
        <div style={{ textAlign: 'center', maxWidth: 400, padding: '0 16px' }}>
          <p style={{ color: '#f87171', marginBottom: 16, fontSize: 14 }}>{errorMessage}</p>
          <a href="/auth" style={{ color: '#818cf8', textDecoration: 'underline', fontSize: 14 }}>العودة لتسجيل الدخول</a>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid #818cf8', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
        <p style={{ color: '#94a3b8', fontSize: 14 }}>جارٍ إكمال تسجيل الدخول…</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}
