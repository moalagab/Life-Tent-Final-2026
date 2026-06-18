import { Link } from 'react-router-dom';
import { Tent, ArrowRight } from 'lucide-react';

export default function TermsOfService() {
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
          <h1 className="text-3xl font-bold text-foreground mb-3">شروط الاستخدام</h1>
          <p className="text-muted-foreground leading-relaxed">
            يُرجى قراءة هذه الشروط بعناية قبل استخدام منصة Life Tent. باستخدامك للمنصة فأنت توافق على الالتزام بهذه الشروط.
          </p>
        </div>

        <div className="space-y-10 text-[15px] leading-relaxed">

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3 pb-2 border-b border-border/50">١. قبول الشروط</h2>
            <p className="text-muted-foreground">
              بتسجيلك في منصة Life Tent OS أو استخدامها بأي شكل، فإنك تقر بأنك قرأت هذه الشروط وفهمتها وتوافق على الالتزام بها وبسياسة الخصوصية المرتبطة بها. إذا كنت لا توافق على أي من هذه الشروط، يُرجى عدم استخدام المنصة.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3 pb-2 border-b border-border/50">٢. وصف الخدمة</h2>
            <p className="text-muted-foreground mb-3">
              Life Tent OS هي منصة متكاملة لإدارة الحياة الشخصية تشمل:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-muted-foreground pr-3">
              <li>إدارة المهام والمشاريع والأهداف</li>
              <li>تتبع العادات والروتين اليومي</li>
              <li>إدارة الشؤون المالية الشخصية</li>
              <li>قاعدة معرفية وملاحظات شخصية</li>
              <li>تقارير وتحليلات سلوكية</li>
            </ul>
            <p className="text-muted-foreground mt-3">
              نحتفظ بالحق في تعديل الخدمة أو إضافة ميزات جديدة أو إيقاف بعض الميزات في أي وقت مع إشعار مسبق قدر الإمكان.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3 pb-2 border-b border-border/50">٣. الحساب والمسؤولية</h2>
            <ul className="space-y-2.5 text-muted-foreground">
              <li className="flex gap-2"><span className="text-primary mt-0.5">•</span><span>يجب أن يكون عمرك ١٨ عامًا أو أكثر لاستخدام المنصة.</span></li>
              <li className="flex gap-2"><span className="text-primary mt-0.5">•</span><span>أنت مسؤول عن الحفاظ على سرية بيانات تسجيل دخولك.</span></li>
              <li className="flex gap-2"><span className="text-primary mt-0.5">•</span><span>أنت مسؤول عن جميع الأنشطة التي تتم تحت حسابك.</span></li>
              <li className="flex gap-2"><span className="text-primary mt-0.5">•</span><span>يجب إخطارنا فورًا عند الاشتباه في أي استخدام غير مصرح به لحسابك.</span></li>
              <li className="flex gap-2"><span className="text-primary mt-0.5">•</span><span>يُمنع إنشاء حسابات متعددة لنفس الشخص بهدف التحايل على القيود.</span></li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3 pb-2 border-b border-border/50">٤. الاستخدام المقبول</h2>
            <p className="text-muted-foreground mb-3">يُحظر استخدام المنصة من أجل:</p>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex gap-2"><span className="text-destructive mt-0.5">✕</span><span>انتهاك أي قوانين أو أنظمة سارية.</span></li>
              <li className="flex gap-2"><span className="text-destructive mt-0.5">✕</span><span>نشر محتوى ضار أو مسيء أو ينتهك خصوصية الآخرين.</span></li>
              <li className="flex gap-2"><span className="text-destructive mt-0.5">✕</span><span>محاولة اختراق أو التدخل في أمان المنصة.</span></li>
              <li className="flex gap-2"><span className="text-destructive mt-0.5">✕</span><span>استخراج البيانات بطريقة آلية (Scraping) دون إذن كتابي.</span></li>
              <li className="flex gap-2"><span className="text-destructive mt-0.5">✕</span><span>إعادة بيع أو تأجير الوصول للمنصة لأطراف ثالثة.</span></li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3 pb-2 border-b border-border/50">٥. الاشتراك والدفع</h2>
            <ul className="space-y-2.5 text-muted-foreground">
              <li className="flex gap-2"><span className="text-primary mt-0.5">•</span><span>تتوفر خطط مجانية ومدفوعة. تظهر تفاصيل الأسعار على صفحة التسعير.</span></li>
              <li className="flex gap-2"><span className="text-primary mt-0.5">•</span><span>تُجدَّد الاشتراكات المدفوعة تلقائيًا ما لم تُلغِها قبل تاريخ التجديد.</span></li>
              <li className="flex gap-2"><span className="text-primary mt-0.5">•</span><span>الأسعار قابلة للتغيير مع إشعار مسبق لا يقل عن ٣٠ يومًا.</span></li>
              <li className="flex gap-2"><span className="text-primary mt-0.5">•</span><span>للاطلاع على شروط الاسترداد يُرجى مراجعة <Link to="/refund" className="text-primary hover:underline">سياسة الاسترداد</Link>.</span></li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3 pb-2 border-b border-border/50">٦. الملكية الفكرية</h2>
            <p className="text-muted-foreground mb-3">
              جميع حقوق الملكية الفكرية للمنصة — بما تشمل التصميم والكود والعلامات التجارية — محفوظة لفريق Life Tent OS.
            </p>
            <p className="text-muted-foreground">
              بياناتك الشخصية التي تُدخلها في المنصة (مهام، ملاحظات، أهداف…) تبقى ملكًا لك. نمنحك حق استخدام المنصة وفق هذه الشروط، وتمنحنا حق تخزين بياناتك ومعالجتها لتقديم الخدمة.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3 pb-2 border-b border-border/50">٧. إخلاء المسؤولية</h2>
            <p className="text-muted-foreground mb-3">
              تُقدَّم المنصة "كما هي" دون ضمانات صريحة أو ضمنية. لا نضمن استمرارية الخدمة دون انقطاع. لن نكون مسؤولين عن:
            </p>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex gap-2"><span className="text-muted-foreground/60 mt-0.5">•</span><span>أي خسائر ناجمة عن استخدام المنصة أو عدم إمكانية الوصول إليها.</span></li>
              <li className="flex gap-2"><span className="text-muted-foreground/60 mt-0.5">•</span><span>فقدان البيانات في حالات خارجة عن إرادتنا.</span></li>
              <li className="flex gap-2"><span className="text-muted-foreground/60 mt-0.5">•</span><span>قرارات اتخذتها بناءً على تحليلات المنصة.</span></li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3 pb-2 border-b border-border/50">٨. إنهاء الحساب</h2>
            <p className="text-muted-foreground">
              يحق لك حذف حسابك في أي وقت من إعدادات الحساب. يحق لنا تعليق أو إنهاء حسابك في حال انتهاك هذه الشروط، مع إشعار مسبق إلا في حالات الانتهاك الجسيم. عند الإنهاء ستحتفظ ببياناتك لمدة ٣٠ يومًا قابلة للتصدير قبل الحذف النهائي.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3 pb-2 border-b border-border/50">٩. القانون المطبق</h2>
            <p className="text-muted-foreground">
              تخضع هذه الشروط لأنظمة المملكة العربية السعودية. أي نزاع يُحسم وفق الأنظمة السارية في المملكة العربية السعودية.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3 pb-2 border-b border-border/50">١٠. التواصل</h2>
            <p className="text-muted-foreground">
              لأي استفسار بشأن هذه الشروط يُرجى التواصل عبر:{' '}
              <a href="mailto:support@lifetent.online" className="text-primary hover:underline">
                support@lifetent.online
              </a>
            </p>
          </section>

        </div>

        {/* Footer links */}
        <div className="mt-16 pt-8 border-t border-border/50 flex flex-wrap gap-4 text-sm text-muted-foreground">
          <Link to="/privacy" className="hover:text-foreground transition-colors">سياسة الخصوصية</Link>
          <Link to="/refund" className="hover:text-foreground transition-colors">سياسة الاسترداد</Link>
          <Link to="/" className="hover:text-foreground transition-colors">العودة للرئيسية</Link>
        </div>
      </main>
    </div>
  );
}
