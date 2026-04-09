"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { defaultPlayer, loadPlayer, savePlayer, type LeaderboardEntry, type StoredPlayer } from "@/lib/storage";
import { LEVELS_PER_CATEGORY, QUESTIONS_PER_LEVEL, fetchLevelQuestions, getCategories, type TriviaCategory, type TriviaQuestion } from "@/lib/trivia";

type Theme = "dark" | "light";
type Screen = "entry" | "menu" | "quiz" | "summary" | "daily" | "profile" | "multiplayer";
type Feedback = "correct" | "wrong" | null;
const QUESTION_TIME_SECONDS = 15;
const STREAK_BONUS_EVERY = 3;
const STREAK_BONUS_POINTS = 5;
const STREAK_BONUS_COINS = 5;
const COINS_PER_CORRECT = 10;
const HINT_COST = 10;
const SKIP_COST = 15;
const EXTRA_LIFE_COST = 20;
const ELO_GAIN = 8;
const ELO_LOSS = 5;

type DailyState = {
  today: string;
  completedCount: number;
  top3: { player_id: string; score: number; total_time_ms: number }[];
  questions: TriviaQuestion[];
};

type MatchState = {
  id: string;
  player1_id: string;
  player2_id: string;
  questions: TriviaQuestion[];
  status?: "pending" | "active" | "finished";
};

type FriendInviteNotification = {
  matchId: string;
  challengerId: string;
  challengerName: string;
};

