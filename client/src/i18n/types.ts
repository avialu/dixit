/**
 * Type Definitions for Internationalization (i18n)
 *
 * Provides type safety for translation keys and language management
 */

export type Language = "en" | "he";

/**
 * Translation keys structure - organized by feature/screen
 */
export interface TranslationKeys {
  // Join Screen
  join: {
    title: string;
    tagline: string;
    enterName: string;
    addPhoto: string;
    joinButton: string;
    spectator: string;
    scanToJoin: string;
    joining: string;
  };

  // Common UI elements
  common: {
    loading: string;
    players: string;
    settings: string;
    close: string;
    cancel: string;
    confirm: string;
    continue: string;
    save: string;
    edit: string;
    delete: string;
    upload: string;
    done: string;
    back: string;
    next: string;
    logout: string;
    admin: string;
    you: string;
    storyteller: string;
    score: string;
    votes: string;
  };

  // Lobby (Deck Building Phase)
  lobby: {
    title: string;
    playersSection: string;
    deckSection: string;
    settingsSection: string;
    waitingForPlayers: string;
    needMoreImages: string;
    readyToStart: string;
    playerCount: string;
    imageCount: string;
    startGame: string;
    editName: string;
    kickPlayer: string;
    makeAdmin: string;
    uploadImages: string;
    deleteImage: string;
    allowPlayerUploads: string;
    boardBackground: string;
    boardPattern: string;
    patternSnake: string;
    patternSpiral: string;
    winTarget: string;
    winTargetUnlimited: string;
    languageSettings: string;
    gameLanguage: string;
    myLanguage: string;
    usingRoomDefault: string;
    usingPersonalOverride: string;
    deckImages: string;
    myImages: string;
    deckCount: string;
    needMore: string;
    logoutReturn: string;
    clickToEditName: string;
    uploadCustomBackground: string;
    uploadBackgroundDesc: string;
    useDefaultBackground: string;
    choosePatternDesc: string;
    winTargetDesc: string;
    gameLanguageDesc: string;
    personalLanguageDesc: string;
    waitingForAdmin: string;
    spectatingHelp: string;
    pointsLabel: string;
    adminBoardBackgroundLabel: string;
    adminBoardPatternLabel: string;
    adminWinTargetLabel: string;
    adminLanguageLabel: string;
    playerLanguageLabel: string;
  };

  // Deck Uploader
  deckUploader: {
    deck: string;
    myImages: string;
    needMore: string;
    playersCanUpload: string;
    onlyAdminUploads: string;
    uploadImages: string;
    uploadFolder: string;
    uploading: string;
    onlyHostCanUpload: string;
    processed: string;
    failed: string;
    deleteAll: string;
    deleteAllImages: string;
    deleteAllConfirm: string;
    noImagesYet: string;
    deleteImageTitle: string;
    tooManyImages: string;
    tooManyImagesMessage: string;
    uploadedSuccess: string;
    uploadedSuccessSingular: string;
    failedToProcess: string;
    failedToProcessSingular: string;
    uploadError: string;
    selectFiles: string;
    selectFolder: string;
    uploadedImage: string;
    retrying: string;
    uploadFailed: string;
  };

  // Game Phases
  phases: {
    deckBuilding: string;
    storytellerChoice: string;
    playersChoice: string;
    voting: string;
    reveal: string;
    scoring: string;
    gameEnd: string;
  };

  // Game Status Messages
  status: {
    waitingForPlayers: string;
    needMoreImages: string;
    readyToStart: string;
    storytellerChoosing: string;
    waitingForStoryteller: string;
    playersChoosing: string;
    matchTheClue: string;
    cardsRevealed: string;
    readyToVote: string;
    playersVoting: string;
    whichCardIsStoryteller: string;
    roundComplete: string;
    calculatingScores: string;
    gameOver: string;
    winnerIs: string;
  };

  // Storyteller Phase
  storyteller: {
    chooseCard: string;
    enterClue: string;
    cluePlaceholder: string;
    submitCard: string;
    waitingForYou: string;
    youSubmitted: string;
    submitted: string;
    storyteller: string;
    yourClue: string;
    waitingFor: string;
    enterYourClue: string;
    submit: string;
  };

  // Player Choice Phase
  playerChoice: {
    chooseCard: string;
    matchClue: string;
    theClueIs: string;
    submitCard: string;
    waitingForPlayers: string;
    youSubmitted: string;
    playersWaiting: string;
    submitted: string;
    chooseCardTitle: string;
    storytellerClue: string;
    waitingTitle: string;
  };

  // Voting Phase
  voting: {
    voteForCard: string;
    whichIsStoryteller: string;
    theClueWas: string;
    submitVote: string;
    cannotVoteOwnCard: string;
    storytellerWaiting: string;
    youVoted: string;
    waitingForVotes: string;
    vote: string;
    voted: string;
    allVotesIn: string;
    watching: string;
    spectating: string;
    storytellerClue: string;
  };

  // Reveal Phase
  reveal: {
    roundResults: string;
    storytellerCard: string;
    votesReceived: string;
    pointsEarned: string;
    everyoneGuessed: string;
    nobodyGuessed: string;
    someGuessed: string;
    correctGuess: string;
    fooledPlayers: string;
    continueButton: string;
    results: string;
    storytellerClue: string;
    continue: string;
    waiting: string;
  };

  // Game End Phase
  gameEnd: {
    gameOver: string;
    winner: string;
    finalScores: string;
    playAgain: string;
    newDeck: string;
    congratulations: string;
    resetGame: string;
    wins: string;
    rank: string;
    points: string;
  };

  // Confirm Modals
  confirm: {
    kickPlayerTitle: string;
    kickPlayerMessage: string;
    makeAdminTitle: string;
    makeAdminMessage: string;
    logoutWarningTitle: string;
    logoutWarningMessage: string;
    deleteImageTitle: string;
    deleteImageMessage: string;
  };

  // Error Messages
  errors: {
    nameTaken: string;
    connectionLost: string;
    uploadFailed: string;
    invalidMove: string;
    notYourTurn: string;
    gameInProgress: string;
    notEnoughPlayers: string;
    deckTooSmall: string;
    permissionDenied: string;
    unknownError: string;
  };

  // Tooltips & Help
  tooltips: {
    startGame: string;
    needPlayers: string;
    needImages: string;
    qrCode: string;
    uploadImage: string;
    profilePhoto: string;
    boardBackground: string;
    winTarget: string;
    allowUploads: string;
  };

  // Languages
  languages: {
    english: string;
    hebrew: string;
  };

  // Connection Status
  connection: {
    connecting: string;
    reconnecting: string;
    disconnected: string;
    retry: string;
  };

  // Admin Settings (available during game)
  adminSettings: {
    title: string;
    playerManagement: string;
    gameSettings: string;
    lobbyOnlyNote: string;
    cantKickStoryteller: string;
    wouldEndGame: string;
    winTargetWarningTitle: string;
    winTargetWarningMessage: string;
  };
}

/**
 * Type for a complete translation object
 */
export type Translations = {
  [K in Language]: TranslationKeys;
};
