import { useState, useEffect } from "react";
import { RoomState, PlayerState } from "../hooks/useGameState";
import { GameBoard } from "../components/GameBoard";
import { HandView } from "../components/HandView";
import { VotingView } from "../components/VotingView";
import { QRCode } from "../components/QRCode";
import { DeckUploader } from "../components/DeckUploader";

interface UnifiedGamePageProps {
  roomState: RoomState | null;
  playerState: PlayerState | null;
  playerId: string;
  clientId: string;
  socket: any;
  onJoin: (name: string, clientId: string) => void;
  onJoinSpectator: (clientId: string) => void;
  onLeave: () => void;
  onUploadImage: (imageData: string) => void;
  onDeleteImage: (imageId: string) => void;
  onSetAllowPlayerUploads: (allow: boolean) => void;
  onStartGame: () => void;
  onChangeName: (newName: string) => void;
  onStorytellerSubmit: (cardId: string, clue: string) => void;
  onPlayerSubmitCard: (cardId: string) => void;
  onPlayerVote: (cardId: string) => void;
  onAdvanceRound: () => void;
  onResetGame: () => void;
  onNewDeck: () => void;
}

export function UnifiedGamePage({
  roomState,
  playerState,
  playerId,
  clientId,
  socket,
  onJoin,
  onJoinSpectator,
  onLeave,
  onUploadImage: _onUploadImage,
  onDeleteImage: _onDeleteImage,
  onSetAllowPlayerUploads,
  onStartGame,
  onChangeName: _onChangeName,
  onStorytellerSubmit,
  onPlayerSubmitCard,
  onPlayerVote,
  onAdvanceRound: _onAdvanceRound,
  onResetGame,
  onNewDeck,
}: UnifiedGamePageProps) {
  const [name, setName] = useState("");
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [clue, setClue] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<"settings" | "cards">("cards");
  const [detectedServerUrl, setDetectedServerUrl] = useState<string | null>(
    null
  );
  // Track locally submitted cards for locking UI
  const [localSubmittedCardId, setLocalSubmittedCardId] = useState<
    string | null
  >(null);
  const [localSubmittedClue, setLocalSubmittedClue] = useState<string>("");
  // Track local vote for locking UI
  const [localVotedCardId, setLocalVotedCardId] = useState<string | null>(null);
  // Track if we should trigger board animation (when closing REVEAL modal)
  const [triggerBoardAnimation, setTriggerBoardAnimation] = useState(false);
  // Track if user chose to be a spectator
  const [isUserSpectator, setIsUserSpectator] = useState(false);
  // Track name editing state - which player ID is being edited
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");

  // Detect demo mode (no socket connection)
  const isDemoMode = socket === null;

  // Fetch server URL on mount (for cases where we need it before roomState is available)
  useEffect(() => {
    if (!isDemoMode) {
      fetch("/api/server-info")
        .then((res) => res.json())
        .then((data) => setDetectedServerUrl(data.serverUrl))
        .catch((err) => console.warn("Could not fetch server URL:", err));
    }
  }, [isDemoMode]);

  // Auto-open modal for REVEAL and VOTING phases
  useEffect(() => {
    if (["REVEAL", "VOTING"].includes(roomState?.phase || "")) {
      setModalType("cards");
      setShowModal(true);
    }
    // Reset animation trigger when phase changes away from REVEAL
    if (roomState?.phase !== "REVEAL") {
      setTriggerBoardAnimation(false);
    }
  }, [roomState?.phase]);

  // Reset local submission state when phase changes
  useEffect(() => {
    const phase = roomState?.phase;
    // Clear local submissions when leaving STORYTELLER_CHOICE or PLAYERS_CHOICE
    if (phase !== "STORYTELLER_CHOICE") {
      setLocalSubmittedCardId(null);
      setLocalSubmittedClue("");
    }
    if (phase !== "PLAYERS_CHOICE") {
      setLocalSubmittedCardId(null);
    }
    // Clear local vote when leaving VOTING phase
    if (phase !== "VOTING") {
      setLocalVotedCardId(null);
    }
  }, [roomState?.phase]);

  const isSpectator = isUserSpectator;
  const isJoined =
    roomState &&
    (isSpectator || roomState.players.some((p) => p.id === playerId));
  const isInGame =
    roomState &&
    [
      "STORYTELLER_CHOICE",
      "PLAYERS_CHOICE",
      "VOTING",
      "REVEAL",
      "SCORING",
      "GAME_END",
    ].includes(roomState.phase);
  const myPlayer = roomState?.players.find((p) => p.id === playerId);
  const isAdmin = myPlayer?.isAdmin || false;
  const isStoryteller = roomState?.storytellerId === playerId;

  // Auto-join spectators when they connect
  useEffect(() => {
    if (!isDemoMode && isSpectator && socket?.connected && !isJoined) {
      // Auto-join spectator
      socket.emit("joinSpectator", { clientId });
      console.log("Auto-joining as spectator");
    }
  }, [isDemoMode, isSpectator, socket, isJoined, clientId]);

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onJoin(name.trim(), clientId);
    }
  };

  const handleSpectatorJoin = () => {
    setIsUserSpectator(true);
    onJoinSpectator(clientId);
  };

  const handleLogout = () => {
    // Count user's uploaded images
    const myImages =
      roomState?.deckImages.filter((img) => img.uploadedBy === playerId) || [];
    const imageCount = myImages.length;

    // Warning if user has uploaded images
    if (imageCount > 0) {
      const confirmed = window.confirm(
        `⚠️ Warning: You have ${imageCount} uploaded image${
          imageCount !== 1 ? "s" : ""
        } in the deck.\n\n` +
          `If you logout, these images will be permanently removed from the game.\n\n` +
          `Are you sure you want to logout?`
      );

      if (!confirmed) {
        return; // User cancelled logout
      }
    }

    // Emit leave event so server removes the player immediately
    onLeave();
    // Clear the stored clientId so they don't auto-rejoin
    localStorage.removeItem("dixit-clientId");
    // Reset spectator state
    setIsUserSpectator(false);
    // Small delay to ensure leave event is processed before reload
    setTimeout(() => {
      window.location.reload();
    }, 100);
  };

  const handleStartEditName = (playerId: string, currentName: string) => {
    setEditingPlayerId(playerId);
    setNewName(currentName);
  };

  const handleSaveName = () => {
    if (!newName.trim() || !editingPlayerId) return;

    // Check if name is unique (case-insensitive)
    const nameTaken = roomState?.players.some(
      (p) =>
        p.id !== editingPlayerId &&
        p.name.toLowerCase() === newName.trim().toLowerCase()
    );

    if (nameTaken) {
      alert("This name is already taken. Please choose a different name.");
      return;
    }

    if (newName.trim() !== myPlayer?.name) {
      console.log("Changing name to:", newName.trim());
      _onChangeName(newName.trim());
    }
    setEditingPlayerId(null);
    setNewName("");
  };

  const handleCancelEditName = () => {
    setEditingPlayerId(null);
    setNewName("");
  };

  const handleStorytellerSubmit = () => {
    if (selectedCardId && clue.trim()) {
      onStorytellerSubmit(selectedCardId, clue.trim());
      // Store locally for UI locking
      setLocalSubmittedCardId(selectedCardId);
      setLocalSubmittedClue(clue.trim());
      setSelectedCardId(null);
      setClue("");
      setShowModal(false);
    }
  };

  const handlePlayerSubmit = () => {
    if (selectedCardId) {
      onPlayerSubmitCard(selectedCardId);
      // Store locally for UI locking
      setLocalSubmittedCardId(selectedCardId);
      setSelectedCardId(null);
      setShowModal(false);
    }
  };

  const handleVote = () => {
    if (selectedCardId) {
      onPlayerVote(selectedCardId);
      // Store locally for UI locking
      setLocalVotedCardId(selectedCardId);
      setSelectedCardId(null);
      // Keep modal open after voting
    }
  };

  const openCards = () => {
    setModalType("cards");
    setShowModal(true);
  };

  // JOIN SCREEN (before joining)
  if (!isJoined) {
    // Get server URL with priority: roomState > detected from API > current location
    const serverUrl =
      roomState?.serverUrl || detectedServerUrl || window.location.origin;

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
                onClick={handleSpectatorJoin}
                className="btn-secondary btn-large"
              >
                👀 Join as Spectator
              </button>
            </div>

            <div className="qr-code-section">
              <p className="qr-hint">Scan to join on mobile</p>
              <QRCode url={serverUrl} size={180} />
              <p className="qr-url">{serverUrl}</p>
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
        <GameBoard
          roomState={roomState}
          triggerAnimation={triggerBoardAnimation}
        />

        {/* Revealed Cards Display (during REVEAL and VOTING) */}
        {["REVEAL", "VOTING"].includes(roomState.phase) &&
          roomState.revealedCards.length > 0 && (
            <div className="board-revealed-cards">
              <VotingView
                revealedCards={roomState.revealedCards}
                selectedCardId={null}
                onSelectCard={() => {}}
                disabled={true}
                votes={
                  roomState.phase === "REVEAL" ? roomState.votes : undefined
                }
              />
            </div>
          )}
      </div>

      {/* Floating Action Buttons - For Players (not spectators) */}
      {isJoined && !isSpectator && (
        <>
          {/* Cards Button - All Players */}
          <button
            className={`floating-action-button cards-button ${
              showModal && modalType === "cards" ? "hidden" : ""
            }`}
            onClick={openCards}
          >
            {!isInGame && "👥 Players"}
            {roomState.phase === "STORYTELLER_CHOICE" && "🎭 My Cards"}
            {roomState.phase === "PLAYERS_CHOICE" && "🃏 Choose Card"}
            {roomState.phase === "VOTING" && "🗳️ Vote"}
            {roomState.phase === "REVEAL" && "🎨 Results"}
            {roomState.phase === "GAME_END" && "🏆 Results"}
          </button>
        </>
      )}

      {/* Floating Action Buttons - For Spectators (only in deck building) */}
      {isJoined && isSpectator && !isInGame && (
        <button
          className={`floating-action-button cards-button ${
            showModal && modalType === "cards" ? "hidden" : ""
          }`}
          onClick={openCards}
        >
          👥 Players
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
              {/* CARDS MODAL - Game Actions */}
              {modalType === "cards" && (
                <>
                  {/* LOBBY - Before game starts, show player list (for both players and spectators) */}
                  {!isInGame && (
                    <div className="modal-section lobby-modal">
                      <h2>👥 Players ({roomState.players.length})</h2>

                      <div className="players-grid">
                        {roomState.players.map((player) => {
                          const isMe = player.id === playerId;
                          const isEditing = editingPlayerId === player.id;

                          return (
                            <div
                              key={player.id}
                              className={`player-card ${isMe ? "you" : ""}`}
                            >
                              {isEditing ? (
                                // Inline edit mode
                                <div className="player-name-edit">
                                  <input
                                    type="text"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    placeholder="Enter new name"
                                    maxLength={50}
                                    autoFocus
                                    className="name-input-inline"
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") handleSaveName();
                                      if (e.key === "Escape")
                                        handleCancelEditName();
                                    }}
                                  />
                                  <div className="name-edit-actions">
                                    <button
                                      onClick={handleSaveName}
                                      disabled={!newName.trim()}
                                      className="btn-icon btn-save"
                                      title="Save"
                                    >
                                      ✓
                                    </button>
                                    <button
                                      onClick={handleCancelEditName}
                                      className="btn-icon btn-cancel"
                                      title="Cancel"
                                    >
                                      ✕
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                // Normal display mode
                                <div className="player-info">
                                  <span
                                    className={`player-name ${
                                      isMe && !isSpectator ? "editable" : ""
                                    }`}
                                    onClick={() =>
                                      isMe && !isSpectator
                                        ? handleStartEditName(
                                            player.id,
                                            player.name
                                          )
                                        : null
                                    }
                                    title={
                                      isMe && !isSpectator
                                        ? "Click to edit your name"
                                        : ""
                                    }
                                  >
                                    {player.name}
                                  </span>
                                  {isMe && (
                                    <span className="you-badge">(You)</span>
                                  )}
                                  {player.isAdmin && (
                                    <span className="admin-badge">👑</span>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Image Upload Section - Available to everyone (including spectators) */}
                      <div style={{ marginTop: "2rem" }}>
                        <h2>🖼️ Deck Images</h2>

                        <DeckUploader
                          roomState={roomState}
                          playerId={playerId}
                          onUpload={_onUploadImage}
                          onDelete={_onDeleteImage}
                          onSetAllowPlayerUploads={onSetAllowPlayerUploads}
                        />
                      </div>

                      {!isSpectator && (
                        <p style={{ color: "#95a5a6", marginTop: "1rem" }}>
                          {isAdmin
                            ? "Upload images and start when ready!"
                            : "⏳ Waiting for admin to start the game..."}
                        </p>
                      )}
                      {isSpectator && (
                        <p style={{ color: "#95a5a6", marginTop: "1rem" }}>
                          👁️ Spectating - You can upload images to help build
                          the deck!
                        </p>
                      )}

                      {/* Admin Start Button */}
                      {isAdmin && (
                        <button
                          onClick={onStartGame}
                          disabled={
                            roomState.players.length < 3 ||
                            roomState.deckSize < 100
                          }
                          className="btn-primary btn-large"
                          style={{ marginTop: "1rem", width: "100%" }}
                        >
                          🚀 Start Game
                        </button>
                      )}

                      {/* Logout Button - For all users */}
                      <button
                        onClick={handleLogout}
                        className="btn-secondary"
                        style={{ marginTop: "1rem", width: "100%" }}
                      >
                        🚪 Logout & Return to Join Screen
                      </button>
                    </div>
                  )}

                  {/* STORYTELLER_CHOICE */}
                  {roomState.phase === "STORYTELLER_CHOICE" && (
                    <>
                      {isStoryteller && !localSubmittedCardId && (
                        <div className="modal-section storyteller-modal">
                          <h2>🎭 You are the Storyteller!</h2>
                          <p>Choose a card and provide a clue</p>

                          <div className="modal-hand">
                            <HandView
                              hand={playerState?.hand || []}
                              selectedCardId={selectedCardId}
                              onSelectCard={setSelectedCardId}
                            />
                          </div>

                          <div className="clue-submit-row">
                            <input
                              type="text"
                              placeholder="Enter your clue..."
                              value={clue}
                              onChange={(e) => setClue(e.target.value)}
                              maxLength={200}
                              className="clue-input-inline"
                              autoFocus
                            />
                            <button
                              onClick={handleStorytellerSubmit}
                              disabled={!selectedCardId || !clue.trim()}
                              className="btn-primary btn-inline"
                            >
                              Submit
                            </button>
                          </div>
                        </div>
                      )}
                      {isStoryteller && localSubmittedCardId && (
                        <div className="modal-section storyteller-modal">
                          <h2>✅ Card Submitted</h2>
                          <p>Waiting for other players...</p>
                          <p className="clue-reminder">
                            Your clue: <strong>"{localSubmittedClue}"</strong>
                          </p>

                          <div className="modal-hand">
                            <HandView
                              hand={playerState?.hand || []}
                              selectedCardId={localSubmittedCardId}
                              onSelectCard={() => {}}
                              lockedCardId={localSubmittedCardId}
                            />
                          </div>
                        </div>
                      )}
                      {!isStoryteller && (
                        <div className="modal-section waiting-modal">
                          <h2>⏳ Waiting for Storyteller</h2>
                          <p>
                            The storyteller is choosing a card and providing a
                            clue...
                          </p>

                          <div className="modal-hand">
                            <HandView
                              hand={playerState?.hand || []}
                              selectedCardId={null}
                              onSelectCard={() => {}}
                            />
                          </div>

                          <p style={{ color: "#95a5a6", fontSize: "0.85rem" }}>
                            Once they submit, you'll choose a card that matches
                            their clue.
                          </p>
                        </div>
                      )}
                    </>
                  )}

                  {/* PLAYERS_CHOICE */}
                  {roomState.phase === "PLAYERS_CHOICE" && (
                    <>
                      {!isStoryteller && !localSubmittedCardId && (
                        <div className="modal-section player-choice-modal">
                          <h2>✍️ Choose Your Card</h2>
                          <p>Pick a card that matches the clue</p>
                          <p className="clue-reminder">
                            The clue: <strong>"{roomState.currentClue}"</strong>
                          </p>

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
                      {!isStoryteller && localSubmittedCardId && (
                        <div className="modal-section waiting-modal">
                          <h2>✅ Card Submitted</h2>
                          <p>
                            Waiting for other players to submit their cards...
                          </p>
                          <p className="clue-reminder">
                            The clue: <strong>"{roomState.currentClue}"</strong>
                          </p>

                          <div className="modal-hand">
                            <HandView
                              hand={playerState?.hand || []}
                              selectedCardId={localSubmittedCardId}
                              onSelectCard={() => {}}
                              lockedCardId={localSubmittedCardId}
                            />
                          </div>
                        </div>
                      )}
                      {isStoryteller && (
                        <div className="modal-section waiting-modal">
                          <h2>⏳ Waiting for Players</h2>
                          <p>
                            Other players are choosing cards that match your
                            clue...
                          </p>
                          <p className="clue-reminder">
                            Your clue:{" "}
                            <strong>"{roomState.currentClue}"</strong>
                          </p>

                          <div className="modal-hand">
                            <HandView
                              hand={playerState?.hand || []}
                              selectedCardId={null}
                              onSelectCard={() => {}}
                            />
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* REVEAL - Show who drew and voted, admin continues */}
                  {roomState.phase === "REVEAL" &&
                    (() => {
                      // Get storyteller card info for display
                      const storytellerId = roomState.storytellerId;
                      const storytellerCard = roomState.revealedCards.find(
                        (card) => (card as any).playerId === storytellerId
                      );
                      const storytellerCardId = storytellerCard?.cardId;

                      // Use server-calculated score deltas
                      const scoreDeltas: { [playerId: string]: number } = {};
                      roomState.lastScoreDeltas.forEach((delta) => {
                        scoreDeltas[delta.playerId] = delta.delta;
                      });

                      return (
                        <div className="modal-section reveal-modal">
                          <h2>🎨 Results Revealed!</h2>
                          <p className="clue-reminder">
                            The clue: <strong>"{roomState.currentClue}"</strong>
                          </p>
                          <p style={{ color: "#95a5a6", fontSize: "0.9rem" }}>
                            See who drew each card and who voted for them
                          </p>

                          <div className="modal-voting-cards">
                            <VotingView
                              revealedCards={roomState.revealedCards}
                              selectedCardId={null}
                              onSelectCard={() => {}}
                              myCardId={
                                playerState?.mySubmittedCardId || undefined
                              }
                              disabled={true}
                              votes={roomState.votes}
                              players={roomState.players}
                              cardOwners={roomState.revealedCards.map(
                                (card) => ({
                                  cardId: card.cardId,
                                  playerId: (card as any).playerId || "unknown",
                                })
                              )}
                              storytellerCardId={storytellerCardId || null}
                              showResults={true}
                              scoreDeltas={scoreDeltas}
                            />
                          </div>

                          {/* Admin button to continue to next round */}
                          {isAdmin && (
                            <button
                              onClick={() => {
                                if (socket) {
                                  socket.emit("advanceRound");
                                }
                              }}
                              className="btn-primary btn-large"
                              style={{ marginTop: "1rem" }}
                            >
                              ▶️ Continue to Next Round
                            </button>
                          )}

                          {/* Non-admin waiting message */}
                          {!isAdmin && (
                            <p
                              style={{
                                marginTop: "1rem",
                                color: "#95a5a6",
                                fontStyle: "italic",
                              }}
                            >
                              ⏳ Waiting for admin to continue...
                            </p>
                          )}

                          <button
                            onClick={() => {
                              setShowModal(false);
                              // Trigger board animation when closing reveal
                              if (roomState.phase === "REVEAL") {
                                setTriggerBoardAnimation(true);
                              }
                            }}
                            className="btn-secondary"
                          >
                            Close (View Board)
                          </button>
                        </div>
                      );
                    })()}

                  {/* VOTING */}
                  {roomState.phase === "VOTING" &&
                    (() => {
                      // Calculate if all eligible players have voted
                      const eligiblePlayers = roomState.players.filter(
                        (p) => p.id !== roomState.storytellerId
                      );
                      const allVotesIn =
                        roomState.votes.length >= eligiblePlayers.length;
                      const hasVoted = localVotedCardId !== null;
                      const canVote =
                        !isStoryteller && !isSpectator && !hasVoted;

                      return (
                        <div className="modal-section voting-modal">
                          {canVote && (
                            <h2>🗳️ Vote for the Storyteller's Card</h2>
                          )}
                          {hasVoted && !allVotesIn && (
                            <h2>✅ Waiting for Others to Vote</h2>
                          )}
                          {allVotesIn && <h2>📊 All Votes Are In!</h2>}
                          {isStoryteller && !allVotesIn && (
                            <h2>👁️ Watching the Vote</h2>
                          )}
                          {isStoryteller && allVotesIn && (
                            <h2>📊 All Votes Are In!</h2>
                          )}
                          {isSpectator && <h2>👁️ Spectating</h2>}

                          <p className="clue-reminder">
                            The clue: <strong>"{roomState.currentClue}"</strong>
                          </p>

                          {canVote && (
                            <p className="hint">
                              Click a card to vote (you cannot vote for your
                              own)
                            </p>
                          )}

                          <div className="modal-voting-cards">
                            <VotingView
                              revealedCards={roomState.revealedCards}
                              selectedCardId={canVote ? selectedCardId : null}
                              onSelectCard={
                                canVote ? setSelectedCardId : () => {}
                              }
                              myCardId={
                                playerState?.mySubmittedCardId || undefined
                              }
                              disabled={!canVote}
                              showResults={false}
                              lockedCardId={
                                hasVoted ? localVotedCardId : undefined
                              }
                            />
                          </div>

                          {canVote && (
                            <button
                              onClick={handleVote}
                              disabled={!selectedCardId}
                              className="btn-primary btn-large"
                            >
                              Submit Vote
                            </button>
                          )}

                          {hasVoted && !allVotesIn && (
                            <p style={{ color: "#95a5a6", marginTop: "1rem" }}>
                              Waiting for other players to vote...
                            </p>
                          )}
                        </div>
                      );
                    })()}

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
                                  <span className="score">
                                    {player.score} pts
                                  </span>
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
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
