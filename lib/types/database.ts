// Database types for SmartQ2 Queue Management System
// Generated based on Supabase schema

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          name: string
          phone: string | null
          email: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          phone?: string | null
          email?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          phone?: string | null
          email?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      appointments: {
        Row: {
          id: string
          user_id: string
          date: string
          scheduled_time: string
          status: 'booked' | 'arrived' | 'no_show' | 'served' | 'cancelled'
          ticket_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          date: string
          scheduled_time: string
          status?: 'booked' | 'arrived' | 'no_show' | 'served' | 'cancelled'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          date?: string
          scheduled_time?: string
          status?: 'booked' | 'arrived' | 'no_show' | 'served' | 'cancelled'
          created_at?: string
          updated_at?: string
        }
      }
      walk_ins: {
        Row: {
          id: string
          user_id: string
          check_in_time: string
          status: 'pending' | 'served' | 'cancelled'
          original_appointment_id: string | null
          ticket_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          check_in_time?: string
          status?: 'pending' | 'served' | 'cancelled'
          original_appointment_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          check_in_time?: string
          status?: 'pending' | 'served' | 'cancelled'
          original_appointment_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      current_queue: {
        Row: {
          type: 'appointment' | 'walk_in'
          id: string
          ticket_id: string
          name: string
          phone: string | null
          email: string | null
          queue_time: string
          status: string
          scheduled_time: string | null
          check_in_time: string | null
          original_appointment_id: string | null
        }
      }
    }
    Functions: {
      get_available_slots: {
        Args: {
          target_date: string
        }
        Returns: {
          slot_time: string
        }[]
      }
    }
  }
}

// Convenience types
export type User = Database['public']['Tables']['users']['Row']
export type UserInsert = Database['public']['Tables']['users']['Insert']
export type UserUpdate = Database['public']['Tables']['users']['Update']

export type Appointment = Database['public']['Tables']['appointments']['Row']
export type AppointmentInsert = Database['public']['Tables']['appointments']['Insert']
export type AppointmentUpdate = Database['public']['Tables']['appointments']['Update']

export type WalkIn = Database['public']['Tables']['walk_ins']['Row']
export type WalkInInsert = Database['public']['Tables']['walk_ins']['Insert']
export type WalkInUpdate = Database['public']['Tables']['walk_ins']['Update']

export type QueueItem = Database['public']['Views']['current_queue']['Row']

// Status enums
export const AppointmentStatus = {
  BOOKED: 'booked',
  ARRIVED: 'arrived',
  NO_SHOW: 'no_show',
  SERVED: 'served',
  CANCELLED: 'cancelled'
} as const

export const WalkInStatus = {
  PENDING: 'pending',
  SERVED: 'served',
  CANCELLED: 'cancelled'
} as const

export type AppointmentStatusType = typeof AppointmentStatus[keyof typeof AppointmentStatus]
export type WalkInStatusType = typeof WalkInStatus[keyof typeof WalkInStatus] 