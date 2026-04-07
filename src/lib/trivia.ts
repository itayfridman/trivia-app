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

export const REQUIRED_CATEGORIES = [
  "Sports",
  "Music",
  "Movies",
  "TV Shows",
  "History",
  "Science",
  "Geography",
  "Food",
  "Technology",
  "Art",
  "Politics",
  "Animals",
  "Video Games",
  "Fashion",
  "Space",
  "Literature",
  "Celebrities",
  "Cars",
  "Holidays",
  "Mythology",
] as const;

const QUESTIONS_PER_CATEGORY = 5;

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
  const needed = REQUIRED_CATEGORIES.length * QUESTIONS_PER_CATEGORY;
  const sliced = shuffledBase.slice(0, needed);

  return sliced.map((question, index) => {
    const categoryIndex = Math.floor(index / QUESTIONS_PER_CATEGORY);
    return {
      ...question,
      category: REQUIRED_CATEGORIES[categoryIndex],
    };
  });
};

export const getQuestionForLevel = (level: number, sessionQuestions: TriviaQuestion[]): TriviaQuestion => {
  const safeLevel = Math.min(TOTAL_LEVELS, Math.max(1, Math.floor(level)));
  const index = (safeLevel - 1) % sessionQuestions.length;
  return sessionQuestions[index];
};