const getTodayUtcDate = (): string => new Date().toISOString().slice(0, 10);
const getMsUntilNextUtcMidnight = (): number => {
  const now = new Date();
  const nextMidnight = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0, 0);
  return Math.max(0, nextMidnight - now.getTime());
};
const formatMsAsClock = (ms: number): string => {
  const total = Math.max(0, Math.floor(ms / 1000));
  const hours = String(Math.floor(total / 3600)).padStart(2, "0");
  const minutes = String(Math.floor((total % 3600) / 60)).padStart(2, "0");
  const seconds = String(total % 60).padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
};
const getTierName = (elo: number): "Bronze" | "Silver" | "Gold" | "Platinum" => {
  if (elo < 1000) return "Bronze";
  if (elo < 1200) return "Silver";
  if (elo < 1500) return "Gold";
  return "Platinum";
};

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
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME_SECONDS);
  const [isSubmittingScore, setIsSubmittingScore] = useState(false);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [leaderboardError, setLeaderboardError] = useState("");
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [playerNameInput, setPlayerNameInput] = useState("");
  const [friendIdInput, setFriendIdInput] = useState("");
  const [nameError, setNameError] = useState("");
  const [theme, setTheme] = useState<Theme>("dark");
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(70);
  const [streakCount, setStreakCount] = useState(0);
  const [streakMessage, setStreakMessage] = useState("");
  const [hiddenAnswerIndex, setHiddenAnswerIndex] = useState<number | null>(null);
  const [confettiTick, setConfettiTick] = useState(0);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [extraLives, setExtraLives] = useState(0);
  const [dailyState, setDailyState] = useState<DailyState | null>(null);
  const [dailySubmitted, setDailySubmitted] = useState(false);
  const [dailyQuestionIndex, setDailyQuestionIndex] = useState(0);
  const [dailyScore, setDailyScore] = useState(0);
  const [dailyCorrect, setDailyCorrect] = useState(0);
  const [dailyStartTimeMs, setDailyStartTimeMs] = useState(0);
  const [matchState, setMatchState] = useState<MatchState | null>(null);
  const [isMatchmaking, setIsMatchmaking] = useState(false);
  const [opponentProgress, setOpponentProgress] = useState({ answered: 0, correct: 0 });
  const [multiAnsweredThisQuestion, setMultiAnsweredThisQuestion] = useState(false);
  const [showNameEditor, setShowNameEditor] = useState(false);
  const [dailyHasAttempted, setDailyHasAttempted] = useState(false);
  const [showShop, setShowShop] = useState(false);
  const [isStartingCheckout, setIsStartingCheckout] = useState(false);
  const [checkoutMessage, setCheckoutMessage] = useState("");
  const [incomingInvite, setIncomingInvite] = useState<FriendInviteNotification | null>(null);
  const [nextDailyCountdownMs, setNextDailyCountdownMs] = useState(getMsUntilNextUtcMidnight());

  const audioContextRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const musicTimerRef = useRef<number | null>(null);
  const askedQuestionIdsRef = useRef<Set<string>>(new Set());
  const isMutedRef = useRef(isMuted);
  const totalScoreRef = useRef(totalScore);
  const playerRef = useRef(player);
  const activeCategoryRef = useRef(activeCategory);
  const currentLevelRef = useRef(currentLevel);
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null);
  const multiAnsweredRef = useRef(0);
  const multiCorrectRef = useRef(0);
  const multiTimeRef = useRef(0);
  const multiStartTimeRef = useRef(0);
  const matchChannelRef = useRef<ReturnType<NonNullable<typeof supabaseRef.current>["channel"]> | null>(null);
  const friendPollingRef = useRef<number | null>(null);
  const randomPollingRef = useRef<number | null>(null);
  const inviteChannelRef = useRef<ReturnType<NonNullable<typeof supabaseRef.current>["channel"]> | null>(null);

  const currentQuestion = runQuestions[questionIndex] ?? null;
  const currentDailyQuestion = dailyState?.questions[dailyQuestionIndex] ?? null;
  const hasAnswered = feedback !== null;
  const isEndOfLevel = questionIndex + 1 === QUESTIONS_PER_LEVEL;
  const isFinalQuestion = isEndOfLevel && currentLevel === LEVELS_PER_CATEGORY;

  const AdUnit = ({ slot, label }: { slot: string; label: string }) => {
    useEffect(() => {
      try {
        const ads = window.adsbygoogle as Array<Record<string, unknown>> | undefined;
        ads?.push({});
      } catch {
        // AdSense can fail silently during local development.
      }
    }, []);
    return (
      <div className="mb-3 rounded-xl border border-slate-300 bg-slate-50 p-3 text-xs dark:border-white/20 dark:bg-black/20">
        <div className="mb-2 text-[11px] text-slate-500 dark:text-slate-400">{label}</div>
        <ins className="adsbygoogle block" style={{ display: "block", minHeight: "90px" }} data-ad-client="ca-pub-XXXXXXXXXX" data-ad-slot={slot} data-ad-format="auto" data-full-width-responsive="true" />
      </div>
    );
  };

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
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      supabaseRef.current = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    return () => {
      if (musicTimerRef.current !== null) {
        window.clearInterval(musicTimerRef.current);
      }
      if (friendPollingRef.current !== null) {
        window.clearInterval(friendPollingRef.current);
      }
      if (randomPollingRef.current !== null) {
        window.clearInterval(randomPollingRef.current);
      }
      if (matchChannelRef.current && supabaseRef.current) {
        void supabaseRef.current.removeChannel(matchChannelRef.current);
      }
      if (inviteChannelRef.current && supabaseRef.current) {
        void supabaseRef.current.removeChannel(inviteChannelRef.current);
      }
      audioContextRef.current?.close().catch(() => undefined);
    };
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNextDailyCountdownMs(getMsUntilNextUtcMidnight());
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  useEffect(() => {
    totalScoreRef.current = totalScore;
  }, [totalScore]);

  useEffect(() => {
    playerRef.current = player;
  }, [player]);

  useEffect(() => {
    activeCategoryRef.current = activeCategory;
  }, [activeCategory]);

  useEffect(() => {
    currentLevelRef.current = currentLevel;
  }, [currentLevel]);

  const getAudioContext = () => {
    if (!audioContextRef.current) {
      const AudioContextCtor = window.AudioContext ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextCtor) {
        throw new Error("Web Audio is not supported in this browser.");
      }
      audioContextRef.current = new AudioContextCtor();
      masterGainRef.current = audioContextRef.current.createGain();
      masterGainRef.current.gain.value = isMutedRef.current ? 0 : volume / 100;
      masterGainRef.current.connect(audioContextRef.current.destination);
      
      // iOS-specific: Resume context on first user interaction
      if (audioContextRef.current.state === 'suspended') {
        const resumeContext = () => {
          audioContextRef.current?.resume().catch(() => {});
          document.removeEventListener('touchstart', resumeContext);
          document.removeEventListener('touchend', resumeContext);
          document.removeEventListener('mousedown', resumeContext);
        };
        document.addEventListener('touchstart', resumeContext, { once: true });
        document.addEventListener('touchend', resumeContext, { once: true });
        document.addEventListener('mousedown', resumeContext, { once: true });
      }
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
    if (isMutedRef.current || musicTimerRef.current !== null) return;
    const context = getAudioContext();
    
    // iOS-specific: Ensure context is running
    if (context.state === "suspended") {
      await context.resume();
    }
    
    // Create a dummy sound to unlock audio on iOS
    const unlockOscillator = context.createOscillator();
    const unlockGain = context.createGain();
    unlockGain.gain.value = 0.0001;
    unlockOscillator.connect(unlockGain);
    unlockGain.connect(masterGainRef.current ?? context.destination);
    unlockOscillator.start(context.currentTime);
    unlockOscillator.stop(context.currentTime + 0.01);

    const melody = [523.25, 659.25, 783.99, 659.25, 698.46, 783.99, 880.0, 783.99];
    const bassline = [130.81, 146.83, 164.81, 174.61];
    let index = 0;
    const playNote = () => {
      if (isMutedRef.current) return;
      const now = context.currentTime;
      const lead = context.createOscillator();
      const leadGain = context.createGain();
      lead.type = "triangle";
      lead.frequency.setValueAtTime(melody[index % melody.length], now);
      leadGain.gain.setValueAtTime(0.0001, now);
      leadGain.gain.exponentialRampToValueAtTime(0.035, now + 0.03);
      leadGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);
      lead.connect(leadGain);
      leadGain.connect(masterGainRef.current ?? context.destination);
      lead.start(now);
      lead.stop(now + 0.3);

      const bass = context.createOscillator();
      const bassGain = context.createGain();
      bass.type = "sine";
      bass.frequency.setValueAtTime(bassline[index % bassline.length], now);
      bassGain.gain.setValueAtTime(0.0001, now);
      bassGain.gain.exponentialRampToValueAtTime(0.025, now + 0.04);
      bassGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
      bass.connect(bassGain);
      bassGain.connect(masterGainRef.current ?? context.destination);
      bass.start(now);
      bass.stop(now + 0.36);
      index += 1;
    };
    
    // Start the first note immediately, then set interval
    setTimeout(playNote, 100);
    musicTimerRef.current = window.setInterval(playNote, 360);
  };

  const playEffect = async (kind: "good" | "bad") => {
    if (isMutedRef.current) return;
    const context = getAudioContext();
    
    // iOS-specific: Ensure context is running
    if (context.state === "suspended") {
      await context.resume();
    }
    
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
        gain.connect(masterGainRef.current ?? context.destination);
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
    gain.connect(masterGainRef.current ?? context.destination);
    buzz.start(now);
    buzz.stop(now + 0.5);
  };

  const toggleMute = () => {
    if (audioContextRef.current?.state === "suspended") {
      void audioContextRef.current.resume();
    }
    setIsMuted((prev) => !prev);
  };

  useEffect(() => {
    if (!masterGainRef.current) return;
    const context = audioContextRef.current;
    if (!context) return;
    const now = context.currentTime;
    const nextValue = isMuted ? 0 : volume / 100;
    masterGainRef.current.gain.cancelScheduledValues(now);
    masterGainRef.current.gain.setValueAtTime(masterGainRef.current.gain.value, now);
    masterGainRef.current.gain.linearRampToValueAtTime(nextValue, now + 0.08);
  }, [isMuted, volume]);

  useEffect(() => {
    if (audioContextRef.current?.state === "suspended") {
      void audioContextRef.current.resume();
    }
  }, [volume]);

  useEffect(() => {
    if (!hasInteracted) return;
    if (isMuted) {
      stopBackgroundMusic();
      return;
    }
    void startBackgroundMusic();
  }, [hasInteracted, isMuted]);

  useEffect(() => {
    const onFirstInteraction = () => setHasInteracted(true);
    window.addEventListener("pointerdown", onFirstInteraction, { once: true });
    window.addEventListener("keydown", onFirstInteraction, { once: true });
    return () => {
      window.removeEventListener("pointerdown", onFirstInteraction);
      window.removeEventListener("keydown", onFirstInteraction);
    };
  }, []);

  useEffect(() => {
    if (!supabaseRef.current || !player.playerId || !player.playerName) return;
    if (inviteChannelRef.current) {
      void supabaseRef.current.removeChannel(inviteChannelRef.current);
      inviteChannelRef.current = null;
    }
    const channel = supabaseRef.current.channel(`player-${player.playerId}`);
    channel.on("broadcast", { event: "friend-invite" }, (payload) => {
      const data = payload.payload as Partial<FriendInviteNotification>;
      if (!data.matchId || !data.challengerId || !data.challengerName) return;
      setIncomingInvite({
        matchId: data.matchId,
        challengerId: data.challengerId,
        challengerName: data.challengerName,
      });
    });
    channel.on("broadcast", { event: "invite-response" }, (payload) => {
      const data = payload.payload as { accepted?: boolean; declined?: boolean; friendId?: string; friendName?: string; match?: MatchState };
      if (data.accepted && data.match) {
        setLeaderboardError(`${data.friendName ?? data.friendId ?? "Friend"} accepted your challenge!`);
        setMatchState(data.match);
        setScreen("multiplayer");
        setQuestionIndex(0);
        setMultiAnsweredThisQuestion(false);
        multiAnsweredRef.current = 0;
        multiCorrectRef.current = 0;
        multiStartTimeRef.current = Date.now();
        multiTimeRef.current = 0;
        setIsMatchmaking(false);
        if (friendPollingRef.current !== null) {
          window.clearInterval(friendPollingRef.current);
          friendPollingRef.current = null;
        }
        joinRealtimeMatch(data.match.id);
      } else if (data.declined) {
        setLeaderboardError(`${data.friendName ?? data.friendId ?? "Friend"} declined your challenge.`);
        setIsMatchmaking(false);
      }
    });
    void channel.subscribe();
    inviteChannelRef.current = channel;
    return () => {
      if (inviteChannelRef.current && supabaseRef.current) {
        void supabaseRef.current.removeChannel(inviteChannelRef.current);
        inviteChannelRef.current = null;
      }
    };
  }, [player.playerId, player.playerName]);

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

  const syncPlayerToSupabase = async (nextPlayer: StoredPlayer) => {
    try {
      await fetch("/api/game", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "upsert-player",
          playerId: nextPlayer.playerId,
          playerName: nextPlayer.playerName,
          coins: nextPlayer.coins,
          elo: nextPlayer.elo,
        }),
      });
    } catch {
      // Best effort sync only.
    }
  };

  useEffect(() => {
    if (!isLoaded) return;
    void loadLeaderboard();
  }, [isLoaded]);

  useEffect(() => {
    if (!isLoaded || !player.playerId) return;
    const loadDailyStatus = async () => {
      try {
        const response = await fetch(`/api/game?action=daily&playerId=${encodeURIComponent(player.playerId)}`);
        if (!response.ok) return;
        const data = (await response.json()) as { hasAttemptedToday?: boolean };
        setDailyHasAttempted(Boolean(data.hasAttemptedToday));
      } catch {
        // Ignore daily status fetch failures.
      }
    };
    void loadDailyStatus();
  }, [isLoaded, player.playerId]);

  useEffect(() => {
    if (!isLoaded || !player.playerName) return;
    savePlayer(player);
    void syncPlayerToSupabase(player);
  }, [player, isLoaded]);

  const loadLevel = async (category: TriviaCategory, level: number) => {
    setIsLoadingQuestions(true);
    try {
      const questions = await fetchLevelQuestions(category, level, askedQuestionIdsRef.current);
      questions.forEach((question) => askedQuestionIdsRef.current.add(question.id));
      setRunQuestions(questions);
      setQuestionIndex(0);
      setSelectedIndex(null);
      setFeedback(null);
      setTimeLeft(QUESTION_TIME_SECONDS);
      setHiddenAnswerIndex(null);
      setStreakMessage("");
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

  const persistScore = async (score: number, level: number) => {
    const runningCategory = activeCategoryRef.current;
    const runningPlayer = playerRef.current;
    if (!runningCategory?.title || !runningPlayer.playerName) return;
    try {
      const response = await fetch("/api/leaderboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: runningPlayer.playerName,
          score,
          category: runningCategory.title,
          level,
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
    }
  };

  const submitAnswer = (index: number, timedOut = false) => {
    if (!currentQuestion || hasAnswered) return;
    const isCorrect = index === currentQuestion.correctAnswerIndex;
    setSelectedIndex(index >= 0 ? index : null);
    setFeedback(isCorrect ? "correct" : "wrong");
    if (isCorrect) {
      const nextStreak = streakCount + 1;
      const withBasePoints = totalScore + 10;
      const gotStreakBonus = nextStreak % STREAK_BONUS_EVERY === 0;
      const nextScore = gotStreakBonus ? withBasePoints + STREAK_BONUS_POINTS : withBasePoints;
      const coinGain = COINS_PER_CORRECT + (gotStreakBonus ? STREAK_BONUS_COINS : 0);
      setTotalScore(nextScore);
      setStreakCount(nextStreak);
      setStreakMessage(gotStreakBonus ? "🔥 Streak! +5 bonus coins" : "");
      setCorrectAnswers((prev) => prev + 1);
      setPlayer((prev) => ({ ...prev, coins: prev.coins + coinGain, elo: prev.elo + ELO_GAIN }));
      setConfettiTick((prev) => prev + 1);
      void playEffect("good");
      void persistScore(nextScore, currentLevel);
      return;
    }
    if (!timedOut && extraLives > 0) {
      setExtraLives((prev) => prev - 1);
      setFeedback(null);
      setSelectedIndex(null);
      return;
    }
    setStreakCount(0);
    setStreakMessage("");
    setIncorrectAnswers((prev) => prev + 1);
    setPlayer((prev) => ({ ...prev, elo: Math.max(0, prev.elo - ELO_LOSS) }));
    if (timedOut) setLeaderboardError("Time is up for this question.");
    void playEffect("bad");
    void persistScore(totalScore, currentLevel);
  };

  const goNextQuestion = async () => {
    if (!activeCategory || !hasAnswered) return;
    if (questionIndex + 1 < QUESTIONS_PER_LEVEL) {
      setQuestionIndex((prev) => prev + 1);
      setSelectedIndex(null);
      setFeedback(null);
      setTimeLeft(QUESTION_TIME_SECONDS);
      setHiddenAnswerIndex(null);
      setStreakMessage("");
      return;
    }

    if (currentLevel < LEVELS_PER_CATEGORY) {
      const nextLevel = currentLevel + 1;
      setCurrentLevel(nextLevel);
      await loadLevel(activeCategory, nextLevel);
      return;
    }

    setScreen("summary");
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
    setTimeLeft(QUESTION_TIME_SECONDS);
    setStreakCount(0);
    setStreakMessage("");
    setHiddenAnswerIndex(null);
    setScreen("quiz");
    setLeaderboardError("");
    await loadLevel(category, 1);
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
    const nextPlayer: StoredPlayer = { ...player, playerName: cleanedName };
    setPlayer(nextPlayer);
    setPlayerNameInput(cleanedName);
    setNameError("");
    setShowNameEditor(false);
    setScreen("menu");
  };

  const useHint = () => {
    if (!currentQuestion || hasAnswered || hiddenAnswerIndex !== null || player.coins < HINT_COST) return;
    const wrongChoices = currentQuestion.answers
      .map((_, idx) => idx)
      .filter((idx) => idx !== currentQuestion.correctAnswerIndex);
    if (wrongChoices.length === 0) return;
    const eliminateIndex = wrongChoices[Math.floor(Math.random() * wrongChoices.length)];
    setHiddenAnswerIndex(eliminateIndex);
    setPlayer((prev) => ({ ...prev, coins: Math.max(0, prev.coins - HINT_COST) }));
  };

  const useSkip = () => {
    if (!currentQuestion || hasAnswered || player.coins < SKIP_COST) return;
    setPlayer((prev) => ({ ...prev, coins: Math.max(0, prev.coins - SKIP_COST) }));
    setFeedback("wrong");
  };

  const buyExtraLife = () => {
    if (player.coins < EXTRA_LIFE_COST) return;
    setPlayer((prev) => ({ ...prev, coins: Math.max(0, prev.coins - EXTRA_LIFE_COST) }));
    setExtraLives((prev) => prev + 1);
  };

  const exitQuizToMenu = async () => {
    if (screen !== "quiz") return;
    setIsSubmittingScore(true);
    await persistScore(totalScoreRef.current, currentLevelRef.current);
    setIsSubmittingScore(false);
    setScreen("menu");
    setFeedback(null);
    setSelectedIndex(null);
    setStreakMessage("");
    setHiddenAnswerIndex(null);
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

  const loadDailyChallenge = async () => {
    try {
      const response = await fetch(`/api/game?action=daily&playerId=${encodeURIComponent(player.playerId)}`);
      const data = (await response.json()) as DailyState & { error?: string; hasAttemptedToday?: boolean };
      if (!response.ok) {
        setLeaderboardError(data.error ?? "Could not load daily challenge.");
        return;
      }
      setDailyState(data);
      setDailyHasAttempted(Boolean(data.hasAttemptedToday));
      setDailyQuestionIndex(0);
      setDailyScore(0);
      setDailyCorrect(0);
      setDailyStartTimeMs(Date.now());
      setDailySubmitted(false);
      setScreen("daily");
    } catch {
      setLeaderboardError("Could not load daily challenge.");
    }
  };

  const submitDailyAnswer = (answerIdx: number) => {
    if (!currentDailyQuestion || dailySubmitted) return;
    const isCorrect = answerIdx === currentDailyQuestion.correctAnswerIndex;
    multiAnsweredRef.current += 1;
    if (isCorrect) {
      multiCorrectRef.current += 1;
      setDailyCorrect((prev) => prev + 1);
      setDailyScore((prev) => prev + 10);
      setPlayer((prev) => ({ ...prev, coins: prev.coins + COINS_PER_CORRECT, elo: prev.elo + ELO_GAIN }));
    } else {
      setPlayer((prev) => ({ ...prev, elo: Math.max(0, prev.elo - ELO_LOSS) }));
    }
    if (dailyQuestionIndex + 1 < 10) {
      setDailyQuestionIndex((prev) => prev + 1);
      return;
    }
    setDailySubmitted(true);
  };

  const finishDailyChallenge = async () => {
    if (!dailyState) return;
    if (dailyHasAttempted || player.lastDailyChallengeDate === getTodayUtcDate()) {
      setScreen("menu");
      return;
    }
    const totalTimeMs = Math.max(0, Date.now() - dailyStartTimeMs);
    try {
      const response = await fetch("/api/game", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "daily-submit",
          playerId: player.playerId,
          score: dailyScore,
          correctAnswers: dailyCorrect,
          totalTimeMs,
        }),
      });
      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        setLeaderboardError(data.error ?? "Could not submit daily challenge.");
        setScreen("menu");
        return;
      }
      setPlayer((prev) => ({ ...prev, lastDailyChallengeDate: dailyState.today }));
      setDailyHasAttempted(true);
    } catch {
      setLeaderboardError("Could not submit daily challenge.");
    } finally {
      setScreen("menu");
      void loadDailyChallenge();
    }
  };

  const joinRealtimeMatch = (matchId: string) => {
    if (!supabaseRef.current) return;
    if (matchChannelRef.current) {
      void supabaseRef.current.removeChannel(matchChannelRef.current);
      matchChannelRef.current = null;
    }
    const channel = supabaseRef.current.channel(`match-${matchId}`);
    channel.on("postgres_changes", { event: "*", schema: "public", table: "match_progress", filter: `match_id=eq.${matchId}` }, (payload) => {
      const row = payload.new as { player_id?: string; answered_count?: number; correct_answers?: number };
      if (!row || row.player_id === player.playerId) return;
      setOpponentProgress({
        answered: row.answered_count ?? 0,
        correct: row.correct_answers ?? 0,
      });
    });
    void channel.subscribe();
    matchChannelRef.current = channel;
  };

  const reportMatchProgress = async (finished = false) => {
    if (!matchState) return;
    await fetch("/api/game", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "match-progress",
        matchId: matchState.id,
        playerId: player.playerId,
        answeredCount: multiAnsweredRef.current,
        correctAnswers: multiCorrectRef.current,
        totalTimeMs: multiTimeRef.current,
        finished,
      }),
    });
  };

  const startFriendMatch = async () => {
    setIsMatchmaking(true);
    const cleanFriendId = friendIdInput.trim().toUpperCase();
    if (!/^TRV-[A-Z0-9]{4}$/.test(cleanFriendId)) {
      setLeaderboardError("Enter a valid friend Player ID (example: TRV-4X9K).");
      setIsMatchmaking(false);
      return;
    }
    if (cleanFriendId === player.playerId) {
      setLeaderboardError("You cannot challenge yourself.");
      setIsMatchmaking(false);
      return;
    }
    const response = await fetch("/api/game", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "matchmake", mode: "friend", playerId: player.playerId, friendId: cleanFriendId }),
    });
    const data = (await response.json()) as { match?: MatchState; waiting?: boolean; error?: string };
    if (!response.ok || !data.match) {
      setLeaderboardError(data.error ?? "Could not create friend match.");
      setIsMatchmaking(false);
      return;
    }
    if (data.waiting || data.match.status === "pending") {
      if (supabaseRef.current) {
        const friendChannel = supabaseRef.current.channel(`player-${cleanFriendId}`);
        await friendChannel.subscribe();
        await friendChannel.send({
          type: "broadcast",
          event: "friend-invite",
          payload: {
            matchId: data.match.id,
            challengerId: player.playerId,
            challengerName: player.playerName,
          },
        });
        void supabaseRef.current.removeChannel(friendChannel);
      }
      setLeaderboardError("Invite sent! Waiting for your friend to accept...");
      if (friendPollingRef.current !== null) {
        window.clearInterval(friendPollingRef.current);
      }
      friendPollingRef.current = window.setInterval(async () => {
        const checkResponse = await fetch(`/api/game?action=match&matchId=${encodeURIComponent(data.match!.id)}`);
        const checkData = (await checkResponse.json()) as { match?: MatchState };
        if (checkData.match && checkData.match.status === "active") {
          window.clearInterval(friendPollingRef.current!);
          friendPollingRef.current = null;
          setMatchState(checkData.match);
          setScreen("multiplayer");
          setQuestionIndex(0);
          setMultiAnsweredThisQuestion(false);
          multiAnsweredRef.current = 0;
          multiCorrectRef.current = 0;
          multiStartTimeRef.current = Date.now();
          multiTimeRef.current = 0;
          setIsMatchmaking(false);
          joinRealtimeMatch(checkData.match.id);
        }
      }, 2000);
      return;
    }
    if (friendPollingRef.current !== null) {
      window.clearInterval(friendPollingRef.current);
      friendPollingRef.current = null;
    }
    setIsMatchmaking(false);
    setMatchState(data.match);
    setScreen("multiplayer");
    setQuestionIndex(0);
    setMultiAnsweredThisQuestion(false);
    multiAnsweredRef.current = 0;
    multiCorrectRef.current = 0;
    multiStartTimeRef.current = Date.now();
    multiTimeRef.current = 0;
    joinRealtimeMatch(data.match.id);
  };

  const respondToInvite = async (accepted: boolean) => {
    if (!incomingInvite) return;
    const invite = incomingInvite;
    setIncomingInvite(null);
    try {
      const response = await fetch("/api/game", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "friend-invite-response",
          playerId: player.playerId,
          matchId: invite.matchId,
          accepted,
        }),
      });
      const data = (await response.json()) as { error?: string; match?: MatchState; challengerId?: string };
      if (!response.ok) {
        setLeaderboardError(data.error ?? "Could not respond to invite.");
        return;
      }
      if (supabaseRef.current && data.challengerId) {
        const challengerChannel = supabaseRef.current.channel(`player-${data.challengerId}`);
        await challengerChannel.subscribe();
        await challengerChannel.send({
          type: "broadcast",
          event: "invite-response",
          payload: {
            accepted,
            declined: !accepted,
            friendId: player.playerId,
            friendName: player.playerName,
            match: data.match,
          },
        });
        void supabaseRef.current.removeChannel(challengerChannel);
      }
      if (accepted && data.match) {
        setMatchState(data.match);
        setScreen("multiplayer");
        setQuestionIndex(0);
        setMultiAnsweredThisQuestion(false);
        multiAnsweredRef.current = 0;
        multiCorrectRef.current = 0;
        multiStartTimeRef.current = Date.now();
        multiTimeRef.current = 0;
        joinRealtimeMatch(data.match.id);
      } else if (!accepted) {
        setLeaderboardError("Challenge declined.");
      }
    } catch {
      setLeaderboardError("Could not respond to invite.");
    }
  };

  const startRandomMatch = async () => {
    setIsMatchmaking(true);
    const response = await fetch("/api/game", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "matchmake", mode: "random", playerId: player.playerId }),
    });
    const data = (await response.json()) as { match?: MatchState; waiting?: boolean; error?: string };
    if (data.waiting) {
      setLeaderboardError("Waiting for opponent...");
      if (randomPollingRef.current === null) {
        randomPollingRef.current = window.setInterval(() => {
          void startRandomMatch();
        }, 2500);
      }
      return;
    }
    if (!response.ok || !data.match) {
      setLeaderboardError(data.error ?? "Could not start random match.");
      setIsMatchmaking(false);
      return;
    }
    setMatchState(data.match);
    setScreen("multiplayer");
    setQuestionIndex(0);
    setMultiAnsweredThisQuestion(false);
    multiAnsweredRef.current = 0;
    multiCorrectRef.current = 0;
    multiStartTimeRef.current = Date.now();
    multiTimeRef.current = 0;
    setIsMatchmaking(false);
    if (randomPollingRef.current !== null) {
      window.clearInterval(randomPollingRef.current);
      randomPollingRef.current = null;
    }
    joinRealtimeMatch(data.match.id);
  };

  const answerMultiplayer = async (index: number) => {
    if (!matchState || multiAnsweredThisQuestion) return;
    setMultiAnsweredThisQuestion(true);
    const question = matchState.questions[questionIndex];
    if (!question) {
      setMultiAnsweredThisQuestion(false);
      return;
    }
    const isCorrect = index === question.correctAnswerIndex;
    multiAnsweredRef.current += 1;
    if (isCorrect) {
      multiCorrectRef.current += 1;
      setPlayer((prev) => ({ ...prev, coins: prev.coins + COINS_PER_CORRECT, elo: prev.elo + ELO_GAIN }));
      void playEffect("good");
    } else {
      setPlayer((prev) => ({ ...prev, elo: Math.max(0, prev.elo - ELO_LOSS) }));
      void playEffect("bad");
    }
    multiTimeRef.current = Math.max(0, Date.now() - multiStartTimeRef.current);
    await reportMatchProgress(false);
    if (questionIndex + 1 < 10) {
      window.setTimeout(() => {
        setQuestionIndex((prev) => prev + 1);
        setMultiAnsweredThisQuestion(false);
      }, 1200);
      return;
    }
    await reportMatchProgress(true);
    setLeaderboardError(`Match finished! You got ${multiCorrectRef.current}/10 correct.`);
    setScreen("menu");
    setMatchState(null);
    if (matchChannelRef.current && supabaseRef.current) {
      void supabaseRef.current.removeChannel(matchChannelRef.current);
      matchChannelRef.current = null;
    }
  };

  const startCheckout = async (packageId: "coins_100" | "coins_500" | "coins_2000") => {
    setIsStartingCheckout(true);
    setCheckoutMessage("");
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId }),
      });
      const data = (await response.json()) as { url?: string; comingSoon?: boolean; error?: string };
      if (!response.ok) {
        setCheckoutMessage(data.error ?? "Could not start checkout.");
        return;
      }
      if (data.comingSoon || !data.url) {
        setCheckoutMessage("Shop is coming soon. Stripe is not configured yet.");
        return;
      }
      window.location.href = data.url;
    } catch {
      setCheckoutMessage("Could not start checkout.");
    } finally {
      setIsStartingCheckout(false);
    }
  };

  return (
    <main className="animated-gradient min-h-screen text-slate-900 transition-all duration-300 dark:text-slate-100">
      <div className="fixed right-4 top-4 z-20 flex items-center gap-2 rounded-full bg-black/40 px-3 py-2 text-xs text-white">
        <button onClick={toggleMute} className="rounded-full border border-white/30 px-2 py-1">
          {isMuted ? "Unmute" : "Mute"}
        </button>
        <label className="flex items-center gap-2">
          <span>{Math.round(volume)}%</span>
          <input
            type="range"
            min={0}
            max={100}
            value={volume}
            onChange={(event) => setVolume(Number(event.target.value))}
            className="w-24 accent-indigo-400"
          />
        </label>
      </div>
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
            <button onClick={() => setScreen("profile")} className="rounded-xl border border-slate-300 px-3 py-1 text-sm dark:border-white/20">
              Profile
            </button>
          </div>
        </header>

        {showLeaderboard && (
          <section className="card bg-white dark:bg-white/5">
            <h3 className="mb-2 text-lg font-semibold">All players (best score)</h3>
            {leaderboard.length === 0 ? (
              <p className="text-sm text-slate-600 dark:text-slate-300">No scores yet. Answer at least one question to appear here.</p>
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
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  savePlayerName();
                }
              }}
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
              <span className="text-sm text-slate-600 dark:text-slate-300">
                {player.playerName} | Coins: {player.coins}
              </span>
            </div>
            <div className="mb-3 flex gap-2">
              <button onClick={() => setShowNameEditor((prev) => !prev)} className="rounded-xl border border-slate-300 px-3 py-2 text-sm dark:border-white/20">
                {showNameEditor ? "Cancel name edit" : "Change Name"}
              </button>
              <button onClick={() => setShowShop(true)} className="rounded-xl border border-emerald-400 px-3 py-2 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                Buy Coins
              </button>
            </div>
            {showNameEditor ? (
              <div className="mb-3 rounded-xl border border-slate-300 bg-slate-50 p-3 dark:border-white/20 dark:bg-black/20">
                <div className="mb-2 text-sm font-semibold">Update your display name</div>
                <div className="flex gap-2">
                  <input
                    value={playerNameInput}
                    onChange={(event) => setPlayerNameInput(event.target.value)}
                    maxLength={24}
                    placeholder="New name"
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 dark:border-white/20 dark:bg-black/20"
                  />
                  <button onClick={savePlayerName} className="rounded-xl bg-indigo-600 px-3 py-2 font-semibold text-white">
                    Save
                  </button>
                </div>
              </div>
            ) : null}
            <div className="mb-3 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm dark:border-amber-600/40 dark:bg-amber-500/10">
              <div className="font-semibold">Daily Challenge</div>
              <div>New 10 questions every day at 00:00 UTC for all players.</div>
              <div className="mt-1 text-xs">Next reset in: {formatMsAsClock(nextDailyCountdownMs)} (UTC)</div>
              <button
                onClick={() => void loadDailyChallenge()}
                disabled={dailyHasAttempted || player.lastDailyChallengeDate === getTodayUtcDate()}
                className="mt-2 rounded-lg bg-amber-500 px-3 py-1 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {dailyHasAttempted || player.lastDailyChallengeDate === getTodayUtcDate() ? "Already played today" : "Play Daily Challenge"}
              </button>
            </div>
            <div className="mb-3 rounded-xl border border-indigo-300 bg-indigo-50 p-3 text-sm dark:border-indigo-700/50 dark:bg-indigo-500/10">
              <div className="mb-2 font-semibold">1v1 Multiplayer</div>
              <div className="mb-2 flex gap-2">
                <input
                  value={friendIdInput}
                  onChange={(event) => setFriendIdInput(event.target.value.toUpperCase())}
                  placeholder="Friend ID (TRV-4X9K)"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-white/20 dark:bg-black/20"
                />
                <button onClick={() => void startFriendMatch()} className="rounded-lg bg-indigo-600 px-3 py-2 text-white">
                  {isMatchmaking ? "Waiting..." : "Challenge"}
                </button>
              </div>
              <button onClick={() => void startRandomMatch()} disabled={isMatchmaking} className="rounded-lg border border-indigo-500 px-3 py-2 font-semibold text-indigo-700 dark:text-indigo-300">
                {isMatchmaking ? "Matching..." : "Random Match"}
              </button>
            </div>
            <AdUnit slot="1000000001" label="AdSense ad (main menu) - replace publisher ID in layout.tsx and this component." />
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
                <div className="mb-3 h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
                  <div
                    className="h-full bg-indigo-500 transition-all duration-1000"
                    style={{ width: `${Math.max(0, (timeLeft / QUESTION_TIME_SECONDS) * 100)}%` }}
                  />
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
                  <div className="mt-2 flex items-center justify-between">
                    <span>Coins</span>
                    <span className="font-semibold">{player.coins}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span>Streak</span>
                    <span className="font-semibold">{streakCount}</span>
                  </div>
                </div>

                <h2 className="mb-4 text-xl font-semibold">{currentQuestion.question}</h2>
                <div className="mb-3 flex gap-2">
                  <button
                    onClick={useHint}
                    disabled={hasAnswered || hiddenAnswerIndex !== null || player.coins < HINT_COST}
                    className="rounded-xl border border-amber-400 px-3 py-2 text-sm font-semibold text-amber-700 disabled:cursor-not-allowed disabled:opacity-50 dark:text-amber-300"
                  >
                    Hint (-{HINT_COST} coins)
                  </button>
                  <button onClick={useSkip} disabled={hasAnswered || player.coins < SKIP_COST} className="rounded-xl border border-blue-400 px-3 py-2 text-sm font-semibold text-blue-600 disabled:opacity-50 dark:text-blue-300">
                    Skip (-{SKIP_COST})
                  </button>
                  <button onClick={buyExtraLife} disabled={player.coins < EXTRA_LIFE_COST} className="rounded-xl border border-emerald-400 px-3 py-2 text-sm font-semibold text-emerald-600 disabled:opacity-50 dark:text-emerald-300">
                    Extra life (-{EXTRA_LIFE_COST}) [{extraLives}]
                  </button>
                  <button onClick={() => void exitQuizToMenu()} className="rounded-xl border border-rose-400 px-3 py-2 text-sm font-semibold text-rose-600 dark:text-rose-300">
                    {isSubmittingScore ? "Saving..." : "Exit quiz"}
                  </button>
                </div>
                {questionIndex > 0 && questionIndex % 2 === 0 ? (
                  <AdUnit slot="1000000002" label="AdSense ad (between questions)" />
                ) : null}
                <div className="space-y-2">
                  {currentQuestion.answers.map((answer, index) => {
                    if (index === hiddenAnswerIndex && !hasAnswered) {
                      return null;
                    }
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
                    {streakMessage && <p className="mb-2 text-sm font-semibold text-amber-500">{streakMessage}</p>}
                    <p className="text-sm text-slate-700 dark:text-slate-200">{currentQuestion.explanation}</p>
                  </div>
                )}

                {feedback === "correct" ? (
                  <div key={confettiTick} className="confetti-layer" aria-hidden="true">
                    {Array.from({ length: 18 }).map((_, idx) => (
                      <span
                        key={`${confettiTick}-${idx}`}
                        className="confetti-piece"
                        style={{
                          left: `${(idx / 18) * 100}%`,
                          animationDelay: `${(idx % 6) * 0.06}s`,
                        }}
                      />
                    ))}
                  </div>
                ) : null}

                {hasAnswered ? (
                  <button onClick={() => void goNextQuestion()} className="mt-4 w-full rounded-xl bg-indigo-600 px-4 py-3 font-semibold text-white">
                    {isFinalQuestion ? "Finish category" : isEndOfLevel ? "Advancing to next level..." : "Next question"}
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
            <AdUnit slot="1000000003" label="AdSense ad (results screen)" />
          </section>
        ) : null}

        {screen === "profile" ? (
          <section className="card bg-white dark:bg-white/5">
            <h2 className="mb-3 text-xl font-semibold">Player Profile</h2>
            <div className="space-y-2 text-sm">
              <div>Player: <span className="font-semibold">{player.playerName}</span></div>
              <div>
                Player ID: <span className="font-semibold">{player.playerId}</span>
                <button
                  onClick={() => navigator.clipboard.writeText(player.playerId)}
                  className="ml-2 rounded-lg border border-slate-300 px-2 py-1 text-xs dark:border-white/20"
                >
                  Copy
                </button>
              </div>
              <div>Coins: <span className="font-semibold">{player.coins}</span></div>
              <div>
                ELO: <span className="font-semibold">{player.elo}</span> ({getTierName(player.elo)})
              </div>
            </div>
            <button onClick={() => setScreen("menu")} className="mt-4 w-full rounded-xl bg-indigo-600 px-4 py-3 font-semibold text-white">
              Back to menu
            </button>
          </section>
        ) : null}

        {screen === "daily" ? (
          <section className="card bg-white dark:bg-white/5">
            <h2 className="mb-2 text-xl font-semibold">Daily Challenge</h2>
            <p className="mb-2 text-sm text-slate-600 dark:text-slate-300">
              Completed today: {dailyState?.completedCount ?? 0}
            </p>
            <div className="mb-3 rounded-xl bg-slate-50 p-3 text-xs dark:bg-black/20">
              Top 3 today:
              {(dailyState?.top3 ?? []).map((item, index) => (
                <div key={`${item.player_id}-${index}`}>
                  #{index + 1} {item.player_id} - {item.score} pts
                </div>
              ))}
            </div>
            {dailyHasAttempted ? (
              <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm dark:border-amber-600/40 dark:bg-amber-500/10">
                You already used today&apos;s daily attempt. Come back tomorrow for a new challenge.
              </div>
            ) : !dailySubmitted && currentDailyQuestion ? (
              <>
                <div className="mb-3 text-sm font-semibold">
                  Question {dailyQuestionIndex + 1}/10
                </div>
                <h3 className="mb-3 text-lg font-semibold">{currentDailyQuestion.question}</h3>
                <div className="space-y-2">
                  {currentDailyQuestion.answers.map((answer, idx) => (
                    <button key={`${answer}-${idx}`} onClick={() => submitDailyAnswer(idx)} className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-left dark:border-white/20 dark:bg-black/20">
                      {answer}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                <div className="mb-2">Score: {dailyScore}</div>
                <div className="mb-3">Correct: {dailyCorrect}/10</div>
                <button onClick={() => void finishDailyChallenge()} className="w-full rounded-xl bg-indigo-600 px-4 py-3 font-semibold text-white">
                  Finish Daily Challenge
                </button>
              </>
            )}
            <button onClick={() => setScreen("menu")} className="mt-3 w-full rounded-xl border border-slate-300 px-4 py-2 font-semibold dark:border-white/20">
              Back to menu
            </button>
          </section>
        ) : null}

        {showShop ? (
          <section className="card bg-white dark:bg-white/5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Coin Shop</h2>
              <button onClick={() => setShowShop(false)} className="rounded-lg border border-slate-300 px-2 py-1 text-xs dark:border-white/20">
                Close
              </button>
            </div>
            <div className="space-y-2">
              <button onClick={() => void startCheckout("coins_100")} disabled={isStartingCheckout} className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-left dark:border-white/20 dark:bg-black/20">
                100 coins - $0.99
              </button>
              <button onClick={() => void startCheckout("coins_500")} disabled={isStartingCheckout} className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-left dark:border-white/20 dark:bg-black/20">
                500 coins - $3.99
              </button>
              <button onClick={() => void startCheckout("coins_2000")} disabled={isStartingCheckout} className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-left dark:border-white/20 dark:bg-black/20">
                2000 coins - $9.99
              </button>
            </div>
            {checkoutMessage ? <p className="mt-3 text-sm text-amber-600 dark:text-amber-400">{checkoutMessage}</p> : null}
          </section>
        ) : null}

        {screen === "multiplayer" && matchState ? (
          <section className="card bg-white dark:bg-white/5">
            <h2 className="mb-2 text-xl font-semibold">1v1 Match</h2>
            <p className="mb-2 text-sm">Match ID: {matchState.id}</p>
            <div className="mb-3 rounded-xl bg-slate-50 p-3 text-xs dark:bg-black/20">
              <div className="mb-2 font-semibold">Live Progress</div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="text-xs text-slate-600 dark:text-slate-400">You</div>
                  <div className="text-sm font-semibold">{multiAnsweredRef.current}/10 answered</div>
                  <div className="text-xs text-emerald-600 dark:text-emerald-400">{multiCorrectRef.current} correct</div>
                </div>
                <div>
                  <div className="text-xs text-slate-600 dark:text-slate-400">Opponent</div>
                  <div className="text-sm font-semibold">{opponentProgress.answered}/10 answered</div>
                  <div className="text-xs text-emerald-600 dark:text-emerald-400">{opponentProgress.correct} correct</div>
                </div>
              </div>
            </div>
            {matchState.questions[questionIndex] ? (
              <>
                <div className="mb-2 text-sm font-semibold">Question {questionIndex + 1}/10</div>
                <h3 className="mb-3 text-lg font-semibold">{matchState.questions[questionIndex].question}</h3>
                <div className="space-y-2">
                  {matchState.questions[questionIndex].answers.map((answer, idx) => {
                    const isCorrect = idx === matchState.questions[questionIndex].correctAnswerIndex;
                    const showResult = multiAnsweredThisQuestion;
                    return (
                      <button
                        key={`${answer}-${idx}`}
                        onClick={() => void answerMultiplayer(idx)}
                        disabled={multiAnsweredThisQuestion}
                        className={`w-full rounded-xl border px-3 py-2 text-left transition disabled:cursor-not-allowed ${
                          showResult && isCorrect
                            ? "border-emerald-400 bg-emerald-100 text-emerald-900 dark:bg-emerald-500/20 dark:text-emerald-100"
                            : showResult && !isCorrect
                              ? "border-rose-400 bg-rose-100 text-rose-900 dark:bg-rose-500/20 dark:text-rose-100"
                              : "border-slate-300 bg-slate-50 hover:bg-slate-100 dark:border-white/20 dark:bg-black/20 dark:hover:bg-white/10"
                        } ${multiAnsweredThisQuestion ? "opacity-60" : ""}`}
                      >
                        {answer}
                        {showResult && isCorrect && <span className="ml-2 text-xs font-semibold">✓</span>}
                      </button>
                    );
                  })}
                </div>
                {multiAnsweredThisQuestion && (
                  <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-2 text-center text-sm dark:border-white/10 dark:bg-black/20">
                    Correct answer shown
                  </div>
                )}
              </>
            ) : (
              <p>Loading questions...</p>
            )}
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
      {incomingInvite ? (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/45 px-4">
          <div className="w-full max-w-sm rounded-2xl border border-white/20 bg-slate-900 p-4 text-white shadow-2xl">
            <h3 className="mb-2 text-lg font-semibold">Challenge Invite</h3>
            <p className="mb-3 text-sm">{incomingInvite.challengerName} is challenging you! Accept / Decline</p>
            <div className="flex gap-2">
              <button onClick={() => void respondToInvite(true)} className="w-full rounded-xl bg-emerald-600 px-3 py-2 font-semibold text-white">
                Accept
              </button>
              <button onClick={() => void respondToInvite(false)} className="w-full rounded-xl border border-white/30 px-3 py-2 font-semibold text-white">
                Decline
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
