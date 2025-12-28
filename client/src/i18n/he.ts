/**
 * Hebrew Translations (עברית)
 *
 * Complete translation set for all UI strings in the application
 * RTL layout is handled by CSS - no special characters needed here
 */

import { TranslationKeys } from "./types";

export const he: TranslationKeys = {
  // Join Screen
  join: {
    title: "דיקסיט",
    tagline: "משחק של סיפור יצירתי",
    enterName: "הכנס את שמך",
    addPhoto: "הוסף תמונת פרופיל",
    joinButton: "הצטרף למשחק",
    spectator: "הצטרף כצופה",
    scanToJoin: "סרוק כדי להצטרף ",
    joining: "מצטרף...",
  },

  // Common UI elements
  common: {
    loading: "טוען...",
    players: "שחקנים",
    settings: "הגדרות",
    close: "סגור",
    cancel: "ביטול",
    confirm: "אישור",
    continue: "המשך",
    save: "שמור",
    edit: "ערוך",
    delete: "מחק",
    upload: "העלה",
    done: "סיים",
    back: "חזור",
    next: "הבא",
    logout: "התנתק",
    admin: "מנהל",
    you: "אתה",
    storyteller: "מספר הסיפור",
    score: "ניקוד",
    votes: "הצבעות",
  },

  // Lobby (Deck Building Phase)
  lobby: {
    title: "לובי המשחק",
    playersSection: "שחקנים",
    deckSection: "חפיסת המשחק",
    settingsSection: "הגדרות משחק",
    waitingForPlayers: "ממתין לשחקנים להצטרף...",
    needMoreImages: "דרושות עוד {count} תמונות להתחלה",
    readyToStart: "מוכן להתחיל!",
    playerCount: "{count} שחקנים",
    imageCount: "{current}/{required} תמונות",
    startGame: "התחל משחק",
    editName: "ערוך שם",
    kickPlayer: "הוצא שחקן",
    makeAdmin: "הפוך למנהל",
    uploadImages: "העלה תמונות",
    deleteImage: "מחק תמונה",
    allowPlayerUploads: "אפשר לשחקנים להעלות תמונות",
    boardBackground: "רקע לוח",
    boardPattern: "דפוס לוח",
    patternSnake: "נחש (זיגזג)",
    patternSpiral: "ספירלה (שבלול)",
    winTarget: "נקודות לניצחון",
    winTargetUnlimited: "ללא הגבלה",
    languageSettings: "שפה",
    gameLanguage: "שפת המשחק",
    myLanguage: "השפה שלי",
    usingRoomDefault: "משתמש בברירת המחדל של המשחק",
    usingPersonalOverride: "העדפה אישית",
    deckImages: "תמונות חפיסה",
    myImages: "התמונות שלי",
    deckCount: "חפיסה",
    needMore: "דרושות עוד {count}",
    logoutReturn: "התנתק וחזור למסך הצטרפות",
    clickToEditName: "לחץ לעריכת השם שלך",
    uploadCustomBackground: "העלה רקע מותאם אישית",
    uploadBackgroundDesc: "העלה תמונה כדי להתאים אישית את רקע לוח המשחק",
    useDefaultBackground: "השתמש ברקע ברירת המחדל",
    choosePatternDesc: "בחר כיצד מסלול הניקוד מסודר על הלוח",
    winTargetDesc: "השחקן הראשון שמגיע ל-{target} נקודות מנצח!",
    gameLanguageDesc: "הגדר שפת ברירת מחדל לכל השחקנים",
    personalLanguageDesc: "בחר את העדפת השפה האישית שלך",
    waitingForAdmin: "ממתין למנהל להתחיל את המשחק...",
    spectatingHelp: "צופה - אתה יכול להעלות תמונות כדי לעזור לבנות את החפיסה!",
    pointsLabel: "{points} נקודות",
    adminBoardBackgroundLabel: "רקע לוח (מנהל)",
    adminBoardPatternLabel: "דפוס לוח (מנהל)",
    adminWinTargetLabel: "יעד ניצחון (מנהל)",
    adminLanguageLabel: "שפת משחק (מנהל)",
    playerLanguageLabel: "שפה",
  },

  // Deck Uploader
  deckUploader: {
    deck: "חפיסה",
    myImages: "התמונות שלי",
    needMore: "דרושות עוד {count}",
    playersCanUpload: "שחקנים יכולים להעלות",
    onlyAdminUploads: "רק מנהל מעלה",
    uploadImages: "העלה תמונות",
    uploadFolder: "העלה תיקייה",
    uploading: "מעלה...",
    onlyHostCanUpload: "רק המארח יכול להעלות תמונות",
    processed: "{completed} מתוך {total} עובדו",
    failed: "{count} נכשלו",
    deleteAll: "מחק הכל ({count})",
    deleteAllImages: "מחק את כל התמונות",
    deleteAllConfirm: "האם אתה בטוח שברצונך למחוק את כל {count} התמונות?",
    noImagesYet: "עדיין לא הועלו תמונות",
    deleteImageTitle: "מחק תמונה",
    tooManyImages: "יותר מדי תמונות",
    tooManyImagesMessage:
      "אתה יכול להעלות רק {remaining} תמונות נוספות. {remaining} התמונות הראשונות יעובדו.",
    uploadedSuccess: "הועלו {count} תמונות",
    uploadedSuccessSingular: "הועלתה {count} תמונה",
    failedToProcess: "{count} תמונות נכשלו בעיבוד",
    failedToProcessSingular: "{count} תמונה נכשלה בעיבוד",
    uploadError: "אירעה שגיאה במהלך ההעלאה. אנא נסה שוב.",
    selectFiles: "בחר קובץ תמונה אחד או יותר",
    selectFolder: "בחר תיקייה שלמה של תמונות",
    uploadedImage: "תמונה שהועלתה",
    retrying: "מנסה שוב {name} ({attempt}/{max})...",
    uploadFailed: "ההעלאה נכשלה אחרי {attempts} ניסיונות",
  },

  // Game Phases
  phases: {
    deckBuilding: "בניית חפיסה",
    storytellerChoice: "בחירת מספר הסיפור",
    playersChoice: "בחירת שחקנים",
    voting: "הצבעה",
    reveal: "חשיפה",
    scoring: "חישוב ניקוד",
    gameEnd: "סוף המשחק",
  },

  // Game Status Messages
  status: {
    waitingForPlayers: "ממתין לשחקנים להצטרף...",
    needMoreImages: "דרושות עוד {count} תמונות להתחלה",
    readyToStart: "מוכן להתחיל!",
    storytellerChoosing: "{name} בוחר קלף...",
    waitingForStoryteller: "ממתין למספר הסיפור לתת רמז",
    playersChoosing: "שחקנים בוחרים את הקלפים שלהם...",
    matchTheClue: 'התאם לרמז: "{clue}"',
    cardsRevealed: "הקלפים נחשפו!",
    readyToVote: "התכוננו להצבעה",
    playersVoting: "שחקנים מצביעים...",
    whichCardIsStoryteller: "איזה קלף שייך למספר הסיפור?",
    roundComplete: "הסיבוב הושלם!",
    calculatingScores: "מחשב ניקוד...",
    gameOver: "המשחק הסתיים!",
    winnerIs: "{name} ניצח עם {score} נקודות!",
  },

  // Storyteller Phase
  storyteller: {
    chooseCard: "בחר קלף ותן רמז",
    enterClue: "הכנס את הרמז שלך",
    cluePlaceholder: "הכנס מילה, ביטוי או סיפור...",
    submitCard: "שלח קלף ורמז",
    waitingForYou: "ממתין לך...",
    youSubmitted: "שלחת את הקלף שלך",
    submitted: "נשלח",
    storyteller: "מספר הסיפור",
    yourClue: "הרמז שלך",
    waitingFor: "ממתין ל-{names}",
    enterYourClue: "הכנס את הרמז שלך...",
    submit: "שלח",
  },

  // Player Choice Phase
  playerChoice: {
    chooseCard: "בחר קלף שמתאים לרמז",
    matchClue: "התאם לרמז",
    theClueIs: "הרמז הוא",
    submitCard: "שלח קלף",
    waitingForPlayers: "ממתין לשחקנים אחרים...",
    youSubmitted: "שלחת את הקלף שלך",
    playersWaiting: "ממתין ל: {names}",
    submitted: "נשלח",
    chooseCardTitle: "בחר קלף",
    storytellerClue: "רמז מספר הסיפור",
    storytellerClueWithName: "הרמז של {name}",
    waitingTitle: "ממתין",
    waitingForStoryteller: "{name} בוחר רמז...",
  },

  // Voting Phase
  voting: {
    voteForCard: "הצבע עבור הקלף של מספר הסיפור",
    whichIsStoryteller: "איזה קלף שייך ל-{name}?",
    theClueWas: "הרמז היה",
    submitVote: "שלח הצבעה",
    cannotVoteOwnCard: "אתה לא יכול להצביע עבור הקלף שלך",
    storytellerWaiting: "מספר הסיפור ממתין להצבעות...",
    youVoted: "הצבעת",
    waitingForVotes: "ממתין להצבעות...",
    vote: "הצבע",
    voted: "הצבעת",
    allVotesIn: "כל ההצבעות נספרו",
    watching: "צופה",
    spectating: "צופה",
    storytellerClue: "רמז מספר הסיפור",
    storytellerClueWithName: "הרמז של {name}",
  },

  // Reveal Phase
  reveal: {
    roundResults: "תוצאות הסיבוב",
    storytellerCard: "קלף מספר הסיפור",
    votesReceived: "הצבעות שהתקבלו",
    pointsEarned: "+{points} נקודות",
    everyoneGuessed: "כולם ניחשו נכון - אין נקודות!",
    nobodyGuessed: "אף אחד לא ניחש נכון - אין נקודות למספר הסיפור!",
    someGuessed: "כמה שחקנים ניחשו נכון!",
    correctGuess: "ניחוש נכון",
    fooledPlayers: "שחקנים שהוטעו",
    continueButton: "המשך לסיבוב הבא",
    results: "תוצאות",
    storytellerClue: "רמז מספר הסיפור",
    storytellerClueWithName: "הרמז של {name}",
    continue: "המשך",
    waiting: "ממתין...",
  },

  // Game End Phase
  gameEnd: {
    gameOver: "המשחק הסתיים!",
    winner: "המנצח",
    finalScores: "ניקוד סופי",
    playAgain: "שחק שוב (אותה חפיסה)",
    newDeck: "משחק חדש (חפיסה חדשה)",
    congratulations: "מזל טוב!",
    resetGame: "אפס משחק",
    wins: "{name} מנצח!",
    rank: "{rank}.",
    points: "{score} נק׳",
  },

  // Confirm Modals
  confirm: {
    kickPlayerTitle: "הוצא שחקן",
    kickPlayerMessage: "להוציא את {name}? התמונות שלו יועברו אליך.",
    makeAdminTitle: "הפוך למנהל",
    makeAdminMessage: "להפוך את {name} למנהל? אתה תהפוך לשחקן רגיל.",
    logoutWarningTitle: "אזהרת התנתקות",
    logoutWarningMessage:
      "יש לך {count} תמונות שהועלו בחפיסה. אם תתנתק, התמונות האלה יוסרו לצמיתות מהמשחק. האם אתה בטוח שברצונך להתנתק?",
    deleteImageTitle: "מחק תמונה",
    deleteImageMessage: "האם אתה בטוח שברצונך למחוק תמונה זו מהחפיסה?",
  },

  // Error Messages
  errors: {
    nameTaken: "השם הזה תפוס. אנא בחר שם אחר.",
    connectionLost: "החיבור אבד. מנסה להתחבר מחדש...",
    uploadFailed: "העלאת התמונה נכשלה. אנא נסה שוב.",
    invalidMove: "מהלך לא חוקי. אנא נסה שוב.",
    notYourTurn: "זה עדיין לא תורך.",
    gameInProgress: "לא ניתן להצטרף - המשחק כבר בעיצומו.",
    notEnoughPlayers: "נדרשים לפחות 3 שחקנים להתחלה.",
    deckTooSmall: "החפיסה קטנה מדי. הוסף עוד תמונות.",
    permissionDenied: "אין לך הרשאה לעשות זאת.",
    unknownError: "אירעה שגיאה בלתי צפויה. אנא נסה שוב.",
  },

  // Tooltips & Help
  tooltips: {
    startGame: "התחל את המשחק",
    needPlayers: "נדרשים לפחות 3 שחקנים",
    needImages: "דרושות עוד {count} תמונות ({current}/{required})",
    qrCode: "הצג קוד QR לשחקנים להצטרף",
    uploadImage: "העלה תמונות לחפיסת המשחק",
    profilePhoto: "העלה תמונת פרופיל",
    boardBackground: "הגדר תמונת רקע מותאמת אישית ללוח המשחק",
    winTarget: "הגדר את מספר הנקודות הדרוש לניצחון (10-40)",
    allowUploads: "אפשר לשחקנים שאינם מנהלים להעלות תמונות",
  },

  // Languages
  languages: {
    english: "English",
    hebrew: "עברית",
  },

  // Connection Status
  connection: {
    connecting: "מתחבר...",
    reconnecting: "מתחבר מחדש...",
    disconnected: "החיבור נותק",
    retry: "לחץ להתחברות מחדש",
  },

  // Admin Settings (available during game)
  adminSettings: {
    title: "הגדרות מנהל",
    playerManagement: "ניהול שחקנים",
    gameSettings: "הגדרות משחק",
    lobbyOnlyNote: "חלק מההגדרות זמינות רק בלובי",
    cantKickStoryteller: "לא ניתן להוציא בזמן התור",
    wouldEndGame: "זה יסיים את המשחק!",
    winTargetWarningTitle: "⚠️ לסיים את המשחק מוקדם?",
    winTargetWarningMessage:
      "הגדרת יעד ניצחון ל-{target} נקודות תסיים את המשחק! ל-{winners} כבר יש מספיק נקודות לנצח. להמשיך?",
  },
};
