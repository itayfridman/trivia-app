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

export const getQuestionForLevel = (level: number): TriviaQuestion => {
  const safeLevel = Math.min(TOTAL_LEVELS, Math.max(1, Math.floor(level)));
  const index = (safeLevel - 1) % allQuestions.length;
  return allQuestions[index];
};
