import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import questions from "@/data/questions.json";

type PlayerPayload = {
  playerId: string;
  playerName: string;
  coins?: number;
  elo?: number;
};

type DailySubmitPayload = {
  playerId: string;
  score: number;
  correctAnswers: number;
  totalTimeMs: number;
};

type MatchmakePayload = {
  playerId: string;
  mode: "random" | "friend";
  friendId?: string;
};

type MatchProgressPayload = {
  matchId: string;
  playerId: string;
  answeredCount: number;
  correctAnswers: number;
  totalTimeMs: number;
  finished: boolean;
};

type FriendInviteResponsePayload = {
  playerId: string;
  matchId: string;
  accepted: boolean;
};

const getTodayUtcDate = (): string => new Date().toISOString().slice(0, 10);
const MATCH_STALE_MS = 1000 * 60 * 20;

const getSupabase = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  return createClient(url, anonKey, { auth: { persistSession: false } });
};

const sanitizePlayerId = (value: unknown): string =>
  typeof value === "string" && /^TRV-[A-Z0-9]{4}$/.test(value.trim().toUpperCase()) ? value.trim().toUpperCase() : "";

const selectDailyQuestions = async () => {
  try {
    // Fetch 50 questions from Open Trivia DB to ensure variety
    const params = new URLSearchParams({
      amount: "50",
      type: "multiple",
    });
    const response = await fetch(`https://opentdb.com/api.php?${params.toString()}`);
    if (!response.ok) {
      throw new Error("Could not fetch daily questions from Open Trivia DB.");
    }
    const data = (await response.json()) as { response_code: number; results: any[] };
    if (!Array.isArray(data.results) || data.results.length === 0) {
      throw new Error("No questions received from Open Trivia DB.");
    }
    
    // Convert to our format and shuffle
    const converted = data.results.map((item, index) => {
      const decodedCorrect = decodeHtml(item.correct_answer);
      const answers = shuffleAnswers([decodedCorrect, ...item.incorrect_answers.map((answer: string) => decodeHtml(answer))]);
      return {
        id: `daily-${Date.now()}-${index}`,
        category: "Daily Challenge",
        question: decodeHtml(item.question),
        answers,
        correctAnswerIndex: answers.findIndex((answer) => answer === decodedCorrect),
        explanation: `Difficulty: ${item.difficulty}. Category: ${decodeHtml(item.category)}.`,
      };
    });
    
    // Shuffle and pick 10 questions
    const shuffled = shuffleAnswers(converted);
    return shuffled.slice(0, 10);
  } catch (error) {
    console.error('Failed to fetch daily questions from API:', error);
    // Fallback to local questions if API fails
    const pool = [...questions];
    const picked = [];
    while (picked.length < 10 && pool.length > 0) {
      const idx = Math.floor(Math.random() * pool.length);
      const [next] = pool.splice(idx, 1);
      picked.push(next);
    }
    return picked;
  }
};

const decodeHtml = (value: string): string => {
  if (typeof window === "undefined") {
    return value;
  }
  const parser = new DOMParser();
  return parser.parseFromString(value, "text/html").documentElement.textContent ?? value;
};

const shuffleAnswers = (items: any[]): any[] => {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

const ensureDailyChallenge = async (supabase: any) => {
  const today = getTodayUtcDate();
  const db = supabase as any;
  const { data: existing, error: readErr } = await db
    .from("daily_challenges")
    .select("challenge_date, questions")
    .eq("challenge_date", today)
    .limit(1)
    .maybeSingle();
  if (readErr) return { error: readErr };
  if (existing?.questions) {
    return { today, questions: existing.questions as typeof questions };
  }
  const generated = await selectDailyQuestions();
  const { data: inserted, error: insertErr } = await db
    .from("daily_challenges")
    .upsert(
      {
        challenge_date: today,
        questions: generated,
        generated_at: new Date().toISOString(),
      },
      { onConflict: "challenge_date" },
    )
    .select("challenge_date, questions")
    .single();
  if (insertErr) return { error: insertErr };
  return { today, questions: (inserted?.questions as typeof questions) ?? generated };
};

export async function GET(request: Request) {
  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 500 });
  }
  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action");

  if (action === "daily") {
    const playerId = sanitizePlayerId(searchParams.get("playerId"));
    const generated = await ensureDailyChallenge(supabase);
    if ("error" in generated) {
      return NextResponse.json({ error: "Could not generate daily challenge." }, { status: 500 });
    }
    const today = generated.today;
    const { data, error } = await supabase
      .from("daily_challenge_results")
      .select("player_id, score, total_time_ms")
      .eq("challenge_date", today)
      .order("score", { ascending: false })
      .order("total_time_ms", { ascending: true });
    if (error) {
      return NextResponse.json({ error: "Could not load daily challenge data." }, { status: 500 });
    }
    let hasAttemptedToday = false;
    if (playerId) {
      const { data: mine } = await supabase
        .from("daily_challenge_results")
        .select("player_id")
        .eq("challenge_date", today)
        .eq("player_id", playerId)
        .limit(1);
      hasAttemptedToday = Boolean(mine && mine.length > 0);
    }
    return NextResponse.json({
      today,
      questions: generated.questions,
      completedCount: data?.length ?? 0,
      top3: (data ?? []).slice(0, 3),
      hasAttemptedToday,
    });
  }

  if (action === "match" && searchParams.get("matchId")) {
    const matchId = searchParams.get("matchId");
    const { data, error } = await supabase.from("matches").select("*").eq("id", matchId).single();
    if (error) {
      return NextResponse.json({ error: "Could not load match." }, { status: 500 });
    }
    return NextResponse.json({ match: data });
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}

