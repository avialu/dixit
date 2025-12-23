import { useState, useEffect } from 'react';
import { Socket } from 'socket.io-client';
import { storage } from '../utils/storage';

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

export function useGameState(socket: Socket | null) {
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [playerState, setPlayerState] = useState<PlayerState | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!socket) return;

    socket.on('roomState', (state: RoomState) => {
      setRoomState(state);
    });

    socket.on('playerState', (state: PlayerState) => {
      setPlayerState(state);
    });

    socket.on('error', (data: { message: string }) => {
      setError(data.message);
      setTimeout(() => setError(null), 5000);
    });

    socket.on('kicked', (data: { message: string }) => {
      // Show alert to user
      alert(data.message);
      
      // Clear local storage to prevent auto-reconnect
      storage.clientId.remove();
      
      // Reload page to return to join screen
      window.location.reload();
    });

    socket.on('phaseChanged', (data: { phase: string }) => {
      console.log('Phase changed to:', data.phase);
    });

    return () => {
      socket.off('roomState');
      socket.off('playerState');
      socket.off('error');
      socket.off('kicked');
      socket.off('phaseChanged');
    };
  }, [socket]);

  // Actions
  const join = (name: string, clientId: string) => {
    console.log('Emitting join event:', { name, clientId, socketConnected: socket?.connected });
    if (!socket?.connected) {
      console.error('Socket not connected!');
      setError('Not connected to server. Please refresh the page.');
      return;
    }
    socket.emit('join', { name, clientId });
  };

  const joinSpectator = (clientId: string) => {
    console.log('Emitting joinSpectator event:', { clientId, socketConnected: socket?.connected });
    if (!socket?.connected) {
      console.error('Socket not connected!');
      setError('Not connected to server. Please refresh the page.');
      return;
    }
    socket.emit('joinSpectator', { clientId });
  };

  const setAllowPlayerUploads = (allow: boolean) => {
    socket?.emit('adminSetAllowPlayerUploads', { allow });
  };

  const setWinTarget = (target: number | null) => {
    socket?.emit('adminSetWinTarget', { target });
  };

  const uploadImage = (imageData: string) => {
    socket?.emit('uploadImage', { imageData });
  };

  const deleteImage = (imageId: string) => {
    socket?.emit('deleteImage', { imageId });
  };

  const lockDeck = () => {
    socket?.emit('lockDeck');
  };

  const startGame = () => {
    socket?.emit('startGame');
  };

  const storytellerSubmit = (cardId: string, clue: string) => {
    socket?.emit('storytellerSubmit', { cardId, clue });
  };

  const playerSubmitCard = (cardId: string) => {
    socket?.emit('playerSubmitCard', { cardId });
  };

  const playerVote = (cardId: string) => {
    socket?.emit('playerVote', { cardId });
  };

  const advanceRound = () => {
    socket?.emit('advanceRound');
  };

  const resetGame = () => {
    socket?.emit('adminResetGame');
  };

  const newDeck = () => {
    socket?.emit('adminNewDeck');
  };

  const changeName = (newName: string) => {
    socket?.emit('changeName', { newName });
  };

  const kickPlayer = (targetPlayerId: string) => {
    socket?.emit('adminKickPlayer', { targetPlayerId });
  };

  const unlockDeck = () => {
    socket?.emit('adminUnlockDeck');
  };

  const promotePlayer = (targetPlayerId: string) => {
    socket?.emit('adminPromotePlayer', { targetPlayerId });
  };

  const leave = () => {
    socket?.emit('leave');
  };

  const uploadTokenImage = (imageData: string | null) => {
    socket?.emit('uploadTokenImage', { imageData });
  };

  const setBoardBackground = (imageData: string | null) => {
    socket?.emit('adminSetBoardBackground', { imageData });
  };

  const setBoardPattern = (pattern: "snake" | "spiral") => {
    socket?.emit('adminSetBoardPattern', { pattern });
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
    },
  };
}

