import { ReactNode, useState, useEffect, useCallback } from "react";
import { RoomState, PlayerState } from "../hooks/useGameState";
import { CardView } from "../components/CardView";
import { DeckUploader } from "../components/DeckUploader";
import { ProfileImageUpload } from "../components/ProfileImageUpload";
import { LanguageSelector } from "../components/LanguageSelector";
import {
  Button,
  Badge,
  PlayerToken,
  getPlayerColor,
  Input,
  Icon,
  IconSize,
  Timer,
} from "./ui";
import {
  getPlayerLanguageOverride,
  setPlayerLanguage,
  hasPlayerLanguageOverride,
} from "../i18n";
import { resizeAndCompressImage } from "../utils/imageResize";

// Common modal return type with optional timer
export interface ModalContentResult {
  header: ReactNode;
  footer: ReactNode;
  content: ReactNode;
  timer?: ReactNode;
}

// Helper function to format waiting message
function formatWaitingFor(playerNames: string[]): string {
  if (playerNames.length === 0) return "";
  if (playerNames.length === 1) return playerNames[0];
  if (playerNames.length === 2)
    return `${playerNames[0]} and ${playerNames[1]}`;
  if (playerNames.length === 3)
    return `${playerNames[0]}, ${playerNames[1]} and ${playerNames[2]}`;
  // More than 3: show first name and count
  return `${playerNames[0]} and ${playerNames.length - 1} more`;
}

// Types for modal content props
interface LobbyModalProps {
  roomState: RoomState;
  playerId: string;
  isSpectator: boolean;
  isAdmin: boolean;
  editingPlayerId: string | null;
  newName: string;
  socket?: import("socket.io-client").Socket | null; // For upload retry support
  setEditingPlayerId: (id: string | null) => void;
  setNewName: (name: string) => void;
  handleStartEditName: (playerId: string, currentName: string) => void;
  handleSaveName: () => void;
  handleCancelEditName: () => void;
  onUploadImage: (imageData: string) => void;
  onDeleteImage: (imageId: string) => void;
  onSetAllowPlayerUploads: (allow: boolean) => void;
  onSetBoardBackground: (imageData: string | null) => void;
  onSetBoardPattern: (pattern: "snake" | "spiral") => void;
  onSetLanguage: (language: "en" | "he") => void;
  onSetWinTarget: (target: number) => void;
  onUploadTokenImage: (imageData: string | null) => void;
  handleLogout: () => void;
  onKickPlayer: (playerId: string) => void;
  onPromotePlayer: (playerId: string) => void;
  t: (key: string, values?: Record<string, string | number>) => string;
}

interface StorytellerModalProps {
  playerState: PlayerState | null;
  selectedCardId: string | null;
  clue: string;
  localSubmittedCardId: string | null;
  roomState: RoomState;
  setSelectedCardId: (id: string | null) => void;
  setClue: (clue: string) => void;
  handleStorytellerSubmit: () => void;
  onTimerExpired?: () => void;
  t: (key: string, values?: Record<string, string | number>) => string;
}

interface PlayerChoiceModalProps {
  playerState: PlayerState | null;
  selectedCardId: string | null;
  localSubmittedCardId: string | null;
  roomState: RoomState;
  setSelectedCardId: (id: string | null) => void;
  handlePlayerSubmit: () => void;
  onTimerExpired?: () => void;
  isAdmin?: boolean;
  onForcePhase?: () => void;
  t: (key: string, values?: Record<string, string | number>) => string;
}

interface VotingModalProps {
  roomState: RoomState;
  playerState: PlayerState | null;
  selectedCardId: string | null;
  localVotedCardId: string | null;
  isStoryteller: boolean;
  isSpectator: boolean;
  isAdmin?: boolean;
  setSelectedCardId: (id: string | null) => void;
  handleVote: () => void;
  onTimerExpired?: () => void;
  onForcePhase?: () => void;
  t: (key: string, values?: Record<string, string | number>) => string;
}

interface RevealModalProps {
  roomState: RoomState;
  playerState: PlayerState | null;
  isAdmin: boolean;
  onAdvanceRound: () => void;
  t: (key: string, values?: Record<string, string | number>) => string;
}

interface GameEndModalProps {
  roomState: RoomState;
  isAdmin: boolean;
  onResetGame: () => void;
  onNewDeck: () => void;
  t: (key: string, values?: Record<string, string | number>) => string;
}

