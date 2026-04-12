export type Language = 'en' | 'he' | 'ar' | 'fr' | 'es'

export interface Translation {
  // Main menu
  play: string
  dailyChallenge: string
  multiplayer: string
  profile: string
  leaderboard: string
  settings: string
  chooseCategory: string
  coins: string
  changeName: string
  cancelNameEdit: string
  buyCoins: string
  
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
  category: string
  currentScore: string
  streak: string
  hint: string
  skip: string
  extraLife: string
  exitQuiz: string
  saving: string
  level: string
  questionNumber: string
  
  // Daily challenge
  dailyChallengeTitle: string
  todaysChallenge: string
  attemptsToday: string
  timeUntilNext: string
  completedToday: string
  tryAgainTomorrow: string
  newQuestionsEveryDay: string
  top3Today: string
  
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
  matchId: string
  you: string
  opponent: string
  answered: string
  correctAnswer: string
  challengeInvite: string
  challengingYou: string
  acceptDecline: string
  inviteSent: string
  waitingForFriend: string
  
  // Profile
  yourStats: string
  totalCoins: string
  eloRating: string
  gamesPlayed: string
  accuracy: string
  player: string
  playerId: string
  copy: string
  bronze: string
  silver: string
  gold: string
  platinum: string
  
  // Settings
  language: string
  sound: string
  volume: string
  theme: string
  mute: string
  unmute: string
  lightMode: string
  darkMode: string
  
  // Categories
  sports: string
  music: string
  movies: string
  science: string
  history: string
  geography: string
  technology: string
  animals: string
  food: string
  celebrities: string
  
  // Common
  back: string
  cancel: string
  confirm: string
  loading: string
  error: string
  retry: string
  dailyTrivia: string
  categoriesDescription: string
  allPlayers: string
  bestScore: string
  noScoresYet: string
  answerAtLeastOne: string
  categoryCompleted: string
  all10Levels: string
  replayCategory: string
  mainMenu: string
  shareOnWhatsapp: string
  loadingFreshQuestions: string
  timeUp: string
  couldNotLoadQuestions: string
  couldNotSubmitScore: string
  couldNotLoadLeaderboard: string
  couldNotStartRandomMatch: string
  couldNotLoadDailyChallenge: string
  couldNotSubmitDailyChallenge: string
  matchFinished: string
  youGotCorrect: string
  correctAnswerShown: string
  loadingQuestions: string
  updateDisplayName: string
  newName: string
  save: string
  close: string
  coinShop: string
  
  // Results
  correctAnswers: string
  incorrectAnswers: string
  
  // Shop
  coins100: string
  coins500: string
  coins2000: string
  shopComingSoon: string
  stripeNotConfigured: string
  couldNotStartCheckout: string
  
  // Streak messages
  streakBonus: string
  bonusCoins: string
  
  // Index signature for dynamic access (e.g., category IDs)
  [key: string]: string
}

