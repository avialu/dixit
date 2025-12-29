import { RoomState } from "../hooks/useGameState";
import { LanguageSelector } from "./LanguageSelector";
import {
  Button,
  Badge,
  PlayerToken,
  getPlayerColor,
  Icon,
  IconSize,
} from "./ui";
import {
  getPlayerLanguageOverride,
  setPlayerLanguage,
  hasPlayerLanguageOverride,
} from "../i18n";

interface AdminSettingsModalProps {
  roomState: RoomState;
  playerId: string;
  isAdmin: boolean;
  isInGame: boolean;
  onSetBoardPattern: (pattern: "snake" | "spiral") => void;
  onSetLanguage: (language: "en" | "he") => void;
  onSetWinTarget: (target: number) => void;
  onSetSoundEnabled: (enabled: boolean) => void;
  onKickPlayer: (playerId: string) => void;
  onPromotePlayer: (playerId: string) => void;
  onConfirmWinTargetChange?: (target: number, potentialWinners: string[]) => void;
  t: (key: string, values?: Record<string, string | number>) => string;
}

/**
 * Admin Settings Modal Content
 * 
 * Provides admin controls that are available throughout the game:
 * - Player management (kick/promote)
 * - Win target settings
 * - Language settings
 * - Board pattern settings
 * 
 * Note: Deck management and board background are only available in lobby
 * and are handled by the LobbyModal.
 */
