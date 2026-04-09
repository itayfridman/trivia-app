export type StoredPlayer = {
  playerName: string;
  playerId: string;
  coins: number;
  elo: number;
  lastDailyChallengeDate: string | null;
};

export type LeaderboardEntry = {
  id: number;
  username: string;
  score: number;
  category: string;
  level: number;
  created_at: string;
};

const STORAGE_KEY = "trivia-player-v2";

export const defaultPlayer: StoredPlayer = {
  playerName: "",
  playerId: "",
  coins: 0,
  elo: 1000,
  lastDailyChallengeDate: null,
};

const generatePlayerId = (): string => {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let suffix = "";
  for (let index = 0; index < 4; index += 1) {
    suffix += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return `TRV-${suffix}`;
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
    const safePlayerId = typeof parsed.playerId === "string" && /^TRV-[A-Z0-9]{4}$/.test(parsed.playerId) ? parsed.playerId : generatePlayerId();
    const safeCoins = Math.max(0, Math.floor(Number(parsed.coins ?? 0)));
    const safeElo = Math.max(0, Math.floor(Number(parsed.elo ?? 1000)));
    const safeDailyDate = typeof parsed.lastDailyChallengeDate === "string" ? parsed.lastDailyChallengeDate : null;
    return {
      ...defaultPlayer,
      ...parsed,
      playerName: safePlayerName,
      playerId: safePlayerId,
      coins: safeCoins,
      elo: safeElo,
      lastDailyChallengeDate: safeDailyDate,
    };
  } catch {
    return { ...defaultPlayer, playerId: generatePlayerId() };
  }
};

export const savePlayer = (player: StoredPlayer): void => {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(player));
};
