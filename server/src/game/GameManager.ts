import { nanoid } from "nanoid";
import { Player } from "./Player.js";
import { DeckManager } from "./DeckManager.js";
import { ScoringEngine } from "./ScoringEngine.js";
import { GAME_CONSTANTS } from "./constants.js";
import { gameConfig, featureFlags } from "../config/index.js";
import { logger } from "../utils/logger.js";
import { GameStateError, ErrorSeverity } from "../utils/errors.js";
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
  private adminPassword: string | null = null; // Password for claiming admin role

  constructor() {
    this.state = {
      phase: GamePhase.DECK_BUILDING,
      players: new Map(),
      deck: [],
      allowPlayerUploads: true, // Players can upload by default
      deckLocked: false,
      winTarget: GAME_CONSTANTS.DEFAULT_WIN_TARGET, // Default: 30 points to win (1-30 scale)
      boardBackgroundImage: null, // No custom background by default
      boardPattern: "spiral", // Default: spiral (snail) pattern
      language: "en", // Default language: English
      soundEnabled: true, // Turn notification sounds enabled by default
      currentRound: 0,
      storytellerId: null,
      currentClue: null,
      submittedCards: [],
      votes: [],
      lastScoreDeltas: new Map(),
      phaseStartTime: null, // No timer during deck building
      phaseDuration: null,
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
        logger.info("Player reconnected as admin", {
          playerName: player.name,
          clientId,
        });
      } else if (wasAdmin && !player.isAdmin) {
        // Already logged in handleAdminConflictOnReconnect
      } else {
        logger.info("Player reconnected as regular player", {
          playerName: player.name,
          clientId,
        });
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
          logger.info("Transferred admin role", {
            playerName: p.name,
            newAdminId: pid,
          });
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
        imageCount: playerImages.length,
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
        cardCount: player.hand.length,
      });
      this.deckManager.returnCards(player.hand);
      player.hand = [];
    }

    // Remove from players map
    this.state.players.delete(clientId);

    logger.info("Player permanently removed", {
      clientId,
      playerName: player.name,
    });
  }

  /**
   * Auto-transfer admin role when admin is disconnected
   * Called after grace period expires if admin hasn't reconnected
   * @param disconnectedAdminId The client ID of the disconnected admin
   * @returns true if admin was transferred, false otherwise
   */
  autoTransferAdmin(disconnectedAdminId: string): boolean {
    const disconnectedAdmin = this.state.players.get(disconnectedAdminId);

    // Verify the player is still disconnected and still admin
    if (!disconnectedAdmin) {
      logger.debug("Auto-transfer admin: player not found", {
        disconnectedAdminId,
      });
      return false;
    }

    if (disconnectedAdmin.isConnected) {
      logger.debug("Auto-transfer admin: player already reconnected", {
        disconnectedAdminId,
      });
      return false;
    }

    if (!disconnectedAdmin.isAdmin) {
      logger.debug("Auto-transfer admin: player is no longer admin", {
        disconnectedAdminId,
      });
      return false;
    }

    // Find first connected player to become admin
    for (const [pid, p] of this.state.players.entries()) {
      if (pid !== disconnectedAdminId && p.isConnected) {
        // Demote disconnected admin
        disconnectedAdmin.isAdmin = false;

        // Promote new admin
        p.isAdmin = true;

        // Update deck manager admin
        this.deckManager.setAdmin(pid);

        logger.info("Auto-transferred admin from disconnected player", {
          previousAdminId: disconnectedAdminId,
          previousAdminName: disconnectedAdmin.name,
          newAdminId: pid,
          newAdminName: p.name,
        });

        return true;
      }
    }

    // No connected players to transfer to - keep admin with disconnected player
    logger.warn("No connected players to transfer admin to", {
      disconnectedAdminId,
      disconnectedAdminName: disconnectedAdmin.name,
    });
    return false;
  }

  kickPlayer(adminId: string, targetPlayerId: string): void {
    this.validateAdmin(adminId);

    // Cannot kick yourself
    if (adminId === targetPlayerId) {
      throw new Error("Cannot kick yourself");
    }

    const targetPlayer = this.state.players.get(targetPlayerId);
    if (!targetPlayer) {
      throw new Error("Player not found");
    }

    // Cannot kick the storyteller during their turn
    if (
      this.state.storytellerId === targetPlayerId &&
      (this.state.phase === GamePhase.STORYTELLER_CHOICE ||
        this.state.phase === GamePhase.PLAYERS_CHOICE ||
        this.state.phase === GamePhase.VOTING)
    ) {
      throw new Error("Cannot kick the storyteller during their turn");
    }

    // Transfer their images to the admin instead of deleting
    const transferredCount = this.deckManager.transferImages(
      targetPlayerId,
      adminId
    );
    if (transferredCount > 0) {
      logger.info("Transferred images from kicked player", {
        playerName: targetPlayer.name,
        transferredCount,
      });
    }

    // Return their cards to the deck if game hasn't started
    if (
      this.state.phase === GamePhase.DECK_BUILDING &&
      targetPlayer.hand.length > 0
    ) {
      logger.info("Returning cards from kicked player to deck", {
        playerName: targetPlayer.name,
        cardCount: targetPlayer.hand.length,
      });
      this.deckManager.returnCards(targetPlayer.hand);
      targetPlayer.hand = [];
    }

    // Remove the player completely
    this.state.players.delete(targetPlayerId);

    logger.info("Player kicked", {
      targetPlayerId,
      playerName: targetPlayer.name,
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

    logger.info("Changing player name", {
      playerId,
      oldName: player.name,
      newName,
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
    logger.info("Player promoted to admin", {
      playerName: targetPlayer.name,
      targetPlayerId,
    });
  }

  /**
   * Set the admin password (admin only)
   * Required before starting the game
   */
  setAdminPassword(adminId: string, password: string): void {
    this.validateAdmin(adminId);

    if (!password || password.length < 4) {
      throw new Error("Password must be at least 4 characters");
    }

    if (password.length > 20) {
      throw new Error("Password must be at most 20 characters");
    }

    this.adminPassword = password;
    logger.info("Admin password set", { adminId });
  }

  /**
   * Claim admin role with password
   * Any player can become admin if they have the correct password
   */
  claimAdmin(playerId: string, password: string): boolean {
    const player = this.state.players.get(playerId);
    if (!player) {
      throw new Error("Player not found");
    }

    if (!this.adminPassword) {
      throw new Error("No admin password has been set");
    }

    if (password !== this.adminPassword) {
      throw new Error("Incorrect password");
    }

    // Already admin? No change needed
    if (player.isAdmin) {
      return true;
    }

    // Demote current admin(s)
    for (const [pid, p] of this.state.players.entries()) {
      if (p.isAdmin) {
        p.isAdmin = false;
        logger.info("Admin demoted via claim", { playerName: p.name, playerId: pid });
      }
    }

    // Promote new admin
    player.isAdmin = true;
    this.deckManager.setAdmin(playerId);

    logger.info("Admin claimed with password", {
      newAdminId: playerId,
      newAdminName: player.name,
    });

    return true;
  }

  /**
   * Check if admin password has been set
   */
  hasAdminPassword(): boolean {
    return this.adminPassword !== null;
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
  cleanupDisconnectedPlayers(
    maxDisconnectedTime: number = gameConfig.maxDisconnectedTime
  ): number {
    const now = Date.now();
    let cleanedCount = 0;
    const playersToRemove: string[] = [];

    for (const [id, player] of this.state.players.entries()) {
      // Only cleanup disconnected players
      if (!player.isConnected && now - player.lastSeen > maxDisconnectedTime) {
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
          offlineMinutes,
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
            logger.info("Transferred images from cleaned player", {
              transferredCount,
            });
          }
        }

        // Return cards to deck if in deck building phase
        if (
          this.state.phase === GamePhase.DECK_BUILDING &&
          player.hand.length > 0
        ) {
          this.deckManager.returnCards(player.hand);
          logger.info("Returned cards from cleaned player", {
            cardCount: player.hand.length,
          });
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
      if (!imageData.startsWith("data:image/")) {
        throw new Error("Invalid image format: must be a valid image data URL");
      }

      const validTypes = [
        "data:image/jpeg",
        "data:image/jpg",
        "data:image/png",
        "data:image/webp",
        "data:image/gif",
      ];
      if (!validTypes.some((type) => imageData.startsWith(type))) {
        throw new Error(
          "Invalid image type: only JPEG, PNG, WebP, and GIF are supported"
        );
      }
    }

    this.state.boardBackgroundImage = imageData;
    logger.info("Board background image updated", {
      adminId,
      hasImage: imageData !== null,
    });
  }

  setBoardPattern(pattern: "snake" | "spiral", adminId: string): void {
    this.validateAdmin(adminId);

    this.state.boardPattern = pattern;
    logger.info("Board pattern updated", { adminId, pattern });
  }

  /**
   * Set game language (admin only)
   */
  setLanguage(language: "en" | "he", adminId: string): void {
    this.validateAdmin(adminId);

    this.state.language = language;
    logger.info("Game language updated", { adminId, language });
  }

  /**
   * Set sound enabled/disabled (admin only)
   */
  setSoundEnabled(enabled: boolean, adminId: string): void {
    this.validateAdmin(adminId);

    this.state.soundEnabled = enabled;
    logger.info("Sound setting updated", { adminId, enabled });
  }

  uploadImage(imageData: string, playerId: string): Card {
    const card = this.deckManager.addImage(imageData, playerId);
    return card;
  }

  deleteImage(cardId: string, playerId: string): boolean {
    return this.deckManager.deleteImage(cardId, playerId);
  }

  getDeckSize(): number {
    return this.deckManager.getDeckSize();
  }

  lockDeck(adminId: string): void {
    this.validateAdmin(adminId);
    this.deckManager.lock();
    this.state.deckLocked = true;
  }

  // Game Flow
  startGame(adminId: string): void {
    this.validateAdmin(adminId);

    // Require admin password to be set before starting game
    if (!this.adminPassword) {
      throw new Error("PASSWORD_REQUIRED");
    }

    if (this.state.phase !== GamePhase.DECK_BUILDING) {
      const phaseNames: Record<GamePhase, string> = {
        [GamePhase.DECK_BUILDING]: "Deck Building",
        [GamePhase.STORYTELLER_CHOICE]: "Storyteller's Turn",
        [GamePhase.PLAYERS_CHOICE]: "Players' Turn",
        [GamePhase.VOTING]: "Voting",
        [GamePhase.REVEAL]: "Results",
        [GamePhase.GAME_END]: "Game Over",
      };
      const currentPhaseName = phaseNames[this.state.phase] || this.state.phase;
      throw new GameStateError(
        `Game already started (current phase: ${currentPhaseName})`,
        this.state.phase,
        GamePhase.DECK_BUILDING
      );
    }

    if (this.state.players.size < GAME_CONSTANTS.MIN_PLAYERS) {
      throw new GameStateError(
        `Need at least ${GAME_CONSTANTS.MIN_PLAYERS} players to start`,
        this.state.phase,
        GamePhase.DECK_BUILDING
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

    // Start phase timer for storyteller
    this.state.phaseStartTime = Date.now();
    this.state.phaseDuration = GAME_CONSTANTS.PHASE_TIMERS.STORYTELLER_CHOICE;

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

    // Find the card in hand (don't remove it yet - will be removed at end of round)
    const card = player.hand.find((c) => c.id === cardId);
    if (!card) {
      throw new Error("Card not found in hand");
    }

    // Store card image data for reveal phase
    this.submittedCardsData.set(cardId, card.imageData);

    this.state.currentClue = clue;
    this.state.submittedCards = [{ cardId, playerId }];

    // Start phase timer for players
    this.state.phaseStartTime = Date.now();
    this.state.phaseDuration = GAME_CONSTANTS.PHASE_TIMERS.PLAYERS_CHOICE;

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

    // Find the card in hand (don't remove it yet - will be removed at end of round)
    const card = player.hand.find((c) => c.id === cardId);
    if (!card) {
      throw new Error("Card not found in hand");
    }

    // Store card image data for reveal phase
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

    // Start phase timer for voting
    this.state.phaseStartTime = Date.now();
    this.state.phaseDuration = GAME_CONSTANTS.PHASE_TIMERS.VOTING;

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

    // Start timer for reveal phase (30 seconds to view results)
    this.state.phaseStartTime = Date.now();
    this.state.phaseDuration = GAME_CONSTANTS.PHASE_TIMERS.REVEAL;

    this.state.phase = GamePhase.REVEAL;
  }

  // Auto-submit for storyteller when timer expires (server-side)
  autoSubmitStoryteller(): boolean {
    if (this.state.phase !== GamePhase.STORYTELLER_CHOICE) {
      return false;
    }

    const storytellerId = this.state.storytellerId;
    if (!storytellerId) return false;

    // Check if already submitted
    if (this.state.submittedCards.length > 0) {
      return false;
    }

    const player = this.state.players.get(storytellerId);
    if (!player || player.hand.length === 0) return false;

    // Pick random card
    const randomCard =
      player.hand[Math.floor(Math.random() * player.hand.length)];
    const defaultClue = `${player.name} was sleeping...`;

    // Store card image data for reveal phase
    this.submittedCardsData.set(randomCard.id, randomCard.imageData);

    this.state.currentClue = defaultClue;
    this.state.submittedCards = [
      { cardId: randomCard.id, playerId: storytellerId },
    ];

    // Start phase timer for players
    this.state.phaseStartTime = Date.now();
    this.state.phaseDuration = GAME_CONSTANTS.PHASE_TIMERS.PLAYERS_CHOICE;

    this.state.phase = GamePhase.PLAYERS_CHOICE;
    return true;
  }

  // Auto-submit for players who haven't submitted when timer expires
  autoSubmitPlayers(): boolean {
    if (this.state.phase !== GamePhase.PLAYERS_CHOICE) {
      return false;
    }

    const submittedPlayerIds = this.state.submittedCards.map(
      (sc) => sc.playerId
    );
    let anySubmitted = false;

    for (const [playerId, player] of this.state.players) {
      // Skip storyteller
      if (playerId === this.state.storytellerId) continue;

      // Skip if already submitted
      if (submittedPlayerIds.includes(playerId)) continue;

      // Skip if no cards in hand (shouldn't happen but safety check)
      if (player.hand.length === 0) continue;

      // Auto-submit random card
      const randomCard =
        player.hand[Math.floor(Math.random() * player.hand.length)];
      this.submittedCardsData.set(randomCard.id, randomCard.imageData);
      this.state.submittedCards.push({ cardId: randomCard.id, playerId });
      anySubmitted = true;
    }

    // If we submitted for anyone, check if we should advance
    if (anySubmitted) {
      const expectedSubmissions = this.state.players.size;
      if (this.state.submittedCards.length >= expectedSubmissions) {
        this.shuffleCardsForVoting();
      }
    }

    // Return true if we auto-submitted or if phase advanced to VOTING
    return anySubmitted || (this.state.phase as string) === "VOTING";
  }

  // Auto-vote for players who haven't voted when timer expires
  autoVotePlayers(): boolean {
    if (this.state.phase !== GamePhase.VOTING) {
      return false;
    }

    const votedPlayerIds = this.state.votes.map((v) => v.voterId);
    let anyVoted = false;

    for (const [playerId, player] of this.state.players) {
      // Skip storyteller
      if (playerId === this.state.storytellerId) continue;

      // Skip if already voted
      if (votedPlayerIds.includes(playerId)) continue;

      // Get own card to exclude from voting options
      const ownCard = this.state.submittedCards.find(
        (sc) => sc.playerId === playerId
      );
      const validCards = this.state.submittedCards.filter(
        (sc) => sc.cardId !== ownCard?.cardId
      );

      if (validCards.length === 0) continue;

      // Auto-vote for random valid card
      const randomCard =
        validCards[Math.floor(Math.random() * validCards.length)];
      this.state.votes.push({ voterId: playerId, cardId: randomCard.cardId });
      anyVoted = true;
    }

    // If we voted for anyone, check if we should advance to reveal
    if (anyVoted) {
      const expectedVotes = this.state.players.size - 1; // minus storyteller
      if (this.state.votes.length >= expectedVotes) {
        this.transitionToReveal();
      }
    }

    // Return true if we auto-voted or if phase advanced to REVEAL
    return anyVoted || (this.state.phase as string) === "REVEAL";
  }

  // Core logic to advance from REVEAL to next round (shared between admin and auto-advance)
  private advanceFromReveal(): void {
    if (this.state.phase !== GamePhase.REVEAL) {
      throw new Error("Can only advance from REVEAL phase");
    }

    // Periodic cleanup of disconnected players (every 5 rounds)
    if (
      featureFlags.enablePeriodicCleanup &&
      this.state.currentRound > 0 &&
      this.state.currentRound % 5 === 0
    ) {
      const cleanedCount = this.cleanupDisconnectedPlayers(
        gameConfig.maxDisconnectedTime
      );
      if (cleanedCount > 0) {
        logger.info("Periodic cleanup executed", {
          cleanedCount,
          round: this.state.currentRound,
        });
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

    // Remove submitted cards from players' hands (they were kept for display until now)
    for (const submittedCard of this.state.submittedCards) {
      const player = this.state.players.get(submittedCard.playerId);
      if (player) {
        player.removeCard(submittedCard.cardId);
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

    // Start phase timer for new storyteller
    this.state.phaseStartTime = Date.now();
    this.state.phaseDuration = GAME_CONSTANTS.PHASE_TIMERS.STORYTELLER_CHOICE;

    this.state.phase = GamePhase.STORYTELLER_CHOICE;
  }

  // Admin advances from REVEAL to next round (or game end)
  advanceToNextRound(adminId: string): void {
    this.validateAdmin(adminId);
    this.advanceFromReveal();
  }

  // Server auto-advances from REVEAL to next round (timer expired)
  autoAdvanceFromReveal(): void {
    this.advanceFromReveal();
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

    // Clear timer
    this.state.phaseStartTime = null;
    this.state.phaseDuration = null;

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

    // Clear timer
    this.state.phaseStartTime = null;
    this.state.phaseDuration = null;
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

    // Only send full deck images during DECK_BUILDING (for thumbnails in deck uploader)
    // During active game, deck images aren't needed - reduces payload significantly
    const deckImages =
      this.state.phase === GamePhase.DECK_BUILDING
        ? this.deckManager.getAllCards().map((c) => ({
            id: c.id,
            uploadedBy: c.uploadedBy,
            imageData: c.imageData,
          }))
        : [];

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
    const submittedPlayerIds = this.state.submittedCards.map(
      (sc) => sc.playerId
    );

    return {
      phase: this.state.phase,
      players,
      allowPlayerUploads: this.state.allowPlayerUploads,
      deckSize: this.deckManager.getDeckSize(),
      deckLocked: this.state.deckLocked,
      winTarget: this.state.winTarget,
      boardBackgroundImage: this.state.boardBackgroundImage,
      boardPattern: this.state.boardPattern,
      language: this.state.language,
      soundEnabled: this.state.soundEnabled,
      deckImages,
      currentRound: this.state.currentRound,
      storytellerId: this.state.storytellerId,
      currentClue: this.state.currentClue,
      submittedPlayerIds,
      revealedCards,
      votes,
      lastScoreDeltas,
      serverUrl: "", // Will be populated by server.ts
      phaseStartTime: this.state.phaseStartTime,
      phaseDuration: this.state.phaseDuration,
      hasAdminPassword: this.adminPassword !== null,
    };
  }

  getPlayerState(playerId: string): PlayerState | null {
    const player = this.state.players.get(playerId);
    if (!player) return null;

    const mySubmittedCard = this.state.submittedCards.find(
      (sc) => sc.playerId === playerId
    );
    const myVote = this.state.votes.find((v) => v.voterId === playerId);

    // Get the submitted card's image data so client can display it
    const mySubmittedCardImage = mySubmittedCard
      ? this.submittedCardsData.get(mySubmittedCard.cardId) || null
      : null;

    return {
      playerId,
      hand: player.hand, // Card stays in hand until next round
      mySubmittedCardId: mySubmittedCard?.cardId || null,
      mySubmittedCardImage,
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
        clientId,
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

  /**
   * Check if a player should have cards but doesn't, and deal them if needed.
   * This is a recovery mechanism for edge cases where a player's hand wasn't properly dealt.
   * @returns true if cards were dealt, false otherwise
   */
  repairPlayerHand(playerId: string): boolean {
    const player = this.state.players.get(playerId);
    if (!player) return false;

    // Only repair during active game phases where players need cards
    const activePhases = [
      GamePhase.STORYTELLER_CHOICE,
      GamePhase.PLAYERS_CHOICE,
      GamePhase.VOTING,
    ];

    if (!activePhases.includes(this.state.phase)) {
      return false;
    }

    // Player has already submitted a card, so they played successfully
    const hasSubmitted = this.state.submittedCards.some(
      (sc) => sc.playerId === playerId
    );

    // Calculate expected hand size
    // If they haven't submitted: HAND_SIZE cards (typically 6)
    // If they have submitted: HAND_SIZE - 1 cards (typically 5)
    const expectedMinCards = hasSubmitted
      ? GAME_CONSTANTS.HAND_SIZE - 1
      : GAME_CONSTANTS.HAND_SIZE;

    if (player.hand.length >= expectedMinCards) {
      return false; // Hand is fine
    }

    // Player needs cards - this is an error recovery scenario
    const needed = GAME_CONSTANTS.HAND_SIZE - player.hand.length;
    if (needed > 0 && this.deckManager.getDeckSize() >= needed) {
      const cards = this.deckManager.drawCards(needed);
      player.addCards(cards);
      logger.warn("Repaired player hand - dealt missing cards", {
        playerId,
        playerName: player.name,
        cardsDealt: needed,
        newHandSize: player.hand.length,
        phase: this.state.phase,
        hadSubmitted: hasSubmitted,
      });
      return true;
    }

    logger.error("Cannot repair player hand - not enough cards in deck", {
      playerId,
      playerName: player.name,
      needed,
      deckSize: this.deckManager.getDeckSize(),
    });
    return false;
  }
}
