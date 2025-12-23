import { nanoid } from "nanoid";
import { Player } from "./Player.js";
import { DeckManager } from "./DeckManager.js";
import { ScoringEngine } from "./ScoringEngine.js";
import { GAME_CONSTANTS } from "./constants.js";
import { gameConfig, featureFlags } from "../config/index.js";
import { logger } from "../utils/logger.js";
import {
  GamePhase,
  GameState,
  RoomState,
  PlayerState,
  SubmittedCard,
  Vote,
  Card,
  BoardPattern,
} from "./types.js";

export class GameManager {
  private state: GameState;
  private deckManager: DeckManager;
  private submittedCardsData: Map<string, string>; // cardId -> imageData
  private phaseTransitionLock: boolean = false; // Prevent race conditions during phase transitions

  constructor() {
    this.state = {
      phase: GamePhase.DECK_BUILDING,
      players: new Map(),
      deck: [],
      allowPlayerUploads: true, // Players can upload by default
      deckLocked: false,
      winTarget: GAME_CONSTANTS.DEFAULT_WIN_TARGET, // Default: 30 points to win (1-30 scale)
      boardBackgroundImage: null, // No custom background by default
      boardPattern: "snake", // Default: snake (zigzag) pattern
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
      // Reconnection - player object still exists
      const player = this.state.players.get(clientId)!;

      // Handle admin conflict (extract to helper method)
      const wasAdmin = player.isAdmin;
      this.handleAdminConflictOnReconnect(player, clientId);

      if (player.isAdmin) {
        logger.info("Player reconnected as admin", { playerName: player.name, clientId });
      } else if (wasAdmin && !player.isAdmin) {
        // Already logged in handleAdminConflictOnReconnect
      } else {
        logger.info("Player reconnected as regular player", { playerName: player.name, clientId });
      }

      player.reconnect();
      return player;
    }

    // Check if name is already taken by another CONNECTED player
    // Allow taking names of disconnected players (for reconnection scenarios)
    for (const [id, p] of this.state.players.entries()) {
      if (p.name.toLowerCase() === name.toLowerCase() && p.isConnected) {
        throw new Error("Name is already taken");
      }
    }

    // Check if there's already an admin
    let hasAdmin = false;
    for (const p of this.state.players.values()) {
      if (p.isAdmin) {
        hasAdmin = true;
        break;
      }
    }

    // Only make this player admin if there are no other players (first player)
    // If there are other players, only make admin if there's no existing admin
    const shouldBeAdmin = this.state.players.size === 0 || !hasAdmin;
    const player = new Player(clientId, name, shouldBeAdmin);
    this.state.players.set(clientId, player);

    if (shouldBeAdmin) {
      logger.info("Player joined as admin", { name, clientId });
      // Update deck manager with admin ID only if this is the first player
      if (this.state.players.size === 1) {
        this.deckManager = new DeckManager(clientId);
      }
    } else {
      logger.info("Player joined as regular player", { name, clientId });
    }

    return player;
  }

  removePlayer(clientId: string): void {
    const player = this.state.players.get(clientId);
    if (player) {
      player.disconnect();
    }
  }

