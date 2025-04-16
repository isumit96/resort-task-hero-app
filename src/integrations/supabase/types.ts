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
      activities: {
        Row: {
          activity_name: string | null
          category: string | null
          created_at: string | null
          id: number
          ideal_for: string | null
          inclusions_details: string | null
          photo: string | null
          safety_guidelines: string | null
          tags: string | null
          type: string | null
          updated_at: string | null
        }
        Insert: {
          activity_name?: string | null
          category?: string | null
          created_at?: string | null
          id: number
          ideal_for?: string | null
          inclusions_details?: string | null
          photo?: string | null
          safety_guidelines?: string | null
          tags?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          activity_name?: string | null
          category?: string | null
          created_at?: string | null
          id?: number
          ideal_for?: string | null
          inclusions_details?: string | null
          photo?: string | null
          safety_guidelines?: string | null
          tags?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string | null
          username: string | null
        }
        Insert: {
          created_at?: string | null
          id: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
      rooms: {
        Row: {
          Ameneties: string[] | null
          ap_tariff: string | null
          category: string | null
          child_charge: string | null
          cp_tariff: string | null
          created_at: string | null
          extra_adult: string | null
          features: string | null
          id: number
          ideal_for: string | null
          inventory: string | null
          occupancy: string | null
          photo: string | null
          room_type: string | null
          tags: string | null
          updated_at: string | null
        }
        Insert: {
          Ameneties?: string[] | null
          ap_tariff?: string | null
          category?: string | null
          child_charge?: string | null
          cp_tariff?: string | null
          created_at?: string | null
          extra_adult?: string | null
          features?: string | null
          id: number
          ideal_for?: string | null
          inventory?: string | null
          occupancy?: string | null
          photo?: string | null
          room_type?: string | null
          tags?: string | null
          updated_at?: string | null
        }
        Update: {
          Ameneties?: string[] | null
          ap_tariff?: string | null
          category?: string | null
          child_charge?: string | null
          cp_tariff?: string | null
          created_at?: string | null
          extra_adult?: string | null
          features?: string | null
          id?: number
          ideal_for?: string | null
          inventory?: string | null
          occupancy?: string | null
          photo?: string | null
          room_type?: string | null
          tags?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      task_steps: {
        Row: {
          comment: string | null
          created_at: string | null
          id: string
          is_completed: boolean | null
          is_optional: boolean
          photo_url: string | null
          requires_photo: boolean | null
          task_id: string | null
          title: string
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          id?: string
          is_completed?: boolean | null
          is_optional?: boolean
          photo_url?: string | null
          requires_photo?: boolean | null
          task_id?: string | null
          title: string
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          id?: string
          is_completed?: boolean | null
          is_optional?: boolean
          photo_url?: string | null
          requires_photo?: boolean | null
          task_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_steps_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assigned_to: string
          completed_at: string | null
          created_at: string | null
          deadline: string | null
          due_time: string
          id: string
          location: string
          status: Database["public"]["Enums"]["task_status"] | null
          title: string
        }
        Insert: {
          assigned_to: string
          completed_at?: string | null
          created_at?: string | null
          deadline?: string | null
          due_time: string
          id?: string
          location: string
          status?: Database["public"]["Enums"]["task_status"] | null
          title: string
        }
        Update: {
          assigned_to?: string
          completed_at?: string | null
          created_at?: string | null
          deadline?: string | null
          due_time?: string
          id?: string
          location?: string
          status?: Database["public"]["Enums"]["task_status"] | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      task_status: "pending" | "inprogress" | "completed"
      user_role: "employee" | "manager"
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
    Enums: {
      task_status: ["pending", "inprogress", "completed"],
      user_role: ["employee", "manager"],
    },
  },
} as const
