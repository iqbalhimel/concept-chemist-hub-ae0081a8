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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          created_at: string
          icon: string
          id: string
          is_active: boolean
          sort_order: number
          title_bn: string
          title_en: string
          value: string
        }
        Insert: {
          created_at?: string
          icon?: string
          id?: string
          is_active?: boolean
          sort_order?: number
          title_bn?: string
          title_en?: string
          value?: string
        }
        Update: {
          created_at?: string
          icon?: string
          id?: string
          is_active?: boolean
          sort_order?: number
          title_bn?: string
          title_en?: string
          value?: string
        }
        Relationships: []
      }
      admin_activity_log: {
        Row: {
          action_type: string
          created_at: string
          id: string
          item_id: string | null
          item_title: string | null
          module: string
          user_id: string
        }
        Insert: {
          action_type: string
          created_at?: string
          id?: string
          item_id?: string | null
          item_title?: string | null
          module: string
          user_id: string
        }
        Update: {
          action_type?: string
          created_at?: string
          id?: string
          item_id?: string | null
          item_title?: string | null
          module?: string
          user_id?: string
        }
        Relationships: []
      }
      blog_post_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          parent_id: string | null
          post_id: string
          user_name: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          parent_id?: string | null
          post_id: string
          user_name: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          parent_id?: string | null
          post_id?: string
          user_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_post_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "blog_post_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_post_reactions: {
        Row: {
          created_at: string
          id: string
          post_id: string
          reaction_type: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          reaction_type: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          reaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_post_reactions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_posts: {
        Row: {
          category: string
          content: string | null
          created_at: string
          excerpt: string | null
          expire_at: string | null
          featured_image: string | null
          id: string
          is_published: boolean
          read_time: string | null
          scheduled_at: string | null
          seo_canonical_url: string | null
          seo_description: string | null
          seo_keywords: string | null
          seo_og_description: string | null
          seo_og_image: string | null
          seo_og_title: string | null
          seo_title: string | null
          seo_twitter_description: string | null
          seo_twitter_image: string | null
          seo_twitter_title: string | null
          slug: string | null
          sort_order: number
          title: string
          trashed_at: string | null
          updated_at: string
        }
        Insert: {
          category: string
          content?: string | null
          created_at?: string
          excerpt?: string | null
          expire_at?: string | null
          featured_image?: string | null
          id?: string
          is_published?: boolean
          read_time?: string | null
          scheduled_at?: string | null
          seo_canonical_url?: string | null
          seo_description?: string | null
          seo_keywords?: string | null
          seo_og_description?: string | null
          seo_og_image?: string | null
          seo_og_title?: string | null
          seo_title?: string | null
          seo_twitter_description?: string | null
          seo_twitter_image?: string | null
          seo_twitter_title?: string | null
          slug?: string | null
          sort_order?: number
          title: string
          trashed_at?: string | null
          updated_at?: string
        }
        Update: {
          category?: string
          content?: string | null
          created_at?: string
          excerpt?: string | null
          expire_at?: string | null
          featured_image?: string | null
          id?: string
          is_published?: boolean
          read_time?: string | null
          scheduled_at?: string | null
          seo_canonical_url?: string | null
          seo_description?: string | null
          seo_keywords?: string | null
          seo_og_description?: string | null
          seo_og_image?: string | null
          seo_og_title?: string | null
          seo_title?: string | null
          seo_twitter_description?: string | null
          seo_twitter_image?: string | null
          seo_twitter_title?: string | null
          slug?: string | null
          sort_order?: number
          title?: string
          trashed_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      core_web_vitals: {
        Row: {
          created_at: string
          device_type: string | null
          id: string
          metric_name: string
          metric_value: number
          page_path: string
          rating: string | null
          session_id: string
        }
        Insert: {
          created_at?: string
          device_type?: string | null
          id?: string
          metric_name: string
          metric_value: number
          page_path: string
          rating?: string | null
          session_id: string
        }
        Update: {
          created_at?: string
          device_type?: string | null
          id?: string
          metric_name?: string
          metric_value?: number
          page_path?: string
          rating?: string | null
          session_id?: string
        }
        Relationships: []
      }
      education: {
        Row: {
          cgpa_or_result: string
          created_at: string
          degree_title_bn: string
          degree_title_en: string
          id: string
          institution_bn: string
          institution_en: string
          is_active: boolean
          sort_order: number
          year: string
        }
        Insert: {
          cgpa_or_result?: string
          created_at?: string
          degree_title_bn?: string
          degree_title_en?: string
          id?: string
          institution_bn?: string
          institution_en?: string
          is_active?: boolean
          sort_order?: number
          year?: string
        }
        Update: {
          cgpa_or_result?: string
          created_at?: string
          degree_title_bn?: string
          degree_title_en?: string
          id?: string
          institution_bn?: string
          institution_en?: string
          is_active?: boolean
          sort_order?: number
          year?: string
        }
        Relationships: []
      }
      educational_videos: {
        Row: {
          class_level: string
          created_at: string
          description: string | null
          duration: string | null
          expire_at: string | null
          id: string
          is_published: boolean
          publish_at: string | null
          sort_order: number
          subject: string
          thumbnail_url: string | null
          title: string
          updated_at: string
          video_source: string
          video_url: string | null
        }
        Insert: {
          class_level?: string
          created_at?: string
          description?: string | null
          duration?: string | null
          expire_at?: string | null
          id?: string
          is_published?: boolean
          publish_at?: string | null
          sort_order?: number
          subject?: string
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          video_source?: string
          video_url?: string | null
        }
        Update: {
          class_level?: string
          created_at?: string
          description?: string | null
          duration?: string | null
          expire_at?: string | null
          id?: string
          is_published?: boolean
          publish_at?: string | null
          sort_order?: number
          subject?: string
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          video_source?: string
          video_url?: string | null
        }
        Relationships: []
      }
      experience: {
        Row: {
          created_at: string
          description_bn: string
          description_en: string
          duration_bn: string
          duration_en: string
          id: string
          institution_bn: string
          institution_en: string
          is_active: boolean
          job_title_bn: string
          job_title_en: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          description_bn?: string
          description_en?: string
          duration_bn?: string
          duration_en?: string
          id?: string
          institution_bn?: string
          institution_en?: string
          is_active?: boolean
          job_title_bn?: string
          job_title_en?: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          description_bn?: string
          description_en?: string
          duration_bn?: string
          duration_en?: string
          id?: string
          institution_bn?: string
          institution_en?: string
          is_active?: boolean
          job_title_bn?: string
          job_title_en?: string
          sort_order?: number
        }
        Relationships: []
      }
      faq: {
        Row: {
          answer: string
          answer_bn: string
          created_at: string
          id: string
          is_active: boolean
          question: string
          question_bn: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          answer: string
          answer_bn?: string
          created_at?: string
          id?: string
          is_active?: boolean
          question: string
          question_bn?: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          answer?: string
          answer_bn?: string
          created_at?: string
          id?: string
          is_active?: boolean
          question?: string
          question_bn?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      gallery: {
        Row: {
          alt: string | null
          created_at: string
          id: string
          image_url: string
          label: string | null
          sort_order: number
          span: string | null
          trashed_at: string | null
        }
        Insert: {
          alt?: string | null
          created_at?: string
          id?: string
          image_url: string
          label?: string | null
          sort_order?: number
          span?: string | null
          trashed_at?: string | null
        }
        Update: {
          alt?: string | null
          created_at?: string
          id?: string
          image_url?: string
          label?: string | null
          sort_order?: number
          span?: string | null
          trashed_at?: string | null
        }
        Relationships: []
      }
      media_library: {
        Row: {
          created_at: string
          file_size: number | null
          file_type: string
          file_url: string
          folder: string
          id: string
          name: string
          tags: string[]
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          file_size?: number | null
          file_type: string
          file_url: string
          folder?: string
          id?: string
          name: string
          tags?: string[]
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          file_size?: number | null
          file_type?: string
          file_url?: string
          folder?: string
          id?: string
          name?: string
          tags?: string[]
          uploaded_by?: string | null
        }
        Relationships: []
      }
      notices: {
        Row: {
          created_at: string
          date: string
          description: string | null
          expires_at: string | null
          id: string
          is_active: boolean
          is_pinned: boolean
          publish_at: string | null
          seo_canonical_url: string | null
          seo_description: string | null
          seo_keywords: string | null
          seo_og_description: string | null
          seo_og_image: string | null
          seo_og_title: string | null
          seo_title: string | null
          seo_twitter_description: string | null
          seo_twitter_image: string | null
          seo_twitter_title: string | null
          sort_order: number
          title: string
          trashed_at: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          date?: string
          description?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          is_pinned?: boolean
          publish_at?: string | null
          seo_canonical_url?: string | null
          seo_description?: string | null
          seo_keywords?: string | null
          seo_og_description?: string | null
          seo_og_image?: string | null
          seo_og_title?: string | null
          seo_title?: string | null
          seo_twitter_description?: string | null
          seo_twitter_image?: string | null
          seo_twitter_title?: string | null
          sort_order?: number
          title: string
          trashed_at?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          date?: string
          description?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          is_pinned?: boolean
          publish_at?: string | null
          seo_canonical_url?: string | null
          seo_description?: string | null
          seo_keywords?: string | null
          seo_og_description?: string | null
          seo_og_image?: string | null
          seo_og_title?: string | null
          seo_title?: string | null
          seo_twitter_description?: string | null
          seo_twitter_image?: string | null
          seo_twitter_title?: string | null
          sort_order?: number
          title?: string
          trashed_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      page_views: {
        Row: {
          id: string
          page_path: string
          session_id: string
          viewed_at: string
        }
        Insert: {
          id?: string
          page_path: string
          session_id: string
          viewed_at?: string
        }
        Update: {
          id?: string
          page_path?: string
          session_id?: string
          viewed_at?: string
        }
        Relationships: []
      }
      post_tags: {
        Row: {
          id: string
          post_id: string
          tag_id: string
        }
        Insert: {
          id?: string
          post_id: string
          tag_id: string
        }
        Update: {
          id?: string
          post_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_tags_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_training: {
        Row: {
          created_at: string
          icon: string
          id: string
          is_active: boolean
          sort_order: number
          title_bn: string
          title_en: string
        }
        Insert: {
          created_at?: string
          icon?: string
          id?: string
          is_active?: boolean
          sort_order?: number
          title_bn?: string
          title_en?: string
        }
        Update: {
          created_at?: string
          icon?: string
          id?: string
          is_active?: boolean
          sort_order?: number
          title_bn?: string
          title_en?: string
        }
        Relationships: []
      }
      security_logs: {
        Row: {
          created_at: string
          description: string
          event_type: string
          id: string
          ip_address: string | null
          metadata: Json | null
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          description?: string
          event_type: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string
          event_type?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          id: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      study_categories: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          slug: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          slug: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      study_materials: {
        Row: {
          category: string
          created_at: string
          expire_at: string | null
          file_size: string | null
          file_url: string | null
          id: string
          is_active: boolean
          pages: number | null
          publish_at: string | null
          seo_canonical_url: string | null
          seo_description: string | null
          seo_keywords: string | null
          seo_og_description: string | null
          seo_og_image: string | null
          seo_og_title: string | null
          seo_title: string | null
          seo_twitter_description: string | null
          seo_twitter_image: string | null
          seo_twitter_title: string | null
          sort_order: number
          title: string
          trashed_at: string | null
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          expire_at?: string | null
          file_size?: string | null
          file_url?: string | null
          id?: string
          is_active?: boolean
          pages?: number | null
          publish_at?: string | null
          seo_canonical_url?: string | null
          seo_description?: string | null
          seo_keywords?: string | null
          seo_og_description?: string | null
          seo_og_image?: string | null
          seo_og_title?: string | null
          seo_title?: string | null
          seo_twitter_description?: string | null
          seo_twitter_image?: string | null
          seo_twitter_title?: string | null
          sort_order?: number
          title: string
          trashed_at?: string | null
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          expire_at?: string | null
          file_size?: string | null
          file_url?: string | null
          id?: string
          is_active?: boolean
          pages?: number | null
          publish_at?: string | null
          seo_canonical_url?: string | null
          seo_description?: string | null
          seo_keywords?: string | null
          seo_og_description?: string | null
          seo_og_image?: string | null
          seo_og_title?: string | null
          seo_title?: string | null
          seo_twitter_description?: string | null
          seo_twitter_image?: string | null
          seo_twitter_title?: string | null
          sort_order?: number
          title?: string
          trashed_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      subjects: {
        Row: {
          category: string
          created_at: string
          icon: string
          id: string
          is_active: boolean
          sort_order: number
          subject_name_bn: string
          subject_name_en: string
        }
        Insert: {
          category?: string
          created_at?: string
          icon?: string
          id?: string
          is_active?: boolean
          sort_order?: number
          subject_name_bn?: string
          subject_name_en?: string
        }
        Update: {
          category?: string
          created_at?: string
          icon?: string
          id?: string
          is_active?: boolean
          sort_order?: number
          subject_name_bn?: string
          subject_name_en?: string
        }
        Relationships: []
      }
      tags: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      teaching_approach: {
        Row: {
          created_at: string
          description_bn: string
          description_en: string
          icon: string
          id: string
          is_active: boolean
          sort_order: number
          title_bn: string
          title_en: string
        }
        Insert: {
          created_at?: string
          description_bn?: string
          description_en?: string
          icon?: string
          id?: string
          is_active?: boolean
          sort_order?: number
          title_bn?: string
          title_en?: string
        }
        Update: {
          created_at?: string
          description_bn?: string
          description_en?: string
          icon?: string
          id?: string
          is_active?: boolean
          sort_order?: number
          title_bn?: string
          title_en?: string
        }
        Relationships: []
      }
      testimonials: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          rating: number
          sort_order: number
          student_info: string
          student_name: string
          testimonial_text_bn: string
          testimonial_text_en: string
          trashed_at: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          rating?: number
          sort_order?: number
          student_info?: string
          student_name: string
          testimonial_text_bn?: string
          testimonial_text_en?: string
          trashed_at?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          rating?: number
          sort_order?: number
          student_info?: string
          student_name?: string
          testimonial_text_bn?: string
          testimonial_text_en?: string
          trashed_at?: string | null
        }
        Relationships: []
      }
      themes: {
        Row: {
          colors: Json
          colors_light: Json | null
          created_at: string
          id: string
          is_active: boolean
          label: string
          name: string
        }
        Insert: {
          colors: Json
          colors_light?: Json | null
          created_at?: string
          id?: string
          is_active?: boolean
          label: string
          name: string
        }
        Update: {
          colors?: Json
          colors_light?: Json | null
          created_at?: string
          id?: string
          is_active?: boolean
          label?: string
          name?: string
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
          role: Database["public"]["Enums"]["app_role"]
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
      visitor_sessions: {
        Row: {
          browser: string | null
          city: string | null
          country: string | null
          device_type: string | null
          ended_at: string | null
          entry_page: string | null
          exit_page: string | null
          id: string
          ip_address: string | null
          is_active: boolean | null
          latitude: number | null
          longitude: number | null
          os: string | null
          pages_viewed: number | null
          referrer: string | null
          screen_resolution: string | null
          session_id: string
          started_at: string
          time_spent_seconds: number | null
        }
        Insert: {
          browser?: string | null
          city?: string | null
          country?: string | null
          device_type?: string | null
          ended_at?: string | null
          entry_page?: string | null
          exit_page?: string | null
          id?: string
          ip_address?: string | null
          is_active?: boolean | null
          latitude?: number | null
          longitude?: number | null
          os?: string | null
          pages_viewed?: number | null
          referrer?: string | null
          screen_resolution?: string | null
          session_id: string
          started_at?: string
          time_spent_seconds?: number | null
        }
        Update: {
          browser?: string | null
          city?: string | null
          country?: string | null
          device_type?: string | null
          ended_at?: string | null
          entry_page?: string | null
          exit_page?: string | null
          id?: string
          ip_address?: string | null
          is_active?: boolean | null
          latitude?: number | null
          longitude?: number | null
          os?: string | null
          pages_viewed?: number | null
          referrer?: string | null
          screen_resolution?: string | null
          session_id?: string
          started_at?: string
          time_spent_seconds?: number | null
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
