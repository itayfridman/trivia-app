import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  try {
    const { matchId } = await params

    const { data: match, error } = await supabase
      .from('matches')
      .select('*')
      .eq('id', matchId)
      .single()

    if (error) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 })
    }

    return NextResponse.json({ match })
  } catch (error) {
    console.error('Get match error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  try {
    const { matchId } = await params
    const { player_id, score } = await request.json()

    if (!player_id || typeof score !== 'number') {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }

    // Get current match
    const { data: currentMatch, error: fetchError } = await supabase
      .from('matches')
      .select('*')
      .eq('id', matchId)
      .single()

    if (fetchError) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 })
    }

    // Update the appropriate player's score
    const updateData: any = {}
    if (currentMatch.player1_id === player_id) {
      updateData.player1_score = score
    } else if (currentMatch.player2_id === player_id) {
      updateData.player2_score = score
    } else {
      return NextResponse.json({ error: 'Player not in match' }, { status: 400 })
    }

    updateData.updated_at = new Date().toISOString()

    const { data: match, error: updateError } = await supabase
      .from('matches')
      .update(updateData)
      .eq('id', matchId)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update match' }, { status: 500 })
    }

    return NextResponse.json({ match })
  } catch (error) {
    console.error('Update match error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  try {
    const { matchId } = await params
    const { player_id, status } = await request.json()

    if (!player_id || !status) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }

    // Get current match
    const { data: currentMatch, error: fetchError } = await supabase
      .from('matches')
      .select('*')
      .eq('id', matchId)
      .single()

    if (fetchError) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 })
    }

    // Verify player is in the match
    if (currentMatch.player1_id !== player_id && currentMatch.player2_id !== player_id) {
      return NextResponse.json({ error: 'Player not in match' }, { status: 400 })
    }

    // Update match status
    const { data: match, error: updateError } = await supabase
      .from('matches')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', matchId)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update match status' }, { status: 500 })
    }

    return NextResponse.json({ match })
  } catch (error) {
    console.error('Update match status error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
