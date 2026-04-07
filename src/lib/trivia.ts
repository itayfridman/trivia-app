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
  "General Knowledge",
  "Science",
  "History",
  "Geography",
  "Sports",
  "Music",
  "Movies & TV",
  "Technology",
  "Art & Literature",
  "World Culture",
] as const;

export type TriviaSection = {
  id: number;
  title: string;
  questions: TriviaQuestion[];
};

export const getSections = (): TriviaSection[] => {
  const needed = TOTAL_SECTIONS * QUESTIONS_PER_SECTION;
  const sliced = allQuestions.slice(0, needed);

  return Array.from({ length: TOTAL_SECTIONS }, (_, index) => {
    const start = index * QUESTIONS_PER_SECTION;
    const end = start + QUESTIONS_PER_SECTION;
    const sectionQuestions = sliced.slice(start, end).map((question) => ({
      ...question,
      category: SECTION_CATEGORIES[index],
    }));
    return {
      id: index + 1,
      title: SECTION_CATEGORIES[index],
      questions: sectionQuestions,
    };
  });
};
