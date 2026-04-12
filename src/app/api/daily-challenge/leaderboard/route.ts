import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

const getTodayDate = () => new Date().toISOString().slice(0, 10)

export async function GET(request: NextRequest) {
  try {
    const today = getTodayDate()
    
    // Get today's top 3 attempts
    const { data: topAttempts, error: attemptsError } = await supabase
      .from('daily_attempts')
      .select('player_id, score, total_time_ms, created_at')
      .eq('challenge_date', today)
      .order('score', { ascending: false })
      .order('total_time_ms', { ascending: true })
      .limit(3)

    if (attemptsError) {
      return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 })
    }

    // Get total attempts count for today
    const { count: totalAttempts, error: countError } = await supabase
      .from('daily_attempts')
      .select('*', { count: 'exact', head: true })
      .eq('challenge_date', today)

    if (countError) {
      return NextResponse.json({ error: 'Failed to count attempts' }, { status: 500 })
    }

    return NextResponse.json({
      top3: topAttempts || [],
      totalAttempts: totalAttempts || 0
    })
  } catch (error) {
    console.error('Daily leaderboard error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
