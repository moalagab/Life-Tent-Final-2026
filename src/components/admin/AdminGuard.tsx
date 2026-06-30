import { Tent, ShieldOff } from 'lucide-react';
import { useIsAdmin } from '@/hooks/useAdmin';

interface AdminGuardProps {
  children: React.ReactNode;
}

export function AdminGuard({ children }: AdminGuardProps) {
  const isAdmin = useIsAdmin();

  if (isAdmin === null) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4 animate-pulse">
            <Tent className="w-8 h-8 text-primary" />
          </div>
          <p className="text-muted-foreground text-sm">جاري التحقق من الصلاحيات...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div
        className="flex flex-col items-center justify-center min-h-screen gap-4 text-center p-8 bg-background"
        dir="rtl"
      >
        <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center">
          <ShieldOff className="w-10 h-10 text-destructive" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">غير مسموح</h1>
        <p className="text-muted-foreground max-w-sm">
          هذه الصفحة مخصصة للمشرفين فقط. تواصل مع المسؤول لرفع صلاحياتك.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
