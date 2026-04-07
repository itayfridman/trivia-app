import { promises as fs } from "fs";
import path from "path";
import { NextResponse } from "next/server";

type LeaderboardEntry = {
  playerName: string;
  score: number;
  sectionId: number;
  sectionTitle: string;
  correctAnswers: number;
  incorrectAnswers: number;
  playedAt: string;
};

const leaderboardPath = path.join(process.cwd(), "src", "data", "leaderboard.json");

const sanitizeName = (name: string): string => name.trim().replace(/\s+/g, " ").slice(0, 24);

const sanitizeEntry = (entry: Partial<LeaderboardEntry>): LeaderboardEntry | null => {
  if (
    typeof entry.playerName !== "string" ||
    typeof entry.score !== "number" ||
    typeof entry.sectionId !== "number" ||
    typeof entry.sectionTitle !== "string" ||
    typeof entry.correctAnswers !== "number" ||
    typeof entry.incorrectAnswers !== "number" ||
    typeof entry.playedAt !== "string"
  ) {
    return null;
  }

  const playerName = sanitizeName(entry.playerName);
  if (!playerName) {
    return null;
  }

  return {
    playerName,
    score: Math.max(0, Math.floor(entry.score)),
    sectionId: Math.max(1, Math.floor(entry.sectionId)),
    sectionTitle: entry.sectionTitle.trim().slice(0, 40),
    correctAnswers: Math.max(0, Math.floor(entry.correctAnswers)),
    incorrectAnswers: Math.max(0, Math.floor(entry.incorrectAnswers)),
    playedAt: entry.playedAt,
  };
};

const readLeaderboard = async (): Promise<LeaderboardEntry[]> => {
  try {
    const raw = await fs.readFile(leaderboardPath, "utf8");
    const parsed = JSON.parse(raw) as Partial<LeaderboardEntry>[];
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed
      .map((entry) => sanitizeEntry(entry))
      .filter((entry): entry is LeaderboardEntry => entry !== null)
      .sort((a, b) => b.score - a.score || a.playedAt.localeCompare(b.playedAt))
      .slice(0, 100);
  } catch {
    return [];
  }
};

const writeLeaderboard = async (entries: LeaderboardEntry[]): Promise<void> => {
  await fs.writeFile(leaderboardPath, JSON.stringify(entries, null, 2), "utf8");
};

export async function GET() {
  const leaderboard = await readLeaderboard();
  return NextResponse.json({ entries: leaderboard.slice(0, 20) });
}

export async function POST(request: Request) {
  const body = (await request.json()) as Partial<LeaderboardEntry>;
  const playerName = typeof body.playerName === "string" ? sanitizeName(body.playerName) : "";
  if (!playerName) {
    return NextResponse.json({ error: "Invalid player name." }, { status: 400 });
  }

  const nextEntry = sanitizeEntry({
    playerName,
    score: Number(body.score ?? 0),
    sectionId: Number(body.sectionId ?? 1),
    sectionTitle: typeof body.sectionTitle === "string" ? body.sectionTitle : "Unknown",
    correctAnswers: Number(body.correctAnswers ?? 0),
    incorrectAnswers: Number(body.incorrectAnswers ?? 0),
    playedAt: new Date().toISOString(),
  });

  if (!nextEntry) {
    return NextResponse.json({ error: "Invalid score payload." }, { status: 400 });
  }

  const existing = await readLeaderboard();
  const key = playerName.toLowerCase();
  const current = existing.find((entry) => entry.playerName.toLowerCase() === key);

  let merged: LeaderboardEntry[];
  if (!current || nextEntry.score >= current.score) {
    merged = [nextEntry, ...existing.filter((entry) => entry.playerName.toLowerCase() !== key)];
  } else {
    merged = existing;
  }

  merged.sort((a, b) => b.score - a.score || a.playedAt.localeCompare(b.playedAt));
  const trimmed = merged.slice(0, 100);
  await writeLeaderboard(trimmed);
  return NextResponse.json({ entries: trimmed.slice(0, 20) });
}