// Helper function to create Modal with consistent structure
export function LobbyModal(props: LobbyModalProps): ModalContentResult {
  const {
    roomState,
    playerId,
    isSpectator,
    isAdmin,
    editingPlayerId,
    newName,
    socket,
    setNewName,
    handleStartEditName,
    handleSaveName,
    handleCancelEditName,
    onUploadImage,
    onDeleteImage,
    onSetAllowPlayerUploads,
    onSetBoardBackground,
    onSetBoardPattern,
    onSetLanguage,
    onSetWinTarget,
    onUploadTokenImage,
    handleLogout,
    onKickPlayer,
    onPromotePlayer,
    t,
  } = props;

  const handleRemoveTokenImage = () => {
    onUploadTokenImage(null);
  };

  const handleBoardBackgroundUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const imageData = await resizeAndCompressImage(file);
      onSetBoardBackground(imageData);
    } catch (error) {
      console.error("Failed to process background image:", error);
      alert(t("errors.uploadFailed"));
    }
  };

  const handleRemoveBoardBackground = () => {
    onSetBoardBackground(null);
  };

  const header = null;

  const footer = (
    <>
      <Button variant="secondary" onClick={handleLogout}>
        <Icon.Logout size={IconSize.medium} /> {t("lobby.logoutReturn")}
      </Button>
    </>
  );

  return {
    header,
    footer,
    timer: undefined,
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
                {/* Token Image Display/Upload */}
                {isMe && !isSpectator ? (
                  <ProfileImageUpload
                    imageUrl={player.tokenImage || null}
                    onUpload={onUploadTokenImage}
                    onRemove={handleRemoveTokenImage}
                    playerColor={getPlayerColor(
                      roomState.players.findIndex((p) => p.id === player.id)
                    )}
                    size="small"
                  />
                ) : (
                  <PlayerToken
                    imageUrl={player.tokenImage}
                    playerColor={getPlayerColor(
                      roomState.players.findIndex((p) => p.id === player.id)
                    )}
                    playerName={player.name}
                    size="small"
                  />
                )}

                {isEditing ? (
                  <div className="player-name-edit">
                    <Input
                      type="text"
                      variant="inline"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder={t("join.enterName")}
                      maxLength={50}
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveName();
                        if (e.key === "Escape") handleCancelEditName();
                      }}
                    />
                    <div className="name-edit-actions">
                      <Button
                        variant="icon"
                        onClick={handleSaveName}
                        disabled={!newName.trim()}
                        className="btn-save"
                        title={t("common.save")}
                      >
                        <Icon.Checkmark size={IconSize.small} />
                      </Button>
                      <Button
                        variant="icon"
                        onClick={handleCancelEditName}
                        className="btn-cancel"
                        title={t("common.cancel")}
                      >
                        ×
                      </Button>
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
                        isMe && !isSpectator ? t("lobby.clickToEditName") : ""
                      }
                    >
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

                    {/* Admin controls */}
                    {isAdmin && !isMe && (
                      <div className="admin-controls">
                        {!player.isAdmin && (
                          <Button
                            variant="icon"
                            onClick={() => onPromotePlayer(player.id)}
                            title={t("lobby.makeAdmin")}
                            className="btn-make-admin"
                          >
                            <Icon.Crown size={IconSize.small} />
                          </Button>
                        )}
                        <Button
                          variant="icon"
                          onClick={() => onKickPlayer(player.id)}
                          title={t("lobby.kickPlayer")}
                          className="btn-kick"
                        >
                          <Icon.Trash size={IconSize.small} />
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: "2rem" }}>
          <h2>
            <Icon.Images size={IconSize.large} /> {t("lobby.deckImages")}
          </h2>
          <DeckUploader
            roomState={roomState}
            playerId={playerId}
            socket={socket}
            onUpload={onUploadImage}
            onDelete={onDeleteImage}
            onSetAllowPlayerUploads={onSetAllowPlayerUploads}
            t={t}
          />
        </div>

        {/* Board Background Settings (Admin Only) */}
        {isAdmin && (
          <div
            style={{
              marginTop: "2rem",
              padding: "1rem",
              background: "rgba(255, 255, 255, 0.1)",
              borderRadius: "8px",
            }}
          >
            <h3 style={{ marginBottom: "1rem" }}>
              <Icon.Image size={IconSize.medium} />{" "}
              {t("lobby.adminBoardBackgroundLabel")}
            </h3>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
              }}
            >
              {roomState.boardBackgroundImage ? (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    flexWrap: "wrap",
                  }}
                >
                  <img
                    src={roomState.boardBackgroundImage}
                    alt="Board background preview"
                    style={{
                      width: "80px",
                      height: "60px",
                      objectFit: "cover",
                      borderRadius: "4px",
                      border: "2px solid #fff",
                    }}
                  />
                  <Button
                    variant="secondary"
                    size="small"
                    onClick={handleRemoveBoardBackground}
                  >
                    {t("lobby.useDefaultBackground")}
                  </Button>
                </div>
              ) : (
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleBoardBackgroundUpload}
                    style={{ display: "none" }}
                    id="board-background-input"
                    ref={(input) => {
                      if (input) {
                        (window as any).boardBackgroundInput = input;
                      }
                    }}
                  />
                  <Button
                    variant="primary"
                    size="small"
                    onClick={() => {
                      const input = document.getElementById(
                        "board-background-input"
                      ) as HTMLInputElement;
                      input?.click();
                    }}
                  >
                    <Icon.Upload size={IconSize.small} />{" "}
                    {t("lobby.uploadCustomBackground")}
                  </Button>
                  <p
                    style={{
                      fontSize: "0.9rem",
                      color: "#95a5a6",
                      marginTop: "0.5rem",
                    }}
                  >
                    {t("lobby.uploadBackgroundDesc")}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Board Pattern Settings (Admin Only) */}
        {isAdmin && (
          <div
            style={{
              marginTop: "1rem",
              padding: "1rem",
              background: "rgba(255, 255, 255, 0.1)",
              borderRadius: "8px",
            }}
          >
            <h3 style={{ marginBottom: "1rem" }}>
              <Icon.Settings size={IconSize.medium} />{" "}
              {t("lobby.adminBoardPatternLabel")}
            </h3>
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
            <p
              style={{
                fontSize: "0.9rem",
                color: "#95a5a6",
                marginTop: "0.5rem",
              }}
            >
              {t("lobby.choosePatternDesc")}
            </p>
          </div>
        )}

        {/* Win Target Settings (Admin Only) */}
        {isAdmin && (
          <div
            style={{
              marginTop: "1rem",
              padding: "1rem",
              background: "rgba(255, 255, 255, 0.1)",
              borderRadius: "8px",
            }}
          >
            <h3 style={{ marginBottom: "1rem" }}>
              <Icon.Trophy size={IconSize.medium} />{" "}
              {t("lobby.adminWinTargetLabel")}
            </h3>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              {[10, 20, 30, 40].map((target) => (
                <Button
                  key={target}
                  variant={
                    roomState.winTarget === target ? "primary" : "secondary"
                  }
                  size="small"
                  onClick={() => onSetWinTarget(target)}
                >
                  {t("lobby.pointsLabel", { points: target })}
                </Button>
              ))}
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
        )}

        {/* Language Settings */}
        <div
          style={{
            marginTop: "1rem",
            padding: "1rem",
            background: "rgba(255, 255, 255, 0.1)",
            borderRadius: "8px",
          }}
        >
          <h3 style={{ marginBottom: "1rem" }}>
            <Icon.Settings size={IconSize.medium} />{" "}
            {isAdmin
              ? t("lobby.adminLanguageLabel")
              : t("lobby.playerLanguageLabel")}
          </h3>

          {isAdmin && (
            <div style={{ marginBottom: "1rem" }}>
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
          )}

          {!isAdmin && (
            <div>
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
                  window.location.reload(); // Reload to apply language change
                }}
                roomDefault={roomState.language}
                isAdmin={false}
                showOverrideToggle={true}
                hasOverride={hasPlayerLanguageOverride()}
                onClearOverride={() => {
                  setPlayerLanguage(null);
                  window.location.reload(); // Reload to apply language change
                }}
              />
            </div>
          )}
        </div>

        {!isSpectator && (
          <p style={{ color: "#95a5a6", marginTop: "1rem" }}>
            {isAdmin
              ? t("lobby.readyToStart")
              : t("lobby.waitingForAdminName", {
                  name:
                    roomState.players.find((p) => p.isAdmin)?.name || "admin",
                })}
          </p>
        )}
        {isSpectator && (
          <p style={{ color: "#95a5a6", marginTop: "1rem" }}>
            <Icon.Eye size={IconSize.medium} /> {t("lobby.spectatingHelp")}
          </p>
        )}
      </>
    ),
  };
}

