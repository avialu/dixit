import { RoomState, PlayerState } from "../hooks/useGameState";
import { CardView } from "../components/CardView";
import { DeckUploader } from "../components/DeckUploader";

// Types for modal content props
interface LobbyModalProps {
  roomState: RoomState;
  playerId: string;
  isSpectator: boolean;
  isAdmin: boolean;
  editingPlayerId: string | null;
  newName: string;
  setEditingPlayerId: (id: string | null) => void;
  setNewName: (name: string) => void;
  handleStartEditName: (playerId: string, currentName: string) => void;
  handleSaveName: () => void;
  handleCancelEditName: () => void;
  onUploadImage: (imageData: string) => void;
  onDeleteImage: (imageId: string) => void;
  onSetAllowPlayerUploads: (allow: boolean) => void;
  onStartGame: () => void;
  handleLogout: () => void;
}

interface StorytellerModalProps {
  playerState: PlayerState | null;
  selectedCardId: string | null;
  clue: string;
  localSubmittedCardId: string | null;
  localSubmittedClue: string;
  roomState: RoomState;
  setSelectedCardId: (id: string | null) => void;
  setClue: (clue: string) => void;
  handleStorytellerSubmit: () => void;
}

interface PlayerChoiceModalProps {
  playerState: PlayerState | null;
  selectedCardId: string | null;
  localSubmittedCardId: string | null;
  roomState: RoomState;
  setSelectedCardId: (id: string | null) => void;
  handlePlayerSubmit: () => void;
}

interface VotingModalProps {
  roomState: RoomState;
  playerState: PlayerState | null;
  selectedCardId: string | null;
  localVotedCardId: string | null;
  isStoryteller: boolean;
  isSpectator: boolean;
  setSelectedCardId: (id: string | null) => void;
  handleVote: () => void;
}

interface RevealModalProps {
  roomState: RoomState;
  playerState: PlayerState | null;
  isAdmin: boolean;
}

interface GameEndModalProps {
  roomState: RoomState;
  isAdmin: boolean;
  onResetGame: () => void;
  onNewDeck: () => void;
}

// Helper function to create Modal with consistent structure
export function LobbyModal(props: LobbyModalProps) {
  const {
    roomState,
    playerId,
    isSpectator,
    isAdmin,
    editingPlayerId,
    newName,
    setNewName,
    handleStartEditName,
    handleSaveName,
    handleCancelEditName,
    onUploadImage,
    onDeleteImage,
    onSetAllowPlayerUploads,
    onStartGame,
    handleLogout,
  } = props;

  const header = (
    <>
      <h2>👥 Players ({roomState.players.length})</h2>
    </>
  );

  const footer = (
    <>
      {isAdmin && (
        <button
          onClick={onStartGame}
          disabled={roomState.players.length < 3 || roomState.deckSize < 100}
          className="btn-primary btn-large"
        >
          🚀 Start Game
        </button>
      )}
      <button onClick={handleLogout} className="btn-secondary">
        🚪 Logout & Return to Join Screen
      </button>
    </>
  );

  return {
    header,
    footer,
    content: (
      <>
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
                        if (e.key === "Escape") handleCancelEditName();
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
                  <div className="player-info">
                    <span
                      className={`player-name ${
                        isMe && !isSpectator ? "editable" : ""
                      }`}
                      onClick={() =>
                        isMe && !isSpectator
                          ? handleStartEditName(player.id, player.name)
                          : null
                      }
                      title={
                        isMe && !isSpectator ? "Click to edit your name" : ""
                      }
                    >
                      {player.name}
                    </span>
                    {isMe && <span className="you-badge">(You)</span>}
                    {player.isAdmin && <span className="admin-badge">👑</span>}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: "2rem" }}>
          <h2>🖼️ Deck Images</h2>
          <DeckUploader
            roomState={roomState}
            playerId={playerId}
            onUpload={onUploadImage}
            onDelete={onDeleteImage}
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
            👁️ Spectating - You can upload images to help build the deck!
          </p>
        )}
      </>
    ),
  };
}

