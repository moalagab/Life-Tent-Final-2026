import { useState } from 'react';
import { Copy, Check, Share2, Gift, Users, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useReferralStats } from '@/hooks/useReferral';
import { Skeleton } from '@/components/ui/skeleton';

export function ReferralCard() {
  const { data: stats, isLoading } = useReferralStats();
  const [copied, setCopied] = useState(false);

  const baseUrl = window.location.origin;
  const referralLink = stats?.referral_code
    ? `${baseUrl}/auth?mode=signup&ref=${stats.referral_code}`
    : null;

  const handleCopy = async () => {
    if (!referralLink) return;
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      toast.success('تم نسخ الرابط');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('تعذّر النسخ');
    }
  };

  const handleShare = async () => {
    if (!referralLink) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'انضم إلى Life Tent',
          text: 'جرّب Life Tent — أفضل نظام لإدارة حياتك. سجّل عبر رابطي واحصل على 30 يوم Pro مجاناً!',
          url: referralLink,
        });
      } catch { /* user cancelled */ }
    } else {
      const wa = `https://wa.me/?text=${encodeURIComponent(
        `جرّب Life Tent — أفضل نظام لإدارة حياتك 🎯\nسجّل عبر رابطي واحصل على 30 يوم Pro مجاناً!\n${referralLink}`
      )}`;
      window.open(wa, '_blank', 'noopener,noreferrer');
    }
  };

  if (isLoading) {
    return (
      <div className="glass-card p-6 mt-6">
        <Skeleton className="h-5 w-40 mb-4" />
        <Skeleton className="h-10 w-full mb-3" />
        <Skeleton className="h-8 w-32" />
      </div>
    );
  }

  return (
    <div className="glass-card p-6 mt-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 flex items-center justify-center shrink-0">
          <Gift className="w-5 h-5 text-amber-500" strokeWidth={1.8} />
        </div>
        <div>
          <h3 className="font-semibold text-foreground leading-tight">ادعُ أصدقاءك</h3>
          <p className="text-xs text-muted-foreground">كلاكما يحصل على 30 يوم Pro مجاناً</p>
        </div>
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-4 mb-5 p-3 rounded-xl bg-muted/30">
        <div className="flex items-center gap-2 flex-1">
          <Users className="w-4 h-4 text-primary shrink-0" />
          <div>
            <p className="text-xl font-bold text-foreground leading-none">
              {stats?.referral_count ?? 0}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">صديق انضم</p>
          </div>
        </div>
        <div className="w-px h-8 bg-border" />
        <div className="flex items-center gap-2 flex-1">
          <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
          <div>
            <p className="text-xl font-bold text-foreground leading-none">
              {stats?.reward_days ?? 0}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">يوم مكافأة</p>
          </div>
        </div>
      </div>

      {/* Referral link */}
      <div className="space-y-2 mb-4">
        <p className="text-xs font-medium text-muted-foreground">رابطك الخاص</p>
        <div className="flex items-center gap-2">
          <div className="flex-1 px-3 py-2 rounded-xl bg-muted/50 border border-border text-xs text-foreground/70 truncate font-mono" dir="ltr">
            {referralLink ?? '…'}
          </div>
          <Button
            size="sm"
            variant="outline"
            className="h-9 w-9 p-0 shrink-0"
            onClick={handleCopy}
            disabled={!referralLink}
            aria-label="نسخ الرابط"
          >
            {copied
              ? <Check className="w-4 h-4 text-green-500" />
              : <Copy className="w-4 h-4" />
            }
          </Button>
        </div>
      </div>

      {/* كود قصير */}
      {stats?.referral_code && (
        <div className="flex items-center gap-2 mb-5 p-3 rounded-xl bg-primary/5 border border-primary/15">
          <span className="text-xs text-muted-foreground">كود الدعوة:</span>
          <span className="font-bold text-primary tracking-widest text-sm font-mono">
            {stats.referral_code}
          </span>
        </div>
      )}

      {/* Share buttons */}
      <Button
        onClick={handleShare}
        className="w-full gap-2"
        disabled={!referralLink}
      >
        <Share2 className="w-4 h-4" />
        مشاركة الرابط
      </Button>

      <p className="text-[11px] text-muted-foreground text-center mt-3 leading-relaxed">
        يُفعَّل الـ 30 يوم بعد تسجيل صديقك وتفعيل حسابه
      </p>
    </div>
  );
}
