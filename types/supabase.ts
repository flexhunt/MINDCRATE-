export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      levels: {
        Row: {
          id: number
          level_number: number
          title: string
          description: string | null
          passing_score: number
          total_questions: number
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: number
          level_number: number
          title: string
          description?: string | null
          passing_score: number
          total_questions: number
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: number
          level_number?: number
          title?: string
          description?: string | null
          passing_score?: number
          total_questions?: number
          created_at?: string
          updated_at?: string | null
        }
      }
      questions: {
        Row: {
          id: number
          level_id: number
          question_text: string
          option_a: string
          option_b: string
          option_c: string
          option_d: string
          correct_option: string
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: number
          level_id: number
          question_text: string
          option_a: string
          option_b: string
          option_c: string
          option_d: string
          correct_option: string
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: number
          level_id?: number
          question_text?: string
          option_a?: string
          option_b?: string
          option_c?: string
          option_d?: string
          correct_option?: string
          created_at?: string
          updated_at?: string | null
        }
      }
      user_progress: {
        Row: {
          id: number
          user_id: string
          level_id: number
          score: number
          passed: boolean
          completed_at: string
          created_at: string
        }
        Insert: {
          id?: number
          user_id: string
          level_id: number
          score: number
          passed: boolean
          completed_at: string
          created_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          level_id?: number
          score?: number
          passed?: boolean
          completed_at?: string
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_level_unlocked: {
        Args: {
          p_user_id: string
          p_level_number: number
        }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}