export const translations: Record<Language, Translation> = {
  en: {
    play: 'Play',
    dailyChallenge: 'Daily Challenge',
    multiplayer: 'Multiplayer',
    profile: 'Profile',
    leaderboard: 'Leaderboard',
    settings: 'Settings',
    chooseCategory: 'Choose a category',
    coins: 'Coins',
    changeName: 'Change Name',
    cancelNameEdit: 'Cancel name edit',
    buyCoins: 'Buy Coins',
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
    category: 'Category',
    currentScore: 'Current score',
    streak: 'Streak',
    hint: 'Hint',
    skip: 'Skip',
    extraLife: 'Extra life',
    exitQuiz: 'Exit quiz',
    saving: 'Saving...',
    level: 'Level',
    questionNumber: 'Question',
    dailyChallengeTitle: 'Daily Challenge',
    todaysChallenge: "Today's Challenge",
    attemptsToday: 'Attempts Today',
    timeUntilNext: 'Time Until Next Challenge',
    completedToday: 'Completed Today',
    tryAgainTomorrow: 'Try again tomorrow!',
    newQuestionsEveryDay: 'New 10 questions every day at 00:00 UTC for all players.',
    top3Today: 'Top 3 today:',
    friendMatch: 'Friend Match',
    randomMatch: 'Random Match',
    enterFriendId: "Enter friend's ID",
    challenge: 'Challenge',
    waitingForPlayer: 'Waiting for player...',
    accept: 'Accept',
    decline: 'Decline',
    opponentChallenge: 'challenges you!',
    liveProgress: 'Live Progress',
    matchId: 'Match ID',
    you: 'You',
    opponent: 'Opponent',
    answered: 'answered',
    correctAnswer: 'correct',
    challengeInvite: 'Challenge Invite',
    challengingYou: 'is challenging you! Accept / Decline',
    acceptDecline: 'Accept / Decline',
    inviteSent: 'Invite sent! Waiting for your friend to accept...',
    waitingForFriend: 'Waiting for friend...',
    yourStats: 'Your Stats',
    totalCoins: 'Total Coins',
    eloRating: 'ELO Rating',
    gamesPlayed: 'Games Played',
    accuracy: 'Accuracy',
    player: 'Player',
    playerId: 'Player ID',
    copy: 'Copy',
    bronze: 'Bronze',
    silver: 'Silver',
    gold: 'Gold',
    platinum: 'Platinum',
    language: 'Language',
    sound: 'Sound',
    volume: 'Volume',
    theme: 'Theme',
    mute: 'Mute',
    unmute: 'Unmute',
    lightMode: 'Light mode',
    darkMode: 'Dark mode',
    sports: 'Sports',
    music: 'Music',
    movies: 'Movies',
    science: 'Science',
    history: 'History',
    geography: 'Geography',
    technology: 'Technology',
    animals: 'Animals',
    food: 'Food',
    celebrities: 'Celebrities',
    back: 'Back',
    cancel: 'Cancel',
    confirm: 'Confirm',
    loading: 'Loading...',
    error: 'Error',
    retry: 'Retry',
    dailyTrivia: 'Daily Trivia',
    categoriesDescription: '10 categories, 10 levels per category, 10 questions per level.',
    allPlayers: 'All players',
    bestScore: '(best score)',
    noScoresYet: 'No scores yet. Answer at least one question to appear here.',
    answerAtLeastOne: 'Answer at least one question to appear here.',
    categoryCompleted: 'Category summary',
    all10Levels: 'completed (all 10 levels).',
    replayCategory: 'Replay category',
    mainMenu: 'Main menu',
    shareOnWhatsapp: 'Share on WhatsApp',
    loadingFreshQuestions: 'Loading fresh questions for this level...',
    timeUp: 'Time is up for this question.',
    couldNotLoadQuestions: 'Could not load questions for this level. Please try again.',
    couldNotSubmitScore: 'Could not submit score.',
    couldNotLoadLeaderboard: 'Could not load leaderboard right now.',
    couldNotStartRandomMatch: 'Could not start random match.',
    couldNotLoadDailyChallenge: 'Could not load daily challenge.',
    couldNotSubmitDailyChallenge: 'Could not submit daily challenge.',
    matchFinished: 'Match finished! You got',
    youGotCorrect: '/10 correct.',
    correctAnswerShown: 'Correct answer shown',
    loadingQuestions: 'Loading questions...',
    updateDisplayName: 'Update your display name',
    newName: 'New name',
    save: 'Save',
    close: 'Close',
    coinShop: 'Coin Shop',
    correctAnswers: 'Correct',
    incorrectAnswers: 'Incorrect',
    coins100: '100 coins - $0.99',
    coins500: '500 coins - $3.99',
    coins2000: '2000 coins - $9.99',
    shopComingSoon: 'Shop is coming soon. Stripe is not configured yet.',
    stripeNotConfigured: 'Stripe is not configured yet.',
    couldNotStartCheckout: 'Could not start checkout.',
    streakBonus: 'Streak! +5 bonus coins',
    bonusCoins: '+5 bonus coins'
  },
  he: {
    play: ' spielen',
    dailyChallenge: ' challenge day',
    multiplayer: ' multiplayer',
    profile: ' profile',
    leaderboard: ' leaderboard',
    settings: ' settings',
    chooseCategory: 'Wähle eine Kategorie',
    coins: 'Münzen',
    changeName: 'Namen ändern',
    cancelNameEdit: 'Namensbearbeitung abbrechen',
    buyCoins: 'Münzen kaufen',
    enterYourName: 'Gib deinen Namen ein',
    startPlaying: 'Starte zu spielen',
    nameRequired: 'Name ist erforderlich',
    question: 'Frage',
    score: 'Punktzahl',
    timeLeft: 'Verbleibende Zeit',
    correct: 'Korrekt!',
    wrong: 'Falsch!',
    next: 'Weiter',
    finish: 'Beenden',
    category: 'Kategorie',
    currentScore: 'Aktuelle Punktzahl',
    streak: 'Serie',
    hint: 'Tipp',
    skip: 'Überspringen',
    extraLife: 'Zusätzliches Leben',
    exitQuiz: 'Quiz beenden',
    saving: 'Speichern...',
    level: 'Level',
    questionNumber: 'Frage',
    dailyChallengeTitle: 'Tägliche Herausforderung',
    todaysChallenge: 'Herausforderung des Tages',
    attemptsToday: 'Versuche heute',
    timeUntilNext: 'Zeit bis zur nächsten Herausforderung',
    completedToday: 'Heute abgeschlossen',
    tryAgainTomorrow: 'Versuche es morgen erneut!',
    newQuestionsEveryDay: 'Jeden Tag 10 neue Fragen um 00:00 UTC für alle Spieler.',
    top3Today: 'Top 3 heute:',
    friendMatch: 'Freundschaftsspiel',
    randomMatch: 'Zufälliges Spiel',
    enterFriendId: 'Freunde-ID eingeben',
    challenge: 'Herausfordern',
    waitingForPlayer: 'Warte auf Spieler...',
    accept: 'Akzeptieren',
    decline: 'Ablehnen',
    opponentChallenge: 'fordert dich heraus!',
    liveProgress: 'Live-Fortschritt',
    matchId: 'Spiel-ID',
    you: 'Du',
    opponent: 'Gegner',
    answered: 'beantwortet',
    correctAnswer: 'korrekt',
    challengeInvite: 'Herausforderungseinladung',
    challengingYou: 'fordert dich heraus! Akzeptieren / Ablehnen',
    acceptDecline: 'Akzeptieren / Ablehnen',
    inviteSent: 'Einladung gesendet! Warte auf die Annahme deines Freundes...',
    waitingForFriend: 'Warte auf Freund...',
    yourStats: 'Deine Statistiken',
    totalCoins: 'Gesamtmünzen',
    eloRating: 'ELO-Bewertung',
    gamesPlayed: 'Gespielte Spiele',
    accuracy: 'Genauigkeit',
    player: 'Spieler',
    playerId: 'Spieler-ID',
    copy: 'Kopieren',
    bronze: 'Bronze',
    silver: 'Silber',
    gold: 'Gold',
    platinum: 'Platin',
    language: 'Sprache',
    sound: 'Ton',
    volume: 'Lautstärke',
    theme: 'Design',
    mute: 'Stumm',
    unmute: 'Ton ein',
    lightMode: 'Heller Modus',
    darkMode: 'Dunkler Modus',
    sports: 'Sport',
    music: 'Musik',
    movies: 'Filme',
    science: 'Wissenschaft',
    history: 'Geschichte',
    geography: 'Geografie',
    technology: 'Technologie',
    animals: 'Tiere',
    food: 'Essen',
    celebrities: 'Prominente',
    back: 'Zurück',
    cancel: 'Abbrechen',
    confirm: 'Bestätigen',
    loading: 'Laden...',
    error: 'Fehler',
    retry: 'Wiederholen',
    dailyTrivia: 'Tägliches Trivia',
    categoriesDescription: '10 Kategorien, 10 Level pro Kategorie, 10 Fragen pro Level.',
    allPlayers: 'Alle Spieler',
    bestScore: '(beste Punktzahl)',
    noScoresYet: 'Noch keine Punktzahlen. Beantworte mindestens eine Frage, um hier zu erscheinen.',
    answerAtLeastOne: 'Beantworte mindestens eine Frage, um hier zu erscheinen.',
    categoryCompleted: 'Kategorie-Zusammenfassung',
    all10Levels: 'abgeschlossen (alle 10 Level).',
    replayCategory: 'Kategorie wiederholen',
    mainMenu: 'Hauptmenü',
    shareOnWhatsapp: 'Auf WhatsApp teilen',
    loadingFreshQuestions: 'Lade frische Fragen für dieses Level...',
    timeUp: 'Zeit für diese Frage abgelaufen.',
    couldNotLoadQuestions: 'Fragen für dieses Level konnten nicht geladen werden. Bitte versuche es erneut.',
    couldNotSubmitScore: 'Punktzahl konnte nicht übermittelt werden.',
    couldNotLoadLeaderboard: 'Bestenliste konnte nicht geladen werden.',
    couldNotStartRandomMatch: 'Zufälliges Spiel konnte nicht gestartet werden.',
    couldNotLoadDailyChallenge: 'Tägliche Herausforderung konnte nicht geladen werden.',
    couldNotSubmitDailyChallenge: 'Tägliche Herausforderung konnte nicht übermittelt werden.',
    matchFinished: 'Spiel beendet! Du hast',
    youGotCorrect: '/10 korrekt.',
    correctAnswerShown: 'Korrekte Antwort angezeigt',
    loadingQuestions: 'Lade Fragen...',
    updateDisplayName: 'Anzeigenamen aktualisieren',
    newName: 'Neuer Name',
    save: 'Speichern',
    close: 'Schließen',
    coinShop: 'Münzladen',
    correctAnswers: 'Korrekt',
    incorrectAnswers: 'Falsch',
    coins100: '100 Münzen - 0,99 $',
    coins500: '500 Münzen - 3,99 $',
    coins2000: '2000 Münzen - 9,99 $',
    shopComingSoon: 'Shop kommt bald. Stripe ist noch nicht konfiguriert.',
    stripeNotConfigured: 'Stripe ist noch nicht konfiguriert.',
    couldNotStartCheckout: 'Checkout konnte nicht gestartet werden.',
    streakBonus: 'Serie! +5 Bonusmünzen',
    bonusCoins: '+5 Bonusmünzen'
  },
  ar: {
    play: 'Play',
    dailyChallenge: 'Daily Challenge',
    multiplayer: 'Multiplayer',
    profile: 'Profile',
    leaderboard: 'Leaderboard',
    settings: 'Settings',
    chooseCategory: 'Choose a category',
    coins: 'Coins',
    changeName: 'Change Name',
    cancelNameEdit: 'Cancel name edit',
    buyCoins: 'Buy Coins',
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
    category: 'Category',
    currentScore: 'Current score',
    streak: 'Streak',
    hint: 'Hint',
    skip: 'Skip',
    extraLife: 'Extra life',
    exitQuiz: 'Exit quiz',
    saving: 'Saving...',
    level: 'Level',
    questionNumber: 'Question',
    dailyChallengeTitle: 'Daily Challenge',
    todaysChallenge: "Today's Challenge",
    attemptsToday: 'Attempts Today',
    timeUntilNext: 'Time Until Next Challenge',
    completedToday: 'Completed Today',
    tryAgainTomorrow: 'Try again tomorrow!',
    newQuestionsEveryDay: 'New 10 questions every day at 00:00 UTC for all players.',
    top3Today: 'Top 3 today:',
    friendMatch: 'Friend Match',
    randomMatch: 'Random Match',
    enterFriendId: "Enter friend's ID",
    challenge: 'Challenge',
    waitingForPlayer: 'Waiting for player...',
    accept: 'Accept',
    decline: 'Decline',
    opponentChallenge: 'challenges you!',
    liveProgress: 'Live Progress',
    matchId: 'Match ID',
    you: 'You',
    opponent: 'Opponent',
    answered: 'answered',
    correctAnswer: 'correct',
    challengeInvite: 'Challenge Invite',
    challengingYou: 'is challenging you! Accept / Decline',
    acceptDecline: 'Accept / Decline',
    inviteSent: 'Invite sent! Waiting for your friend to accept...',
    waitingForFriend: 'Waiting for friend...',
    yourStats: 'Your Stats',
    totalCoins: 'Total Coins',
    eloRating: 'ELO Rating',
    gamesPlayed: 'Games Played',
    accuracy: 'Accuracy',
    player: 'Player',
    playerId: 'Player ID',
    copy: 'Copy',
    bronze: 'Bronze',
    silver: 'Silver',
    gold: 'Gold',
    platinum: 'Platinum',
    language: 'Language',
    sound: 'Sound',
    volume: 'Volume',
    theme: 'Theme',
    mute: 'Mute',
    unmute: 'Unmute',
    lightMode: 'Light mode',
    darkMode: 'Dark mode',
    sports: 'Sports',
    music: 'Music',
    movies: 'Movies',
    science: 'Science',
    history: 'History',
    geography: 'Geography',
    technology: 'Technology',
    animals: 'Animals',
    food: 'Food',
    celebrities: 'Celebrities',
    back: 'Back',
    cancel: 'Cancel',
    confirm: 'Confirm',
    loading: 'Loading...',
    error: 'Error',
    retry: 'Retry',
    dailyTrivia: 'Daily Trivia',
    categoriesDescription: '10 categories, 10 levels per category, 10 questions per level.',
    allPlayers: 'All players',
    bestScore: '(best score)',
    noScoresYet: 'No scores yet. Answer at least one question to appear here.',
    answerAtLeastOne: 'Answer at least one question to appear here.',
    categoryCompleted: 'Category summary',
    all10Levels: 'completed (all 10 levels).',
    replayCategory: 'Replay category',
    mainMenu: 'Main menu',
    shareOnWhatsapp: 'Share on WhatsApp',
    loadingFreshQuestions: 'Loading fresh questions for this level...',
    timeUp: 'Time is up for this question.',
    couldNotLoadQuestions: 'Could not load questions for this level. Please try again.',
    couldNotSubmitScore: 'Could not submit score.',
    couldNotLoadLeaderboard: 'Could not load leaderboard right now.',
    couldNotStartRandomMatch: 'Could not start random match.',
    couldNotLoadDailyChallenge: 'Could not load daily challenge.',
    couldNotSubmitDailyChallenge: 'Could not submit daily challenge.',
    matchFinished: 'Match finished! You got',
    youGotCorrect: '/10 correct.',
    correctAnswerShown: 'Correct answer shown',
    loadingQuestions: 'Loading questions...',
    updateDisplayName: 'Update your display name',
    newName: 'New name',
    save: 'Save',
    close: 'Close',
    coinShop: 'Coin Shop',
    correctAnswers: 'Correct',
    incorrectAnswers: 'Incorrect',
    coins100: '100 coins - $0.99',
    coins500: '500 coins - $3.99',
    coins2000: '2000 coins - $9.99',
    shopComingSoon: 'Shop is coming soon. Stripe is not configured yet.',
    stripeNotConfigured: 'Stripe is not configured yet.',
    couldNotStartCheckout: 'Could not start checkout.',
    streakBonus: 'Streak! +5 bonus coins',
    bonusCoins: '+5 bonus coins'
  },
  fr: {
    play: 'Jouer',
    dailyChallenge: 'Défi Quotidien',
    multiplayer: 'Multijoueur',
    profile: 'Profil',
    leaderboard: 'Classement',
    settings: 'Paramètres',
    chooseCategory: 'Choisissez une catégorie',
    coins: 'Pièces',
    changeName: 'Changer de nom',
    cancelNameEdit: 'Annuler l\'édition du nom',
    buyCoins: 'Acheter des pièces',
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
    category: 'Catégorie',
    currentScore: 'Score actuel',
    streak: 'Série',
    hint: 'Indice',
    skip: 'Passer',
    extraLife: 'Vie supplémentaire',
    exitQuiz: 'Quitter le quiz',
    saving: 'Sauvegarde...',
    level: 'Niveau',
    questionNumber: 'Question',
    dailyChallengeTitle: 'Défi Quotidien',
    todaysChallenge: 'Défi du jour',
    attemptsToday: 'Tentatives aujourd\'hui',
    timeUntilNext: 'Temps jusqu\'au prochain défi',
    completedToday: 'Terminé aujourd\'hui',
    tryAgainTomorrow: 'Réessayez demain!',
    newQuestionsEveryDay: '10 nouvelles questions chaque jour à 00:00 UTC pour tous les joueurs.',
    top3Today: 'Top 3 aujourd\'hui:',
    friendMatch: 'Match ami',
    randomMatch: 'Match aléatoire',
    enterFriendId: 'Entrez l\'ID de l\'ami',
    challenge: 'Défier',
    waitingForPlayer: 'En attente du joueur...',
    accept: 'Accepter',
    decline: 'Refuser',
    opponentChallenge: 'vous défie!',
    liveProgress: 'Progression en direct',
    matchId: 'ID du match',
    you: 'Vous',
    opponent: 'Adversaire',
    answered: 'répondu',
    correctAnswer: 'correct',
    challengeInvite: 'Invitation de défi',
    challengingYou: 'vous défie! Accepter / Refuser',
    acceptDecline: 'Accepter / Refuser',
    inviteSent: 'Invitation envoyée! En attente de l\'acceptation de votre ami...',
    waitingForFriend: 'En attente de l\'ami...',
    yourStats: 'Vos statistiques',
    totalCoins: 'Pièces totales',
    eloRating: 'Classement ELO',
    gamesPlayed: 'Parties jouées',
    accuracy: 'Précision',
    player: 'Joueur',
    playerId: 'ID du joueur',
    copy: 'Copier',
    bronze: 'Bronze',
    silver: 'Argent',
    gold: 'Or',
    platinum: 'Platine',
    language: 'Langue',
    sound: 'Son',
    volume: 'Volume',
    theme: 'Thème',
    mute: 'Muet',
    unmute: 'Activer le son',
    lightMode: 'Mode clair',
    darkMode: 'Mode sombre',
    sports: 'Sport',
    music: 'Musique',
    movies: 'Films',
    science: 'Science',
    history: 'Histoire',
    geography: 'Géographie',
    technology: 'Technologie',
    animals: 'Animaux',
    food: 'Nourriture',
    celebrities: 'Célébrités',
    back: 'Retour',
    cancel: 'Annuler',
    confirm: 'Confirmer',
    loading: 'Chargement...',
    error: 'Erreur',
    retry: 'Réessayer',
    dailyTrivia: 'Trivia Quotidien',
    categoriesDescription: '10 catégories, 10 niveaux par catégorie, 10 questions par niveau.',
    allPlayers: 'Tous les joueurs',
    bestScore: '(meilleur score)',
    noScoresYet: 'Pas encore de scores. Répondez à au moins une question pour apparaître ici.',
    answerAtLeastOne: 'Répondez à au moins une question pour apparaître ici.',
    categoryCompleted: 'Résumé de la catégorie',
    all10Levels: 'terminé (tous les 10 niveaux).',
    replayCategory: 'Rejouer la catégorie',
    mainMenu: 'Menu principal',
    shareOnWhatsapp: 'Partager sur WhatsApp',
    loadingFreshQuestions: 'Chargement de nouvelles questions pour ce niveau...',
    timeUp: 'Le temps est écoulé pour cette question.',
    couldNotLoadQuestions: 'Impossible de charger les questions pour ce niveau. Veuillez réessayer.',
    couldNotSubmitScore: 'Impossible de soumettre le score.',
    couldNotLoadLeaderboard: 'Impossible de charger le classement actuellement.',
    couldNotStartRandomMatch: 'Impossible de démarrer un match aléatoire.',
    couldNotLoadDailyChallenge: 'Impossible de charger le défi quotidien.',
    couldNotSubmitDailyChallenge: 'Impossible de soumettre le défi quotidien.',
    matchFinished: 'Match terminé! Vous avez obtenu',
    youGotCorrect: '/10 correct.',
    correctAnswerShown: 'Réponse correcte affichée',
    loadingQuestions: 'Chargement des questions...',
    updateDisplayName: 'Mettre à jour votre nom d\'affichage',
    newName: 'Nouveau nom',
    save: 'Sauvegarder',
    close: 'Fermer',
    coinShop: 'Boutique de pièces',
    correctAnswers: 'Correct',
    incorrectAnswers: 'Incorrect',
    coins100: '100 pièces - 0,99 $',
    coins500: '500 pièces - 3,99 $',
    coins2000: '2000 pièces - 9,99 $',
    shopComingSoon: 'La boutique arrive bientôt. Stripe n\'est pas encore configuré.',
    stripeNotConfigured: 'Stripe n\'est pas encore configuré.',
    couldNotStartCheckout: 'Impossible de démarrer le paiement.',
    streakBonus: 'Série! +5 pièces bonus',
    bonusCoins: '+5 pièces bonus'
  },
  es: {
    play: 'Jugar',
    dailyChallenge: 'Desafío Diario',
    multiplayer: 'Multijugador',
    profile: 'Perfil',
    leaderboard: 'Tabla de clasificación',
    settings: 'Configuración',
    chooseCategory: 'Elige una categoría',
    coins: 'Monedas',
    changeName: 'Cambiar nombre',
    cancelNameEdit: 'Cancelar edición de nombre',
    buyCoins: 'Comprar monedas',
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
    category: 'Categoría',
    currentScore: 'Puntuación actual',
    streak: 'Racha',
    hint: 'Pista',
    skip: 'Omitir',
    extraLife: 'Vida extra',
    exitQuiz: 'Salir del quiz',
    saving: 'Guardando...',
    level: 'Nivel',
    questionNumber: 'Pregunta',
    dailyChallengeTitle: 'Desafío Diario',
    todaysChallenge: 'Desafío de hoy',
    attemptsToday: 'Intentos de hoy',
    timeUntilNext: 'Tiempo hasta el próximo desafío',
    completedToday: 'Completado hoy',
    tryAgainTomorrow: '¡Intenta de nuevo mañana!',
    newQuestionsEveryDay: '10 preguntas nuevas cada día a las 00:00 UTC para todos los jugadores.',
    top3Today: 'Top 3 de hoy:',
    friendMatch: 'Partida con amigo',
    randomMatch: 'Partida aleatoria',
    enterFriendId: 'Ingresa el ID del amigo',
    challenge: 'Desafiar',
    waitingForPlayer: 'Esperando jugador...',
    accept: 'Aceptar',
    decline: 'Rechazar',
    opponentChallenge: '¡te desafía!',
    liveProgress: 'Progreso en vivo',
    matchId: 'ID de partida',
    you: 'Tú',
    opponent: 'Oponente',
    answered: 'respondidas',
    correctAnswer: 'correctas',
    challengeInvite: 'Invitación de desafío',
    challengingYou: '¡te desafía! Aceptar / Rechazar',
    acceptDecline: 'Aceptar / Rechazar',
    inviteSent: '¡Invitación enviada! Esperando que tu amigo acepte...',
    waitingForFriend: 'Esperando al amigo...',
    yourStats: 'Tus estadísticas',
    totalCoins: 'Monedas totales',
    eloRating: 'Clasificación ELO',
    gamesPlayed: 'Partidas jugadas',
    accuracy: 'Precisión',
    player: 'Jugador',
    playerId: 'ID del jugador',
    copy: 'Copiar',
    bronze: 'Bronce',
    silver: 'Plata',
    gold: 'Oro',
    platinum: 'Platino',
    language: 'Idioma',
    sound: 'Sonido',
    volume: 'Volumen',
    theme: 'Tema',
    mute: 'Silenciar',
    unmute: 'Activar sonido',
    lightMode: 'Modo claro',
    darkMode: 'Modo oscuro',
    sports: 'Deportes',
    music: 'Música',
    movies: 'Películas',
    science: 'Ciencia',
    history: 'Historia',
    geography: 'Geografía',
    technology: 'Tecnología',
    animals: 'Animales',
    food: 'Comida',
    celebrities: 'Celebridades',
    back: 'Atrás',
    cancel: 'Cancelar',
    confirm: 'Confirmar',
    loading: 'Cargando...',
    error: 'Error',
    retry: 'Reintentar',
    dailyTrivia: 'Trivia Diario',
    categoriesDescription: '10 categorías, 10 niveles por categoría, 10 preguntas por nivel.',
    allPlayers: 'Todos los jugadores',
    bestScore: '(mejor puntuación)',
    noScoresYet: 'No hay puntuaciones aún. Responde al menos una pregunta para aparecer aquí.',
    answerAtLeastOne: 'Responde al menos una pregunta para aparecer aquí.',
    categoryCompleted: 'Resumen de la categoría',
    all10Levels: 'completado (todos los 10 niveles).',
    replayCategory: 'Repetir categoría',
    mainMenu: 'Menú principal',
    shareOnWhatsapp: 'Compartir en WhatsApp',
    loadingFreshQuestions: 'Cargando preguntas nuevas para este nivel...',
    timeUp: 'Se acabó el tiempo para esta pregunta.',
    couldNotLoadQuestions: 'No se pudieron cargar las preguntas para este nivel. Por favor intenta de nuevo.',
    couldNotSubmitScore: 'No se pudo enviar la puntuación.',
    couldNotLoadLeaderboard: 'No se pudo cargar la tabla de clasificación ahora mismo.',
    couldNotStartRandomMatch: 'No se pudo iniciar la partida aleatoria.',
    couldNotLoadDailyChallenge: 'No se pudo cargar el desafío diario.',
    couldNotSubmitDailyChallenge: 'No se pudo enviar el desafío diario.',
    matchFinished: '¡Partida terminada! Obtuviste',
    youGotCorrect: '/10 correctas.',
    correctAnswerShown: 'Respuesta correcta mostrada',
    loadingQuestions: 'Cargando preguntas...',
    updateDisplayName: 'Actualizar tu nombre para mostrar',
    newName: 'Nuevo nombre',
    save: 'Guardar',
    close: 'Cerrar',
    coinShop: 'Tienda de monedas',
    correctAnswers: 'Correctas',
    incorrectAnswers: 'Incorrectas',
    coins100: '100 monedas - $0.99',
    coins500: '500 monedas - $3.99',
    coins2000: '2000 monedas - $9.99',
    shopComingSoon: 'La tienda viene pronto. Stripe no está configurado aún.',
    stripeNotConfigured: 'Stripe no está configurado aún.',
    couldNotStartCheckout: 'No se pudo iniciar el pago.',
    streakBonus: '¡Racha! +5 monedas bonus',
    bonusCoins: '+5 monedas bonus'
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
