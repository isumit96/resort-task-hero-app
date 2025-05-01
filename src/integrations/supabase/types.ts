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
          featured: boolean | null
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
          featured?: boolean | null
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
          featured?: boolean | null
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
      departments: {
        Row: {
          created_at: string | null
          id: string
          name: Database["public"]["Enums"]["department_type"]
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: Database["public"]["Enums"]["department_type"]
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: Database["public"]["Enums"]["department_type"]
        }
        Relationships: []
      }
      locations: {
        Row: {
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          department: Database["public"]["Enums"]["department_type"] | null
          id: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string | null
          username: string | null
        }
        Insert: {
          created_at?: string | null
          department?: Database["public"]["Enums"]["department_type"] | null
          id: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          created_at?: string | null
          department?: Database["public"]["Enums"]["department_type"] | null
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
          "interior-photo": string | null
          "interior-photo-2": string | null
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
          "interior-photo"?: string | null
          "interior-photo-2"?: string | null
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
          "interior-photo"?: string | null
          "interior-photo-2"?: string | null
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
          interaction_type:
            | Database["public"]["Enums"]["step_interaction_type"]
            | null
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
          interaction_type?:
            | Database["public"]["Enums"]["step_interaction_type"]
            | null
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
          interaction_type?:
            | Database["public"]["Enums"]["step_interaction_type"]
            | null
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
      task_templates: {
        Row: {
          created_at: string | null
          created_by: string | null
          department: Database["public"]["Enums"]["department_type"] | null
          description: string | null
          id: string
          location: string | null
          title: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          department?: Database["public"]["Enums"]["department_type"] | null
          description?: string | null
          id?: string
          location?: string | null
          title: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          department?: Database["public"]["Enums"]["department_type"] | null
          description?: string | null
          id?: string
          location?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
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
          department: Database["public"]["Enums"]["department_type"] | null
          description: string | null
          due_time: string
          id: string
          location: string
          photo_url: string | null
          status: Database["public"]["Enums"]["task_status"] | null
          title: string
          video_url: string | null
        }
        Insert: {
          assigned_to: string
          completed_at?: string | null
          created_at?: string | null
          deadline?: string | null
          department?: Database["public"]["Enums"]["department_type"] | null
          description?: string | null
          due_time: string
          id?: string
          location: string
          photo_url?: string | null
          status?: Database["public"]["Enums"]["task_status"] | null
          title: string
          video_url?: string | null
        }
        Update: {
          assigned_to?: string
          completed_at?: string | null
          created_at?: string | null
          deadline?: string | null
          department?: Database["public"]["Enums"]["department_type"] | null
          description?: string | null
          due_time?: string
          id?: string
          location?: string
          photo_url?: string | null
          status?: Database["public"]["Enums"]["task_status"] | null
          title?: string
          video_url?: string | null
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
      template_steps: {
        Row: {
          id: string
          interaction_type:
            | Database["public"]["Enums"]["step_interaction_type"]
            | null
          is_optional: boolean | null
          position: number
          requires_photo: boolean | null
          template_id: string | null
          title: string
        }
        Insert: {
          id?: string
          interaction_type?:
            | Database["public"]["Enums"]["step_interaction_type"]
            | null
          is_optional?: boolean | null
          position: number
          requires_photo?: boolean | null
          template_id?: string | null
          title: string
        }
        Update: {
          id?: string
          interaction_type?:
            | Database["public"]["Enums"]["step_interaction_type"]
            | null
          is_optional?: boolean | null
          position?: number
          requires_photo?: boolean | null
          template_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "template_steps_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "task_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      translation_jobs: {
        Row: {
          completed_at: string | null
          content_items: Json
          created_at: string | null
          error_message: string | null
          id: string
          status: Database["public"]["Enums"]["translation_job_status"]
          target_langs: string[]
        }
        Insert: {
          completed_at?: string | null
          content_items: Json
          created_at?: string | null
          error_message?: string | null
          id?: string
          status?: Database["public"]["Enums"]["translation_job_status"]
          target_langs: string[]
        }
        Update: {
          completed_at?: string | null
          content_items?: Json
          created_at?: string | null
          error_message?: string | null
          id?: string
          status?: Database["public"]["Enums"]["translation_job_status"]
          target_langs?: string[]
        }
        Relationships: []
      }
      translations: {
        Row: {
          content_id: string
          content_type: string
          created_at: string | null
          id: string
          source_lang: string
          source_text: string
          target_lang: string
          translated_text: string
          updated_at: string | null
        }
        Insert: {
          content_id: string
          content_type: string
          created_at?: string | null
          id?: string
          source_lang?: string
          source_text: string
          target_lang: string
          translated_text: string
          updated_at?: string | null
        }
        Update: {
          content_id?: string
          content_type?: string
          created_at?: string | null
          id?: string
          source_lang?: string
          source_text?: string
          target_lang?: string
          translated_text?: string
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      department_type:
        | "Housekeeping"
        | "Front Office"
        | "Kitchen"
        | "Activities"
        | "Gardening"
      step_interaction_type: "checkbox" | "yes_no"
      task_status: "pending" | "inprogress" | "completed"
      translation_job_status: "pending" | "completed" | "failed"
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
      department_type: [
        "Housekeeping",
        "Front Office",
        "Kitchen",
        "Activities",
        "Gardening",
      ],
      step_interaction_type: ["checkbox", "yes_no"],
      task_status: ["pending", "inprogress", "completed"],
      translation_job_status: ["pending", "completed", "failed"],
      user_role: ["employee", "manager"],
    },
  },
} as const
