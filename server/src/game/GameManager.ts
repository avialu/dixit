import { nanoid } from "nanoid";
import { Player } from "./Player.js";
import { DeckManager } from "./DeckManager.js";
import { ScoringEngine } from "./ScoringEngine.js";
import {
  GamePhase,
  GameState,
  RoomState,
  PlayerState,
  SubmittedCard,
  Vote,
  Card,
} from "./types.js";

const HAND_SIZE = 6;
const MIN_IMAGES_TO_START = 100;

export class GameManager {
  private state: GameState;
  private deckManager: DeckManager;
  private submittedCardsData: Map<string, string>; // cardId -> imageData

  constructor() {
    this.state = {
      phase: GamePhase.DECK_BUILDING,
      players: new Map(),
      deck: [],
      allowPlayerUploads: true, // Players can upload by default
      deckLocked: false,
      winTarget: 29, // Default: 29 points to win (0-29 scale)
      currentRound: 0,
      storytellerId: null,
      currentClue: null,
      submittedCards: [],
      votes: [],
      lastScoreDeltas: new Map(),
    };
    this.deckManager = new DeckManager(""); // Will set admin on first player
    this.submittedCardsData = new Map();
  }

  // Player Management
  addPlayer(name: string, clientId: string): Player {
    if (this.state.players.has(clientId)) {
      // Reconnection
      const player = this.state.players.get(clientId)!;
      player.reconnect();
      return player;
    }

    const isFirstPlayer = this.state.players.size === 0;
    const player = new Player(clientId, name, isFirstPlayer);
    this.state.players.set(clientId, player);

    if (isFirstPlayer) {
      // Update deck manager with admin ID
      this.deckManager = new DeckManager(clientId);
    }

    return player;
  }

  removePlayer(clientId: string): void {
    const player = this.state.players.get(clientId);
    if (player) {
      player.disconnect();
    }
  }

  kickPlayer(adminId: string, targetPlayerId: string): void {
    this.validateAdmin(adminId);

    // Cannot kick yourself
    if (adminId === targetPlayerId) {
      throw new Error("Cannot kick yourself");
    }

    // Cannot kick during active game
    if (this.state.phase !== GamePhase.DECK_BUILDING) {
      throw new Error("Cannot kick players during an active game");
    }

    const targetPlayer = this.state.players.get(targetPlayerId);
    if (!targetPlayer) {
      throw new Error("Player not found");
    }

    // Remove the player completely
    this.state.players.delete(targetPlayerId);

    // Remove their uploaded images
    const cards = this.deckManager.getAllCards();
    cards.forEach((card) => {
      if (card.uploadedBy === targetPlayerId) {
        this.deckManager.deleteImage(card.id, adminId);
      }
    });
  }

  changeName(playerId: string, newName: string): void {
    const player = this.state.players.get(playerId);
    if (!player) {
      throw new Error("Player not found");
    }

    // Check if name is already taken by another player
    for (const [id, p] of this.state.players.entries()) {
      if (id !== playerId && p.name.toLowerCase() === newName.toLowerCase()) {
        throw new Error("Name is already taken");
      }
    }

    player.name = newName;
  }

  unlockDeck(adminId: string): void {
    this.validateAdmin(adminId);

    if (this.state.phase !== GamePhase.DECK_BUILDING) {
      throw new Error("Can only unlock deck during deck building phase");
    }

    this.deckManager.unlock();
    this.state.deckLocked = false;
  }

  promoteToAdmin(adminId: string, targetPlayerId: string): void {
    this.validateAdmin(adminId);

    // Cannot promote during active game
    if (this.state.phase !== GamePhase.DECK_BUILDING) {
      throw new Error("Cannot promote players during an active game");
    }

    const targetPlayer = this.state.players.get(targetPlayerId);
    if (!targetPlayer) {
      throw new Error("Player not found");
    }

    if (targetPlayer.isAdmin) {
      throw new Error("Player is already an admin");
    }

    // Promote target player
    targetPlayer.isAdmin = true;

    // Update deck manager to recognize new admin
    // Note: DeckManager stores adminId but we'll need to ensure both admins can manage
  }

  reconnectPlayer(clientId: string): Player | null {
    const player = this.state.players.get(clientId);
    if (player) {
      player.reconnect();
      return player;
    }
    return null;
  }

