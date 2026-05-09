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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      settings: {
        Row: {
          id: number
          base_price: number
          surge_threshold: number
          surge_multiplier: number
          alert_threshold: number
          updated_at: string
        }
        Insert: {
          id?: number
          base_price?: number
          surge_threshold?: number
          surge_multiplier?: number
          alert_threshold?: number
          updated_at?: string
        }
        Update: {
          id?: number
          base_price?: number
          surge_threshold?: number
          surge_multiplier?: number
          alert_threshold?: number
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          phone_verified: boolean
          trust_score: number
          daily_res_count: number
          daily_reset_at: string
          ban_until: string | null
          ban_count: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          phone_verified?: boolean
          trust_score?: number
          daily_res_count?: number
          daily_reset_at?: string
          ban_until?: string | null
          ban_count?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          phone_verified?: boolean
          trust_score?: number
          daily_res_count?: number
          daily_reset_at?: string
          ban_until?: string | null
          ban_count?: number
          updated_at?: string
        }
        Relationships: []
      }
      reservations: {
        Row: {
          id: string
          user_id: string
          spot_number: number
          status: string
          reserved_at: string
          expires_at: string
          cancelled_at: string | null
          vehicle_id: string | null
          plate: string | null
          grace_minutes: number
          started_at: string | null
          ended_at: string | null
          duration_min: number | null
          amount_due: number | null
          deposit_amount: number
          deposit_refunded: boolean
          no_show: boolean
        }
        Insert: {
          id?: string
          user_id: string
          spot_number: number
          status?: string
          reserved_at?: string
          expires_at?: string
          cancelled_at?: string | null
          vehicle_id?: string | null
          plate?: string | null
          grace_minutes?: number
          started_at?: string | null
          ended_at?: string | null
          duration_min?: number | null
          amount_due?: number | null
          deposit_amount?: number
          deposit_refunded?: boolean
          no_show?: boolean
        }
        Update: {
          id?: string
          user_id?: string
          spot_number?: number
          status?: string
          reserved_at?: string
          expires_at?: string
          cancelled_at?: string | null
          vehicle_id?: string | null
          plate?: string | null
          grace_minutes?: number
          started_at?: string | null
          ended_at?: string | null
          duration_min?: number | null
          amount_due?: number | null
          deposit_amount?: number
          deposit_refunded?: boolean
          no_show?: boolean
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vehicles: {
        Row: {
          id: string
          user_id: string
          plate: string
          label: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          plate: string
          label?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          plate?: string
          label?: string | null
          created_at?: string
        }
        Relationships: []
      }
      verification_codes: {
        Row: {
          id: string
          user_id: string
          phone: string
          code: string
          expires_at: string
          used: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          phone: string
          code: string
          expires_at?: string
          used?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          phone?: string
          code?: string
          expires_at?: string
          used?: boolean
          created_at?: string
        }
        Relationships: []
      }
      parking_spots: {
        Row: {
          id: number
          status: string
          current_plate: string | null
          last_updated: string
          expires_at: string | null
        }
        Insert: {
          id: number
          status?: string
          current_plate?: string | null
          last_updated?: string
          expires_at?: string | null
        }
        Update: {
          id?: number
          status?: string
          current_plate?: string | null
          last_updated?: string
          expires_at?: string | null
        }
        Relationships: []
      }
      reservation_cooldowns: {
        Row: {
          user_id: string
          spot_id: number
          blocked_until: string
          reason: string | null
        }
        Insert: {
          user_id: string
          spot_id: number
          blocked_until: string
          reason?: string | null
        }
        Update: {
          user_id?: string
          spot_id?: number
          blocked_until?: string
          reason?: string | null
        }
        Relationships: []
      }
      spot_events: {
        Row: {
          id: string
          spot_id: number
          event: string
          occurred_at: string
        }
        Insert: {
          id?: string
          spot_id: number
          event: string
          occurred_at?: string
        }
        Update: {
          id?: string
          spot_id?: number
          event?: string
          occurred_at?: string
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
          _user_id: string
          _role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
      phone_exists: {
        Args: {
          p_phone: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
