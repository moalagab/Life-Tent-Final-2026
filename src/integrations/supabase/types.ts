export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      accounts: {
        Row: {
          balance: number | null
          color: string | null
          created_at: string
          currency: string | null
          icon: string | null
          id: string
          name: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number | null
          color?: string | null
          created_at?: string
          currency?: string | null
          icon?: string | null
          id?: string
          name: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number | null
          color?: string | null
          created_at?: string
          currency?: string | null
          icon?: string | null
          id?: string
          name?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      budgets: {
        Row: {
          category: string
          created_at: string
          currency: string | null
          id: string
          limit_amount: number
          month: number
          spent_amount: number | null
          updated_at: string
          user_id: string
          year: number
        }
        Insert: {
          category: string
          created_at?: string
          currency?: string | null
          id?: string
          limit_amount: number
          month: number
          spent_amount?: number | null
          updated_at?: string
          user_id: string
          year: number
        }
        Update: {
          category?: string
          created_at?: string
          currency?: string | null
          id?: string
          limit_amount?: number
          month?: number
          spent_amount?: number | null
          updated_at?: string
          user_id?: string
          year?: number
        }
        Relationships: []
      }
      courses: {
        Row: {
          completed_lessons: number | null
          created_at: string
          description: string | null
          end_date: string | null
          id: string
          platform: string | null
          progress: number | null
          start_date: string | null
          status: Database["public"]["Enums"]["course_status"] | null
          title: string
          total_lessons: number | null
          updated_at: string
          url: string | null
          user_id: string
        }
        Insert: {
          completed_lessons?: number | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          platform?: string | null
          progress?: number | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["course_status"] | null
          title: string
          total_lessons?: number | null
          updated_at?: string
          url?: string | null
          user_id: string
        }
        Update: {
          completed_lessons?: number | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          platform?: string | null
          progress?: number | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["course_status"] | null
          title?: string
          total_lessons?: number | null
          updated_at?: string
          url?: string | null
          user_id?: string
        }
        Relationships: []
      }
      debts: {
        Row: {
          created_at: string
          currency: string | null
          end_date: string | null
          id: string
          monthly_payment: number | null
          name: string
          remaining_amount: number
          start_date: string | null
          total_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          currency?: string | null
          end_date?: string | null
          id?: string
          monthly_payment?: number | null
          name: string
          remaining_amount: number
          start_date?: string | null
          total_amount: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          currency?: string | null
          end_date?: string | null
          id?: string
          monthly_payment?: number | null
          name?: string
          remaining_amount?: number
          start_date?: string | null
          total_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      events: {
        Row: {
          all_day: boolean | null
          color: string | null
          created_at: string
          description: string | null
          end_time: string | null
          id: string
          location: string | null
          recurrence: Database["public"]["Enums"]["recurrence_type"] | null
          start_time: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          all_day?: boolean | null
          color?: string | null
          created_at?: string
          description?: string | null
          end_time?: string | null
          id?: string
          location?: string | null
          recurrence?: Database["public"]["Enums"]["recurrence_type"] | null
          start_time: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          all_day?: boolean | null
          color?: string | null
          created_at?: string
          description?: string | null
          end_time?: string | null
          id?: string
          location?: string | null
          recurrence?: Database["public"]["Enums"]["recurrence_type"] | null
          start_time?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      goals: {
        Row: {
          created_at: string
          current_value: number | null
          description: string | null
          end_date: string | null
          id: string
          is_active: boolean | null
          perspective: Database["public"]["Enums"]["goal_perspective"] | null
          start_date: string | null
          target_value: number | null
          title: string
          unit: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_value?: number | null
          description?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          perspective?: Database["public"]["Enums"]["goal_perspective"] | null
          start_date?: string | null
          target_value?: number | null
          title: string
          unit?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_value?: number | null
          description?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          perspective?: Database["public"]["Enums"]["goal_perspective"] | null
          start_date?: string | null
          target_value?: number | null
          title?: string
          unit?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      habit_logs: {
        Row: {
          completed_at: string
          count: number | null
          created_at: string
          habit_id: string
          id: string
          notes: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string
          count?: number | null
          created_at?: string
          habit_id: string
          id?: string
          notes?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string
          count?: number | null
          created_at?: string
          habit_id?: string
          id?: string
          notes?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "habit_logs_habit_id_fkey"
            columns: ["habit_id"]
            isOneToOne: false
            referencedRelation: "habits"
            referencedColumns: ["id"]
          },
        ]
      }
      habits: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          frequency: Database["public"]["Enums"]["recurrence_type"] | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          target_count: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          frequency?: Database["public"]["Enums"]["recurrence_type"] | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          target_count?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          frequency?: Database["public"]["Enums"]["recurrence_type"] | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          target_count?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      key_results: {
        Row: {
          created_at: string
          current_value: number | null
          goal_id: string
          id: string
          target_value: number
          title: string
          unit: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_value?: number | null
          goal_id: string
          id?: string
          target_value: number
          title: string
          unit?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_value?: number | null
          goal_id?: string
          id?: string
          target_value?: number
          title?: string
          unit?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "key_results_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
        ]
      }
      media_items: {
        Row: {
          author: string | null
          cover_url: string | null
          created_at: string
          end_date: string | null
          id: string
          notes: string | null
          progress: number | null
          rating: number | null
          start_date: string | null
          status: Database["public"]["Enums"]["media_status"] | null
          title: string
          total_pages: number | null
          type: Database["public"]["Enums"]["media_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          author?: string | null
          cover_url?: string | null
          created_at?: string
          end_date?: string | null
          id?: string
          notes?: string | null
          progress?: number | null
          rating?: number | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["media_status"] | null
          title: string
          total_pages?: number | null
          type: Database["public"]["Enums"]["media_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          author?: string | null
          cover_url?: string | null
          created_at?: string
          end_date?: string | null
          id?: string
          notes?: string | null
          progress?: number | null
          rating?: number | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["media_status"] | null
          title?: string
          total_pages?: number | null
          type?: Database["public"]["Enums"]["media_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      mood_logs: {
        Row: {
          created_at: string
          date: string
          energy_level: number | null
          id: string
          mood_score: number | null
          notes: string | null
          stress_level: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          date?: string
          energy_level?: number | null
          id?: string
          mood_score?: number | null
          notes?: string | null
          stress_level?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          energy_level?: number | null
          id?: string
          mood_score?: number | null
          notes?: string | null
          stress_level?: number | null
          user_id?: string
        }
        Relationships: []
      }
      notes: {
        Row: {
          content: string | null
          created_at: string
          id: string
          is_archived: boolean | null
          tags: string[] | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: string
          is_archived?: boolean | null
          tags?: string[] | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: string
          is_archived?: boolean | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      pomodoro_sessions: {
        Row: {
          completed_at: string
          created_at: string
          duration_minutes: number
          id: string
          notes: string | null
          session_type: string
          task_id: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string
          created_at?: string
          duration_minutes: number
          id?: string
          notes?: string | null
          session_type: string
          task_id?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string
          created_at?: string
          duration_minutes?: number
          id?: string
          notes?: string | null
          session_type?: string
          task_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pomodoro_sessions_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          preferred_language: string | null
          timezone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          preferred_language?: string | null
          timezone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          preferred_language?: string | null
          timezone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          para_category: Database["public"]["Enums"]["para_category"] | null
          phase: Database["public"]["Enums"]["project_phase"] | null
          progress: number | null
          status: Database["public"]["Enums"]["project_status"] | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          para_category?: Database["public"]["Enums"]["para_category"] | null
          phase?: Database["public"]["Enums"]["project_phase"] | null
          progress?: number | null
          status?: Database["public"]["Enums"]["project_status"] | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          para_category?: Database["public"]["Enums"]["para_category"] | null
          phase?: Database["public"]["Enums"]["project_phase"] | null
          progress?: number | null
          status?: Database["public"]["Enums"]["project_status"] | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          amount: number
          billing_cycle: Database["public"]["Enums"]["billing_cycle"] | null
          category: string | null
          created_at: string
          currency: string | null
          id: string
          is_active: boolean | null
          name: string
          next_billing_date: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          billing_cycle?: Database["public"]["Enums"]["billing_cycle"] | null
          category?: string | null
          created_at?: string
          currency?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          next_billing_date: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          billing_cycle?: Database["public"]["Enums"]["billing_cycle"] | null
          category?: string | null
          created_at?: string
          currency?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          next_billing_date?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          blocked_by: string | null
          completed_at: string | null
          created_at: string
          description: string | null
          due_date: string | null
          due_time: string | null
          id: string
          is_focus: boolean | null
          position: number | null
          priority: Database["public"]["Enums"]["task_priority"] | null
          project_id: string | null
          recurrence: Database["public"]["Enums"]["recurrence_type"] | null
          status: Database["public"]["Enums"]["task_status"] | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          blocked_by?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          due_time?: string | null
          id?: string
          is_focus?: boolean | null
          position?: number | null
          priority?: Database["public"]["Enums"]["task_priority"] | null
          project_id?: string | null
          recurrence?: Database["public"]["Enums"]["recurrence_type"] | null
          status?: Database["public"]["Enums"]["task_status"] | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          blocked_by?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          due_time?: string | null
          id?: string
          is_focus?: boolean | null
          position?: number | null
          priority?: Database["public"]["Enums"]["task_priority"] | null
          project_id?: string | null
          recurrence?: Database["public"]["Enums"]["recurrence_type"] | null
          status?: Database["public"]["Enums"]["task_status"] | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_blocked_by_fkey"
            columns: ["blocked_by"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          account_id: string
          amount: number
          category: string | null
          created_at: string
          currency: string | null
          date: string
          description: string | null
          id: string
          type: Database["public"]["Enums"]["transaction_type"]
          user_id: string
        }
        Insert: {
          account_id: string
          amount: number
          category?: string | null
          created_at?: string
          currency?: string | null
          date?: string
          description?: string | null
          id?: string
          type: Database["public"]["Enums"]["transaction_type"]
          user_id: string
        }
        Update: {
          account_id?: string
          amount?: number
          category?: string | null
          created_at?: string
          currency?: string | null
          date?: string
          description?: string | null
          id?: string
          type?: Database["public"]["Enums"]["transaction_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      billing_cycle: "monthly" | "quarterly" | "yearly"
      course_status: "not_started" | "in_progress" | "completed" | "abandoned"
      goal_perspective: "financial" | "customer" | "processes" | "learning"
      media_status: "want" | "in_progress" | "completed" | "abandoned"
      media_type: "book" | "movie" | "series" | "podcast" | "article"
      para_category: "project" | "area" | "resource" | "archive"
      project_phase:
        | "initiation"
        | "planning"
        | "execution"
        | "monitoring"
        | "closing"
      project_status: "active" | "on_hold" | "completed" | "archived"
      recurrence_type: "none" | "daily" | "weekly" | "monthly" | "yearly"
      task_priority: "low" | "medium" | "high" | "urgent"
      task_status:
        | "backlog"
        | "todo"
        | "in_progress"
        | "review"
        | "done"
        | "archived"
      transaction_type: "income" | "expense" | "transfer" | "investment"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      billing_cycle: ["monthly", "quarterly", "yearly"],
      course_status: ["not_started", "in_progress", "completed", "abandoned"],
      goal_perspective: ["financial", "customer", "processes", "learning"],
      media_status: ["want", "in_progress", "completed", "abandoned"],
      media_type: ["book", "movie", "series", "podcast", "article"],
      para_category: ["project", "area", "resource", "archive"],
      project_phase: [
        "initiation",
        "planning",
        "execution",
        "monitoring",
        "closing",
      ],
      project_status: ["active", "on_hold", "completed", "archived"],
      recurrence_type: ["none", "daily", "weekly", "monthly", "yearly"],
      task_priority: ["low", "medium", "high", "urgent"],
      task_status: [
        "backlog",
        "todo",
        "in_progress",
        "review",
        "done",
        "archived",
      ],
      transaction_type: ["income", "expense", "transfer", "investment"],
    },
  },
} as const