  getPlayer(clientId: string): Player {
    return this.state.players.get(clientId)!;
  }

  // Deck Management
  setAllowPlayerUploads(allow: boolean, adminId: string): void {
    this.validateAdmin(adminId);
    this.deckManager.setAllowPlayerUploads(allow);
    this.state.allowPlayerUploads = allow;
  }

  setWinTarget(target: number | null, adminId: string): void {
    this.validateAdmin(adminId);

    if (this.state.phase !== GamePhase.DECK_BUILDING) {
      throw new Error("Can only change win target during deck building");
    }

    this.state.winTarget = target;
  }

  uploadImage(imageData: string, playerId: string): Card {
    const card = this.deckManager.addImage(imageData, playerId);
    return card;
  }

  deleteImage(cardId: string, playerId: string): boolean {
    return this.deckManager.deleteImage(cardId, playerId);
  }

  lockDeck(adminId: string): void {
    this.validateAdmin(adminId);
    this.deckManager.lock();
    this.state.deckLocked = true;
  }

  // Game Flow
  startGame(adminId: string): void {
    this.validateAdmin(adminId);

    if (this.state.phase !== GamePhase.DECK_BUILDING) {
      throw new Error("Can only start game from DECK_BUILDING phase");
    }

    if (this.state.players.size < 3) {
      throw new Error("Need at least 3 players to start");
    }

    // Load default images if needed
    const currentDeckSize = this.deckManager.getDeckSize();
    if (currentDeckSize < MIN_IMAGES_TO_START) {
      console.log(`Loading default images (current deck: ${currentDeckSize})`);
      this.deckManager.loadDefaultImages();
    }

    // Lock the deck
    this.deckManager.lock();
    this.state.deckLocked = true;

    // Shuffle deck
    this.deckManager.shuffle();

    // Deal cards to all players
    for (const player of this.state.players.values()) {
      const cards = this.deckManager.drawCards(HAND_SIZE);
      player.addCards(cards);
    }

    // Set first storyteller (admin)
    const admin = Array.from(this.state.players.values()).find(
      (p) => p.isAdmin
    );
    this.state.storytellerId = admin!.id;
    this.state.currentRound = 1;

    this.state.phase = GamePhase.STORYTELLER_CHOICE;
  }

  storytellerSubmitCard(playerId: string, cardId: string, clue: string): void {
    if (this.state.phase !== GamePhase.STORYTELLER_CHOICE) {
      throw new Error("Not in storyteller choice phase");
    }

    if (this.state.storytellerId !== playerId) {
      throw new Error("You are not the storyteller");
    }

    const player = this.state.players.get(playerId);
    if (!player) {
      throw new Error("Player not found");
    }

    if (!player.hasCard(cardId)) {
      throw new Error("You do not have that card");
    }

    const card = player.removeCard(cardId);
    if (!card) {
      throw new Error("Card not found in hand");
    }

    // Store card image data
    this.submittedCardsData.set(cardId, card.imageData);

    this.state.currentClue = clue;
    this.state.submittedCards = [{ cardId, playerId }];

    this.state.phase = GamePhase.PLAYERS_CHOICE;
  }

  playerSubmitCard(playerId: string, cardId: string): void {
    if (this.state.phase !== GamePhase.PLAYERS_CHOICE) {
      throw new Error("Not in player choice phase");
    }

    if (this.state.storytellerId === playerId) {
      throw new Error("Storyteller cannot submit another card");
    }

    const player = this.state.players.get(playerId);
    if (!player) {
      throw new Error("Player not found");
    }

    // Check if already submitted
    if (this.state.submittedCards.some((sc) => sc.playerId === playerId)) {
      throw new Error("You have already submitted a card");
    }

    if (!player.hasCard(cardId)) {
      throw new Error("You do not have that card");
    }

    const card = player.removeCard(cardId);
    if (!card) {
      throw new Error("Card not found in hand");
    }

    // Store card image data
    this.submittedCardsData.set(cardId, card.imageData);

    this.state.submittedCards.push({ cardId, playerId });

    // Check if all players have submitted
    const expectedSubmissions = this.state.players.size;
    if (this.state.submittedCards.length === expectedSubmissions) {
      this.shuffleCardsForVoting();
    }
  }