export function StorytellerChoiceModal(
  props: StorytellerModalProps
): ModalContentResult {
  const {
    playerState,
    selectedCardId,
    clue,
    localSubmittedCardId,
    roomState,
    setSelectedCardId,
    setClue,
    handleStorytellerSubmit,
    onTimerExpired,
    t,
  } = props;

  const isSubmitted = localSubmittedCardId || playerState?.mySubmittedCardId;

  // Timer for storyteller - always show for everyone
  const timerElement = (
    <Timer
      startTime={roomState.phaseStartTime}
      duration={roomState.phaseDuration}
      onTimeUp={!isSubmitted ? onTimerExpired : undefined}
      size="medium"
    />
  );

  // Calculate who we're waiting for (players who haven't submitted yet)
  const waitingForPlayers = isSubmitted
    ? roomState.players
        .filter((p) => p.id !== roomState.storytellerId) // Exclude storyteller
        .filter((p) => !roomState.submittedPlayerIds.includes(p.id)) // Haven't submitted
        .map((p) => p.name)
    : [];

  const header = (
    <>
      <h2>
        {isSubmitted ? (
          <>
            <Icon.Checkmark size={IconSize.large} />{" "}
            {t("storyteller.submitted")}
          </>
        ) : (
          <>
            <Icon.Sparkles size={IconSize.large} />{" "}
            {t("storyteller.storyteller")}
          </>
        )}
      </h2>
      {isSubmitted ? (
        <>
          <p className="clue-reminder">
            <strong>{t("storyteller.yourClue")}:</strong>{" "}
            <strong style={{ fontWeight: 900, fontSize: "1.1em" }}>
              "{roomState.currentClue}"
            </strong>
          </p>
          {waitingForPlayers.length > 0 && (
            <p
              className="clue-reminder"
              style={{ color: "#95a5a6", fontSize: "0.95rem" }}
            >
              ⏳{" "}
              {t("storyteller.waitingFor", {
                names: formatWaitingFor(waitingForPlayers),
              })}
            </p>
          )}
        </>
      ) : null}
    </>
  );

  const footer = !isSubmitted ? (
    <div className="clue-submit-row">
      <Input
        type="text"
        variant="inline"
        placeholder={t("storyteller.enterYourClue")}
        value={clue}
        onChange={(e) => setClue(e.target.value)}
        maxLength={200}
        autoFocus
      />
      <Button
        variant="primary"
        onClick={handleStorytellerSubmit}
        disabled={!selectedCardId || !clue.trim()}
        className="btn-inline"
      >
        {t("storyteller.submit")}
      </Button>
    </div>
  ) : null;

  // Get the submitted card ID for locked state
  const submittedCardId =
    localSubmittedCardId || playerState?.mySubmittedCardId;

  return {
    header,
    footer,
    timer: timerElement,
    content: (
      <div className="modal-hand">
        <CardView
          cards={playerState?.hand || []}
          selectedCardId={isSubmitted ? null : selectedCardId}
          onSelectCard={isSubmitted ? () => {} : setSelectedCardId}
          disabled={!!isSubmitted}
          lockedCardId={submittedCardId}
          showDrawer={false}
        />
      </div>
    ),
  };
}

