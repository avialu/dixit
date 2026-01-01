import { useState, useMemo } from "react";
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

interface GameSettingsModalProps {
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
  onDeleteImage?: (imageId: string) => void;
  onConfirmWinTargetChange?: (target: number, potentialWinners: string[]) => void;
  onClaimAdmin?: (password: string) => Promise<boolean>;
  onShowRules: () => void;
  t: (key: string, values?: Record<string, string | number>) => string;
}

// Keep old name as alias for backwards compatibility
export type AdminSettingsModalProps = GameSettingsModalProps;

/**
 * Game Settings Modal Content
 * 
 * Provides settings that are available to all players throughout the game:
 * - Rules (all players)
 * - Claim Admin (non-admins, when password is set)
 * - Personal language settings (non-admins)
 * - Player management (admin only - kick/promote)
 * - Win target settings (admin only)
 * - Game language settings (admin only)
 * - Board pattern settings (admin only)
 * 
 * Note: Deck management and board background are only available in lobby
 * and are handled by the LobbyModal.
 */
export function GameSettingsModal(props: GameSettingsModalProps) {
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
    onDeleteImage,
    onConfirmWinTargetChange,
    onClaimAdmin,
    onShowRules,
    t,
  } = props;

  // Claim admin state
  const [claimPassword, setClaimPassword] = useState("");
  const [claimError, setClaimError] = useState<string | null>(null);
  const [isClaimLoading, setIsClaimLoading] = useState(false);

  // Track which player's images are expanded
  const [expandedPlayerId, setExpandedPlayerId] = useState<string | null>(null);

  // Calculate image counts per player
  const playerImageCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    roomState.deckImages.forEach((img) => {
      counts[img.uploadedBy] = (counts[img.uploadedBy] || 0) + 1;
    });
    return counts;
  }, [roomState.deckImages]);

  // Get images for a specific player
  const getPlayerImages = (pid: string) => {
    return roomState.deckImages.filter((img) => img.uploadedBy === pid);
  };

  // Sort players: by score during game, by join order before game
  const sortedPlayers = useMemo(() => {
    if (isInGame) {
      // Sort by score descending
      return [...roomState.players].sort((a, b) => b.score - a.score);
    }
    // Keep original order before game
    return roomState.players;
  }, [roomState.players, isInGame]);

  const handleClaimAdmin = async () => {
    if (!claimPassword || !onClaimAdmin) return;
    
    setIsClaimLoading(true);
    setClaimError(null);
    
    try {
      const success = await onClaimAdmin(claimPassword);
      if (success) {
        setClaimPassword("");
      } else {
        setClaimError(t("admin.wrongPassword"));
      }
    } catch (err) {
      setClaimError(t("admin.wrongPassword"));
    } finally {
      setIsClaimLoading(false);
    }
  };

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
        {/* Rules Section - Available to Everyone */}
        <div
          style={{
            marginBottom: "1.5rem",
            padding: "1rem",
            background: "rgba(255, 255, 255, 0.1)",
            borderRadius: "8px",
          }}
        >
          <Button
            variant="secondary"
            onClick={onShowRules}
            style={{ width: "100%" }}
          >
            <Icon.Book size={IconSize.medium} /> {t("rules.title")}
          </Button>
        </div>

        {/* Claim Admin Section - Only for non-admins when password is set */}
        {!isAdmin && roomState.hasAdminPassword && onClaimAdmin && (
          <div
            style={{
              marginBottom: "1.5rem",
              padding: "1rem",
              background: "rgba(255, 255, 255, 0.1)",
              borderRadius: "8px",
            }}
          >
            <h3 style={{ marginBottom: "1rem" }}>
              <Icon.Crown size={IconSize.medium} /> {t("admin.claimAdmin")}
            </h3>
            <p
              style={{
                fontSize: "0.9rem",
                color: "#95a5a6",
                marginBottom: "0.75rem",
              }}
            >
              {t("admin.claimAdminDescription")}
            </p>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              <input
                type="password"
                placeholder={t("admin.enterPassword")}
                value={claimPassword}
                onChange={(e) => setClaimPassword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && claimPassword) {
                    handleClaimAdmin();
                  }
                }}
                style={{
                  flex: 1,
                  padding: "0.5rem 0.75rem",
                  borderRadius: "4px",
                  border: "1px solid rgba(255,255,255,0.2)",
                  background: "rgba(0,0,0,0.3)",
                  color: "#fff",
                  minWidth: "120px",
                }}
              />
              <Button
                variant="primary"
                onClick={handleClaimAdmin}
                disabled={!claimPassword || isClaimLoading}
              >
                {isClaimLoading ? t("common.loading") : t("admin.claim")}
              </Button>
            </div>
            {claimError && (
              <p style={{ color: "#e74c3c", fontSize: "0.85rem", marginTop: "0.5rem" }}>
                {claimError}
              </p>
            )}
          </div>
        )}

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
            {isInGame ? t("common.players") : t("adminSettings.playerManagement")}
          </h3>
          <div className="players-grid">
            {sortedPlayers.map((player, sortedIndex) => {
              const isMe = player.id === playerId;
              const isStoryteller = roomState.storytellerId === player.id;
              const canKick = isAdmin && !isMe && !(isStoryteller && isInGame);
              const canPromote = isAdmin && !isMe && !player.isAdmin;
              const originalIndex = roomState.players.findIndex((p) => p.id === player.id);
              const imageCount = playerImageCounts[player.id] || 0;
              const isExpanded = expandedPlayerId === player.id;
              const playerImages = isExpanded ? getPlayerImages(player.id) : [];
              const canViewImages = isMe && !isInGame; // Only current player can view/manage their images before game

              return (
                <div key={player.id}>
                  <div
                    className={`player-card ${isMe ? "you" : ""}`}
                    style={{
                      cursor: canViewImages && imageCount > 0 ? "pointer" : "default",
                    }}
                    onClick={() => {
                      if (canViewImages && imageCount > 0) {
                        setExpandedPlayerId(isExpanded ? null : player.id);
                      }
                    }}
                  >
                    {/* Rank badge during game */}
                    {isInGame && (
                      <div
                        style={{
                          position: "absolute",
                          top: "-8px",
                          left: "-8px",
                          width: "24px",
                          height: "24px",
                          borderRadius: "50%",
                          background: sortedIndex === 0 ? "#f1c40f" : sortedIndex === 1 ? "#95a5a6" : sortedIndex === 2 ? "#cd7f32" : "#3498db",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: "bold",
                          fontSize: "0.75rem",
                          color: "#fff",
                          border: "2px solid rgba(255,255,255,0.3)",
                        }}
                      >
                        {sortedIndex + 1}
                      </div>
                    )}
                    <PlayerToken
                      imageUrl={player.tokenImage}
                      playerColor={getPlayerColor(originalIndex)}
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

                      {/* Score during game, image count before game */}
                      {isInGame ? (
                        <Badge variant="score" value={player.score} />
                      ) : (
                        <span
                          style={{
                            fontSize: "0.8rem",
                            color: "#95a5a6",
                            marginLeft: "0.5rem",
                            display: "flex",
                            alignItems: "center",
                            gap: "0.25rem",
                          }}
                        >
                          <Icon.Images size={IconSize.small} />
                          {imageCount}
                          {canViewImages && imageCount > 0 && (
                            <Icon.ArrowForward
                              size={IconSize.small}
                              style={{
                                transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)",
                                transition: "transform 0.2s",
                              }}
                            />
                          )}
                        </span>
                      )}

                      {/* Admin controls */}
                      {isAdmin && !isMe && (
                        <div className="admin-controls">
                          {canPromote && (
                            <Button
                              variant="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                onPromotePlayer(player.id);
                              }}
                              title={t("lobby.makeAdmin")}
                              className="btn-make-admin"
                            >
                              <Icon.Crown size={IconSize.small} />
                            </Button>
                          )}
                          {canKick && (
                            <Button
                              variant="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                onKickPlayer(player.id);
                              }}
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

                  {/* Expanded image gallery - only for current player before game */}
                  {isExpanded && canViewImages && (
                    <div
                      style={{
                        marginTop: "0.5rem",
                        padding: "0.75rem",
                        background: "rgba(0, 0, 0, 0.2)",
                        borderRadius: "8px",
                        overflowX: "auto",
                        WebkitOverflowScrolling: "touch",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          gap: "0.75rem",
                          minWidth: "min-content",
                        }}
                      >
                        {playerImages.map((img) => (
                          <div
                            key={img.id}
                            style={{
                              position: "relative",
                              flexShrink: 0,
                            }}
                          >
                            <img
                              src={img.imageData}
                              alt=""
                              style={{
                                width: "100px",
                                height: "150px",
                                objectFit: "cover",
                                borderRadius: "6px",
                                border: "2px solid rgba(255,255,255,0.2)",
                              }}
                            />
                            {onDeleteImage && (
                              <button
                                className="x-button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDeleteImage(img.id);
                                }}
                                style={{
                                  position: "absolute",
                                  top: "-8px",
                                  right: "-8px",
                                  width: "24px",
                                  height: "24px",
                                  fontSize: "14px",
                                }}
                                title={t("common.delete")}
                              >
                                ×
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                      <p
                        style={{
                          fontSize: "0.75rem",
                          color: "#7f8c8d",
                          marginTop: "0.5rem",
                          textAlign: "center",
                        }}
                      >
                        {t("settings.swipeToSeeMore")}
                      </p>
                    </div>
                  )}
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

// Alias for backwards compatibility
export const AdminSettingsModal = GameSettingsModal;
