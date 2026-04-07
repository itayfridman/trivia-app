export type StoredProgress = {
  currentLevel: number; // 1..100
};

const STORAGE_KEY = "trivia-levels-progress-v1";
const MIN_LEVEL = 1;
const MAX_LEVEL = 100;

export const defaultProgress: StoredProgress = {
  currentLevel: MIN_LEVEL,
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
    const parsed = JSON.parse(raw) as StoredProgress;
    const safeLevel =
      typeof parsed.currentLevel === "number" && Number.isFinite(parsed.currentLevel)
        ? Math.min(MAX_LEVEL, Math.max(MIN_LEVEL, Math.floor(parsed.currentLevel)))
        : defaultProgress.currentLevel;
    return {
      ...defaultProgress,
      ...parsed,
      currentLevel: safeLevel,
    };
  } catch {
    return defaultProgress;
  }
};

export const saveProgress = (progress: StoredProgress): void => {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
};
