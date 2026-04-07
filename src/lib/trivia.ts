import questions from "@/data/questions.json";

export type TriviaQuestion = {
  id: string;
  category: string;
  question: string;
  answers: string[];
  correctAnswerIndex: number;
  explanation: string;
};

export const allQuestions = questions as TriviaQuestion[];

export const TOTAL_LEVELS = allQuestions.length;
export const QUESTIONS_PER_SECTION = 10;
export const TOTAL_SECTIONS = 10;

export const SECTION_CATEGORIES = [
  "Sports",
  "Music",
  "History",
  "Science",
  "Geography",
  "Entertainment",
  "Technology",
  "Art",
  "World",
] as const;

const shuffle = <T>(items: T[]): T[] => {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const randomIndex = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[randomIndex]] = [copy[randomIndex], copy[i]];
  }
  return copy;
};

export const createSessionQuestions = (): TriviaQuestion[] => {
  const shuffledBase = shuffle(allQuestions);
  const needed = TOTAL_SECTIONS * QUESTIONS_PER_SECTION;
  const sliced = shuffledBase.slice(0, needed);

  return sliced.map((question, index) => {
    const categoryIndex = Math.floor(index / QUESTIONS_PER_SECTION);
    return {
      ...question,
      category: SECTION_CATEGORIES[categoryIndex],
    };
  });
};

export const getQuestionForLevel = (level: number, sessionQuestions: TriviaQuestion[]): TriviaQuestion => {
  const safeLevel = Math.min(TOTAL_LEVELS, Math.max(1, Math.floor(level)));
  const index = (safeLevel - 1) % sessionQuestions.length;
  return sessionQuestions[index];
};
