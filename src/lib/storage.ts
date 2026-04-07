export type StoredPlayer = {
  playerName: string;
};

export type LeaderboardEntry = {
  playerName: string;
  score: number;
  sectionId: number;
  sectionTitle: string;
  correctAnswers: number;
  incorrectAnswers: number;
  playedAt: string;
};

const STORAGE_KEY = "trivia-player-v2";

export const defaultPlayer: StoredPlayer = {
  playerName: "",
};

export const loadPlayer = (): StoredPlayer => {
  if (typeof window === "undefined") {
    return defaultPlayer;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return defaultPlayer;
    }
    const parsed = JSON.parse(raw) as Partial<StoredPlayer>;
    const safePlayerName = typeof parsed.playerName === "string" ? parsed.playerName.trim().slice(0, 24) : "";
    return {
      ...defaultPlayer,
      ...parsed,
      playerName: safePlayerName,
    };
  } catch {
    return defaultPlayer;
  }
};

export const savePlayer = (player: StoredPlayer): void => {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(player));
};
