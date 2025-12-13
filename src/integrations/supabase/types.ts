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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          badge_type: string
          created_at: string | null
          criteria_type: string
          criteria_value: number
          description: string
          icon: string
          id: string
          name: string
          points: number | null
        }
        Insert: {
          badge_type: string
          created_at?: string | null
          criteria_type: string
          criteria_value: number
          description: string
          icon: string
          id?: string
          name: string
          points?: number | null
        }
        Update: {
          badge_type?: string
          created_at?: string | null
          criteria_type?: string
          criteria_value?: number
          description?: string
          icon?: string
          id?: string
          name?: string
          points?: number | null
        }
        Relationships: []
      }
      barcode_history: {
        Row: {
          barcode: string
          brand: string | null
          calories: number | null
          carbs: number | null
          created_at: string | null
          fat: number | null
          food_name: string
          id: string
          last_scanned_at: string | null
          protein: number | null
          scan_count: number | null
          serving_size: string | null
          user_id: string
        }
        Insert: {
          barcode: string
          brand?: string | null
          calories?: number | null
          carbs?: number | null
          created_at?: string | null
          fat?: number | null
          food_name: string
          id?: string
          last_scanned_at?: string | null
          protein?: number | null
          scan_count?: number | null
          serving_size?: string | null
          user_id: string
        }
        Update: {
          barcode?: string
          brand?: string | null
          calories?: number | null
          carbs?: number | null
          created_at?: string | null
          fat?: number | null
          food_name?: string
          id?: string
          last_scanned_at?: string | null
          protein?: number | null
          scan_count?: number | null
          serving_size?: string | null
          user_id?: string
        }
        Relationships: []
      }
      cycle_logs: {
        Row: {
          created_at: string | null
          cycle_day: number | null
          date: string
          flow_intensity: string | null
          id: string
          mood: string | null
          notes: string | null
          period_end: boolean | null
          period_start: boolean | null
          symptoms: Json | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          cycle_day?: number | null
          date: string
          flow_intensity?: string | null
          id?: string
          mood?: string | null
          notes?: string | null
          period_end?: boolean | null
          period_start?: boolean | null
          symptoms?: Json | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          cycle_day?: number | null
          date?: string
          flow_intensity?: string | null
          id?: string
          mood?: string | null
          notes?: string | null
          period_end?: boolean | null
          period_start?: boolean | null
          symptoms?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      daily_summaries: {
        Row: {
          created_at: string | null
          date: string
          id: string
          meal_count: number | null
          total_calories: number | null
          total_carbs: number | null
          total_fat: number | null
          total_protein: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          date: string
          id?: string
          meal_count?: number | null
          total_calories?: number | null
          total_carbs?: number | null
          total_fat?: number | null
          total_protein?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          date?: string
          id?: string
          meal_count?: number | null
          total_calories?: number | null
          total_carbs?: number | null
          total_fat?: number | null
          total_protein?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      exercise_logs: {
        Row: {
          calories_burned: number | null
          created_at: string | null
          duration_minutes: number | null
          exercise_name: string
          id: string
          logged_at: string | null
          notes: string | null
          user_id: string
        }
        Insert: {
          calories_burned?: number | null
          created_at?: string | null
          duration_minutes?: number | null
          exercise_name: string
          id?: string
          logged_at?: string | null
          notes?: string | null
          user_id: string
        }
        Update: {
          calories_burned?: number | null
          created_at?: string | null
          duration_minutes?: number | null
          exercise_name?: string
          id?: string
          logged_at?: string | null
          notes?: string | null
          user_id?: string
        }
        Relationships: []
      }
      expert_credentials: {
        Row: {
          created_at: string | null
          credential_name: string
          credential_type: string
          id: string
          institution: string | null
          is_verified: boolean | null
          license_number: string | null
          updated_at: string | null
          user_id: string
          year_obtained: number | null
        }
        Insert: {
          created_at?: string | null
          credential_name: string
          credential_type: string
          id?: string
          institution?: string | null
          is_verified?: boolean | null
          license_number?: string | null
          updated_at?: string | null
          user_id: string
          year_obtained?: number | null
        }
        Update: {
          created_at?: string | null
          credential_name?: string
          credential_type?: string
          id?: string
          institution?: string | null
          is_verified?: boolean | null
          license_number?: string | null
          updated_at?: string | null
          user_id?: string
          year_obtained?: number | null
        }
        Relationships: []
      }
      food_database: {
        Row: {
          barcode: string | null
          brand: string | null
          calories: number
          carbs_g: number | null
          created_at: string | null
          data_source: string | null
          fat_g: number | null
          fiber_g: number | null
          food_name: string
          id: string
          image_url: string | null
          protein_g: number | null
          serving_size: string | null
          serving_unit: string | null
          sodium_mg: number | null
          sugar_g: number | null
          updated_at: string | null
          verified: boolean | null
        }
        Insert: {
          barcode?: string | null
          brand?: string | null
          calories: number
          carbs_g?: number | null
          created_at?: string | null
          data_source?: string | null
          fat_g?: number | null
          fiber_g?: number | null
          food_name: string
          id?: string
          image_url?: string | null
          protein_g?: number | null
          serving_size?: string | null
          serving_unit?: string | null
          sodium_mg?: number | null
          sugar_g?: number | null
          updated_at?: string | null
          verified?: boolean | null
        }
        Update: {
          barcode?: string | null
          brand?: string | null
          calories?: number
          carbs_g?: number | null
          created_at?: string | null
          data_source?: string | null
          fat_g?: number | null
          fiber_g?: number | null
          food_name?: string
          id?: string
          image_url?: string | null
          protein_g?: number | null
          serving_size?: string | null
          serving_unit?: string | null
          sodium_mg?: number | null
          sugar_g?: number | null
          updated_at?: string | null
          verified?: boolean | null
        }
        Relationships: []
      }
      food_items: {
        Row: {
          calories: number | null
          carbs: number | null
          confidence_score: number | null
          created_at: string | null
          fat: number | null
          food_log_id: string
          food_name: string
          id: string
          protein: number | null
          quantity: string | null
          serving_size: string | null
        }
        Insert: {
          calories?: number | null
          carbs?: number | null
          confidence_score?: number | null
          created_at?: string | null
          fat?: number | null
          food_log_id: string
          food_name: string
          id?: string
          protein?: number | null
          quantity?: string | null
          serving_size?: string | null
        }
        Update: {
          calories?: number | null
          carbs?: number | null
          confidence_score?: number | null
          created_at?: string | null
          fat?: number | null
          food_log_id?: string
          food_name?: string
          id?: string
          protein?: number | null
          quantity?: string | null
          serving_size?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "food_items_food_log_id_fkey"
            columns: ["food_log_id"]
            isOneToOne: false
            referencedRelation: "food_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      food_logs: {
        Row: {
          ai_analysis: Json | null
          ai_confidence_score: number | null
          barcode: string | null
          created_at: string | null
          id: string
          image_url: string | null
          meal_type: string
          notes: string | null
          total_calories: number | null
          total_carbs: number | null
          total_fat: number | null
          total_protein: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          ai_analysis?: Json | null
          ai_confidence_score?: number | null
          barcode?: string | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          meal_type: string
          notes?: string | null
          total_calories?: number | null
          total_carbs?: number | null
          total_fat?: number | null
          total_protein?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          ai_analysis?: Json | null
          ai_confidence_score?: number | null
          barcode?: string | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          meal_type?: string
          notes?: string | null
          total_calories?: number | null
          total_carbs?: number | null
          total_fat?: number | null
          total_protein?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      meal_plans: {
        Row: {
          created_at: string | null
          custom_food_name: string | null
          date: string
          food_database_id: string | null
          id: string
          is_logged: boolean | null
          meal_type: string
          notes: string | null
          planned_calories: number | null
          planned_carbs: number | null
          planned_fat: number | null
          planned_protein: number | null
          recipe_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          custom_food_name?: string | null
          date: string
          food_database_id?: string | null
          id?: string
          is_logged?: boolean | null
          meal_type: string
          notes?: string | null
          planned_calories?: number | null
          planned_carbs?: number | null
          planned_fat?: number | null
          planned_protein?: number | null
          recipe_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          custom_food_name?: string | null
          date?: string
          food_database_id?: string | null
          id?: string
          is_logged?: boolean | null
          meal_type?: string
          notes?: string | null
          planned_calories?: number | null
          planned_carbs?: number | null
          planned_fat?: number | null
          planned_protein?: number | null
          recipe_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meal_plans_food_database_id_fkey"
            columns: ["food_database_id"]
            isOneToOne: false
            referencedRelation: "food_database"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meal_plans_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      meal_templates: {
        Row: {
          created_at: string | null
          foods: Json | null
          id: string
          meal_type: string
          name: string
          total_calories: number | null
          total_carbs: number | null
          total_fat: number | null
          total_protein: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          foods?: Json | null
          id?: string
          meal_type?: string
          name: string
          total_calories?: number | null
          total_carbs?: number | null
          total_fat?: number | null
          total_protein?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          foods?: Json | null
          id?: string
          meal_type?: string
          name?: string
          total_calories?: number | null
          total_carbs?: number | null
          total_fat?: number | null
          total_protein?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      notification_settings: {
        Row: {
          breakfast_time: string | null
          created_at: string | null
          dinner_time: string | null
          exercise_reminders: boolean | null
          id: string
          lunch_time: string | null
          meal_reminders: boolean | null
          snack_time: string | null
          updated_at: string | null
          user_id: string
          water_reminders: boolean | null
          weight_log_reminders: boolean | null
        }
        Insert: {
          breakfast_time?: string | null
          created_at?: string | null
          dinner_time?: string | null
          exercise_reminders?: boolean | null
          id?: string
          lunch_time?: string | null
          meal_reminders?: boolean | null
          snack_time?: string | null
          updated_at?: string | null
          user_id: string
          water_reminders?: boolean | null
          weight_log_reminders?: boolean | null
        }
        Update: {
          breakfast_time?: string | null
          created_at?: string | null
          dinner_time?: string | null
          exercise_reminders?: boolean | null
          id?: string
          lunch_time?: string | null
          meal_reminders?: boolean | null
          snack_time?: string | null
          updated_at?: string | null
          user_id?: string
          water_reminders?: boolean | null
          weight_log_reminders?: boolean | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          message: string
          read: boolean | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          message: string
          read?: boolean | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string
          read?: boolean | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          accessibility_high_contrast: boolean | null
          accessibility_large_text: boolean | null
          accessibility_reduce_motion: boolean | null
          activity_level: string | null
          average_cycle_length: number | null
          created_at: string | null
          current_weight_kg: number | null
          daily_calorie_goal: number | null
          daily_carbs_goal: number | null
          daily_fat_goal: number | null
          daily_protein_goal: number | null
          daily_water_goal_ml: number | null
          dietary_preference: string | null
          email: string | null
          enable_period_tracking: boolean | null
          full_name: string | null
          goal_type: string | null
          height_cm: number | null
          id: string
          last_period_start: string | null
          onboarding_completed: boolean | null
          onboarding_step: number | null
          revenue_cat_user_id: string | null
          subscription_expires_at: string | null
          subscription_status: string | null
          subscription_tier:
            | Database["public"]["Enums"]["subscription_tier"]
            | null
          trial_ends_at: string | null
          trial_started_at: string | null
          updated_at: string | null
          weight_goal_kg: number | null
        }
        Insert: {
          accessibility_high_contrast?: boolean | null
          accessibility_large_text?: boolean | null
          accessibility_reduce_motion?: boolean | null
          activity_level?: string | null
          average_cycle_length?: number | null
          created_at?: string | null
          current_weight_kg?: number | null
          daily_calorie_goal?: number | null
          daily_carbs_goal?: number | null
          daily_fat_goal?: number | null
          daily_protein_goal?: number | null
          daily_water_goal_ml?: number | null
          dietary_preference?: string | null
          email?: string | null
          enable_period_tracking?: boolean | null
          full_name?: string | null
          goal_type?: string | null
          height_cm?: number | null
          id: string
          last_period_start?: string | null
          onboarding_completed?: boolean | null
          onboarding_step?: number | null
          revenue_cat_user_id?: string | null
          subscription_expires_at?: string | null
          subscription_status?: string | null
          subscription_tier?:
            | Database["public"]["Enums"]["subscription_tier"]
            | null
          trial_ends_at?: string | null
          trial_started_at?: string | null
          updated_at?: string | null
          weight_goal_kg?: number | null
        }
        Update: {
          accessibility_high_contrast?: boolean | null
          accessibility_large_text?: boolean | null
          accessibility_reduce_motion?: boolean | null
          activity_level?: string | null
          average_cycle_length?: number | null
          created_at?: string | null
          current_weight_kg?: number | null
          daily_calorie_goal?: number | null
          daily_carbs_goal?: number | null
          daily_fat_goal?: number | null
          daily_protein_goal?: number | null
          daily_water_goal_ml?: number | null
          dietary_preference?: string | null
          email?: string | null
          enable_period_tracking?: boolean | null
          full_name?: string | null
          goal_type?: string | null
          height_cm?: number | null
          id?: string
          last_period_start?: string | null
          onboarding_completed?: boolean | null
          onboarding_step?: number | null
          revenue_cat_user_id?: string | null
          subscription_expires_at?: string | null
          subscription_status?: string | null
          subscription_tier?:
            | Database["public"]["Enums"]["subscription_tier"]
            | null
          trial_ends_at?: string | null
          trial_started_at?: string | null
          updated_at?: string | null
          weight_goal_kg?: number | null
        }
        Relationships: []
      }
      recipe_ingredients: {
        Row: {
          calories: number | null
          carbs: number | null
          created_at: string | null
          fat: number | null
          food_name: string
          id: string
          protein: number | null
          quantity: string | null
          recipe_id: string
          serving_size: string | null
        }
        Insert: {
          calories?: number | null
          carbs?: number | null
          created_at?: string | null
          fat?: number | null
          food_name: string
          id?: string
          protein?: number | null
          quantity?: string | null
          recipe_id: string
          serving_size?: string | null
        }
        Update: {
          calories?: number | null
          carbs?: number | null
          created_at?: string | null
          fat?: number | null
          food_name?: string
          id?: string
          protein?: number | null
          quantity?: string | null
          recipe_id?: string
          serving_size?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recipe_ingredients_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      recipes: {
        Row: {
          cook_time_minutes: number | null
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          instructions: string | null
          is_public: boolean | null
          name: string
          prep_time_minutes: number | null
          servings: number | null
          total_calories: number | null
          total_carbs: number | null
          total_fat: number | null
          total_protein: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          cook_time_minutes?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          instructions?: string | null
          is_public?: boolean | null
          name: string
          prep_time_minutes?: number | null
          servings?: number | null
          total_calories?: number | null
          total_carbs?: number | null
          total_fat?: number | null
          total_protein?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          cook_time_minutes?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          instructions?: string | null
          is_public?: boolean | null
          name?: string
          prep_time_minutes?: number | null
          servings?: number | null
          total_calories?: number | null
          total_carbs?: number | null
          total_fat?: number | null
          total_protein?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          achievement_id: string
          earned_at: string | null
          id: string
          progress: number | null
          user_id: string
        }
        Insert: {
          achievement_id: string
          earned_at?: string | null
          id?: string
          progress?: number | null
          user_id: string
        }
        Update: {
          achievement_id?: string
          earned_at?: string | null
          id?: string
          progress?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
        ]
      }
      user_devices: {
        Row: {
          created_at: string
          device_uuid: string | null
          id: string
          onesignal_player_id: string | null
          platform: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          device_uuid?: string | null
          id?: string
          onesignal_player_id?: string | null
          platform?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          device_uuid?: string | null
          id?: string
          onesignal_player_id?: string | null
          platform?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_stats: {
        Row: {
          created_at: string | null
          current_streak: number | null
          id: string
          last_log_date: string | null
          longest_streak: number | null
          perfect_weeks: number | null
          total_exercise_logs: number | null
          total_food_logs: number | null
          total_points: number | null
          total_water_logs: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          current_streak?: number | null
          id?: string
          last_log_date?: string | null
          longest_streak?: number | null
          perfect_weeks?: number | null
          total_exercise_logs?: number | null
          total_food_logs?: number | null
          total_points?: number | null
          total_water_logs?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          current_streak?: number | null
          id?: string
          last_log_date?: string | null
          longest_streak?: number | null
          perfect_weeks?: number | null
          total_exercise_logs?: number | null
          total_food_logs?: number | null
          total_points?: number | null
          total_water_logs?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      water_logs: {
        Row: {
          amount_ml: number
          created_at: string | null
          id: string
          logged_at: string | null
          user_id: string
        }
        Insert: {
          amount_ml: number
          created_at?: string | null
          id?: string
          logged_at?: string | null
          user_id: string
        }
        Update: {
          amount_ml?: number
          created_at?: string | null
          id?: string
          logged_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      weight_logs: {
        Row: {
          created_at: string | null
          id: string
          logged_at: string | null
          user_id: string
          weight_kg: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          logged_at?: string | null
          user_id: string
          weight_kg: number
        }
        Update: {
          created_at?: string | null
          id?: string
          logged_at?: string | null
          user_id?: string
          weight_kg?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      update_user_stats_and_check_achievements: {
        Args: { p_log_type: string; p_user_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "user" | "admin"
      subscription_tier: "free" | "premium" | "lifetime"
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
      app_role: ["user", "admin"],
      subscription_tier: ["free", "premium", "lifetime"],
    },
  },
} as const