  // Shuffle submitted cards for voting phase
  private shuffleCardsForVoting(): void {
    // Shuffle submitted cards for reveal
    const shuffled = [...this.state.submittedCards];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    // Assign positions
    shuffled.forEach((card, index) => {
      card.position = index;
    });

    this.state.submittedCards = shuffled;
    this.state.phase = GamePhase.VOTING;
  }

  playerVote(playerId: string, cardId: string): void {
    if (this.state.phase !== GamePhase.VOTING) {
      throw new Error("Not in voting phase");
    }

    if (this.state.storytellerId === playerId) {
      throw new Error("Storyteller cannot vote");
    }

    const player = this.state.players.get(playerId);
    if (!player) {
      throw new Error("Player not found");
    }

    // Check if already voted
    if (this.state.votes.some((v) => v.voterId === playerId)) {
      throw new Error("You have already voted");
    }

    // Check if voting for own card
    const ownCard = this.state.submittedCards.find(
      (sc) => sc.playerId === playerId
    );
    if (ownCard && ownCard.cardId === cardId) {
      throw new Error("Cannot vote for your own card");
    }

    // Check if card exists in submitted cards
    if (!this.state.submittedCards.some((sc) => sc.cardId === cardId)) {
      throw new Error("Invalid card");
    }

    this.state.votes.push({ voterId: playerId, cardId });

    // Check if all non-storytellers have voted
    const expectedVotes = this.state.players.size - 1; // minus storyteller
    if (this.state.votes.length === expectedVotes) {
      this.transitionToReveal();
    }
  }

  // Calculate scores and transition to REVEAL phase
  private transitionToReveal(): void {
    const storytellerCardId = this.state.submittedCards.find(
      (sc) => sc.playerId === this.state.storytellerId
    )!.cardId;

    const results = ScoringEngine.calculateScores(
      this.state.storytellerId!,
      storytellerCardId,
      this.state.submittedCards,
      this.state.votes
    );

    const aggregated = ScoringEngine.aggregateScores(results);

    // Apply scores immediately when entering REVEAL
    this.state.lastScoreDeltas.clear();
    for (const [playerId, delta] of aggregated.entries()) {
      const player = this.state.players.get(playerId);
      if (player) {
        player.addScore(delta);
        this.state.lastScoreDeltas.set(playerId, delta);
      }
    }

    this.state.phase = GamePhase.REVEAL;
  }

  // Admin advances from REVEAL to next round (or game end)
  advanceToNextRound(adminId: string): void {
    this.validateAdmin(adminId);

    if (this.state.phase !== GamePhase.REVEAL) {
      throw new Error("Can only advance from REVEAL phase");
    }

    // Check if any player reached win target
    if (this.state.winTarget !== null) {
      const hasWinner = Array.from(this.state.players.values()).some(
        (p) => p.score >= this.state.winTarget!
      );
      if (hasWinner) {
        this.state.phase = GamePhase.GAME_END;
        return;
      }
    }

    // Check if deck has enough cards to continue
    const needCards = this.state.players.size; // Each player needs 1 to refill to 6
    if (this.deckManager.getDeckSize() < needCards) {
      this.state.phase = GamePhase.GAME_END;
      return;
    }

    // Refill hands to 6 cards
    for (const player of this.state.players.values()) {
      const needed = HAND_SIZE - player.hand.length;
      if (needed > 0 && this.deckManager.getDeckSize() >= needed) {
        const cards = this.deckManager.drawCards(needed);
        player.addCards(cards);
      }
    }

    // Rotate storyteller
    const playerIds = Array.from(this.state.players.keys());
    const currentIndex = playerIds.indexOf(this.state.storytellerId!);
    const nextIndex = (currentIndex + 1) % playerIds.length;
    this.state.storytellerId = playerIds[nextIndex];

    // Reset round state
    this.state.submittedCards = [];
    this.state.votes = [];
    this.state.currentClue = null;
    this.state.currentRound++;
    this.submittedCardsData.clear();

    this.state.phase = GamePhase.STORYTELLER_CHOICE;
  }

