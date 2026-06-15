import { useState, useEffect, useCallback, useRef } from 'react';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { MainLayout } from '@/components/layout/MainLayout';
import { useAdmin } from '@/hooks/useAdmin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Users, ShieldCheck, TrendingUp, Crown, Briefcase,
  Ban, RefreshCw, Search, ChevronLeft, ChevronRight,
  BarChart3, UserCheck, CalendarDays, AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AdminUser, AdminStats, UserFilter, SubscriptionPlan } from '@/types/admin';

const PAGE_SIZE = 20;

// ── Plan badge ────────────────────────────────────────────────────────────────

const PLAN_STYLES: Record<string, string> = {
  free:     'bg-muted text-muted-foreground',
  pro:      'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  business: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
};
const PLAN_LABELS: Record<string, string> = { free: 'مجاني', pro: 'برو', business: 'أعمال' };

function PlanBadge({ plan }: { plan: string }) {
  return (
    <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', PLAN_STYLES[plan] ?? PLAN_STYLES.free)}>
      {PLAN_LABELS[plan] ?? plan}
    </span>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({
  icon: Icon, label, value, iconClass,
}: {
  icon: React.ElementType;
  label: string;
  value: number | string | undefined;
  iconClass: string;
}) {
  return (
    <Card>
      <CardContent className="p-5 flex items-center gap-4">
        <Icon className={cn('w-7 h-7 shrink-0', iconClass)} />
        <div>
          <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
          {value === undefined ? (
            <Skeleton className="h-7 w-16" />
          ) : (
            <p className="text-2xl font-bold">
              {typeof value === 'number' ? value.toLocaleString('ar-SA') : value}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ── User row ──────────────────────────────────────────────────────────────────

function UserRow({
  user,
  onBan,
  onUnban,
  onChangePlan,
}: {
  user: AdminUser;
  onBan: (u: AdminUser) => void;
  onUnban: (u: AdminUser) => void;
  onChangePlan: (userId: string, plan: SubscriptionPlan) => void;
}) {
  return (
    <tr className="border-b border-border/40 hover:bg-muted/30 transition-colors">
      {/* User */}
      <td className="p-3">
        <div className="flex items-center gap-3">
          {user.avatar_url ? (
            <img src={user.avatar_url} className="w-8 h-8 rounded-full object-cover" alt="" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center text-sm font-bold text-primary">
              {(user.full_name ?? user.email ?? '?')[0].toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{user.full_name ?? '—'}</p>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          </div>
        </div>
      </td>
      {/* Plan */}
      <td className="p-3">
        <PlanBadge plan={user.plan} />
      </td>
      {/* Joined */}
      <td className="p-3 text-sm text-muted-foreground whitespace-nowrap">
        {new Date(user.created_at).toLocaleDateString('ar-SA')}
      </td>
      {/* Status */}
      <td className="p-3">
        {user.is_banned ? (
          <span className="text-xs bg-destructive/10 text-destructive px-2 py-0.5 rounded-full">محظور</span>
        ) : (
          <span className="text-xs bg-success/10 text-success px-2 py-0.5 rounded-full">نشط</span>
        )}
      </td>
      {/* Actions */}
      <td className="p-3">
        <div className="flex items-center gap-2">
          <Select
            value={user.plan}
            onValueChange={(v) => onChangePlan(user.user_id, v as SubscriptionPlan)}
          >
            <SelectTrigger className="h-7 w-28 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="free">مجاني</SelectItem>
              <SelectItem value="pro">برو</SelectItem>
              <SelectItem value="business">أعمال</SelectItem>
            </SelectContent>
          </Select>
          {user.is_banned ? (
            <Button size="sm" variant="outline"
              className="h-7 text-xs text-success border-success/40 hover:bg-success/10"
              onClick={() => onUnban(user)}
            >
              رفع الحظر
            </Button>
          ) : (
            <Button size="sm" variant="outline"
              className="h-7 text-xs text-destructive border-destructive/40 hover:bg-destructive/10"
              onClick={() => onBan(user)}
            >
              <Ban className="w-3 h-3 me-1" /> حظر
            </Button>
          )}
        </div>
      </td>
    </tr>
  );
}

// ── Main admin content ────────────────────────────────────────────────────────

function AdminContent() {
  const { loading, error, getStats, getUsers, banUser, unbanUser, updateSubscription } = useAdmin();

  const [stats,     setStats]     = useState<AdminStats | null>(null);
  const [users,     setUsers]     = useState<AdminUser[]>([]);
  const [total,     setTotal]     = useState(0);
  const [search,    setSearch]    = useState('');
  const [filter,    setFilter]    = useState<UserFilter>('all');
  const [page,      setPage]      = useState(0);
  const [activeTab, setActiveTab] = useState<'overview' | 'users'>('overview');

  // Ban confirm dialog
  const [banTarget,  setBanTarget]  = useState<AdminUser | null>(null);
  const [banReason,  setBanReason]  = useState('');

  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadStats = useCallback(async () => {
    const data = await getStats();
    if (data) setStats(data);
  }, [getStats]);

  const loadUsers = useCallback(async () => {
    const { users: u, total: t } = await getUsers(search, filter, page, PAGE_SIZE);
    setUsers(u);
    setTotal(t);
  }, [getUsers, search, filter, page]);

  useEffect(() => { loadStats(); }, [loadStats]);

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => { loadUsers(); }, 300);
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
  }, [loadUsers]);

  const handleBanConfirm = async () => {
    if (!banTarget || !banReason.trim()) return;
    if (await banUser(banTarget.user_id, banReason.trim())) {
      setBanTarget(null);
      setBanReason('');
      loadUsers();
    }
  };

  const handleUnban = async (user: AdminUser) => {
    if (await unbanUser(user.user_id)) loadUsers();
  };

  const handleChangePlan = async (userId: string, plan: SubscriptionPlan) => {
    if (await updateSubscription(userId, plan)) loadUsers();
  };

  const tabs = [
    { id: 'overview' as const, label: 'نظرة عامة',  icon: BarChart3 },
    { id: 'users'    as const, label: 'المستخدمون', icon: Users },
  ];

  const totalPages = Math.ceil(total / PAGE_SIZE) || 1;

  return (
    <div dir="rtl">
      {/* Header */}
      <div className="border-b bg-card px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" />
            لوحة تحكم الادمن
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">Life Tent OS — إدارة المستخدمين والاشتراكات</p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => { loadStats(); loadUsers(); }} disabled={loading}>
          <RefreshCw className={cn('w-4 h-4 me-2', loading && 'animate-spin')} />
          تحديث
        </Button>
      </div>

      {/* Tabs */}
      <div className="border-b bg-card px-6 flex gap-1">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors',
              activeTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {/* ── Overview Tab ───────────────────────────────────────────────────── */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard icon={Users}       label="إجمالي المستخدمين"  value={stats?.total_users}          iconClass="text-blue-600 dark:text-blue-400" />
            <StatCard icon={UserCheck}   label="نشطون اليوم"         value={stats?.active_today}         iconClass="text-green-600 dark:text-green-400" />
            <StatCard icon={Crown}       label="مشتركو برو"          value={stats?.pro_subscribers}      iconClass="text-primary" />
            <StatCard icon={Briefcase}   label="مشتركو أعمال"        value={stats?.business_subscribers} iconClass="text-violet-600 dark:text-violet-400" />
            <StatCard icon={CalendarDays}label="جدد هذا الشهر"       value={stats?.new_this_month}       iconClass="text-cyan-600 dark:text-cyan-400" />
            <StatCard icon={TrendingUp}  label="نشطون هذا الأسبوع"  value={stats?.active_this_week}     iconClass="text-orange-600 dark:text-orange-400" />
            <StatCard icon={Ban}         label="محظورون"              value={stats?.banned_users}         iconClass="text-destructive" />
            <StatCard icon={BarChart3}   label="إجمالي الاشتراكات"   value={stats?.total_subscriptions}  iconClass="text-indigo-600 dark:text-indigo-400" />
          </div>
        )}

        {/* ── Users Tab ──────────────────────────────────────────────────────── */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-wrap gap-3">
              <div className="relative flex-1 min-w-48">
                <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <Input
                  placeholder="ابحث بالاسم أو البريد..."
                  value={search}
                  onChange={e => { setSearch(e.target.value); setPage(0); }}
                  className="ps-9"
                />
              </div>
              <Select value={filter} onValueChange={v => { setFilter(v as UserFilter); setPage(0); }}>
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الكل</SelectItem>
                  <SelectItem value="free">مجاني</SelectItem>
                  <SelectItem value="pro">برو</SelectItem>
                  <SelectItem value="business">أعمال</SelectItem>
                  <SelectItem value="banned">محظورون</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Table */}
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/30 text-sm">
                      <th className="p-3 text-start font-medium text-muted-foreground">المستخدم</th>
                      <th className="p-3 text-start font-medium text-muted-foreground">الخطة</th>
                      <th className="p-3 text-start font-medium text-muted-foreground">التسجيل</th>
                      <th className="p-3 text-start font-medium text-muted-foreground">الحالة</th>
                      <th className="p-3 text-start font-medium text-muted-foreground">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading && users.length === 0 ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <tr key={i} className="border-b border-border/40">
                          <td className="p-3"><Skeleton className="h-8 w-48" /></td>
                          <td className="p-3"><Skeleton className="h-5 w-16" /></td>
                          <td className="p-3"><Skeleton className="h-5 w-20" /></td>
                          <td className="p-3"><Skeleton className="h-5 w-12" /></td>
                          <td className="p-3"><Skeleton className="h-7 w-32" /></td>
                        </tr>
                      ))
                    ) : users.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-12 text-center text-muted-foreground">
                          لا يوجد مستخدمون
                        </td>
                      </tr>
                    ) : (
                      users.map(user => (
                        <UserRow
                          key={user.id}
                          user={user}
                          onBan={setBanTarget}
                          onUnban={handleUnban}
                          onChangePlan={handleChangePlan}
                        />
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Pagination */}
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                إجمالي: <strong className="text-foreground">{total.toLocaleString('ar-SA')}</strong> مستخدم
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline" size="sm"
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <span className="px-3">
                  {page + 1} / {totalPages}
                </span>
                <Button
                  variant="outline" size="sm"
                  onClick={() => setPage(p => p + 1)}
                  disabled={(page + 1) >= totalPages}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Ban Confirm Dialog */}
      <AlertDialog open={!!banTarget} onOpenChange={open => { if (!open) { setBanTarget(null); setBanReason(''); } }}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <Ban className="w-5 h-5" /> تأكيد حظر المستخدم
            </AlertDialogTitle>
            <AlertDialogDescription>
              سيتم حظر <strong>{banTarget?.full_name ?? banTarget?.email}</strong>. أدخل سبب الحظر:
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            placeholder="سبب الحظر..."
            value={banReason}
            onChange={e => setBanReason(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleBanConfirm()}
          />
          <AlertDialogFooter className="flex-row-reverse gap-2">
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBanConfirm}
              disabled={!banReason.trim() || loading}
              className="bg-destructive hover:bg-destructive/90"
            >
              {loading ? 'جارٍ الحظر...' : 'تأكيد الحظر'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ── Export (wrapped in AdminGuard) ────────────────────────────────────────────

export default function AdminDashboard() {
  return (
    <MainLayout>
      <AdminGuard>
        <AdminContent />
      </AdminGuard>
    </MainLayout>
  );
}