export function PlayerChoiceModal(
  props: PlayerChoiceModalProps
): ModalContentResult {
  const {
    playerState,
    selectedCardId,
    localSubmittedCardId,
    roomState,
    setSelectedCardId,
    handlePlayerSubmit,
    onTimerExpired,
    isAdmin,
    onForcePhase,
    t,
  } = props;

  const isSubmitted = localSubmittedCardId;

  // Get storyteller name
  const storyteller = roomState.players.find(
    (p) => p.id === roomState.storytellerId
  );
  const storytellerName = storyteller?.name || t("common.storyteller");

  // Timer for player choice - always show for everyone
  const timerElement = (
    <Timer
      startTime={roomState.phaseStartTime}
      duration={roomState.phaseDuration}
      onTimeUp={!isSubmitted ? onTimerExpired : undefined}
      size="medium"
    />
  );

  // Calculate who we're waiting for (players who haven't submitted yet)
  // Also exclude current player if they've locally submitted (before server state updates)
  const waitingForPlayers = isSubmitted
    ? roomState.players
        .filter((p) => p.id !== roomState.storytellerId) // Exclude storyteller
        .filter((p) => !roomState.submittedPlayerIds.includes(p.id)) // Haven't submitted
        .filter((p) => p.id !== playerState?.playerId) // Exclude self if locally submitted
        .map((p) => p.name)
    : [];

  const header = (
    <>
      <h2>
        {isSubmitted ? (
          <>
            <Icon.Checkmark size={IconSize.large} />{" "}
            {t("playerChoice.submitted")}
          </>
        ) : (
          <>
            <Icon.Cards size={IconSize.large} />{" "}
            {t("playerChoice.chooseCardTitle")}
          </>
        )}
      </h2>
      <p className="clue-reminder">
        <strong>
          {t("playerChoice.storytellerClueWithName", { name: storytellerName })}
          :
        </strong>{" "}
        <strong style={{ fontWeight: 900, fontSize: "1.1em" }}>
          "{roomState.currentClue}"
        </strong>
      </p>
      {isSubmitted && waitingForPlayers.length > 0 && (
        <p
          className="clue-reminder"
          style={{ color: "#95a5a6", fontSize: "0.95rem" }}
        >
          ⏳{" "}
          {t("storyteller.waitingFor", {
            names: formatWaitingFor(waitingForPlayers),
          })}
        </p>
      )}
    </>
  );

  // Admin Force Continue button (only when submitted and waiting for others)
  const forceButton =
    isSubmitted && isAdmin && onForcePhase && waitingForPlayers.length > 0 ? (
      <Button
        variant="secondary"
        size="small"
        onClick={onForcePhase}
        title={t("forcePhase.tooltip")}
      >
        <Icon.ArrowForward size={IconSize.small} /> {t("forcePhase.button")}
      </Button>
    ) : null;

  const footer = !isSubmitted ? (
    <Button
      variant="primary"
      size="large"
      onClick={handlePlayerSubmit}
      disabled={!selectedCardId}
    >
      {t("playerChoice.submitCard")}
    </Button>
  ) : (
    forceButton
  );

  return {
    header,
    footer,
    timer: timerElement,
    content: (
      <div className="modal-hand">
        <CardView
          cards={playerState?.hand || []}
          selectedCardId={isSubmitted ? null : selectedCardId}
          onSelectCard={isSubmitted ? () => {} : setSelectedCardId}
          disabled={!!isSubmitted}
          lockedCardId={localSubmittedCardId}
          showDrawer={false}
        />
      </div>
    ),
  };
}

