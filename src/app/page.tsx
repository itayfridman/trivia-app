"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { defaultPlayer, loadPlayer, savePlayer, type LeaderboardEntry, type StoredPlayer } from "@/lib/storage";
import { LEVELS_PER_CATEGORY, QUESTIONS_PER_LEVEL, fetchLevelQuestions, getCategories, type TriviaCategory, type TriviaQuestion } from "@/lib/trivia";

type Theme = "dark" | "light";
type Screen = "entry" | "menu" | "quiz" | "summary";
type Feedback = "correct" | "wrong" | null;

export default function Home() {
  const categories = useMemo(() => getCategories(), []);
  const [player, setPlayer] = useState<StoredPlayer>(defaultPlayer);
  const [screen, setScreen] = useState<Screen>("entry");
  const [activeCategory, setActiveCategory] = useState<TriviaCategory | null>(null);
  const [runQuestions, setRunQuestions] = useState<TriviaQuestion[]>([]);
  const [currentLevel, setCurrentLevel] = useState(1);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [totalScore, setTotalScore] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [incorrectAnswers, setIncorrectAnswers] = useState(0);
  const [timeLeft, setTimeLeft] = useState(20);
  const [isSubmittingScore, setIsSubmittingScore] = useState(false);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [leaderboardError, setLeaderboardError] = useState("");
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [playerNameInput, setPlayerNameInput] = useState("");
  const [nameError, setNameError] = useState("");
  const [theme, setTheme] = useState<Theme>("dark");
  const [isMuted, setIsMuted] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const musicTimerRef = useRef<number | null>(null);
  const askedQuestionIdsRef = useRef<Set<string>>(new Set());

  const currentQuestion = runQuestions[questionIndex] ?? null;
  const hasAnswered = feedback !== null;
  const isEndOfLevel = questionIndex + 1 === QUESTIONS_PER_LEVEL;
  const isFinalQuestion = isEndOfLevel && currentLevel === LEVELS_PER_CATEGORY;

  useEffect(() => {
    const savedTheme = window.localStorage.getItem("trivia-theme") as Theme | null;
    const initialTheme = savedTheme ?? "dark";
    setTheme(initialTheme);
    document.documentElement.classList.toggle("dark", initialTheme === "dark");
    document.documentElement.classList.toggle("light", initialTheme === "light");

    const loadedPlayer = loadPlayer();
    setPlayer(loadedPlayer);
    setPlayerNameInput(loadedPlayer.playerName);
    setScreen(loadedPlayer.playerName ? "menu" : "entry");
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    return () => {
      if (musicTimerRef.current !== null) {
        window.clearInterval(musicTimerRef.current);
      }
      audioContextRef.current?.close().catch(() => undefined);
    };
  }, []);

  const getAudioContext = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new window.AudioContext();
    }
    return audioContextRef.current;
  };

  const stopBackgroundMusic = () => {
    if (musicTimerRef.current !== null) {
      window.clearInterval(musicTimerRef.current);
      musicTimerRef.current = null;
    }
  };

  const startBackgroundMusic = async () => {
    if (isMuted || musicTimerRef.current !== null) return;
    const context = getAudioContext();
    if (context.state === "suspended") await context.resume();

    const melody = [261.63, 329.63, 392.0, 523.25, 392.0, 329.63];
    let index = 0;
    const playNote = () => {
      if (isMuted) return;
      const now = context.currentTime;
      const osc = context.createOscillator();
      const gain = context.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(melody[index % melody.length], now);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.05, now + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.42);
      osc.connect(gain);
      gain.connect(context.destination);
      osc.start(now);
      osc.stop(now + 0.45);
      index += 1;
    };
    playNote();
    musicTimerRef.current = window.setInterval(playNote, 500);
  };

  const playEffect = async (kind: "good" | "bad") => {
    if (isMuted) return;
    const context = getAudioContext();
    if (context.state === "suspended") await context.resume();
    const now = context.currentTime;

    if (kind === "good") {
      const fanfare = [523.25, 659.25, 783.99, 1046.5];
      fanfare.forEach((freq, idx) => {
        const osc = context.createOscillator();
        const gain = context.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(freq, now + idx * 0.12);
        gain.gain.setValueAtTime(0.0001, now + idx * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.08, now + idx * 0.12 + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.12 + 0.22);
        osc.connect(gain);
        gain.connect(context.destination);
        osc.start(now + idx * 0.12);
        osc.stop(now + idx * 0.12 + 0.25);
      });
      return;
    }

    const buzz = context.createOscillator();
    const gain = context.createGain();
    buzz.type = "square";
    buzz.frequency.setValueAtTime(220, now);
    buzz.frequency.exponentialRampToValueAtTime(70, now + 0.5);
    gain.gain.setValueAtTime(0.09, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);
    buzz.connect(gain);
    gain.connect(context.destination);
    buzz.start(now);
    buzz.stop(now + 0.5);
  };

  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (nextMuted) stopBackgroundMusic();
    if (!nextMuted) void startBackgroundMusic();
  };

  const loadLeaderboard = async () => {
    try {
      const response = await fetch("/api/leaderboard");
      const data = (await response.json()) as { entries: LeaderboardEntry[]; error?: string };
      if (!response.ok) {
        setLeaderboardError(data.error ?? "Could not load leaderboard right now.");
        return;
      }
      setLeaderboard(data.entries ?? []);
      setLeaderboardError("");
    } catch {
      setLeaderboardError("Could not load leaderboard right now.");
    }
  };

  useEffect(() => {
    if (!isLoaded) return;
    void loadLeaderboard();
  }, [isLoaded]);

  const loadLevel = async (category: TriviaCategory, level: number) => {
    setIsLoadingQuestions(true);
    try {
      const questions = await fetchLevelQuestions(category, level, askedQuestionIdsRef.current);
      questions.forEach((question) => askedQuestionIdsRef.current.add(question.id));
      setRunQuestions(questions);
      setQuestionIndex(0);
      setSelectedIndex(null);
      setFeedback(null);
      setTimeLeft(20);
      setLeaderboardError("");
    } catch {
      setLeaderboardError("Could not load questions for this level. Please try again.");
    } finally {
      setIsLoadingQuestions(false);
    }
  };

  useEffect(() => {
    if (screen !== "quiz" || !currentQuestion || hasAnswered || isLoadingQuestions) return;
    const timer = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(timer);
          submitAnswer(-1, true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [screen, currentQuestion, hasAnswered, isLoadingQuestions]);

  const submitAnswer = (index: number, timedOut = false) => {
    if (!currentQuestion || hasAnswered) return;
    const isCorrect = index === currentQuestion.correctAnswerIndex;
    setSelectedIndex(index >= 0 ? index : null);
    setFeedback(isCorrect ? "correct" : "wrong");
    if (isCorrect) {
      setTotalScore((prev) => prev + 10);
      setCorrectAnswers((prev) => prev + 1);
      void playEffect("good");
      return;
    }
    setIncorrectAnswers((prev) => prev + 1);
    if (timedOut) setLeaderboardError("Time is up for this question.");
    void playEffect("bad");
  };

  const goNextQuestion = async () => {
    if (!activeCategory || !hasAnswered) return;
    if (questionIndex + 1 < QUESTIONS_PER_LEVEL) {
      setQuestionIndex((prev) => prev + 1);
      setSelectedIndex(null);
      setFeedback(null);
      setTimeLeft(20);
      return;
    }

    if (currentLevel < LEVELS_PER_CATEGORY) {
      const nextLevel = currentLevel + 1;
      setCurrentLevel(nextLevel);
      await loadLevel(activeCategory, nextLevel);
      return;
    }

    setIsSubmittingScore(true);
    try {
      const response = await fetch("/api/leaderboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: player.playerName,
          score: totalScore,
          category: activeCategory.title,
          level: LEVELS_PER_CATEGORY,
        }),
      });
      const data = (await response.json()) as { entries: LeaderboardEntry[]; error?: string };
      if (response.ok) {
        setLeaderboard(data.entries ?? []);
        setLeaderboardError("");
      } else {
        setLeaderboardError(data.error ?? "Could not submit score.");
      }
    } catch {
      setLeaderboardError("Could not submit score.");
    } finally {
      setIsSubmittingScore(false);
      setScreen("summary");
    }
  };

  useEffect(() => {
    if (!hasAnswered || !isEndOfLevel || isFinalQuestion || isLoadingQuestions) return;
    const timeout = window.setTimeout(() => {
      void goNextQuestion();
    }, 900);
    return () => window.clearTimeout(timeout);
  }, [hasAnswered, isEndOfLevel, isFinalQuestion, isLoadingQuestions]);

  const startCategory = async (category: TriviaCategory) => {
    setActiveCategory(category);
    askedQuestionIdsRef.current = new Set();
    setCurrentLevel(1);
    setRunQuestions([]);
    setQuestionIndex(0);
    setSelectedIndex(null);
    setFeedback(null);
    setTotalScore(0);
    setCorrectAnswers(0);
    setIncorrectAnswers(0);
    setTimeLeft(20);
    setScreen("quiz");
    setLeaderboardError("");
    await loadLevel(category, 1);
    await startBackgroundMusic();
  };

  const replayCategory = () => {
    if (!activeCategory) return;
    void startCategory(activeCategory);
  };

  const savePlayerName = () => {
    const cleanedName = playerNameInput.trim().slice(0, 24);
    if (!cleanedName) {
      setNameError("Please enter your name or nickname to start.");
      return;
    }
    const nextPlayer: StoredPlayer = { playerName: cleanedName };
    setPlayer(nextPlayer);
    savePlayer(nextPlayer);
    setPlayerNameInput(cleanedName);
    setNameError("");
    setScreen("menu");
  };

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.classList.toggle("dark", next === "dark");
    document.documentElement.classList.toggle("light", next === "light");
    window.localStorage.setItem("trivia-theme", next);
  };

  const shareToWhatsapp = () => {
    if (!activeCategory) return;
    const text = `${player.playerName} scored ${totalScore} points in ${activeCategory.title} on Daily Trivia!`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
  };

  return (
    <main className="animated-gradient min-h-screen text-slate-900 transition-all duration-300 dark:text-slate-100">
      <button onClick={toggleMute} className="fixed right-4 top-4 z-20 rounded-full bg-black/40 px-3 py-2 text-xs text-white">
        {isMuted ? "Unmute" : "Mute"}
      </button>
      <div className="mx-auto flex min-h-screen w-full max-w-lg flex-col gap-4 px-4 py-6">
        <header className="card bg-white dark:bg-white/5">
          <div className="mb-3 flex items-center justify-between">
            <h1 className="text-2xl font-bold">Daily Trivia</h1>
            <button onClick={toggleTheme} className="rounded-xl border border-slate-300 px-3 py-1 text-sm dark:border-white/20">
              {theme === "dark" ? "Light mode" : "Dark mode"}
            </button>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-300">10 categories, 10 levels per category, 10 questions per level.</p>
          <div className="mt-3 flex gap-2">
            <button onClick={() => setShowLeaderboard((value) => !value)} className="rounded-xl border border-slate-300 px-3 py-1 text-sm dark:border-white/20">
              {showLeaderboard ? "Hide leaderboard" : "Global leaderboard"}
            </button>
          </div>
        </header>

        {showLeaderboard && (
          <section className="card bg-white dark:bg-white/5">
            <h3 className="mb-2 text-lg font-semibold">Top 10 scores</h3>
            {leaderboard.length === 0 ? (
              <p className="text-sm text-slate-600 dark:text-slate-300">No scores yet. Complete at least one category run to appear here.</p>
            ) : (
              <ol className="space-y-2">
                {leaderboard.map((entry, index) => (
                  <li key={`${entry.id}-${entry.score}-${index}`} className="rounded-xl bg-slate-50 p-3 text-sm dark:bg-black/20">
                    #{index + 1} - {entry.username}: {entry.score} pts ({entry.category}, lvl {entry.level})
                  </li>
                ))}
              </ol>
            )}
          </section>
        )}

        {screen === "entry" ? (
          <section className="card bg-white dark:bg-white/5">
            <h2 className="mb-2 text-xl font-semibold">Enter your name to start</h2>
            <p className="mb-3 text-sm text-slate-600 dark:text-slate-300">Your name will appear on the leaderboard and in WhatsApp share.</p>
            <input
              value={playerNameInput}
              onChange={(event) => setPlayerNameInput(event.target.value)}
              maxLength={24}
              placeholder="Name or nickname"
              className="mb-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none ring-indigo-300 focus:ring-2 dark:border-white/20 dark:bg-black/20 dark:text-white"
            />
            {nameError && <p className="mb-2 text-sm font-semibold text-rose-500">{nameError}</p>}
            <button onClick={savePlayerName} className="w-full rounded-xl bg-indigo-600 px-4 py-3 font-semibold text-white">
              Continue
            </button>
          </section>
        ) : null}

        {screen === "menu" ? (
          <section className="card bg-white dark:bg-white/5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Choose a category</h2>
              <span className="text-sm text-slate-600 dark:text-slate-300">{player.playerName}</span>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-2">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => void startCategory(category)}
                  className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-4 text-left transition hover:-translate-y-0.5 hover:bg-slate-100 dark:border-white/15 dark:bg-white/5 dark:hover:bg-white/10"
                >
                  <div className="text-xs text-indigo-500">Category {category.id}</div>
                  <div className="font-semibold">{category.title}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">10 levels x 10 questions</div>
                </button>
              ))}
            </div>
          </section>
        ) : null}

        {screen === "quiz" && activeCategory ? (
          <section className="card animate-fade-in bg-white dark:bg-white/5">
            {isLoadingQuestions || !currentQuestion ? (
              <p className="text-sm text-slate-600 dark:text-slate-300">Loading fresh questions for this level...</p>
            ) : (
              <>
                <div className="mb-3 flex items-center justify-between text-sm">
                  <div className="font-semibold">
                    Level {currentLevel}/{LEVELS_PER_CATEGORY} - Question {questionIndex + 1}/{QUESTIONS_PER_LEVEL}
                  </div>
                  <div className="rounded-full bg-slate-100 px-2 py-1 text-xs dark:bg-white/10">Time: {timeLeft}s</div>
                </div>

                <div className="mb-4 rounded-xl bg-slate-50 p-3 text-sm dark:bg-black/20">
                  <div className="flex items-center justify-between">
                    <span>Category</span>
                    <span className="font-semibold">{activeCategory.title}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span>Current score</span>
                    <span className="text-lg font-bold">{totalScore}</span>
                  </div>
                </div>

                <h2 className="mb-4 text-xl font-semibold">{currentQuestion.question}</h2>
                <div className="space-y-2">
                  {currentQuestion.answers.map((answer, index) => {
                    const isCorrect = index === currentQuestion.correctAnswerIndex;
                    const isPicked = selectedIndex === index;
                    const showCorrect = hasAnswered && isCorrect;
                    const showWrongPicked = hasAnswered && isPicked && !isCorrect;
                    return (
                      <button
                        key={`${answer}-${index}`}
                        onClick={() => submitAnswer(index)}
                        disabled={hasAnswered}
                        className={`w-full rounded-xl border px-4 py-3 text-left transition ${
                          showCorrect
                            ? "border-emerald-400 bg-emerald-100 text-emerald-900 dark:bg-emerald-500/20 dark:text-emerald-100"
                            : showWrongPicked
                              ? "border-rose-400 bg-rose-100 text-rose-900 dark:bg-rose-500/20 dark:text-rose-100"
                              : isPicked
                                ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10"
                                : "border-slate-300 bg-slate-50 hover:bg-slate-100 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
                        } ${hasAnswered ? "cursor-not-allowed" : ""}`}
                      >
                        {answer}
                      </button>
                    );
                  })}
                </div>

                {feedback && (
                  <div className="mt-4 rounded-xl border border-white/10 bg-slate-50 p-3 dark:bg-black/20">
                    <p className={`mb-2 font-semibold ${feedback === "correct" ? "text-emerald-500" : "text-rose-500"}`}>
                      {feedback === "correct" ? "Correct!" : "Incorrect."}
                    </p>
                    <p className="text-sm text-slate-700 dark:text-slate-200">{currentQuestion.explanation}</p>
                  </div>
                )}

                {hasAnswered ? (
                  <button onClick={() => void goNextQuestion()} className="mt-4 w-full rounded-xl bg-indigo-600 px-4 py-3 font-semibold text-white">
                    {isFinalQuestion ? (isSubmittingScore ? "Saving..." : "Finish category") : isEndOfLevel ? "Advancing to next level..." : "Next question"}
                  </button>
                ) : null}
              </>
            )}
          </section>
        ) : null}

        {screen === "summary" && activeCategory ? (
          <section className="card animate-fade-in bg-white dark:bg-white/5">
            <h2 className="mb-2 text-xl font-semibold">Category summary</h2>
            <p className="mb-4 text-sm text-slate-600 dark:text-slate-300">{activeCategory.title} completed (all 10 levels).</p>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl bg-slate-50 p-3 dark:bg-white/5">
                <div className="text-xs text-slate-500">Score</div>
                <div className="text-xl font-bold">{totalScore}</div>
              </div>
              <div className="rounded-xl bg-slate-50 p-3 dark:bg-white/5">
                <div className="text-xs text-slate-500">Correct</div>
                <div className="text-xl font-bold text-emerald-500">{correctAnswers}</div>
              </div>
              <div className="rounded-xl bg-slate-50 p-3 dark:bg-white/5">
                <div className="text-xs text-slate-500">Incorrect</div>
                <div className="text-xl font-bold text-rose-500">{incorrectAnswers}</div>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <button onClick={replayCategory} className="w-full rounded-xl border border-slate-300 px-4 py-3 font-semibold dark:border-white/20">
                Replay category
              </button>
              <button onClick={() => setScreen("menu")} className="w-full rounded-xl bg-indigo-600 px-4 py-3 font-semibold text-white">
                Main menu
              </button>
            </div>
            <button onClick={shareToWhatsapp} className="mt-2 w-full rounded-xl border border-emerald-400 px-4 py-3 font-semibold text-emerald-600 dark:text-emerald-300">
              Share on WhatsApp
            </button>
          </section>
        ) : null}

        {leaderboardError ? (
          <section className="card bg-white dark:bg-white/5">
            <p className="text-sm text-rose-500">{leaderboardError}</p>
          </section>
        ) : null}

        {screen !== "quiz" ? (
          <section className="card bg-white dark:bg-white/5">
            <div className="text-sm text-slate-600 dark:text-slate-300">10 categories x 10 levels x 10 fresh API questions per run.</div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
