import { RoomState } from "../hooks/useGameState";
import { BoardView } from "../components/BoardView";
import { GameBoard } from "../components/GameBoard";
import { useEffect, useState } from "react";

interface BoardPageProps {
  roomState: RoomState | null;
}

export function BoardPage({ roomState }: BoardPageProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    // Auto-enter fullscreen on load (user must interact first)
    const enterFullscreen = () => {
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {
          console.log("Fullscreen not available");
        });
      }
    };

    // Listen for user interaction to enable fullscreen
    document.addEventListener("click", enterFullscreen, { once: true });

    return () => {
      document.removeEventListener("click", enterFullscreen);
    };
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  if (!roomState) {
    return (
      <div className="loading" style={{ fontSize: "2rem" }}>
        <div>🎨 Connecting to game...</div>
        <div style={{ fontSize: "1rem", marginTop: "1rem", color: "#95a5a6" }}>
          Make sure you've joined the game from your phone first
        </div>
      </div>
    );
  }

  const showCards = ["REVEAL", "VOTING", "SCORING"].includes(roomState.phase);
  const showVotes = roomState.phase === "SCORING";
  const storyteller = roomState.players.find(
    (p) => p.id === roomState.storytellerId
  );

  // Get winner in GAME_END phase
  const winner =
    roomState.phase === "GAME_END"
      ? [...roomState.players].sort((a, b) => b.score - a.score)[0]
      : null;

  const getPhaseEmoji = (phase: string) => {
    switch (phase) {
      case "WAITING_FOR_PLAYERS":
        return "⏳";
      case "DECK_BUILDING":
        return "🎴";
      case "STORYTELLER_CHOICE":
        return "🎭";
      case "PLAYERS_CHOICE":
        return "✍️";
      case "REVEAL":
        return "🎊";
      case "VOTING":
        return "🗳️";
      case "SCORING":
        return "🏆";
      case "GAME_END":
        return "👑";
      default:
        return "🎨";
    }
  };

  return (
    <div className="board-page">
      {/* Fullscreen hint */}
      {!isFullscreen && (
        <div className="fullscreen-hint">
          Click anywhere to enter fullscreen mode
        </div>
      )}

      {/* Visual Game Board with Path */}
      <GameBoard roomState={roomState} />

      <div className="board-header">
        <h1>🎨 DIXIT</h1>
        <div className="board-info">
          <div className="round-info">Round {roomState.currentRound}</div>
          {roomState.winTarget && (
            <div className="target-info">
              🏁 Goal: {roomState.winTarget} pts
            </div>
          )}
        </div>
      </div>

      <div className="phase-indicator-large">
        {getPhaseEmoji(roomState.phase)} {roomState.phase.replace(/_/g, " ")}
      </div>

      {storyteller &&
        roomState.phase !== "WAITING_FOR_PLAYERS" &&
        roomState.phase !== "DECK_BUILDING" &&
        roomState.phase !== "GAME_END" && (
          <div className="storyteller-info">
            Storyteller: <strong>{storyteller.name}</strong> 📖
          </div>
        )}

      {roomState.currentClue && (
        <div className="clue-display">
          <div className="clue-label">Clue:</div>
          <div className="clue-text">"{roomState.currentClue}"</div>
        </div>
      )}

      {showCards && roomState.revealedCards.length > 0 && (
        <div className="board-cards-display">
          <BoardView
            revealedCards={roomState.revealedCards}
            votes={showVotes ? roomState.votes : undefined}
          />
        </div>
      )}

      {!showCards && (
        <div className="board-waiting">
          {roomState.phase === "WAITING_FOR_PLAYERS" && (
            <>
              <div className="waiting-icon">👥</div>
              <p>Waiting for players to join...</p>
              <div className="player-count">
                {roomState.players.length} / 3+ players
              </div>
            </>
          )}
          {roomState.phase === "DECK_BUILDING" && (
            <>
              <div className="waiting-icon">🎴</div>
              <p>Building the deck...</p>
              <div className="deck-progress">
                {roomState.deckSize} images uploaded
                {roomState.deckMode === "PLAYERS_ONLY" && ` / 100 required`}
              </div>
            </>
          )}
          {roomState.phase === "STORYTELLER_CHOICE" && (
            <>
              <div className="waiting-icon">🎭</div>
              <p>Storyteller is choosing a card and clue...</p>
            </>
          )}
          {roomState.phase === "PLAYERS_CHOICE" && (
            <>
              <div className="waiting-icon">✍️</div>
              <p>Players are choosing their cards...</p>
              <div className="progress-info">
                {roomState.revealedCards.length} / {roomState.players.length}{" "}
                cards submitted
              </div>
            </>
          )}
          {roomState.phase === "GAME_END" && winner && (
            <>
              <div className="winner-announcement">
                <div className="winner-crown">👑</div>
                <h2>Winner!</h2>
                <div className="winner-name">{winner.name}</div>
                <div className="winner-score">{winner.score} points</div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
