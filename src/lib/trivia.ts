import questions from "@/data/questions.json";

export type TriviaQuestion = {
  id: string;
  category: string;
  question: string;
  answers: string[];
  correctAnswerIndex: number;
  explanation: string;
  imageUrl?: string;
};

export const allQuestions = questions as TriviaQuestion[];

export const LEVELS_PER_CATEGORY = 10;
export const QUESTIONS_PER_LEVEL = 10;
export const QUESTIONS_PER_CATEGORY_RUN = LEVELS_PER_CATEGORY * QUESTIONS_PER_LEVEL;

export const CATEGORY_TITLES = [
  "Sports",
  "Music",
  "Movies",
  "Science",
  "History",
  "Geography",
  "Technology",
  "Animals",
  "Food",
  "Celebrities",
] as const;

export type TriviaCategoryName = (typeof CATEGORY_TITLES)[number];

export type TriviaCategory = {
  id: number;
  title: TriviaCategoryName;
  questions: TriviaQuestion[];
};

const shuffleQuestions = (items: TriviaQuestion[]): TriviaQuestion[] => {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

export const getCategories = (): TriviaCategory[] =>
  CATEGORY_TITLES.map((title, index) => ({
    id: index + 1,
    title,
    questions: allQuestions.filter((question) => question.category === title),
  }));

export const buildCategoryRun = (category: TriviaCategory): TriviaQuestion[] => {
  const run: TriviaQuestion[] = [];
  while (run.length < QUESTIONS_PER_CATEGORY_RUN) {
    run.push(...shuffleQuestions(category.questions));
  }
  return run.slice(0, QUESTIONS_PER_CATEGORY_RUN);
};
