import { useState, useEffect } from 'react';
import { Socket } from 'socket.io-client';

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
}

export interface RoomState {
  phase: string;
  players: Player[];
  deckMode: string;
  deckSize: number;
  deckLocked: boolean;
  deckImages: { id: string; uploadedBy: string }[];
  currentRound: number;
  storytellerId: string | null;
  currentClue: string | null;
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

    socket.on('phaseChanged', (data: { phase: string }) => {
      console.log('Phase changed to:', data.phase);
    });

    return () => {
      socket.off('roomState');
      socket.off('playerState');
      socket.off('error');
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

  const setDeckMode = (mode: string) => {
    socket?.emit('adminSetDeckMode', { mode });
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

  return {
    roomState,
    playerState,
    error,
    actions: {
      join,
      setDeckMode,
      uploadImage,
      deleteImage,
      lockDeck,
      startGame,
      storytellerSubmit,
      playerSubmitCard,
      playerVote,
      advanceRound,
      resetGame,
      newDeck,
    },
  };
}

