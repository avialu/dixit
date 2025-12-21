export enum GamePhase {
  DECK_BUILDING = "DECK_BUILDING",
  STORYTELLER_CHOICE = "STORYTELLER_CHOICE",
  PLAYERS_CHOICE = "PLAYERS_CHOICE",
  VOTING = "VOTING",
  REVEAL = "REVEAL",
  GAME_END = "GAME_END",
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
  tokenImage: string | null;
  // Methods from Player class
  addCards(cards: Card[]): void;
  removeCard(cardId: string): Card | null;
  hasCard(cardId: string): boolean;
  addScore(points: number): void;
  disconnect(): void;
  reconnect(): void;
  setTokenImage(imageData: string | null): void;
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
  allowPlayerUploads: boolean; // If true, players can upload images. Admin can always upload.
  deckLocked: boolean;
  winTarget: number | null; // 29, 49, or null (unlimited) - 0-based scoring
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
    tokenImage: string | null;
  }[];
  allowPlayerUploads: boolean; // If true, players can upload images. Admin can always upload.
  deckSize: number;
  deckLocked: boolean;
  winTarget: number | null; // 29, 49, or null (unlimited) - 0-based scoring
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
