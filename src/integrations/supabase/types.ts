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
          account_type: Database["public"]["Enums"]["account_type"] | null
          balance: number | null
          color: string | null
          created_at: string
          currency: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          last_reconciled_at: string | null
          name: string
          opening_balance: number | null
          reconciled_balance: number | null
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          account_type?: Database["public"]["Enums"]["account_type"] | null
          balance?: number | null
          color?: string | null
          created_at?: string
          currency?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          last_reconciled_at?: string | null
          name: string
          opening_balance?: number | null
          reconciled_balance?: number | null
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          account_type?: Database["public"]["Enums"]["account_type"] | null
          balance?: number | null
          color?: string | null
          created_at?: string
          currency?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          last_reconciled_at?: string | null
          name?: string
          opening_balance?: number | null
          reconciled_balance?: number | null
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      areas: {
        Row: {
          archived_at: string | null
          color: string | null
          created_at: string
          description: string | null
          icon: string | null
          id: string
          kpi_json: Json | null
          name: string
          owner_id: string | null
          review_cadence: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          archived_at?: string | null
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          kpi_json?: Json | null
          name: string
          owner_id?: string | null
          review_cadence?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          archived_at?: string | null
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          kpi_json?: Json | null
          name?: string
          owner_id?: string | null
          review_cadence?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      budget_category_lines: {
        Row: {
          actual_amount: number | null
          budget_id: string
          category_id: string
          created_at: string
          id: string
          planned_amount: number
          updated_at: string
        }
        Insert: {
          actual_amount?: number | null
          budget_id: string
          category_id: string
          created_at?: string
          id?: string
          planned_amount?: number
          updated_at?: string
        }
        Update: {
          actual_amount?: number | null
          budget_id?: string
          category_id?: string
          created_at?: string
          id?: string
          planned_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "budget_category_lines_budget_id_fkey"
            columns: ["budget_id"]
            isOneToOne: false
            referencedRelation: "budgets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_category_lines_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      budgets: {
        Row: {
          category: string
          closed_at: string | null
          created_at: string
          currency: string | null
          id: string
          limit_amount: number
          month: number
          notes: string | null
          spent_amount: number | null
          status: Database["public"]["Enums"]["budget_status"] | null
          updated_at: string
          user_id: string
          year: number
        }
        Insert: {
          category: string
          closed_at?: string | null
          created_at?: string
          currency?: string | null
          id?: string
          limit_amount: number
          month: number
          notes?: string | null
          spent_amount?: number | null
          status?: Database["public"]["Enums"]["budget_status"] | null
          updated_at?: string
          user_id: string
          year: number
        }
        Update: {
          category?: string
          closed_at?: string | null
          created_at?: string
          currency?: string | null
          id?: string
          limit_amount?: number
          month?: number
          notes?: string | null
          spent_amount?: number | null
          status?: Database["public"]["Enums"]["budget_status"] | null
          updated_at?: string
          user_id?: string
          year?: number
        }
        Relationships: []
      }
      categories: {
        Row: {
          color: string | null
          created_at: string
          icon: string | null
          id: string
          is_system: boolean | null
          name: string
          name_ar: string | null
          parent_id: string | null
          type: Database["public"]["Enums"]["category_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          is_system?: boolean | null
          name: string
          name_ar?: string | null
          parent_id?: string | null
          type?: Database["public"]["Enums"]["category_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          is_system?: boolean | null
          name?: string
          name_ar?: string | null
          parent_id?: string | null
          type?: Database["public"]["Enums"]["category_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      category_rules: {
        Row: {
          category_id: string
          conditions: Json
          created_at: string
          id: string
          is_active: boolean | null
          name: string
          priority: number | null
          user_id: string
        }
        Insert: {
          category_id: string
          conditions: Json
          created_at?: string
          id?: string
          is_active?: boolean | null
          name: string
          priority?: number | null
          user_id: string
        }
        Update: {
          category_id?: string
          conditions?: Json
          created_at?: string
          id?: string
          is_active?: boolean | null
          name?: string
          priority?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "category_rules_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      course_flashcards: {
        Row: {
          answer: string
          correct_count: number | null
          course_id: string
          created_at: string
          difficulty: number | null
          id: string
          lesson_id: string | null
          next_review_at: string | null
          question: string
          review_count: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          answer: string
          correct_count?: number | null
          course_id: string
          created_at?: string
          difficulty?: number | null
          id?: string
          lesson_id?: string | null
          next_review_at?: string | null
          question: string
          review_count?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          answer?: string
          correct_count?: number | null
          course_id?: string
          created_at?: string
          difficulty?: number | null
          id?: string
          lesson_id?: string | null
          next_review_at?: string | null
          question?: string
          review_count?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_flashcards_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_flashcards_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "course_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      course_lessons: {
        Row: {
          completed_at: string | null
          course_id: string
          created_at: string
          description: string | null
          duration_minutes: number | null
          id: string
          is_completed: boolean | null
          notes: string | null
          order_index: number | null
          resources: Json | null
          title: string
          updated_at: string
          user_id: string
          video_url: string | null
        }
        Insert: {
          completed_at?: string | null
          course_id: string
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_completed?: boolean | null
          notes?: string | null
          order_index?: number | null
          resources?: Json | null
          title: string
          updated_at?: string
          user_id: string
          video_url?: string | null
        }
        Update: {
          completed_at?: string | null
          course_id?: string
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_completed?: boolean | null
          notes?: string | null
          order_index?: number | null
          resources?: Json | null
          title?: string
          updated_at?: string
          user_id?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_lessons_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_notes: {
        Row: {
          content: string | null
          course_id: string
          created_at: string
          id: string
          is_important: boolean | null
          last_reviewed_at: string | null
          lesson_id: string | null
          note_type: string | null
          review_count: number | null
          tags: string[] | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: string | null
          course_id: string
          created_at?: string
          id?: string
          is_important?: boolean | null
          last_reviewed_at?: string | null
          lesson_id?: string | null
          note_type?: string | null
          review_count?: number | null
          tags?: string[] | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string | null
          course_id?: string
          created_at?: string
          id?: string
          is_important?: boolean | null
          last_reviewed_at?: string | null
          lesson_id?: string | null
          note_type?: string | null
          review_count?: number | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_notes_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_notes_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "course_lessons"
            referencedColumns: ["id"]
          },
        ]
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
      customer_cases: {
        Row: {
          created_at: string
          customer_id: string
          description: string | null
          due_date: string | null
          id: string
          priority: Database["public"]["Enums"]["case_priority"] | null
          resolved_at: string | null
          status: Database["public"]["Enums"]["case_status"] | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["case_priority"] | null
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["case_status"] | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["case_priority"] | null
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["case_status"] | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_cases_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_communications: {
        Row: {
          case_id: string | null
          contact_date: string | null
          content: string | null
          created_at: string
          customer_id: string
          id: string
          subject: string | null
          type: Database["public"]["Enums"]["communication_type"]
          user_id: string
        }
        Insert: {
          case_id?: string | null
          contact_date?: string | null
          content?: string | null
          created_at?: string
          customer_id: string
          id?: string
          subject?: string | null
          type?: Database["public"]["Enums"]["communication_type"]
          user_id: string
        }
        Update: {
          case_id?: string | null
          contact_date?: string | null
          content?: string | null
          created_at?: string
          customer_id?: string
          id?: string
          subject?: string | null
          type?: Database["public"]["Enums"]["communication_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_communications_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "customer_cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_communications_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          archived_at: string | null
          company: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          pipeline_stage: string | null
          project_id: string | null
          status: Database["public"]["Enums"]["customer_status"] | null
          tags: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          archived_at?: string | null
          company?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          pipeline_stage?: string | null
          project_id?: string | null
          status?: Database["public"]["Enums"]["customer_status"] | null
          tags?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          archived_at?: string | null
          company?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          pipeline_stage?: string | null
          project_id?: string | null
          status?: Database["public"]["Enums"]["customer_status"] | null
          tags?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customers_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      debt_schedules: {
        Row: {
          amount: number
          created_at: string
          debt_id: string
          due_date: string
          id: string
          interest_amount: number | null
          is_paid: boolean | null
          paid_at: string | null
          principal_amount: number | null
          transaction_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          debt_id: string
          due_date: string
          id?: string
          interest_amount?: number | null
          is_paid?: boolean | null
          paid_at?: string | null
          principal_amount?: number | null
          transaction_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          debt_id?: string
          due_date?: string
          id?: string
          interest_amount?: number | null
          is_paid?: boolean | null
          paid_at?: string | null
          principal_amount?: number | null
          transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "debt_schedules_debt_id_fkey"
            columns: ["debt_id"]
            isOneToOne: false
            referencedRelation: "debts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "debt_schedules_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      debts: {
        Row: {
          created_at: string
          currency: string | null
          end_date: string | null
          id: string
          interest_rate: number | null
          lender: string | null
          minimum_payment: number | null
          monthly_payment: number | null
          monthly_payment_date: number | null
          name: string
          notes: string | null
          payoff_strategy: Database["public"]["Enums"]["payoff_strategy"] | null
          remaining_amount: number
          start_date: string | null
          status: Database["public"]["Enums"]["debt_status"] | null
          total_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          currency?: string | null
          end_date?: string | null
          id?: string
          interest_rate?: number | null
          lender?: string | null
          minimum_payment?: number | null
          monthly_payment?: number | null
          monthly_payment_date?: number | null
          name: string
          notes?: string | null
          payoff_strategy?:
            | Database["public"]["Enums"]["payoff_strategy"]
            | null
          remaining_amount: number
          start_date?: string | null
          status?: Database["public"]["Enums"]["debt_status"] | null
          total_amount: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          currency?: string | null
          end_date?: string | null
          id?: string
          interest_rate?: number | null
          lender?: string | null
          minimum_payment?: number | null
          monthly_payment?: number | null
          monthly_payment_date?: number | null
          name?: string
          notes?: string | null
          payoff_strategy?:
            | Database["public"]["Enums"]["payoff_strategy"]
            | null
          remaining_amount?: number
          start_date?: string | null
          status?: Database["public"]["Enums"]["debt_status"] | null
          total_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      envelopes: {
        Row: {
          available_amount: number | null
          budget_id: string | null
          color: string | null
          created_at: string
          icon: string | null
          id: string
          name: string
          target_amount: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          available_amount?: number | null
          budget_id?: string | null
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          name: string
          target_amount?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          available_amount?: number | null
          budget_id?: string | null
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          name?: string
          target_amount?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "envelopes_budget_id_fkey"
            columns: ["budget_id"]
            isOneToOne: false
            referencedRelation: "budgets"
            referencedColumns: ["id"]
          },
        ]
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
      finance_activity_log: {
        Row: {
          action: string
          changes: Json | null
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          user_id: string
        }
        Insert: {
          action: string
          changes?: Json | null
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          user_id: string
        }
        Update: {
          action?: string
          changes?: Json | null
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      finance_audit_log: {
        Row: {
          action: string
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          new_values: Json | null
          old_values: Json | null
          source: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          source?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          source?: string | null
          user_id?: string
        }
        Relationships: []
      }
      finance_settings: {
        Row: {
          accounting_basis:
            | Database["public"]["Enums"]["accounting_basis"]
            | null
          auto_categorize: boolean | null
          created_at: string
          default_currency: string | null
          fiscal_month_start_day: number | null
          id: string
          risk_profile: Json | null
          show_decimal: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          accounting_basis?:
            | Database["public"]["Enums"]["accounting_basis"]
            | null
          auto_categorize?: boolean | null
          created_at?: string
          default_currency?: string | null
          fiscal_month_start_day?: number | null
          id?: string
          risk_profile?: Json | null
          show_decimal?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          accounting_basis?:
            | Database["public"]["Enums"]["accounting_basis"]
            | null
          auto_categorize?: boolean | null
          created_at?: string
          default_currency?: string | null
          fiscal_month_start_day?: number | null
          id?: string
          risk_profile?: Json | null
          show_decimal?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      fx_rates: {
        Row: {
          created_at: string
          date: string
          from_currency: string
          id: string
          rate: number
          source: string | null
          to_currency: string
        }
        Insert: {
          created_at?: string
          date: string
          from_currency: string
          id?: string
          rate: number
          source?: string | null
          to_currency: string
        }
        Update: {
          created_at?: string
          date?: string
          from_currency?: string
          id?: string
          rate?: number
          source?: string | null
          to_currency?: string
        }
        Relationships: []
      }
      goals: {
        Row: {
          archived_at: string | null
          area_id: string | null
          created_at: string
          current_value: number | null
          description: string | null
          end_date: string | null
          id: string
          is_active: boolean | null
          perspective: Database["public"]["Enums"]["goal_perspective"] | null
          project_id: string | null
          start_date: string | null
          target_value: number | null
          title: string
          unit: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          archived_at?: string | null
          area_id?: string | null
          created_at?: string
          current_value?: number | null
          description?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          perspective?: Database["public"]["Enums"]["goal_perspective"] | null
          project_id?: string | null
          start_date?: string | null
          target_value?: number | null
          title: string
          unit?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          archived_at?: string | null
          area_id?: string | null
          created_at?: string
          current_value?: number | null
          description?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          perspective?: Database["public"]["Enums"]["goal_perspective"] | null
          project_id?: string | null
          start_date?: string | null
          target_value?: number | null
          title?: string
          unit?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "goals_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goals_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
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
      investment_assets: {
        Row: {
          created_at: string
          currency: string | null
          exchange: string | null
          id: string
          metadata: Json | null
          name: string
          symbol: string
          type: Database["public"]["Enums"]["investment_type"]
          user_id: string
        }
        Insert: {
          created_at?: string
          currency?: string | null
          exchange?: string | null
          id?: string
          metadata?: Json | null
          name: string
          symbol: string
          type: Database["public"]["Enums"]["investment_type"]
          user_id: string
        }
        Update: {
          created_at?: string
          currency?: string | null
          exchange?: string | null
          id?: string
          metadata?: Json | null
          name?: string
          symbol?: string
          type?: Database["public"]["Enums"]["investment_type"]
          user_id?: string
        }
        Relationships: []
      }
      investment_holdings: {
        Row: {
          asset_id: string
          avg_cost: number
          cost_currency: string | null
          created_at: string
          current_price: number | null
          entry_target_price: number | null
          id: string
          investment_journal: string | null
          is_zakatable: boolean | null
          last_price_update: string | null
          portfolio_id: string
          quantity: number
          stop_loss_price: number | null
          take_profit_price: number | null
          target_allocation: number | null
          target_allocation_percent: number | null
          updated_at: string
        }
        Insert: {
          asset_id: string
          avg_cost?: number
          cost_currency?: string | null
          created_at?: string
          current_price?: number | null
          entry_target_price?: number | null
          id?: string
          investment_journal?: string | null
          is_zakatable?: boolean | null
          last_price_update?: string | null
          portfolio_id: string
          quantity?: number
          stop_loss_price?: number | null
          take_profit_price?: number | null
          target_allocation?: number | null
          target_allocation_percent?: number | null
          updated_at?: string
        }
        Update: {
          asset_id?: string
          avg_cost?: number
          cost_currency?: string | null
          created_at?: string
          current_price?: number | null
          entry_target_price?: number | null
          id?: string
          investment_journal?: string | null
          is_zakatable?: boolean | null
          last_price_update?: string | null
          portfolio_id?: string
          quantity?: number
          stop_loss_price?: number | null
          take_profit_price?: number | null
          target_allocation?: number | null
          target_allocation_percent?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "investment_holdings_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "investment_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "investment_holdings_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "investment_portfolios"
            referencedColumns: ["id"]
          },
        ]
      }
      investment_portfolios: {
        Row: {
          base_currency: string | null
          created_at: string
          description: string | null
          id: string
          is_default: boolean | null
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          base_currency?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          base_currency?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      investment_transactions: {
        Row: {
          asset_id: string | null
          created_at: string
          currency: string | null
          date: string
          fees: number | null
          id: string
          notes: string | null
          portfolio_id: string
          price: number | null
          quantity: number | null
          total_amount: number
          type: Database["public"]["Enums"]["investment_tx_type"]
          user_id: string
        }
        Insert: {
          asset_id?: string | null
          created_at?: string
          currency?: string | null
          date?: string
          fees?: number | null
          id?: string
          notes?: string | null
          portfolio_id: string
          price?: number | null
          quantity?: number | null
          total_amount: number
          type: Database["public"]["Enums"]["investment_tx_type"]
          user_id: string
        }
        Update: {
          asset_id?: string | null
          created_at?: string
          currency?: string | null
          date?: string
          fees?: number | null
          id?: string
          notes?: string | null
          portfolio_id?: string
          price?: number | null
          quantity?: number | null
          total_amount?: number
          type?: Database["public"]["Enums"]["investment_tx_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "investment_transactions_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "investment_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "investment_transactions_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "investment_portfolios"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_entries: {
        Row: {
          created_at: string
          date: string
          id: string
          is_posted: boolean | null
          memo: string | null
          posted_at: string | null
          source_id: string | null
          source_type: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          date?: string
          id?: string
          is_posted?: boolean | null
          memo?: string | null
          posted_at?: string | null
          source_id?: string | null
          source_type?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          is_posted?: boolean | null
          memo?: string | null
          posted_at?: string | null
          source_id?: string | null
          source_type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      journal_lines: {
        Row: {
          account_id: string
          created_at: string
          credit: number | null
          currency: string | null
          debit: number | null
          id: string
          journal_entry_id: string
          memo: string | null
        }
        Insert: {
          account_id: string
          created_at?: string
          credit?: number | null
          currency?: string | null
          debit?: number | null
          id?: string
          journal_entry_id: string
          memo?: string | null
        }
        Update: {
          account_id?: string
          created_at?: string
          credit?: number | null
          currency?: string | null
          debit?: number | null
          id?: string
          journal_entry_id?: string
          memo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "journal_lines_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_lines_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
        ]
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
          folder: string | null
          goal_id: string | null
          id: string
          is_archived: boolean | null
          project_id: string | null
          tags: string[] | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          folder?: string | null
          goal_id?: string | null
          id?: string
          is_archived?: boolean | null
          project_id?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string
          folder?: string | null
          goal_id?: string | null
          id?: string
          is_archived?: boolean | null
          project_id?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notes_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      payees: {
        Row: {
          created_at: string
          default_category_id: string | null
          id: string
          name: string
          notes: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          default_category_id?: string | null
          id?: string
          name: string
          notes?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          default_category_id?: string | null
          id?: string
          name?: string
          notes?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payees_default_category_id_fkey"
            columns: ["default_category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      planning_pipeline: {
        Row: {
          business_completed: boolean | null
          business_cost_structure: string | null
          business_revenue_model: string | null
          business_value_proposition: string | null
          created_at: string
          current_stage: number | null
          decision: string | null
          decision_date: string | null
          decision_notes: string | null
          description: string | null
          feasibility_completed: boolean | null
          feasibility_financial: string | null
          feasibility_resources: string | null
          feasibility_technical: string | null
          feasibility_timeline: string | null
          id: string
          project_id: string | null
          status: string | null
          strategy_completed: boolean | null
          strategy_vision: string | null
          strategy_where: string | null
          strategy_why: string | null
          title: string
          updated_at: string
          user_id: string
          validation_completed: boolean | null
          validation_problem: string | null
          validation_solution: string | null
          validation_target_market: string | null
        }
        Insert: {
          business_completed?: boolean | null
          business_cost_structure?: string | null
          business_revenue_model?: string | null
          business_value_proposition?: string | null
          created_at?: string
          current_stage?: number | null
          decision?: string | null
          decision_date?: string | null
          decision_notes?: string | null
          description?: string | null
          feasibility_completed?: boolean | null
          feasibility_financial?: string | null
          feasibility_resources?: string | null
          feasibility_technical?: string | null
          feasibility_timeline?: string | null
          id?: string
          project_id?: string | null
          status?: string | null
          strategy_completed?: boolean | null
          strategy_vision?: string | null
          strategy_where?: string | null
          strategy_why?: string | null
          title: string
          updated_at?: string
          user_id: string
          validation_completed?: boolean | null
          validation_problem?: string | null
          validation_solution?: string | null
          validation_target_market?: string | null
        }
        Update: {
          business_completed?: boolean | null
          business_cost_structure?: string | null
          business_revenue_model?: string | null
          business_value_proposition?: string | null
          created_at?: string
          current_stage?: number | null
          decision?: string | null
          decision_date?: string | null
          decision_notes?: string | null
          description?: string | null
          feasibility_completed?: boolean | null
          feasibility_financial?: string | null
          feasibility_resources?: string | null
          feasibility_technical?: string | null
          feasibility_timeline?: string | null
          id?: string
          project_id?: string | null
          status?: string | null
          strategy_completed?: boolean | null
          strategy_vision?: string | null
          strategy_where?: string | null
          strategy_why?: string | null
          title?: string
          updated_at?: string
          user_id?: string
          validation_completed?: boolean | null
          validation_problem?: string | null
          validation_solution?: string | null
          validation_target_market?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "planning_pipeline_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
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
      project_attachments: {
        Row: {
          created_at: string
          file_type: string | null
          id: string
          name: string
          project_id: string
          size_bytes: number | null
          url: string
          user_id: string
        }
        Insert: {
          created_at?: string
          file_type?: string | null
          id?: string
          name: string
          project_id: string
          size_bytes?: number | null
          url: string
          user_id: string
        }
        Update: {
          created_at?: string
          file_type?: string | null
          id?: string
          name?: string
          project_id?: string
          size_bytes?: number | null
          url?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_attachments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_budget_lines: {
        Row: {
          actual_amount: number | null
          category_id: string | null
          created_at: string
          id: string
          name: string
          planned_amount: number
          project_finance_id: string
        }
        Insert: {
          actual_amount?: number | null
          category_id?: string | null
          created_at?: string
          id?: string
          name: string
          planned_amount?: number
          project_finance_id: string
        }
        Update: {
          actual_amount?: number | null
          category_id?: string | null
          created_at?: string
          id?: string
          name?: string
          planned_amount?: number
          project_finance_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_budget_lines_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_budget_lines_project_finance_id_fkey"
            columns: ["project_finance_id"]
            isOneToOne: false
            referencedRelation: "project_finance"
            referencedColumns: ["id"]
          },
        ]
      }
      project_finance: {
        Row: {
          actual_spend_total: number | null
          created_at: string
          currency: string | null
          earned_value: number | null
          evm_enabled: boolean | null
          id: string
          notes: string | null
          planned_budget_total: number | null
          planned_value: number | null
          project_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          actual_spend_total?: number | null
          created_at?: string
          currency?: string | null
          earned_value?: number | null
          evm_enabled?: boolean | null
          id?: string
          notes?: string | null
          planned_budget_total?: number | null
          planned_value?: number | null
          project_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          actual_spend_total?: number | null
          created_at?: string
          currency?: string | null
          earned_value?: number | null
          evm_enabled?: boolean | null
          id?: string
          notes?: string | null
          planned_budget_total?: number | null
          planned_value?: number | null
          project_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_finance_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_key_results: {
        Row: {
          created_at: string
          current_value: number | null
          id: string
          okr_id: string
          target_value: number
          title: string
          unit: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_value?: number | null
          id?: string
          okr_id: string
          target_value: number
          title: string
          unit?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_value?: number | null
          id?: string
          okr_id?: string
          target_value?: number
          title?: string
          unit?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_key_results_okr_id_fkey"
            columns: ["okr_id"]
            isOneToOne: false
            referencedRelation: "project_okrs"
            referencedColumns: ["id"]
          },
        ]
      }
      project_okrs: {
        Row: {
          created_at: string
          description: string | null
          id: string
          objective: string
          progress: number | null
          project_id: string
          quarter: string | null
          status: string | null
          updated_at: string
          user_id: string
          year: number | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          objective: string
          progress?: number | null
          project_id: string
          quarter?: string | null
          status?: string | null
          updated_at?: string
          user_id: string
          year?: number | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          objective?: string
          progress?: number | null
          project_id?: string
          quarter?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "project_okrs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          actual_budget: number | null
          archived_at: string | null
          area_id: string | null
          color: string | null
          created_at: string
          description: string | null
          due_date: string | null
          estimated_budget: number | null
          expected_roi: string | null
          id: string
          investment_notes: string | null
          outputs: string | null
          owner: string | null
          para_category: Database["public"]["Enums"]["para_category"] | null
          phase: Database["public"]["Enums"]["project_phase"] | null
          progress: number | null
          risk_level: string | null
          risks: string | null
          scope: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["project_status"] | null
          title: string
          updated_at: string
          user_id: string
          vision: string | null
        }
        Insert: {
          actual_budget?: number | null
          archived_at?: string | null
          area_id?: string | null
          color?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          estimated_budget?: number | null
          expected_roi?: string | null
          id?: string
          investment_notes?: string | null
          outputs?: string | null
          owner?: string | null
          para_category?: Database["public"]["Enums"]["para_category"] | null
          phase?: Database["public"]["Enums"]["project_phase"] | null
          progress?: number | null
          risk_level?: string | null
          risks?: string | null
          scope?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"] | null
          title: string
          updated_at?: string
          user_id: string
          vision?: string | null
        }
        Update: {
          actual_budget?: number | null
          archived_at?: string | null
          area_id?: string | null
          color?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          estimated_budget?: number | null
          expected_roi?: string | null
          id?: string
          investment_notes?: string | null
          outputs?: string | null
          owner?: string | null
          para_category?: Database["public"]["Enums"]["para_category"] | null
          phase?: Database["public"]["Enums"]["project_phase"] | null
          progress?: number | null
          risk_level?: string | null
          risks?: string | null
          scope?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"] | null
          title?: string
          updated_at?: string
          user_id?: string
          vision?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["id"]
          },
        ]
      }
      resources: {
        Row: {
          archived_at: string | null
          area_id: string | null
          content: string | null
          content_ref: string | null
          created_at: string
          description: string | null
          id: string
          last_used_at: string | null
          metadata: Json | null
          project_id: string | null
          source_url: string | null
          status: string
          tags: string[] | null
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          archived_at?: string | null
          area_id?: string | null
          content?: string | null
          content_ref?: string | null
          created_at?: string
          description?: string | null
          id?: string
          last_used_at?: string | null
          metadata?: Json | null
          project_id?: string | null
          source_url?: string | null
          status?: string
          tags?: string[] | null
          title: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          archived_at?: string | null
          area_id?: string | null
          content?: string | null
          content_ref?: string | null
          created_at?: string
          description?: string | null
          id?: string
          last_used_at?: string | null
          metadata?: Json | null
          project_id?: string | null
          source_url?: string | null
          status?: string
          tags?: string[] | null
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "resources_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resources_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      sinking_funds: {
        Row: {
          created_at: string
          current_amount: number | null
          id: string
          is_active: boolean | null
          linked_envelope_id: string | null
          monthly_contribution: number | null
          name: string
          target_amount: number
          target_date: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_amount?: number | null
          id?: string
          is_active?: boolean | null
          linked_envelope_id?: string | null
          monthly_contribution?: number | null
          name: string
          target_amount: number
          target_date?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_amount?: number | null
          id?: string
          is_active?: boolean | null
          linked_envelope_id?: string | null
          monthly_contribution?: number | null
          name?: string
          target_amount?: number
          target_date?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sinking_funds_linked_envelope_id_fkey"
            columns: ["linked_envelope_id"]
            isOneToOne: false
            referencedRelation: "envelopes"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          amount: number
          billing_cycle: Database["public"]["Enums"]["billing_cycle"] | null
          category: string | null
          category_id: string | null
          created_at: string
          currency: string | null
          id: string
          is_active: boolean | null
          last_paid_at: string | null
          name: string
          next_billing_date: string
          notes: string | null
          payment_account_id: string | null
          provider: string | null
          status: Database["public"]["Enums"]["subscription_status"] | null
          updated_at: string
          usage_rating: number | null
          user_id: string
        }
        Insert: {
          amount: number
          billing_cycle?: Database["public"]["Enums"]["billing_cycle"] | null
          category?: string | null
          category_id?: string | null
          created_at?: string
          currency?: string | null
          id?: string
          is_active?: boolean | null
          last_paid_at?: string | null
          name: string
          next_billing_date: string
          notes?: string | null
          payment_account_id?: string | null
          provider?: string | null
          status?: Database["public"]["Enums"]["subscription_status"] | null
          updated_at?: string
          usage_rating?: number | null
          user_id: string
        }
        Update: {
          amount?: number
          billing_cycle?: Database["public"]["Enums"]["billing_cycle"] | null
          category?: string | null
          category_id?: string | null
          created_at?: string
          currency?: string | null
          id?: string
          is_active?: boolean | null
          last_paid_at?: string | null
          name?: string
          next_billing_date?: string
          notes?: string | null
          payment_account_id?: string | null
          provider?: string | null
          status?: Database["public"]["Enums"]["subscription_status"] | null
          updated_at?: string
          usage_rating?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_payment_account_id_fkey"
            columns: ["payment_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          archived_at: string | null
          area_id: string | null
          blocked_by: string | null
          category: string | null
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
          scheduled_at: string | null
          status: Database["public"]["Enums"]["task_status"] | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          archived_at?: string | null
          area_id?: string | null
          blocked_by?: string | null
          category?: string | null
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
          scheduled_at?: string | null
          status?: Database["public"]["Enums"]["task_status"] | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          archived_at?: string | null
          area_id?: string | null
          blocked_by?: string | null
          category?: string | null
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
          scheduled_at?: string | null
          status?: Database["public"]["Enums"]["task_status"] | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["id"]
          },
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
      transaction_splits: {
        Row: {
          amount: number
          category_id: string | null
          created_at: string
          id: string
          memo: string | null
          project_id: string | null
          transaction_id: string
        }
        Insert: {
          amount: number
          category_id?: string | null
          created_at?: string
          id?: string
          memo?: string | null
          project_id?: string | null
          transaction_id: string
        }
        Update: {
          amount?: number
          category_id?: string | null
          created_at?: string
          id?: string
          memo?: string | null
          project_id?: string | null
          transaction_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transaction_splits_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaction_splits_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaction_splits_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
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
          is_reconciled: boolean | null
          is_split: boolean | null
          journal_entry_id: string | null
          payee_id: string | null
          project_id: string | null
          receipt_url: string | null
          reconciled_at: string | null
          source: string | null
          tags: string[] | null
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
          is_reconciled?: boolean | null
          is_split?: boolean | null
          journal_entry_id?: string | null
          payee_id?: string | null
          project_id?: string | null
          receipt_url?: string | null
          reconciled_at?: string | null
          source?: string | null
          tags?: string[] | null
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
          is_reconciled?: boolean | null
          is_split?: boolean | null
          journal_entry_id?: string | null
          payee_id?: string | null
          project_id?: string | null
          receipt_url?: string | null
          reconciled_at?: string | null
          source?: string | null
          tags?: string[] | null
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
          {
            foreignKeyName: "transactions_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_payee_id_fkey"
            columns: ["payee_id"]
            isOneToOne: false
            referencedRelation: "payees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      wishlist_items: {
        Row: {
          category: string | null
          created_at: string
          currency: string | null
          description: string | null
          estimated_price: number | null
          id: string
          image_url: string | null
          linked_envelope_id: string | null
          linked_sinking_fund_id: string | null
          name: string
          notes: string | null
          priority: string | null
          saved_amount: number | null
          status: string | null
          target_date: string | null
          updated_at: string
          url: string | null
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          currency?: string | null
          description?: string | null
          estimated_price?: number | null
          id?: string
          image_url?: string | null
          linked_envelope_id?: string | null
          linked_sinking_fund_id?: string | null
          name: string
          notes?: string | null
          priority?: string | null
          saved_amount?: number | null
          status?: string | null
          target_date?: string | null
          updated_at?: string
          url?: string | null
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          currency?: string | null
          description?: string | null
          estimated_price?: number | null
          id?: string
          image_url?: string | null
          linked_envelope_id?: string | null
          linked_sinking_fund_id?: string | null
          name?: string
          notes?: string | null
          priority?: string | null
          saved_amount?: number | null
          status?: string | null
          target_date?: string | null
          updated_at?: string
          url?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlist_items_linked_envelope_id_fkey"
            columns: ["linked_envelope_id"]
            isOneToOne: false
            referencedRelation: "envelopes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wishlist_items_linked_sinking_fund_id_fkey"
            columns: ["linked_sinking_fund_id"]
            isOneToOne: false
            referencedRelation: "sinking_funds"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_service_role: { Args: never; Returns: boolean }
    }
    Enums: {
      account_type: "bank" | "wallet" | "cash" | "credit" | "investment"
      accounting_basis: "cash" | "accrual"
      billing_cycle: "monthly" | "quarterly" | "yearly"
      budget_status: "draft" | "active" | "closed"
      case_priority: "low" | "medium" | "high" | "urgent"
      case_status: "open" | "in_progress" | "pending" | "resolved" | "closed"
      category_type: "income" | "expense" | "transfer"
      communication_type: "call" | "email" | "meeting" | "note" | "message"
      course_status: "not_started" | "in_progress" | "completed" | "abandoned"
      customer_status: "lead" | "prospect" | "active" | "inactive" | "churned"
      debt_status: "active" | "closed" | "paused"
      goal_perspective:
        | "financial"
        | "customer"
        | "processes"
        | "learning"
        | "personal"
      investment_tx_type:
        | "buy"
        | "sell"
        | "fee"
        | "dividend"
        | "transfer"
        | "deposit"
        | "withdrawal"
      investment_type:
        | "stock"
        | "etf"
        | "fund"
        | "gold"
        | "crypto"
        | "bond"
        | "real_estate"
      media_status: "want" | "in_progress" | "completed" | "abandoned"
      media_type: "book" | "movie" | "series" | "podcast" | "article"
      para_category: "project" | "area" | "resource" | "archive"
      payoff_strategy: "snowball" | "avalanche"
      project_phase:
        | "initiation"
        | "planning"
        | "execution"
        | "monitoring"
        | "closing"
      project_status: "active" | "on_hold" | "completed" | "archived"
      recurrence_type: "none" | "daily" | "weekly" | "monthly" | "yearly"
      subscription_cycle: "weekly" | "monthly" | "quarterly" | "annual"
      subscription_status: "active" | "paused" | "canceled"
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
      account_type: ["bank", "wallet", "cash", "credit", "investment"],
      accounting_basis: ["cash", "accrual"],
      billing_cycle: ["monthly", "quarterly", "yearly"],
      budget_status: ["draft", "active", "closed"],
      case_priority: ["low", "medium", "high", "urgent"],
      case_status: ["open", "in_progress", "pending", "resolved", "closed"],
      category_type: ["income", "expense", "transfer"],
      communication_type: ["call", "email", "meeting", "note", "message"],
      course_status: ["not_started", "in_progress", "completed", "abandoned"],
      customer_status: ["lead", "prospect", "active", "inactive", "churned"],
      debt_status: ["active", "closed", "paused"],
      goal_perspective: [
        "financial",
        "customer",
        "processes",
        "learning",
        "personal",
      ],
      investment_tx_type: [
        "buy",
        "sell",
        "fee",
        "dividend",
        "transfer",
        "deposit",
        "withdrawal",
      ],
      investment_type: [
        "stock",
        "etf",
        "fund",
        "gold",
        "crypto",
        "bond",
        "real_estate",
      ],
      media_status: ["want", "in_progress", "completed", "abandoned"],
      media_type: ["book", "movie", "series", "podcast", "article"],
      para_category: ["project", "area", "resource", "archive"],
      payoff_strategy: ["snowball", "avalanche"],
      project_phase: [
        "initiation",
        "planning",
        "execution",
        "monitoring",
        "closing",
      ],
      project_status: ["active", "on_hold", "completed", "archived"],
      recurrence_type: ["none", "daily", "weekly", "monthly", "yearly"],
      subscription_cycle: ["weekly", "monthly", "quarterly", "annual"],
      subscription_status: ["active", "paused", "canceled"],
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
