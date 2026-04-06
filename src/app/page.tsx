"use client";

import { useEffect, useMemo, useState } from "react";
import { defaultProgress, loadProgress, saveProgress, type StoredProgress } from "@/lib/storage";
import { getQuestionOfTheDay, getTodayKey } from "@/lib/trivia";

type Theme = "dark" | "light";

const isYesterday = (lastDate: string, todayDate: string): boolean => {
  const last = new Date(`${lastDate}T00:00:00Z`).getTime();
  const today = new Date(`${todayDate}T00:00:00Z`).getTime();
  return today - last === 86_400_000;
};

export default function Home() {
  const [progress, setProgress] = useState<StoredProgress>(defaultProgress);
  const [isLoaded, setIsLoaded] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [theme, setTheme] = useState<Theme>("dark");

  const question = useMemo(() => getQuestionOfTheDay(), []);
  const todayKey = useMemo(() => getTodayKey(), []);
  const todayAnswer = progress.answersByDate[todayKey];
  const hasAnsweredToday = Boolean(todayAnswer);

  useEffect(() => {
    const savedTheme = window.localStorage.getItem("trivia-theme") as Theme | null;
    const initialTheme = savedTheme ?? "dark";
    setTheme(initialTheme);
    document.documentElement.classList.toggle("dark", initialTheme === "dark");
    document.documentElement.classList.toggle("light", initialTheme === "light");

    const loaded = loadProgress();
    setProgress(loaded);
    setIsLoaded(true);
  }, []);

  const submitAnswer = (index: number) => {
    if (hasAnsweredToday || !isLoaded) {
      return;
    }

    const isCorrect = index === question.correctAnswerIndex;
    const nextStreak =
      progress.lastPlayedDate && isYesterday(progress.lastPlayedDate, todayKey)
        ? progress.streak + 1
        : 1;

    const nextProgress: StoredProgress = {
      ...progress,
      totalCorrect: progress.totalCorrect + (isCorrect ? 1 : 0),
      streak: nextStreak,
      lastPlayedDate: todayKey,
      answersByDate: {
        ...progress.answersByDate,
        [todayKey]: { questionId: question.id, isCorrect },
      },
    };

    setSelectedIndex(index);
    setProgress(nextProgress);
    saveProgress(nextProgress);
  };

  useEffect(() => {
    if (todayAnswer) {
      const savedSelection = todayAnswer.isCorrect ? question.correctAnswerIndex : null;
      setSelectedIndex(savedSelection);
    }
  }, [todayAnswer, question.correctAnswerIndex]);

  const isCorrectToday = todayAnswer?.isCorrect ?? false;

  const shareResult = async () => {
    if (!hasAnsweredToday) {
      return;
    }
    const emoji = isCorrectToday ? "✅🔥" : "❌💪";
    const text = `עניתי ${isCorrectToday ? "נכון" : "לא נכון"} היום ${emoji} יום ${
      progress.streak
    } ברצף — נסה גם אתה: ${window.location.href}`;

    if (navigator.share) {
      await navigator.share({
        title: "טריוויה יומית",
        text,
      });
      return;
    }
    await navigator.clipboard.writeText(text);
    alert("הטקסט הועתק ללוח!");
  };

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.classList.toggle("dark", next === "dark");
    document.documentElement.classList.toggle("light", next === "light");
    window.localStorage.setItem("trivia-theme", next);
  };

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900 dark:bg-[#0b1020] dark:text-slate-100">
      <div className="mx-auto flex min-h-screen w-full max-w-lg flex-col gap-4 px-4 py-6">
        <header className="card bg-white dark:bg-white/5">
          <div className="mb-3 flex items-center justify-between">
            <h1 className="text-2xl font-bold">טריוויה יומית</h1>
            <button
              onClick={toggleTheme}
              className="rounded-xl border border-slate-300 px-3 py-1 text-sm dark:border-white/20"
            >
              {theme === "dark" ? "מצב בהיר" : "מצב כהה"}
            </button>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            כל יום שאלה חדשה אחת לכולם - ספורט, בידור ותרבות.
          </p>
        </header>

        <section className="card bg-white dark:bg-white/5">
          <div className="mb-2 text-xs font-semibold text-indigo-500">{question.category}</div>
          <h2 className="mb-4 text-xl font-semibold">{question.question}</h2>
          <div className="space-y-2">
            {question.answers.map((answer, index) => {
              const isCorrect = index === question.correctAnswerIndex;
              const isPickedWrong = hasAnsweredToday && !isCorrectToday && selectedIndex === index;
              const showCorrect = hasAnsweredToday && isCorrect;
              return (
                <button
                  key={answer}
                  onClick={() => {
                    setSelectedIndex(index);
                    submitAnswer(index);
                  }}
                  disabled={hasAnsweredToday}
                  className={`w-full rounded-xl border px-4 py-3 text-right transition ${
                    showCorrect
                      ? "border-emerald-400 bg-emerald-100 text-emerald-900 dark:bg-emerald-500/20 dark:text-emerald-100"
                      : isPickedWrong
                        ? "border-rose-400 bg-rose-100 text-rose-900 dark:bg-rose-500/20 dark:text-rose-100"
                        : "border-slate-300 bg-slate-50 hover:bg-slate-100 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
                  } ${hasAnsweredToday ? "cursor-not-allowed opacity-95" : ""}`}
                >
                  {answer}
                </button>
              );
            })}
          </div>

          {hasAnsweredToday && (
            <div className="mt-4 rounded-xl border border-white/10 bg-slate-50 p-3 dark:bg-black/20">
              <p className={`mb-2 font-semibold ${isCorrectToday ? "text-emerald-500" : "text-rose-500"}`}>
                {isCorrectToday ? "נכון מאוד!" : "לא הפעם."}
              </p>
              <p className="text-sm text-slate-700 dark:text-slate-200">{question.explanation}</p>
            </div>
          )}
        </section>

        <section className="card bg-white dark:bg-white/5">
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="rounded-xl bg-slate-50 p-3 dark:bg-white/5">
              <div className="text-sm text-slate-600 dark:text-slate-300">ניקוד כולל</div>
              <div className="text-2xl font-bold">{progress.totalCorrect}</div>
            </div>
            <div className="rounded-xl bg-slate-50 p-3 dark:bg-white/5">
              <div className="text-sm text-slate-600 dark:text-slate-300">רצף יומי</div>
              <div className="text-2xl font-bold">{progress.streak} 🔥</div>
            </div>
          </div>
          <button
            onClick={shareResult}
            disabled={!hasAnsweredToday}
            className="mt-4 w-full rounded-xl bg-indigo-600 px-4 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            שתף תוצאה
          </button>
        </section>
      </div>
    </main>
  );
}
