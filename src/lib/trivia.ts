export type TriviaQuestion = {
  id: string;
  category: string;
  question: string;
  answers: string[];
  correctAnswerIndex: number;
  explanation: string;
  imageUrl?: string;
};

export const LEVELS_PER_CATEGORY = 10;
export const QUESTIONS_PER_LEVEL = 10;

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
  openTdbCategoryId: number;
};

type OpenTdbQuestion = {
  type: "multiple";
  difficulty: "easy" | "medium" | "hard";
  category: string;
  question: string;
  correct_answer: string;
  incorrect_answers: string[];
};

type OpenTdbResponse = {
  response_code: number;
  results: OpenTdbQuestion[];
};

const OPEN_TDB_CATEGORY_MAP: Record<TriviaCategoryName, number> = {
  Sports: 21,
  Music: 12,
  Movies: 11,
  Science: 17,
  History: 23,
  Geography: 22,
  Technology: 18,
  Animals: 27,
  Food: 49,
  Celebrities: 26,
};

const shuffleAnswers = (items: string[]): string[] => {
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
    openTdbCategoryId: OPEN_TDB_CATEGORY_MAP[title],
  }));

const decodeHtml = (value: string): string => {
  if (typeof window === "undefined") {
    return value;
  }
  const parser = new DOMParser();
  return parser.parseFromString(value, "text/html").documentElement.textContent ?? value;
};

const difficultyByLevel = (level: number): "easy" | "medium" | "hard" => {
  if (level <= 3) return "easy";
  if (level <= 7) return "medium";
  return "hard";
};

export const fetchLevelQuestions = async (category: TriviaCategory, level: number, excludeIds: Set<string>): Promise<TriviaQuestion[]> => {
  const difficulty = difficultyByLevel(level);
  const params = new URLSearchParams({
    amount: String(QUESTIONS_PER_LEVEL),
    category: String(category.openTdbCategoryId),
    type: "multiple",
    difficulty,
  });
  const response = await fetch(`https://opentdb.com/api.php?${params.toString()}`);
  if (!response.ok) {
    throw new Error("Could not fetch questions.");
  }
  const data = (await response.json()) as OpenTdbResponse;
  if (!Array.isArray(data.results) || data.results.length === 0) {
    throw new Error("No questions returned from Open Trivia DB.");
  }

  const mapped = data.results
    .map((item, index): TriviaQuestion => {
      const decodedCorrect = decodeHtml(item.correct_answer);
      const answers = shuffleAnswers([decodedCorrect, ...item.incorrect_answers.map((answer) => decodeHtml(answer))]);
      return {
        id: `${category.id}-${level}-${index}-${decodeHtml(item.question).slice(0, 40)}`,
        category: category.title,
        question: decodeHtml(item.question),
        answers,
        correctAnswerIndex: answers.findIndex((answer) => answer === decodedCorrect),
        explanation: `Difficulty: ${item.difficulty}. Category: ${decodeHtml(item.category)}.`,
      };
    })
    .filter((item) => !excludeIds.has(item.id));

  if (mapped.length < QUESTIONS_PER_LEVEL) {
    throw new Error("Not enough unique questions received for this level.");
  }
  return mapped.slice(0, QUESTIONS_PER_LEVEL);
};
