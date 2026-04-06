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

export const getTodayKey = (): string => {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(
    2,
    "0",
  )}-${String(now.getUTCDate()).padStart(2, "0")}`;
};

export const getQuestionOfTheDay = (): TriviaQuestion => {
  const dayNumber = Math.floor(Date.now() / 86_400_000);
  const index = dayNumber % allQuestions.length;
  return allQuestions[index];
};
