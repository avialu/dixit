export enum GamePhase {
  WAITING_FOR_PLAYERS = 'WAITING_FOR_PLAYERS',
  DECK_BUILDING = 'DECK_BUILDING',
  STORYTELLER_CHOICE = 'STORYTELLER_CHOICE',
  PLAYERS_CHOICE = 'PLAYERS_CHOICE',
  REVEAL = 'REVEAL',
  VOTING = 'VOTING',
  SCORING = 'SCORING',
  ROUND_END = 'ROUND_END',
  GAME_END = 'GAME_END',
}

export enum DeckMode {
  HOST_ONLY = 'HOST_ONLY',
  PLAYERS_ONLY = 'PLAYERS_ONLY',
  MIXED = 'MIXED',
}

export interface Card {
  id: string;
  imageData: string; // base64 encoded image
  uploadedBy: string; // playerId
}

// Note: This interface matches the Player class structure
// The actual Player class is in Player.ts
export interface Player {
  id: string;
  name: string;
  isAdmin: boolean;
  isConnected: boolean;
  hand: Card[];
  score: number;
  // Methods from Player class
  addCards(cards: Card[]): void;
  removeCard(cardId: string): Card | null;
  hasCard(cardId: string): boolean;
  addScore(points: number): void;
  disconnect(): void;
  reconnect(): void;
}

export interface SubmittedCard {
  cardId: string;
  playerId: string;
  position?: number; // position after shuffle for reveal
}

export interface Vote {
  voterId: string;
  cardId: string;
}

export interface GameState {
  phase: GamePhase;
  players: Map<string, Player>;
  deck: Card[];
  deckMode: DeckMode;
  deckLocked: boolean;
  currentRound: number;
  storytellerId: string | null;
  currentClue: string | null;
  submittedCards: SubmittedCard[];
  votes: Vote[];
  lastScoreDeltas: Map<string, number>; // playerId -> score change
}

// Public state sent to all clients
export interface RoomState {
  phase: GamePhase;
  players: {
    id: string;
    name: string;
    isAdmin: boolean;
    isConnected: boolean;
    score: number;
    handSize: number;
  }[];
  deckMode: DeckMode;
  deckSize: number;
  deckLocked: boolean;
  deckImages: {
    id: string;
    uploadedBy: string;
  }[];
  currentRound: number;
  storytellerId: string | null;
  currentClue: string | null;
  revealedCards: {
    cardId: string;
    imageData: string;
    position: number;
  }[]; // Only populated during REVEAL, VOTING, SCORING phases
  votes: {
    voterId: string;
    cardId: string;
  }[]; // Only revealed during SCORING
  lastScoreDeltas: {
    playerId: string;
    delta: number;
  }[];
  serverUrl: string; // LAN URL for joining
}

// Private state sent to individual player
export interface PlayerState {
  playerId: string;
  hand: Card[];
  mySubmittedCardId: string | null;
  myVote: string | null;
}

export interface ScoreResult {
  playerId: string;
  delta: number;
  reason: string;
}

