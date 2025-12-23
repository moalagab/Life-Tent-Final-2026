import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ProjectReminder {
  project_id: string;
  project_title: string;
  due_date: string;
  days_left: number;
  user_email: string;
  user_name: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get projects with upcoming deadlines (within 7 days)
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('id, title, due_date, user_id, status')
      .gte('due_date', today.toISOString().split('T')[0])
      .lte('due_date', nextWeek.toISOString().split('T')[0])
      .in('status', ['active', 'on_hold']);

    if (projectsError) throw projectsError;

    if (!projects || projects.length === 0) {
      return new Response(
        JSON.stringify({ message: "No projects with upcoming deadlines" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Get unique user IDs
    const userIds = [...new Set(projects.map(p => p.user_id))];

    // Get user emails from auth
    const reminders: ProjectReminder[] = [];
    
    for (const project of projects) {
      const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(project.user_id);
      
      if (userError || !user?.email) continue;

      // Get profile for name
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('user_id', project.user_id)
        .single();

      const dueDate = new Date(project.due_date);
      const daysLeft = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      reminders.push({
        project_id: project.id,
        project_title: project.title,
        due_date: project.due_date,
        days_left: daysLeft,
        user_email: user.email,
        user_name: profile?.full_name || 'User'
      });
    }

    // Send emails
    const emailResults = [];
    for (const reminder of reminders) {
      const urgencyText = reminder.days_left <= 1 
        ? "⚠️ URGENT: Tomorrow!" 
        : reminder.days_left <= 3 
          ? "⏰ Due Soon!" 
          : "📅 Reminder";

      try {
        const emailResponse = await resend.emails.send({
          from: "Project Reminders <onboarding@resend.dev>",
          to: [reminder.user_email],
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
                .soon { background: #fef3c7; color: #d97706; }
                .normal { background: #dbeafe; color: #2563eb; }
                .footer { padding: 24px; text-align: center; color: #666; font-size: 12px; border-top: 1px solid #eee; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>📋 Project Reminder</h1>
                </div>
                <div class="content">
                  <p>Hello ${reminder.user_name},</p>
                  <p>This is a friendly reminder about your upcoming project deadline:</p>
                  
                  <div class="project-card">
                    <div class="project-title">${reminder.project_title}</div>
                    <div class="due-date">Due: ${new Date(reminder.due_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
                    <span class="days-badge ${reminder.days_left <= 1 ? 'urgent' : reminder.days_left <= 3 ? 'soon' : 'normal'}">
                      ${reminder.days_left === 0 ? 'Due Today!' : reminder.days_left === 1 ? 'Due Tomorrow!' : `${reminder.days_left} days left`}
                    </span>
                  </div>
                  
                  <p>Stay on track and keep making progress! 💪</p>
                </div>
                <div class="footer">
                  <p>This reminder was sent automatically from your productivity app.</p>
                </div>
              </div>
            </body>
            </html>
          `,
        });

        emailResults.push({ success: true, email: reminder.user_email, project: reminder.project_title });
      } catch (emailError: any) {
        emailResults.push({ success: false, email: reminder.user_email, error: emailError.message });
      }
    }

    return new Response(
      JSON.stringify({ 
        message: `Processed ${reminders.length} reminders`,
        results: emailResults 
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-project-reminders:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