export function WaitingStorytellerModal(props: {
  playerState: PlayerState | null;
  roomState: RoomState;
  t: (key: string, values?: Record<string, string | number>) => string;
  isAdmin?: boolean;
  onForcePhase?: () => void;
}): ModalContentResult {
  const { roomState, t, isAdmin, onForcePhase } = props;

  // Get storyteller name
  const storyteller = roomState.players.find(
    (p) => p.id === roomState.storytellerId
  );
  const storytellerName = storyteller?.name || t("common.storyteller");

  // Timer - show for everyone waiting
  const timerElement = (
    <Timer
      startTime={roomState.phaseStartTime}
      duration={roomState.phaseDuration}
      size="medium"
    />
  );

  const header = (
    <>
      <h2>🤔 {t("status.storytellerThinking", { name: storytellerName })}</h2>
    </>
  );

  // Admin can force the phase to continue
  const footer =
    isAdmin && onForcePhase ? (
      <Button
        variant="secondary"
        size="small"
        onClick={onForcePhase}
        title={t("forcePhase.tooltip")}
      >
        <Icon.ArrowForward size={IconSize.small} /> {t("forcePhase.button")}
      </Button>
    ) : null;

  return {
    header,
    footer,
    timer: timerElement,
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
      </>
    ),
  };
}

export function WaitingPlayersModal(props: {
  playerState: PlayerState | null;
  roomState: RoomState;
  t: (key: string, values?: Record<string, string | number>) => string;
  isAdmin?: boolean;
  onForcePhase?: () => void;
}): ModalContentResult {
  const { playerState, roomState, t, isAdmin, onForcePhase } = props;

  // Get storyteller name
  const storyteller = roomState.players.find(
    (p) => p.id === roomState.storytellerId
  );
  const storytellerName = storyteller?.name || t("common.storyteller");

  // Timer - show for everyone waiting
  const timerElement = (
    <Timer
      startTime={roomState.phaseStartTime}
      duration={roomState.phaseDuration}
      size="medium"
    />
  );

  // Calculate who we're waiting for (players who haven't submitted yet)
  const waitingForPlayers = roomState.players
    .filter((p) => p.id !== roomState.storytellerId) // Exclude storyteller
    .filter((p) => !roomState.submittedPlayerIds.includes(p.id)) // Haven't submitted
    .map((p) => p.name);

  const header = (
    <>
      <h2>⏳ {t("playerChoice.waitingTitle")}</h2>
      <p className="clue-reminder">
        <strong>
          {t("playerChoice.storytellerClueWithName", { name: storytellerName })}
          :
        </strong>{" "}
        <strong style={{ fontWeight: 900, fontSize: "1.1em" }}>
          "{roomState.currentClue}"
        </strong>
      </p>
      {waitingForPlayers.length > 0 && (
        <p
          className="clue-reminder"
          style={{ color: "#95a5a6", fontSize: "0.95rem" }}
        >
          ⏳{" "}
          {t("storyteller.waitingFor", {
            names: formatWaitingFor(waitingForPlayers),
          })}
        </p>
      )}
    </>
  );

  // Admin can force the phase to continue
  const footer =
    isAdmin && onForcePhase ? (
      <Button
        variant="secondary"
        size="small"
        onClick={onForcePhase}
        title={t("forcePhase.tooltip")}
      >
        <Icon.ArrowForward size={IconSize.small} /> {t("forcePhase.button")}
      </Button>
    ) : null;

  return {
    header,
    footer,
    timer: timerElement,
    content: (
      <div className="modal-hand">
        <CardView
          cards={playerState?.hand || []}
          selectedCardId={null}
          onSelectCard={() => {}}
          disabled={true}
          lockedCardId={playerState?.mySubmittedCardId}
          showDrawer={false}
        />
      </div>
    ),
  };
}

