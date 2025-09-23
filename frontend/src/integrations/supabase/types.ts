export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      audit_log: {
        Row: {
          action_type: string
          actor_role: string | null
          changes: Json | null
          context: Json | null
          id: number
          ip_address: unknown | null
          log_time: string
          new_values: Json | null
          old_values: Json | null
          target_resource_id: string | null
          target_resource_type: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action_type: string
          actor_role?: string | null
          changes?: Json | null
          context?: Json | null
          id?: number
          ip_address?: unknown | null
          log_time?: string
          new_values?: Json | null
          old_values?: Json | null
          target_resource_id?: string | null
          target_resource_type?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action_type?: string
          actor_role?: string | null
          changes?: Json | null
          context?: Json | null
          id?: number
          ip_address?: unknown | null
          log_time?: string
          new_values?: Json | null
          old_values?: Json | null
          target_resource_id?: string | null
          target_resource_type?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      caladmin_emailid: {
        Row: {
          email_address: string
          id: number
          purpose: string
          updated_at: string | null
        }
        Insert: {
          email_address: string
          id?: number
          purpose?: string
          updated_at?: string | null
        }
        Update: {
          email_address?: string
          id?: number
          purpose?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      consultant_availability_slots: {
        Row: {
          booked_by_customer_choice_id: string | null
          consultant_user_id: string
          created_at: string
          id: string
          slot_end_time: string
          slot_start_time: string
          updated_at: string
        }
        Insert: {
          booked_by_customer_choice_id?: string | null
          consultant_user_id: string
          created_at?: string
          id?: string
          slot_end_time: string
          slot_start_time: string
          updated_at?: string
        }
        Update: {
          booked_by_customer_choice_id?: string | null
          consultant_user_id?: string
          created_at?: string
          id?: string
          slot_end_time?: string
          slot_start_time?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "consultant_availability_slots_booked_by_customer_choice_id_fkey"
            columns: ["booked_by_customer_choice_id"]
            isOneToOne: true
            referencedRelation: "customer_choice"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultant_availability_slots_consultant_user_id_fkey"
            columns: ["consultant_user_id"]
            isOneToOne: false
            referencedRelation: "user_master"
            referencedColumns: ["user_id"]
          },
        ]
      }
      customer_choice: {
        Row: {
          consultant_id: string | null
          created_at: string
          description: string
          id: string
          priority: string | null
          scheduled_time: string | null
          sr_identifier: string | null
          status: string
          status_updated_at: string | null
          status_updated_by_user_id: string | null
          support_category_id: string | null
          support_sub_option_id: string | null
          support_type_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          consultant_id?: string | null
          created_at?: string
          description: string
          id?: string
          priority?: string | null
          scheduled_time?: string | null
          sr_identifier?: string | null
          status?: string
          status_updated_at?: string | null
          status_updated_by_user_id?: string | null
          support_category_id?: string | null
          support_sub_option_id?: string | null
          support_type_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          consultant_id?: string | null
          created_at?: string
          description?: string
          id?: string
          priority?: string | null
          scheduled_time?: string | null
          sr_identifier?: string | null
          status?: string
          status_updated_at?: string | null
          status_updated_by_user_id?: string | null
          support_category_id?: string | null
          support_sub_option_id?: string | null
          support_type_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_choice_consultant_id_fkey"
            columns: ["consultant_id"]
            isOneToOne: false
            referencedRelation: "user_master"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "customer_choice_support_category_id_fkey"
            columns: ["support_category_id"]
            isOneToOne: false
            referencedRelation: "support_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_choice_support_sub_option_id_fkey"
            columns: ["support_sub_option_id"]
            isOneToOne: false
            referencedRelation: "support_sub_options"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_choice_support_type_id_fkey"
            columns: ["support_type_id"]
            isOneToOne: false
            referencedRelation: "support_types"
            referencedColumns: ["id"]
          },
        ]
      }
      denied_domains: {
        Row: {
          created_at: string
          domain_name: string
          id: string
          reason: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          domain_name: string
          id?: string
          reason?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          domain_name?: string
          id?: string
          reason?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      login_activity: {
        Row: {
          device_info: Json | null
          failure_reason: string | null
          id: string
          ip_address: unknown | null
          is_trusted_device: boolean | null
          login_status: string
          login_time: string
          logout_time: string | null
          mfa_method_used: string | null
          session_duration: unknown | null
          sso_provider_used: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          device_info?: Json | null
          failure_reason?: string | null
          id?: string
          ip_address?: unknown | null
          is_trusted_device?: boolean | null
          login_status?: string
          login_time?: string
          logout_time?: string | null
          mfa_method_used?: string | null
          session_duration?: unknown | null
          sso_provider_used?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          device_info?: Json | null
          failure_reason?: string | null
          id?: string
          ip_address?: unknown | null
          is_trusted_device?: boolean | null
          login_status?: string
          login_time?: string
          logout_time?: string | null
          mfa_method_used?: string | null
          session_duration?: unknown | null
          sso_provider_used?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      number_sequences: {
        Row: {
          current_value: number
          last_updated: string | null
          sequence_name: string
        }
        Insert: {
          current_value?: number
          last_updated?: string | null
          sequence_name?: string
        }
        Update: {
          current_value?: number
          last_updated?: string | null
          sequence_name?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          consultant_id: string | null
          created_at: string
          customer_choice_id: string
          id: string
          order_number: string
          support_type_name: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          consultant_id?: string | null
          created_at?: string
          customer_choice_id: string
          id?: string
          order_number: string
          support_type_name?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          consultant_id?: string | null
          created_at?: string
          customer_choice_id?: string
          id?: string
          order_number?: string
          support_type_name?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_consultant_id_fkey"
            columns: ["consultant_id"]
            isOneToOne: false
            referencedRelation: "user_master"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "orders_customer_choice_id_fkey"
            columns: ["customer_choice_id"]
            isOneToOne: true
            referencedRelation: "customer_choice"
            referencedColumns: ["id"]
          },
        ]
      }
      sap_rise_rnr: {
        Row: {
          created_at: string
          id: string
          identifier: string
          is_active: boolean | null
          task: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          identifier: string
          is_active?: boolean | null
          task?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          identifier?: string
          is_active?: boolean | null
          task?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      signup_options: {
        Row: {
          id: number
          is_enabled: boolean
          option_name: string
          updated_at: string | null
        }
        Insert: {
          id?: number
          is_enabled?: boolean
          option_name: string
          updated_at?: string | null
        }
        Update: {
          id?: number
          is_enabled?: boolean
          option_name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      subscription_plans: {
        Row: {
          billing_interval: string | null
          created_at: string
          description: string | null
          features: Json | null
          id: string
          is_active: boolean | null
          name: string
          price: number | null
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          billing_interval?: string | null
          created_at?: string
          description?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          name: string
          price?: number | null
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          billing_interval?: string | null
          created_at?: string
          description?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          name?: string
          price?: number | null
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      support_categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      support_sub_options: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          requires_sr_identifier: boolean | null
          sort_order: number | null
          support_type_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          requires_sr_identifier?: boolean | null
          sort_order?: number | null
          support_type_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          requires_sr_identifier?: boolean | null
          sort_order?: number | null
          support_type_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_sub_options_support_type_id_fkey"
            columns: ["support_type_id"]
            isOneToOne: false
            referencedRelation: "support_types"
            referencedColumns: ["id"]
          },
        ]
      }
      support_types: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      ticket_ratings: {
        Row: {
          comments: string | null
          communication_professionalism: number | null
          created_at: string
          id: string
          order_id: string
          rated_by_user_id: string
          rated_user_id: string
          rating_for_role: string
          resolution_quality: number | null
          response_time: number | null
        }
        Insert: {
          comments?: string | null
          communication_professionalism?: number | null
          created_at?: string
          id?: string
          order_id: string
          rated_by_user_id: string
          rated_user_id: string
          rating_for_role: string
          resolution_quality?: number | null
          response_time?: number | null
        }
        Update: {
          comments?: string | null
          communication_professionalism?: number | null
          created_at?: string
          id?: string
          order_id?: string
          rated_by_user_id?: string
          rated_user_id?: string
          rating_for_role?: string
          resolution_quality?: number | null
          response_time?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ticket_ratings_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      user_master: {
        Row: {
          created_at: string
          creation_time: string
          current_session_time: string | null
          current_session_token_issued_at: string | null
          first_name: string | null
          id: string
          last_login_time: string | null
          last_name: string | null
          login_timestamps: Json | null
          mfa_option_configured: string | null
          role: string
          sso_type: string | null
          status: string
          trust_device_expires: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          creation_time?: string
          current_session_time?: string | null
          current_session_token_issued_at?: string | null
          first_name?: string | null
          id?: string
          last_login_time?: string | null
          last_name?: string | null
          login_timestamps?: Json | null
          mfa_option_configured?: string | null
          role?: string
          sso_type?: string | null
          status?: string
          trust_device_expires?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          creation_time?: string
          current_session_time?: string | null
          current_session_token_issued_at?: string | null
          first_name?: string | null
          id?: string
          last_login_time?: string | null
          last_name?: string | null
          login_timestamps?: Json | null
          mfa_option_configured?: string | null
          role?: string
          sso_type?: string | null
          status?: string
          trust_device_expires?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          auto_renew: boolean | null
          cancel_at_period_end: boolean | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          end_date: string | null
          id: string
          payment_gateway_subscription_id: string | null
          start_date: string
          status: string
          subscription_plan_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          auto_renew?: boolean | null
          cancel_at_period_end?: boolean | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          end_date?: string | null
          id?: string
          payment_gateway_subscription_id?: string | null
          start_date?: string
          status?: string
          subscription_plan_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          auto_renew?: boolean | null
          cancel_at_period_end?: boolean | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          end_date?: string | null
          id?: string
          payment_gateway_subscription_id?: string | null
          start_date?: string
          status?: string
          subscription_plan_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_subscriptions_subscription_plan_id_fkey"
            columns: ["subscription_plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      gbt_bit_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_bool_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_bool_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_bpchar_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_bytea_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_cash_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_cash_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_date_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_date_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_decompress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_enum_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_enum_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_float4_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_float4_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_float8_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_float8_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_inet_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_int2_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_int2_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_int4_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_int4_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_int8_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_int8_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_intv_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_intv_decompress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_intv_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_macad_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_macad_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_macad8_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_macad8_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_numeric_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_oid_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_oid_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_text_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_time_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_time_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_timetz_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_ts_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_ts_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_tstz_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_uuid_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_uuid_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_var_decompress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_var_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbtreekey_var_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbtreekey_var_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbtreekey16_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbtreekey16_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbtreekey2_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbtreekey2_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbtreekey32_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbtreekey32_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbtreekey4_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbtreekey4_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbtreekey8_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbtreekey8_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      generate_order_number: {
        Args:
          | { support_type_name: string }
          | {
              support_type_name: string
              support_category_name?: string
              support_sub_option_name?: string
              priority_level?: string
            }
        Returns: string
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