export async function POST(request: Request) {
  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 500 });
  }
  const body = (await request.json()) as { action?: string } & Record<string, unknown>;
  const action = body.action;

  if (action === "upsert-player") {
    const payload = body as unknown as PlayerPayload;
    const playerId = sanitizePlayerId(payload.playerId);
    const playerName = typeof payload.playerName === "string" ? payload.playerName.trim().slice(0, 24) : "";
    const coins = Math.max(0, Math.floor(Number(payload.coins ?? 0)));
    const elo = Math.max(0, Math.floor(Number(payload.elo ?? 1000)));
    if (!playerId || !playerName) {
      return NextResponse.json({ error: "Invalid player payload." }, { status: 400 });
    }
    const { error } = await supabase.from("players").upsert({
      player_id: playerId,
      player_name: playerName,
      coins,
      elo,
      updated_at: new Date().toISOString(),
    });
    if (error) {
      return NextResponse.json({ error: "Could not save player." }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  }

  if (action === "daily-submit") {
    const payload = body as unknown as DailySubmitPayload;
    const playerId = sanitizePlayerId(payload.playerId);
    if (!playerId) {
      return NextResponse.json({ error: "Invalid player ID." }, { status: 400 });
    }
    const today = getTodayUtcDate();
    const score = Math.max(0, Math.floor(Number(payload.score ?? 0)));
    const correctAnswers = Math.max(0, Math.floor(Number(payload.correctAnswers ?? 0)));
    const totalTimeMs = Math.max(0, Math.floor(Number(payload.totalTimeMs ?? 0)));
    const { data: existing } = await supabase
      .from("daily_challenge_results")
      .select("player_id")
      .eq("challenge_date", today)
      .eq("player_id", playerId)
      .limit(1);
    if (existing && existing.length > 0) {
      return NextResponse.json({ error: "You already completed today's challenge.", today }, { status: 409 });
    }
    const { error } = await supabase.from("daily_challenge_results").insert({
      challenge_date: today,
      player_id: playerId,
      score,
      correct_answers: correctAnswers,
      total_time_ms: totalTimeMs,
      created_at: new Date().toISOString(),
    });
    if (error) {
      return NextResponse.json({ error: "Could not submit daily challenge result." }, { status: 500 });
    }
    return NextResponse.json({ ok: true, today });
  }

  if (action === "matchmake") {
    const payload = body as unknown as MatchmakePayload;
    const playerId = sanitizePlayerId(payload.playerId);
    if (!playerId) {
      return NextResponse.json({ error: "Invalid player ID." }, { status: 400 });
    }
    if (payload.mode === "friend") {
      const friendId = sanitizePlayerId(payload.friendId);
      if (!friendId || friendId === playerId) {
        return NextResponse.json({ error: "Invalid friend ID." }, { status: 400 });
      }
      const { data: existingActive } = await supabase
        .from("matches")
        .select("*")
        .or(`and(player1_id.eq.${playerId},player2_id.eq.${friendId}),and(player1_id.eq.${friendId},player2_id.eq.${playerId})`)
        .eq("mode", "friend")
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1);
      if (existingActive && existingActive.length > 0) {
        return NextResponse.json({ match: existingActive[0] });
      }

      const { data: incomingPending } = await supabase
        .from("matches")
        .select("*")
        .eq("mode", "friend")
        .eq("status", "pending")
        .eq("player1_id", friendId)
        .eq("player2_id", playerId)
        .order("created_at", { ascending: false })
        .limit(1);
      if (incomingPending && incomingPending.length > 0) {
        const selected = incomingPending[0];
        const { data: activated, error: activateError } = await supabase
          .from("matches")
          .update({ status: "active" })
          .eq("id", selected.id)
          .select("*")
          .single();
        if (activateError || !activated) {
          return NextResponse.json({ error: "Could not join friend match." }, { status: 500 });
        }
        return NextResponse.json({ match: activated });
      }

      const staleBefore = new Date(Date.now() - MATCH_STALE_MS).toISOString();
      const { data: waitingInvite } = await supabase
        .from("matches")
        .select("*")
        .eq("mode", "friend")
        .eq("status", "pending")
        .eq("player1_id", playerId)
        .eq("player2_id", friendId)
        .gte("created_at", staleBefore)
        .order("created_at", { ascending: false })
        .limit(1);
      if (waitingInvite && waitingInvite.length > 0) {
        return NextResponse.json({ waiting: true, match: waitingInvite[0] });
      }

      const generated = await ensureDailyChallenge(supabase);
      if ("error" in generated) {
        return NextResponse.json({ error: "Could not prepare friend match questions." }, { status: 500 });
      }
      const qs = generated.questions;
      const { data, error } = await supabase
        .from("matches")
        .insert({
          player1_id: playerId,
          player2_id: friendId,
          mode: "friend",
          status: "pending",
          questions: qs,
          created_at: new Date().toISOString(),
        })
        .select("*")
        .single();
      if (error) {
        return NextResponse.json({ error: "Could not create match." }, { status: 500 });
      }
      return NextResponse.json({ waiting: true, match: data });
    }

    const { data: queued } = await supabase
      .from("match_queue")
      .select("player_id")
      .neq("player_id", playerId)
      .order("created_at", { ascending: true })
      .limit(1);

    if (queued && queued.length > 0) {
      const opponentId = sanitizePlayerId(queued[0].player_id);
      const generated = await ensureDailyChallenge(supabase);
      if ("error" in generated) {
        return NextResponse.json({ error: "Could not prepare random match questions." }, { status: 500 });
      }
      const qs = generated.questions;
      const { data: match, error: matchErr } = await supabase
        .from("matches")
        .insert({
          player1_id: opponentId,
          player2_id: playerId,
          mode: "random",
          status: "active",
          questions: qs,
          created_at: new Date().toISOString(),
        })
        .select("*")
        .single();
      if (matchErr) {
        return NextResponse.json({ error: "Could not create random match." }, { status: 500 });
      }
      await supabase.from("match_queue").delete().in("player_id", [playerId, opponentId]);
      return NextResponse.json({ match });
    }

    await supabase.from("match_queue").upsert({
      player_id: playerId,
      created_at: new Date().toISOString(),
    });
    return NextResponse.json({ waiting: true });
  }

  if (action === "match-progress") {
    const payload = body as unknown as MatchProgressPayload;
    const playerId = sanitizePlayerId(payload.playerId);
    if (!playerId || !payload.matchId) {
      return NextResponse.json({ error: "Invalid match progress payload." }, { status: 400 });
    }
    const answeredCount = Math.max(0, Math.floor(Number(payload.answeredCount ?? 0)));
    const correctAnswers = Math.max(0, Math.floor(Number(payload.correctAnswers ?? 0)));
    const totalTimeMs = Math.max(0, Math.floor(Number(payload.totalTimeMs ?? 0)));
    await supabase.from("match_progress").upsert({
      match_id: payload.matchId,
      player_id: playerId,
      answered_count: answeredCount,
      correct_answers: correctAnswers,
      total_time_ms: totalTimeMs,
      finished: Boolean(payload.finished),
      updated_at: new Date().toISOString(),
    });
    return NextResponse.json({ ok: true });
  }

  if (action === "friend-invite-response") {
    const payload = body as unknown as FriendInviteResponsePayload;
    const playerId = sanitizePlayerId(payload.playerId);
    if (!playerId || !payload.matchId) {
      return NextResponse.json({ error: "Invalid friend invite response payload." }, { status: 400 });
    }
    const { data: match, error: matchErr } = await supabase
      .from("matches")
      .select("*")
      .eq("id", payload.matchId)
      .eq("mode", "friend")
      .eq("status", "pending")
      .single();
    if (matchErr || !match) {
      return NextResponse.json({ error: "Invite is no longer available." }, { status: 404 });
    }
    if (match.player2_id !== playerId) {
      return NextResponse.json({ error: "Only invited player can respond." }, { status: 403 });
    }
    if (!payload.accepted) {
      await supabase.from("matches").update({ status: "declined" }).eq("id", payload.matchId);
      return NextResponse.json({ ok: true, declined: true, matchId: payload.matchId, challengerId: match.player1_id });
    }
    const { data: activated, error: activateErr } = await supabase
      .from("matches")
      .update({ status: "active" })
      .eq("id", payload.matchId)
      .eq("status", "pending")
      .select("*")
      .single();
    if (activateErr || !activated) {
      return NextResponse.json({ error: "Could not accept invite." }, { status: 500 });
    }
    return NextResponse.json({ ok: true, accepted: true, match: activated, challengerId: match.player1_id });
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
