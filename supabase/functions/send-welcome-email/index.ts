/**
 * send-welcome-email
 * Colors: Midnight Navy #131C32 | Primary Blue #2E63E8 | Coral #E2674A
 */
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend  = new Resend(Deno.env.get("RESEND_API_KEY"));
const FROM    = "Life Tent <info@lifetent.online>";
const APP_URL = "https://www.lifetent.online";

const ALLOWED_ORIGINS = [
  "https://www.lifetent.online",
  "https://lifetent.online",
  "http://localhost:8080",
  "http://localhost:8081",
  "http://localhost:8082",
  "http://localhost:8083",
  "https://localhost",
  "lifetent://localhost",
  "capacitor://localhost",
  "ionic://localhost",
];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("origin") ?? "";
  const allowOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin":  allowOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

function welcomeHtml(email: string, name: string): string {
  const displayName = name || email.split("@")[0];
  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>مرحبًا بك في Life Tent</title>
</head>
<body style="margin:0;padding:0;background:#ffffff;font-family:'Segoe UI',Tahoma,Arial,sans-serif;direction:rtl;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;border-radius:20px;overflow:hidden;">

          <!-- ── Header: gradient navy + logo inside ── -->
          <tr>
            <td style="padding:36px 40px 28px;background:linear-gradient(160deg,#1e3a8a 0%,#131C32 60%,#0d1626 100%);text-align:center;">
              <table cellpadding="0" cellspacing="0" style="margin:0 auto 14px;">
                <tr>
                  <td style="vertical-align:middle;">
                    <img src="https://www.lifetent.online/pwa-192x192.png"
                         width="54" height="54"
                         style="display:block;border-radius:13px;"
                         alt="Life Tent" />
                  </td>
                  <td style="padding-right:12px;vertical-align:middle;text-align:right;">
                    <span style="font-size:20px;font-weight:700;color:#EAF0FB;letter-spacing:1px;">LIFE TENT</span>
                  </td>
                </tr>
              </table>
              <p style="margin:0;color:#5285F2;font-size:13px;letter-spacing:0.3px;">نظام إدارة الحياة المتكامل</p>
            </td>
          </tr>

          <!-- ── Coral divider ── -->
          <tr>
            <td style="height:3px;background:linear-gradient(90deg,#131C32,#E2674A 40%,#E2674A 60%,#131C32);font-size:0;line-height:0;">&nbsp;</td>
          </tr>

          <!-- ── Body ── -->
          <tr>
            <td style="padding:36px 40px 28px;background:#131C32;">
              <!-- Brand promise visual -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
                <tr>
                  <td style="padding:22px 24px;background:#0d1626;border-radius:14px;border-right:3px solid #E2674A;text-align:right;">
                    <p style="margin:0 0 10px;font-size:11px;font-weight:600;color:#E2674A;letter-spacing:2px;">وعدنا معك</p>
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="vertical-align:middle;padding-left:10px;">
                          <span style="font-size:15px;color:#3d5070;text-decoration:line-through;font-style:italic;">فوضى يومك</span>
                        </td>
                        <td style="vertical-align:middle;padding:0 10px;">
                          <span style="font-size:18px;color:#E2674A;font-weight:300;">&#x2192;</span>
                        </td>
                        <td style="vertical-align:middle;">
                          <span style="font-size:16px;font-weight:700;color:#EAF0FB;">قرارات واضحة</span>
                        </td>
                      </tr>
                    </table>
                    <p style="margin:10px 0 0;font-size:13px;color:#5285F2;font-style:italic;">بهدوء، وبلغتك.</p>
                  </td>
                </tr>
              </table>

              <h1 style="margin:0 0 10px;font-size:26px;font-weight:700;color:#EAF0FB;line-height:1.3;">
                أهلاً ${displayName}،
              </h1>
              <p style="margin:0 0 28px;font-size:15px;color:#8A99B5;line-height:1.9;">
                يومك من الآن أوضح. كل شيء في مكانه — ابدأ من حيث تريد، خطوة واحدة تكفي.
              </p>

              <!-- Quick start card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#1e2d4a;border-radius:12px;margin-bottom:28px;overflow:hidden;">
                <tr>
                  <td style="padding:20px 24px;">
                    <p style="margin:0 0 14px;font-size:12px;font-weight:600;color:#5285F2;letter-spacing:1px;">خطواتك الأولى</p>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding:9px 0;border-bottom:1px solid #2a3f60;">
                          <span style="color:#5285F2;font-size:13px;margin-left:10px;font-weight:700;">—</span>
                          <span style="color:#C4CFDF;font-size:14px;">أضف مهمة واحدة الآن</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:9px 0;border-bottom:1px solid #2a3f60;">
                          <span style="color:#5285F2;font-size:13px;margin-left:10px;font-weight:700;">—</span>
                          <span style="color:#C4CFDF;font-size:14px;">اختر هدفًا لهذا الشهر</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:9px 0;border-bottom:1px solid #2a3f60;">
                          <span style="color:#5285F2;font-size:13px;margin-left:10px;font-weight:700;">—</span>
                          <span style="color:#C4CFDF;font-size:14px;">تتبع عادة يومية لأسبوع واحد</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:9px 0;">
                          <span style="color:#E2674A;font-size:13px;margin-left:10px;font-weight:700;">—</span>
                          <span style="color:#C4CFDF;font-size:14px;">اسأل المساعد الذكي — يقرأ يومك ويقترح</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- CTA -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td align="center">
                    <a href="${APP_URL}/dashboard"
                       style="display:inline-block;padding:14px 44px;background:linear-gradient(135deg,#2E63E8,#5285F2);color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;border-radius:10px;">
                      ابدأ الآن ←
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Pro hint -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:14px 18px;background:#1a2744;border:1px solid #2a3f60;border-radius:10px;">
                    <p style="margin:0;font-size:13px;color:#8A99B5;line-height:1.7;">
                      عندما تحتاج الصورة الكاملة — <strong style="color:#EAF0FB;">Pro</strong> يفتح لك كل الوحدات + AI Studio.
                      <a href="${APP_URL}/pricing" style="color:#5285F2;text-decoration:none;white-space:nowrap;">اطّلع على الخطط ←</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ── Footer ── -->
          <tr>
            <td style="padding:20px 40px 24px;background:#1e2d4a;text-align:center;border-top:1px solid #2a3f60;">
              <p style="margin:0 0 6px;font-size:12px;color:#475569;">
                لديك سؤال؟ راسلنا على
                <a href="mailto:info@lifetent.online" style="color:#5285F2;text-decoration:none;">info@lifetent.online</a>
              </p>
              <p style="margin:0;font-size:11px;color:#334155;">
                © 2026 Life Tent OS &nbsp;·&nbsp;
                <a href="${APP_URL}/privacy" style="color:#475569;text-decoration:none;">الخصوصية</a>
                &nbsp;·&nbsp;
                <a href="${APP_URL}/terms" style="color:#475569;text-decoration:none;">الشروط</a>
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

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body  = await req.json();
    const record = body?.record ?? body;
    const email  = record?.email as string | undefined;
    const meta   = record?.raw_user_meta_data ?? {};
    const name: string = meta?.full_name ?? meta?.name ?? meta?.display_name ?? "";

    if (!email) {
      return new Response(JSON.stringify({ error: "No email in payload" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data, error } = await resend.emails.send({
      from:    FROM,
      to:      [email],
      subject: "حسابك جاهز — ابدأ من خطوة واحدة",
      html:    welcomeHtml(email, name),
    });

    if (error) {
      console.error("Resend error:", error);
      return new Response(JSON.stringify({ error }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Welcome email sent:", email, data?.id);
    return new Response(JSON.stringify({ ok: true, id: data?.id }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
