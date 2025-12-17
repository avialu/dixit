import { useState } from "react";
import { RoomState, PlayerState } from "../hooks/useGameState";
import { GameBoard } from "../components/GameBoard";
import { HandView } from "../components/HandView";
import { VotingView } from "../components/VotingView";

interface UnifiedGamePageProps {
  roomState: RoomState | null;
  playerState: PlayerState | null;
  playerId: string;
  clientId: string;
  socket: any;
  onJoin: (name: string, clientId: string) => void;
  onUploadImage: (imageData: string) => void;
  onDeleteImage: (imageId: string) => void;
  onSetDeckMode: (mode: string) => void;
  onLockDeck: () => void;
  onUnlockDeck: () => void;
  onStartGame: () => void;
  onChangeName: (newName: string) => void;
  onKickPlayer: (playerId: string) => void;
  onPromotePlayer: (playerId: string) => void;
  onStorytellerSubmit: (cardId: string, clue: string) => void;
  onPlayerSubmitCard: (cardId: string) => void;
  onPlayerVote: (cardId: string) => void;
  onAdvanceRound: () => void;
  onResetGame: () => void;
  onNewDeck: () => void;
  onSetWinTarget: (target: number | null) => void;
}

export function UnifiedGamePage({
  roomState,
  playerState,
  playerId,
  clientId,
  socket: _socket,
  onJoin,
  onUploadImage: _onUploadImage,
  onDeleteImage: _onDeleteImage,
  onSetDeckMode,
  onLockDeck,
  onUnlockDeck,
  onStartGame,
  onChangeName: _onChangeName,
  onKickPlayer,
  onPromotePlayer,
  onStorytellerSubmit,
  onPlayerSubmitCard,
  onPlayerVote,
  onAdvanceRound,
  onResetGame,
  onNewDeck,
  onSetWinTarget,
}: UnifiedGamePageProps) {
  const [name, setName] = useState("");
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [clue, setClue] = useState("");
  const [showModal, setShowModal] = useState(false);

  const isJoined =
    roomState && roomState.players.some((p) => p.id === playerId);
  const isInGame =
    roomState &&
    [
      "STORYTELLER_CHOICE",
      "PLAYERS_CHOICE",
      "REVEAL",
      "VOTING",
      "SCORING",
      "GAME_END",
    ].includes(roomState.phase);
  const myPlayer = roomState?.players.find((p) => p.id === playerId);
  const isAdmin = myPlayer?.isAdmin || false;
  const isStoryteller = roomState?.storytellerId === playerId;

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onJoin(name.trim(), clientId);
    }
  };

  const handleStorytellerSubmit = () => {
    if (selectedCardId && clue.trim()) {
      onStorytellerSubmit(selectedCardId, clue.trim());
      setSelectedCardId(null);
      setClue("");
      setShowModal(false);
    }
  };

  const handlePlayerSubmit = () => {
    if (selectedCardId) {
      onPlayerSubmitCard(selectedCardId);
      setSelectedCardId(null);
      setShowModal(false);
    }
  };

  const handleVote = () => {
    if (selectedCardId) {
      onPlayerVote(selectedCardId);
      setSelectedCardId(null);
      setShowModal(false);
    }
  };

  // JOIN SCREEN (before joining)
  if (!isJoined) {
    return (
      <div className="unified-game-page join-state">
        <div className="join-container">
          <div className="join-box">
            <h1>🎨 DIXIT</h1>
            <p className="tagline">A game of creative storytelling</p>

            <form onSubmit={handleJoin} className="join-form">
              <input
                type="text"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={50}
                autoFocus
                className="name-input"
              />
              <button
                type="submit"
                disabled={!name.trim()}
                className="btn-primary btn-large"
              >
                Join Game
              </button>
            </form>

            <div className="spectator-section">
              <p className="spectator-hint">Just want to watch?</p>
              <button
                type="button"
                onClick={() => (window.location.href = "/board")}
                className="btn-secondary btn-large"
              >
                👀 Join as Spectator
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // BOARD VIEW (after joining - always shows board)
  return (
    <div className="unified-game-page game-state">
      {/* Board Background - Always Visible */}
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

      {/* Floating Action Button for Players - Always available */}
      {isJoined && (
        <button
          className={`floating-action-button ${showModal ? "hidden" : ""}`}
          onClick={() => setShowModal(true)}
        >
          {!isInGame && "👥 Players"}
          {roomState.phase === "STORYTELLER_CHOICE" && "🎭 My Cards"}
          {roomState.phase === "PLAYERS_CHOICE" && "🃏 Choose Card"}
          {roomState.phase === "VOTING" && "🗳️ Vote"}
          {roomState.phase === "SCORING" && "📊 Scores"}
          {roomState.phase === "GAME_END" && "🏆 Results"}
        </button>
      )}

      {/* Modal Popup - Shows when player needs to act */}
      {showModal && (
        <>
          <div className="modal-backdrop" onClick={() => setShowModal(false)} />
          <div className="modal-popup">
            <button
              className="modal-close-button"
              onClick={() => setShowModal(false)}
              title="Close and view board"
            >
              ✕
            </button>
            <div className="modal-content">
              {/* LOBBY - Player List and Admin Controls (before game starts) */}
              {!isInGame && (
                <div className="modal-section lobby-modal">
                  <h2>👥 Players ({roomState.players.length})</h2>

                  <div className="players-grid">
                    {roomState.players.map((player) => (
                      <div
                        key={player.id}
                        className={`player-card ${
                          player.id === playerId ? "you" : ""
                        }`}
                      >
                        <div className="player-info">
                          <span className="player-name">{player.name}</span>
                          {player.id === playerId && (
                            <span className="you-badge">(You)</span>
                          )}
                          {player.isAdmin && (
                            <span className="admin-badge">👑</span>
                          )}
                        </div>
                        {isAdmin && player.id !== playerId && (
                          <div className="player-actions">
                            <button
                              onClick={() => onKickPlayer(player.id)}
                              className="btn-danger btn-small"
                            >
                              Kick
                            </button>
                            {!player.isAdmin && (
                              <button
                                onClick={() => onPromotePlayer(player.id)}
                                className="btn-secondary btn-small"
                              >
                                Promote
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Admin Controls */}
                  {isAdmin && (
                    <>
                      <h2 style={{ marginTop: "2rem" }}>⚙️ Game Settings</h2>

                      <div className="setting-group">
                        <label>Deck Mode:</label>
                        <select
                          value={roomState.deckMode}
                          onChange={(e) => onSetDeckMode(e.target.value)}
                          disabled={roomState.deckLocked}
                        >
                          <option value="PLAYERS_ONLY">Players Upload</option>
                          <option value="HOST_ONLY">Host Only</option>
                          <option value="MIXED">Mixed</option>
                        </select>
                      </div>

                      <div className="setting-group">
                        <label>Win Target:</label>
                        <select
                          value={roomState.winTarget || "null"}
                          onChange={(e) =>
                            onSetWinTarget(
                              e.target.value === "null"
                                ? null
                                : parseInt(e.target.value)
                            )
                          }
                        >
                          <option value="30">30 Points</option>
                          <option value="50">50 Points</option>
                          <option value="null">Unlimited</option>
                        </select>
                      </div>

                      <div className="deck-info">
                        <p>📦 Deck Size: {roomState.deckSize} images</p>
                        {roomState.deckMode === "PLAYERS_ONLY" &&
                          roomState.deckSize < 100 && (
                            <p className="warning">
                              ⚠️ Need 100 images to start
                            </p>
                          )}
                      </div>

                      <div className="action-buttons">
                        <button
                          onClick={onStartGame}
                          disabled={
                            roomState.players.length < 3 ||
                            (roomState.deckMode === "PLAYERS_ONLY" &&
                              roomState.deckSize < 100)
                          }
                          className="btn-primary btn-large"
                        >
                          🚀 Start Game
                        </button>
                        {roomState.deckLocked ? (
                          <button
                            onClick={onUnlockDeck}
                            className="btn-secondary"
                          >
                            Unlock Deck
                          </button>
                        ) : (
                          <button
                            onClick={onLockDeck}
                            className="btn-secondary"
                          >
                            Lock Deck
                          </button>
                        )}
                      </div>
                    </>
                  )}

                  {!isAdmin && (
                    <div
                      className="waiting-message"
                      style={{ marginTop: "2rem" }}
                    >
                      <p>⏳ Waiting for admin to start the game...</p>
                    </div>
                  )}
                </div>
              )}

              {/* STORYTELLER_CHOICE */}
              {roomState.phase === "STORYTELLER_CHOICE" && isStoryteller && (
                <div className="modal-section storyteller-modal">
                  <h2>🎭 You are the Storyteller!</h2>
                  <p>Choose a card and provide a clue</p>

                  <input
                    type="text"
                    placeholder="Enter your clue..."
                    value={clue}
                    onChange={(e) => setClue(e.target.value)}
                    maxLength={200}
                    className="clue-input"
                    autoFocus
                  />

                  <div className="modal-hand">
                    <HandView
                      hand={playerState?.hand || []}
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
              )}

              {/* PLAYERS_CHOICE */}
              {roomState.phase === "PLAYERS_CHOICE" &&
                !isStoryteller &&
                !playerState?.mySubmittedCardId && (
                  <div className="modal-section player-choice-modal">
                    <h2>✍️ Choose Your Card</h2>
                    <p>Pick a card that matches the clue</p>

                    <div className="modal-hand">
                      <HandView
                        hand={playerState?.hand || []}
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
                  </div>
                )}

              {/* VOTING */}
              {roomState.phase === "VOTING" &&
                !isStoryteller &&
                !playerState?.myVote && (
                  <div className="modal-section voting-modal">
                    <h2>🗳️ Vote for the Storyteller's Card</h2>
                    <p>Which card do you think belongs to the storyteller?</p>
                    <p className="hint">(You cannot vote for your own card)</p>

                    <div className="modal-voting-cards">
                      <VotingView
                        revealedCards={roomState.revealedCards}
                        selectedCardId={selectedCardId}
                        onSelectCard={setSelectedCardId}
                        myCardId={playerState?.mySubmittedCardId || undefined}
                      />
                    </div>

                    <button
                      onClick={handleVote}
                      disabled={!selectedCardId}
                      className="btn-primary btn-large"
                    >
                      Vote
                    </button>
                  </div>
                )}

              {/* SCORING */}
              {roomState.phase === "SCORING" && (
                <div className="modal-section scoring-modal">
                  <h2>🏆 Round Results</h2>
                  <p>Scores have been updated on the board!</p>

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

                  <button
                    onClick={() => {
                      onAdvanceRound();
                      setShowModal(false);
                    }}
                    className="btn-primary btn-large"
                  >
                    Next Round →
                  </button>
                  <button
                    onClick={() => setShowModal(false)}
                    className="btn-secondary"
                  >
                    Close (View Board)
                  </button>
                </div>
              )}

              {/* GAME_END */}
              {roomState.phase === "GAME_END" && (
                <div className="modal-section game-end-modal">
                  <div className="winner-crown">👑</div>
                  <h2>Game Over!</h2>

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

                        {isAdmin && (
                          <div className="game-end-actions">
                            <button
                              onClick={onResetGame}
                              className="btn-primary"
                            >
                              Reset Game
                            </button>
                            <button
                              onClick={onNewDeck}
                              className="btn-secondary"
                            >
                              New Deck
                            </button>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
