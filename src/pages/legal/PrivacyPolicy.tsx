import { Link } from 'react-router-dom';
import { Tent, ArrowRight } from 'lucide-react';
import { SEO } from '@/components/SEO';

export default function PrivacyPolicy() {
  return (
    <>
      <SEO
        title="سياسة الخصوصية"
        description="سياسة خصوصية Life Tent — كيف نحمي بياناتك ونحترم خصوصيتك. بياناتك ملكك وحدك."
        canonical="/privacy"
        noIndex={false}
      />
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
          <h1 className="text-3xl font-bold text-foreground mb-3">سياسة الخصوصية</h1>
          <p className="text-muted-foreground leading-relaxed">
            نلتزم في Life Tent OS بحماية خصوصيتك. توضّح هذه السياسة ما نجمعه من بيانات وكيف نستخدمها ونحميها.
          </p>
        </div>

        <div className="space-y-10 text-[15px] leading-relaxed">

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3 pb-2 border-b border-border/50">١. البيانات التي نجمعها</h2>
            <div className="space-y-4 text-muted-foreground">
              <div>
                <p className="font-medium text-foreground/80 mb-1.5">بيانات الحساب</p>
                <p>الاسم، عنوان البريد الإلكتروني، كلمة المرور (مُشفَّرة)، تاريخ التسجيل.</p>
              </div>
              <div>
                <p className="font-medium text-foreground/80 mb-1.5">بيانات الاستخدام</p>
                <p>المهام والأهداف والعادات والملاحظات والبيانات المالية التي تُدخلها في المنصة هي <strong className="text-foreground/80">معلومات خاصة بك وحدك</strong>. لا نجمعها ولا نطّلع عليها ولا نستخدمها لأي غرض — تُخزَّن مشفّرة وتبقى ملكًا حصريًا لك.</p>
              </div>
              <div>
                <p className="font-medium text-foreground/80 mb-1.5">بيانات تقنية</p>
                <p>نوع المتصفح ونظام التشغيل وعنوان IP وصفحات المزارة وأوقات الجلسات — لأغراض تحسين الأداء والأمان.</p>
              </div>
              <div>
                <p className="font-medium text-foreground/80 mb-1.5">بيانات الدفع</p>
                <p>نعالج المدفوعات عبر مزودين خارجيين مرخصين ولا نخزّن بيانات بطاقتك الائتمانية على خوادمنا.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3 pb-2 border-b border-border/50">٢. كيف نستخدم بياناتك</h2>
            <ul className="space-y-2.5 text-muted-foreground">
              <li className="flex gap-2"><span className="text-primary mt-0.5">•</span><span>تقديم الخدمة وتحسينها وتخصيصها لك.</span></li>
              <li className="flex gap-2"><span className="text-primary mt-0.5">•</span><span>إرسال إشعارات تتعلق بحسابك أو تحديثات الخدمة.</span></li>
              <li className="flex gap-2"><span className="text-primary mt-0.5">•</span><span>تحليل أنماط الاستخدام المجمّعة لتطوير المنصة (لا تُعرَّف بياناتك الفردية).</span></li>
              <li className="flex gap-2"><span className="text-primary mt-0.5">•</span><span>الاستجابة لطلبات الدعم الفني.</span></li>
              <li className="flex gap-2"><span className="text-primary mt-0.5">•</span><span>الامتثال للالتزامات القانونية.</span></li>
            </ul>
            <p className="text-muted-foreground mt-3">
              <strong className="text-foreground/80">لن</strong> نبيع بياناتك الشخصية لأي طرف ثالث.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3 pb-2 border-b border-border/50">٣. تخزين البيانات وأمانها</h2>
            <p className="text-muted-foreground mb-3">
              نستخدم <strong className="text-foreground/80">Supabase</strong> لتخزين البيانات، وهو مزود بنية تحتية بمعايير أمان عالية يشمل:
            </p>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex gap-2"><span className="text-primary mt-0.5">•</span><span>تشفير البيانات أثناء النقل (TLS) وأثناء التخزين (AES-256).</span></li>
              <li className="flex gap-2"><span className="text-primary mt-0.5">•</span><span>سياسات Row-Level Security تضمن عزل بيانات كل مستخدم.</span></li>
              <li className="flex gap-2"><span className="text-primary mt-0.5">•</span><span>نسخ احتياطية منتظمة.</span></li>
            </ul>
            <p className="text-muted-foreground mt-3">
              تُخزَّن البيانات في مراكز بيانات تلتزم بمعايير ISO 27001 وSOC 2.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3 pb-2 border-b border-border/50">٤. مشاركة البيانات مع أطراف ثالثة</h2>
            <p className="text-muted-foreground mb-3">لا نشارك بياناتك الشخصية إلا في الحالات التالية:</p>
            <ul className="space-y-2.5 text-muted-foreground">
              <li className="flex gap-2"><span className="text-primary mt-0.5">•</span><span><strong className="text-foreground/80">مزودو الخدمة:</strong> Supabase (تخزين)، Vercel (استضافة)، Sentry (مراقبة الأخطاء) — وكلهم ملتزمون بمعايير خصوصية صارمة.</span></li>
              <li className="flex gap-2"><span className="text-primary mt-0.5">•</span><span><strong className="text-foreground/80">الجهات القانونية:</strong> إذا طُلب ذلك بموجب أمر قضائي أو نظام سارٍ.</span></li>
              <li className="flex gap-2"><span className="text-primary mt-0.5">•</span><span><strong className="text-foreground/80">نقل الملكية:</strong> في حال الاندماج أو الاستحواذ مع إشعارك مسبقًا.</span></li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3 pb-2 border-b border-border/50">٥. ملفات تعريف الارتباط (Cookies)</h2>
            <p className="text-muted-foreground mb-3">نستخدم cookies محدودة لأغراض:</p>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex gap-2"><span className="text-primary mt-0.5">•</span><span><strong className="text-foreground/80">ضرورية:</strong> الحفاظ على جلسة تسجيل الدخول وإعدادات المستخدم.</span></li>
              <li className="flex gap-2"><span className="text-primary mt-0.5">•</span><span><strong className="text-foreground/80">تحليلية:</strong> Google Analytics لفهم أنماط الاستخدام المجمّعة (يمكن إيقافها).</span></li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3 pb-2 border-b border-border/50">٦. حقوقك</h2>
            <p className="text-muted-foreground mb-3">يحق لك في أي وقت:</p>
            <ul className="space-y-2.5 text-muted-foreground">
              <li className="flex gap-2"><span className="text-primary mt-0.5">•</span><span><strong className="text-foreground/80">الوصول:</strong> طلب نسخة من بياناتك الشخصية.</span></li>
              <li className="flex gap-2"><span className="text-primary mt-0.5">•</span><span><strong className="text-foreground/80">التصحيح:</strong> تصحيح أي بيانات غير دقيقة.</span></li>
              <li className="flex gap-2"><span className="text-primary mt-0.5">•</span><span><strong className="text-foreground/80">الحذف:</strong> طلب حذف حسابك وجميع بياناتك.</span></li>
              <li className="flex gap-2"><span className="text-primary mt-0.5">•</span><span><strong className="text-foreground/80">التصدير:</strong> تصدير بياناتك بصيغة قابلة للقراءة.</span></li>
              <li className="flex gap-2"><span className="text-primary mt-0.5">•</span><span><strong className="text-foreground/80">الاعتراض:</strong> الاعتراض على معالجة بياناتك لأغراض تسويقية.</span></li>
            </ul>
            <p className="text-muted-foreground mt-3">
              لممارسة أي من هذه الحقوق تواصل معنا عبر:{' '}
              <a href="mailto:info@lifetent.online" className="text-primary hover:underline">
                info@lifetent.online
              </a>
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3 pb-2 border-b border-border/50">٧. مدة الاحتفاظ بالبيانات</h2>
            <p className="text-muted-foreground">
              نحتفظ ببياناتك طوال فترة نشاط حسابك. عند حذف الحساب نحذف البيانات الشخصية خلال <strong className="text-foreground/80">٣٠ يومًا</strong>، مع الاحتفاظ بسجلات مُجهَّلة للإحصاءات الداخلية.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3 pb-2 border-b border-border/50">٨. خصوصية الأطفال</h2>
            <p className="text-muted-foreground">
              المنصة مخصصة لمن هم في سن ١٨ عامًا فأكثر. إذا علمنا بجمع بيانات قاصر عن غير قصد سنحذفها فورًا.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3 pb-2 border-b border-border/50">٩. تحديثات السياسة</h2>
            <p className="text-muted-foreground">
              قد نُحدّث هذه السياسة من وقت لآخر. سنخطرك بأي تغييرات جوهرية عبر البريد الإلكتروني أو إشعار داخل التطبيق قبل ٣٠ يومًا على الأقل من سريانها.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3 pb-2 border-b border-border/50">١٠. التواصل</h2>
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
          <Link to="/refund" className="hover:text-foreground transition-colors">سياسة الاسترداد</Link>
          <Link to="/" className="hover:text-foreground transition-colors">العودة للرئيسية</Link>
        </div>
      </main>
    </div>
    </>
  );
}
