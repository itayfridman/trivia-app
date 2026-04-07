"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { defaultPlayer, loadPlayer, savePlayer, type LeaderboardEntry, type StoredPlayer } from "@/lib/storage";
import { QUESTIONS_PER_SECTION, getSections, type TriviaSection } from "@/lib/trivia";

type Theme = "dark" | "light";
type Screen = "entry" | "menu" | "quiz" | "summary";
type Feedback = "correct" | "wrong" | null;

export default function Home() {
  const sections = useMemo(() => getSections(), []);
  const [player, setPlayer] = useState<StoredPlayer>(defaultPlayer);
  const [screen, setScreen] = useState<Screen>("entry");
  const [activeSection, setActiveSection] = useState<TriviaSection | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [sectionScore, setSectionScore] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [incorrectAnswers, setIncorrectAnswers] = useState(0);
  const [timeLeft, setTimeLeft] = useState(20);
  const [isSubmittingScore, setIsSubmittingScore] = useState(false);
  const [leaderboardError, setLeaderboardError] = useState("");
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [playerNameInput, setPlayerNameInput] = useState("");
  const [nameError, setNameError] = useState("");
  const [theme, setTheme] = useState<Theme>("dark");
  const [isMuted, setIsMuted] = useState(false);
  const [musicReady, setMusicReady] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const currentQuestion = activeSection?.questions[questionIndex] ?? null;
  const hasAnswered = feedback !== null;

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
    if (screen !== "quiz" || !currentQuestion || hasAnswered) {
      return;
    }
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
  }, [screen, currentQuestion, hasAnswered]);

  const playTone = (kind: "good" | "bad") => {
    const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass || isMuted) return;
    const context = new AudioContextClass();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = kind === "good" ? 740 : 210;
    gain.gain.value = 0.05;
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.15);
  };

  const loadLeaderboard = async () => {
    try {
      const response = await fetch("/api/leaderboard");
      const data = (await response.json()) as { entries: LeaderboardEntry[] };
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

  const submitAnswer = (index: number, timedOut = false) => {
    if (!currentQuestion || hasAnswered) return;
    const isCorrect = index === currentQuestion.correctAnswerIndex;
    setSelectedIndex(index >= 0 ? index : null);
    setFeedback(isCorrect ? "correct" : "wrong");
    if (isCorrect) {
      setSectionScore((prev) => prev + 10);
      setCorrectAnswers((prev) => prev + 1);
      playTone("good");
      return;
    }
    setIncorrectAnswers((prev) => prev + 1);
    if (timedOut) {
      setLeaderboardError("Time is up for this question.");
    }
    playTone("bad");
  };

  const goNextQuestion = async () => {
    if (!activeSection || !hasAnswered) return;
    if (questionIndex + 1 < QUESTIONS_PER_SECTION) {
      setQuestionIndex((prev) => prev + 1);
      setSelectedIndex(null);
      setFeedback(null);
      setTimeLeft(20);
      return;
    }

    setIsSubmittingScore(true);
    try {
      const response = await fetch("/api/leaderboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerName: player.playerName,
          score: sectionScore,
          sectionId: activeSection.id,
          sectionTitle: activeSection.title,
          correctAnswers,
          incorrectAnswers,
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

  const startSection = (section: TriviaSection) => {
    setActiveSection(section);
    setQuestionIndex(0);
    setSelectedIndex(null);
    setFeedback(null);
    setSectionScore(0);
    setCorrectAnswers(0);
    setIncorrectAnswers(0);
    setTimeLeft(20);
    setScreen("quiz");
    setLeaderboardError("");
  };

  const replaySection = () => {
    if (!activeSection) return;
    startSection(activeSection);
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

  return (
    <main className="animated-gradient min-h-screen text-slate-900 transition-all duration-300 dark:text-slate-100">
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
                    #{index + 1} - {entry.playerName}: {entry.score} pts ({entry.sectionTitle})
                  </li>
                ))}
              </ol>
            )}
          </section>
        )}

        {screen === "entry" ? (
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
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => startSection(section)}
                  className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-4 text-left transition hover:-translate-y-0.5 hover:bg-slate-100 dark:border-white/15 dark:bg-white/5 dark:hover:bg-white/10"
                >
                  <div className="text-xs text-indigo-500">Section {section.id}</div>
                  <div className="font-semibold">{section.title}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">10 questions</div>
                </button>
              ))}
            </div>
          </section>
        ) : null}

        {screen === "quiz" && currentQuestion && activeSection ? (
          <section className="card bg-white dark:bg-white/5 animate-fade-in">
            <div className="mb-3 flex items-center justify-between text-sm">
              <div className="font-semibold">
                Question {questionIndex + 1}/{QUESTIONS_PER_SECTION}
              </div>
              <div className="rounded-full bg-slate-100 px-2 py-1 text-xs dark:bg-white/10">Time: {timeLeft}s</div>
            </div>

            <div className="mb-4 rounded-xl bg-slate-50 p-3 text-sm dark:bg-black/20">
              <div className="flex items-center justify-between">
                <span>Category</span>
                <span className="font-semibold">{activeSection.title}</span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span>Current score</span>
                <span className="text-lg font-bold">{sectionScore}</span>
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
                    key={answer}
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
                {questionIndex + 1 === QUESTIONS_PER_SECTION ? (isSubmittingScore ? "Saving..." : "Finish section") : "Next question"}
              </button>
            ) : null}
          </section>
        ) : null}

        {screen === "summary" && activeSection ? (
          <section className="card bg-white dark:bg-white/5 animate-fade-in">
            <h2 className="mb-2 text-xl font-semibold">Section summary</h2>
            <p className="mb-4 text-sm text-slate-600 dark:text-slate-300">
              {activeSection.title} completed.
            </p>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl bg-slate-50 p-3 dark:bg-white/5">
                <div className="text-xs text-slate-500">Score</div>
                <div className="text-xl font-bold">{sectionScore}</div>
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
              <button onClick={replaySection} className="w-full rounded-xl border border-slate-300 px-4 py-3 font-semibold dark:border-white/20">
                Replay section
              </button>
              <button onClick={() => setScreen("menu")} className="w-full rounded-xl bg-indigo-600 px-4 py-3 font-semibold text-white">
                Main menu
              </button>
            </div>
          </section>
        ) : null}

        {leaderboardError ? (
          <section className="card bg-white dark:bg-white/5">
            <p className="text-sm text-rose-500">{leaderboardError}</p>
          </section>
        ) : null}

        {screen !== "quiz" ? (
          <section className="card bg-white dark:bg-white/5">
            <div className="text-sm text-slate-600 dark:text-slate-300">10 categories x 10 questions = 100 total questions.</div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
