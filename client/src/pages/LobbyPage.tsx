import { useNavigate } from "react-router-dom";
import { RoomState } from "../hooks/useGameState";
import { PlayerList } from "../components/PlayerList";
import { DeckUploader } from "../components/DeckUploader";
import { QRCode } from "../components/QRCode";
import { useEffect, useState } from "react";

interface LobbyPageProps {
  roomState: RoomState | null;
  playerId: string;
  onUploadImage: (imageData: string) => void;
  onDeleteImage: (imageId: string) => void;
  onSetDeckMode: (mode: string) => void;
  onLockDeck: () => void;
  onUnlockDeck: () => void;
  onStartGame: () => void;
  onChangeName: (newName: string) => void;
  onKickPlayer: (playerId: string) => void;
  onPromotePlayer: (playerId: string) => void;
}

export function LobbyPage({
  roomState,
  playerId,
  onUploadImage,
  onDeleteImage,
  onSetDeckMode,
  onLockDeck,
  onUnlockDeck,
  onStartGame,
  onChangeName,
  onKickPlayer,
  onPromotePlayer,
}: LobbyPageProps) {
  const navigate = useNavigate();
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState("");
  const [nameError, setNameError] = useState("");

  useEffect(() => {
    if (roomState?.phase === "STORYTELLER_CHOICE") {
      navigate("/game");
    }
  }, [roomState?.phase, navigate]);

  if (!roomState) {
    return <div className="loading">Loading...</div>;
  }

  const isAdmin =
    roomState.players.find((p) => p.id === playerId)?.isAdmin || false;

  // Minimum images required based on deck mode
  // PLAYERS_ONLY: 100 images, HOST_ONLY/MIXED: no minimum (can use default images)
  const minImagesRequired = roomState.deckMode === "PLAYERS_ONLY" ? 100 : 0;
  const hasEnoughImages = roomState.deckSize >= minImagesRequired;
  const canStart = hasEnoughImages && roomState.players.length >= 3;

  const currentPlayer = roomState.players.find((p) => p.id === playerId);
  // Use server URL (LAN IP) for QR code, fallback to current location
  const joinUrl = roomState.serverUrl || window.location.origin;

  // Check if player should see limited view (non-admin in HOST_ONLY mode)
  const isLimitedView = !isAdmin && roomState.deckMode === "HOST_ONLY";

  const handleNameChange = () => {
    if (!newName.trim()) {
      setNameError("Name cannot be empty");
      return;
    }

    if (newName.trim().toLowerCase() === currentPlayer?.name.toLowerCase()) {
      setIsEditingName(false);
      setNameError("");
      return;
    }

    // Check if name is taken by another player (client-side validation)
    const nameTaken = roomState.players.some(
      (p) =>
        p.id !== playerId &&
        p.name.toLowerCase() === newName.trim().toLowerCase()
    );

    if (nameTaken) {
      setNameError("Name is already taken");
      return;
    }

    onChangeName(newName.trim());
    setIsEditingName(false);
    setNameError("");
  };

  const startEditingName = () => {
    setNewName(currentPlayer?.name || "");
    setIsEditingName(true);
    setNameError("");
  };

  return (
    <div className="lobby-page">
      <h1>Game Lobby</h1>

      <div className="phase-indicator">
        Phase: {roomState.phase.replace(/_/g, " ")}
      </div>

      <div className="lobby-content">
        {isLimitedView ? (
          // Limited view for non-admin players in HOST_ONLY mode
          <>
            <div className="lobby-left" style={{ flex: 1 }}>
              <PlayerList
                players={roomState.players}
                currentPlayerId={playerId}
                isAdmin={isAdmin}
                showScores={false}
                onKickPlayer={onKickPlayer}
                onPromotePlayer={onPromotePlayer}
              />

              <div
                style={{
                  marginTop: "20px",
                  padding: "15px",
                  background: "#2a2a3e",
                  borderRadius: "8px",
                  textAlign: "center",
                }}
              >
                <p
                  style={{
                    fontSize: "18px",
                    color: "#f39c12",
                    marginBottom: "10px",
                    fontWeight: "bold",
                  }}
                >
                  ⏳ Waiting for the admin to start the game
                </p>
                <p
                  style={{
                    fontSize: "14px",
                    color: "#95a5a6",
                    marginBottom: "5px",
                  }}
                >
                  The host is building the deck...
                </p>
                <p style={{ fontSize: "14px", color: "#95a5a6" }}>
                  Deck Progress: {roomState.deckSize} / 100 images
                </p>
                {roomState.players.length < 3 && (
                  <p
                    style={{
                      fontSize: "14px",
                      color: "#e74c3c",
                      marginTop: "10px",
                    }}
                  >
                    Need {3 - roomState.players.length} more player(s) to start
                  </p>
                )}
              </div>
            </div>

            <div className="lobby-right">
              <div className="join-info">
                <h3>Players Join Here:</h3>
                <div className="qr-code">
                  <QRCode url={joinUrl} size={180} />
                </div>
                <div className="join-url">{joinUrl}</div>
              </div>
            </div>
          </>
        ) : (
          // Full view for admin or non-HOST_ONLY modes
          <>
            <div className="lobby-left">
              {/* Player Info & Name Change */}
              <div
                className="player-info-section"
                style={{
                  marginBottom: "20px",
                  padding: "15px",
                  background: "#2a2a3e",
                  borderRadius: "8px",
                }}
              >
                <h3>Your Info</h3>
                {!isEditingName ? (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                    }}
                  >
                    <span style={{ fontSize: "16px", fontWeight: "bold" }}>
                      {currentPlayer?.name} {currentPlayer?.isAdmin && "👑"}
                    </span>
                    <button
                      onClick={startEditingName}
                      className="btn-secondary btn-small"
                      style={{ padding: "4px 12px", fontSize: "12px" }}
                    >
                      Change Name
                    </button>
                  </div>
                ) : (
                  <div>
                    <div
                      style={{
                        display: "flex",
                        gap: "10px",
                        marginBottom: "5px",
                      }}
                    >
                      <input
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        maxLength={50}
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleNameChange();
                          if (e.key === "Escape") {
                            setIsEditingName(false);
                            setNameError("");
                          }
                        }}
                        style={{ flex: 1 }}
                      />
                      <button
                        onClick={handleNameChange}
                        className="btn-primary btn-small"
                        style={{ padding: "4px 12px" }}
                      >
                        Save
                      </button>
                      <button
                        onClick={() => {
                          setIsEditingName(false);
                          setNameError("");
                        }}
                        className="btn-secondary btn-small"
                        style={{ padding: "4px 12px" }}
                      >
                        Cancel
                      </button>
                    </div>
                    {nameError && (
                      <p
                        style={{
                          color: "#e74c3c",
                          fontSize: "12px",
                          margin: "5px 0 0 0",
                        }}
                      >
                        {nameError}
                      </p>
                    )}
                  </div>
                )}
              </div>

              <PlayerList
                players={roomState.players}
                currentPlayerId={playerId}
                isAdmin={isAdmin}
                showScores={false}
                onKickPlayer={onKickPlayer}
                onPromotePlayer={onPromotePlayer}
              />

              {isAdmin && (
                <div className="admin-controls">
                  <h3>Admin Controls</h3>

                  {(roomState.phase === "WAITING_FOR_PLAYERS" ||
                    roomState.phase === "DECK_BUILDING") && (
                    <button
                      onClick={() => navigate("/settings")}
                      className="btn-secondary"
                      style={{ marginBottom: "10px", width: "100%" }}
                    >
                      ⚙️ Game Settings
                    </button>
                  )}

                  {roomState.deckLocked &&
                    (roomState.phase === "WAITING_FOR_PLAYERS" ||
                      roomState.phase === "DECK_BUILDING") && (
                      <button
                        onClick={onUnlockDeck}
                        className="btn-secondary"
                        style={{ marginBottom: "10px", width: "100%" }}
                      >
                        🔓 Unlock Deck
                      </button>
                    )}

                  {(roomState.phase === "WAITING_FOR_PLAYERS" ||
                    roomState.phase === "DECK_BUILDING") && (
                    <>
                      <button
                        onClick={onStartGame}
                        disabled={!canStart}
                        className="btn-primary btn-large"
                        style={{ width: "100%" }}
                      >
                        {canStart
                          ? "🎮 Start Game"
                          : !hasEnoughImages && minImagesRequired > 0
                          ? `Need ${
                              minImagesRequired - roomState.deckSize
                            } more images`
                          : roomState.players.length < 3
                          ? "Need more players"
                          : "🎮 Start Game"}
                      </button>
                      {roomState.players.length < 3 && (
                        <p className="warning">Need at least 3 players</p>
                      )}
                      {!hasEnoughImages && minImagesRequired > 0 && (
                        <p className="warning">
                          Need {minImagesRequired - roomState.deckSize} more
                          images (PLAYERS_ONLY mode requires 100)
                        </p>
                      )}
                      {roomState.deckMode !== "PLAYERS_ONLY" &&
                        roomState.deckSize === 0 && (
                          <p
                            style={{
                              color: "#95a5a6",
                              fontSize: "14px",
                              marginTop: "10px",
                            }}
                          >
                            ℹ️ Default images will be used
                          </p>
                        )}
                    </>
                  )}

                  {roomState.phase !== "WAITING_FOR_PLAYERS" &&
                    roomState.phase !== "DECK_BUILDING" && (
                      <div
                        style={{
                          padding: "15px",
                          background: "#2a2a3e",
                          borderRadius: "8px",
                          textAlign: "center",
                        }}
                      >
                        <p style={{ color: "#95a5a6", margin: 0 }}>
                          Game is in progress. Return to lobby after game ends
                          to change settings.
                        </p>
                      </div>
                    )}
                </div>
              )}
            </div>

            <div className="lobby-center">
              {!isAdmin && (
                <div
                  style={{
                    marginBottom: "15px",
                    padding: "12px",
                    background: "#2a2a3e",
                    borderRadius: "8px",
                    textAlign: "center",
                  }}
                >
                  <p
                    style={{
                      fontSize: "16px",
                      color: "#f39c12",
                      margin: 0,
                      fontWeight: "bold",
                    }}
                  >
                    ⏳ Waiting for the admin to start the game
                  </p>
                </div>
              )}
              <DeckUploader
                roomState={roomState}
                playerId={playerId}
                onUpload={onUploadImage}
                onDelete={onDeleteImage}
                onSetMode={onSetDeckMode}
                onLock={onLockDeck}
              />
            </div>

            <div className="lobby-right">
              <div className="join-info">
                <h3>Players Join Here:</h3>
                <div className="qr-code">
                  <QRCode url={joinUrl} size={180} />
                </div>
                <div className="join-url">{joinUrl}</div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
