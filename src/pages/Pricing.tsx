import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { SEO } from '@/components/SEO';
import { cn } from '@/lib/utils';
import {
  Tent, Check, X, Zap, Building2, Sparkles,
  ArrowRight, Shield, Users, Bot, Infinity as InfinityIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

// ── Toggle ────────────────────────────────────────────────────────────────────

function BillingToggle({
  annual,
  onChange,
}: {
  annual: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-3 justify-center">
      <button
        onClick={() => onChange(false)}
        className={cn(
          'text-sm font-medium transition-colors',
          !annual ? 'text-foreground' : 'text-muted-foreground',
        )}
      >
        شهري
      </button>

      <button
        onClick={() => onChange(!annual)}
        className={cn(
          'relative w-12 h-6 rounded-full transition-colors',
          annual ? 'bg-primary' : 'bg-muted',
        )}
        role="switch"
        aria-checked={annual}
      >
        <span
          className={cn(
            'absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all duration-200',
            annual ? 'right-0.5' : 'left-0.5',
          )}
        />
      </button>

      <button
        onClick={() => onChange(true)}
        className={cn(
          'flex items-center gap-1.5 text-sm font-medium transition-colors',
          annual ? 'text-foreground' : 'text-muted-foreground',
        )}
      >
        سنوي
        <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-full bg-success/15 text-success">
          وفّر 30%
        </span>
      </button>
    </div>
  );
}

// ── Feature row ───────────────────────────────────────────────────────────────

function Feat({
  label,
  free,
  pro,
  biz,
}: {
  label: string;
  free: string | boolean;
  pro: string | boolean;
  biz: string | boolean;
}) {
  const cell = (val: string | boolean) => {
    if (val === true)  return <Check className="w-4 h-4 text-success mx-auto" strokeWidth={2.5} />;
    if (val === false) return <X    className="w-4 h-4 text-muted-foreground/40 mx-auto" strokeWidth={2} />;
    return <span className="text-xs text-foreground/80 font-medium">{val}</span>;
  };

  return (
    <tr className="border-b border-border/30 last:border-0 hover:bg-muted/20 transition-colors">
      <td className="py-3 pr-4 text-sm text-muted-foreground">{label}</td>
      <td className="py-3 text-center">{cell(free)}</td>
      <td className="py-3 text-center bg-primary/[0.03]">{cell(pro)}</td>
      <td className="py-3 text-center">{cell(biz)}</td>
    </tr>
  );
}

// ── Plans data ────────────────────────────────────────────────────────────────

const FEATURES = [
  // Core
  { label: 'المهام والمشاريع',          free: '3 مشاريع',   pro: 'غير محدود', biz: 'غير محدود' },
  { label: 'العادات والروتين',           free: true,         pro: true,        biz: true        },
  { label: 'الأهداف (OKR)',             free: 'أساسي',      pro: true,        biz: true        },
  { label: 'الجدول والتقويم',           free: true,         pro: true,        biz: true        },
  { label: 'المالية الشخصية',           free: false,        pro: true,        biz: true        },
  { label: 'المعرفة والملاحظات',        free: false,        pro: true,        biz: true        },
  { label: 'الاستوديو (كتب وأفلام)',    free: false,        pro: true,        biz: true        },
  { label: 'بومودورو والتركيز',         free: false,        pro: true,        biz: true        },
  { label: 'خريطة الروابط (Graph)',     free: false,        pro: true,        biz: true        },
  // AI
  { label: 'AI مساعد',                 free: '10 طلبات/شهر', pro: 'غير محدود', biz: 'غير محدود' },
  { label: 'AI Studio كامل',           free: false,        pro: true,        biz: true        },
  { label: 'تحليل السلوك AI',          free: false,        pro: true,        biz: true        },
  // Team & Admin
  { label: 'تعاون الفريق',             free: false,        pro: false,       biz: true        },
  { label: 'لوحة Admin للمؤسسة',       free: false,        pro: false,       biz: true        },
  { label: 'API وصول',                 free: false,        pro: false,       biz: true        },
  { label: 'تقارير الفريق',            free: false,        pro: false,       biz: true        },
  // Support
  { label: 'الدعم الفني',              free: 'مجتمع',      pro: 'أولوية',    biz: 'مخصص'      },
  { label: 'SLA',                       free: false,        pro: false,       biz: true        },
];

// ── Main component ────────────────────────────────────────────────────────────

export default function Pricing() {
  const navigate  = useNavigate();
  const [annual, setAnnual] = useState(false);

  const proPrice   = annual ? '4.92' : '6.99';
  const proLabel   = annual ? '$59/سنة' : '$6.99/شهر';
  const proSub     = annual ? 'يُدفع $59 سنويًا' : 'يُدفع شهريًا';

  const pricingSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Life Tent",
    "url": "https://www.lifetent.online",
    "offers": [
      { "@type": "Offer", "name": "Free",     "price": "0",    "priceCurrency": "USD" },
      { "@type": "Offer", "name": "Pro",      "price": "6.99", "priceCurrency": "USD", "billingPeriod": "P1M" },
      { "@type": "Offer", "name": "Business", "price": "12",   "priceCurrency": "USD", "billingPeriod": "P1M" }
    ]
  };

  return (
    <>
      <SEO
        title="التسعير — خطط Life Tent"
        description="اختر الخطة المناسبة لك — Free مجاني للأبد، Pro بـ $6.99/شهر، Business بـ $12/مستخدم. جرّب مجاناً لمدة 14 يوماً."
        canonical="/pricing"
        schema={pricingSchema}
      />
    <div className="min-h-screen bg-background text-foreground" dir="rtl">

      {/* ── Nav ── */}
      <header className="border-b border-border/50 bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
              <Tent className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-foreground">Life Tent</span>
          </Link>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/auth')}>
              تسجيل الدخول
            </Button>
            <Button size="sm" onClick={() => navigate('/auth?mode=signup')}>
              ابدأ مجانًا
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-16">

        {/* ── Hero ── */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold mb-5">
            <Sparkles className="w-3.5 h-3.5" />
            خطط بسيطة، قيمة حقيقية
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-foreground mb-4 leading-tight">
            اختر خطتك
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-8">
            ابدأ مجانًا وطوّر تجربتك متى تريد. لا بطاقة ائتمانية مطلوبة للخطة المجانية.
          </p>
          <BillingToggle annual={annual} onChange={setAnnual} />
        </div>

        {/* ── Cards ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">

          {/* Free */}
          <div className="rounded-2xl border border-border/60 bg-card p-7 flex flex-col">
            <div className="mb-6">
              <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center mb-4">
                <Zap className="w-5 h-5 text-muted-foreground" />
              </div>
              <h2 className="text-xl font-bold text-foreground mb-1">مجاني</h2>
              <p className="text-sm text-muted-foreground">للبدء وتجربة النظام</p>
            </div>

            <div className="mb-6">
              <div className="flex items-end gap-1">
                <span className="text-4xl font-black text-foreground">$0</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">للأبد، بدون بطاقة</p>
            </div>

            <ul className="space-y-3 mb-8 flex-1">
              {[
                'المهام والعادات والأهداف الأساسية',
                '3 مشاريع نشطة',
                'الجدول اليومي والتقويم',
                'AI مساعد — 10 طلبات/شهر',
                'تخزين 500 ملاحظة',
              ].map(f => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                  <Check className="w-4 h-4 text-success shrink-0 mt-0.5" strokeWidth={2.5} />
                  {f}
                </li>
              ))}
            </ul>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate('/auth?mode=signup')}
            >
              ابدأ مجانًا
              <ArrowRight className="w-4 h-4 me-1.5" />
            </Button>
          </div>

          {/* Pro — highlighted */}
          <div className="rounded-2xl border-2 border-primary bg-card p-7 flex flex-col relative shadow-lg shadow-primary/10">
            <div className="absolute -top-3.5 right-1/2 translate-x-1/2 px-4 py-1 rounded-full bg-primary text-primary-foreground text-xs font-bold">
              الأكثر شيوعًا
            </div>

            <div className="mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center mb-4">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <h2 className="text-xl font-bold text-foreground mb-1">Pro</h2>
              <p className="text-sm text-muted-foreground">للجادين في إدارة حياتهم</p>
            </div>

            <div className="mb-6">
              <div className="flex items-end gap-1">
                <span className="text-4xl font-black text-foreground">${proPrice}</span>
                <span className="text-muted-foreground text-sm mb-1">/شهر</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{proSub}</p>
              {annual && (
                <p className="text-xs text-success font-medium mt-1">توفّر $24.88 سنويًا</p>
              )}
            </div>

            <ul className="space-y-3 mb-8 flex-1">
              {[
                'كل وحدات النظام بلا حدود',
                'مشاريع وأهداف غير محدودة',
                'المالية والمعرفة والاستوديو',
                'AI Studio كامل — بلا حدود',
                'تحليل السلوك والتقارير',
                'بومودورو وخريطة الروابط',
                'دعم فني بأولوية',
              ].map(f => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-foreground/80">
                  <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" strokeWidth={2.5} />
                  {f}
                </li>
              ))}
            </ul>

            <Button
              className="w-full"
              onClick={() => navigate('/auth?mode=signup')}
            >
              ابدأ تجربة Pro
              <ArrowRight className="w-4 h-4 me-1.5" />
            </Button>
            <p className="text-center text-xs text-muted-foreground mt-3">
              14 يومًا ضمان استرداد كامل
            </p>
          </div>

          {/* Business */}
          <div className="rounded-2xl border border-border/60 bg-card p-7 flex flex-col">
            <div className="mb-6">
              <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center mb-4">
                <Building2 className="w-5 h-5 text-muted-foreground" />
              </div>
              <h2 className="text-xl font-bold text-foreground mb-1">Business</h2>
              <p className="text-sm text-muted-foreground">للفرق والمؤسسات</p>
            </div>

            <div className="mb-6">
              <div className="flex items-end gap-1">
                <span className="text-4xl font-black text-foreground">$12</span>
                <span className="text-muted-foreground text-sm mb-1">/مستخدم/شهر</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">يُدفع شهريًا أو سنويًا</p>
            </div>

            <ul className="space-y-3 mb-8 flex-1">
              {[
                'كل مميزات Pro',
                'تعاون الفريق في المشاريع',
                'لوحة Admin للمؤسسة',
                'API وصول كامل',
                'تقارير أداء الفريق',
                'SLA وضمان جاهزية',
                'دعم مخصص ومدير حساب',
              ].map(f => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                  <Check className="w-4 h-4 text-success shrink-0 mt-0.5" strokeWidth={2.5} />
                  {f}
                </li>
              ))}
            </ul>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => window.location.href = 'mailto:info@lifetent.online'}
            >
              تواصل للحصول على عرض
              <ArrowRight className="w-4 h-4 me-1.5" />
            </Button>
          </div>
        </div>

        {/* ── Comparison table ── */}
        <div className="mb-20">
          <h2 className="text-2xl font-bold text-foreground text-center mb-8">مقارنة تفصيلية</h2>
          <div className="rounded-2xl border border-border/60 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50 bg-muted/30">
                  <th className="py-4 pr-4 text-right text-sm font-semibold text-muted-foreground w-[40%]">الميزة</th>
                  <th className="py-4 text-center text-sm font-semibold text-muted-foreground w-[20%]">مجاني</th>
                  <th className="py-4 text-center text-sm font-bold text-primary w-[20%] bg-primary/[0.03]">Pro</th>
                  <th className="py-4 text-center text-sm font-semibold text-muted-foreground w-[20%]">Business</th>
                </tr>
              </thead>
              <tbody className="bg-card">
                {FEATURES.map(f => (
                  <Feat key={f.label} {...f} />
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Trust badges ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
          {[
            {
              icon: Shield,
              title: 'بياناتك ملكك وحدك',
              desc: 'مشفّرة بالكامل. لا نطّلع عليها ولا نشاركها مع أي طرف ثالث.',
            },
            {
              icon: InfinityIcon,
              title: 'لا قيود مخفية',
              desc: 'ما تراه في الخطة هو ما تحصل عليه. لا رسوم إضافية مفاجئة.',
            },
            {
              icon: Bot,
              title: 'AI حقيقي لا ديكور',
              desc: 'مساعد ذكاء اصطناعي مدمج في كل وحدة لمساعدتك فعليًا.',
            },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex gap-4 p-5 rounded-2xl bg-card border border-border/50">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-foreground text-sm mb-1">{title}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── FAQ ── */}
        <div className="max-w-2xl mx-auto mb-20">
          <h2 className="text-2xl font-bold text-foreground text-center mb-8">أسئلة شائعة</h2>
          <div className="space-y-4">
            {[
              {
                q: 'هل يمكنني الترقية أو التخفيض في أي وقت؟',
                a: 'نعم. يمكنك تغيير خطتك في أي وقت من إعدادات الحساب. عند الترقية يُطبَّق الفرق فورًا، وعند التخفيض يُطبَّق في دورة الفوترة القادمة.',
              },
              {
                q: 'ماذا يحدث لبياناتي إذا ألغيت الاشتراك؟',
                a: 'بياناتك تبقى موجودة وتستطيع الوصول إليها على الخطة المجانية. إذا أردت حذف حسابك نهائيًا نحذف كل البيانات خلال 30 يومًا.',
              },
              {
                q: 'هل تدعمون الدفع بالريال السعودي؟',
                a: 'نعم، ندعم بطاقات Visa وMastercard ومدى، وتظهر الأسعار مُحوَّلة للريال السعودي عند الدفع.',
              },
              {
                q: 'ما الفرق بين AI المحدود والكامل؟',
                a: 'الخطة المجانية تتيح 10 طلبات شهريًا للمساعد الأساسي. خطة Pro تفتح AI Studio الكامل مع تحليل السلوك والاقتراحات الذكية وبلا حدود على الطلبات.',
              },
              {
                q: 'هل هناك خصم للطلاب أو المنظمات غير الربحية؟',
                a: 'نعم، نقدم خصمًا يصل إلى 50% للطلاب والمنظمات غير الربحية. تواصل معنا عبر info@lifetent.online للحصول على التفاصيل.',
              },
            ].map(({ q, a }) => (
              <div key={q} className="rounded-xl border border-border/50 bg-card p-5">
                <p className="font-semibold text-foreground text-sm mb-2">{q}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── CTA ── */}
        <div className="rounded-2xl bg-primary/8 border border-primary/20 p-10 text-center">
          <h2 className="text-2xl font-bold text-foreground mb-3">مستعد تبدأ؟</h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            انضم لآلاف المستخدمين الذين يديرون حياتهم بشكل أفضل مع Life Tent.
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Button size="lg" onClick={() => navigate('/auth?mode=signup')}>
              ابدأ مجانًا الآن
              <ArrowRight className="w-4 h-4 me-1.5" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => window.location.href = 'mailto:info@lifetent.online'}>
              تحدث مع فريق المبيعات
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            لا بطاقة ائتمانية مطلوبة · إلغاء في أي وقت · 14 يومًا ضمان استرداد
          </p>
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-border/50 py-8 mt-12">
        <div className="max-w-6xl mx-auto px-6 flex flex-wrap items-center justify-between gap-4 text-xs text-muted-foreground">
          <span>© 2026 Life Tent OS. جميع الحقوق محفوظة.</span>
          <div className="flex gap-4">
            <Link to="/terms"   className="hover:text-foreground transition-colors">شروط الاستخدام</Link>
            <Link to="/privacy" className="hover:text-foreground transition-colors">الخصوصية</Link>
            <Link to="/refund"  className="hover:text-foreground transition-colors">الاسترداد</Link>
          </div>
        </div>
      </footer>
    </div>
    </>
  );
}
