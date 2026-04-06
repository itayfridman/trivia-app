export type StoredProgress = {
  totalCorrect: number;
  streak: number;
  lastPlayedDate: string | null;
  answersByDate: Record<string, { questionId: string; isCorrect: boolean }>;
};

const STORAGE_KEY = "trivia-yomit-progress-v1";

export const defaultProgress: StoredProgress = {
  totalCorrect: 0,
  streak: 0,
  lastPlayedDate: null,
  answersByDate: {},
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
    return {
      ...defaultProgress,
      ...parsed,
      answersByDate: parsed.answersByDate ?? {},
    };
  } catch {
    return defaultProgress;
  }
};

export const saveProgress = (progress: StoredProgress): void => {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
};