  resetGame(adminId: string): void {
    this.validateAdmin(adminId);

    // Reset scores and hands
    for (const player of this.state.players.values()) {
      player.score = 0;
      player.hand = [];
    }

    // Reset game state but keep players and deck
    this.state.currentRound = 0;
    this.state.storytellerId = null;
    this.state.currentClue = null;
    this.state.submittedCards = [];
    this.state.votes = [];
    this.state.lastScoreDeltas.clear();
    this.submittedCardsData.clear();

    // Reset deck (shuffle again)
    this.deckManager.reset();

    // Keep the uploaded images but reset to deck building
    this.state.deckLocked = false;
    this.state.winTarget = 29; // Reset to default
    this.state.phase = GamePhase.DECK_BUILDING;
  }

  newDeck(adminId: string): void {
    this.validateAdmin(adminId);

    // Clear everything
    this.deckManager.clearAll();

    for (const player of this.state.players.values()) {
      player.score = 0;
      player.hand = [];
    }

    this.state.phase = GamePhase.DECK_BUILDING;
    this.state.currentRound = 0;
    this.state.storytellerId = null;
    this.state.currentClue = null;
    this.state.submittedCards = [];
    this.state.votes = [];
    this.state.lastScoreDeltas.clear();
    this.state.deckLocked = false;
    this.state.allowPlayerUploads = true;
    this.state.winTarget = 29; // Reset to default
    this.submittedCardsData.clear();
  }

  // State Projections
  getRoomState(): RoomState {
    const players = Array.from(this.state.players.values()).map((p) => ({
      id: p.id,
      name: p.name,
      isAdmin: p.isAdmin,
      isConnected: p.isConnected,
      score: p.score,
      handSize: p.hand.length,
    }));

    const deckImages = this.deckManager.getAllCards().map((c) => ({
      id: c.id,
      uploadedBy: c.uploadedBy,
    }));

    // Reveal cards only in appropriate phases
    const revealedCards =
      this.state.phase === GamePhase.REVEAL ||
      this.state.phase === GamePhase.VOTING
        ? this.state.submittedCards.map((sc) => {
            return {
              cardId: sc.cardId,
              imageData: this.submittedCardsData.get(sc.cardId) || "",
              position: sc.position || 0,
            };
          })
        : [];

    // During REVEAL, reveal votes (scoring already calculated)
    const votes =
      this.state.phase === GamePhase.REVEAL
        ? this.state.votes.map((v) => ({
            voterId: v.voterId,
            cardId: v.cardId,
          }))
        : [];

    const lastScoreDeltas = Array.from(
      this.state.lastScoreDeltas.entries()
    ).map(([playerId, delta]) => ({ playerId, delta }));

    return {
      phase: this.state.phase,
      players,
      allowPlayerUploads: this.state.allowPlayerUploads,
      deckSize: this.deckManager.getDeckSize(),
      deckLocked: this.state.deckLocked,
      winTarget: this.state.winTarget,
      deckImages,
      currentRound: this.state.currentRound,
      storytellerId: this.state.storytellerId,
      currentClue: this.state.currentClue,
      revealedCards,
      votes,
      lastScoreDeltas,
      serverUrl: "", // Will be populated by server.ts
    };
  }

  getPlayerState(playerId: string): PlayerState | null {
    const player = this.state.players.get(playerId);
    if (!player) return null;

    const mySubmittedCard = this.state.submittedCards.find(
      (sc) => sc.playerId === playerId
    );
    const myVote = this.state.votes.find((v) => v.voterId === playerId);

    return {
      playerId,
      hand: player.hand,
      mySubmittedCardId: mySubmittedCard?.cardId || null,
      myVote: myVote?.cardId || null,
    };
  }

  // Get submitted cards with full data for room state
  getSubmittedCardsWithData(): {
    cardId: string;
    imageData: string;
    position: number;
  }[] {
    return this.state.submittedCards.map((sc) => {
      return {
        cardId: sc.cardId,
        imageData: this.submittedCardsData.get(sc.cardId) || "",
        position: sc.position || 0,
      };
    });
  }

  // Helper
  private validateAdmin(playerId: string): void {
    const player = this.state.players.get(playerId);
    if (!player || !player.isAdmin) {
      throw new Error("Admin privileges required");
    }
  }

  // Expose submitted cards for proper data retrieval
  getSubmittedCards(): SubmittedCard[] {
    return this.state.submittedCards;
  }

  getCurrentPhase(): GamePhase {
    return this.state.phase;
  }
}
