/**
 * send-project-reminders — cron/background job triggered by Supabase scheduler.
 * Uses SERVICE_ROLE_KEY intentionally (admin access to fetch user emails).
 * CORS restricted to known origins.
 */
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const ALLOWED_ORIGINS = [
  "https://www.lifetent.online",
  "https://lifetent.online",
  "http://localhost:8080",
  "http://localhost:8081",
  "http://localhost:8082",
  "http://localhost:8083",
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

interface ProjectReminder {
  project_id:    string;
  project_title: string;
  due_date:      string;
  days_left:     number;
  user_email:    string;
  user_name:     string;
}

const handler = async (req: Request): Promise<Response> => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  if (!RESEND_API_KEY) {
    return new Response(JSON.stringify({ error: "RESEND_API_KEY not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  try {
    // Service role is required for sending emails — intentional admin use
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const today    = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const { data: projects, error: projectsError } = await supabase
      .from("projects")
      .select("id, title, due_date, user_id, status")
      .gte("due_date", today.toISOString().split("T")[0])
      .lte("due_date", nextWeek.toISOString().split("T")[0])
      .in("status", ["active", "on_hold"]);

    if (projectsError) throw projectsError;

    if (!projects || projects.length === 0) {
      return new Response(
        JSON.stringify({ message: "No projects with upcoming deadlines" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const reminders: ProjectReminder[] = [];

    for (const project of projects) {
      const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(project.user_id);
      if (userError || !user?.email) continue;

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("user_id", project.user_id)
        .single();

      const dueDate  = new Date(project.due_date);
      const daysLeft = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      reminders.push({
        project_id:    project.id,
        project_title: project.title,
        due_date:      project.due_date,
        days_left:     daysLeft,
        user_email:    user.email,
        user_name:     profile?.full_name || "User",
      });
    }

    const emailResults = [];
    for (const reminder of reminders) {
      const urgencyText =
        reminder.days_left <= 1 ? "⚠️ URGENT: Tomorrow!"
        : reminder.days_left <= 3 ? "⏰ Due Soon!"
        : "📅 Reminder";

      try {
        const emailRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${RESEND_API_KEY}`,
            "Content-Type":  "application/json",
          },
          body: JSON.stringify({
            from:    "Project Reminders <reminders@lifetent.online>",
            to:      [reminder.user_email],
            subject: `${urgencyText} Project "${reminder.project_title}" due in ${reminder.days_left} day(s)`,
            html: `
              <!DOCTYPE html>
              <html>
              <head>
                <style>
                  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f9fafb; padding: 40px 20px; }
                  .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
                  .header { background: linear-gradient(135deg, #FFB400, #FF8C00); padding: 32px; text-align: center; }
                  .header h1 { color: white; margin: 0; font-size: 24px; }
                  .content { padding: 32px; }
                  .project-card { background: #f9fafb; border-radius: 12px; padding: 24px; margin: 20px 0; border-left: 4px solid #FFB400; }
                  .project-title { font-size: 20px; font-weight: bold; color: #111; margin-bottom: 8px; }
                  .due-date { color: #666; font-size: 14px; }
                  .days-badge { display: inline-block; padding: 6px 16px; border-radius: 20px; font-weight: bold; margin-top: 12px; }
                  .urgent { background: #fee2e2; color: #dc2626; }
                  .soon   { background: #fef3c7; color: #d97706; }
                  .normal { background: #dbeafe; color: #2563eb; }
                  .footer { padding: 24px; text-align: center; color: #666; font-size: 12px; border-top: 1px solid #eee; }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="header"><h1>📋 Project Reminder</h1></div>
                  <div class="content">
                    <p>Hello ${reminder.user_name},</p>
                    <p>This is a friendly reminder about your upcoming project deadline:</p>
                    <div class="project-card">
                      <div class="project-title">${reminder.project_title}</div>
                      <div class="due-date">Due: ${new Date(reminder.due_date).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</div>
                      <span class="days-badge ${reminder.days_left <= 1 ? "urgent" : reminder.days_left <= 3 ? "soon" : "normal"}">
                        ${reminder.days_left === 0 ? "Due Today!" : reminder.days_left === 1 ? "Due Tomorrow!" : `${reminder.days_left} days left`}
                      </span>
                    </div>
                    <p>Stay on track and keep making progress! 💪</p>
                  </div>
                  <div class="footer"><p>Sent automatically from Life Tent OS.</p></div>
                </div>
              </body>
              </html>
            `,
          }),
        });
        if (emailRes.ok) {
          emailResults.push({ success: true,  email: reminder.user_email, project: reminder.project_title });
        } else {
          const errText = await emailRes.text();
          emailResults.push({ success: false, email: reminder.user_email, error: errText });
        }
      } catch (emailError: unknown) {
        emailResults.push({ success: false, email: reminder.user_email, error: (emailError as Error).message });
      }
    }

    return new Response(
      JSON.stringify({ message: `Processed ${reminders.length} reminders`, results: emailResults }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: unknown) {
    console.error("send-project-reminders error:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

Deno.serve(handler);
