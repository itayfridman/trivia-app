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

const getTodayUtcDate = (): string => new Date().toISOString().slice(0, 10);

const getSupabase = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  return createClient(url, anonKey, { auth: { persistSession: false } });
};

const sanitizePlayerId = (value: unknown): string =>
  typeof value === "string" && /^TRV-[A-Z0-9]{4}$/.test(value.trim().toUpperCase()) ? value.trim().toUpperCase() : "";

const getDailyQuestions = () => {
  const today = getTodayUtcDate();
  const seed = Number(today.replaceAll("-", ""));
  const sorted = [...questions].sort((a, b) => {
    const aHash = Math.abs(hashCode(`${a.id}-${seed}`));
    const bHash = Math.abs(hashCode(`${b.id}-${seed}`));
    return aHash - bHash;
  });
  return sorted.slice(0, 10);
};

const hashCode = (value: string): number => {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }
  return hash;
};

export async function GET(request: Request) {
  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 500 });
  }
  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action");

  if (action === "daily") {
    const today = getTodayUtcDate();
    const { data, error } = await supabase
      .from("daily_challenge_results")
      .select("player_id, score, total_time_ms")
      .eq("challenge_date", today)
      .order("score", { ascending: false })
      .order("total_time_ms", { ascending: true });
    if (error) {
      return NextResponse.json({ error: "Could not load daily challenge data." }, { status: 500 });
    }
    return NextResponse.json({
      today,
      questions: getDailyQuestions(),
      completedCount: data?.length ?? 0,
      top3: (data ?? []).slice(0, 3),
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
    const { error } = await supabase.from("daily_challenge_results").upsert({
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
      const qs = getDailyQuestions();
      const { data, error } = await supabase
        .from("matches")
        .insert({
          player1_id: playerId,
          player2_id: friendId,
          mode: "friend",
          status: "active",
          questions: qs,
          created_at: new Date().toISOString(),
        })
        .select("*")
        .single();
      if (error) {
        return NextResponse.json({ error: "Could not create match." }, { status: 500 });
      }
      return NextResponse.json({ match: data });
    }

    const { data: queued } = await supabase
      .from("match_queue")
      .select("player_id")
      .neq("player_id", playerId)
      .order("created_at", { ascending: true })
      .limit(1);

    if (queued && queued.length > 0) {
      const opponentId = sanitizePlayerId(queued[0].player_id);
      const qs = getDailyQuestions();
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

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
