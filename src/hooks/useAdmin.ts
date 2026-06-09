import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import type {
  AdminUser, AdminStats, AdminUsersResult,
  SubscriptionPlan, UserFilter,
} from '@/types/admin';

export function useAdmin() {
  const [loading, setLoading]   = useState(false);
  const [error,   setError]     = useState<string | null>(null);

  // ── Stats ──────────────────────────────────────────────────────────────────

  const getStats = useCallback(async (): Promise<AdminStats | null> => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: rpcError } = await supabase.rpc('get_admin_stats');
      if (rpcError) throw rpcError;
      return data as AdminStats;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'خطأ في جلب الإحصائيات');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Users (via RPC to include auth.users.email) ───────────────────────────

  const getUsers = useCallback(async (
    search   = '',
    filter:  UserFilter = 'all',
    page     = 0,
    pageSize = 20,
  ): Promise<AdminUsersResult> => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: rpcError } = await supabase.rpc('get_admin_users', {
        p_search: search,
        p_filter: filter,
        p_offset: page * pageSize,
        p_limit:  pageSize,
      });
      if (rpcError) throw rpcError;
      const result = data as AdminUsersResult;
      return { users: result.users ?? [], total: result.total ?? 0 };
    } catch (e) {
      setError(e instanceof Error ? e.message : 'خطأ في جلب المستخدمين');
      return { users: [], total: 0 };
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Ban / Unban ────────────────────────────────────────────────────────────

  const banUser = useCallback(async (
    userId: string,   // auth.users.id (= profiles.user_id)
    reason: string,
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const { error: upErr } = await supabase
        .from('profiles')
        .update({
          is_banned:     true,
          banned_at:     new Date().toISOString(),
          banned_reason: reason,
        })
        .eq('user_id', userId);
      if (upErr) throw upErr;

      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('admin_audit_log').insert({
        admin_user_id:  user?.id,
        action:         'ban_user',
        target_user_id: userId,
        details:        { reason },
      });
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'خطأ في حظر المستخدم');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const unbanUser = useCallback(async (userId: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const { error: upErr } = await supabase
        .from('profiles')
        .update({ is_banned: false, banned_at: null, banned_reason: null })
        .eq('user_id', userId);
      if (upErr) throw upErr;

      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('admin_audit_log').insert({
        admin_user_id:  user?.id,
        action:         'unban_user',
        target_user_id: userId,
        details:        {},
      });
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'خطأ في رفع الحظر');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Subscription ───────────────────────────────────────────────────────────

  const updateSubscription = useCallback(async (
    userId: string,
    plan:   SubscriptionPlan,
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const { error: upsertErr } = await supabase
        .from('user_subscriptions')
        .upsert(
          { user_id: userId, plan, status: 'active' },
          { onConflict: 'user_id' },
        );
      if (upsertErr) throw upsertErr;

      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('admin_audit_log').insert({
        admin_user_id:  user?.id,
        action:         'update_subscription',
        target_user_id: userId,
        details:        { plan },
      });
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'خطأ في تحديث الاشتراك');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, getStats, getUsers, banUser, unbanUser, updateSubscription };
}

// ── Lightweight admin-check hook ──────────────────────────────────────────────

export function useIsAdmin(): boolean | null {
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { setIsAdmin(false); return; }

    let cancelled = false;
    supabase
      .rpc('check_is_admin')
      .then(({ data, error }) => {
        if (!cancelled) setIsAdmin(error ? false : data === true);
      });
    return () => { cancelled = true; };
  }, [user, authLoading]);

  return isAdmin;
}
