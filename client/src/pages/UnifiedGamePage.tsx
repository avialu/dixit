import { useState, useEffect } from "react";
import { RoomState, PlayerState } from "../hooks/useGameState";
import { GameBoard } from "../components/GameBoard";
import { QRCode } from "../components/QRCode";
import { Modal } from "../components/Modal";
import * as ModalContent from "../components/ModalContent";
import { ProfileImageUpload } from "../components/ProfileImageUpload";
import { Button, Icon, IconSize } from "../components/ui";
import { useNotifications } from "../hooks/useNotifications";

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
  onUploadTokenImage: (imageData: string | null) => void;
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
  onStartGame,
  onChangeName: _onChangeName,
  onStorytellerSubmit,
  onPlayerSubmitCard,
  onPlayerVote,
  onAdvanceRound: _onAdvanceRound,
  onResetGame,
  onNewDeck,
  onUploadTokenImage,
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
  // Track profile image for join screen
  const [profileImage, setProfileImage] = useState<string | null>(null);
  // Track QR code visibility
  const [showQR, setShowQR] = useState(true);

  // Detect demo mode (no socket connection)
  const isDemoMode = socket === null;

  // Handle notification clicks - open appropriate modal
  const handleNotificationClick = (action: "openCards" | "openResults") => {
    console.log("Notification click handler - Action:", action);
    if (action === "openCards") {
      setModalType("cards");
      setShowModal(true);
    } else if (action === "openResults") {
      setModalType("cards");
      setShowModal(true);
    }
  };

  // Enable notifications for mobile/background play
  const { notificationPermission, requestNotificationPermission } =
    useNotifications(roomState, playerState, playerId, handleNotificationClick);

  // Fetch server URL on mount (for cases where we need it before roomState is available)
  useEffect(() => {
    if (!isDemoMode) {
      fetch("/api/server-info")
        .then((res) => res.json())
        .then((data) => setDetectedServerUrl(data.serverUrl))
        .catch((err) => console.warn("Could not fetch server URL:", err));
    }
  }, [isDemoMode]);

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
      "GAME_END",
    ].includes(roomState.phase);
  const myPlayer = roomState?.players.find((p) => p.id === playerId);
  const isAdmin = myPlayer?.isAdmin || false;
  const isStoryteller = roomState?.storytellerId === playerId;

  // Auto-open modal for game phases where player needs to take action
  useEffect(() => {
    const phase = roomState?.phase;
    let shouldAutoOpen = false;

    if (phase === "STORYTELLER_CHOICE" && isStoryteller) {
      // Only open for storyteller
      shouldAutoOpen = true;
    } else if (phase === "PLAYERS_CHOICE" && !isStoryteller && !isSpectator) {
      // Only open for non-storyteller players
      shouldAutoOpen = true;
    } else if (phase === "VOTING" && !isStoryteller && !isSpectator) {
      // Only open for non-storyteller players (who need to vote)
      shouldAutoOpen = true;
    } else if (phase === "REVEAL") {
      // Open for everyone
      shouldAutoOpen = true;
    }

    if (shouldAutoOpen) {
      setModalType("cards");
      setShowModal(true);
    }

    // Reset animation trigger when phase changes away from REVEAL
    if (phase !== "REVEAL") {
      setTriggerBoardAnimation(false);
    }
  }, [roomState?.phase, isStoryteller, isSpectator]);

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
    if (name.trim()) {
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
    setIsUserSpectator(true);
    _onJoinSpectator(clientId);
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

  const handleKickPlayer = (targetPlayerId: string) => {
    if (socket) {
      socket.emit("adminKickPlayer", { targetPlayerId });
    }
  };

  const handlePromotePlayer = (targetPlayerId: string) => {
    if (socket) {
      socket.emit("adminPromotePlayer", { targetPlayerId });
    }
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

    // Calculate player color based on placeholder index
    const getPlayerColor = () => {
      const colors = [
        "#f39c12",
        "#3498db",
        "#2ecc71",
        "#e74c3c",
        "#9b59b6",
        "#1abc9c",
      ];
      // Use a simple hash of current time for randomness
      const index = Math.floor(Math.random() * colors.length);
      return colors[index];
    };

    return (
      <div className="unified-game-page join-state">
        <div className="join-container">
          <div className="join-box">
            <h1>
              <Icon.Sparkles size={IconSize.xlarge} /> DIXIT
            </h1>
            <p className="tagline">A game of creative storytelling</p>

            <form onSubmit={handleJoin} className="join-form">
              {/* Profile Image Upload */}
              <div className="join-profile-section">
                <ProfileImageUpload
                  imageUrl={profileImage}
                  onUpload={setProfileImage}
                  onRemove={() => setProfileImage(null)}
                  playerColor={getPlayerColor()}
                  size="large"
                />
                <p className="join-profile-hint">Add your profile photo</p>
              </div>

              <input
                type="text"
                placeholder="Enter your name"
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
                disabled={!name.trim()}
              >
                <Icon.Rocket size={IconSize.medium} /> Join Game
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="large"
                onClick={handleSpectatorJoin}
              >
                👀 Join as Spectator
              </Button>
            </form>
            <div className="qr-code-section">
              <p className="qr-hint">Scan to join from mobile</p>
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
      {/* Board Background - Always Visible */}
      <div className="board-background">
        <GameBoard
          roomState={roomState}
          triggerAnimation={triggerBoardAnimation}
          showQR={showQR}
          onCloseQR={() => setShowQR(false)}
        />
      </div>

      {/* Notification Permission Banner */}
      {notificationPermission === "default" && isJoined && (
        <div className="notification-banner">
          <div className="notification-banner-content">
            <Icon.Info size={IconSize.medium} />
            <div className="notification-instructions-simple">
              <span>
                <strong>Get notified when it's your turn!</strong>
              </span>
              <span className="notification-explainer">
                When you tap "Enable", Safari will ask:{" "}
                <strong>"Allow notifications?"</strong>
                <br />→ Tap <strong>"Allow"</strong> ✅ (You'll get alerts even
                when screen is locked)
                <br />→ If you tap "Don't Allow" ❌, we'll show you how to fix
                it in Settings
              </span>
            </div>
            <Button
              variant="primary"
              size="small"
              onClick={requestNotificationPermission}
              title="This will show Safari's permission dialog"
            >
              Enable Notifications
            </Button>
            <Button
              variant="icon"
              onClick={() => {
                // Hide banner permanently for this session
                const banner = document.querySelector(
                  ".notification-banner"
                ) as HTMLElement;
                if (banner) banner.style.display = "none";
              }}
              title="Dismiss"
            >
              ×
            </Button>
          </div>
        </div>
      )}

      {/* Notification Denied - Show Instructions */}
      {notificationPermission === "denied" && isJoined && (
        <div className="notification-banner notification-banner-denied">
          <div className="notification-banner-content">
            <Icon.Warning size={IconSize.medium} />
            <div className="notification-instructions">
              <strong>Notifications Blocked</strong>
              <span>To enable notifications on iPhone:</span>
              <ol className="settings-steps">
                <li>
                  <strong>Step 1:</strong> Open your iPhone{" "}
                  <strong>Settings</strong> app (gray icon with gears)
                </li>
                <li>
                  <strong>Step 2:</strong> Scroll down and tap{" "}
                  <strong>Safari</strong>
                </li>
                <li>
                  <strong>Step 3:</strong> Scroll down to{" "}
                  <strong>"Settings for Websites"</strong> section
                </li>
                <li>
                  <strong>Step 4:</strong> Tap <strong>Notifications</strong>
                </li>
                <li>
                  <strong>Step 5:</strong> Find{" "}
                  <strong>{window.location.hostname}</strong> in the list
                </li>
                <li>
                  <strong>Step 6:</strong> Change from <strong>"Deny"</strong>{" "}
                  to <strong>"Allow"</strong>
                </li>
                <li>
                  <strong>Step 7:</strong> Return here and{" "}
                  <strong>refresh this page</strong>
                </li>
              </ol>
              <span className="settings-note">
                ⚠️ Note: Requires iOS 16.4 or later. If you don't see the
                Notifications option, your iOS version doesn't support web
                notifications yet.
              </span>
            </div>
            <Button
              variant="icon"
              onClick={() => {
                const banner = document.querySelectorAll(
                  ".notification-banner"
                )[1] as HTMLElement;
                if (banner) banner.style.display = "none";
              }}
              title="Dismiss"
            >
              ×
            </Button>
          </div>
        </div>
      )}

      {/* Floating Action Buttons - For Players (not spectators) */}
      {isJoined && !isSpectator && (
        <>
          {/* Cards Button - All Players */}
          <button
            className={`floating-action-button cards-button ${
              showModal && modalType === "cards" ? "hidden" : ""
            }`}
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
            {!isInGame && <Icon.Settings size={IconSize.large} />}
            {roomState.phase === "STORYTELLER_CHOICE" && (
              <Icon.Cards size={IconSize.large} />
            )}
            {roomState.phase === "PLAYERS_CHOICE" && (
              <Icon.Cards size={IconSize.large} />
            )}
            {roomState.phase === "VOTING" && (
              <Icon.Vote size={IconSize.large} />
            )}
            {roomState.phase === "REVEAL" && (
              <Icon.Results size={IconSize.large} />
            )}
            {roomState.phase === "GAME_END" && (
              <Icon.Trophy size={IconSize.large} />
            )}
          </button>

          {/* QR Button - Show when QR is closed during deck building */}
          {!isInGame && !showQR && (
            <button
              className="floating-action-button qr-button"
              onClick={() => setShowQR(true)}
              title="Show QR Code"
            >
              <Icon.QRCode size={IconSize.large} />
            </button>
          )}

          {/* Admin Start Game Button - During deck building */}
          {isAdmin && !isInGame && (
            <button
              className="floating-action-button start-game-button"
              onClick={onStartGame}
              disabled={
                roomState.players.length < 3 || roomState.deckSize < 100
              }
              title="Start Game"
            >
              <Icon.Rocket size={IconSize.large} />
            </button>
          )}
        </>
      )}

      {/* Floating Action Buttons - For Spectators (only in deck building) */}
      {isJoined && isSpectator && !isInGame && (
        <>
          <button
            className={`floating-action-button cards-button ${
              showModal && modalType === "cards" ? "hidden" : ""
            }`}
            onClick={openCards}
            title="Players"
          >
            <Icon.Settings size={IconSize.large} />
          </button>

          {/* QR Button for spectators */}
          {!showQR && (
            <button
              className="floating-action-button qr-button"
              onClick={() => setShowQR(true)}
              title="Show QR Code"
            >
              <Icon.QRCode size={IconSize.large} />
            </button>
          )}
        </>
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
                setEditingPlayerId,
                setNewName,
                handleStartEditName,
                handleSaveName,
                handleCancelEditName,
                onUploadImage: _onUploadImage,
                onDeleteImage: _onDeleteImage,
                onSetAllowPlayerUploads,
                onUploadTokenImage,
                handleLogout,
                onKickPlayer: handleKickPlayer,
                onPromotePlayer: handlePromotePlayer,
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
                  localSubmittedClue,
                  roomState,
                  setSelectedCardId,
                  setClue,
                  handleStorytellerSubmit,
                });
              } else {
                modalContent = ModalContent.WaitingStorytellerModal({
                  playerState,
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
                });
              } else {
                modalContent = ModalContent.WaitingPlayersModal({
                  playerState,
                  roomState,
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
              });
            }
            // GAME_END phase
            else if (roomState.phase === "GAME_END") {
              modalContent = ModalContent.GameEndModal({
                roomState,
                isAdmin,
                onResetGame,
                onNewDeck,
              });
            }
          }

          return modalContent ? (
            <Modal
              isOpen={true}
              onClose={() => setShowModal(false)}
              header={modalContent.header}
              footer={modalContent.footer}
              opaqueBackdrop={!isInGame}
            >
              {modalContent.content}
            </Modal>
          ) : null;
        })()}
    </div>
  );
}
