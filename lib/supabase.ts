import { createClient } from '@supabase/supabase-js'

// Types pour notre base de données
export interface Ticket {
  id: number
  title: string
  color: string
  date: string | null  // Format: YYYY-MM-DD
  hour: number | null  // -1 pour toute la journée, 0-23 pour une heure spécifique
  created_at?: string
  updated_at?: string
}

// Configuration Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)