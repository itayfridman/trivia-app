import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface DailyChallenge {
  challenge_date: string
  questions: any[]
  created_at?: string
}

export interface DailyAttempt {
  player_id: string
  challenge_date: string
  score: number
  total_time_ms: number
  created_at?: string
}

export interface Match {
  id: string
  player1_id: string
  player2_id: string | null
  questions: any[]
  player1_score: number
  player2_score: number
  status: 'waiting' | 'pending' | 'active' | 'finished'
  created_at: string
  updated_at?: string
}

export interface WaitingRoom {
  player_id: string
  player_name: string
  created_at: string
}
