import { useState, useEffect } from "react";
import { RoomState, PlayerState } from "../hooks/useGameState";
import { UnifiedGamePage } from "./UnifiedGamePage";

// Mock data generator for different game phases
const generateMockRoomState = (
  phase: string, 
  deckMode: string, 
  deckLocked: boolean, 
  winTarget: number | null
): RoomState | null => {
  // Special case: NOT_JOINED - return minimal state for join screen with QR code
  if (phase === "NOT_JOINED") {
    return {
      phase: "WAITING_FOR_PLAYERS" as any,
      players: [],
      deckSize: 0,
      deckMode: "MIXED",
      deckLocked: false,
      deckImages: [],
      currentRound: 0,
      storytellerId: "",
      currentClue: "",
      revealedCards: [],
      votes: [],
      lastScoreDeltas: [],
      winTarget: 30,
      serverUrl: "http://localhost:3000",
    };
  }

  const basePlayers = [
    {
      id: "1",
      name: "Alice",
      score: 22,
      isAdmin: true,
      isConnected: true,
      handSize: 6,
    },
    {
      id: "2",
      name: "Bob",
      score: 18,
      isAdmin: false,
      isConnected: true,
      handSize: 6,
    },
    {
      id: "3",
      name: "Charlie",
      score: 22,
      isAdmin: false,
      isConnected: true,
      handSize: 6,
    },
    {
      id: "4",
      name: "Diana",
      score: 16,
      isAdmin: false,
      isConnected: true,
      handSize: 6,
    },
  ];

  const baseState: RoomState = {
    phase: phase as any,
    players: basePlayers,
    deckSize: 100,
    deckMode: deckMode,
    deckLocked: deckLocked,
    deckImages: [],
    currentRound: 5,
    storytellerId: "1",
    currentClue: phase === "STORYTELLER_CHOICE" ? "" : "A magical journey",
    revealedCards: [],
    votes: [],
    lastScoreDeltas: [],
    winTarget: winTarget,
    serverUrl: "http://localhost:3000",
  };

  // Phase-specific modifications
  switch (phase) {
    case "WAITING_FOR_PLAYERS":
      return {
        ...baseState,
        phase: "WAITING_FOR_PLAYERS",
        players: basePlayers.slice(0, 2),
        currentRound: 0,
        currentClue: "",
        deckSize: 45, // Show some deck progress
      };

    case "STORYTELLER_CHOICE":
      return {
        ...baseState,
        phase: "STORYTELLER_CHOICE",
        currentClue: "",
      };

    case "PLAYERS_CHOICE":
      return {
        ...baseState,
        phase: "PLAYERS_CHOICE",
      };

    case "REVEAL":
      return {
        ...baseState,
        phase: "REVEAL",
        revealedCards: [
          {
            cardId: "c1",
            imageData: "/default-images/img-010.jpg",
            position: 0,
          },
          {
            cardId: "c2",
            imageData: "/default-images/img-011.jpg",
            position: 1,
          },
          {
            cardId: "c3",
            imageData: "/default-images/img-012.jpg",
            position: 2,
          },
          {
            cardId: "c4",
            imageData: "/default-images/img-013.jpg",
            position: 3,
          },
        ],
      };

    case "VOTING":
      return {
        ...baseState,
        phase: "VOTING",
        revealedCards: [
          {
            cardId: "c1",
            imageData: "/default-images/img-010.jpg",
            position: 0,
          },
          {
            cardId: "c2",
            imageData: "/default-images/img-011.jpg",
            position: 1,
          },
          {
            cardId: "c3",
            imageData: "/default-images/img-012.jpg",
            position: 2,
          },
          {
            cardId: "c4",
            imageData: "/default-images/img-013.jpg",
            position: 3,
          },
        ],
      };

    case "SCORING":
      return {
        ...baseState,
        phase: "SCORING",
        revealedCards: [
          {
            cardId: "c1",
            imageData: "/default-images/img-010.jpg",
            position: 0,
          },
          {
            cardId: "c2",
            imageData: "/default-images/img-011.jpg",
            position: 1,
          },
          {
            cardId: "c3",
            imageData: "/default-images/img-012.jpg",
            position: 2,
          },
          {
            cardId: "c4",
            imageData: "/default-images/img-013.jpg",
            position: 3,
          },
        ],
        votes: [
          { voterId: "2", cardId: "c1" },
          { voterId: "3", cardId: "c2" },
          { voterId: "4", cardId: "c1" },
        ],
        lastScoreDeltas: [
          { playerId: "1", delta: 3 },
          { playerId: "2", delta: 1 },
          { playerId: "3", delta: 1 },
          { playerId: "4", delta: 1 },
        ],
      };

    case "GAME_END":
      return {
        ...baseState,
        phase: "GAME_END",
        players: [
          {
            id: "1",
            name: "Alice",
            score: 32,
            isAdmin: true,
            isConnected: true,
            handSize: 0,
          },
          {
            id: "2",
            name: "Bob",
            score: 28,
            isAdmin: false,
            isConnected: true,
            handSize: 0,
          },
          {
            id: "3",
            name: "Charlie",
            score: 25,
            isAdmin: false,
            isConnected: true,
            handSize: 0,
          },
          {
            id: "4",
            name: "Diana",
            score: 22,
            isAdmin: false,
            isConnected: true,
            handSize: 0,
          },
        ],
        currentClue: "",
      };

    default:
      return baseState;
  }
};

