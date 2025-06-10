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
      case_access_log: {
        Row: {
          case_id: string
          created_at: string | null
          id: string
          metadata: Json | null
          view_source: string | null
          viewer_id: string
        }
        Insert: {
          case_id: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          view_source?: string | null
          viewer_id: string
        }
        Update: {
          case_id?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          view_source?: string | null
          viewer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "case_access_log_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_access_log_viewer_id_fkey"
            columns: ["viewer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      case_activities: {
        Row: {
          activity_type: string
          actor_id: string | null
          case_id: string
          created_at: string | null
          description: string | null
          duration_minutes: number | null
          id: string
          message: string | null
          performed_by: string
          timestamp: string | null
          travel_minutes: number | null
          updated_at: string | null
        }
        Insert: {
          activity_type: string
          actor_id?: string | null
          case_id: string
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          message?: string | null
          performed_by: string
          timestamp?: string | null
          travel_minutes?: number | null
          updated_at?: string | null
        }
        Update: {
          activity_type?: string
          actor_id?: string | null
          case_id?: string
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          message?: string | null
          performed_by?: string
          timestamp?: string | null
          travel_minutes?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "case_activities_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_activities_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_activities_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      case_attachments: {
        Row: {
          case_id: string
          created_at: string | null
          file_name: string
          file_type: string | null
          file_url: string
          id: string
          is_private: boolean | null
          uploaded_by: string | null
        }
        Insert: {
          case_id: string
          created_at?: string | null
          file_name: string
          file_type?: string | null
          file_url: string
          id?: string
          is_private?: boolean | null
          uploaded_by?: string | null
        }
        Update: {
          case_id?: string
          created_at?: string | null
          file_name?: string
          file_type?: string | null
          file_url?: string
          id?: string
          is_private?: boolean | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "case_attachments_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_attachments_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      case_audit_log: {
        Row: {
          actor_id: string
          case_id: string
          created_at: string | null
          field_name: string
          id: string
          metadata: Json | null
          new_value: string | null
          old_value: string | null
          reason: string | null
        }
        Insert: {
          actor_id: string
          case_id: string
          created_at?: string | null
          field_name: string
          id?: string
          metadata?: Json | null
          new_value?: string | null
          old_value?: string | null
          reason?: string | null
        }
        Update: {
          actor_id?: string
          case_id?: string
          created_at?: string | null
          field_name?: string
          id?: string
          metadata?: Json | null
          new_value?: string | null
          old_value?: string | null
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "case_audit_log_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_audit_log_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      case_categories: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          parent_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          parent_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          parent_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "case_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "case_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      case_export_log: {
        Row: {
          created_at: string | null
          export_type: string
          exported_by: string
          filter_summary: string | null
          id: string
          metadata: Json | null
        }
        Insert: {
          created_at?: string | null
          export_type: string
          exported_by: string
          filter_summary?: string | null
          id?: string
          metadata?: Json | null
        }
        Update: {
          created_at?: string | null
          export_type?: string
          exported_by?: string
          filter_summary?: string | null
          id?: string
          metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "case_export_log_exported_by_fkey"
            columns: ["exported_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      case_feedback: {
        Row: {
          case_id: string
          comment: string | null
          context: string | null
          id: string
          rating: number | null
          resolved_satisfaction: boolean | null
          staff_score: string | null
          submitted_at: string | null
          submitted_by: string | null
          would_use_again: boolean | null
        }
        Insert: {
          case_id: string
          comment?: string | null
          context?: string | null
          id?: string
          rating?: number | null
          resolved_satisfaction?: boolean | null
          staff_score?: string | null
          submitted_at?: string | null
          submitted_by?: string | null
          would_use_again?: boolean | null
        }
        Update: {
          case_id?: string
          comment?: string | null
          context?: string | null
          id?: string
          rating?: number | null
          resolved_satisfaction?: boolean | null
          staff_score?: string | null
          submitted_at?: string | null
          submitted_by?: string | null
          would_use_again?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "case_feedback_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_feedback_submitted_by_fkey"
            columns: ["submitted_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      case_messages: {
        Row: {
          case_id: string
          created_at: string | null
          id: string
          is_internal: boolean | null
          is_pinned: boolean | null
          message: string
          sender_id: string
          updated_at: string | null
        }
        Insert: {
          case_id: string
          created_at?: string | null
          id?: string
          is_internal?: boolean | null
          is_pinned?: boolean | null
          message: string
          sender_id: string
          updated_at?: string | null
        }
        Update: {
          case_id?: string
          created_at?: string | null
          id?: string
          is_internal?: boolean | null
          is_pinned?: boolean | null
          message?: string
          sender_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "case_messages_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      case_notes: {
        Row: {
          author_id: string
          case_id: string
          created_at: string | null
          id: string
          is_internal: boolean | null
          is_pinned: boolean | null
          note: string
          updated_at: string | null
        }
        Insert: {
          author_id: string
          case_id: string
          created_at?: string | null
          id?: string
          is_internal?: boolean | null
          is_pinned?: boolean | null
          note: string
          updated_at?: string | null
        }
        Update: {
          author_id?: string
          case_id?: string
          created_at?: string | null
          id?: string
          is_internal?: boolean | null
          is_pinned?: boolean | null
          note?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "case_notes_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_notes_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      case_sla_policies: {
        Row: {
          category_id: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          priority: string
          sla_hours: number
        }
        Insert: {
          category_id?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          priority: string
          sla_hours: number
        }
        Update: {
          category_id?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          priority?: string
          sla_hours?: number
        }
        Relationships: [
          {
            foreignKeyName: "case_sla_policies_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "case_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      case_tasks: {
        Row: {
          assigned_to: string | null
          case_id: string
          created_at: string | null
          created_by: string | null
          due_date: string | null
          id: string
          status: string
          task_name: string
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          case_id: string
          created_at?: string | null
          created_by?: string | null
          due_date?: string | null
          id?: string
          status?: string
          task_name: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          case_id?: string
          created_at?: string | null
          created_by?: string | null
          due_date?: string | null
          id?: string
          status?: string
          task_name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "case_tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_tasks_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      case_watchers: {
        Row: {
          added_by: string | null
          case_id: string
          created_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          added_by?: string | null
          case_id: string
          created_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          added_by?: string | null
          case_id?: string
          created_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "case_watchers_added_by_fkey"
            columns: ["added_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_watchers_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_watchers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      cases: {
        Row: {
          assigned_to: string | null
          category_id: string | null
          created_at: string | null
          description: string | null
          id: string
          is_archived: boolean | null
          location: string | null
          priority: string | null
          sla_due_at: string | null
          status: string
          submitted_by: string
          tags: string[] | null
          title: string
          updated_at: string | null
          visibility: string | null
        }
        Insert: {
          assigned_to?: string | null
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_archived?: boolean | null
          location?: string | null
          priority?: string | null
          sla_due_at?: string | null
          status?: string
          submitted_by: string
          tags?: string[] | null
          title: string
          updated_at?: string | null
          visibility?: string | null
        }
        Update: {
          assigned_to?: string | null
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_archived?: boolean | null
          location?: string | null
          priority?: string | null
          sla_due_at?: string | null
          status?: string
          submitted_by?: string
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          visibility?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cases_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cases_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "case_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cases_submitted_by_fkey"
            columns: ["submitted_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      category_sla_matrix: {
        Row: {
          category_id: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          sla_high: number | null
          sla_low: number | null
          sla_medium: number | null
          sla_urgent: number | null
        }
        Insert: {
          category_id?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          sla_high?: number | null
          sla_low?: number | null
          sla_medium?: number | null
          sla_urgent?: number | null
        }
        Update: {
          category_id?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          sla_high?: number | null
          sla_low?: number | null
          sla_medium?: number | null
          sla_urgent?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "category_sla_matrix_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "case_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      dashboard_layouts: {
        Row: {
          created_at: string
          dashboard_id: string
          id: string
          layout_data: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          dashboard_id: string
          id?: string
          layout_data?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          dashboard_id?: string
          id?: string
          layout_data?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      dashboard_templates: {
        Row: {
          created_at: string | null
          created_by: string
          description: string | null
          id: string
          is_active: boolean | null
          layout: Json
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          layout?: Json
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          layout?: Json
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dashboard_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      data_sources: {
        Row: {
          created_at: string | null
          description: string | null
          fields: Json
          id: string
          is_active: boolean | null
          name: string
          relationships: Json
          table_name: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          fields?: Json
          id?: string
          is_active?: boolean | null
          name: string
          relationships?: Json
          table_name: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          fields?: Json
          id?: string
          is_active?: boolean | null
          name?: string
          relationships?: Json
          table_name?: string
        }
        Relationships: []
      }
      frontend_registry: {
        Row: {
          created_at: string
          element_key: string
          element_type: string
          id: string
          is_active: boolean
          label: string | null
          module: string
          screen: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          element_key: string
          element_type: string
          id?: string
          is_active?: boolean
          label?: string | null
          module: string
          screen: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          element_key?: string
          element_type?: string
          id?: string
          is_active?: boolean
          label?: string | null
          module?: string
          screen?: string
          updated_at?: string
        }
        Relationships: []
      }
      locations: {
        Row: {
          address: string | null
          city: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          latitude: number | null
          longitude: number | null
          name: string
          state: string | null
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          latitude?: number | null
          longitude?: number | null
          name: string
          state?: string | null
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          latitude?: number | null
          longitude?: number | null
          name?: string
          state?: string | null
          zip_code?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          case_id: string | null
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          notification_type: string | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          case_id?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          notification_type?: string | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          case_id?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          notification_type?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      permissions: {
        Row: {
          can_edit: boolean
          can_view: boolean
          created_at: string
          frontend_registry_id: string
          id: string
          role_id: string
          updated_at: string
        }
        Insert: {
          can_edit?: boolean
          can_view?: boolean
          created_at?: string
          frontend_registry_id: string
          id?: string
          role_id: string
          updated_at?: string
        }
        Update: {
          can_edit?: boolean
          can_view?: boolean
          created_at?: string
          frontend_registry_id?: string
          id?: string
          role_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "permissions_frontend_registry_id_fkey"
            columns: ["frontend_registry_id"]
            isOneToOne: false
            referencedRelation: "frontend_registry"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      related_cases: {
        Row: {
          case_id: string
          created_at: string | null
          created_by: string | null
          id: string
          related_case_id: string
          relationship_type: string
        }
        Insert: {
          case_id: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          related_case_id: string
          relationship_type: string
        }
        Update: {
          case_id?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          related_case_id?: string
          relationship_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "related_cases_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "related_cases_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "related_cases_related_case_id_fkey"
            columns: ["related_case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      report_configs: {
        Row: {
          config: Json
          created_at: string
          created_by: string
          description: string | null
          id: string
          is_public: boolean
          name: string
          target_module: string
          updated_at: string
        }
        Insert: {
          config?: Json
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          is_public?: boolean
          name: string
          target_module: string
          updated_at?: string
        }
        Update: {
          config?: Json
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          is_public?: boolean
          name?: string
          target_module?: string
          updated_at?: string
        }
        Relationships: []
      }
      report_templates: {
        Row: {
          base_table: string
          config: Json
          created_at: string | null
          created_by: string
          description: string | null
          id: string
          is_active: boolean | null
          is_public: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          base_table: string
          config?: Json
          created_at?: string | null
          created_by: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_public?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          base_table?: string
          config?: Json
          created_at?: string | null
          created_by?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_public?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "report_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          aggregation: string | null
          base_table: string
          chart_type: string | null
          created_at: string
          created_by: string
          date_grouping: string | null
          description: string | null
          filters: Json
          group_by: string | null
          id: string
          is_public: boolean
          module: string
          name: string
          selected_fields: Json
          updated_at: string
        }
        Insert: {
          aggregation?: string | null
          base_table: string
          chart_type?: string | null
          created_at?: string
          created_by: string
          date_grouping?: string | null
          description?: string | null
          filters?: Json
          group_by?: string | null
          id?: string
          is_public?: boolean
          module: string
          name: string
          selected_fields?: Json
          updated_at?: string
        }
        Update: {
          aggregation?: string | null
          base_table?: string
          chart_type?: string | null
          created_at?: string
          created_by?: string
          date_grouping?: string | null
          description?: string | null
          filters?: Json
          group_by?: string | null
          id?: string
          is_public?: boolean
          module?: string
          name?: string
          selected_fields?: Json
          updated_at?: string
        }
        Relationships: []
      }
      roles: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          is_system: boolean | null
          name: string
          role_type: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_system?: boolean | null
          name: string
          role_type?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_system?: boolean | null
          name?: string
          role_type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_audit_log: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string | null
          details: string | null
          id: string
          metadata: Json | null
          resource_id: string | null
          resource_type: string | null
          user_id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string | null
          details?: string | null
          id?: string
          metadata?: Json | null
          resource_id?: string | null
          resource_type?: string | null
          user_id: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string | null
          details?: string | null
          id?: string
          metadata?: Json | null
          resource_id?: string | null
          resource_type?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_audit_log_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_audit_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          auth_user_id: string | null
          created_at: string | null
          created_by: string | null
          email: string
          id: string
          is_active: boolean | null
          last_login: string | null
          name: string
          role_id: string
          updated_at: string | null
          user_type: string | null
        }
        Insert: {
          auth_user_id?: string | null
          created_at?: string | null
          created_by?: string | null
          email: string
          id?: string
          is_active?: boolean | null
          last_login?: string | null
          name: string
          role_id: string
          updated_at?: string | null
          user_type?: string | null
        }
        Update: {
          auth_user_id?: string | null
          created_at?: string | null
          created_by?: string | null
          email?: string
          id?: string
          is_active?: boolean | null
          last_login?: string | null
          name?: string
          role_id?: string
          updated_at?: string | null
          user_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_edit_case: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      cleanup_duplicate_permissions: {
        Args: { p_role_id: string }
        Returns: undefined
      }
      create_case_with_sla: {
        Args: {
          _title: string
          _description: string
          _category_id: string
          _priority: string
          _location: string
          _submitted_by: string
          _visibility: string
          _tags: string[]
        }
        Returns: {
          id: string
          title: string
          description: string
          category_id: string
          priority: string
          location: string
          status: string
          submitted_by: string
          sla_due_at: string
          visibility: string
          tags: string[]
          created_at: string
        }[]
      }
      create_role: {
        Args: { role_name: string; role_description: string }
        Returns: string
      }
      current_user_can_access: {
        Args: {
          p_module_name: string
          p_field_name?: string
          p_permission_type?: string
        }
        Returns: boolean
      }
      current_user_has_frontend_permission: {
        Args: { p_element_key: string; p_permission_type?: string }
        Returns: boolean
      }
      execute_dynamic_report: {
        Args: { p_config: Json }
        Returns: Json
      }
      execute_insight_query: {
        Args: {
          data_source_name: string
          selected_fields: Json
          filters?: Json
          group_by_fields?: Json
          aggregations?: Json
          limit_count?: number
        }
        Returns: Json
      }
      execute_query: {
        Args: { query_text: string }
        Returns: Json
      }
      get_current_internal_user_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_current_user_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_current_user_role_name: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_table_metadata: {
        Args: Record<PropertyKey, never>
        Returns: {
          table_name: string
          column_name: string
          data_type: string
          is_nullable: boolean
          column_default: string
        }[]
      }
      get_tables_info: {
        Args: Record<PropertyKey, never>
        Returns: {
          name: string
          schema: string
          fields: string[]
        }[]
      }
      get_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      has_manager_access: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_admin_user: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_case_worker_user: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_current_user_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_internal_user: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      populate_data_sources: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      user_has_frontend_permission: {
        Args: {
          p_user_id: string
          p_element_key: string
          p_permission_type?: string
        }
        Returns: boolean
      }
      user_has_permission: {
        Args: {
          p_user_id: string
          p_module_name: string
          p_field_name?: string
          p_permission_type?: string
        }
        Returns: boolean
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