  leavePlayer(clientId: string): void {
    // Actually remove the player from the game (for manual logout)
    const player = this.state.players.get(clientId);

    // Check if leaving player is admin
    const wasAdmin = player?.isAdmin || false;

    // If admin is leaving, transfer admin role to next player
    if (wasAdmin && this.state.players.size > 1) {
      // Find first non-leaving player to become admin
      for (const [pid, p] of this.state.players.entries()) {
        if (pid !== clientId) {
          p.isAdmin = true;
          logger.info("Transferred admin role", { playerName: p.name, newAdminId: pid });
          break;
        }
      }
    }

    // Get all images from the leaving player
    const playerImages = this.deckManager
      .getAllCards()
      .filter((card) => card.uploadedBy === clientId);

    // Transfer images to current admin (if any images exist)
    if (playerImages.length > 0) {
      const userName = player ? player.name : "Spectator";
      logger.info("Transferring images from leaving player", { 
        userName, 
        clientId, 
        imageCount: playerImages.length 
      });

      // Find current admin to transfer images to
      let newOwnerId = "";
      for (const [pid, p] of this.state.players.entries()) {
        if (p.isAdmin && pid !== clientId) {
          newOwnerId = pid;
          break;
        }
      }

      // Transfer the images if we found an admin
      if (newOwnerId) {
        this.deckManager.transferImages(clientId, newOwnerId);
      }
    }

    if (!player) {
      // Not a player (spectator or already removed)
      logger.info("Spectator logged out", { clientId });
      return;
    }

    // Return their cards to the deck if game hasn't started
    if (
      this.state.phase === GamePhase.DECK_BUILDING &&
      player.hand.length > 0
    ) {
      logger.info("Returning cards from leaving player to deck", { 
        playerName: player.name, 
        cardCount: player.hand.length 
      });
      this.deckManager.returnCards(player.hand);
      player.hand = [];
    }

    // Remove from players map
    this.state.players.delete(clientId);

    logger.info("Player permanently removed", { clientId, playerName: player.name });
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

    // Transfer their images to the admin instead of deleting
    const transferredCount = this.deckManager.transferImages(
      targetPlayerId,
      adminId
    );
    if (transferredCount > 0) {
      logger.info("Transferred images from kicked player", { 
        playerName: targetPlayer.name, 
        transferredCount 
      });
    }

    // Return their cards to the deck if game hasn't started
    if (
      this.state.phase === GamePhase.DECK_BUILDING &&
      targetPlayer.hand.length > 0
    ) {
      logger.info("Returning cards from kicked player to deck", { 
        playerName: targetPlayer.name, 
        cardCount: targetPlayer.hand.length 
      });
      this.deckManager.returnCards(targetPlayer.hand);
      targetPlayer.hand = [];
    }

    // Remove the player completely
    this.state.players.delete(targetPlayerId);

    logger.info("Player kicked", { targetPlayerId, playerName: targetPlayer.name });
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

    logger.info("Changing player name", { 
      playerId, 
      oldName: player.name, 
      newName 
    });
    player.name = newName;
  }

  setPlayerTokenImage(playerId: string, imageData: string | null): void {
    const player = this.state.players.get(playerId);
    if (!player) {
      throw new Error("Player not found");
    }

    player.setTokenImage(imageData);
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

    const currentAdmin = this.state.players.get(adminId);
    if (!currentAdmin) {
      throw new Error("Current admin not found");
    }

    const targetPlayer = this.state.players.get(targetPlayerId);
    if (!targetPlayer) {
      throw new Error("Player not found");
    }

    if (targetPlayer.isAdmin) {
      throw new Error("Player is already an admin");
    }

    // Demote current admin to regular player
    currentAdmin.isAdmin = false;
    logger.info("Admin demoted", { playerName: currentAdmin.name, adminId });

    // Promote target player
    targetPlayer.isAdmin = true;
    logger.info("Player promoted to admin", { playerName: targetPlayer.name, targetPlayerId });
  }

  reconnectPlayer(clientId: string): Player | null {
    const player = this.state.players.get(clientId);
    if (player) {
      // Handle admin conflict (extract to helper method)
      this.handleAdminConflictOnReconnect(player, clientId);

      player.reconnect();
      return player;
    }
    return null;
  }