const generateMockPlayerState = (
  phase: string, 
  playerId: string, 
  demoSubmittedCardId: string | null,
  demoVotedCardId: string | null
): PlayerState => {
  const baseHand = [
    {
      id: "h1",
      imageData: "/default-images/img-001.jpg",
      uploadedBy: playerId,
    },
    {
      id: "h2",
      imageData: "/default-images/img-002.jpg",
      uploadedBy: playerId,
    },
    {
      id: "h3",
      imageData: "/default-images/img-003.jpg",
      uploadedBy: playerId,
    },
    {
      id: "h4",
      imageData: "/default-images/img-004.jpg",
      uploadedBy: playerId,
    },
    {
      id: "h5",
      imageData: "/default-images/img-005.jpg",
      uploadedBy: playerId,
    },
    {
      id: "h6",
      imageData: "/default-images/img-006.jpg",
      uploadedBy: playerId,
    },
  ];

  // Player 1 (Alice, admin, storyteller) behavior
  // Player 2 (Bob, regular player) behavior
  const isStoryteller = playerId === "1";
  
  // Determine mySubmittedCardId
  let mySubmittedCardId = demoSubmittedCardId;
  if (!mySubmittedCardId) {
    // Fallback mocks only for phases that come AFTER both storyteller and player submissions
    if (phase === "VOTING" || phase === "SCORING") {
      mySubmittedCardId = isStoryteller ? "h1" : "h2";
    } else if (phase === "PLAYERS_CHOICE" && isStoryteller) {
      // In PLAYERS_CHOICE, storyteller has already submitted (from previous phase)
      mySubmittedCardId = "h1";
    }
    // For STORYTELLER_CHOICE and PLAYERS_CHOICE (non-storyteller), start with no submission
  }
  
  return {
    playerId: playerId,
    hand: baseHand,
    mySubmittedCardId: mySubmittedCardId,
    // Use demo voted card ID if available, otherwise fallback to mock
    myVote: demoVotedCardId || (phase === "VOTING" && !isStoryteller ? "c1" : null),
  };
};

const allPhases = [
  "NOT_JOINED", // Special phase for demo to show join screen
  "WAITING_FOR_PLAYERS", // Merged: waiting + deck building
  "STORYTELLER_CHOICE",
  "PLAYERS_CHOICE",
  "REVEAL",
  "VOTING",
  "SCORING",
  "GAME_END",
];

