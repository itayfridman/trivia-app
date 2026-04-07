export type StoredProgress = {
  currentLevel: number; // 1..100
  totalScore: number;
  playerName: string;
};

export type LeaderboardEntry = {
  playerName: string;
  score: number;
  reachedLevel: number;
  playedAt: string;
};

const STORAGE_KEY = "trivia-levels-progress-v1";
const LEADERBOARD_STORAGE_KEY = "trivia-leaderboard-v1";
const MIN_LEVEL = 1;
const MAX_LEVEL = 100;

export const defaultProgress: StoredProgress = {
  currentLevel: MIN_LEVEL,
  totalScore: 0,
  playerName: "",
};

export const loadProgress = (): StoredProgress => {
  if (typeof window === "undefined") {
    return defaultProgress;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return defaultProgress;
    }
    const parsed = JSON.parse(raw) as Partial<StoredProgress>;
    const safeLevel =
      typeof parsed.currentLevel === "number" && Number.isFinite(parsed.currentLevel)
        ? Math.min(MAX_LEVEL, Math.max(MIN_LEVEL, Math.floor(parsed.currentLevel)))
        : defaultProgress.currentLevel;
    const safeScore =
      typeof parsed.totalScore === "number" && Number.isFinite(parsed.totalScore)
        ? Math.max(0, Math.floor(parsed.totalScore))
        : defaultProgress.totalScore;
    const safePlayerName = typeof parsed.playerName === "string" ? parsed.playerName.trim().slice(0, 24) : "";
    return {
      ...defaultProgress,
      ...parsed,
      currentLevel: safeLevel,
      totalScore: safeScore,
      playerName: safePlayerName,
    };
  } catch {
    return defaultProgress;
  }
};

export const saveProgress = (progress: StoredProgress): void => {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
};

export const loadLeaderboard = (): LeaderboardEntry[] => {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(LEADERBOARD_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as Partial<LeaderboardEntry>[];
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter(
        (entry) =>
          typeof entry?.playerName === "string" &&
          entry.playerName.trim().length > 0 &&
          typeof entry?.score === "number" &&
          Number.isFinite(entry.score) &&
          typeof entry?.reachedLevel === "number" &&
          Number.isFinite(entry.reachedLevel) &&
          typeof entry?.playedAt === "string",
      )
      .map((entry) => ({
        playerName: (entry.playerName as string).trim().slice(0, 24),
        score: Math.max(0, Math.floor(entry.score as number)),
        reachedLevel: Math.min(MAX_LEVEL, Math.max(MIN_LEVEL, Math.floor(entry.reachedLevel as number))),
        playedAt: entry.playedAt as string,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
  } catch {
    return [];
  }
};

export const saveScoreToLeaderboard = (playerName: string, score: number, reachedLevel: number): LeaderboardEntry[] => {
  const safePlayerName = playerName.trim().slice(0, 24);
  if (!safePlayerName) {
    return loadLeaderboard();
  }

  const safeEntry: LeaderboardEntry = {
    playerName: safePlayerName,
    score: Math.max(0, Math.floor(score)),
    reachedLevel: Math.min(MAX_LEVEL, Math.max(MIN_LEVEL, Math.floor(reachedLevel))),
    playedAt: new Date().toISOString(),
  };

  const merged = [...loadLeaderboard(), safeEntry].sort((a, b) => b.score - a.score).slice(0, 10);
  window.localStorage.setItem(LEADERBOARD_STORAGE_KEY, JSON.stringify(merged));
  return merged;
};
