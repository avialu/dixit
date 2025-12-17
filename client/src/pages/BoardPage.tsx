import { RoomState } from "../hooks/useGameState";
import { GameBoard } from "../components/GameBoard";
import { VotingView } from "../components/VotingView";
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

  // Spectator view - same as player view but without interactive elements
  return (
    <div className="unified-game-page game-state spectator-mode">
      {/* Fullscreen hint */}
      {!isFullscreen && (
        <div className="fullscreen-hint">
          Click anywhere to enter fullscreen mode
        </div>
      )}

      {/* Board Background - Always Visible (same as players see) */}
      <div className="board-background">
        <GameBoard roomState={roomState} />

        {/* Revealed Cards Display (during REVEAL, VOTING, SCORING) */}
        {["REVEAL", "VOTING", "SCORING"].includes(roomState.phase) &&
          roomState.revealedCards.length > 0 && (
            <div className="board-revealed-cards">
              <VotingView
                revealedCards={roomState.revealedCards}
                selectedCardId={null}
                onSelectCard={() => {}}
                disabled={true}
                votes={
                  roomState.phase === "SCORING" ? roomState.votes : undefined
                }
              />
            </div>
          )}
      </div>
    </div>
  );
}
