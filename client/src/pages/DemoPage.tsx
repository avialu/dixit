import { useState, useEffect } from "react";
import { RoomState, PlayerState } from "../hooks/useGameState";
import { UnifiedGamePage } from "./UnifiedGamePage";

// Mock data generator for different game phases
const generateMockRoomState = (
  phase: string,
  customPlayerScores?: { [playerId: string]: number },
  customScoreDeltas?: { playerId: string; delta: number }[]
): RoomState | null => {
  // Get the current server URL from window location
  const port = window.location.port || "3000";
  const currentUrl = `${window.location.protocol}//${window.location.hostname}:${port}`;

  // Special case: NOT_JOINED - return minimal state for join screen with QR code
  if (phase === "NOT_JOINED") {
    return {
      phase: "DECK_BUILDING" as any,
      players: [],
      allowPlayerUploads: true,
      deckSize: 0,
      deckLocked: false,
      deckImages: [],
      currentRound: 0,
      storytellerId: "",
      currentClue: "",
      revealedCards: [],
      votes: [],
      lastScoreDeltas: [],
      winTarget: 30,
      serverUrl: currentUrl,
    };
  }

  const basePlayers = [
    {
      id: "1",
      name: "Alice",
      score: customPlayerScores?.["1"] ?? 0,
      isAdmin: true,
      isConnected: true,
      handSize: 6,
    },
    {
      id: "2",
      name: "Bob",
      score: customPlayerScores?.["2"] ?? 0,
      isAdmin: false,
      isConnected: true,
      handSize: 6,
    },
    {
      id: "3",
      name: "Charlie",
      score: customPlayerScores?.["3"] ?? 0,
      isAdmin: false,
      isConnected: true,
      handSize: 6,
    },
    {
      id: "4",
      name: "Diana",
      score: customPlayerScores?.["4"] ?? 0,
      isAdmin: false,
      isConnected: true,
      handSize: 6,
    },
  ];

  const baseState: RoomState = {
    phase: phase as any,
    players: basePlayers,
    allowPlayerUploads: true,
    deckSize: 100,
    deckLocked: false,
    deckImages: [],
    currentRound: 5,
    storytellerId: "1",
    currentClue: phase === "STORYTELLER_CHOICE" ? "" : "A magical journey",
    revealedCards: [],
    votes: [],
    lastScoreDeltas: [],
    winTarget: 30,
    serverUrl: currentUrl,
  };

  // Phase-specific modifications
  switch (phase) {
    case "DECK_BUILDING":
      return {
        ...baseState,
        phase: "DECK_BUILDING",
        players: basePlayers.slice(0, 2),
        currentRound: 0,
        currentClue: "",
        deckSize: 45,
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

    case "VOTING":
      return {
        ...baseState,
        phase: "VOTING",
        revealedCards: [
          {
            cardId: "c1",
            imageData: "https://picsum.photos/seed/card1/400/600",
            position: 0,
            playerId: "1", // Alice (storyteller)
          } as any,
          {
            cardId: "c2",
            imageData: "https://picsum.photos/seed/card2/400/600",
            position: 1,
            playerId: "2", // Bob
          } as any,
          {
            cardId: "c3",
            imageData: "https://picsum.photos/seed/card3/400/600",
            position: 2,
            playerId: "3", // Charlie
          } as any,
          {
            cardId: "c4",
            imageData: "https://picsum.photos/seed/card4/400/600",
            position: 3,
            playerId: "4", // Diana
          } as any,
        ],
        votes: [], // Start with no votes, will be filled as demo progresses
      };

    case "REVEAL":
      return {
        ...baseState,
        phase: "REVEAL",
        revealedCards: [
          {
            cardId: "c1",
            imageData: "https://picsum.photos/seed/card1/400/600",
            position: 0,
            playerId: "1", // Alice (storyteller)
          } as any,
          {
            cardId: "c2",
            imageData: "https://picsum.photos/seed/card2/400/600",
            position: 1,
            playerId: "2", // Bob
          } as any,
          {
            cardId: "c3",
            imageData: "https://picsum.photos/seed/card3/400/600",
            position: 2,
            playerId: "3", // Charlie
          } as any,
          {
            cardId: "c4",
            imageData: "https://picsum.photos/seed/card4/400/600",
            position: 3,
            playerId: "4", // Diana
          } as any,
        ],
        votes: [
          { voterId: "2", cardId: "c4" }, // Bob voted for Diana's card
          { voterId: "3", cardId: "c4" }, // Charlie voted for Diana's card
          { voterId: "4", cardId: "c2" }, // Diana voted for Bob's card
          // This shows scoring: Alice (storyteller) +0, Bob +1, Charlie +0, Diana +2
        ],
      };

    case "SCORING":
      const defaultDeltas = [
        { playerId: "1", delta: 0 },
        { playerId: "2", delta: 3 },
        { playerId: "3", delta: 0 },
        { playerId: "4", delta: 5 },
      ];
      const deltas = customScoreDeltas || defaultDeltas;

      return {
        ...baseState,
        phase: "SCORING",
        players: basePlayers, // Use basePlayers which already has custom scores
        revealedCards: [
          {
            cardId: "c1",
            imageData: "https://picsum.photos/seed/card1/400/600",
            position: 0,
            playerId: "1", // Alice (storyteller)
          } as any,
          {
            cardId: "c2",
            imageData: "https://picsum.photos/seed/card2/400/600",
            position: 1,
            playerId: "2", // Bob
          } as any,
          {
            cardId: "c3",
            imageData: "https://picsum.photos/seed/card3/400/600",
            position: 2,
            playerId: "3", // Charlie
          } as any,
          {
            cardId: "c4",
            imageData: "https://picsum.photos/seed/card4/400/600",
            position: 3,
            playerId: "4", // Diana
          } as any,
        ],
        votes: [
          { voterId: "2", cardId: "c4" }, // Bob voted for Diana's card
          { voterId: "3", cardId: "c4" }, // Charlie voted for Diana's card
          { voterId: "4", cardId: "c2" }, // Diana voted for Bob's card
        ],
        lastScoreDeltas: deltas,
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
  playerId: string
): PlayerState => {
  const baseHand = [
    {
      id: "h1",
      imageData: "https://picsum.photos/seed/dixit1/400/600",
      uploadedBy: playerId,
    },
    {
      id: "h2",
      imageData: "https://picsum.photos/seed/dixit2/400/600",
      uploadedBy: playerId,
    },
    {
      id: "h3",
      imageData: "https://picsum.photos/seed/dixit3/400/600",
      uploadedBy: playerId,
    },
    {
      id: "h4",
      imageData: "https://picsum.photos/seed/dixit4/400/600",
      uploadedBy: playerId,
    },
    {
      id: "h5",
      imageData: "https://picsum.photos/seed/dixit5/400/600",
      uploadedBy: playerId,
    },
    {
      id: "h6",
      imageData: "https://picsum.photos/seed/dixit6/400/600",
      uploadedBy: playerId,
    },
  ];

  // Player 1 (Alice, admin, storyteller) behavior
  // Player 2 (Bob, regular player) behavior
  const isStoryteller = playerId === "1";

  return {
    playerId: playerId,
    hand: baseHand,
    // Only non-storytellers submit cards during PLAYERS_CHOICE
    mySubmittedCardId:
      (phase === "PLAYERS_CHOICE" || phase === "VOTING") && !isStoryteller
        ? "h2"
        : null,
    // Only non-storytellers vote during VOTING
    myVote: phase === "VOTING" && !isStoryteller ? "c1" : null,
  };
};

const allPhases = [
  "NOT_JOINED", // Special phase for demo to show join screen
  "DECK_BUILDING",
  "STORYTELLER_CHOICE",
  "PLAYERS_CHOICE",
  "VOTING", // Vote on cards (hidden who drew)
  "REVEAL", // Show who drew and who voted
  "SCORING",
  "GAME_END",
];

export function DemoPage() {
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);
  const [viewMode, setViewMode] = useState<"player" | "admin" | "spectator">(
    "player"
  );
  const [forcePlayerView, setForcePlayerView] = useState(false); // Toggle storyteller/player in demo
  const [demoVotes, setDemoVotes] = useState<
    { voterId: string; cardId: string }[]
  >([]);
  const [demoVotedCardId, setDemoVotedCardId] = useState<string | null>(null);
  const [detectedServerUrl, setDetectedServerUrl] = useState<string | null>(
    null
  );

  // Interactive demo state
  const [allowPlayerUploads, setAllowPlayerUploads] = useState(true);
  const [winTarget, setWinTarget] = useState<number | null>(30);
  const [deckSize, setDeckSize] = useState(45);
  const [deckLocked, setDeckLocked] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<
    Array<{ id: string; uploadedBy: string }>
  >([]);

  // Animation testing states
  const [customPlayerScores, setCustomPlayerScores] = useState<
    { [playerId: string]: number } | undefined
  >(undefined);
  const [customScoreDeltas, setCustomScoreDeltas] = useState<
    { playerId: string; delta: number }[] | undefined
  >(undefined);
  const [animationRound, setAnimationRound] = useState(0);

  // Fetch server URL on mount
  useEffect(() => {
    fetch("/api/server-info")
      .then((res) => res.json())
      .then((data) => setDetectedServerUrl(data.serverUrl))
      .catch((err) => {
        console.warn("Could not fetch server URL:", err);
        // Fallback to window location
        const port = window.location.port || "3000";
        setDetectedServerUrl(
          `${window.location.protocol}//${window.location.hostname}:${port}`
        );
      });
  }, []);

  const currentPhase = allPhases[currentPhaseIndex];
  const mockRoomState = generateMockRoomState(
    currentPhase,
    customPlayerScores,
    customScoreDeltas
  );

  // Update with interactive demo state
  if (mockRoomState) {
    mockRoomState.allowPlayerUploads = allowPlayerUploads;
    mockRoomState.winTarget = winTarget;
    mockRoomState.deckSize = deckSize;
    mockRoomState.deckLocked = deckLocked;
    mockRoomState.deckImages = uploadedImages;

    // Update serverUrl with detected one
    if (detectedServerUrl) {
      mockRoomState.serverUrl = detectedServerUrl;
    }
  }

  // Override current round for animation testing in SCORING phase
  if (
    mockRoomState &&
    currentPhase === "SCORING" &&
    (customPlayerScores || customScoreDeltas)
  ) {
    mockRoomState.currentRound = 5 + animationRound;
  }

  // Update mockRoomState with demo votes if in VOTING phase
  // For REVEAL, use demo votes if they exist, otherwise keep the default votes from the mock
  if (mockRoomState && currentPhase === "VOTING") {
    mockRoomState.votes = demoVotes;
  } else if (
    mockRoomState &&
    currentPhase === "REVEAL" &&
    demoVotes.length > 0
  ) {
    mockRoomState.votes = demoVotes;
  }

  // Reset votes when leaving REVEAL phase or going backwards to before VOTING
  useEffect(() => {
    const isBeforeVoting = [
      "NOT_JOINED",
      "DECK_BUILDING",
      "STORYTELLER_CHOICE",
      "PLAYERS_CHOICE",
    ].includes(currentPhase);
    const isAfterReveal = ["SCORING", "GAME_END"].includes(currentPhase);

    if (isBeforeVoting || isAfterReveal) {
      setDemoVotes([]);
      setDemoVotedCardId(null);
    }

    // Reset animation test data when leaving SCORING phase
    if (currentPhase !== "SCORING") {
      setCustomPlayerScores(undefined);
      setCustomScoreDeltas(undefined);
      setAnimationRound(0);
    }
  }, [currentPhaseIndex, currentPhase]);

  // Different player IDs for different modes
  // Admin = Alice (player 1, storyteller), Player = Bob (player 2)
  // In phases where we can toggle, use forcePlayerView to override
  const shouldShowAsPlayer =
    forcePlayerView &&
    (currentPhase === "STORYTELLER_CHOICE" ||
      currentPhase === "PLAYERS_CHOICE");

  const currentPlayerId =
    viewMode === "spectator"
      ? "spectator"
      : shouldShowAsPlayer
      ? "2" // Force player view
      : viewMode === "admin"
      ? "1"
      : "2";

  // Generate appropriate player state based on view mode
  const mockPlayerState = generateMockPlayerState(
    currentPhase,
    currentPlayerId
  );

  // Update player state with demo vote
  if (mockPlayerState && demoVotedCardId) {
    mockPlayerState.myVote = demoVotedCardId;
  }

  // Mock action handlers
  const mockActions = {
    storytellerSubmit: () => console.log("Demo: storyteller submit"),
    playerSubmitCard: () => console.log("Demo: player submit"),
    playerVote: (cardId: string) => {
      console.log("Demo: player vote", cardId);
      setDemoVotedCardId(cardId);
      setDemoVotes((prev) => [...prev, { voterId: currentPlayerId, cardId }]);
    },
    advanceRound: () => console.log("Demo: advance round"),
    resetGame: () => console.log("Demo: reset game"),
    newDeck: () => console.log("Demo: new deck"),
    setAllowPlayerUploads: (allow: boolean) => {
      console.log("Demo: setAllowPlayerUploads", allow);
      setAllowPlayerUploads(allow);
    },
    setWinTarget: (target: number | null) => {
      console.log("Demo: setWinTarget", target);
      setWinTarget(target);
    },
    lockDeck: () => {
      console.log("Demo: lockDeck");
      setDeckLocked(true);
    },
    unlockDeck: () => {
      console.log("Demo: unlockDeck");
      setDeckLocked(false);
    },
    uploadImage: (imageData: string) => {
      console.log("Demo: uploadImage", imageData.substring(0, 50) + "...");
      const newImage = {
        id: `demo-img-${Date.now()}`,
        uploadedBy: currentPlayerId,
      };
      setUploadedImages((prev) => [...prev, newImage]);
      setDeckSize((prev) => prev + 1);
    },
    deleteImage: (imageId: string) => {
      console.log("Demo: deleteImage", imageId);
      setUploadedImages((prev) => prev.filter((img) => img.id !== imageId));
      setDeckSize((prev) => Math.max(0, prev - 1));
    },
  };

  const testAnimation = () => {
    // Add exactly 1 point to each player
    const deltas = [
      { playerId: "1", delta: 1 },
      { playerId: "2", delta: 1 },
      { playerId: "3", delta: 1 },
      { playerId: "4", delta: 1 },
    ];

    // Get current scores or use defaults (starting from 0)
    const currentScores = customPlayerScores || {
      "1": 0,
      "2": 0,
      "3": 0,
      "4": 0,
    };

    // Calculate new scores
    const newScores = {
      "1": Math.min(30, currentScores["1"] + deltas[0].delta),
      "2": Math.min(30, currentScores["2"] + deltas[1].delta),
      "3": Math.min(30, currentScores["3"] + deltas[2].delta),
      "4": Math.min(30, currentScores["4"] + deltas[3].delta),
    };

    console.log("🎲 Test Animation - Round", animationRound + 1);
    console.log("Deltas:", deltas);
    console.log("New scores:", newScores);

    setCustomScoreDeltas(deltas);
    setCustomPlayerScores(newScores);
    setAnimationRound((prev) => prev + 1); // Increment to trigger new animation
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
        <button onClick={nextPhase} className="nav-btn" title="Next (→ Arrow)">
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
        {(currentPhase === "STORYTELLER_CHOICE" ||
          currentPhase === "PLAYERS_CHOICE") &&
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
        {currentPhase === "SCORING" && (
          <>
            <div className="nav-divider"></div>
            <button
              onClick={testAnimation}
              className="nav-btn test-animation-btn"
              title="Test scoring animation with random points"
            >
              🎲 Test Animation
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
          onJoin={mockActions.storytellerSubmit}
          onUploadImage={mockActions.uploadImage}
          onDeleteImage={mockActions.deleteImage}
          onSetAllowPlayerUploads={mockActions.setAllowPlayerUploads}
          onLockDeck={mockActions.lockDeck}
          onUnlockDeck={mockActions.unlockDeck}
          onStartGame={mockActions.storytellerSubmit}
          onChangeName={mockActions.storytellerSubmit}
          onKickPlayer={mockActions.storytellerSubmit}
          onPromotePlayer={mockActions.storytellerSubmit}
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
