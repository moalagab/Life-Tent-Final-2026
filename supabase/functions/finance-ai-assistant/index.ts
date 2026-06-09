import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Require authenticated user
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { messages, type, context } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    let systemPrompt = "";

    switch (type) {
      case "finance-assistant":
        systemPrompt = `أنت مساعد مالي ذكي باللغة العربية. تساعد المستخدمين في:
- تحليل المصروفات والإيرادات
- تقديم نصائح مالية مخصصة
- المساعدة في وضع الميزانيات
- تحليل الديون واستراتيجيات السداد
- تقديم رؤى حول الادخار والاستثمار

السياق المالي الحالي للمستخدم:
${context ? JSON.stringify(context, null, 2) : 'لا يوجد سياق متاح'}

قواعد مهمة:
- كن موجزاً ومفيداً
- قدم نصائح عملية وقابلة للتنفيذ
- استخدم الأرقام والنسب المئوية عند الإمكان
- تحدث بلغة المستخدم (عربي أو إنجليزي)`;
        break;

      case "spending-analysis":
        systemPrompt = `أنت محلل مصروفات ذكي. حلل البيانات المالية التالية وقدم:
1. تحليل أنماط الإنفاق
2. تحديد المجالات التي يمكن تقليل المصروفات فيها
3. مقارنة الإنفاق الفعلي بالميزانية
4. توصيات محددة للتحسين

البيانات:
${context ? JSON.stringify(context, null, 2) : 'لا توجد بيانات'}`;
        break;

      case "debt-strategy":
        systemPrompt = `أنت خبير في استراتيجيات سداد الديون. بناءً على المعلومات التالية:
1. قم بتحليل الديون الحالية
2. قدم خطة سداد مُحسّنة
3. قارن بين استراتيجية كرة الثلج والانهيار الجليدي
4. احسب التوفير المحتمل في الفوائد

معلومات الديون:
${context ? JSON.stringify(context, null, 2) : 'لا توجد ديون'}`;
        break;

      case "budget-suggestions":
        systemPrompt = `أنت مستشار ميزانية محترف. بناءً على الدخل والمصروفات:
1. اقترح توزيع الميزانية الأمثل
2. حدد أولويات الإنفاق
3. اقترح صناديق ادخار مناسبة
4. قدم نصائح لتحقيق الأهداف المالية

البيانات المالية:
${context ? JSON.stringify(context, null, 2) : 'لا توجد بيانات'}`;
        break;

      default:
        systemPrompt = `أنت مساعد ذكي متعدد الاستخدامات. ساعد المستخدم في طلبه بشكل احترافي ومفيد.`;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "تم تجاوز حد الطلبات. يرجى المحاولة لاحقاً." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "يرجى إضافة رصيد لاستخدام المساعد الذكي." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "حدث خطأ في الخدمة" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Finance AI assistant error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
