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
      announcements: {
        Row: {
          active: boolean
          created_at: string
          id: string
          link_url: string | null
          message_ar: string
          message_en: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          link_url?: string | null
          message_ar: string
          message_en: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          link_url?: string | null
          message_ar?: string
          message_en?: string
        }
        Relationships: []
      }
      barber_services: {
        Row: {
          barber_id: string
          id: string
          price_iqd: number
          service_id: string
        }
        Insert: {
          barber_id: string
          id?: string
          price_iqd: number
          service_id: string
        }
        Update: {
          barber_id?: string
          id?: string
          price_iqd?: number
          service_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "barber_services_barber_id_fkey"
            columns: ["barber_id"]
            isOneToOne: false
            referencedRelation: "barbers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "barber_services_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      barbers: {
        Row: {
          active: boolean
          bio_ar: string | null
          bio_en: string | null
          created_at: string
          email: string | null
          experience_ar: string | null
          experience_en: string | null
          id: string
          name_ar: string
          name_en: string
          photo_url: string | null
          role_ar: string | null
          role_en: string | null
          slug: string | null
          sort_order: number
          specialty_ar: string | null
          specialty_en: string | null
          user_id: string | null
          years: number | null
        }
        Insert: {
          active?: boolean
          bio_ar?: string | null
          bio_en?: string | null
          created_at?: string
          email?: string | null
          experience_ar?: string | null
          experience_en?: string | null
          id?: string
          name_ar: string
          name_en: string
          photo_url?: string | null
          role_ar?: string | null
          role_en?: string | null
          slug?: string | null
          sort_order?: number
          specialty_ar?: string | null
          specialty_en?: string | null
          user_id?: string | null
          years?: number | null
        }
        Update: {
          active?: boolean
          bio_ar?: string | null
          bio_en?: string | null
          created_at?: string
          email?: string | null
          experience_ar?: string | null
          experience_en?: string | null
          id?: string
          name_ar?: string
          name_en?: string
          photo_url?: string | null
          role_ar?: string | null
          role_en?: string | null
          slug?: string | null
          sort_order?: number
          specialty_ar?: string | null
          specialty_en?: string | null
          user_id?: string | null
          years?: number | null
        }
        Relationships: []
      }
      bookings: {
        Row: {
          barber_id: string
          created_at: string
          customer_id: string
          ends_at: string
          id: string
          notes: string | null
          price_iqd: number
          reminder_20d_sent: boolean
          reminder_3h_sent: boolean
          service_id: string
          starts_at: string
          status: Database["public"]["Enums"]["booking_status"]
        }
        Insert: {
          barber_id: string
          created_at?: string
          customer_id: string
          ends_at: string
          id?: string
          notes?: string | null
          price_iqd: number
          reminder_20d_sent?: boolean
          reminder_3h_sent?: boolean
          service_id: string
          starts_at: string
          status?: Database["public"]["Enums"]["booking_status"]
        }
        Update: {
          barber_id?: string
          created_at?: string
          customer_id?: string
          ends_at?: string
          id?: string
          notes?: string | null
          price_iqd?: number
          reminder_20d_sent?: boolean
          reminder_3h_sent?: boolean
          service_id?: string
          starts_at?: string
          status?: Database["public"]["Enums"]["booking_status"]
        }
        Relationships: [
          {
            foreignKeyName: "bookings_barber_id_fkey"
            columns: ["barber_id"]
            isOneToOne: false
            referencedRelation: "barbers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          id: string
          name_ar: string
          name_en: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          name_ar: string
          name_en: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          name_ar?: string
          name_en?: string
          sort_order?: number
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          created_at: string
          handled: boolean
          id: string
          message: string
          name: string
          phone: string
        }
        Insert: {
          created_at?: string
          handled?: boolean
          id?: string
          message: string
          name: string
          phone: string
        }
        Update: {
          created_at?: string
          handled?: boolean
          id?: string
          message?: string
          name?: string
          phone?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          created_at: string
          id: string
          name: string
          no_show_count: number
          phone: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          no_show_count?: number
          phone: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          no_show_count?: number
          phone?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          color: string | null
          id: string
          order_id: string
          price_iqd: number
          product_id: string | null
          product_name: string
          quantity: number
          size: string | null
          variant_id: string | null
        }
        Insert: {
          color?: string | null
          id?: string
          order_id: string
          price_iqd: number
          product_id?: string | null
          product_name: string
          quantity: number
          size?: string | null
          variant_id?: string | null
        }
        Update: {
          color?: string | null
          id?: string
          order_id?: string
          price_iqd?: number
          product_id?: string | null
          product_name?: string
          quantity?: number
          size?: string | null
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          customer_address: string | null
          customer_name: string
          customer_phone: string
          governorate: string | null
          id: string
          notes: string | null
          status: Database["public"]["Enums"]["order_status"]
          total_iqd: number
        }
        Insert: {
          created_at?: string
          customer_address?: string | null
          customer_name: string
          customer_phone: string
          governorate?: string | null
          id?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          total_iqd: number
        }
        Update: {
          created_at?: string
          customer_address?: string | null
          customer_name?: string
          customer_phone?: string
          governorate?: string | null
          id?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          total_iqd?: number
        }
        Relationships: []
      }
      portfolio_items: {
        Row: {
          barber_id: string | null
          created_at: string
          description_ar: string | null
          description_en: string | null
          id: string
          sort_order: number
          title_ar: string | null
          title_en: string | null
          type: Database["public"]["Enums"]["portfolio_type"]
          url: string
        }
        Insert: {
          barber_id?: string | null
          created_at?: string
          description_ar?: string | null
          description_en?: string | null
          id?: string
          sort_order?: number
          title_ar?: string | null
          title_en?: string | null
          type?: Database["public"]["Enums"]["portfolio_type"]
          url: string
        }
        Update: {
          barber_id?: string | null
          created_at?: string
          description_ar?: string | null
          description_en?: string | null
          id?: string
          sort_order?: number
          title_ar?: string | null
          title_en?: string | null
          type?: Database["public"]["Enums"]["portfolio_type"]
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "portfolio_items_barber_id_fkey"
            columns: ["barber_id"]
            isOneToOne: false
            referencedRelation: "barbers"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variants: {
        Row: {
          color: string | null
          created_at: string
          id: string
          product_id: string
          size: string | null
          stock: number
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          product_id: string
          size?: string | null
          stock?: number
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          product_id?: string
          size?: string | null
          stock?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          active: boolean
          category_id: string | null
          colors: string[] | null
          created_at: string
          description_ar: string | null
          description_en: string | null
          discount_price_iqd: number | null
          id: string
          image_url: string | null
          name_ar: string
          name_en: string
          price_iqd: number
          sizes: string[] | null
          stock: number
        }
        Insert: {
          active?: boolean
          category_id?: string | null
          colors?: string[] | null
          created_at?: string
          description_ar?: string | null
          description_en?: string | null
          discount_price_iqd?: number | null
          id?: string
          image_url?: string | null
          name_ar: string
          name_en: string
          price_iqd: number
          sizes?: string[] | null
          stock?: number
        }
        Update: {
          active?: boolean
          category_id?: string | null
          colors?: string[] | null
          created_at?: string
          description_ar?: string | null
          description_en?: string | null
          discount_price_iqd?: number | null
          id?: string
          image_url?: string | null
          name_ar?: string
          name_en?: string
          price_iqd?: number
          sizes?: string[] | null
          stock?: number
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id: string
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          approved: boolean
          barber_id: string
          comment: string | null
          created_at: string
          customer_name: string
          id: string
          rating: number
        }
        Insert: {
          approved?: boolean
          barber_id: string
          comment?: string | null
          created_at?: string
          customer_name: string
          id?: string
          rating: number
        }
        Update: {
          approved?: boolean
          barber_id?: string
          comment?: string | null
          created_at?: string
          customer_name?: string
          id?: string
          rating?: number
        }
        Relationships: [
          {
            foreignKeyName: "reviews_barber_id_fkey"
            columns: ["barber_id"]
            isOneToOne: false
            referencedRelation: "barbers"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          active: boolean
          created_at: string
          description_ar: string | null
          description_en: string | null
          duration_minutes: number
          id: string
          name_ar: string
          name_en: string
          sort_order: number
        }
        Insert: {
          active?: boolean
          created_at?: string
          description_ar?: string | null
          description_en?: string | null
          duration_minutes?: number
          id?: string
          name_ar: string
          name_en: string
          sort_order?: number
        }
        Update: {
          active?: boolean
          created_at?: string
          description_ar?: string | null
          description_en?: string | null
          duration_minutes?: number
          id?: string
          name_ar?: string
          name_en?: string
          sort_order?: number
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_barber_id: { Args: { _user_id: string }; Returns: string }
      decrement_product_stock: {
        Args: { _product_id: string; _qty: number }
        Returns: number
      }
      decrement_variant_stock: {
        Args: { _qty: number; _variant_id: string }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      upsert_customer_by_phone: {
        Args: { _name: string; _phone: string }
        Returns: string
      }
    }
    Enums: {
      app_role: "admin" | "customer" | "barber"
      booking_status: "pending" | "confirmed" | "paid" | "cancelled" | "no_show"
      order_status:
        | "pending"
        | "confirmed"
        | "fulfilled"
        | "cancelled"
        | "ready"
        | "completed"
      portfolio_type: "image" | "video"
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
      app_role: ["admin", "customer", "barber"],
      booking_status: ["pending", "confirmed", "paid", "cancelled", "no_show"],
      order_status: [
        "pending",
        "confirmed",
        "fulfilled",
        "cancelled",
        "ready",
        "completed",
      ],
      portfolio_type: ["image", "video"],
    },
  },
} as const
