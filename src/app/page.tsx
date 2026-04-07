"use client";

import { useEffect, useMemo, useState } from "react";
import { defaultProgress, loadProgress, saveProgress, type StoredProgress } from "@/lib/storage";
import { getQuestionForLevel, TOTAL_LEVELS } from "@/lib/trivia";

type Theme = "dark" | "light";

export default function Home() {
  const [progress, setProgress] = useState<StoredProgress>(defaultProgress);
  const [isLoaded, setIsLoaded] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [theme, setTheme] = useState<Theme>("dark");

  const currentLevel = progress.currentLevel;
  const question = useMemo(() => getQuestionForLevel(currentLevel), [currentLevel]);
  const isLevelComplete = feedback === "correct";

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
    if (!isLoaded || isLevelComplete) {
      return;
    }

    const isCorrect = index === question.correctAnswerIndex;
    setSelectedIndex(index);
    setFeedback(isCorrect ? "correct" : "wrong");
  };

  const goToNextLevel = () => {
    if (!isLoaded || feedback !== "correct") {
      return;
    }

    const nextLevel = Math.min(TOTAL_LEVELS, currentLevel + 1);
    const nextProgress: StoredProgress = { ...progress, currentLevel: nextLevel };
    setProgress(nextProgress);
    saveProgress(nextProgress);

    setSelectedIndex(null);
    setFeedback(null);
  };

  const restart = () => {
    if (!isLoaded) return;
    const nextProgress: StoredProgress = { ...progress, currentLevel: 1 };
    setProgress(nextProgress);
    saveProgress(nextProgress);
    setSelectedIndex(null);
    setFeedback(null);
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
            100 שלבים. כל שלב — שאלה אחת. צריך לענות נכון כדי להתקדם.
          </p>
        </header>

        <section className="card bg-white dark:bg-white/5">
          <div className="mb-3">
            <div className="flex items-center justify-between text-sm">
              <div className="font-semibold">שלב {currentLevel}</div>
              <div className="text-slate-600 dark:text-slate-300">
                שלב {currentLevel}/{TOTAL_LEVELS}
              </div>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
              <div
                className="h-full rounded-full bg-indigo-600 transition-[width]"
                style={{ width: `${(currentLevel / TOTAL_LEVELS) * 100}%` }}
              />
            </div>
          </div>

          <div className="mb-2 text-xs font-semibold text-indigo-500">{question.category}</div>
          <h2 className="mb-4 text-xl font-semibold">{question.question}</h2>
          <div className="space-y-2">
            {question.answers.map((answer, index) => {
              const isCorrect = index === question.correctAnswerIndex;
              const isPickedWrong = feedback === "wrong" && selectedIndex === index;
              const showCorrect = feedback === "correct" && isCorrect;
              const showWrongPicked = feedback === "wrong" && isPickedWrong;
              return (
                <button
                  key={answer}
                  onClick={() => {
                    setSelectedIndex(index);
                    submitAnswer(index);
                  }}
                  disabled={isLevelComplete}
                  className={`w-full rounded-xl border px-4 py-3 text-right transition ${
                    showCorrect
                      ? "border-emerald-400 bg-emerald-100 text-emerald-900 dark:bg-emerald-500/20 dark:text-emerald-100"
                      : showWrongPicked
                        ? "border-rose-400 bg-rose-100 text-rose-900 dark:bg-rose-500/20 dark:text-rose-100"
                        : "border-slate-300 bg-slate-50 hover:bg-slate-100 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
                  } ${isLevelComplete ? "cursor-not-allowed opacity-95" : ""}`}
                >
                  {answer}
                </button>
              );
            })}
          </div>

          {feedback && (
            <div className="mt-4 rounded-xl border border-white/10 bg-slate-50 p-3 dark:bg-black/20">
              <p className={`mb-2 font-semibold ${feedback === "correct" ? "text-emerald-500" : "text-rose-500"}`}>
                {feedback === "correct" ? "נכון מאוד!" : "לא הפעם — אפשר לנסות שוב."}
              </p>
              <p className="text-sm text-slate-700 dark:text-slate-200">{question.explanation}</p>
            </div>
          )}

          {feedback === "correct" && (
            <div className="mt-4">
              {currentLevel < TOTAL_LEVELS ? (
                <button
                  onClick={goToNextLevel}
                  className="w-full rounded-xl bg-indigo-600 px-4 py-3 font-semibold text-white"
                >
                  לשלב הבא
                </button>
              ) : (
                <div className="rounded-xl border border-white/10 bg-slate-50 p-3 text-center dark:bg-black/20">
                  <div className="mb-2 font-semibold text-emerald-500">סיימת את שלב 100!</div>
                  <button
                    onClick={restart}
                    className="w-full rounded-xl bg-indigo-600 px-4 py-3 font-semibold text-white"
                  >
                    התחל מחדש
                  </button>
                </div>
              )}
            </div>
          )}
        </section>

        <section className="card bg-white dark:bg-white/5">
          <div className="text-sm text-slate-600 dark:text-slate-300">התקדמות נשמרת במכשיר (localStorage).</div>
          <div className="mt-3 grid grid-cols-2 gap-3 text-center">
            <div className="rounded-xl bg-slate-50 p-3 dark:bg-white/5">
              <div className="text-sm text-slate-600 dark:text-slate-300">שלב נוכחי</div>
              <div className="text-2xl font-bold">{currentLevel}</div>
            </div>
            <div className="rounded-xl bg-slate-50 p-3 dark:bg-white/5">
              <div className="text-sm text-slate-600 dark:text-slate-300">נותרו</div>
              <div className="text-2xl font-bold">{Math.max(0, TOTAL_LEVELS - currentLevel)}</div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
