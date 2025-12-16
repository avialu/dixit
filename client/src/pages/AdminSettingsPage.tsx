import { useNavigate } from "react-router-dom";
import { RoomState } from "../hooks/useGameState";
import { useEffect } from "react";

interface AdminSettingsPageProps {
  roomState: RoomState | null;
  playerId: string;
  onSetDeckMode: (mode: string) => void;
  onSetWinTarget: (target: number | null) => void;
}

export function AdminSettingsPage({
  roomState,
  playerId,
  onSetDeckMode,
  onSetWinTarget,
}: AdminSettingsPageProps) {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect if not in lobby phases (waiting for players or deck building)
    if (
      roomState &&
      roomState.phase !== "DECK_BUILDING" &&
      roomState.phase !== "WAITING_FOR_PLAYERS"
    ) {
      navigate("/lobby");
    }
  }, [roomState, navigate]);

  if (!roomState) {
    return <div className="loading">Loading...</div>;
  }

  const isAdmin =
    roomState.players.find((p) => p.id === playerId)?.isAdmin || false;

  // If not admin, redirect to lobby
  if (!isAdmin) {
    navigate("/lobby");
    return null;
  }

  return (
    <div className="admin-settings-page">
      <div className="settings-container">
        <div className="settings-header">
          <h1>⚙️ Game Settings</h1>
          <button onClick={() => navigate("/lobby")} className="btn-secondary">
            ← Back to Lobby
          </button>
        </div>

        <div className="settings-content">
          {/* Deck Mode Settings */}
          <div className="setting-section">
            <h2>Image Upload Mode</h2>
            <p className="setting-description">
              Choose who can upload images for the game deck.
            </p>

            <div className="setting-options">
              <label className="radio-option">
                <input
                  type="radio"
                  name="deckMode"
                  value="HOST_ONLY"
                  checked={roomState.deckMode === "HOST_ONLY"}
                  onChange={(e) => onSetDeckMode(e.target.value)}
                  disabled={roomState.deckLocked}
                />
                <div>
                  <strong>Host Only</strong>
                  <p>Only you (the admin) can upload images</p>
                </div>
              </label>

              <label className="radio-option">
                <input
                  type="radio"
                  name="deckMode"
                  value="PLAYERS_ONLY"
                  checked={roomState.deckMode === "PLAYERS_ONLY"}
                  onChange={(e) => onSetDeckMode(e.target.value)}
                  disabled={roomState.deckLocked}
                />
                <div>
                  <strong>Players Only</strong>
                  <p>Only players (not you) can upload images</p>
                </div>
              </label>

              <label className="radio-option">
                <input
                  type="radio"
                  name="deckMode"
                  value="MIXED"
                  checked={roomState.deckMode === "MIXED"}
                  onChange={(e) => onSetDeckMode(e.target.value)}
                  disabled={roomState.deckLocked}
                />
                <div>
                  <strong>Mixed Mode</strong>
                  <p>Both host and players can upload images</p>
                </div>
              </label>
            </div>
          </div>

          {/* Win Condition Settings */}
          <div className="setting-section">
            <h2>Win Condition</h2>
            <p className="setting-description">
              Choose how the game ends. The game can end when a player reaches a
              target score, or when all cards are used.
            </p>

            <div className="setting-options">
              <label className="radio-option">
                <input
                  type="radio"
                  name="winTarget"
                  value="30"
                  checked={roomState.winTarget === 30}
                  onChange={(e) => onSetWinTarget(Number(e.target.value))}
                  disabled={roomState.deckLocked}
                />
                <div>
                  <strong>30 Points</strong>
                  <p>Game ends when a player reaches 30 points</p>
                </div>
              </label>

              <label className="radio-option">
                <input
                  type="radio"
                  name="winTarget"
                  value="50"
                  checked={roomState.winTarget === 50}
                  onChange={(e) => onSetWinTarget(Number(e.target.value))}
                  disabled={roomState.deckLocked}
                />
                <div>
                  <strong>50 Points</strong>
                  <p>Game ends when a player reaches 50 points</p>
                </div>
              </label>

              <label className="radio-option">
                <input
                  type="radio"
                  name="winTarget"
                  value="unlimited"
                  checked={roomState.winTarget === null}
                  onChange={() => onSetWinTarget(null)}
                  disabled={roomState.deckLocked}
                />
                <div>
                  <strong>Play Until Deck Runs Out</strong>
                  <p>Game ends only when all cards are used</p>
                </div>
              </label>
            </div>
          </div>

          {/* Game Requirements Info */}
          <div className="setting-section info-section">
            <h2>📋 Game Requirements</h2>
            <ul>
              <li>
                <strong>Minimum Players:</strong> 3 players required
              </li>
              <li>
                <strong>Minimum Images:</strong>{" "}
                {roomState.deckMode === "PLAYERS_ONLY"
                  ? "100 images required"
                  : "No minimum (default images available)"}
              </li>
              <li>
                <strong>Current Status:</strong> {roomState.players.length}{" "}
                players, {roomState.deckSize} images
              </li>
            </ul>
          </div>

          {roomState.deckLocked && (
            <div className="warning-box">
              ⚠️ Settings are locked. Return to lobby to unlock the deck if you
              need to change settings.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
