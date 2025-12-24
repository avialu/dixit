import { useState, useEffect } from "react";
import { RoomState, PlayerState } from "../hooks/useGameState";
import { GameBoard } from "../components/GameBoard";
import { QRCode } from "../components/QRCode";
import { Modal } from "../components/Modal";
import * as ModalContent from "../components/ModalContent";
import { ProfileImageUpload } from "../components/ProfileImageUpload";
import { Button, Icon, IconSize } from "../components/ui";
import { storage } from "../utils/storage";
import { ConfirmModal } from "../components/ConfirmModal";
import { getMinimumDeckSize } from "../utils/imageConstants";

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
  onSetBoardBackground: (imageData: string | null) => void;
  onSetBoardPattern: (pattern: "snake" | "spiral") => void;
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
  // Track local vote for locking UI
  const [localVotedCardId, setLocalVotedCardId] = useState<string | null>(null);
  // Track if user chose to be a spectator - initialize from localStorage
  const [isUserSpectator, setIsUserSpectator] = useState(
    storage.isSpectator.get()
  );
  // Track name editing state - which player ID is being edited
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  // Track profile image for join screen
  const [profileImage, setProfileImage] = useState<string | null>(null);
  // Track QR code visibility
  const [showQR, setShowQR] = useState(true);
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

  // Reset local submission state when phase changes
  useEffect(() => {
    const phase = roomState?.phase;
    // Clear local submissions when leaving STORYTELLER_CHOICE or PLAYERS_CHOICE
    if (phase !== "STORYTELLER_CHOICE") {
      setLocalSubmittedCardId(null);
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
      // Open for everyone - but DON'T trigger animation yet
      // Animation will only trigger when modal is closed
      shouldAutoOpen = true;
    } else if (phase === "GAME_END") {
      // Open for everyone to show winner
      shouldAutoOpen = true;
    }

    if (shouldAutoOpen) {
      setModalType("cards");
      setShowModal(true);
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
          showQR={showQR}
          onCloseQR={() => setShowQR(false)}
          revealModalOpen={showModal && roomState.phase === "REVEAL"}
        />
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
                roomState.players.length < 3 ||
                roomState.deckSize <
                  getMinimumDeckSize(
                    roomState.players.length,
                    roomState.winTarget
                  )
              }
              title={
                roomState.players.length < 3
                  ? "Need at least 3 players"
                  : roomState.deckSize <
                    getMinimumDeckSize(
                      roomState.players.length,
                      roomState.winTarget
                    )
                  ? `Need ${
                      getMinimumDeckSize(
                        roomState.players.length,
                        roomState.winTarget
                      ) - roomState.deckSize
                    } more images (${roomState.deckSize}/${getMinimumDeckSize(
                      roomState.players.length,
                      roomState.winTarget
                    )})`
                  : "Start Game"
              }
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
                onSetBoardBackground,
                onSetBoardPattern,
                onSetWinTarget,
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
              onClose={() => {
                setShowModal(false);
              }}
              header={modalContent.header}
              footer={modalContent.footer}
              opaqueBackdrop={!isInGame}
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
        confirmVariant="danger"
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal({ ...confirmModal, isOpen: false })}
      />
    </div>
  );
}