export function DemoPage() {
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);
  const [viewMode, setViewMode] = useState<"player" | "admin" | "spectator">("player");
  const [forcePlayerView, setForcePlayerView] = useState(false); // Toggle storyteller/player in demo
  
  // Demo state that persists across view changes
  const [demoDeckMode, setDemoDeckMode] = useState<string>("MIXED");
  const [demoDeckLocked, setDemoDeckLocked] = useState(false);
  const [demoWinTarget, setDemoWinTarget] = useState<number | null>(30);
  
  // Demo submission tracking
  const [demoSubmittedCardId, setDemoSubmittedCardId] = useState<string | null>(null);
  const [demoClue, setDemoClue] = useState<string>("");
  const [demoVotedCardId, setDemoVotedCardId] = useState<string | null>(null);

  const currentPhase = allPhases[currentPhaseIndex];
  const mockRoomState = generateMockRoomState(currentPhase, demoDeckMode, demoDeckLocked, demoWinTarget);
  
  // Update mockRoomState with demo clue if submitted
  if (mockRoomState && demoClue) {
    mockRoomState.currentClue = demoClue;
  }
  
  // Different player IDs for different modes
  // Admin = Alice (player 1, storyteller), Player = Bob (player 2)
  // In phases where we can toggle, use forcePlayerView to override
  const shouldShowAsPlayer = 
    forcePlayerView && 
    (currentPhase === "STORYTELLER_CHOICE" || currentPhase === "PLAYERS_CHOICE");
  
  const currentPlayerId = viewMode === "spectator" 
    ? "spectator" 
    : shouldShowAsPlayer 
      ? "2" // Force player view
      : viewMode === "admin" 
        ? "1" 
        : "2";
  
  // Generate appropriate player state based on view mode
  const mockPlayerState = generateMockPlayerState(currentPhase, currentPlayerId, demoSubmittedCardId, demoVotedCardId);
  
  // Reset all demo submissions when phase changes (for easy testing)
  useEffect(() => {
    setDemoSubmittedCardId(null);
    setDemoClue("");
    setDemoVotedCardId(null);
  }, [currentPhaseIndex]);

  // Mock action handlers (update demo state to simulate real behavior)
  const mockActions = {
    storytellerSubmit: (cardId: string, clue: string) => {
      console.log("Demo: storyteller submit", cardId, clue);
      setDemoSubmittedCardId(cardId);
      setDemoClue(clue);
      // Update room state with the clue
      if (mockRoomState) {
        mockRoomState.currentClue = clue;
      }
    },
    playerSubmitCard: (cardId: string) => {
      console.log("Demo: player submit", cardId);
      setDemoSubmittedCardId(cardId);
    },
    playerVote: (cardId: string) => {
      console.log("Demo: player vote", cardId);
      setDemoVotedCardId(cardId);
    },
    advanceRound: () => console.log("Demo: advance round"),
    resetGame: () => console.log("Demo: reset game"),
    newDeck: () => console.log("Demo: new deck"),
    setDeckMode: (mode: string) => {
      console.log("Demo: set deck mode to", mode);
      setDemoDeckMode(mode);
    },
    lockDeck: () => {
      console.log("Demo: lock deck");
      setDemoDeckLocked(true);
    },
    unlockDeck: () => {
      console.log("Demo: unlock deck");
      setDemoDeckLocked(false);
    },
    setWinTarget: (target: number | null) => {
      console.log("Demo: set win target to", target);
      setDemoWinTarget(target);
    },
    uploadImage: (imageData: string) => console.log("Demo: upload image", imageData.slice(0, 50)),
    deleteImage: (imageId: string) => console.log("Demo: delete image", imageId),
  };

  const nextPhase = () => {
    setCurrentPhaseIndex((prev) => (prev + 1) % allPhases.length);
  };

  const prevPhase = () => {
    setCurrentPhaseIndex(
      (prev) => (prev - 1 + allPhases.length) % allPhases.length
    );
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        prevPhase();
      } else if (e.key === "ArrowRight") {
        nextPhase();
      } else if (e.key === "v" || e.key === "V") {
        // Cycle through modes: player -> admin -> spectator -> player
        setViewMode((prev) => {
          if (prev === "player") return "admin";
          if (prev === "admin") return "spectator";
          return "player";
        });
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, []);

  return (
    <div className="demo-page">
      {/* Floating Navigation Bar */}
      <div className="demo-floating-nav">
        <button
          onClick={prevPhase}
          className="nav-btn"
          title="Previous (← Arrow)"
        >
          ◀
        </button>
        <div className="nav-phase-info">
          <span className="nav-phase-name">
            {currentPhase === "NOT_JOINED"
              ? "Join Screen"
              : currentPhase.replace(/_/g, " ")}
          </span>
          <span className="nav-phase-count">
            {currentPhaseIndex + 1} / {allPhases.length}
          </span>
        </div>
        <button
          onClick={nextPhase}
          className="nav-btn"
          title="Next (→ Arrow)"
        >
          ▶
        </button>
        <div className="nav-divider"></div>
        <button
          onClick={() => setViewMode("player")}
          className={`nav-btn ${viewMode === "player" ? "active" : ""}`}
          title="Player Mode (press V to cycle)"
        >
          🎮
        </button>
        <button
          onClick={() => setViewMode("admin")}
          className={`nav-btn ${viewMode === "admin" ? "active" : ""}`}
          title="Admin Mode (press V to cycle)"
        >
          👑
        </button>
        <button
          onClick={() => setViewMode("spectator")}
          className={`nav-btn ${viewMode === "spectator" ? "active" : ""}`}
          title="Spectator Mode (press V to cycle)"
        >
          📺
        </button>
        {(currentPhase === "STORYTELLER_CHOICE" || currentPhase === "PLAYERS_CHOICE") && 
         viewMode === "admin" && (
          <>
            <div className="nav-divider"></div>
            <button
              onClick={() => setForcePlayerView(!forcePlayerView)}
              className={`nav-btn ${forcePlayerView ? "active" : ""}`}
              title="Toggle between Storyteller/Player view"
            >
              {forcePlayerView ? "👤 Player" : "🎭 Storyteller"}
            </button>
          </>
        )}
      </div>

      {/* Game Screen */}
      <div className="demo-screen">
        <UnifiedGamePage
          roomState={mockRoomState}
          playerState={mockPlayerState}
          playerId={currentPlayerId}
          clientId="demo-client-123"
          socket={null}
          onJoin={() => console.log("Demo: join")}
          onUploadImage={mockActions.uploadImage}
          onDeleteImage={mockActions.deleteImage}
          onSetDeckMode={mockActions.setDeckMode}
          onLockDeck={mockActions.lockDeck}
          onUnlockDeck={mockActions.unlockDeck}
          onStartGame={() => console.log("Demo: start game")}
          onChangeName={() => console.log("Demo: change name")}
          onKickPlayer={() => console.log("Demo: kick player")}
          onPromotePlayer={() => console.log("Demo: promote player")}
          onStorytellerSubmit={mockActions.storytellerSubmit}
          onPlayerSubmitCard={mockActions.playerSubmitCard}
          onPlayerVote={mockActions.playerVote}
          onAdvanceRound={mockActions.advanceRound}
          onResetGame={mockActions.resetGame}
          onNewDeck={mockActions.newDeck}
          onSetWinTarget={mockActions.setWinTarget}
        />
      </div>
    </div>
  );
}
