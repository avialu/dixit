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
  lastSeen: number; // Timestamp for cleanup
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

export type BoardPattern = "snake" | "spiral";

export type Language = "en" | "he";

export interface GameState {
  phase: GamePhase;
  players: Map<string, Player>;
  deck: Card[];
  allowPlayerUploads: boolean; // If true, players can upload images. Admin can always upload.
  deckLocked: boolean;
  winTarget: number | null; // Points to win (1-100 range, or null for unlimited)
  boardBackgroundImage: string | null; // Custom board background image (base64 data URL)
  boardPattern: BoardPattern; // Snake (zigzag) or Spiral (snail) pattern
  language: Language; // Room language preference set by admin
  soundEnabled: boolean; // Whether turn notification sounds are enabled (admin-controlled)
  currentRound: number;
  storytellerId: string | null;
  currentClue: string | null;
  submittedCards: SubmittedCard[];
  votes: Vote[];
  lastScoreDeltas: Map<string, number>; // playerId -> score change
  phaseStartTime: number | null; // Unix timestamp when current phase started (for timer)
  phaseDuration: number | null; // Duration in seconds for current phase timer (null = no timer)
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
  winTarget: number | null; // Points to win (1-100 range, or null for unlimited)
  boardBackgroundImage: string | null; // Custom board background image (base64 data URL)
  boardPattern: BoardPattern; // Snake (zigzag) or Spiral (snail) pattern
  language: Language; // Room language preference set by admin
  soundEnabled: boolean; // Whether turn notification sounds are enabled (admin-controlled)
  deckImages: {
    id: string;
    uploadedBy: string;
  }[];
  currentRound: number;
  storytellerId: string | null;
  currentClue: string | null;
  submittedPlayerIds: string[]; // Player IDs who have submitted cards (PLAYERS_CHOICE phase)
  revealedCards: {
    cardId: string;
    imageData: string;
    position: number;
    playerId: string; // Who submitted this card
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
  phaseStartTime: number | null; // Unix timestamp when current phase started (for timer)
  phaseDuration: number | null; // Duration in seconds for current phase timer (null = no timer)
  hasAdminPassword: boolean; // Whether admin password has been set (required to start game)
}

// Private state sent to individual player
export interface PlayerState {
  playerId: string;
  hand: Card[];
  mySubmittedCardId: string | null;
  mySubmittedCardImage: string | null;
  myVote: string | null;
}

export interface ScoreResult {
  playerId: string;
  delta: number;
  reason: string;
}
