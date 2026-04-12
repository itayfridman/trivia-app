import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

const getTodayDate = () => new Date().toISOString().slice(0, 10)

export async function GET(request: NextRequest) {
  try {
    const today = getTodayDate()
    
    // Check if today's challenge already exists
    const { data: existingChallenge, error: fetchError } = await supabase
      .from('daily_challenges')
      .select('questions')
      .eq('challenge_date', today)
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') {
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    // If challenge exists, return it
    if (existingChallenge) {
      return NextResponse.json({ questions: existingChallenge.questions })
    }

    // Fetch new questions from Open Trivia DB
    const response = await fetch('https://opentdb.com/api.php?amount=10&type=multiple')
    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 })
    }

    const data = await response.json()
    if (data.response_code !== 0 || !data.results || data.results.length === 0) {
      return NextResponse.json({ error: 'No questions available' }, { status: 500 })
    }

    // Process questions
    const processedQuestions = data.results.map((item: any, index: number) => {
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
        id: `daily-${today}-${index}`,
        category: decodeHtml(item.category),
        question: decodeHtml(item.question),
        answers: allAnswers,
        correctAnswerIndex: allAnswers.indexOf(correctAnswer),
        explanation: `Difficulty: ${item.difficulty}. Category: ${decodeHtml(item.category)}.`
      }
    })

    // Store in database
    const { error: insertError } = await supabase
      .from('daily_challenges')
      .insert({
        challenge_date: today,
        questions: processedQuestions
      })

    if (insertError) {
      return NextResponse.json({ error: 'Failed to save challenge' }, { status: 500 })
    }

    return NextResponse.json({ questions: processedQuestions })
  } catch (error) {
    console.error('Daily challenge error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { player_id, score, total_time_ms } = await request.json()
    const today = getTodayDate()

    if (!player_id || typeof score !== 'number' || typeof total_time_ms !== 'number') {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }

    // Check if player already attempted today
    const { data: existingAttempt, error: checkError } = await supabase
      .from('daily_attempts')
      .select('id')
      .eq('player_id', player_id)
      .eq('challenge_date', today)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    if (existingAttempt) {
      return NextResponse.json({ error: 'Already attempted today' }, { status: 400 })
    }

    // Record the attempt
    const { error: insertError } = await supabase
      .from('daily_attempts')
      .insert({
        player_id,
        challenge_date: today,
        score,
        total_time_ms
      })

    if (insertError) {
      return NextResponse.json({ error: 'Failed to save attempt' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Daily attempt error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
