/**
 * send-notifications — General-purpose email notification dispatcher
 *
 * POST body:
 * {
 *   type: 'task_reminder' | 'habit_reminder' | 'debt_due' | 'subscription_renewal' | 'budget_alert' | 'goal_progress' | 'backup_complete',
 *   to: string,            // recipient email
 *   userName?: string,
 *   data: Record<string, unknown>  // type-specific payload
 * }
 *
 * Requires env: RESEND_API_KEY
 */
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const FROM = "Life Tent OS <notifications@lifetent.online>";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ── HTML email base ──────────────────────────────────────────────────────────
function baseHtml(title: string, preheader: string, bodyHtml: string) {
  return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;background:#0f0f1a;color:#e2e8f0;direction:rtl}
  .wrap{max-width:580px;margin:40px auto;background:#1a1a2e;border-radius:20px;overflow:hidden;border:1px solid #2d2d4e}
  .head{background:linear-gradient(135deg,#d4a017,#b8860b);padding:32px 28px;text-align:center}
  .head h1{color:#0f0f1a;font-size:22px;font-weight:800;margin-top:8px}
  .logo{font-size:28px;font-weight:900;color:#0f0f1a;letter-spacing:1px}
  .body{padding:28px}
  .card{background:#0f0f1a;border-radius:12px;padding:20px;margin:16px 0;border:1px solid #2d2d4e}
  .badge{display:inline-block;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:600}
  .badge-warn{background:#fef3c7;color:#92400e}
  .badge-danger{background:#fee2e2;color:#991b1b}
  .badge-ok{background:#d1fae5;color:#065f46}
  .btn{display:inline-block;margin-top:20px;padding:12px 28px;background:linear-gradient(135deg,#d4a017,#b8860b);color:#0f0f1a;border-radius:10px;text-decoration:none;font-weight:700;font-size:14px}
  .foot{padding:20px 28px;text-align:center;font-size:11px;color:#64748b;border-top:1px solid #2d2d4e}
  h3{font-size:15px;color:#e2e8f0;margin-bottom:4px}
  p{color:#94a3b8;font-size:14px;line-height:1.7}
  .divider{border:none;border-top:1px solid #2d2d4e;margin:16px 0}
</style>
</head>
<body>
<div style="display:none;max-height:0;overflow:hidden">${preheader}</div>
<div class="wrap">
  <div class="head">
    <div class="logo">⛺ LIFE TENT</div>
    <h1>${title}</h1>
  </div>
  <div class="body">${bodyHtml}</div>
  <div class="foot">
    <p>تم الإرسال تلقائياً من نظام Life Tent OS · <a href="#" style="color:#d4a017">إلغاء الاشتراك</a></p>
  </div>
</div>
</body>
</html>`;
}

// ── Per-type renderers ───────────────────────────────────────────────────────
type NotifType =
  | 'task_reminder'
  | 'habit_reminder'
  | 'debt_due'
  | 'subscription_renewal'
  | 'budget_alert'
  | 'goal_progress'
  | 'backup_complete';

interface EmailSpec { subject: string; title: string; preheader: string; body: string; }

function buildEmail(type: NotifType, userName: string, data: Record<string, unknown>): EmailSpec {
  const name = userName || 'المستخدم';

  switch (type) {
    case 'task_reminder':
      return {
        subject: `⏰ تذكير: ${data.taskTitle}`,
        title: 'تذكير بمهمة',
        preheader: `مهمتك "${data.taskTitle}" تستحق انتباهك`,
        body: `
          <p>مرحباً ${name}،</p>
          <div class="card">
            <h3>${data.taskTitle}</h3>
            <p>${data.description || ''}</p>
            ${data.dueDate ? `<p style="margin-top:8px">📅 الاستحقاق: <strong>${data.dueDate}</strong></p>` : ''}
            ${data.priority ? `<span class="badge badge-warn">${data.priority}</span>` : ''}
          </div>
          <a class="btn" href="${data.appUrl || 'https://lifetent.app/tasks'}">فتح التطبيق</a>`,
      };

    case 'habit_reminder':
      return {
        subject: `🔁 حان وقت عادتك: ${data.habitName}`,
        title: 'تذكير بالعادة اليومية',
        preheader: `لا تنسَ عادتك "${data.habitName}" اليوم`,
        body: `
          <p>مرحباً ${name}،</p>
          <div class="card">
            <h3>${data.habitName}</h3>
            ${data.streak ? `<p>🔥 سلسلتك الحالية: <strong>${data.streak} يوم</strong></p>` : ''}
            ${data.targetTime ? `<p>⏰ الوقت المستهدف: ${data.targetTime}</p>` : ''}
          </div>
          <a class="btn" href="${data.appUrl || 'https://lifetent.app/habits'}">تسجيل الإنجاز</a>`,
      };

    case 'debt_due':
      return {
        subject: `💳 تذكير سداد: ${data.debtName}`,
        title: 'موعد سداد دين',
        preheader: `موعد سداد "${data.debtName}" قريب`,
        body: `
          <p>مرحباً ${name}،</p>
          <div class="card">
            <h3>${data.debtName}</h3>
            <p>المبلغ المستحق: <strong>${data.amount} ${data.currency || 'SAR'}</strong></p>
            <p>📅 تاريخ الاستحقاق: <strong>${data.dueDate}</strong></p>
            ${(data.daysLeft as number) <= 3
              ? `<span class="badge badge-danger">⚠️ ${data.daysLeft} أيام متبقية</span>`
              : `<span class="badge badge-warn">📅 ${data.daysLeft} أيام متبقية</span>`}
          </div>
          <a class="btn" href="${data.appUrl || 'https://lifetent.app/finance?tab=debts'}">عرض الديون</a>`,
      };

    case 'subscription_renewal':
      return {
        subject: `🔄 تجديد قريب: ${data.subscriptionName}`,
        title: 'موعد تجديد اشتراك',
        preheader: `اشتراكك في "${data.subscriptionName}" سيُجدَّد قريباً`,
        body: `
          <p>مرحباً ${name}،</p>
          <div class="card">
            <h3>${data.subscriptionName}</h3>
            <p>المبلغ: <strong>${data.amount} ${data.currency || 'SAR'}</strong></p>
            <p>📅 تاريخ التجديد: <strong>${data.renewalDate}</strong></p>
            <span class="badge badge-warn">${data.daysLeft} أيام</span>
          </div>
          <a class="btn" href="${data.appUrl || 'https://lifetent.app/finance?tab=subscriptions'}">عرض الاشتراكات</a>`,
      };

    case 'budget_alert':
      return {
        subject: `⚠️ تنبيه ميزانية: ${data.categoryName}`,
        title: 'تجاوز حد الميزانية',
        preheader: `اقتربت من حد ميزانية "${data.categoryName}"`,
        body: `
          <p>مرحباً ${name}،</p>
          <div class="card">
            <h3>فئة: ${data.categoryName}</h3>
            <p>المصروف: <strong>${data.spent} ${data.currency || 'SAR'}</strong> من أصل <strong>${data.budget} ${data.currency || 'SAR'}</strong></p>
            <p>نسبة الاستهلاك: <strong>${data.percent}%</strong></p>
            ${(data.percent as number) >= 100
              ? `<span class="badge badge-danger">تجاوزت الميزانية</span>`
              : `<span class="badge badge-warn">قاربت على النفاد</span>`}
          </div>
          <a class="btn" href="${data.appUrl || 'https://lifetent.app/finance?tab=budget'}">عرض الميزانية</a>`,
      };

    case 'goal_progress':
      return {
        subject: `🎯 تقرير تقدم: ${data.goalTitle}`,
        title: 'تقرير تقدم الأهداف',
        preheader: `تقرير أسبوعي لهدفك "${data.goalTitle}"`,
        body: `
          <p>مرحباً ${name}،</p>
          <div class="card">
            <h3>${data.goalTitle}</h3>
            <p>نسبة الإنجاز: <strong>${data.progress}%</strong></p>
            <div style="background:#2d2d4e;border-radius:99px;height:8px;margin:8px 0">
              <div style="background:linear-gradient(90deg,#d4a017,#b8860b);width:${data.progress}%;height:100%;border-radius:99px"></div>
            </div>
            ${data.dueDate ? `<p>📅 الموعد النهائي: ${data.dueDate}</p>` : ''}
          </div>
          <a class="btn" href="${data.appUrl || 'https://lifetent.app/goals'}">عرض الأهداف</a>`,
      };

    case 'backup_complete':
      return {
        subject: `✅ تم إنشاء نسخة احتياطية`,
        title: 'النسخة الاحتياطية جاهزة',
        preheader: `تم حفظ بياناتك بنجاح`,
        body: `
          <p>مرحباً ${name}،</p>
          <div class="card">
            <span class="badge badge-ok">✓ تمت العملية بنجاح</span>
            <p style="margin-top:12px">تم إنشاء نسخة احتياطية شاملة لبياناتك في <strong>${data.timestamp}</strong></p>
            ${data.size ? `<p>الحجم: ${data.size}</p>` : ''}
          </div>
          <a class="btn" href="${data.downloadUrl || '#'}">تنزيل النسخة الاحتياطية</a>`,
      };

    default:
      return {
        subject: 'إشعار من Life Tent OS',
        title: 'إشعار',
        preheader: '',
        body: `<p>مرحباً ${name}،</p><p>لديك إشعار جديد.</p>`,
      };
  }
}

// ── Handler ──────────────────────────────────────────────────────────────────
const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  try {
    const { type, to, userName, data } = await req.json() as {
      type: NotifType;
      to: string;
      userName?: string;
      data: Record<string, unknown>;
    };

    if (!type || !to) {
      return new Response(JSON.stringify({ error: "type and to are required" }), {
        status: 400, headers: { "Content-Type": "application/json", ...cors },
      });
    }

    const spec = buildEmail(type, userName ?? '', data ?? {});

    const { error } = await resend.emails.send({
      from: FROM,
      to: [to],
      subject: spec.subject,
      html: baseHtml(spec.title, spec.preheader, spec.body),
    });

    if (error) throw new Error(error.message);

    return new Response(JSON.stringify({ success: true }), {
      status: 200, headers: { "Content-Type": "application/json", ...cors },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("send-notifications error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: { "Content-Type": "application/json", ...cors },
    });
  }
};

serve(handler);
