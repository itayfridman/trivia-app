export type Language = 'en' | 'he' | 'ar' | 'fr' | 'es'

export interface Translation {
  // Main menu
  play: string
  dailyChallenge: string
  multiplayer: string
  profile: string
  leaderboard: string
  settings: string
  
  // Entry screen
  enterYourName: string
  startPlaying: string
  nameRequired: string
  
  // Game screens
  question: string
  score: string
  timeLeft: string
  correct: string
  wrong: string
  next: string
  finish: string
  
  // Daily challenge
  dailyChallengeTitle: string
  todaysChallenge: string
  attemptsToday: string
  timeUntilNext: string
  completedToday: string
  tryAgainTomorrow: string
  
  // Multiplayer
  friendMatch: string
  randomMatch: string
  enterFriendId: string
  challenge: string
  waitingForPlayer: string
  accept: string
  decline: string
  opponentChallenge: string
  liveProgress: string
  
  // Profile
  yourStats: string
  totalCoins: string
  eloRating: string
  gamesPlayed: string
  accuracy: string
  
  // Settings
  language: string
  sound: string
  volume: string
  theme: string
  
  // Common
  back: string
  cancel: string
  confirm: string
  loading: string
  error: string
  retry: string
}

export const translations: Record<Language, Translation> = {
  en: {
    play: 'Play',
    dailyChallenge: 'Daily Challenge',
    multiplayer: 'Multiplayer',
    profile: 'Profile',
    leaderboard: 'Leaderboard',
    settings: 'Settings',
    enterYourName: 'Enter your name',
    startPlaying: 'Start Playing',
    nameRequired: 'Name is required',
    question: 'Question',
    score: 'Score',
    timeLeft: 'Time Left',
    correct: 'Correct!',
    wrong: 'Wrong!',
    next: 'Next',
    finish: 'Finish',
    dailyChallengeTitle: 'Daily Challenge',
    todaysChallenge: "Today's Challenge",
    attemptsToday: 'Attempts Today',
    timeUntilNext: 'Time Until Next Challenge',
    completedToday: 'Completed Today',
    tryAgainTomorrow: 'Try again tomorrow!',
    friendMatch: 'Friend Match',
    randomMatch: 'Random Match',
    enterFriendId: "Enter friend's ID",
    challenge: 'Challenge',
    waitingForPlayer: 'Waiting for player...',
    accept: 'Accept',
    decline: 'Decline',
    opponentChallenge: 'challenges you!',
    liveProgress: 'Live Progress',
    yourStats: 'Your Stats',
    totalCoins: 'Total Coins',
    eloRating: 'ELO Rating',
    gamesPlayed: 'Games Played',
    accuracy: 'Accuracy',
    language: 'Language',
    sound: 'Sound',
    volume: 'Volume',
    theme: 'Theme',
    back: 'Back',
    cancel: 'Cancel',
    confirm: 'Confirm',
    loading: 'Loading...',
    error: 'Error',
    retry: 'Retry'
  },
  he: {
    play: ' spiele',
    dailyChallenge: ' challenge day',
    multiplayer: ' multiplayer',
    profile: ' profile',
    leaderboard: ' leaderboard',
    settings: ' settings',
    enterYourName: 'Enter your name',
    startPlaying: 'Start Playing',
    nameRequired: 'Name is required',
    question: 'Question',
    score: 'Score',
    timeLeft: 'Time Left',
    correct: 'Correct!',
    wrong: 'Wrong!',
    next: 'Next',
    finish: 'Finish',
    dailyChallengeTitle: 'Daily Challenge',
    todaysChallenge: "Today's Challenge",
    attemptsToday: 'Attempts Today',
    timeUntilNext: 'Time Until Next Challenge',
    completedToday: 'Completed Today',
    tryAgainTomorrow: 'Try again tomorrow!',
    friendMatch: 'Friend Match',
    randomMatch: 'Random Match',
    enterFriendId: "Enter friend's ID",
    challenge: 'Challenge',
    waitingForPlayer: 'Waiting for player...',
    accept: 'Accept',
    decline: 'Decline',
    opponentChallenge: 'challenges you!',
    liveProgress: 'Live Progress',
    yourStats: 'Your Stats',
    totalCoins: 'Total Coins',
    eloRating: 'ELO Rating',
    gamesPlayed: 'Games Played',
    accuracy: 'Accuracy',
    language: 'Language',
    sound: 'Sound',
    volume: 'Volume',
    theme: 'Theme',
    back: 'Back',
    cancel: 'Cancel',
    confirm: 'Confirm',
    loading: 'Loading...',
    error: 'Error',
    retry: 'Retry'
  },
  ar: {
    play: 'Play',
    dailyChallenge: 'Daily Challenge',
    multiplayer: 'Multiplayer',
    profile: 'Profile',
    leaderboard: 'Leaderboard',
    settings: 'Settings',
    enterYourName: 'Enter your name',
    startPlaying: 'Start Playing',
    nameRequired: 'Name is required',
    question: 'Question',
    score: 'Score',
    timeLeft: 'Time Left',
    correct: 'Correct!',
    wrong: 'Wrong!',
    next: 'Next',
    finish: 'Finish',
    dailyChallengeTitle: 'Daily Challenge',
    todaysChallenge: "Today's Challenge",
    attemptsToday: 'Attempts Today',
    timeUntilNext: 'Time Until Next Challenge',
    completedToday: 'Completed Today',
    tryAgainTomorrow: 'Try again tomorrow!',
    friendMatch: 'Friend Match',
    randomMatch: 'Random Match',
    enterFriendId: "Enter friend's ID",
    challenge: 'Challenge',
    waitingForPlayer: 'Waiting for player...',
    accept: 'Accept',
    decline: 'Decline',
    opponentChallenge: 'challenges you!',
    liveProgress: 'Live Progress',
    yourStats: 'Your Stats',
    totalCoins: 'Total Coins',
    eloRating: 'ELO Rating',
    gamesPlayed: 'Games Played',
    accuracy: 'Accuracy',
    language: 'Language',
    sound: 'Sound',
    volume: 'Volume',
    theme: 'Theme',
    back: 'Back',
    cancel: 'Cancel',
    confirm: 'Confirm',
    loading: 'Loading...',
    error: 'Error',
    retry: 'Retry'
  },
  fr: {
    play: 'Jouer',
    dailyChallenge: 'Défi Quotidien',
    multiplayer: 'Multijoueur',
    profile: 'Profil',
    leaderboard: 'Classement',
    settings: 'Paramètres',
    enterYourName: 'Entrez votre nom',
    startPlaying: 'Commencer à jouer',
    nameRequired: 'Le nom est requis',
    question: 'Question',
    score: 'Score',
    timeLeft: 'Temps restant',
    correct: 'Correct!',
    wrong: 'Faux!',
    next: 'Suivant',
    finish: 'Terminer',
    dailyChallengeTitle: 'Défi Quotidien',
    todaysChallenge: 'Défi du jour',
    attemptsToday: 'Tentatives aujourd\'hui',
    timeUntilNext: 'Temps jusqu\'au prochain défi',
    completedToday: 'Terminé aujourd\'hui',
    tryAgainTomorrow: 'Réessayez demain!',
    friendMatch: 'Match ami',
    randomMatch: 'Match aléatoire',
    enterFriendId: 'Entrez l\'ID de l\'ami',
    challenge: 'Défier',
    waitingForPlayer: 'En attente du joueur...',
    accept: 'Accepter',
    decline: 'Refuser',
    opponentChallenge: 'vous défie!',
    liveProgress: 'Progression en direct',
    yourStats: 'Vos statistiques',
    totalCoins: 'Pièces totales',
    eloRating: 'Classement ELO',
    gamesPlayed: 'Parties jouées',
    accuracy: 'Précision',
    language: 'Langue',
    sound: 'Son',
    volume: 'Volume',
    theme: 'Thème',
    back: 'Retour',
    cancel: 'Annuler',
    confirm: 'Confirmer',
    loading: 'Chargement...',
    error: 'Erreur',
    retry: 'Réessayer'
  },
  es: {
    play: 'Jugar',
    dailyChallenge: 'Desafío Diario',
    multiplayer: 'Multijugador',
    profile: 'Perfil',
    leaderboard: 'Tabla de clasificación',
    settings: 'Configuración',
    enterYourName: 'Ingresa tu nombre',
    startPlaying: 'Comenzar a jugar',
    nameRequired: 'El nombre es requerido',
    question: 'Pregunta',
    score: 'Puntuación',
    timeLeft: 'Tiempo restante',
    correct: '¡Correcto!',
    wrong: '¡Incorrecto!',
    next: 'Siguiente',
    finish: 'Terminar',
    dailyChallengeTitle: 'Desafío Diario',
    todaysChallenge: 'Desafío de hoy',
    attemptsToday: 'Intentos de hoy',
    timeUntilNext: 'Tiempo hasta el próximo desafío',
    completedToday: 'Completado hoy',
    tryAgainTomorrow: '¡Intenta de nuevo mañana!',
    friendMatch: 'Partida con amigo',
    randomMatch: 'Partida aleatoria',
    enterFriendId: 'Ingresa el ID del amigo',
    challenge: 'Desafiar',
    waitingForPlayer: 'Esperando jugador...',
    accept: 'Aceptar',
    decline: 'Rechazar',
    opponentChallenge: '¡te desafía!',
    liveProgress: 'Progreso en vivo',
    yourStats: 'Tus estadísticas',
    totalCoins: 'Monedas totales',
    eloRating: 'Clasificación ELO',
    gamesPlayed: 'Partidas jugadas',
    accuracy: 'Precisión',
    language: 'Idioma',
    sound: 'Sonido',
    volume: 'Volumen',
    theme: 'Tema',
    back: 'Atrás',
    cancel: 'Cancelar',
    confirm: 'Confirmar',
    loading: 'Cargando...',
    error: 'Error',
    retry: 'Reintentar'
  }
}

export const rtlLanguages: Language[] = ['he', 'ar']

export const languageNames: Record<Language, string> = {
  en: 'English',
  he: 'Hebrew (He)',
  ar: 'Arabic (Ar)',
  fr: 'Français (Fr)',
  es: 'Español (Es)'
}
