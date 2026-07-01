import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { rateLimit } from "../_shared/upstash.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://www.lifetent.online',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Returns the authenticated user's ID, or null if the request is unauthenticated.
async function verifyAuth(req: Request): Promise<string | null> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.replace('Bearer ', '');
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
  );
  const { data: { user }, error } = await supabase.auth.getUser(token);
  return error || !user ? null : user.id;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const userId = await verifyAuth(req);
    if (!userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const allowed = await rateLimit(userId, 'calculate-project-health', 30, 60);
    if (!allowed) {
      return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
        status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { project_id } = await req.json() as { project_id: string };
    if (!project_id) {
      return new Response(JSON.stringify({ error: 'project_id required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Service-role client bypasses RLS, so ownership must be enforced explicitly here.
    const [{ data: project, error: projErr }, { data: tasks, error: tasksErr }] = await Promise.all([
      supabaseAdmin.from('projects').select('*').eq('id', project_id).eq('user_id', userId).single(),
      supabaseAdmin.from('tasks').select('id, status, due_date, completed_at').eq('project_id', project_id).eq('user_id', userId),
    ]);

    if (projErr || !project) throw new Error(projErr?.message ?? 'Project not found');
    if (tasksErr) throw new Error(tasksErr.message);

    const now      = new Date();
    const deadline = project.due_date ? new Date(project.due_date) : null;
    const taskList = (tasks ?? []) as Array<{ id: string; status: string; due_date?: string; completed_at?: string }>;
    const total    = taskList.length;
    const completed = taskList.filter(t => ['done', 'completed'].includes(t.status ?? '')).length;
    const overdue   = taskList.filter(t =>
      !['done', 'completed'].includes(t.status ?? '') &&
      t.due_date &&
      new Date(t.due_date) < now
    ).length;

    // Velocity: tasks completed last 7 days
    const sevenAgo = new Date(now.getTime() - 7 * 86_400_000);
    const recent   = taskList.filter(t => t.completed_at && new Date(t.completed_at) > sevenAgo).length;
    const velocity = Math.round((recent / 7) * 100) / 100;

    const progress  = total > 0 ? Math.round((completed / total) * 100) : 0;
    const remaining = total - completed;
    const forecastDays = velocity > 0 ? Math.ceil(remaining / velocity) : null;
    const forecasted_end = forecastDays
      ? new Date(now.getTime() + forecastDays * 86_400_000).toISOString().split('T')[0]
      : null;

    const daysLeft = deadline
      ? Math.ceil((deadline.getTime() - now.getTime()) / 86_400_000)
      : null;

    let health_status: string;
    if (progress === 100) {
      health_status = 'on_track';
    } else if (!deadline) {
      health_status = 'not_started';
    } else if (daysLeft !== null && daysLeft < 0) {
      health_status = 'overdue';
    } else if (
      overdue > 0 ||
      (daysLeft !== null && daysLeft < 7 && progress < 80) ||
      (forecasted_end && deadline && new Date(forecasted_end) > deadline)
    ) {
      health_status = 'at_risk';
    } else {
      health_status = 'on_track';
    }

    const progressScore = progress * 0.4;
    const overdueScore  = Math.max(0, 30 - overdue * 10);
    const velocityScore = Math.min(20, velocity * 10);
    const timelineScore = health_status === 'on_track' ? 10 : health_status === 'at_risk' ? 5 : 0;
    const health_score  = Math.round(progressScore + overdueScore + velocityScore + timelineScore);

    await supabaseAdmin.from('projects').update({
      health_score, health_status, velocity, forecasted_end, progress,
      last_activity_at: now.toISOString(),
    }).eq('id', project_id);

    if (project.health_status && project.health_status !== health_status) {
      await supabaseAdmin.from('project_activity_feed').insert({
        project_id,
        user_id: project.user_id,
        event_type: 'health_changed',
        title: `تغيّرت صحة المشروع: ${project.health_status} → ${health_status}`,
        metadata: { from: project.health_status, to: health_status, health_score },
      });
    }

    return new Response(
      JSON.stringify({ success: true, health_score, health_status, velocity, forecasted_end }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