export function StorytellerChoiceModal(props: StorytellerModalProps) {
  const {
    playerState,
    selectedCardId,
    clue,
    localSubmittedCardId,
    localSubmittedClue,
    roomState,
    setSelectedCardId,
    setClue,
    handleStorytellerSubmit,
  } = props;

  const isSubmitted = localSubmittedCardId || playerState?.mySubmittedCardId;

  const header = (
    <>
      <h2>
        {isSubmitted ? "✅ Card Submitted" : "🎭 You are the Storyteller!"}
      </h2>
      {isSubmitted ? (
        <p>Waiting for other players...</p>
      ) : (
        <p>Choose a card and provide a clue</p>
      )}
    </>
  );

  const footer = !isSubmitted ? (
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
  ) : null;

  return {
    header,
    footer,
    content: (
      <>
        {isSubmitted && (localSubmittedClue || roomState.currentClue) && (
          <p className="clue-reminder">
            Your clue:{" "}
            <strong>"{localSubmittedClue || roomState.currentClue}"</strong>
          </p>
        )}

        {isSubmitted &&
          (() => {
            const submittedCardId =
              localSubmittedCardId || playerState?.mySubmittedCardId;
            const submittedCard = playerState?.hand.find(
              (c) => c.id === submittedCardId
            );
            return submittedCard ? (
              <div className="submitted-card-preview">
                <img
                  src={submittedCard.imageData}
                  alt="Your submitted card"
                  style={{
                    maxWidth: "100%",
                    maxHeight: "40vh",
                    borderRadius: "12px",
                    boxShadow: "0 8px 24px rgba(102, 126, 234, 0.4)",
                    border: "3px solid #667eea",
                  }}
                />
              </div>
            ) : null;
          })()}

        <div className="modal-hand">
          <CardView
            cards={playerState?.hand || []}
            selectedCardId={
              isSubmitted
                ? localSubmittedCardId || playerState?.mySubmittedCardId || null
                : selectedCardId
            }
            onSelectCard={isSubmitted ? () => {} : setSelectedCardId}
            lockedCardId={
              isSubmitted
                ? localSubmittedCardId || playerState?.mySubmittedCardId || null
                : null
            }
            showDrawer={false}
          />
        </div>
      </>
    ),
  };
}

export function PlayerChoiceModal(props: PlayerChoiceModalProps) {
  const {
    playerState,
    selectedCardId,
    localSubmittedCardId,
    roomState,
    setSelectedCardId,
    handlePlayerSubmit,
  } = props;

  const isSubmitted = localSubmittedCardId;

  const header = (
    <>
      <h2>{isSubmitted ? "✅ Card Submitted" : "✍️ Choose Your Card"}</h2>
      {isSubmitted ? (
        <p>Waiting for other players to submit their cards...</p>
      ) : (
        <p>Pick a card that matches the clue</p>
      )}
      <p className="clue-reminder">
        The clue: <strong>"{roomState.currentClue}"</strong>
      </p>
    </>
  );

  const footer = !isSubmitted ? (
    <button
      onClick={handlePlayerSubmit}
      disabled={!selectedCardId}
      className="btn-primary btn-large"
    >
      Submit Card
    </button>
  ) : null;

  return {
    header,
    footer,
    content: (
      <div className="modal-hand">
        <CardView
          cards={playerState?.hand || []}
          selectedCardId={isSubmitted ? localSubmittedCardId : selectedCardId}
          onSelectCard={isSubmitted ? () => {} : setSelectedCardId}
          lockedCardId={isSubmitted ? localSubmittedCardId : null}
          showDrawer={false}
        />
      </div>
    ),
  };
}

export function WaitingStorytellerModal(props: {
  playerState: PlayerState | null;
}) {
  const header = (
    <>
      <h2>⏳ Waiting for Storyteller</h2>
      <p>The storyteller is choosing a card and providing a clue...</p>
    </>
  );

  return {
    header,
    footer: null,
    content: (
      <>
        <div className="modal-hand">
          <CardView
            cards={props.playerState?.hand || []}
            selectedCardId={null}
            onSelectCard={() => {}}
            disabled={true}
            showDrawer={false}
          />
        </div>
        <p style={{ color: "#95a5a6", fontSize: "0.85rem" }}>
          Once they submit, you'll choose a card that matches their clue.
        </p>
      </>
    ),
  };
}

export function WaitingPlayersModal(props: {
  playerState: PlayerState | null;
  roomState: RoomState;
}) {
  const { playerState, roomState } = props;

  const header = (
    <>
      <h2>⏳ Waiting for Players</h2>
      <p>Other players are choosing cards that match your clue...</p>
      <p className="clue-reminder">
        Your clue: <strong>"{roomState.currentClue}"</strong>
      </p>
    </>
  );

  return {
    header,
    footer: null,
    content: (
      <>
        {playerState?.mySubmittedCardId &&
          (() => {
            const submittedCard = playerState?.hand.find(
              (c) => c.id === playerState.mySubmittedCardId
            );
            return submittedCard ? (
              <div className="submitted-card-preview">
                <img
                  src={submittedCard.imageData}
                  alt="Your submitted card"
                  style={{
                    maxWidth: "100%",
                    maxHeight: "35vh",
                    borderRadius: "12px",
                    boxShadow: "0 8px 24px rgba(102, 126, 234, 0.4)",
                    border: "3px solid #667eea",
                  }}
                />
              </div>
            ) : null;
          })()}

        <div className="modal-hand">
          <CardView
            cards={playerState?.hand || []}
            selectedCardId={playerState?.mySubmittedCardId || null}
            onSelectCard={() => {}}
            disabled={true}
            lockedCardId={playerState?.mySubmittedCardId || null}
            showDrawer={false}
          />
        </div>
      </>
    ),
  };
}

