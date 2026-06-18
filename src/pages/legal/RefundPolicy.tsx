import { Link } from 'react-router-dom';
import { Tent, ArrowRight } from 'lucide-react';

export default function RefundPolicy() {
  return (
    <div className="min-h-screen bg-background text-foreground" dir="rtl">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
              <Tent className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-foreground">Life Tent</span>
          </Link>
          <Link
            to="/"
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowRight className="w-4 h-4" />
            العودة للرئيسية
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-6 py-12">
        <div className="mb-10">
          <p className="text-sm text-muted-foreground mb-2">آخر تحديث: يونيو 2026</p>
          <h1 className="text-3xl font-bold text-foreground mb-3">سياسة الاسترداد</h1>
          <p className="text-muted-foreground leading-relaxed">
            نسعى في Life Tent OS لضمان رضاك التام. إذا لم تكن راضيًا عن اشتراكك فنحن نوفر سياسة استرداد واضحة وعادلة.
          </p>
        </div>

        {/* Summary card */}
        <div className="bg-primary/8 border border-primary/20 rounded-2xl p-5 mb-10">
          <h2 className="font-semibold text-foreground mb-3">ملخص سريع</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="text-center p-3 bg-background/60 rounded-xl">
              <p className="text-2xl font-bold text-primary mb-1">14</p>
              <p className="text-sm text-muted-foreground">يومًا ضمان استرداد كامل</p>
            </div>
            <div className="text-center p-3 bg-background/60 rounded-xl">
              <p className="text-2xl font-bold text-primary mb-1">5</p>
              <p className="text-sm text-muted-foreground">أيام عمل لمعالجة الطلب</p>
            </div>
            <div className="text-center p-3 bg-background/60 rounded-xl">
              <p className="text-2xl font-bold text-primary mb-1">100%</p>
              <p className="text-sm text-muted-foreground">استرداد بدون أسئلة</p>
            </div>
          </div>
        </div>

        <div className="space-y-10 text-[15px] leading-relaxed">

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3 pb-2 border-b border-border/50">١. ضمان الاسترداد خلال ١٤ يومًا</h2>
            <p className="text-muted-foreground mb-3">
              نقدم ضمان استرداد كامل خلال <strong className="text-foreground/80">١٤ يومًا</strong> من تاريخ أي اشتراك مدفوع لأول مرة. إذا لم تكن راضيًا لأي سبب خلال هذه الفترة، سنرد لك المبلغ كاملًا بدون أسئلة.
            </p>
            <p className="text-muted-foreground">
              هذا الضمان ينطبق على:
            </p>
            <ul className="space-y-2 text-muted-foreground mt-2">
              <li className="flex gap-2"><span className="text-primary mt-0.5">•</span><span>الاشتراك الشهري الأول.</span></li>
              <li className="flex gap-2"><span className="text-primary mt-0.5">•</span><span>الاشتراك السنوي الأول.</span></li>
              <li className="flex gap-2"><span className="text-primary mt-0.5">•</span><span>الترقية من خطة لأخرى للمرة الأولى.</span></li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3 pb-2 border-b border-border/50">٢. شروط الاسترداد بعد ١٤ يومًا</h2>
            <p className="text-muted-foreground mb-3">
              بعد انتهاء فترة الـ ١٤ يومًا، يُنظر في طلبات الاسترداد بشكل استثنائي في الحالات التالية:
            </p>
            <ul className="space-y-2.5 text-muted-foreground">
              <li className="flex gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span><strong className="text-foreground/80">خلل تقني جسيم:</strong> إذا كانت المنصة غير قابلة للاستخدام لأكثر من ٧٢ ساعة متواصلة بسبب مشكلة من جانبنا.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span><strong className="text-foreground/80">خطأ في الفوترة:</strong> في حال تم خصم مبلغ بشكل خاطئ أو مزدوج.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span><strong className="text-foreground/80">الاشتراكات السنوية:</strong> في حال إلغاء الاشتراك السنوي قبل مرور ٦ أشهر يُسترد الجزء غير المُستهلك (نسبة أشهر المتبقية).</span>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3 pb-2 border-b border-border/50">٣. حالات لا يُطبَّق فيها الاسترداد</h2>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex gap-2"><span className="text-destructive mt-0.5">✕</span><span>تجديدات الاشتراك الشهري بعد انتهاء فترة الـ ١٤ يومًا.</span></li>
              <li className="flex gap-2"><span className="text-destructive mt-0.5">✕</span><span>الاشتراكات المُفعَّلة عبر رموز ترويجية مجانية.</span></li>
              <li className="flex gap-2"><span className="text-destructive mt-0.5">✕</span><span>الحسابات المُعلَّقة بسبب انتهاك شروط الاستخدام.</span></li>
              <li className="flex gap-2"><span className="text-destructive mt-0.5">✕</span><span>طلبات الاسترداد الثانية لنفس نوع الاشتراك (الضمان ١٤ يومًا مرة واحدة فقط).</span></li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3 pb-2 border-b border-border/50">٤. إلغاء الاشتراك</h2>
            <p className="text-muted-foreground mb-3">
              يمكنك إلغاء اشتراكك في أي وقت من <strong className="text-foreground/80">إعدادات الحساب ← الاشتراك ← إلغاء الاشتراك</strong>.
            </p>
            <ul className="space-y-2.5 text-muted-foreground">
              <li className="flex gap-2"><span className="text-primary mt-0.5">•</span><span>بعد الإلغاء ستظل قادرًا على الوصول للمنصة حتى نهاية دورة الفوترة الحالية.</span></li>
              <li className="flex gap-2"><span className="text-primary mt-0.5">•</span><span>لن يُخصم أي مبلغ جديد بعد تاريخ الإلغاء.</span></li>
              <li className="flex gap-2"><span className="text-primary mt-0.5">•</span><span>الإلغاء لا يعني الاسترداد التلقائي — الاسترداد يتطلب طلبًا منفصلًا.</span></li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3 pb-2 border-b border-border/50">٥. كيفية طلب الاسترداد</h2>
            <div className="space-y-4 text-muted-foreground">
              <p>لطلب الاسترداد أرسل بريدًا إلكترونيًا إلى{' '}
                <a href="mailto:info@lifetent.online" className="text-primary hover:underline">
                  info@lifetent.online
                </a>{' '}
                مع المعلومات التالية:
              </p>
              <ul className="space-y-2">
                <li className="flex gap-2"><span className="text-primary mt-0.5">•</span><span>البريد الإلكتروني المرتبط بحسابك.</span></li>
                <li className="flex gap-2"><span className="text-primary mt-0.5">•</span><span>تاريخ الدفع والمبلغ.</span></li>
                <li className="flex gap-2"><span className="text-primary mt-0.5">•</span><span>سبب طلب الاسترداد (اختياري لطلبات الـ ١٤ يومًا).</span></li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3 pb-2 border-b border-border/50">٦. معالجة الاسترداد</h2>
            <ul className="space-y-2.5 text-muted-foreground">
              <li className="flex gap-2"><span className="text-primary mt-0.5">•</span><span>نُراجع طلبك ونُجيب عليه خلال <strong className="text-foreground/80">٢-٣ أيام عمل</strong>.</span></li>
              <li className="flex gap-2"><span className="text-primary mt-0.5">•</span><span>يُعاد المبلغ إلى نفس وسيلة الدفع الأصلية.</span></li>
              <li className="flex gap-2"><span className="text-primary mt-0.5">•</span><span>قد يستغرق ظهور المبلغ في حسابك <strong className="text-foreground/80">٥-١٠ أيام عمل</strong> بحسب البنك أو جهة الدفع.</span></li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3 pb-2 border-b border-border/50">٧. التواصل</h2>
            <p className="text-muted-foreground">
              لأي استفسار بشأن هذه السياسة:{' '}
              <a href="mailto:info@lifetent.online" className="text-primary hover:underline">
                info@lifetent.online
              </a>
            </p>
          </section>

        </div>

        {/* Footer links */}
        <div className="mt-16 pt-8 border-t border-border/50 flex flex-wrap gap-4 text-sm text-muted-foreground">
          <Link to="/terms" className="hover:text-foreground transition-colors">شروط الاستخدام</Link>
          <Link to="/privacy" className="hover:text-foreground transition-colors">سياسة الخصوصية</Link>
          <Link to="/" className="hover:text-foreground transition-colors">العودة للرئيسية</Link>
        </div>
      </main>
    </div>
  );
}
