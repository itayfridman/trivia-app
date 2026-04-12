import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// Fetch questions for multiplayer match
async function getMultiplayerQuestions() {
  const response = await fetch('https://opentdb.com/api.php?amount=10&type=multiple')
  if (!response.ok) {
    throw new Error('Failed to fetch questions')
  }

  const data = await response.json()
  if (data.response_code !== 0 || !data.results || data.results.length === 0) {
    throw new Error('No questions available')
  }

  return data.results.map((item: any, index: number) => {
    const decodeHtml = (value: string) => {
      const parser = new DOMParser()
      return parser.parseFromString(value, 'text/html').documentElement.textContent || value
    }

    const correctAnswer = decodeHtml(item.correct_answer)
    const incorrectAnswers = item.incorrect_answers.map((answer: string) => decodeHtml(answer))
    const allAnswers = [correctAnswer, ...incorrectAnswers]
    
    // Shuffle answers
    for (let i = allAnswers.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[allAnswers[i], allAnswers[j]] = [allAnswers[j], allAnswers[i]]
    }

    return {
      id: `multiplayer-${Date.now()}-${index}`,
      category: decodeHtml(item.category),
      question: decodeHtml(item.question),
      answers: allAnswers,
      correctAnswerIndex: allAnswers.indexOf(correctAnswer),
      explanation: `Difficulty: ${item.difficulty}. Category: ${decodeHtml(item.category)}.`
    }
  })
}

// Create friend match
export async function POST(request: NextRequest) {
  try {
    const { player1_id, player2_id, player1_name } = await request.json()

    if (!player1_id || !player2_id || !player1_name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Check if there's already a pending match between these players
    const { data: existingMatch, error: checkError } = await supabase
      .from('matches')
      .select('*')
      .or(`and(player1_id.eq.${player1_id},player2_id.eq.${player2_id}),and(player1_id.eq.${player2_id},player2_id.eq.${player1_id})`)
      .in('status', ['pending', 'active'])
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    if (existingMatch) {
      return NextResponse.json({ error: 'Match already exists' }, { status: 400 })
    }

    // Get questions for the match
    const questions = await getMultiplayerQuestions()

    // Create the match
    const { data: match, error: insertError } = await supabase
      .from('matches')
      .insert({
        player1_id,
        player2_id,
        questions,
        status: 'pending'
      })
      .select()
      .single()

    if (insertError) {
      return NextResponse.json({ error: 'Failed to create match' }, { status: 500 })
    }

    return NextResponse.json({ match })
  } catch (error) {
    console.error('Friend match error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Join random match
export async function PUT(request: NextRequest) {
  try {
    const { player_id, player_name } = await request.json()

    if (!player_id || !player_name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Check if player is already in waiting room
    const { data: existingWaiter, error: checkError } = await supabase
      .from('waiting_room')
      .select('*')
      .eq('player_id', player_id)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    if (existingWaiter) {
      return NextResponse.json({ error: 'Already in waiting room' }, { status: 400 })
    }

    // Add player to waiting room
    const { error: waitError } = await supabase
      .from('waiting_room')
      .insert({
        player_id,
        player_name
      })

    if (waitError) {
      return NextResponse.json({ error: 'Failed to join waiting room' }, { status: 500 })
    }

    // Check if there are 2 players waiting
    const { data: waiters, error: fetchError } = await supabase
      .from('waiting_room')
      .select('*')
      .order('created_at', { ascending: true })
      .limit(2)

    if (fetchError) {
      return NextResponse.json({ error: 'Failed to check waiting room' }, { status: 500 })
    }

    // If we have 2 players, create a match
    if (waiters && waiters.length >= 2) {
      const player1 = waiters[0]
      const player2 = waiters[1]

      // Get questions for the match
      const questions = await getMultiplayerQuestions()

      // Create the match
      const { data: match, error: matchError } = await supabase
        .from('matches')
        .insert({
          player1_id: player1.player_id,
          player2_id: player2.player_id,
          questions,
          status: 'active'
        })
        .select()
        .single()

      if (matchError) {
        return NextResponse.json({ error: 'Failed to create match' }, { status: 500 })
      }

      // Remove both players from waiting room
      await supabase
        .from('waiting_room')
        .delete()
        .in('player_id', [player1.player_id, player2.player_id])

      return NextResponse.json({ match, waiting: false })
    }

    return NextResponse.json({ waiting: true })
  } catch (error) {
    console.error('Random match error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Leave waiting room
export async function DELETE(request: NextRequest) {
  try {
    const { player_id } = await request.json()

    if (!player_id) {
      return NextResponse.json({ error: 'Missing player_id' }, { status: 400 })
    }

    const { error } = await supabase
      .from('waiting_room')
      .delete()
      .eq('player_id', player_id)

    if (error) {
      return NextResponse.json({ error: 'Failed to leave waiting room' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Leave waiting room error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
