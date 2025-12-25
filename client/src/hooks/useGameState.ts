import { useState, useEffect } from "react";
import { Socket } from "socket.io-client";
import { storage } from "../utils/storage";

export interface Card {
  id: string;
  imageData: string;
  uploadedBy: string;
}

export interface Player {
  id: string;
  name: string;
  isAdmin: boolean;
  isConnected: boolean;
  score: number;
  handSize: number;
  tokenImage: string | null;
}

export interface RoomState {
  phase: string;
  players: Player[];
  allowPlayerUploads: boolean; // If true, players can upload. Admin can always upload.
  deckSize: number;
  deckLocked: boolean;
  winTarget: number | null;
  boardBackgroundImage: string | null; // Custom board background image (base64 data URL)
  boardPattern: "snake" | "spiral"; // Snake (zigzag) or Spiral (snail) pattern
  language: "en" | "he"; // Room language preference (admin sets, players can override locally)
  deckImages: { id: string; uploadedBy: string; imageData: string }[];
  currentRound: number;
  storytellerId: string | null;
  currentClue: string | null;
  submittedPlayerIds: string[]; // Player IDs who have submitted cards
  revealedCards: { cardId: string; imageData: string; position: number }[];
  votes: { voterId: string; cardId: string }[];
  lastScoreDeltas: { playerId: string; delta: number }[];
  serverUrl: string;
}

export interface PlayerState {
  playerId: string;
  hand: Card[];
  mySubmittedCardId: string | null;
  myVote: string | null;
}

export interface GameErrorData {
  message: string;
  code?: string;
  severity?: "info" | "warning" | "error" | "fatal";
  retryable?: boolean;
  retryAfter?: number;
}

