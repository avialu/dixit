import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { RoomState, PlayerState } from "../hooks/useGameState";
import { HandView } from "../components/HandView";
import { VotingView } from "../components/VotingView";
import { GameBoard } from "../components/GameBoard";

interface GamePageProps {
  roomState: RoomState | null;
  playerState: PlayerState | null;
  playerId: string;
  onStorytellerSubmit: (cardId: string, clue: string) => void;
  onPlayerSubmitCard: (cardId: string) => void;
  onPlayerVote: (cardId: string) => void;
  onAdvanceRound: () => void;
  onResetGame: () => void;
  onNewDeck: () => void;
}

export function GamePage({
  roomState,
  playerState,
  playerId,
  onStorytellerSubmit,
  onPlayerSubmitCard,
  onPlayerVote,
  onAdvanceRound,
  onResetGame,
  onNewDeck,
}: GamePageProps) {
  const navigate = useNavigate();
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [clue, setClue] = useState("");

  useEffect(() => {
    if (!roomState) return;

    if (
      roomState.phase === "DECK_BUILDING" ||
      roomState.phase === "WAITING_FOR_PLAYERS"
    ) {
      navigate("/lobby");
    } else if (roomState.phase === "GAME_END") {
      // Stay on game page to show final scores
    }
  }, [roomState?.phase, navigate]);

  if (!roomState || !playerState) {
    return <div className="loading">Loading game...</div>;
  }

  const isStoryteller = roomState.storytellerId === playerId;
  const myPlayer = roomState.players.find((p) => p.id === playerId);
  const isAdmin = myPlayer?.isAdmin || false;

  const handleStorytellerSubmit = () => {
    if (selectedCardId && clue.trim()) {
      onStorytellerSubmit(selectedCardId, clue.trim());
      setSelectedCardId(null);
      setClue("");
    }
  };

  const handlePlayerSubmit = () => {
    if (selectedCardId) {
      onPlayerSubmitCard(selectedCardId);
      setSelectedCardId(null);
    }
  };

  const handleVote = () => {
    if (selectedCardId) {
      onPlayerVote(selectedCardId);
      setSelectedCardId(null);
    }
  };

  const showCards = ["REVEAL", "VOTING", "SCORING"].includes(roomState.phase);
  const showVotes = roomState.phase === "SCORING";
  const storyteller = roomState.players.find(
    (p) => p.id === roomState.storytellerId
  );

  return (
    <div className="game-page-with-board">
      {/* BACKGROUND LAYER: Always visible game board */}
      <div className="game-board-background">
        {/* Visual Game Board with Track */}
        <GameBoard roomState={roomState} />

        {/* Board Header */}
        <div className="board-header-ingame">
          <div className="board-title">🎨 DIXIT</div>
          <div className="board-info">
            <div className="round-info">Round {roomState.currentRound}</div>
            {roomState.winTarget && (
              <div className="target-info">
                🏁 Goal: {roomState.winTarget} pts
              </div>
            )}
          </div>
        </div>

        {/* Phase & Storyteller Info Bar */}
        <div className="game-info-bar">
          <div className="phase-indicator-ingame">
            {roomState.phase.replace(/_/g, " ")}
          </div>
          {storyteller && roomState.phase !== "GAME_END" && (
            <div className="storyteller-info-ingame">📖 {storyteller.name}</div>
          )}
        </div>

        {/* Current Clue Display */}
        {roomState.currentClue && (
          <div className="clue-display-ingame">
            <div className="clue-label">Clue:</div>
            <div className="clue-text">"{roomState.currentClue}"</div>
          </div>
        )}

        {/* Revealed Cards Area */}
        {showCards && roomState.revealedCards.length > 0 && (
          <div className="revealed-cards-area">
            <VotingView
              revealedCards={roomState.revealedCards}
              selectedCardId={null}
              onSelectCard={() => {}}
              disabled={true}
              votes={showVotes ? roomState.votes : undefined}
            />
          </div>
        )}
      </div>

      {/* FOREGROUND LAYER: Player-specific overlay */}
      <div className="player-overlay">
        <div className="player-overlay-content">
          {/* STORYTELLER_CHOICE Phase */}
          {roomState.phase === "STORYTELLER_CHOICE" && (
            <>
              {isStoryteller ? (
                <div className="overlay-section storyteller-section">
                  <div className="overlay-header">
                    <h3>🎭 You are the Storyteller!</h3>
                    <p>Choose a card from your hand and provide a clue</p>
                  </div>

                  <input
                    type="text"
                    className="clue-input"
                    placeholder="Enter your clue..."
                    value={clue}
                    onChange={(e) => setClue(e.target.value)}
                    maxLength={200}
                  />

                  <div className="hand-container">
                    <HandView
                      hand={playerState.hand}
                      selectedCardId={selectedCardId}
                      onSelectCard={setSelectedCardId}
                    />
                  </div>

                  <button
                    onClick={handleStorytellerSubmit}
                    disabled={!selectedCardId || !clue.trim()}
                    className="btn-primary btn-large"
                  >
                    Submit Card & Clue
                  </button>
                </div>
              ) : (
                <div className="overlay-section waiting-section">
                  <div className="waiting-icon">⏳</div>
                  <h3>Waiting for Storyteller...</h3>
                  <p>The storyteller is choosing a card and creating a clue</p>
                </div>
              )}
            </>
          )}

          {/* PLAYERS_CHOICE Phase */}
          {roomState.phase === "PLAYERS_CHOICE" && (
            <>
              {!isStoryteller ? (
                <div className="overlay-section player-choice-section">
                  {!playerState.mySubmittedCardId ? (
                    <>
                      <div className="overlay-header">
                        <h3>✍️ Choose Your Card</h3>
                        <p>Pick a card that matches the clue</p>
                      </div>

                      <div className="hand-container">
                        <HandView
                          hand={playerState.hand}
                          selectedCardId={selectedCardId}
                          onSelectCard={setSelectedCardId}
                        />
                      </div>

                      <button
                        onClick={handlePlayerSubmit}
                        disabled={!selectedCardId}
                        className="btn-primary btn-large"
                      >
                        Submit Card
                      </button>
                    </>
                  ) : (
                    <div className="waiting-section">
                      <div className="waiting-icon">✓</div>
                      <h3>Card Submitted!</h3>
                      <p>Waiting for other players to choose their cards...</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="overlay-section waiting-section">
                  <div className="waiting-icon">⏳</div>
                  <h3>Waiting for Players...</h3>
                  <p>Players are choosing cards that match your clue</p>
                </div>
              )}
            </>
          )}

          {/* REVEAL Phase */}
          {roomState.phase === "REVEAL" && (
            <div className="overlay-section reveal-section">
              <div className="waiting-icon">🎊</div>
              <h3>Revealing Cards...</h3>
              <p>All cards are now visible on the board</p>
            </div>
          )}

          {/* VOTING Phase */}
          {roomState.phase === "VOTING" && (
            <>
              {!isStoryteller ? (
                <div className="overlay-section voting-section">
                  {!playerState.myVote ? (
                    <>
                      <div className="overlay-header">
                        <h3>🗳️ Vote for the Storyteller's Card</h3>
                        <p>Which card do you think the storyteller chose?</p>
                        <p className="hint">
                          (You cannot vote for your own card)
                        </p>
                      </div>

                      <div className="voting-cards-area">
                        <VotingView
                          revealedCards={roomState.revealedCards}
                          selectedCardId={selectedCardId}
                          onSelectCard={setSelectedCardId}
                          myCardId={playerState.mySubmittedCardId}
                        />
                      </div>

                      <button
                        onClick={handleVote}
                        disabled={!selectedCardId}
                        className="btn-primary btn-large"
                      >
                        Vote
                      </button>
                    </>
                  ) : (
                    <div className="waiting-section">
                      <div className="waiting-icon">✓</div>
                      <h3>Vote Submitted!</h3>
                      <p>Waiting for other players to vote...</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="overlay-section waiting-section">
                  <div className="waiting-icon">⏳</div>
                  <h3>Players are Voting...</h3>
                  <p>Players are trying to guess which card is yours</p>
                </div>
              )}
            </>
          )}

          {/* SCORING Phase */}
          {roomState.phase === "SCORING" && (
            <div className="overlay-section scoring-section">
              <div className="overlay-header">
                <h3>🏆 Round Results</h3>
                <p>Scores have been updated on the board!</p>
              </div>

              <div className="score-deltas-display">
                <h4>Score Changes This Round:</h4>
                <div className="score-deltas-grid">
                  {roomState.lastScoreDeltas.map((delta) => {
                    const player = roomState.players.find(
                      (p) => p.id === delta.playerId
                    );
                    return (
                      <div
                        key={delta.playerId}
                        className={`score-delta-item ${
                          delta.delta > 0
                            ? "positive"
                            : delta.delta < 0
                            ? "negative"
                            : "neutral"
                        }`}
                      >
                        <span className="player-name">{player?.name}:</span>
                        <span className="delta-value">
                          {delta.delta > 0 ? "+" : ""}
                          {delta.delta} pts
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <button
                onClick={onAdvanceRound}
                className="btn-primary btn-large"
              >
                Next Round →
              </button>
            </div>
          )}

          {/* GAME_END Phase */}
          {roomState.phase === "GAME_END" && (
            <div className="overlay-section game-end-section">
              {(() => {
                const sortedPlayers = [...roomState.players].sort(
                  (a, b) => b.score - a.score
                );
                const winner = sortedPlayers[0];
                const wonByTarget =
                  roomState.winTarget !== null &&
                  winner.score >= roomState.winTarget;

                return (
                  <>
                    <div className="winner-crown">👑</div>
                    <h2>Game Over!</h2>
                    {wonByTarget && (
                      <p className="winner-text">
                        {winner.name} wins with {winner.score} points!
                      </p>
                    )}

                    <div className="final-scores-list">
                      {sortedPlayers.map((player, index) => (
                        <div
                          key={player.id}
                          className={`final-score-item ${
                            index === 0 ? "winner" : ""
                          }`}
                        >
                          <span className="rank">{index + 1}.</span>
                          <span className="name">{player.name}</span>
                          <span className="score">{player.score} pts</span>
                        </div>
                      ))}
                    </div>

                    <div className="game-end-actions">
                      <button
                        onClick={() => navigate("/lobby")}
                        className="btn-primary"
                      >
                        Back to Lobby
                      </button>

                      {isAdmin && (
                        <>
                          <button
                            onClick={onResetGame}
                            className="btn-secondary"
                          >
                            Reset Game
                          </button>
                          <button onClick={onNewDeck} className="btn-secondary">
                            New Deck
                          </button>
                        </>
                      )}
                    </div>
                  </>
                );
              })()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
