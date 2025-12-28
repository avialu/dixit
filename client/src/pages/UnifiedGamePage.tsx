import { useState, useEffect, useMemo, useRef } from "react";
import type { Socket } from "socket.io-client";
import { RoomState, PlayerState } from "../hooks/useGameState";
import { ConnectionQuality } from "../hooks/useSocket";
import { GameBoard } from "../components/GameBoard";
import { QRCode } from "../components/QRCode";
import { Modal } from "../components/Modal";
import * as ModalContent from "../components/ModalContent";
import { AdminSettingsModal } from "../components/AdminSettingsModal";
import { ProfileImageUpload } from "../components/ProfileImageUpload";
import { Button, Icon, IconSize } from "../components/ui";
import { storage } from "../utils/storage";
import { ConfirmModal } from "../components/ConfirmModal";
import { getMinimumDeckSize } from "../utils/imageConstants";
import { resizeAndCompressImages } from "../utils/imageResize";
import { useTranslation } from "../i18n";
import { ConnectionStatus } from "../components/ConnectionStatus";
import { LatencyIndicator } from "../components/LatencyIndicator";

interface UnifiedGamePageProps {
  roomState: RoomState | null;
  playerState: PlayerState | null;
  playerId: string;
  clientId: string;
  socket: Socket | null;
  onJoin: (name: string, clientId: string) => void;
  onJoinSpectator: (clientId: string) => void;
  onLeave: () => void;
  onUploadImage: (imageData: string) => void;
  onDeleteImage: (imageId: string) => void;
  onSetAllowPlayerUploads: (allow: boolean) => void;
  onSetBoardBackground: (imageData: string | null) => void;
  onSetBoardPattern: (pattern: "snake" | "spiral") => void;
  onSetLanguage: (language: "en" | "he") => void;
  onSetWinTarget: (target: number) => void;
  onStartGame: () => void;
  onChangeName: (newName: string) => void;
  onStorytellerSubmit: (cardId: string, clue: string) => void;
  onPlayerSubmitCard: (cardId: string) => void;
  onPlayerVote: (cardId: string) => void;
  onAdvanceRound: () => void;
  onResetGame: () => void;
  onNewDeck: () => void;
  onUploadTokenImage: (imageData: string | null) => void;
  // Demo mode - explicitly passed to distinguish from socket loading
  isDemoMode?: boolean;
  // Connection status props
  isConnected?: boolean;
  isReconnecting?: boolean;
  needsManualReconnect?: boolean;
  onManualReconnect?: () => void;
  latency?: number | null;
  connectionQuality?: ConnectionQuality;
}