export function VotingModal(props: VotingModalProps): ModalContentResult {
  const {
    roomState,
    playerState,
    selectedCardId,
    localVotedCardId,
    isStoryteller,
    isSpectator,
    isAdmin,
    setSelectedCardId,
    handleVote,
    onTimerExpired,
    onForcePhase,
    t,
  } = props;

  const eligiblePlayers = roomState.players.filter(
    (p) => p.id !== roomState.storytellerId
  );
  const allVotesIn = roomState.votes.length >= eligiblePlayers.length;
  const hasVoted = localVotedCardId !== null;
  const canVote = !isStoryteller && !isSpectator && !hasVoted;

  // Get storyteller name
  const storyteller = roomState.players.find(
    (p) => p.id === roomState.storytellerId
  );
  const storytellerName = storyteller?.name || t("common.storyteller");

  // Timer for voting - always show for everyone
  const timerElement = (
    <Timer
      startTime={roomState.phaseStartTime}
      duration={roomState.phaseDuration}
      onTimeUp={canVote ? onTimerExpired : undefined}
      size="medium"
    />
  );

  // Calculate who we're waiting for (players who haven't voted yet)
  // Also exclude current player if they've locally voted (before server state updates)
  const votedPlayerIds = roomState.votes.map((v) => v.voterId);
  const waitingForPlayers = hasVoted
    ? eligiblePlayers
        .filter((p) => !votedPlayerIds.includes(p.id))
        .filter((p) => p.id !== playerState?.playerId) // Exclude self if locally voted
        .map((p) => p.name)
    : [];

  const getHeaderTitle = () => {
    if (canVote)
      return (
        <>
          <Icon.Vote size={IconSize.large} /> {t("voting.vote")}
        </>
      );
    if (hasVoted && !allVotesIn)
      return (
        <>
          <Icon.Checkmark size={IconSize.large} /> {t("voting.voted")}
        </>
      );
    if (allVotesIn)
      return (
        <>
          <Icon.Results size={IconSize.large} /> {t("voting.allVotesIn")}
        </>
      );
    if (isStoryteller)
      return (
        <>
          <Icon.Eye size={IconSize.large} /> {t("voting.watching")}
        </>
      );
    if (isSpectator)
      return (
        <>
          <Icon.Eye size={IconSize.large} /> {t("voting.spectating")}
        </>
      );
    return (
      <>
        <Icon.Vote size={IconSize.large} /> {t("voting.vote")}
      </>
    );
  };

  const header = (
    <>
      <h2>{getHeaderTitle()}</h2>
      <p className="clue-reminder">
        <strong>
          {t("voting.storytellerClueWithName", { name: storytellerName })}:
        </strong>{" "}
        <strong style={{ fontWeight: 900, fontSize: "1.1em" }}>
          "{roomState.currentClue}"
        </strong>
      </p>
      {hasVoted && waitingForPlayers.length > 0 && !allVotesIn && (
        <p
          className="clue-reminder"
          style={{ color: "#95a5a6", fontSize: "0.95rem" }}
        >
          ⏳{" "}
          {t("storyteller.waitingFor", {
            names: formatWaitingFor(waitingForPlayers),
          })}
        </p>
      )}
    </>
  );

  // Admin Force Continue button
  const forceButton =
    isAdmin && onForcePhase && !allVotesIn ? (
      <Button
        variant="secondary"
        size="small"
        onClick={onForcePhase}
        title={t("forcePhase.tooltip")}
      >
        <Icon.ArrowForward size={IconSize.small} /> {t("forcePhase.button")}
      </Button>
    ) : null;

  const footer = canVote ? (
    <Button
      variant="primary"
      size="large"
      onClick={handleVote}
      disabled={!selectedCardId}
    >
      {t("voting.submitVote")}
    </Button>
  ) : (hasVoted || isStoryteller) && !allVotesIn ? (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "0.5rem",
        alignItems: "center",
      }}
    >
      {waitingForPlayers.length > 0 && (
        <p style={{ color: "#95a5a6", margin: 0 }}>
          ⏳{" "}
          {t("storyteller.waitingFor", {
            names: formatWaitingFor(waitingForPlayers),
          })}
        </p>
      )}
      {forceButton}
    </div>
  ) : null;

  return {
    header,
    footer,
    timer: timerElement,
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

// Reveal Footer Component using server timer (one source of truth)
function RevealFooter({
  isAdmin,
  onAdvanceRound,
  phaseStartTime,
  phaseDuration,
  t,
}: {
  isAdmin: boolean;
  onAdvanceRound: () => void;
  phaseStartTime: number | null;
  phaseDuration: number | null;
  t: (key: string, values?: Record<string, string | number>) => string;
}) {
  const [hasAdvanced, setHasAdvanced] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState<number>(() => {
    // Calculate initial seconds based on server time
    if (phaseStartTime && phaseDuration) {
      const elapsed = Math.floor((Date.now() - phaseStartTime) / 1000);
      return Math.max(0, phaseDuration - elapsed);
    }
    return 30; // Fallback
  });

  const handleAdvance = useCallback(() => {
    if (!hasAdvanced) {
      setHasAdvanced(true);
      onAdvanceRound();
    }
  }, [hasAdvanced, onAdvanceRound]);

  // Sync with server timer every second
  useEffect(() => {
    if (hasAdvanced) return;

    const interval = setInterval(() => {
      if (phaseStartTime && phaseDuration) {
        const elapsed = Math.floor((Date.now() - phaseStartTime) / 1000);
        const remaining = Math.max(0, phaseDuration - elapsed);
        setSecondsLeft(remaining);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [phaseStartTime, phaseDuration, hasAdvanced]);

  // For admin: show clickable button with timer
  if (isAdmin) {
    return (
      <Button variant="continue" onClick={handleAdvance} disabled={hasAdvanced}>
        <Icon.ArrowForward size={IconSize.medium} />{" "}
        {hasAdvanced
          ? t("reveal.autoAdvance")
          : t("reveal.continueIn", { seconds: secondsLeft })}
      </Button>
    );
  }

  // For non-admin players: show timer countdown
  return (
    <p
      style={{
        color: secondsLeft <= 5 ? "#e74c3c" : "#f39c12",
        fontWeight: "bold",
        margin: 0,
        fontSize: "1.1rem",
      }}
    >
      ⏳ {t("reveal.waitingWithTimer", { seconds: secondsLeft })}
    </p>
  );
}

export function RevealModal(props: RevealModalProps): ModalContentResult {
  const { roomState, playerState, isAdmin, onAdvanceRound, t } = props;

  const storytellerId = roomState.storytellerId;
  const storytellerCard = roomState.revealedCards.find(
    (card) => card.playerId === storytellerId
  );
  const storytellerCardId = storytellerCard?.cardId;

  // Get storyteller name
  const storyteller = roomState.players.find(
    (p) => p.id === roomState.storytellerId
  );
  const storytellerName = storyteller?.name || t("common.storyteller");

  const scoreDeltas: { [playerId: string]: number } = {};
  roomState.lastScoreDeltas.forEach((delta) => {
    scoreDeltas[delta.playerId] = delta.delta;
  });

  const header = (
    <>
      <h2>
        <Icon.Results size={IconSize.large} /> {t("reveal.results")}
      </h2>
      <p className="clue-reminder">
        <strong>
          {t("reveal.storytellerClueWithName", { name: storytellerName })}:
        </strong>{" "}
        <strong style={{ fontWeight: 900, fontSize: "1.1em" }}>
          "{roomState.currentClue}"
        </strong>
      </p>
    </>
  );

  return {
    header,
    footer: (
      <RevealFooter
        isAdmin={isAdmin}
        onAdvanceRound={onAdvanceRound}
        phaseStartTime={roomState.phaseStartTime}
        phaseDuration={roomState.phaseDuration}
        t={t}
      />
    ),
    timer: undefined,
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
            playerId: card.playerId,
          }))}
          storytellerCardId={storytellerCardId || null}
          showResults={true}
          scoreDeltas={scoreDeltas}
          t={t}
        />
      </div>
    ),
  };
}

