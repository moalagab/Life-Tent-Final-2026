import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

type State = 'exchanging' | 'waiting' | 'error';

export default function AuthCallback() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const started = useRef(false);
  const [state, setState] = useState<State>('exchanging');
  const [errorMsg, setErrorMsg] = useState('');

  // Step 1: exchange the one-time PKCE code → session
  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const params = new URLSearchParams(window.location.search);
    const providerError = params.get('error_description') || params.get('error');
    const code = params.get('code');

    if (providerError) {
      setErrorMsg(providerError);
      setState('error');
      return;
    }
    if (!code) {
      navigate('/auth', { replace: true });
      return;
    }

    supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
      if (error) {
        console.error('[AuthCallback] exchange failed:', error.message);
        setErrorMsg(error.message);
        setState('error');
        return;
      }
      // Exchange succeeded — now wait for AuthProvider to update user state
      setState('waiting');
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Step 2: navigate only after AuthProvider confirms user is set
  useEffect(() => {
    if (state !== 'waiting') return;
    if (!user) return;
    navigate('/dashboard', { replace: true });
  }, [state, user, navigate]);

  // Step 3: fallback — if exchange succeeded but user never arrived (edge case),
  // subscribe directly to the auth event as a safety net
  useEffect(() => {
    if (state !== 'waiting') return;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        subscription.unsubscribe();
        navigate('/dashboard', { replace: true });
      } else if (event === 'SIGNED_OUT') {
        subscription.unsubscribe();
        setErrorMsg('لم يتم إنشاء جلسة دخول.');
        setState('error');
      }
    });

    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  if (state === 'error') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a', color: '#f1f5f9' }}>
        <div style={{ textAlign: 'center', maxWidth: 400, padding: '0 16px' }}>
          <p style={{ color: '#f87171', marginBottom: 16, fontSize: 14 }}>{errorMsg || 'فشل تسجيل الدخول'}</p>
          <a href="/auth" style={{ color: '#818cf8', textDecoration: 'underline', fontSize: 14 }}>العودة لتسجيل الدخول</a>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          border: '2px solid #818cf8', borderTopColor: 'transparent',
          animation: 'spin 0.8s linear infinite',
        }} />
        <p style={{ color: '#94a3b8', fontSize: 14 }}>
          {state === 'exchanging' ? 'جارٍ التحقق من بيانات الدخول…' : 'جارٍ تسجيل الدخول…'}
        </p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}
