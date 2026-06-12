-- Performance indexes for high-frequency query columns
-- Improves query speed for all user-scoped data fetches (RLS + filters)

CREATE INDEX IF NOT EXISTS idx_tasks_user_id        ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_habits_user_id       ON habits(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_user_id        ON goals(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_user_id     ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_habit_logs_habit_id      ON habit_logs(habit_id);
CREATE INDEX IF NOT EXISTS idx_habit_logs_completed_at  ON habit_logs(completed_at);
