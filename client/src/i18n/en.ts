/**
 * English Translations
 *
 * Complete translation set for all UI strings in the application
 */

import { TranslationKeys } from "./types";

export const en: TranslationKeys = {
  // Join Screen
  join: {
    title: "DIXIT",
    tagline: "A game of creative storytelling",
    enterName: "Enter your name",
    addPhoto: "Add your profile photo",
    joinButton: "Join Game",
    spectator: "Join as Spectator",
    scanToJoin: "Scan to join from mobile",
    joining: "Joining...",
  },

  // Common UI elements
  common: {
    loading: "Loading...",
    players: "Players",
    images: "images",
    settings: "Settings",
    close: "Close",
    cancel: "Cancel",
    confirm: "Confirm",
    continue: "Continue",
    save: "Save",
    edit: "Edit",
    delete: "Delete",
    upload: "Upload",
    done: "Done",
    back: "Back",
    next: "Next",
    logout: "Logout",
    admin: "Admin",
    you: "You",
    storyteller: "Storyteller",
    score: "Score",
    votes: "Votes",
  },

  // Lobby (Deck Building Phase)
  lobby: {
    title: "Game Lobby",
    playersSection: "Players",
    deckSection: "Game Deck",
    settingsSection: "Game Settings",
    waitingForPlayers: "Waiting for players to join...",
    needMoreImages: "Need {count} more images to start",
    readyToStart: "Ready to start!",
    playerCount: "{count} players",
    imageCount: "{current}/{required} images",
    startGame: "Start Game",
    editName: "Edit Name",
    kickPlayer: "Kick Player",
    makeAdmin: "Make Admin",
    uploadImages: "Upload Images",
    deleteImage: "Delete Image",
    allowPlayerUploads: "Allow player uploads",
    boardBackground: "Board Background",
    boardPattern: "Board Pattern",
    patternSnake: "Snake (Zigzag)",
    patternSpiral: "Spiral (Snail)",
    winTarget: "Points to Win",
    winTargetUnlimited: "Unlimited",
    languageSettings: "Language",
    gameLanguage: "Game Language",
    myLanguage: "My Language",
    usingRoomDefault: "Using game default",
    usingPersonalOverride: "Personal preference",
    deckImages: "Deck Images",
    myImages: "My images",
    deckCount: "Deck",
    needMore: "Need {count} more",
    logoutReturn: "Logout & Return to Join Screen",
    clickToEditName: "Click to edit your name",
    uploadCustomBackground: "Upload Custom Background",
    uploadBackgroundDesc:
      "Upload an image to customize the game board background",
    useDefaultBackground: "Use Default Background",
    choosePatternDesc: "Choose how the score track is arranged on the board",
    winTargetDesc: "First player to reach {target} points wins!",
    gameLanguageDesc: "Set default language for all players",
    personalLanguageDesc: "Choose your personal language preference",
    waitingForAdmin: "Waiting for admin to start the game...",
    waitingForAdminName: "Waiting for {name} to start the game...",
    spectatingHelp:
      "Spectating - You can upload images to help build the deck!",
    pointsLabel: "{points} Points",
    adminBoardBackgroundLabel: "Board Background (Admin)",
    adminBoardPatternLabel: "Board Pattern (Admin)",
    adminWinTargetLabel: "Win Target (Admin)",
    adminLanguageLabel: "Game Language (Admin)",
    playerLanguageLabel: "Language",
  },

  // Deck Uploader
  deckUploader: {
    deck: "Deck",
    myImages: "My Images",
    maxImages: "Maximum 200",
    minPlayers: "Minimum 3",
    allImages: "All Images",
    needMore: "Need {count} more",
    needMorePlayers: "Need {count} more players",
    needOneMorePlayer: "Need 1 more player",
    prefer: "Prefer {count}",
    playersCanUpload: "Players can upload",
    onlyAdminUploads: "Only admin uploads",
    uploadImages: "Upload Images",
    uploadFolder: "Upload Folder",
    uploading: "Uploading...",
    processingImages: "Processing images...",
    onlyHostCanUpload: "Only the host can upload images",
    processed: "{completed} of {total} processed",
    failed: "{count} failed",
    deleteAll: "Delete All ({count})",
    deleteAllImages: "Delete All Images",
    deleteAllConfirm: "Are you sure you want to delete all {count} images?",
    noImagesYet: "No images uploaded yet",
    deleteImageTitle: "Delete image",
    tooManyImages: "Too Many Images",
    tooManyImagesMessage:
      "You can only upload {remaining} more images. The first {remaining} images will be processed.",
    uploadedSuccess: "Uploaded {count} image(s)",
    uploadedSuccessSingular: "Uploaded {count} image",
    failedToProcess: "{count} image(s) failed to process",
    failedToProcessSingular: "{count} image failed to process",
    uploadError: "An error occurred during upload. Please try again.",
    selectFiles: "Select one or multiple image files",
    selectFolder: "Select an entire folder of images",
    uploadedImage: "Uploaded image",
    retrying: "Retrying {name} ({attempt}/{max})...",
    uploadFailed: "Upload failed after {attempts} attempts",
  },

  // Game Phases
  phases: {
    deckBuilding: "Deck Building",
    storytellerChoice: "Storyteller Choice",
    playersChoice: "Players Choice",
    voting: "Voting",
    reveal: "Reveal",
    scoring: "Scoring",
    gameEnd: "Game Over",
  },

  // Game Status Messages
  status: {
    waitingForPlayers: "Waiting for players to join...",
    needMoreImages: "Need {count} more images to start",
    readyToStart: "Ready to start!",
    storytellerChoosing: "{name} is choosing a card...",
    storytellerThinking: "{name} is thinking...",
    waitingForStoryteller: "Waiting for {name} to provide a clue",
    playersChoosing: "Players are choosing their cards...",
    matchTheClue: 'Match the clue: "{clue}"',
    cardsRevealed: "Cards revealed!",
    readyToVote: "Get ready to vote",
    playersVoting: "Players are voting...",
    whichCardIsStoryteller: "Which card belongs to the storyteller?",
    roundComplete: "Round complete!",
    calculatingScores: "Calculating scores...",
    gameOver: "Game Over!",
    winnerIs: "{name} wins with {score} points!",
  },

  // Storyteller Phase
  storyteller: {
    chooseCard: "Choose a card and give a clue",
    enterClue: "Enter your clue",
    cluePlaceholder: "Enter a word, phrase, or story...",
    submitCard: "Submit Card & Clue",
    waitingForYou: "Waiting for you...",
    youSubmitted: "You submitted your card",
    submitted: "Submitted",
    storyteller: "Storyteller",
    yourClue: "Your Clue",
    waitingFor: "Waiting for {names}",
    enterYourClue: "Enter your clue...",
    submit: "Submit",
  },

  // Player Choice Phase
  playerChoice: {
    chooseCard: "Choose a card that matches the clue",
    matchClue: "Match the clue",
    theClueIs: "The clue is",
    submitCard: "Submit Card",
    waitingForPlayers: "Waiting for other players...",
    youSubmitted: "You submitted your card",
    playersWaiting: "Waiting for: {names}",
    submitted: "Submitted",
    chooseCardTitle: "Choose Card",
    storytellerClue: "Storyteller Clue",
    storytellerClueWithName: "{name}'s Clue",
    waitingTitle: "Waiting",
  },

  // Voting Phase
  voting: {
    voteForCard: "Vote for the storyteller's card",
    whichIsStoryteller: "Which card belongs to {name}?",
    theClueWas: "The clue was",
    submitVote: "Submit Vote",
    cannotVoteOwnCard: "You cannot vote for your own card",
    storytellerWaiting: "Storyteller is waiting for votes...",
    youVoted: "You voted",
    waitingForVotes: "Waiting for votes...",
    vote: "Vote",
    voted: "Voted",
    allVotesIn: "All Votes In",
    watching: "Watching",
    spectating: "Spectating",
    storytellerClue: "Storyteller Clue",
    storytellerClueWithName: "{name}'s Clue",
  },

  // Reveal Phase
  reveal: {
    roundResults: "Round Results",
    storytellerCard: "Storyteller's Card",
    votesReceived: "Votes received",
    pointsEarned: "+{points} points",
    everyoneGuessed: "Everyone guessed correctly - no points!",
    nobodyGuessed: "Nobody guessed correctly - no points for storyteller!",
    someGuessed: "Some players guessed correctly!",
    correctGuess: "Correct guess",
    fooledPlayers: "Fooled players",
    continueButton: "Continue to Next Round",
    results: "Results",
    storytellerClue: "Storyteller Clue",
    storytellerClueWithName: "{name}'s Clue",
    continue: "Continue",
    continueIn: "Continue ({seconds}s)",
    autoAdvance: "Auto-advancing...",
    waitingWithTimer: "Next round in {seconds}s...",
    waiting: "Waiting...",
    waitingForAdmin: "Waiting for {name} to continue...",
    playerCard: "{name}'s card",
    votedBy: "Voted by",
    noVotes: "No votes!",
  },

  // Game End Phase
  gameEnd: {
    gameOver: "Game Over!",
    winner: "Winner",
    finalScores: "Final Scores",
    playAgain: "Play Again (Same Deck)",
    newDeck: "New Game (New Deck)",
    congratulations: "Congratulations!",
    resetGame: "Reset Game",
    wins: "{name} wins!",
    rank: "{rank}.",
    points: "{score} pts",
  },

  // Confirm Modals
  confirm: {
    kickPlayerTitle: "Kick Player",
    kickPlayerMessage: "Kick {name}? Their images will be transferred to you.",
    makeAdminTitle: "Make Admin",
    makeAdminMessage:
      "Make {name} the admin? You will become a regular player.",
    logoutWarningTitle: "Logout Warning",
    logoutWarningMessage:
      "You have {count} uploaded image(s) in the deck. If you logout, these images will be permanently removed from the game. Are you sure you want to logout?",
    deleteImageTitle: "Delete Image",
    deleteImageMessage:
      "Are you sure you want to delete this image from the deck?",
    forcePhaseTitle: "Force Continue",
    forcePhaseMessage:
      "Skip waiting and auto-submit for inactive players? This will randomly select cards/votes for players who haven't acted yet.",
  },

  // Admin Force Phase
  forcePhase: {
    button: "Force Continue",
    tooltip: "Skip waiting and auto-submit for inactive players",
  },

  // Error Messages
  errors: {
    nameTaken: "This name is already taken. Please choose a different name.",
    connectionLost: "Connection lost. Attempting to reconnect...",
    uploadFailed: "Failed to upload image. Please try again.",
    invalidMove: "Invalid move. Please try again.",
    notYourTurn: "It's not your turn yet.",
    gameInProgress: "Cannot join - game is already in progress.",
    notEnoughPlayers: "Need at least 3 players to start.",
    deckTooSmall: "Deck is too small. Add more images.",
    permissionDenied: "You don't have permission to do that.",
    unknownError: "An unexpected error occurred. Please try again.",
  },

  // Tooltips & Help
  tooltips: {
    startGame: "Start the game",
    needPlayers: "Need at least 3 players",
    needImages: "Need {count} more images ({current}/{required})",
    qrCode: "Show QR code for players to join",
    uploadImage: "Upload images to the game deck",
    profilePhoto: "Upload a profile photo",
    boardBackground: "Set a custom background image for the game board",
    winTarget: "Set the points needed to win (10-40)",
    allowUploads: "Allow non-admin players to upload images",
  },

  // Languages
  languages: {
    english: "English",
    hebrew: "עברית",
  },

  // Connection Status
  connection: {
    connecting: "Connecting...",
    reconnecting: "Reconnecting...",
    disconnected: "Connection lost",
    retry: "Tap to reconnect",
  },

  // Admin Settings (available during game)
  adminSettings: {
    title: "Admin Settings",
    playerManagement: "Player Management",
    gameSettings: "Game Settings",
    lobbyOnlyNote: "Some settings are only available in the lobby",
    cantKickStoryteller: "Can't kick during turn",
    wouldEndGame: "This would end the game!",
    winTargetWarningTitle: "⚠️ End Game Early?",
    winTargetWarningMessage:
      "Setting win target to {target} points will end the game! {winners} already has enough points to win. Continue?",
  },

  // Timer
  timer: {
    storytellerSleeping: "{name} is sleeping...",
    timeUp: "Time's up!",
    secondsRemaining: "{seconds} seconds remaining",
  },

  // Rules Modal
  rules: {
    title: "How to Play",
    // Tab labels
    tabs: {
      tutorial: "Tutorial",
      quickRef: "Quick Reference",
    },
    // Navigation
    nav: {
      next: "Next",
      back: "Back",
      skip: "Skip",
      getStarted: "Got it!",
    },
    // Tutorial slides (7 slides)
    tutorial: {
      slide1: {
        title: "Welcome to Dixit!",
        subtitle: "A game of creative storytelling",
        description: "Give clues that are not too easy, not too hard - just right!",
      },
      slide2: {
        title: "Storyteller's Turn",
        subtitle: "Pick a card, give a clue",
        description: "Choose one card from your hand and give a creative clue - a word, phrase, song, or story!",
      },
      slide3: {
        title: "Players Match",
        subtitle: "Find a matching card",
        description: "Pick a card from your hand that matches the clue. Try to trick others into voting for yours!",
      },
      slide4: {
        title: "Time to Vote",
        subtitle: "Find the storyteller's card",
        description: "All cards are shuffled and revealed. Vote for which card you think belongs to the storyteller.",
      },
      slide5: {
        title: "Perfect Clue!",
        subtitle: "Some players guessed correctly",
        description: "Storyteller and correct guessers each get +3 points. This is what you want!",
      },
      slide6: {
        title: "Watch Out!",
        subtitle: "Too easy or too hard = 0 points",
        description: "If everyone or no one guesses correctly, the storyteller gets nothing. Others get +2 each.",
      },
      slide7: {
        title: "Race to Victory!",
        subtitle: "First to the target wins",
        description: "Earn bonus points when others vote for your card. Be creative and have fun!",
      },
    },
    // Quick Reference (existing content)
    objective: {
      title: "Objective",
      description:
        "Be the best storyteller! Give creative clues that some (but not all) players guess correctly.",
    },
    phases: {
      title: "Game Phases",
      storytellerTurn: {
        title: "1. Storyteller's Turn",
        description:
          "The storyteller picks a card from their hand and gives a clue (a word, phrase, or story). The clue should be creative - not too obvious, not too obscure!",
      },
      playersChoice: {
        title: "2. Players Choose Cards",
        description:
          "All other players pick a card from their hand that matches the clue. Try to trick others into voting for your card!",
      },
      voting: {
        title: "3. Voting",
        description:
          "All cards are shuffled and revealed. Players vote for which card they think belongs to the storyteller. You cannot vote for your own card.",
      },
      reveal: {
        title: "4. Reveal & Scoring",
        description:
          "The storyteller's card is revealed and points are awarded. Then hands are refilled and the next player becomes storyteller.",
      },
    },
    scoring: {
      title: "Scoring",
      normalCase: {
        title: "Some Players Guessed Correctly",
        storyteller: "Storyteller: +3 points",
        correctGuessers: "Correct guessers: +3 points each",
        bonus: "Bonus: +1 point per vote on your card",
      },
      tooObvious: {
        title: "Everyone Guessed Correctly",
        description: "Storyteller gets 0 points (clue was too easy!)",
        others: "All others: +2 points each",
      },
      tooObscure: {
        title: "Nobody Guessed Correctly",
        description: "Storyteller gets 0 points (clue was too hard!)",
        others: "All others: +2 points each",
      },
      bonusNote:
        "Tip: You earn +1 point for each vote your card receives (except the storyteller's card).",
    },
    winning: {
      title: "How to Win",
      description:
        "The first player to reach the target score wins! If the deck runs out, the player with the most points wins.",
    },
    tips: {
      title: "Tips",
      storytellerTip:
        "As storyteller: Be creative and ambiguous. Use abstract concepts, not literal descriptions.",
      playerTip:
        "As player: Choose cards that might look like the storyteller's. Pay attention to who the storyteller is!",
    },
  },
};
