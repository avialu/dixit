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
    scanToJoin: "סרוק כדי להצטרף",
    joining: "מצטרף...",
  },

  // Common UI elements
  common: {
    loading: "טוען...",
    players: "שחקנים",
    images: "תמונות",
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
    waitingForPlayers: "ממתין לשחקנים ...",
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
    waitingForAdminName: "ממתין ל-{name} להתחיל את המשחק...",
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
    maxImages: "30 מומלץ",
    minPlayers: "מינימום 3",
    allImages: "כל התמונות",
    needMore: "דרושות עוד {count}",
    needMorePlayers: "דרושים עוד {count} שחקנים",
    needOneMorePlayer: "דרוש עוד שחקן אחד",
    prefer: "מועדף {count}",
    playersCanUpload: "שחקנים יכולים להעלות",
    onlyAdminUploads: "רק מנהל מעלה",
    uploadImages: "העלה תמונות",
    uploadFolder: "העלה תיקייה",
    uploading: "מעלה...",
    processingImages: "מעבד תמונות...",
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
    storytellerThinking: "{name} חושב...",
    waitingForStoryteller: "ממתין ל-{name} לתת רמז",
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
    continueIn: "המשך ({seconds}ש)",
    autoAdvance: "ממשיך אוטומטית...",
    waitingWithTimer: "סיבוב הבא בעוד {seconds}ש...",
    waiting: "ממתין...",
    waitingForAdmin: "ממתין ל-{name} להמשיך...",
    playerCard: "הקלף של {name}",
    votedBy: "הצביעו",
    noVotes: "אין הצבעות!",
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
    forcePhaseTitle: "המשך בכפייה",
    forcePhaseMessage:
      "לדלג על ההמתנה ולהגיש אוטומטית עבור שחקנים לא פעילים? פעולה זו תבחר באופן אקראי קלפים/הצבעות עבור שחקנים שטרם פעלו.",
  },

  // Admin Force Phase
  forcePhase: {
    button: "המשך בכפייה",
    tooltip: "דלג על ההמתנה והגש אוטומטית עבור שחקנים לא פעילים",
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
    soundSettings: "התראות תור",
    soundOn: "צליל פעיל",
    soundOff: "מושתק",
    soundDesc: "נגן צליל ורטט כשתור של שחקן",
  },

  // Timer
  timer: {
    storytellerSleeping: "{name} ישן/ה...",
    timeUp: "נגמר הזמן!",
    secondsRemaining: "נותרו {seconds} שניות",
  },

  // QR Code
  qr: {
    clickToCopy: "לחץ להעתקת הקישור",
    copied: "הועתק!",
  },

  // Profile
  profile: {
    tapToChange: "לחץ לשינוי תמונה",
  },

  // Settings Modal
  settings: {
    swipeToSeeMore: "החלק לראות עוד תמונות",
  },

  // Admin Password System
  admin: {
    setPasswordTitle: "הגדר סיסמת מנהל",
    setPasswordDescription: "הגדר סיסמה כדי להתחיל את המשחק. שתף אותה עם שחקנים מהימנים כדי שיוכלו לתבוע את הניהול אם תתנתק.",
    password: "סיסמה",
    confirmPassword: "אשר סיסמה",
    setPassword: "הגדר סיסמה",
    passwordTooShort: "הסיסמה חייבת להכיל לפחות 4 תווים",
    passwordTooLong: "הסיסמה חייבת להכיל לכל היותר 20 תווים",
    passwordsDoNotMatch: "הסיסמאות אינן תואמות",
    passwordSet: "הסיסמה הוגדרה!",
    claimAdmin: "תבע הרשאות מנהל",
    claimAdminTitle: "תביעת תפקיד מנהל",
    claimAdminDescription: "הזן את סיסמת המנהל כדי להפוך למנהל המשחק.",
    enterPassword: "הזן סיסמת מנהל",
    claim: "תבע",
    wrongPassword: "סיסמה שגויה",
    noPassword: "לא הוגדרה סיסמת מנהל",
    passwordRequired: "אנא הגדר סיסמה כדי להתחיל את המשחק",
  },

  // Rules Modal
  rules: {
    title: "איך לשחק",
    // Tab labels
    tabs: {
      tutorial: "הדרכה",
      quickRef: "עזר מהיר",
    },
    // Navigation
    nav: {
      next: "הבא",
      back: "חזרה",
      skip: "דלג",
      getStarted: "הבנתי!",
    },
    // Tutorial slides (7 slides)
    tutorial: {
      slide1: {
        title: "ברוכים הבאים לדיקסיט!",
        subtitle: "משחק של סיפור יצירתי",
        description: "תנו רמזים שהם לא קלים מדי, לא קשים מדי - בדיוק נכון!",
      },
      slide2: {
        title: "תור מספר הסיפור",
        subtitle: "בחרו קלף, תנו רמז",
        description:
          "בחרו קלף אחד מהיד שלכם ותנו רמז יצירתי - מילה, ביטוי, שיר או סיפור!",
      },
      slide3: {
        title: "השחקנים מתאימים",
        subtitle: "מצאו קלף מתאים",
        description:
          "בחרו קלף מהיד שלכם שמתאים לרמז. נסו להטעות אחרים להצביע לקלף שלכם!",
      },
      slide4: {
        title: "זמן להצביע",
        subtitle: "מצאו את הקלף של מספר הסיפור",
        description:
          "כל הקלפים מעורבבים ונחשפים. הצביעו לקלף שלדעתכם שייך למספר הסיפור.",
      },
      slide5: {
        title: "רמז מושלם!",
        subtitle: "חלק מהשחקנים ניחשו נכון",
        description:
          "מספר הסיפור והמנחשים הנכונים מקבלים +3 נקודות. זה מה שאתם רוצים!",
      },
      slide6: {
        title: "שימו לב!",
        subtitle: "קל מדי או קשה מדי = 0 נקודות",
        description:
          "אם כולם או אף אחד לא מנחשים נכון, מספר הסיפור לא מקבל כלום. האחרים מקבלים +2.",
      },
      slide7: {
        title: "מרוץ לניצחון!",
        subtitle: "הראשון ליעד מנצח",
        description:
          "הרוויחו נקודות בונוס כשאחרים מצביעים לקלף שלכם. היו יצירתיים ותהנו!",
      },
    },
    // Quick Reference (existing content)
    objective: {
      title: "המטרה",
      description:
        "תהיו מספרי הסיפור הטובים ביותר! תנו רמזים יצירתיים שרק חלק מהשחקנים (לא כולם) ינחשו נכון.",
    },
    phases: {
      title: "שלבי המשחק",
      storytellerTurn: {
        title: "1. תור מספר הסיפור",
        description:
          "מספר הסיפור בוחר קלף מהיד שלו ונותן רמז (מילה, ביטוי או סיפור). הרמז צריך להיות יצירתי - לא ברור מדי, לא מעורפל מדי!",
      },
      playersChoice: {
        title: "2. השחקנים בוחרים קלפים",
        description:
          "כל השחקנים האחרים בוחרים קלף מהיד שלהם שמתאים לרמז. נסו להטעות אחרים להצביע לקלף שלכם!",
      },
      voting: {
        title: "3. הצבעה",
        description:
          "כל הקלפים מעורבבים ונחשפים. השחקנים מצביעים לקלף שלדעתם שייך למספר הסיפור. אי אפשר להצביע לקלף של עצמך.",
      },
      reveal: {
        title: "4. חשיפה וניקוד",
        description:
          "הקלף של מספר הסיפור נחשף ונקודות מחולקות. אחר כך היד מתמלאת והשחקן הבא הופך למספר הסיפור.",
      },
    },
    scoring: {
      title: "ניקוד",
      normalCase: {
        title: "חלק מהשחקנים ניחשו נכון",
        storyteller: "מספר הסיפור: +3 נקודות",
        correctGuessers: "מנחשים נכונים: +3 נקודות כל אחד",
        bonus: "בונוס: +1 נקודה לכל הצבעה על הקלף שלך",
      },
      tooObvious: {
        title: "כולם ניחשו נכון",
        description: "מספר הסיפור מקבל 0 נקודות (הרמז היה קל מדי!)",
        others: "כל השאר: +2 נקודות כל אחד",
      },
      tooObscure: {
        title: "אף אחד לא ניחש נכון",
        description: "מספר הסיפור מקבל 0 נקודות (הרמז היה קשה מדי!)",
        others: "כל השאר: +2 נקודות כל אחד",
      },
      bonusNote:
        "טיפ: אתם מרוויחים +1 נקודה לכל הצבעה שהקלף שלכם מקבל (חוץ מהקלף של מספר הסיפור).",
    },
    winning: {
      title: "איך לנצח",
      description:
        "השחקן הראשון שמגיע לניקוד היעד מנצח! אם החפיסה נגמרת, השחקן עם הכי הרבה נקודות מנצח.",
    },
    tips: {
      title: "טיפים",
      storytellerTip:
        "כמספר הסיפור: היו יצירתיים ומעורפלים. השתמשו במושגים מופשטים, לא בתיאורים מילוליים.",
      playerTip:
        "כשחקן: בחרו קלפים שעשויים להיראות כמו הקלף של מספר הסיפור. שימו לב מי מספר הסיפור!",
    },
  },
};