export function GameEndModal(props: GameEndModalProps): ModalContentResult {
  const { roomState, isAdmin, onResetGame, onNewDeck, t } = props;

  const sortedPlayers = [...roomState.players].sort(
    (a, b) => b.score - a.score
  );
  const winner = sortedPlayers[0];
  const wonByTarget =
    roomState.winTarget !== null && winner.score >= roomState.winTarget;

  const header = (
    <>
      <h2>
        <Icon.Trophy size={IconSize.large} /> {t("gameEnd.gameOver")}
      </h2>
    </>
  );

  const footer = isAdmin ? (
    <div className="game-end-actions">
      <Button variant="primary" onClick={onResetGame}>
        {t("gameEnd.resetGame")}
      </Button>
      <Button variant="secondary" onClick={onNewDeck}>
        {t("gameEnd.newDeck")}
      </Button>
    </div>
  ) : null;

  return {
    header,
    footer,
    timer: undefined,
    content: (
      <div className="game-end-content">
        <div className="winner-announcement">
          <div className="winner-crown">
            <Icon.Crown size={IconSize.xxlarge} />
          </div>
          {wonByTarget && (
            <p className="winner-text">
              {t("gameEnd.wins", { name: winner.name })}
            </p>
          )}
        </div>
        <div className="final-scores-list">
          {sortedPlayers.map((player, index) => (
            <div
              key={player.id}
              className={`final-score-item ${index === 0 ? "winner" : ""}`}
            >
              <span className="rank">
                {t("gameEnd.rank", { rank: index + 1 })}
              </span>
              <span className="name">{player.name}</span>
              <span className="score">
                {t("gameEnd.points", { score: player.score })}
              </span>
            </div>
          ))}
        </div>
      </div>
    ),
  };
}

