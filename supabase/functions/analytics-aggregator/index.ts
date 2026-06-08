import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface HabitStreak {
  habit_id: string;
  habit_name: string;
  current_streak: number;
  longest_streak: number;
  completion_rate_30d: number;
}

function computeStreak(logs: { logged_at: string; completed: boolean }[]): {
  current: number;
  longest: number;
} {
  const completedDates = new Set(
    logs
      .filter((l) => l.completed)
      .map((l) => l.logged_at.split("T")[0])
  );

  const sortedDates = Array.from(completedDates).sort((a, b) =>
    b.localeCompare(a)
  );

  let current = 0;
  let longest = 0;
  let streak = 0;
  const today = new Date().toISOString().split("T")[0];
  let checkDate = today;

  // Current streak (backwards from today)
  for (let i = 0; i < 365; i++) {
    if (completedDates.has(checkDate)) {
      current++;
      const d = new Date(checkDate);
      d.setDate(d.getDate() - 1);
      checkDate = d.toISOString().split("T")[0];
    } else {
      break;
    }
  }

  // Longest streak
  for (let i = 0; i < sortedDates.length; i++) {
    if (i === 0) {
      streak = 1;
    } else {
      const prev = new Date(sortedDates[i - 1]);
      const curr = new Date(sortedDates[i]);
      const diff = Math.round(
        (prev.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24)
      );
      streak = diff === 1 ? streak + 1 : 1;
    }
    longest = Math.max(longest, streak);
  }

  return { current, longest };
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [habitsResult, habitLogsResult, tasksResult, transactionsResult] =
      await Promise.all([
        supabase.from("habits").select("id, name, frequency").eq("is_active", true),
        supabase
          .from("habit_logs")
          .select("habit_id, logged_at, completed")
          .gte("logged_at", thirtyDaysAgo.toISOString()),
        supabase.from("tasks").select("id, status, due_date"),
        supabase
          .from("transactions")
          .select("amount, type, date")
          .gte("date", thirtyDaysAgo.toISOString().split("T")[0]),
      ]);

    // --- Habit analytics ---
    const habitStreaks: HabitStreak[] = (habitsResult.data ?? []).map((habit) => {
      const logs = (habitLogsResult.data ?? []).filter(
        (l) => l.habit_id === habit.id
      );
      const { current, longest } = computeStreak(logs);
      const completedCount = logs.filter((l) => l.completed).length;
      const completionRate = logs.length > 0 ? completedCount / 30 : 0;

      return {
        habit_id: habit.id,
        habit_name: habit.name,
        current_streak: current,
        longest_streak: longest,
        completion_rate_30d: Math.round(completionRate * 100),
      };
    });

    // --- Task analytics ---
    const tasks = tasksResult.data ?? [];
    const today = new Date().toISOString().split("T")[0];
    const taskStats = {
      total: tasks.length,
      completed: tasks.filter((t) => t.status === "done").length,
      in_progress: tasks.filter((t) => t.status === "in_progress").length,
      overdue: tasks.filter(
        (t) => t.due_date && t.due_date < today && t.status !== "done"
      ).length,
      completion_rate: tasks.length
        ? Math.round(
            (tasks.filter((t) => t.status === "done").length / tasks.length) * 100
          )
        : 0,
    };

    // --- Finance analytics (last 30 days) ---
    const txns = transactionsResult.data ?? [];
    const income = txns
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + (t.amount ?? 0), 0);
    const expenses = txns
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + Math.abs(t.amount ?? 0), 0);

    const financeStats = {
      income_30d: Math.round(income * 100) / 100,
      expenses_30d: Math.round(expenses * 100) / 100,
      net_30d: Math.round((income - expenses) * 100) / 100,
      transaction_count_30d: txns.length,
    };

    return new Response(
      JSON.stringify({
        generated_at: new Date().toISOString(),
        period_days: 30,
        habits: {
          active_count: habitsResult.data?.length ?? 0,
          streaks: habitStreaks,
          top_streak: Math.max(0, ...habitStreaks.map((h) => h.current_streak)),
        },
        tasks: taskStats,
        finance: financeStats,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: unknown) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Aggregation failed",
      }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
