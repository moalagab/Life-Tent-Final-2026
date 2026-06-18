/**
 * send-welcome-email
 *
 * Triggered by a database trigger on auth.users INSERT via pg_net.
 * Sends a branded Arabic welcome email from info@lifetent.online.
 *
 * Required Supabase secrets:
 *   RESEND_API_KEY        — Resend API key
 *   SUPABASE_SERVICE_ROLE_KEY — for internal verification (optional)
 */
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const FROM   = "Life Tent <info@lifetent.online>";
const APP_URL = "https://www.lifetent.online";

const CORS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function welcomeHtml(email: string, name: string): string {
  const displayName = name || email.split("@")[0];
  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>مرحبًا بك في Life Tent</title>
</head>
<body style="margin:0;padding:0;background:#0f172a;font-family:'Segoe UI',Tahoma,Arial,sans-serif;direction:rtl;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="580" cellpadding="0" cellspacing="0" style="max-width:580px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="padding:32px 40px 24px;background:#131c32;border-radius:16px 16px 0 0;text-align:center;border-bottom:1px solid #1e2d4a;">
              <table cellpadding="0" cellspacing="0" style="margin:0 auto 16px;">
                <tr>
                  <td style="width:44px;height:44px;background:linear-gradient(135deg,#2e63e8,#5285f2);border-radius:12px;text-align:center;vertical-align:middle;">
                    <span style="font-size:22px;line-height:44px;">⛺</span>
                  </td>
                  <td style="padding-right:10px;vertical-align:middle;">
                    <span style="font-size:20px;font-weight:700;color:#e2e8f0;letter-spacing:1px;">LIFE TENT</span>
                  </td>
                </tr>
              </table>
              <p style="margin:0;color:#94a3b8;font-size:13px;">نظام إدارة الحياة المتكامل</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 40px;background:#131c32;">
              <h1 style="margin:0 0 8px;font-size:26px;font-weight:700;color:#f1f5f9;">
                أهلاً وسهلاً، ${displayName} 👋
              </h1>
              <p style="margin:0 0 24px;font-size:15px;color:#94a3b8;line-height:1.7;">
                يسعدنا انضمامك إلى مجتمع Life Tent. حسابك جاهز الآن — ابدأ رحلتك نحو إنتاجية حقيقية.
              </p>

              <!-- Quick start -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#1e2d4a;border-radius:12px;margin-bottom:28px;overflow:hidden;">
                <tr>
                  <td style="padding:20px 24px;border-bottom:1px solid #2a3f60;">
                    <p style="margin:0 0 16px;font-size:14px;font-weight:600;color:#e2e8f0;">🚀 ابدأ من هنا</p>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding:8px 0;border-bottom:1px solid #2a3f60;">
                          <span style="color:#5285f2;font-size:16px;margin-left:10px;">✓</span>
                          <span style="color:#cbd5e1;font-size:14px;">أضف مهمتك الأولى في لوحة المهام</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:8px 0;border-bottom:1px solid #2a3f60;">
                          <span style="color:#5285f2;font-size:16px;margin-left:10px;">✓</span>
                          <span style="color:#cbd5e1;font-size:14px;">حدّد هدفًا واحدًا لهذا الشهر</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:8px 0;border-bottom:1px solid #2a3f60;">
                          <span style="color:#5285f2;font-size:16px;margin-left:10px;">✓</span>
                          <span style="color:#cbd5e1;font-size:14px;">تتبع عادة يومية واحدة لمدة أسبوع</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:8px 0;">
                          <span style="color:#5285f2;font-size:16px;margin-left:10px;">✓</span>
                          <span style="color:#cbd5e1;font-size:14px;">جرّب مساعد الذكاء الاصطناعي</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- CTA -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td align="center">
                    <a href="${APP_URL}/dashboard" style="display:inline-block;padding:14px 36px;background:linear-gradient(135deg,#2e63e8,#5285f2);color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;border-radius:10px;">
                      افتح لوحة التحكم ←
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Plans hint -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#1a2744;border:1px solid #2a3f60;border-radius:10px;margin-bottom:8px;">
                <tr>
                  <td style="padding:16px 20px;">
                    <p style="margin:0;font-size:13px;color:#94a3b8;line-height:1.6;">
                      💡 <strong style="color:#e2e8f0;">أحتاج مزيدًا؟</strong>
                      اكتشف خطة Pro التي تفتح جميع الوحدات + AI Studio كامل.
                      <a href="${APP_URL}/pricing" style="color:#5285f2;text-decoration:none;">عرض التسعير →</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px 28px;background:#0d1626;border-radius:0 0 16px 16px;text-align:center;border-top:1px solid #1e2d4a;">
              <p style="margin:0 0 8px;font-size:12px;color:#475569;">
                لديك سؤال؟ راسلنا على
                <a href="mailto:info@lifetent.online" style="color:#5285f2;text-decoration:none;">info@lifetent.online</a>
              </p>
              <p style="margin:0;font-size:11px;color:#334155;">
                © 2026 Life Tent OS ·
                <a href="${APP_URL}/privacy" style="color:#475569;text-decoration:none;">الخصوصية</a> ·
                <a href="${APP_URL}/terms"   style="color:#475569;text-decoration:none;">الشروط</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405, headers: { ...CORS, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();

    // Payload from pg_net trigger: { record: { email, raw_user_meta_data } }
    const record    = body?.record ?? body;
    const email     = record?.email as string | undefined;
    const meta      = record?.raw_user_meta_data ?? {};
    const name: string = meta?.full_name ?? meta?.name ?? meta?.display_name ?? "";

    if (!email) {
      return new Response(JSON.stringify({ error: "No email in payload" }), {
        status: 400, headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    const { data, error } = await resend.emails.send({
      from:    FROM,
      to:      [email],
      subject: "مرحبًا بك في Life Tent — ابدأ الآن ⛺",
      html:    welcomeHtml(email, name),
    });

    if (error) {
      console.error("Resend error:", error);
      return new Response(JSON.stringify({ error }), {
        status: 500, headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    console.log("Welcome email sent:", email, data?.id);
    return new Response(JSON.stringify({ ok: true, id: data?.id }), {
      status: 200, headers: { ...CORS, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...CORS, "Content-Type": "application/json" },
    });
  }
});