// Rules Modal - Available at all times to explain game rules
interface RulesModalProps {
  onClose: () => void;
  t: (key: string, values?: Record<string, string | number>) => string;
}

export function RulesModal(props: RulesModalProps): ModalContentResult {
  const { onClose, t } = props;

  const header = (
    <>
      <h2>
        <Icon.Book size={IconSize.large} /> {t("rules.title")}
      </h2>
    </>
  );

  const footer = (
    <Button variant="primary" onClick={onClose}>
      {t("common.close")}
    </Button>
  );

  return {
    header,
    footer,
    timer: undefined,
    content: (
      <div className="rules-content">
        {/* Objective Section */}
        <section className="rules-section">
          <h3 className="rules-section-title">
            <Icon.Star size={IconSize.medium} /> {t("rules.objective.title")}
          </h3>
          <p className="rules-description">{t("rules.objective.description")}</p>
        </section>

        {/* Game Phases Section */}
        <section className="rules-section">
          <h3 className="rules-section-title">
            <Icon.Cards size={IconSize.medium} /> {t("rules.phases.title")}
          </h3>

          <div className="rules-phase">
            <h4>{t("rules.phases.storytellerTurn.title")}</h4>
            <p>{t("rules.phases.storytellerTurn.description")}</p>
          </div>

          <div className="rules-phase">
            <h4>{t("rules.phases.playersChoice.title")}</h4>
            <p>{t("rules.phases.playersChoice.description")}</p>
          </div>

          <div className="rules-phase">
            <h4>{t("rules.phases.voting.title")}</h4>
            <p>{t("rules.phases.voting.description")}</p>
          </div>

          <div className="rules-phase">
            <h4>{t("rules.phases.reveal.title")}</h4>
            <p>{t("rules.phases.reveal.description")}</p>
          </div>
        </section>

        {/* Scoring Section */}
        <section className="rules-section">
          <h3 className="rules-section-title">
            <Icon.Trophy size={IconSize.medium} /> {t("rules.scoring.title")}
          </h3>

          <div className="rules-scoring-case rules-scoring-normal">
            <h4>{t("rules.scoring.normalCase.title")}</h4>
            <ul>
              <li>{t("rules.scoring.normalCase.storyteller")}</li>
              <li>{t("rules.scoring.normalCase.correctGuessers")}</li>
              <li>{t("rules.scoring.normalCase.bonus")}</li>
            </ul>
          </div>

          <div className="rules-scoring-case rules-scoring-warning">
            <h4>{t("rules.scoring.tooObvious.title")}</h4>
            <p>{t("rules.scoring.tooObvious.description")}</p>
            <p>{t("rules.scoring.tooObvious.others")}</p>
          </div>

          <div className="rules-scoring-case rules-scoring-warning">
            <h4>{t("rules.scoring.tooObscure.title")}</h4>
            <p>{t("rules.scoring.tooObscure.description")}</p>
            <p>{t("rules.scoring.tooObscure.others")}</p>
          </div>

          <p className="rules-bonus-note">
            <Icon.Info size={IconSize.small} /> {t("rules.scoring.bonusNote")}
          </p>
        </section>

        {/* Winning Section */}
        <section className="rules-section">
          <h3 className="rules-section-title">
            <Icon.Crown size={IconSize.medium} /> {t("rules.winning.title")}
          </h3>
          <p className="rules-description">{t("rules.winning.description")}</p>
        </section>

        {/* Tips Section */}
        <section className="rules-section rules-tips">
          <h3 className="rules-section-title">
            <Icon.Sparkles size={IconSize.medium} /> {t("rules.tips.title")}
          </h3>
          <div className="rules-tip">
            <p>{t("rules.tips.storytellerTip")}</p>
          </div>
          <div className="rules-tip">
            <p>{t("rules.tips.playerTip")}</p>
          </div>
        </section>
      </div>
    ),
  };
}
