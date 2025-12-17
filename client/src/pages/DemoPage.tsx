import { useState, useEffect } from "react";
import { RoomState, PlayerState } from "../hooks/useGameState";
import { BoardPage } from "./BoardPage";
import { UnifiedGamePage } from "./UnifiedGamePage";

// Mock data generator for different game phases
const generateMockRoomState = (phase: string): RoomState | null => {
  // Special case: NOT_JOINED - return null to show join screen
  if (phase === "NOT_JOINED") {
    return null;
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
    deckMode: "MIXED",
    deckLocked: false,
    deckImages: [],
    currentRound: 5,
    storytellerId: "1",
    currentClue: phase === "STORYTELLER_CHOICE" ? "" : "A magical journey",
    revealedCards: [],
    votes: [],
    lastScoreDeltas: [],
    winTarget: 30,
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
        deckSize: 0,
      };

    case "DECK_BUILDING":
      return {
        ...baseState,
        phase: "DECK_BUILDING",
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

    case "REVEAL":
      return {
        ...baseState,
        phase: "REVEAL",
        revealedCards: [
          {
            cardId: "c1",
            imageData:
              "https://via.placeholder.com/300x400/3498db/ffffff?text=Card+1",
            position: 0,
          },
          {
            cardId: "c2",
            imageData:
              "https://via.placeholder.com/300x400/2ecc71/ffffff?text=Card+2",
            position: 1,
          },
          {
            cardId: "c3",
            imageData:
              "https://via.placeholder.com/300x400/e74c3c/ffffff?text=Card+3",
            position: 2,
          },
          {
            cardId: "c4",
            imageData:
              "https://via.placeholder.com/300x400/f39c12/ffffff?text=Card+4",
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
            imageData:
              "https://via.placeholder.com/300x400/3498db/ffffff?text=Card+1",
            position: 0,
          },
          {
            cardId: "c2",
            imageData:
              "https://via.placeholder.com/300x400/2ecc71/ffffff?text=Card+2",
            position: 1,
          },
          {
            cardId: "c3",
            imageData:
              "https://via.placeholder.com/300x400/e74c3c/ffffff?text=Card+3",
            position: 2,
          },
          {
            cardId: "c4",
            imageData:
              "https://via.placeholder.com/300x400/f39c12/ffffff?text=Card+4",
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
            imageData:
              "https://via.placeholder.com/300x400/3498db/ffffff?text=Card+1",
            position: 0,
          },
          {
            cardId: "c2",
            imageData:
              "https://via.placeholder.com/300x400/2ecc71/ffffff?text=Card+2",
            position: 1,
          },
          {
            cardId: "c3",
            imageData:
              "https://via.placeholder.com/300x400/e74c3c/ffffff?text=Card+3",
            position: 2,
          },
          {
            cardId: "c4",
            imageData:
              "https://via.placeholder.com/300x400/f39c12/ffffff?text=Card+4",
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

const generateMockPlayerState = (phase: string): PlayerState => {
  const baseHand = [
    {
      id: "h1",
      imageData:
        "https://via.placeholder.com/300x400/9b59b6/ffffff?text=Hand+1",
      uploadedBy: "player1",
    },
    {
      id: "h2",
      imageData:
        "https://via.placeholder.com/300x400/1abc9c/ffffff?text=Hand+2",
      uploadedBy: "player1",
    },
    {
      id: "h3",
      imageData:
        "https://via.placeholder.com/300x400/34495e/ffffff?text=Hand+3",
      uploadedBy: "player1",
    },
    {
      id: "h4",
      imageData:
        "https://via.placeholder.com/300x400/e67e22/ffffff?text=Hand+4",
      uploadedBy: "player1",
    },
    {
      id: "h5",
      imageData:
        "https://via.placeholder.com/300x400/95a5a6/ffffff?text=Hand+5",
      uploadedBy: "player1",
    },
    {
      id: "h6",
      imageData:
        "https://via.placeholder.com/300x400/16a085/ffffff?text=Hand+6",
      uploadedBy: "player1",
    },
  ];

  return {
    playerId: "1",
    hand: baseHand,
    mySubmittedCardId:
      phase === "PLAYERS_CHOICE" || phase === "VOTING" ? "h2" : null,
    myVote: phase === "VOTING" ? "c1" : null,
  };
};

const allPhases = [
  "NOT_JOINED", // Special phase for demo to show join screen
  "WAITING_FOR_PLAYERS",
  "DECK_BUILDING",
  "STORYTELLER_CHOICE",
  "PLAYERS_CHOICE",
  "REVEAL",
  "VOTING",
  "SCORING",
  "GAME_END",
];

export function DemoPage() {
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);
  const [viewMode, setViewMode] = useState<"game" | "board">("game");

  const currentPhase = allPhases[currentPhaseIndex];
  const mockRoomState = generateMockRoomState(currentPhase);
  const mockPlayerState = generateMockPlayerState(currentPhase);

  // Mock action handlers (do nothing in demo)
  const mockActions = {
    storytellerSubmit: () => console.log("Demo: storyteller submit"),
    playerSubmitCard: () => console.log("Demo: player submit"),
    playerVote: () => console.log("Demo: player vote"),
    advanceRound: () => console.log("Demo: advance round"),
    resetGame: () => console.log("Demo: reset game"),
    newDeck: () => console.log("Demo: new deck"),
  };

  const nextPhase = () => {
    setCurrentPhaseIndex((prev) => (prev + 1) % allPhases.length);
  };

  const prevPhase = () => {
    setCurrentPhaseIndex(
      (prev) => (prev - 1 + allPhases.length) % allPhases.length
    );
  };

  const goToPhase = (index: number) => {
    setCurrentPhaseIndex(index);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        prevPhase();
      } else if (e.key === "ArrowRight") {
        nextPhase();
      } else if (e.key === "v" || e.key === "V") {
        setViewMode((prev) => (prev === "game" ? "board" : "game"));
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, []);

  return (
    <div className="demo-page">
      {/* Demo Control Panel */}
      <div className="demo-controls">
        <div className="demo-header">
          <h2>🎨 Dixit Game Preview</h2>
          <p>Navigate through all game phases without playing</p>
        </div>

        <div className="phase-navigation">
          <button onClick={prevPhase} className="btn-nav">
            ← Previous
          </button>
          <div className="current-phase-display">
            <strong>{currentPhase.replace(/_/g, " ")}</strong>
            <span>
              ({currentPhaseIndex + 1} / {allPhases.length})
            </span>
          </div>
          <button onClick={nextPhase} className="btn-nav">
            Next →
          </button>
        </div>

        <div className="phase-selector">
          {allPhases.map((phase, index) => (
            <button
              key={phase}
              onClick={() => goToPhase(index)}
              className={`phase-button ${
                index === currentPhaseIndex ? "active" : ""
              }`}
            >
              {phase === "NOT_JOINED"
                ? "🎯 Join Screen"
                : phase.replace(/_/g, " ")}
            </button>
          ))}
        </div>

        <div className="view-mode-toggle">
          <button
            onClick={() => setViewMode("game")}
            className={`mode-button ${viewMode === "game" ? "active" : ""}`}
          >
            🎮 Game View
          </button>
          <button
            onClick={() => setViewMode("board")}
            className={`mode-button ${viewMode === "board" ? "active" : ""}`}
          >
            📺 Board Display
          </button>
        </div>

        <div className="demo-info">
          <h3>Current Phase Info:</h3>
          {mockRoomState ? (
            <ul>
              <li>
                <strong>Players:</strong> {mockRoomState.players.length}
              </li>
              <li>
                <strong>Round:</strong> {mockRoomState.currentRound}
              </li>
              <li>
                <strong>Deck Size:</strong> {mockRoomState.deckSize}
              </li>
              <li>
                <strong>Clue:</strong>{" "}
                {mockRoomState.currentClue || "(None yet)"}
              </li>
              <li>
                <strong>Storyteller:</strong>{" "}
                {
                  mockRoomState.players.find(
                    (p) => p.id === mockRoomState.storytellerId
                  )?.name
                }
              </li>
            </ul>
          ) : (
            <p
              style={{
                color: "#95a5a6",
                fontStyle: "italic",
                marginTop: "1rem",
              }}
            >
              Not joined yet - this is the initial join screen
            </p>
          )}
        </div>
      </div>

      {/* Preview Frame */}
      <div className="demo-preview-frame">
        <div className="demo-screen-preview">
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
              onClick={() => setViewMode("game")}
              className={`nav-btn ${viewMode === "game" ? "active" : ""}`}
              title="Game View (press V to toggle)"
            >
              🎮
            </button>
            <button
              onClick={() => setViewMode("board")}
              className={`nav-btn ${viewMode === "board" ? "active" : ""}`}
              title="Board Display (press V to toggle)"
            >
              📺
            </button>
          </div>

          <div className="demo-info-header">
            <h3>
              {viewMode === "game" ? "🎮 Game View" : "📺 Board Display"} -
              Phase:{" "}
              {currentPhase === "NOT_JOINED"
                ? "Join Screen"
                : currentPhase.replace(/_/g, " ")}
            </h3>
            <p className="demo-description-text">
              {viewMode === "game"
                ? "Single-page experience: Join → Lobby → Game with board always visible and modal popups"
                : "Large-format TV/projector display for everyone to see"}
            </p>
          </div>

          <div className="actual-screen-container">
            {viewMode === "game" ? (
              <div className="demo-game-view">
                <UnifiedGamePage
                  roomState={mockRoomState}
                  playerState={mockPlayerState}
                  playerId="1"
                  clientId="demo-client-123"
                  socket={null}
                  onJoin={mockActions.storytellerSubmit}
                  onUploadImage={mockActions.storytellerSubmit}
                  onDeleteImage={mockActions.storytellerSubmit}
                  onSetDeckMode={mockActions.storytellerSubmit}
                  onLockDeck={mockActions.storytellerSubmit}
                  onUnlockDeck={mockActions.storytellerSubmit}
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
                  onSetWinTarget={mockActions.storytellerSubmit}
                />
              </div>
            ) : (
              <div className="demo-board-view">
                <BoardPage roomState={mockRoomState} />
              </div>
            )}
          </div>

          <div className="demo-explanation-box">
            <h4>💡 What's Happening in This Phase:</h4>
            {viewMode === "game" && (
              <p>
                <strong>🎮 Game View:</strong>{" "}
                {currentPhase === "NOT_JOINED" &&
                  "Join screen - Beautiful centered form with name input. This is the first thing players see!"}
                {currentPhase === "WAITING_FOR_PLAYERS" &&
                  "Lobby - waiting for more players to join. Shows connected players and QR code."}
                {currentPhase === "DECK_BUILDING" &&
                  "Lobby shows players and admin settings in a two-column grid layout."}
                {currentPhase === "STORYTELLER_CHOICE" &&
                  "Board is visible with modal popup where storyteller chooses a card and enters a clue."}
                {currentPhase === "PLAYERS_CHOICE" &&
                  "Players see board with modal to choose a card matching the storyteller's clue."}
                {currentPhase === "REVEAL" &&
                  "All cards appear on the board background, preparing for voting."}
                {currentPhase === "VOTING" &&
                  "Modal shows all cards for voting - which one is the storyteller's?"}
                {currentPhase === "SCORING" &&
                  "Score deltas display in modal while board updates token positions in real-time."}
                {currentPhase === "GAME_END" &&
                  "Winner celebration with final scores and admin controls to restart."}
              </p>
            )}
            {viewMode === "board" && (
              <p>
                <strong>📺 Board Display:</strong>{" "}
                {currentPhase === "NOT_JOINED"
                  ? "No content yet - this view is for after players join."
                  : "Large-format view for TV/projector. Shows the game board with winding path, player tokens, current clue, revealed cards, and live scoring updates. Perfect for shared viewing!"}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Quick Instructions */}
      <div className="demo-instructions">
        <h3>💡 How to Use This Preview:</h3>
        <div className="instructions-grid">
          <div className="instruction-item">
            <strong>← / →</strong> Navigate phases
          </div>
          <div className="instruction-item">
            <strong>V</strong> Toggle views (🎮 ⇄ 📺)
          </div>
          <div className="instruction-item">
            <strong>🎮 Game</strong> Single-page experience
          </div>
          <div className="instruction-item">
            <strong>📺 Board</strong> TV/projector display
          </div>
        </div>
      </div>
    </div>
  );
}