export function UnifiedGamePage({
  roomState,
  playerState,
  playerId,
  clientId,
  socket,
  onJoin,
  onJoinSpectator: _onJoinSpectator,
  onLeave,
  onUploadImage: _onUploadImage,
  onDeleteImage: _onDeleteImage,
  onSetAllowPlayerUploads,
  onSetBoardBackground,
  onSetBoardPattern,
  onSetLanguage,
  onSetWinTarget,
  onStartGame,
  onChangeName: _onChangeName,
  onStorytellerSubmit,
  onPlayerSubmitCard,
  onPlayerVote,
  onAdvanceRound: _onAdvanceRound,
  onResetGame,
  onNewDeck,
  onUploadTokenImage,
  // Demo mode - explicitly passed, defaults to false for real game
  isDemoMode = false,
  // Connection status
  isConnected = true,
  isReconnecting = false,
  needsManualReconnect = false,
  onManualReconnect,
  latency = null,
  connectionQuality = "unknown",
}: UnifiedGamePageProps) {
  const { t } = useTranslation(roomState?.language);
  const [name, setName] = useState("");

  // Calculate the color the player will actually get when they join
  // Based on current player count (they'll be the next player)
  const joinScreenColor = useMemo(() => {
    const colors = [
      "#f39c12", // Orange
      "#3498db", // Blue
      "#2ecc71", // Green
      "#e74c3c", // Red
      "#9b59b6", // Purple
      "#1abc9c", // Teal
    ];
    const nextPlayerIndex = roomState?.players?.length ?? 0;
    return colors[nextPlayerIndex % colors.length];
  }, [roomState?.players?.length]); // Recalculate when player count changes
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [clue, setClue] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<
    "settings" | "cards" | "adminSettings"
  >("cards");
  const [manuallyClosedModal, setManuallyClosedModal] = useState(false);
  const [detectedServerUrl, setDetectedServerUrl] = useState<string | null>(
    null
  );
  // Track locally submitted cards for locking UI
  const [localSubmittedCardId, setLocalSubmittedCardId] = useState<
    string | null
  >(null);
  // Track local vote for locking UI
  const [localVotedCardId, setLocalVotedCardId] = useState<string | null>(null);
  // Track if user chose to be a spectator - initialize from localStorage
  // Read from storage on mount, then demo mode check happens via isDemoMode
  const [isUserSpectator, setIsUserSpectator] = useState(() => {
    // Read storage value initially
    return storage.isSpectator.get();
  });
  // Track name editing state - which player ID is being edited
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");

  // Floating upload button file input ref
  const floatingUploadRef = useRef<HTMLInputElement>(null);
  const [isFloatingUploading, setIsFloatingUploading] = useState(false);
  // Track profile image for join screen
  const [profileImage, setProfileImage] = useState<string | null>(null);
  // Track QR code visibility - starts closed, user can open with QR button
  const [showQR, setShowQR] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  // Loading states for actions
  const [isJoining, setIsJoining] = useState(false);
  const [isJoiningSpectator, setIsJoiningSpectator] = useState(false);
  const [isStartingGame, setIsStartingGame] = useState(false);

  // In demo mode, reset spectator status (demo always starts fresh)
  // isDemoMode is now passed explicitly as a prop, so we don't need complex detection
  useEffect(() => {
    if (isDemoMode && isUserSpectator) {
      setIsUserSpectator(false);
    }
  }, [isDemoMode, isUserSpectator]);

  // Fetch server URL on mount (for cases where we need it before roomState is available)
  useEffect(() => {
    if (!isDemoMode) {
      fetch("/api/server-info")
        .then((res) => res.json())
        .then((data) => setDetectedServerUrl(data.serverUrl))
        .catch((err) => console.warn("Could not fetch server URL:", err));
    }
  }, [isDemoMode]);

  // Listen for acknowledgment events to clear loading states
  useEffect(() => {
    if (!socket) return;

    const handleJoinSuccess = () => {
      setIsJoining(false);
    };

    const handleJoinSpectatorSuccess = () => {
      setIsJoiningSpectator(false);
    };

    const handleStartGameAck = () => {
      setIsStartingGame(false);
    };

    // Clear loading on error too
    const handleError = () => {
      setIsJoining(false);
      setIsJoiningSpectator(false);
      setIsStartingGame(false);
    };

    socket.on("joinSuccess", handleJoinSuccess);
    socket.on("joinSpectatorSuccess", handleJoinSpectatorSuccess);
    socket.on("startGameAck", handleStartGameAck);
    socket.on("error", handleError);
    socket.on("gameError", handleError);

    return () => {
      socket.off("joinSuccess", handleJoinSuccess);
      socket.off("joinSpectatorSuccess", handleJoinSpectatorSuccess);
      socket.off("startGameAck", handleStartGameAck);
      socket.off("error", handleError);
      socket.off("gameError", handleError);
    };
  }, [socket]);

  // Timeout fallback for loading states (5 seconds)
  useEffect(() => {
    let timeout: NodeJS.Timeout | null = null;
    if (isJoining || isJoiningSpectator || isStartingGame) {
      timeout = setTimeout(() => {
        setIsJoining(false);
        setIsJoiningSpectator(false);
        setIsStartingGame(false);
      }, 5000);
    }
    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [isJoining, isJoiningSpectator, isStartingGame]);

  // Reset local submission state when phase changes
  useEffect(() => {
    const phase = roomState?.phase;
    // Clear local submissions when leaving BOTH STORYTELLER_CHOICE and PLAYERS_CHOICE phases
    if (phase !== "STORYTELLER_CHOICE" && phase !== "PLAYERS_CHOICE") {
      setLocalSubmittedCardId(null);
    }
    // Clear local vote when leaving VOTING phase
    if (phase !== "VOTING") {
      setLocalVotedCardId(null);
    }
    // Reset manual close flag when phase changes (allow auto-open again)
    setManuallyClosedModal(false);
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
      "GAME_END",
    ].includes(roomState.phase);
  const myPlayer = roomState?.players.find((p) => p.id === playerId);
  const isAdmin = myPlayer?.isAdmin || false;
  const isStoryteller = roomState?.storytellerId === playerId;

  // Auto-open modal for game phases where player needs to take action
  useEffect(() => {
    const phase = roomState?.phase;
    let shouldAutoOpen = false;
    let delayMs = 0; // Delay before opening modal

    if (phase === "STORYTELLER_CHOICE" && isStoryteller) {
      // Only open for storyteller - with 2s delay so they can see the board first
      shouldAutoOpen = true;
      delayMs = 2000;
    } else if (phase === "PLAYERS_CHOICE" && !isStoryteller && !isSpectator) {
      // Only open for non-storyteller players
      shouldAutoOpen = true;
    } else if (phase === "VOTING" && !isStoryteller && !isSpectator) {
      // Only open for non-storyteller players (who need to vote)
      shouldAutoOpen = true;
    } else if (phase === "REVEAL") {
      // Open for everyone - but DON'T trigger animation yet
      // Animation will only trigger when modal is closed
      shouldAutoOpen = true;
    } else if (phase === "GAME_END") {
      // Open for everyone to show winner
      shouldAutoOpen = true;
    }

    if (
      shouldAutoOpen &&
      !manuallyClosedModal &&
      !showModal &&
      modalType !== "adminSettings"
    ) {
      // Only auto-open if user hasn't manually closed it AND modal isn't already open
      // Don't override adminSettings modal
      if (delayMs > 0) {
        // Delayed open for storyteller to see board positions first
        const timer = setTimeout(() => {
          setModalType("cards");
          setShowModal(true);
        }, delayMs);
        return () => clearTimeout(timer);
      } else {
        setModalType("cards");
        setShowModal(true);
      }
    } else if (phase === "DECK_BUILDING" && modalType !== "adminSettings") {
      // When returning to deck building (e.g., after game reset), close modal
      // But don't close if admin settings are open
      setShowModal(false);
      setManuallyClosedModal(false);
    }
  }, [roomState?.phase, isStoryteller, isSpectator, manuallyClosedModal]);

  // Auto-join spectators when they connect (only if not already joined)
  useEffect(() => {
    if (!isDemoMode && isSpectator && socket?.connected && !isJoined) {
      // Auto-join spectator
      socket.emit("joinSpectator", { clientId });
      console.log("Auto-joining as spectator");
    }
  }, [isDemoMode, isSpectator, socket, isJoined, clientId]);

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && !isJoining) {
      setIsJoining(true);
      onJoin(name.trim(), clientId);
      // Upload profile image after joining if one was selected
      if (profileImage) {
        setTimeout(() => {
          onUploadTokenImage(profileImage);
        }, 100);
      }
    }
  };

  const handleSpectatorJoin = () => {
    // In demo mode, spectator join should do nothing
    if (isDemoMode) return;
    if (isJoiningSpectator) return;
    setIsJoiningSpectator(true);
    setIsUserSpectator(true);
    storage.isSpectator.set(true);
    _onJoinSpectator(clientId);
  };

  const handleLogout = () => {
    // Count user's uploaded images
    const myImages =
      roomState?.deckImages.filter((img) => img.uploadedBy === playerId) || [];
    const imageCount = myImages.length;

    const performLogout = () => {
      // Emit leave event so server removes the player immediately
      onLeave();
      // Clear all stored flags so they don't auto-rejoin
      storage.clientId.remove();
      storage.hasJoined.remove();
      storage.isSpectator.remove();
      // Reset spectator state
      setIsUserSpectator(false);
      // Small delay to ensure leave event is processed before reload
      setTimeout(() => {
        window.location.reload();
      }, 100);
    };

    // Warning if user has uploaded images
    if (imageCount > 0) {
      setConfirmModal({
        isOpen: true,
        title: "⚠️ Logout Warning",
        message: `You have ${imageCount} uploaded image${
          imageCount !== 1 ? "s" : ""
        } in the deck. If you logout, these images will be permanently removed from the game. Are you sure you want to logout?`,
        onConfirm: performLogout,
      });
    } else {
      performLogout();
    }
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

  const handleKickPlayer = (targetPlayerId: string) => {
    const targetPlayer = roomState?.players.find(
      (p) => p.id === targetPlayerId
    );
    if (!targetPlayer) return;

    setConfirmModal({
      isOpen: true,
      title: "Kick Player",
      message: `Kick ${targetPlayer.name}? Their images will be transferred to you.`,
      onConfirm: () => {
        if (socket) {
          socket.emit("adminKickPlayer", { targetPlayerId });
        }
      },
    });
  };

  const handlePromotePlayer = (targetPlayerId: string) => {
    const targetPlayer = roomState?.players.find(
      (p) => p.id === targetPlayerId
    );
    if (!targetPlayer) return;

    setConfirmModal({
      isOpen: true,
      title: "Make Admin",
      message: `Make ${targetPlayer.name} the admin? You will become a regular player.`,
      onConfirm: () => {
        if (socket) {
          socket.emit("adminPromotePlayer", { targetPlayerId });
        }
      },
    });
  };

  const handleConfirmWinTargetChange = (
    target: number,
    potentialWinners: string[]
  ) => {
    const winnerNames = potentialWinners.join(", ");
    setConfirmModal({
      isOpen: true,
      title: t("adminSettings.winTargetWarningTitle"),
      message: t("adminSettings.winTargetWarningMessage", {
        target,
        winners: winnerNames,
      }),
      onConfirm: () => {
        onSetWinTarget(target);
      },
    });
  };

  const handleStorytellerSubmit = () => {
    if (selectedCardId && clue.trim()) {
      onStorytellerSubmit(selectedCardId, clue.trim());
      // Store locally for UI locking
      setLocalSubmittedCardId(selectedCardId);
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

  // Auto-submit handlers when timer expires
  const handleStorytellerTimerExpired = () => {
    // Already submitted - nothing to do
    if (localSubmittedCardId || playerState?.mySubmittedCardId) return;

    // Get the card to submit (selected or random)
    const hand = playerState?.hand || [];
    if (hand.length === 0) return;

    const cardToSubmit =
      selectedCardId || hand[Math.floor(Math.random() * hand.length)].id;

    // Get the clue (entered or fallback)
    const storyteller = roomState?.players.find(
      (p) => p.id === roomState?.storytellerId
    );
    const storytellerName = storyteller?.name || t("common.storyteller");
    const clueToSubmit =
      clue.trim() || t("timer.storytellerSleeping", { name: storytellerName });

    onStorytellerSubmit(cardToSubmit, clueToSubmit);
    setLocalSubmittedCardId(cardToSubmit);
    setSelectedCardId(null);
    setClue("");
    setShowModal(false);
  };

  const handlePlayerTimerExpired = () => {
    // Already submitted - nothing to do
    if (localSubmittedCardId || playerState?.mySubmittedCardId) return;

    // Get the card to submit (selected or random)
    const hand = playerState?.hand || [];
    if (hand.length === 0) return;

    const cardToSubmit =
      selectedCardId || hand[Math.floor(Math.random() * hand.length)].id;

    onPlayerSubmitCard(cardToSubmit);
    setLocalSubmittedCardId(cardToSubmit);
    setSelectedCardId(null);
    setShowModal(false);
  };

  const handleVoteTimerExpired = () => {
    // Already voted - nothing to do
    if (localVotedCardId || playerState?.myVote) return;

    // Get valid cards to vote for (exclude own card)
    const revealedCards = roomState?.revealedCards || [];
    const myCardId = playerState?.mySubmittedCardId;
    const validCards = revealedCards.filter((c) => c.cardId !== myCardId);

    if (validCards.length === 0) return;

    const cardToVote =
      selectedCardId && validCards.some((c) => c.cardId === selectedCardId)
        ? selectedCardId
        : validCards[Math.floor(Math.random() * validCards.length)].cardId;

    onPlayerVote(cardToVote);
    setLocalVotedCardId(cardToVote);
    setSelectedCardId(null);
  };

  const openCards = () => {
    setModalType("cards");
    setShowModal(true);
    setManuallyClosedModal(false); // Clear manual close flag when user opens it
  };

  // Handle floating upload button file selection
  const handleFloatingUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsFloatingUploading(true);
    try {
      const results = await resizeAndCompressImages(Array.from(files));
      for (const result of results) {
        if (!result.error && result.imageData) {
          _onUploadImage(result.imageData);
        }
      }
    } catch (err) {
      console.error("Upload error:", err);
    } finally {
      setIsFloatingUploading(false);
      if (floatingUploadRef.current) {
        floatingUploadRef.current.value = "";
      }
    }
  };

  const openAdminSettings = () => {
    setModalType("adminSettings");
    setShowModal(true);
    setManuallyClosedModal(false);
  };

  // Check if we're waiting for reconnection (hasJoined but no roomState yet)
  const isPendingReconnect =
    !isDemoMode && !roomState && storage.hasJoined.get();

  // RECONNECTING SCREEN (waiting for server state after refresh)
  if (isPendingReconnect) {
    return (
      <div className="unified-game-page reconnecting-state">
        <ConnectionStatus
          isConnected={isConnected}
          isReconnecting={isReconnecting}
          needsManualReconnect={needsManualReconnect}
          onRetry={onManualReconnect || (() => {})}
          t={t}
        />
        <div className="reconnecting-container">
          <div className="reconnecting-spinner" />
          <p>{t("connection.reconnecting")}</p>
        </div>
      </div>
    );
  }

  // JOIN SCREEN (only for users who haven't joined before)
  if (!isJoined) {
    // Get server URL with priority: roomState > detected from API > current location
    const serverUrl =
      roomState?.serverUrl || detectedServerUrl || window.location.origin;

    return (
      <div className="unified-game-page join-state">
        {/* Connection Status Banner */}
        {!isDemoMode && (
          <ConnectionStatus
            isConnected={isConnected}
            isReconnecting={isReconnecting}
            needsManualReconnect={needsManualReconnect}
            onRetry={onManualReconnect || (() => {})}
            t={t}
          />
        )}

        <div className="join-container">
          <div className="join-box">
            <h1>
              <Icon.Sparkles size={IconSize.xlarge} /> {t("join.title")}
            </h1>
            <p className="tagline">{t("join.tagline")}</p>

            <form onSubmit={handleJoin} className="join-form">
              {/* Profile Image Upload */}
              <div className="join-profile-section">
                <ProfileImageUpload
                  imageUrl={profileImage}
                  onUpload={setProfileImage}
                  onRemove={() => setProfileImage(null)}
                  playerColor={joinScreenColor}
                  size="large"
                />
                <p className="join-profile-hint">{t("join.addPhoto")}</p>
              </div>

              <input
                type="text"
                placeholder={t("join.enterName")}
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={50}
                autoFocus
                className="name-input"
              />
              <Button
                type="submit"
                variant="primary"
                size="large"
                disabled={!name.trim() || isJoining || isJoiningSpectator}
                loading={isJoining}
                loadingText={t("join.joining")}
              >
                <Icon.Rocket size={IconSize.medium} /> {t("join.joinButton")}
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="large"
                onClick={handleSpectatorJoin}
                disabled={isJoining || isJoiningSpectator}
                loading={isJoiningSpectator}
                loadingText={t("join.joining")}
              >
                👀 {t("join.spectator")}
              </Button>
            </form>
            <div className="qr-code-section">
              <p className="qr-hint">{t("join.scanToJoin")}</p>
              <QRCode url={serverUrl} size={180} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // BOARD VIEW (after joining - always shows board)
  return (
    <div className="unified-game-page game-state">
      {/* Connection Status Banner */}
      {!isDemoMode && (
        <ConnectionStatus
          isConnected={isConnected}
          isReconnecting={isReconnecting}
          needsManualReconnect={needsManualReconnect}
          onRetry={onManualReconnect || (() => {})}
          t={t}
        />
      )}

      {/* Latency Indicator - Fixed in corner */}
      {!isDemoMode && isConnected && (
        <div className="latency-indicator-container">
          <LatencyIndicator
            latency={latency}
            connectionQuality={connectionQuality}
            isConnected={isConnected}
            compact={false}
          />
        </div>
      )}

      {/* Board Background - Always Visible */}
      <div className="board-background">
        <GameBoard
          roomState={roomState}
          playerId={playerId}
          showQR={showQR}
          onCloseQR={() => setShowQR(false)}
          revealModalOpen={showModal && roomState.phase === "REVEAL"}
        />
      </div>

      {/* Floating Action Buttons - For Players (not spectators) */}
      {isJoined && !isSpectator && !showModal && (
        <div className="floating-buttons-container">
          {/* Hidden file input for upload */}
          <input
            ref={floatingUploadRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFloatingUpload}
            style={{ display: "none" }}
            id="floating-upload-input"
          />

          {/* Admin Start Game Button - During deck building */}
          {isAdmin &&
            !isInGame &&
            (() => {
              const playersNeeded = 3 - roomState.players.length;
              const needMorePlayers = playersNeeded > 0;
              const minImages = getMinimumDeckSize(
                roomState.players.length,
                roomState.winTarget
              );
              const imagesNeeded = minImages - roomState.deckSize;
              const needMoreImages = imagesNeeded > 0;
              const isDisabled =
                isStartingGame || needMorePlayers || needMoreImages;

              const buttonText = isStartingGame
                ? t("common.loading")
                : needMorePlayers
                ? playersNeeded === 1
                  ? t("deckUploader.needOneMorePlayer")
                  : t("deckUploader.needMorePlayers", { count: playersNeeded })
                : needMoreImages
                ? t("status.needMoreImages", { count: imagesNeeded })
                : t("lobby.startGame");

              return (
                <button
                  className={`floating-action-button start-game-button ${
                    isStartingGame ? "btn-loading" : ""
                  } ${
                    isDisabled && !isStartingGame ? "btn-disabled-reason" : ""
                  }`}
                  onClick={() => {
                    if (!isStartingGame && !isDisabled) {
                      setIsStartingGame(true);
                      onStartGame();
                    }
                  }}
                  disabled={isDisabled}
                >
                  {isStartingGame ? (
                    <Icon.Loader
                      size={IconSize.large}
                      className="btn-spinner"
                    />
                  ) : (
                    <Icon.Rocket size={IconSize.large} />
                  )}
                  <span className="start-button-text">{buttonText}</span>
                </button>
              );
            })()}

          {/* QR Button - Toggle QR code during deck building */}
          {!isInGame && (
            <button
              className={`floating-action-button qr-button ${
                showQR ? "active" : ""
              }`}
              onClick={() => setShowQR(!showQR)}
              title={showQR ? "Hide QR Code" : "Show QR Code"}
            >
              <Icon.QRCode size={IconSize.large} />
            </button>
          )}

          {/* Upload Button - Quick upload during deck building */}
          {!isInGame && (
            <button
              className={`floating-action-button upload-button ${
                isFloatingUploading ? "btn-loading" : ""
              }`}
              onClick={() => floatingUploadRef.current?.click()}
              disabled={isFloatingUploading}
              title={t("deckUploader.uploadImages")}
            >
              {isFloatingUploading ? (
                <Icon.Loader size={IconSize.large} className="btn-spinner" />
              ) : (
                <Icon.Upload size={IconSize.large} />
              )}
            </button>
          )}

          {/* Cards/Settings Button - All Players */}
          <button
            className="floating-action-button cards-button"
            onClick={openCards}
            title={
              !isInGame
                ? "Players"
                : roomState.phase === "STORYTELLER_CHOICE"
                ? "My Cards"
                : roomState.phase === "PLAYERS_CHOICE"
                ? "Choose Card"
                : roomState.phase === "VOTING"
                ? "Vote"
                : "Results"
            }
          >
            {!isInGame ? (
              <Icon.Settings size={IconSize.large} />
            ) : roomState.phase === "STORYTELLER_CHOICE" ? (
              <Icon.Cards size={IconSize.large} />
            ) : roomState.phase === "PLAYERS_CHOICE" ? (
              <Icon.Cards size={IconSize.large} />
            ) : roomState.phase === "VOTING" ? (
              <Icon.Vote size={IconSize.large} />
            ) : roomState.phase === "REVEAL" ? (
              <Icon.Results size={IconSize.large} />
            ) : roomState.phase === "GAME_END" ? (
              <Icon.Trophy size={IconSize.large} />
            ) : (
              <Icon.Cards size={IconSize.large} />
            )}
          </button>

          {/* Admin Settings Button - During active game */}
          {isAdmin && isInGame && (
            <button
              className="floating-action-button admin-settings-button"
              onClick={openAdminSettings}
              title={t("adminSettings.title")}
            >
              <Icon.Settings size={IconSize.large} />
            </button>
          )}
        </div>
      )}

      {/* Floating Action Buttons - For Spectators (only in deck building) */}
      {isJoined && isSpectator && !isInGame && !showModal && (
        <div className="floating-buttons-container">
          {/* QR Button for spectators - toggle */}
          <button
            className={`floating-action-button qr-button ${
              showQR ? "active" : ""
            }`}
            onClick={() => setShowQR(!showQR)}
            title={showQR ? "Hide QR Code" : "Show QR Code"}
          >
            <Icon.QRCode size={IconSize.large} />
          </button>

          <button
            className="floating-action-button cards-button"
            onClick={openCards}
            title="Players"
          >
            <Icon.Settings size={IconSize.large} />
          </button>
        </div>
      )}

      {/* Admin Continue Button - During REVEAL phase on board */}
      {isJoined && isAdmin && roomState.phase === "REVEAL" && !showModal && (
        <button
          className="floating-action-button continue-button"
          onClick={() => {
            if (socket) {
              socket.emit("advanceRound");
            } else {
              // Demo mode fallback
              _onAdvanceRound();
            }
          }}
        >
          <Icon.ArrowForward size={IconSize.medium} /> Continue
        </button>
      )}

      {/* Modal Popup - Shows when player needs to act */}
      {showModal &&
        (() => {
          let modalContent: {
            header: React.ReactNode;
            footer: React.ReactNode;
            content: React.ReactNode;
            timer?: React.ReactNode;
          } | null = null;

          if (modalType === "cards") {
            // LOBBY - Before game starts
            if (!isInGame) {
              modalContent = ModalContent.LobbyModal({
                roomState,
                playerId,
                isSpectator,
                isAdmin,
                editingPlayerId,
                newName,
                socket,
                setEditingPlayerId,
                setNewName,
                handleStartEditName,
                handleSaveName,
                handleCancelEditName,
                onUploadImage: _onUploadImage,
                onDeleteImage: _onDeleteImage,
                onSetAllowPlayerUploads,
                onSetBoardBackground,
                onSetBoardPattern,
                onSetLanguage,
                onSetWinTarget,
                onUploadTokenImage,
                handleLogout,
                onKickPlayer: handleKickPlayer,
                onPromotePlayer: handlePromotePlayer,
                t,
              });
            }
            // STORYTELLER_CHOICE phase
            else if (roomState.phase === "STORYTELLER_CHOICE") {
              if (isStoryteller) {
                modalContent = ModalContent.StorytellerChoiceModal({
                  playerState,
                  selectedCardId,
                  clue,
                  localSubmittedCardId,
                  roomState,
                  setSelectedCardId,
                  setClue,
                  handleStorytellerSubmit,
                  onTimerExpired: handleStorytellerTimerExpired,
                  t,
                });
              } else {
                modalContent = ModalContent.WaitingStorytellerModal({
                  playerState,
                  roomState,
                  t,
                });
              }
            }
            // PLAYERS_CHOICE phase
            else if (roomState.phase === "PLAYERS_CHOICE") {
              if (!isStoryteller) {
                modalContent = ModalContent.PlayerChoiceModal({
                  playerState,
                  selectedCardId,
                  localSubmittedCardId,
                  roomState,
                  setSelectedCardId,
                  handlePlayerSubmit,
                  onTimerExpired: handlePlayerTimerExpired,
                  t,
                });
              } else {
                modalContent = ModalContent.WaitingPlayersModal({
                  playerState,
                  roomState,
                  t,
                });
              }
            }
            // VOTING phase
            else if (roomState.phase === "VOTING") {
              modalContent = ModalContent.VotingModal({
                roomState,
                playerState,
                selectedCardId,
                localVotedCardId,
                isStoryteller,
                isSpectator,
                setSelectedCardId,
                handleVote,
                onTimerExpired: handleVoteTimerExpired,
                t,
              });
            }
            // REVEAL phase
            else if (roomState.phase === "REVEAL") {
              modalContent = ModalContent.RevealModal({
                roomState,
                playerState,
                isAdmin,
                onAdvanceRound: () => {
                  if (socket) {
                    socket.emit("advanceRound");
                  } else {
                    // Demo mode fallback
                    _onAdvanceRound();
                  }
                  setShowModal(false);
                },
                t,
              });
            }
            // GAME_END phase
            else if (roomState.phase === "GAME_END") {
              modalContent = ModalContent.GameEndModal({
                roomState,
                isAdmin,
                onResetGame,
                onNewDeck,
                t,
              });
            }
          } else if (modalType === "adminSettings") {
            // Admin Settings Modal - Available during active game
            modalContent = AdminSettingsModal({
              roomState,
              playerId,
              isAdmin,
              isInGame: !!isInGame,
              onSetBoardPattern,
              onSetLanguage,
              onSetWinTarget,
              onKickPlayer: handleKickPlayer,
              onPromotePlayer: handlePromotePlayer,
              onConfirmWinTargetChange: handleConfirmWinTargetChange,
              t,
            });
          }

          return modalContent ? (
            <Modal
              isOpen={true}
              onClose={() => {
                setShowModal(false);
                setManuallyClosedModal(true); // Mark as manually closed
              }}
              header={modalContent.header}
              footer={modalContent.footer}
              opaqueBackdrop={!isInGame}
              timer={modalContent.timer}
            >
              {modalContent.content}
            </Modal>
          ) : null;
        })()}

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText="Confirm"
        confirmVariant="success"
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal({ ...confirmModal, isOpen: false })}
      />
    </div>
  );
}
