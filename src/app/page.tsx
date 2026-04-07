"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  defaultProgress,
  loadLeaderboard,
  loadProgress,
  saveProgress,
  saveScoreToLeaderboard,
  type LeaderboardEntry,
  type StoredProgress,
} from "@/lib/storage";
import {
  createSessionQuestions,
  getQuestionForLevel,
  QUESTIONS_PER_SECTION,
  TOTAL_LEVELS,
  TOTAL_SECTIONS,
  type TriviaQuestion,
} from "@/lib/trivia";

type Theme = "dark" | "light";

export default function Home() {
  const [progress, setProgress] = useState<StoredProgress>(defaultProgress);
  const [sessionQuestions, setSessionQuestions] = useState<TriviaQuestion[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [attemptCount, setAttemptCount] = useState(0);
  const [lastPointsAwarded, setLastPointsAwarded] = useState(0);
  const [hasSavedCurrentRun, setHasSavedCurrentRun] = useState(false);
  const [lastSavedCheckpointLevel, setLastSavedCheckpointLevel] = useState(0);
  const [playerNameInput, setPlayerNameInput] = useState("");
  const [nameError, setNameError] = useState("");
  const [theme, setTheme] = useState<Theme>("dark");
  const [isMuted, setIsMuted] = useState(false);
  const [musicReady, setMusicReady] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const currentLevel = progress.currentLevel;
  const question = useMemo(() => {
    if (sessionQuestions.length === 0) return null;
    return getQuestionForLevel(currentLevel, sessionQuestions);
  }, [currentLevel, sessionQuestions]);
  const isLevelComplete = feedback === "correct";
  const currentSection = Math.floor((currentLevel - 1) / QUESTIONS_PER_SECTION) + 1;

  useEffect(() => {
    const savedTheme = window.localStorage.getItem("trivia-theme") as Theme | null;
    const initialTheme = savedTheme ?? "dark";
    setTheme(initialTheme);
    document.documentElement.classList.toggle("dark", initialTheme === "dark");
    document.documentElement.classList.toggle("light", initialTheme === "light");

    const loaded = loadProgress();
    setProgress(loaded);
    setPlayerNameInput(loaded.playerName);
    setLastSavedCheckpointLevel(Math.floor((loaded.currentLevel - 1) / QUESTIONS_PER_SECTION) * QUESTIONS_PER_SECTION);
    setSessionQuestions(createSessionQuestions());
    setLeaderboard(loadLeaderboard());
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    const audioElement = audioRef.current;
    if (!audioElement) return;

    audioElement.volume = 0.25;
    audioElement
      .play()
      .then(() => setMusicReady(true))
      .catch(() => setMusicReady(false));
  }, []);

  const toggleMute = () => {
    const audioElement = audioRef.current;
    if (!audioElement) return;
    const nextMuted = !isMuted;
    audioElement.muted = nextMuted;
    setIsMuted(nextMuted);
    if (!nextMuted) {
      audioElement.play().catch(() => undefined);
    }
  };

  useEffect(() => {
    if (feedback === "correct" && currentLevel === TOTAL_LEVELS && !hasSavedCurrentRun) {
      setLeaderboard(saveScoreToLeaderboard(progress.playerName, progress.totalScore, progress.currentLevel));
      setHasSavedCurrentRun(true);
    }
  }, [currentLevel, feedback, hasSavedCurrentRun, progress.currentLevel, progress.playerName, progress.totalScore]);

  useEffect(() => {
    const reachedCheckpoint = feedback === "correct" && currentLevel % QUESTIONS_PER_SECTION === 0;
    if (!reachedCheckpoint || currentLevel === lastSavedCheckpointLevel) {
      return;
    }
    setLeaderboard(saveScoreToLeaderboard(progress.playerName, progress.totalScore, currentLevel));
    setLastSavedCheckpointLevel(currentLevel);
  }, [currentLevel, feedback, lastSavedCheckpointLevel, progress.playerName, progress.totalScore]);

  const submitAnswer = (index: number) => {
    if (!isLoaded || isLevelComplete || !question) {
      return;
    }

    const nextAttemptCount = attemptCount + 1;
    const isCorrect = index === question.correctAnswerIndex;
    const pointsAwarded = isCorrect ? (attemptCount === 0 ? 10 : attemptCount === 1 ? 5 : 0) : 0;
    setSelectedIndex(index);
    setFeedback(isCorrect ? "correct" : "wrong");
    setAttemptCount(nextAttemptCount);

    if (isCorrect) {
      const nextProgress: StoredProgress = {
        ...progress,
        totalScore: progress.totalScore + pointsAwarded,
      };
      setProgress(nextProgress);
      saveProgress(nextProgress);
      setLastPointsAwarded(pointsAwarded);
      return;
    }

    setLastPointsAwarded(0);
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
    setAttemptCount(0);
    setLastPointsAwarded(0);
  };

  const restart = () => {
    if (!isLoaded) return;
    if (progress.currentLevel > 1 || progress.totalScore > 0) {
      setLeaderboard(saveScoreToLeaderboard(progress.playerName, progress.totalScore, progress.currentLevel));
    }
    const nextProgress: StoredProgress = { ...progress, currentLevel: 1, totalScore: 0 };
    setProgress(nextProgress);
    saveProgress(nextProgress);
    setSessionQuestions(createSessionQuestions());
    setSelectedIndex(null);
    setFeedback(null);
    setAttemptCount(0);
    setLastPointsAwarded(0);
    setHasSavedCurrentRun(false);
    setLastSavedCheckpointLevel(0);
  };

  const savePlayerName = () => {
    const cleanedName = playerNameInput.trim().slice(0, 24);
    if (!cleanedName) {
      setNameError("Please enter your name or nickname to start.");
      return;
    }
    const nextProgress: StoredProgress = { ...progress, playerName: cleanedName };
    setProgress(nextProgress);
    saveProgress(nextProgress);
    setPlayerNameInput(cleanedName);
    setNameError("");
  };

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.classList.toggle("dark", next === "dark");
    document.documentElement.classList.toggle("light", next === "light");
    window.localStorage.setItem("trivia-theme", next);
  };

  const shareOnWhatsApp = () => {
    const appLink = window.location.href;
    const message = `I reached level ${currentLevel}/100 with ${progress.totalScore} points! Can you beat me? ${appLink}`;
    const shareUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(shareUrl, "_blank", "noopener,noreferrer");
  };

  if (!question) {
    return null;
  }

  return (
    <main className="animated-gradient min-h-screen text-slate-900 dark:text-slate-100">
      <audio
        ref={audioRef}
        src="https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a73467.mp3?filename=lofi-study-112191.mp3"
        loop
      />
      <button onClick={toggleMute} className="fixed right-4 top-4 z-20 rounded-full bg-black/40 px-3 py-2 text-xs text-white">
        {isMuted ? "Unmute" : "Mute"} music
      </button>
      <div className="mx-auto flex min-h-screen w-full max-w-lg flex-col gap-4 px-4 py-6">
        <header className="card bg-white dark:bg-white/5">
          <div className="mb-3 flex items-center justify-between">
            <h1 className="text-2xl font-bold">Daily Trivia</h1>
            <button
              onClick={toggleTheme}
              className="rounded-xl border border-slate-300 px-3 py-1 text-sm dark:border-white/20"
            >
              {theme === "dark" ? "Light mode" : "Dark mode"}
            </button>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            10 categories, 10 questions each. Answer correctly to move forward.
          </p>
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => setShowLeaderboard((value) => !value)}
              className="rounded-xl border border-slate-300 px-3 py-1 text-sm dark:border-white/20"
            >
              {showLeaderboard ? "Hide leaderboard" : "Global leaderboard"}
            </button>
            {!musicReady && (
              <div className="rounded-xl border border-amber-300 px-3 py-1 text-xs text-amber-700 dark:border-amber-400/50 dark:text-amber-200">
                Tap Mute/Unmute to start music
              </div>
            )}
          </div>
        </header>

        {showLeaderboard && (
          <section className="card bg-white dark:bg-white/5">
            <h3 className="mb-2 text-lg font-semibold">Top 10 scores</h3>
            {leaderboard.length === 0 ? (
              <p className="text-sm text-slate-600 dark:text-slate-300">
                No scores yet. Complete at least one category to appear here.
              </p>
            ) : (
              <ol className="space-y-2">
                {leaderboard.map((entry, index) => (
                  <li key={`${entry.playedAt}-${entry.score}-${index}`} className="rounded-xl bg-slate-50 p-3 text-sm dark:bg-black/20">
                    #{index + 1} - {entry.playerName}: {entry.score} pts (level {entry.reachedLevel}/100)
                  </li>
                ))}
              </ol>
            )}
          </section>
        )}

        {!progress.playerName ? (
          <section className="card bg-white dark:bg-white/5">
            <h2 className="mb-2 text-xl font-semibold">Enter your name to start</h2>
            <p className="mb-3 text-sm text-slate-600 dark:text-slate-300">
              Your name will appear on the leaderboard.
            </p>
            <input
              value={playerNameInput}
              onChange={(event) => setPlayerNameInput(event.target.value)}
              maxLength={24}
              placeholder="Name or nickname"
              className="mb-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none ring-indigo-300 focus:ring-2 dark:border-white/20 dark:bg-black/20 dark:text-white"
            />
            {nameError && <p className="mb-2 text-sm font-semibold text-rose-500">{nameError}</p>}
            <button onClick={savePlayerName} className="w-full rounded-xl bg-indigo-600 px-4 py-3 font-semibold text-white">
              Start quiz
            </button>
          </section>
        ) : (

        <section className="card bg-white dark:bg-white/5">
          <div className="mb-3">
            <div className="flex items-center justify-between text-sm">
              <div className="font-semibold">Category {currentSection}/{TOTAL_SECTIONS}</div>
              <div className="text-slate-600 dark:text-slate-300">
                Level {currentLevel}/{TOTAL_LEVELS}
              </div>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
              <div
                className="h-full rounded-full bg-indigo-600 transition-[width]"
                style={{ width: `${(currentLevel / TOTAL_LEVELS) * 100}%` }}
              />
            </div>
          </div>

          <div className="mb-4 rounded-xl bg-slate-50 p-3 text-sm dark:bg-black/20">
            <div className="flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-300">Total score</span>
              <span className="text-lg font-bold">{progress.totalScore}</span>
            </div>
            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">+10 first try, +5 second try</div>
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
                  className={`w-full rounded-xl border px-4 py-3 text-left transition ${
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
                {feedback === "correct" ? "Correct!" : "Not this time - try again."}
              </p>
              <p className="text-sm text-slate-700 dark:text-slate-200">{question.explanation}</p>
              {feedback === "correct" && (
                <p className="mt-1 text-sm font-semibold text-indigo-600 dark:text-indigo-300">
                  {lastPointsAwarded > 0 ? `You earned +${lastPointsAwarded} points.` : "Correct, but no points on this attempt."}
                </p>
              )}
            </div>
          )}

          {feedback === "correct" && (
            <div className="mt-4">
              <button
                onClick={shareOnWhatsApp}
                className="mb-2 w-full rounded-xl border border-emerald-600 bg-emerald-600/10 px-4 py-3 font-semibold text-emerald-700 dark:text-emerald-200"
              >
                Share on WhatsApp
              </button>
              {currentLevel < TOTAL_LEVELS ? (
                <button
                  onClick={goToNextLevel}
                  className="w-full rounded-xl bg-indigo-600 px-4 py-3 font-semibold text-white"
                >
                  Next level
                </button>
              ) : (
                <div className="rounded-xl border border-white/10 bg-slate-50 p-3 text-center dark:bg-black/20">
                  <div className="mb-1 font-semibold text-emerald-500">You completed all 100 levels!</div>
                  <div className="mb-3 text-sm text-slate-700 dark:text-slate-200">Final score: {progress.totalScore}</div>
                  <button
                    onClick={restart}
                    className="w-full rounded-xl bg-indigo-600 px-4 py-3 font-semibold text-white"
                  >
                    Restart
                  </button>
                </div>
              )}
            </div>
          )}
        </section>
        )}

        <section className="card bg-white dark:bg-white/5">
          <div className="text-sm text-slate-600 dark:text-slate-300">Progress is saved on this device (localStorage).</div>
          <div className="mt-3 grid grid-cols-2 gap-3 text-center">
            <div className="rounded-xl bg-slate-50 p-3 dark:bg-white/5">
              <div className="text-sm text-slate-600 dark:text-slate-300">Current level</div>
              <div className="text-2xl font-bold">{currentLevel}</div>
            </div>
            <div className="rounded-xl bg-slate-50 p-3 dark:bg-white/5">
              <div className="text-sm text-slate-600 dark:text-slate-300">Remaining</div>
              <div className="text-2xl font-bold">{Math.max(0, TOTAL_LEVELS - currentLevel)}</div>
            </div>
          </div>
          <div className="mt-3 text-xs text-slate-500 dark:text-slate-400">Player: {progress.playerName || "Not set yet"}</div>
        </section>
      </div>
    </main>
  );
}