export function useGameState(socket: Socket | null) {
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [playerState, setPlayerState] = useState<PlayerState | null>(null);
  const [error, setError] = useState<GameErrorData | null>(null);

  useEffect(() => {
    if (!socket) return;

    // Track active error dismiss timeout to clean up on unmount
    let errorDismissTimeout: NodeJS.Timeout | null = null;

    socket.on("roomState", (state: RoomState) => {
      setRoomState(state);
    });

    socket.on("playerState", (state: PlayerState) => {
      console.log("Received playerState:", { 
        playerId: state.playerId, 
        handSize: state.hand?.length ?? 0,
        mySubmittedCardId: state.mySubmittedCardId 
      });
      setPlayerState(state);
    });

    // Request fresh player state when listeners are ready
    // This ensures we don't miss state updates due to race conditions
    const clientId = storage.clientId.get();
    if (clientId && storage.hasJoined.get() && socket.connected) {
      console.log("Requesting fresh state after listener setup");
      socket.emit("reconnect", { clientId });
    }

    // Enhanced error handling with severity-based auto-dismiss
    const handleError = (data: GameErrorData) => {
      // Clear any existing timeout before setting new error
      if (errorDismissTimeout) {
        clearTimeout(errorDismissTimeout);
        errorDismissTimeout = null;
      }

      setError(data);

      // Auto-dismiss only INFO and WARNING errors
      const severity = data.severity || "error";
      if (severity === "info" || severity === "warning") {
        const dismissTime = data.retryAfter ? data.retryAfter * 1000 : 5000;
        errorDismissTimeout = setTimeout(() => {
          setError(null);
          errorDismissTimeout = null;
        }, dismissTime);
      }
      // ERROR and FATAL require manual dismiss (user clicks away)
    };

    socket.on("error", handleError);
    socket.on("gameError", handleError);
    socket.on("validationError", handleError);
    socket.on("permissionError", handleError);
    socket.on("rateLimitError", handleError);

    socket.on("kicked", (data: { message: string }) => {
      // Show alert to user
      alert(data.message);

      // Clear all local storage to prevent auto-reconnect
      storage.clientId.remove();
      storage.hasJoined.remove();
      storage.isSpectator.remove();

      // Reload page to return to join screen
      window.location.reload();
    });

    // Mark as joined when successfully joining as player
    socket.on("joinSuccess", (data: { playerId: string }) => {
      console.log("Join successful:", data.playerId);
      storage.hasJoined.set(true);
    });

    // Mark as joined when successfully joining as spectator
    socket.on("joinSpectatorSuccess", (data: { spectatorId: string }) => {
      console.log("Spectator join successful:", data.spectatorId);
      storage.hasJoined.set(true);
    });

    socket.on("phaseChanged", (data: { phase: string }) => {
      console.log("Phase changed to:", data.phase);
    });

    return () => {
      // Clear any pending error dismiss timeout to prevent state updates on unmounted component
      if (errorDismissTimeout) {
        clearTimeout(errorDismissTimeout);
        errorDismissTimeout = null;
      }

      socket.off("roomState");
      socket.off("playerState");
      socket.off("error");
      socket.off("gameError");
      socket.off("validationError");
      socket.off("permissionError");
      socket.off("rateLimitError");
      socket.off("kicked");
      socket.off("joinSuccess");
      socket.off("joinSpectatorSuccess");
      socket.off("phaseChanged");
    };
  }, [socket]);

  // Actions
  const join = (name: string, clientId: string) => {
    console.log("Emitting join event:", {
      name,
      clientId,
      socketConnected: socket?.connected,
    });
    if (!socket?.connected) {
      console.error("Socket not connected!");
      setError({
        message: "Not connected to server. Please refresh the page.",
        severity: "error",
        code: "SOCKET_NOT_CONNECTED",
      });
      return;
    }
    socket.emit("join", { name, clientId });
  };

  const joinSpectator = (clientId: string) => {
    console.log("Emitting joinSpectator event:", {
      clientId,
      socketConnected: socket?.connected,
    });
    if (!socket?.connected) {
      console.error("Socket not connected!");
      setError({
        message: "Not connected to server. Please refresh the page.",
        severity: "error",
        code: "SOCKET_NOT_CONNECTED",
      });
      return;
    }
    socket.emit("joinSpectator", { clientId });
  };

  const setAllowPlayerUploads = (allow: boolean) => {
    socket?.emit("adminSetAllowPlayerUploads", { allow });
  };

  const setWinTarget = (target: number | null) => {
    socket?.emit("adminSetWinTarget", { target });
  };

  const uploadImage = (imageData: string) => {
    socket?.emit("uploadImage", { imageData });
  };

  const deleteImage = (imageId: string) => {
    socket?.emit("deleteImage", { imageId });
  };

  const lockDeck = () => {
    socket?.emit("lockDeck");
  };

  const startGame = () => {
    socket?.emit("startGame");
  };

  const storytellerSubmit = (cardId: string, clue: string) => {
    socket?.emit("storytellerSubmit", { cardId, clue });
  };

  const playerSubmitCard = (cardId: string) => {
    socket?.emit("playerSubmitCard", { cardId });
  };

  const playerVote = (cardId: string) => {
    socket?.emit("playerVote", { cardId });
  };

  const advanceRound = () => {
    socket?.emit("advanceRound");
  };

  const resetGame = () => {
    socket?.emit("adminResetGame");
  };

  const newDeck = () => {
    socket?.emit("adminNewDeck");
  };

  const changeName = (newName: string) => {
    socket?.emit("changeName", { newName });
  };

  const kickPlayer = (targetPlayerId: string) => {
    socket?.emit("adminKickPlayer", { targetPlayerId });
  };

  const unlockDeck = () => {
    socket?.emit("adminUnlockDeck");
  };

  const promotePlayer = (targetPlayerId: string) => {
    socket?.emit("adminPromotePlayer", { targetPlayerId });
  };

  const leave = () => {
    socket?.emit("leave");
  };

  const uploadTokenImage = (imageData: string | null) => {
    socket?.emit("uploadTokenImage", { imageData });
  };

  const setBoardBackground = (imageData: string | null) => {
    socket?.emit("adminSetBoardBackground", { imageData });
  };

  const setBoardPattern = (pattern: "snake" | "spiral") => {
    socket?.emit("adminSetBoardPattern", { pattern });
  };

  const setLanguage = (language: "en" | "he") => {
    socket?.emit("adminSetLanguage", { language });
  };

  const dismissError = () => {
    setError(null);
  };

  return {
    roomState,
    playerState,
    error,
    actions: {
      join,
      joinSpectator,
      setAllowPlayerUploads,
      setWinTarget,
      uploadImage,
      deleteImage,
      lockDeck,
      unlockDeck,
      startGame,
      storytellerSubmit,
      playerSubmitCard,
      playerVote,
      advanceRound,
      resetGame,
      newDeck,
      changeName,
      kickPlayer,
      promotePlayer,
      leave,
      uploadTokenImage,
      setBoardBackground,
      setBoardPattern,
      setLanguage,
      dismissError,
    },
  };
}
