import { createBrowserClient } from '@supabase/ssr'

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string | null
          phone: string | null
          avatar_url: string | null
          created_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          phone?: string | null
          avatar_url?: string | null
        }
        Update: {
          full_name?: string | null
          phone?: string | null
          avatar_url?: string | null
        }
      }
      properties: {
        Row: {
          id: string
          owner_id: string
          name: string
          address: string
          city: string
          floors: number | null
          created_at: string
        }
        Insert: {
          owner_id: string
          name: string
          address: string
          city: string
          floors?: number | null
        }
        Update: {
          name?: string
          address?: string
          city?: string
          floors?: number | null
        }
      }
      units: {
        Row: {
          id: string
          property_id: string
          unit_number: string
          floor: number | null
          rent_amount: number
          status: 'vacant' | 'occupied' | 'maintenance'
          created_at: string
        }
        Insert: {
          property_id: string
          unit_number: string
          floor?: number | null
          rent_amount: number
          status?: 'vacant' | 'occupied' | 'maintenance'
        }
        Update: {
          unit_number?: string
          floor?: number | null
          rent_amount?: number
          status?: 'vacant' | 'occupied' | 'maintenance'
        }
      }
      tenants: {
        Row: {
          id: string
          unit_id: string
          full_name: string
          phone: string
          email: string | null
          lease_start: string
          lease_end: string | null
          created_at: string
        }
        Insert: {
          unit_id: string
          full_name: string
          phone: string
          email?: string | null
          lease_start: string
          lease_end?: string | null
        }
        Update: {
          full_name?: string
          phone?: string
          email?: string | null
          lease_end?: string | null
        }
      }
      maintenance_requests: {
        Row: {
          id: string
          unit_id: string
          reported_by: string | null
          title: string
          description: string | null
          priority: 'low' | 'medium' | 'high' | 'urgent'
          status: 'open' | 'in_progress' | 'resolved'
          resolved_at: string | null
          created_at: string
        }
        Insert: {
          unit_id: string
          reported_by?: string | null
          title: string
          description?: string | null
          priority?: 'low' | 'medium' | 'high' | 'urgent'
          status?: 'open' | 'in_progress' | 'resolved'
        }
        Update: {
          title?: string
          description?: string | null
          priority?: 'low' | 'medium' | 'high' | 'urgent'
          status?: 'open' | 'in_progress' | 'resolved'
          resolved_at?: string | null
        }
      }
      payments: {
        Row: {
          id: string
          tenant_id: string | null
          unit_id: string | null
          amount: number
          payment_date: string
          payment_period: string
          payment_method: 'cash' | 'bank_transfer' | 'mobile_money' | 'credit_card' | 'other' | null
          status: 'pending' | 'completed' | 'failed' | 'refunded'
          transaction_id: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          tenant_id?: string | null
          unit_id?: string | null
          amount: number
          payment_date: string
          payment_period: string
          payment_method?: 'cash' | 'bank_transfer' | 'mobile_money' | 'credit_card' | 'other' | null
          status?: 'pending' | 'completed' | 'failed' | 'refunded'
          transaction_id?: string | null
          notes?: string | null
        }
        Update: {
          amount?: number
          payment_date?: string
          payment_period?: string
          payment_method?: 'cash' | 'bank_transfer' | 'mobile_money' | 'credit_card' | 'other' | null
          status?: 'pending' | 'completed' | 'failed' | 'refunded'
          transaction_id?: string | null
          notes?: string | null
        }
      }
    }
  }
}

// Client-side Supabase client (use in components / client components)
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
