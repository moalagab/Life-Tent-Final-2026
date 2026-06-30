import { useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRecordReferral } from '@/hooks/useReferral';

const LS_KEY = 'lt_pending_ref';

export function ReferralBootstrap() {
  const { user } = useAuth();
  const recordReferral = useRecordReferral();
  const attempted = useRef(false);

  useEffect(() => {
    if (!user || attempted.current) return;

    const pendingCode = localStorage.getItem(LS_KEY);
    if (!pendingCode) return;

    attempted.current = true;
    localStorage.removeItem(LS_KEY);

    recordReferral.mutate(pendingCode);
  }, [user, recordReferral]);

  return null;
}