export function AdminSettingsModal(props: AdminSettingsModalProps) {
  const {
    roomState,
    playerId,
    isAdmin,
    isInGame,
    onSetBoardPattern,
    onSetLanguage,
    onSetWinTarget,
    onSetSoundEnabled,
    onKickPlayer,
    onPromotePlayer,
    onConfirmWinTargetChange,
    t,
  } = props;

  // Helper to check if changing win target would end the game
  const handleWinTargetChange = (target: number) => {
    if (isInGame) {
      // Find players who would win with this new target
      const potentialWinners = roomState.players
        .filter((p) => p.score >= target)
        .map((p) => p.name);

      if (potentialWinners.length > 0 && onConfirmWinTargetChange) {
        // Ask for confirmation
        onConfirmWinTargetChange(target, potentialWinners);
        return;
      }
    }
    // No winners or not in game, proceed directly
    onSetWinTarget(target);
  };

  const header = null;
  const footer = null;

  return {
    header,
    footer,
    content: (
      <>
        {/* Player Management Section */}
        <div
          style={{
            marginBottom: "1.5rem",
            padding: "1rem",
            background: "rgba(255, 255, 255, 0.1)",
            borderRadius: "8px",
          }}
        >
          <h3 style={{ marginBottom: "1rem" }}>
            <Icon.People size={IconSize.medium} />{" "}
            {t("adminSettings.playerManagement")}
          </h3>
          <div className="players-grid">
            {roomState.players.map((player) => {
              const isMe = player.id === playerId;
              const isStoryteller = roomState.storytellerId === player.id;
              const canKick = isAdmin && !isMe && !(isStoryteller && isInGame);
              const canPromote = isAdmin && !isMe && !player.isAdmin;

              return (
                <div
                  key={player.id}
                  className={`player-card ${isMe ? "you" : ""}`}
                >
                  <PlayerToken
                    imageUrl={player.tokenImage}
                    playerColor={getPlayerColor(
                      roomState.players.findIndex((p) => p.id === player.id)
                    )}
                    playerName={player.name}
                    size="small"
                  />
                  <div className="player-info">
                    <span className="player-name">
                      {player.name}
                    </span>
                    {player.isAdmin && (
                      <Icon.Crown
                        size={IconSize.medium}
                        className="admin-crown-icon"
                        style={{ color: "#f1c40f" }}
                      />
                    )}
                    {isMe && <Badge variant="you" />}
                    {player.isAdmin && <Badge variant="admin" />}
                    {isStoryteller && isInGame && <Badge variant="storyteller" />}

                    {/* Admin controls */}
                    {isAdmin && !isMe && (
                      <div className="admin-controls">
                        {canPromote && (
                          <Button
                            variant="icon"
                            onClick={() => onPromotePlayer(player.id)}
                            title={t("lobby.makeAdmin")}
                            className="btn-make-admin"
                          >
                            <Icon.Crown size={IconSize.small} />
                          </Button>
                        )}
                        {canKick && (
                          <Button
                            variant="icon"
                            onClick={() => onKickPlayer(player.id)}
                            title={t("lobby.kickPlayer")}
                            className="btn-kick"
                          >
                            <Icon.Trash size={IconSize.small} />
                          </Button>
                        )}
                        {isStoryteller && isInGame && !canKick && (
                          <span
                            style={{
                              fontSize: "0.75rem",
                              color: "#95a5a6",
                              fontStyle: "italic",
                            }}
                          >
                            {t("adminSettings.cantKickStoryteller")}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Game Settings Section (Admin Only) */}
        {isAdmin && (
          <>
            <h3 style={{ marginBottom: "1rem" }}>
              <Icon.Settings size={IconSize.medium} />{" "}
              {t("adminSettings.gameSettings")}
            </h3>

            {/* Board Pattern Settings */}
            <div
              style={{
                marginBottom: "1rem",
                padding: "1rem",
                background: "rgba(255, 255, 255, 0.1)",
                borderRadius: "8px",
              }}
            >
              <h4 style={{ marginBottom: "0.75rem" }}>
                {t("lobby.adminBoardPatternLabel")}
              </h4>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                <Button
                  variant={
                    roomState.boardPattern === "snake" ? "primary" : "secondary"
                  }
                  size="small"
                  onClick={() => onSetBoardPattern("snake")}
                >
                  🐍 {t("lobby.patternSnake")}
                </Button>
                <Button
                  variant={
                    roomState.boardPattern === "spiral" ? "primary" : "secondary"
                  }
                  size="small"
                  onClick={() => onSetBoardPattern("spiral")}
                >
                  🐌 {t("lobby.patternSpiral")}
                </Button>
              </div>
            </div>

            {/* Sound Settings */}
            <div
              style={{
                marginBottom: "1rem",
                padding: "1rem",
                background: "rgba(255, 255, 255, 0.1)",
                borderRadius: "8px",
              }}
            >
              <h4 style={{ marginBottom: "0.75rem" }}>
                🔔 {t("adminSettings.soundSettings")}
              </h4>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                <Button
                  variant={roomState.soundEnabled ? "primary" : "secondary"}
                  size="small"
                  onClick={() => onSetSoundEnabled(true)}
                >
                  🔊 {t("adminSettings.soundOn")}
                </Button>
                <Button
                  variant={!roomState.soundEnabled ? "primary" : "secondary"}
                  size="small"
                  onClick={() => onSetSoundEnabled(false)}
                >
                  🔇 {t("adminSettings.soundOff")}
                </Button>
              </div>
              <p
                style={{
                  fontSize: "0.9rem",
                  color: "#95a5a6",
                  marginTop: "0.5rem",
                }}
              >
                {t("adminSettings.soundDesc")}
              </p>
            </div>

            {/* Win Target Settings */}
            <div
              style={{
                marginBottom: "1rem",
                padding: "1rem",
                background: "rgba(255, 255, 255, 0.1)",
                borderRadius: "8px",
              }}
            >
              <h4 style={{ marginBottom: "0.75rem" }}>
                <Icon.Trophy size={IconSize.medium} />{" "}
                {t("lobby.adminWinTargetLabel")}
              </h4>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                {[10, 20, 30, 40].map((target) => {
                  // Check if this target would end the game
                  const wouldEndGame = isInGame && roomState.players.some((p) => p.score >= target);
                  return (
                    <Button
                      key={target}
                      variant={
                        roomState.winTarget === target ? "primary" : "secondary"
                      }
                      size="small"
                      onClick={() => handleWinTargetChange(target)}
                      title={wouldEndGame ? t("adminSettings.wouldEndGame") : undefined}
                    >
                      {t("lobby.pointsLabel", { points: target })}
                      {wouldEndGame && " ⚠️"}
                    </Button>
                  );
                })}
              </div>
              <p
                style={{
                  fontSize: "0.9rem",
                  color: "#95a5a6",
                  marginTop: "0.5rem",
                }}
              >
                {t("lobby.winTargetDesc", { target: roomState.winTarget || 30 })}
              </p>
            </div>

            {/* Language Settings (Admin) */}
            <div
              style={{
                marginBottom: "1rem",
                padding: "1rem",
                background: "rgba(255, 255, 255, 0.1)",
                borderRadius: "8px",
              }}
            >
              <h4 style={{ marginBottom: "0.75rem" }}>
                {t("lobby.adminLanguageLabel")}
              </h4>
              <p
                style={{
                  fontSize: "0.9rem",
                  color: "#95a5a6",
                  marginBottom: "0.5rem",
                }}
              >
                {t("lobby.gameLanguageDesc")}
              </p>
              <LanguageSelector
                value={roomState.language}
                onChange={onSetLanguage}
                isAdmin={true}
              />
            </div>
          </>
        )}

        {/* Language Settings (Non-Admin) */}
        {!isAdmin && (
          <div
            style={{
              marginBottom: "1rem",
              padding: "1rem",
              background: "rgba(255, 255, 255, 0.1)",
              borderRadius: "8px",
            }}
          >
            <h3 style={{ marginBottom: "1rem" }}>
              <Icon.Settings size={IconSize.medium} />{" "}
              {t("lobby.playerLanguageLabel")}
            </h3>
            <p
              style={{
                fontSize: "0.9rem",
                color: "#95a5a6",
                marginBottom: "0.5rem",
              }}
            >
              {t("lobby.personalLanguageDesc")}
            </p>
            <LanguageSelector
              value={getPlayerLanguageOverride() || roomState.language}
              onChange={(lang) => {
                setPlayerLanguage(lang);
                window.location.reload();
              }}
              roomDefault={roomState.language}
              isAdmin={false}
              showOverrideToggle={true}
              hasOverride={hasPlayerLanguageOverride()}
              onClearOverride={() => {
                setPlayerLanguage(null);
                window.location.reload();
              }}
            />
          </div>
        )}
      </>
    ),
  };
}