export function VotingModal(props: VotingModalProps) {
  const {
    roomState,
    playerState,
    selectedCardId,
    localVotedCardId,
    isStoryteller,
    isSpectator,
    setSelectedCardId,
    handleVote,
  } = props;

  const eligiblePlayers = roomState.players.filter(
    (p) => p.id !== roomState.storytellerId
  );
  const allVotesIn = roomState.votes.length >= eligiblePlayers.length;
  const hasVoted = localVotedCardId !== null;
  const canVote = !isStoryteller && !isSpectator && !hasVoted;

  const getHeaderTitle = () => {
    if (canVote) return "🗳️ Vote for the Storyteller's Card";
    if (hasVoted && !allVotesIn) return "✅ Waiting for Others to Vote";
    if (allVotesIn) return "📊 All Votes Are In!";
    if (isStoryteller && !allVotesIn) return "👁️ Watching the Vote";
    if (isStoryteller && allVotesIn) return "📊 All Votes Are In!";
    if (isSpectator) return "👁️ Spectating";
    return "🗳️ Voting Phase";
  };

  const header = (
    <>
      <h2>{getHeaderTitle()}</h2>
      <p className="clue-reminder">
        The clue: <strong>"{roomState.currentClue}"</strong>
      </p>
      {canVote && (
        <p className="hint">
          Click a card to vote (you cannot vote for your own)
        </p>
      )}
    </>
  );

  const footer = canVote ? (
    <button
      onClick={handleVote}
      disabled={!selectedCardId}
      className="btn-primary btn-large"
    >
      Submit Vote
    </button>
  ) : hasVoted && !allVotesIn ? (
    <p style={{ color: "#95a5a6", margin: 0 }}>
      Waiting for other players to vote...
    </p>
  ) : null;

  return {
    header,
    footer,
    content: (
      <div className="modal-voting-cards">
        <CardView
          cards={roomState.revealedCards}
          selectedCardId={canVote ? selectedCardId : null}
          onSelectCard={canVote ? setSelectedCardId : () => {}}
          disabled={!canVote}
          lockedCardId={hasVoted ? localVotedCardId : undefined}
          showDrawer={true}
          myCardId={playerState?.mySubmittedCardId || undefined}
          votes={roomState.votes}
          showResults={false}
        />
      </div>
    ),
  };
}

export function RevealModal(props: RevealModalProps) {
  const { roomState, playerState, isAdmin } = props;

  const storytellerId = roomState.storytellerId;
  const storytellerCard = roomState.revealedCards.find(
    (card) => (card as any).playerId === storytellerId
  );
  const storytellerCardId = storytellerCard?.cardId;

  const scoreDeltas: { [playerId: string]: number } = {};
  roomState.lastScoreDeltas.forEach((delta) => {
    scoreDeltas[delta.playerId] = delta.delta;
  });

  const header = (
    <>
      <h2>🎨 Results Revealed!</h2>
      <p className="clue-reminder">
        The clue: <strong>"{roomState.currentClue}"</strong>
      </p>
      <p style={{ color: "#95a5a6", fontSize: "0.9rem" }}>
        See who drew each card and who voted for them
      </p>
    </>
  );

  const footer = isAdmin ? (
    <p
      style={{
        color: "#4a90e2",
        fontStyle: "italic",
        fontWeight: "500",
        margin: 0,
      }}
    >
      💡 Close this popup to see the continue button
    </p>
  ) : (
    <p style={{ color: "#95a5a6", fontStyle: "italic", margin: 0 }}>
      ⏳ Waiting for admin to continue...
    </p>
  );

  return {
    header,
    footer,
    content: (
      <div className="modal-voting-cards">
        <CardView
          cards={roomState.revealedCards}
          selectedCardId={null}
          onSelectCard={() => {}}
          disabled={true}
          showDrawer={true}
          myCardId={playerState?.mySubmittedCardId || undefined}
          votes={roomState.votes}
          players={roomState.players}
          cardOwners={roomState.revealedCards.map((card) => ({
            cardId: card.cardId,
            playerId: (card as any).playerId || "unknown",
          }))}
          storytellerCardId={storytellerCardId || null}
          showResults={true}
          scoreDeltas={scoreDeltas}
        />
      </div>
    ),
  };
}

export function GameEndModal(props: GameEndModalProps) {
  const { roomState, isAdmin, onResetGame, onNewDeck } = props;

  const sortedPlayers = [...roomState.players].sort(
    (a, b) => b.score - a.score
  );
  const winner = sortedPlayers[0];
  const wonByTarget =
    roomState.winTarget !== null && winner.score >= roomState.winTarget;

  const header = (
    <>
      <div className="winner-crown">👑</div>
      <h2>Game Over!</h2>
      {wonByTarget && (
        <p className="winner-text">
          {winner.name} wins with {winner.score} points!
        </p>
      )}
    </>
  );

  const footer = isAdmin ? (
    <div className="game-end-actions">
      <button onClick={onResetGame} className="btn-primary">
        Reset Game
      </button>
      <button onClick={onNewDeck} className="btn-secondary">
        New Deck
      </button>
    </div>
  ) : null;

  return {
    header,
    footer,
    content: (
      <div className="final-scores-list">
        {sortedPlayers.map((player, index) => (
          <div
            key={player.id}
            className={`final-score-item ${index === 0 ? "winner" : ""}`}
          >
            <span className="rank">{index + 1}.</span>
            <span className="name">{player.name}</span>
            <span className="score">{player.score} pts</span>
          </div>
        ))}
      </div>
    ),
  };
}