  /**
   * Clean up disconnected players who have been offline for too long
   * @param maxDisconnectedTime Maximum time in milliseconds a player can be disconnected
   * @returns Number of players cleaned up
   */
  cleanupDisconnectedPlayers(maxDisconnectedTime: number = gameConfig.maxDisconnectedTime): number {
    const now = Date.now();
    let cleanedCount = 0;
    const playersToRemove: string[] = [];

    for (const [id, player] of this.state.players.entries()) {
      // Only cleanup disconnected players
      if (!player.isConnected && (now - player.lastSeen) > maxDisconnectedTime) {
        playersToRemove.push(id);
      }
    }

    // Remove the players
    for (const id of playersToRemove) {
      const player = this.state.players.get(id);
      if (player) {
        const offlineMinutes = Math.round((now - player.lastSeen) / 1000 / 60);
        logger.info("Cleaning up disconnected player", { 
          playerName: player.name, 
          playerId: id, 
          offlineMinutes 
        });
        
        // Transfer their images to admin before removal
        let adminId = "";
        for (const [pid, p] of this.state.players.entries()) {
          if (p.isAdmin && pid !== id) {
            adminId = pid;
            break;
          }
        }
        
        if (adminId) {
          const transferredCount = this.deckManager.transferImages(id, adminId);
          if (transferredCount > 0) {
            logger.info("Transferred images from cleaned player", { transferredCount });
          }
        }

        // Return cards to deck if in deck building phase
        if (this.state.phase === GamePhase.DECK_BUILDING && player.hand.length > 0) {
          this.deckManager.returnCards(player.hand);
          logger.info("Returned cards from cleaned player", { cardCount: player.hand.length });
        }

        this.state.players.delete(id);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      logger.info("Memory cleanup completed", { cleanedCount });
    }

    return cleanedCount;
  }

  getPlayer(clientId: string): Player | undefined {
    return this.state.players.get(clientId);
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

    // Validate target is a reasonable number if not null
    if (target !== null && (target < 1 || target > 100)) {
      throw new Error("Win target must be between 1 and 100 points");
    }

    this.state.winTarget = target;
  }

  setBoardBackgroundImage(imageData: string | null, adminId: string): void {
    this.validateAdmin(adminId);

    if (this.state.phase !== GamePhase.DECK_BUILDING) {
      throw new Error("Can only change board background during deck building");
    }

    // Validate image format if provided
    if (imageData !== null) {
      if (!imageData.startsWith('data:image/')) {
        throw new Error('Invalid image format: must be a valid image data URL');
      }
      
      const validTypes = [
        'data:image/jpeg',
        'data:image/jpg',
        'data:image/png',
        'data:image/webp',
        'data:image/gif',
      ];
      if (!validTypes.some(type => imageData.startsWith(type))) {
        throw new Error('Invalid image type: only JPEG, PNG, WebP, and GIF are supported');
      }
    }

    this.state.boardBackgroundImage = imageData;
    logger.info("Board background image updated", { adminId, hasImage: imageData !== null });
  }

  setBoardPattern(pattern: "snake" | "spiral", adminId: string): void {
    this.validateAdmin(adminId);

    if (this.state.phase !== GamePhase.DECK_BUILDING) {
      throw new Error("Can only change board pattern during deck building");
    }

    this.state.boardPattern = pattern;
    logger.info("Board pattern updated", { adminId, pattern });
  }

  uploadImage(imageData: string, playerId: string): Card {
    const card = this.deckManager.addImage(imageData, playerId);
    return card;
  }

  /**
   * Load default images into the deck
   * Can be called by admin to supplement uploaded images
   */
  loadDefaultImages(adminId: string): void {
    this.validateAdmin(adminId);
    
    if (this.state.phase !== GamePhase.DECK_BUILDING) {
      throw new Error("Can only load default images during DECK_BUILDING phase");
    }
    
    const currentDeckSize = this.deckManager.getDeckSize();
    logger.info("Loading default images", { currentDeckSize });
    this.deckManager.loadDefaultImages();
    
    const newDeckSize = this.deckManager.getDeckSize();
    logger.info("Loaded default images", { 
      previousSize: currentDeckSize, 
      newSize: newDeckSize,
      addedCount: newDeckSize - currentDeckSize
    });
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

    if (this.state.players.size < GAME_CONSTANTS.MIN_PLAYERS) {
      throw new Error(
        `Need at least ${GAME_CONSTANTS.MIN_PLAYERS} players to start`
      );
    }

    // Check if we have enough images based on player count and win target
    const currentDeckSize = this.deckManager.getDeckSize();
    const winTarget = this.state.winTarget ?? GAME_CONSTANTS.DEFAULT_WIN_TARGET;
    const minRequired = GAME_CONSTANTS.getMinDeckSize(
      this.state.players.size,
      winTarget
    );
    if (currentDeckSize < minRequired) {
      throw new Error(
        `Need at least ${minRequired} images to start (${this.state.players.size} players, ${winTarget} point target)`
      );
    }

    // Lock the deck
    this.deckManager.lock();
    this.state.deckLocked = true;

    // Shuffle deck
    this.deckManager.shuffle();

    // Deal cards to all players
    for (const player of this.state.players.values()) {
      const cards = this.deckManager.drawCards(GAME_CONSTANTS.HAND_SIZE);
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

    if (this.phaseTransitionLock) {
      throw new Error("Please wait, processing other submissions...");
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
      // Lock to prevent double transition
      if (this.phaseTransitionLock) return;
      this.phaseTransitionLock = true;
      
      try {
        this.shuffleCardsForVoting();
      } finally {
        this.phaseTransitionLock = false;
      }
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

    if (this.phaseTransitionLock) {
      throw new Error("Please wait, processing other votes...");
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
      // Lock to prevent double transition
      if (this.phaseTransitionLock) return;
      this.phaseTransitionLock = true;
      
      try {
        this.transitionToReveal();
      } finally {
        this.phaseTransitionLock = false;
      }
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

    // Periodic cleanup of disconnected players (every 5 rounds)
    if (featureFlags.enablePeriodicCleanup && this.state.currentRound > 0 && this.state.currentRound % 5 === 0) {
      const cleanedCount = this.cleanupDisconnectedPlayers(gameConfig.maxDisconnectedTime);
      if (cleanedCount > 0) {
        logger.info("Periodic cleanup executed", { cleanedCount, round: this.state.currentRound });
      }
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
      const needed = GAME_CONSTANTS.HAND_SIZE - player.hand.length;
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

    // Collect all cards from player hands back to the deck
    for (const player of this.state.players.values()) {
      if (player.hand.length > 0) {
        this.deckManager.returnCards(player.hand);
      }
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

    // Unlock and shuffle the deck for replay
    this.deckManager.reset();

    // Keep the uploaded images but reset to deck building
    this.state.deckLocked = false;
    this.state.winTarget = GAME_CONSTANTS.DEFAULT_WIN_TARGET; // Reset to default
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
    this.state.winTarget = GAME_CONSTANTS.DEFAULT_WIN_TARGET; // Reset to default
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
      tokenImage: p.tokenImage,
    }));

    const deckImages = this.deckManager.getAllCards().map((c) => ({
      id: c.id,
      uploadedBy: c.uploadedBy,
      imageData: c.imageData, // Include image data for thumbnails
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
              playerId: sc.playerId, // Include playerId so client knows who submitted each card
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

    // Track which players have submitted cards (for PLAYERS_CHOICE and STORYTELLER_CHOICE phases)
    const submittedPlayerIds = this.state.submittedCards.map((sc) => sc.playerId);

    return {
      phase: this.state.phase,
      players,
      allowPlayerUploads: this.state.allowPlayerUploads,
      deckSize: this.deckManager.getDeckSize(),
      deckLocked: this.state.deckLocked,
      winTarget: this.state.winTarget,
      boardBackgroundImage: this.state.boardBackgroundImage,
      boardPattern: this.state.boardPattern,
      deckImages,
      currentRound: this.state.currentRound,
      storytellerId: this.state.storytellerId,
      currentClue: this.state.currentClue,
      submittedPlayerIds,
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

  // Helpers
  private handleAdminConflictOnReconnect(
    player: Player,
    clientId: string
  ): void {
    if (!player.isAdmin) return;

    // Check if there's another admin (someone else became admin while they were disconnected)
    let hasOtherAdmin = false;
    for (const [id, p] of this.state.players.entries()) {
      if (id !== clientId && p.isAdmin) {
        hasOtherAdmin = true;
        break;
      }
    }

    // If someone else is admin now, demote this reconnecting player
    if (hasOtherAdmin) {
      player.isAdmin = false;
      logger.info("Player reconnected but was demoted", { 
        playerName: player.name, 
        clientId 
      });
    }
  }

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
