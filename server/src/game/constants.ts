/**
 * Game Constants - Single Source of Truth
 *
 * All game-related constants defined in one place to prevent inconsistencies.
 * These now pull from centralized config with environment variable support.
 */

import { gameConfig, imageConfig } from '../config/index.js';

export const GAME_CONSTANTS = {
  /** Number of cards each player holds during the game */
  HAND_SIZE: gameConfig.handSize,

  /** Maximum total deck size (prevents memory issues, ~250MB @ 500KB per image) */
  MAX_DECK_SIZE: gameConfig.maxDeckSize,

  /** Maximum size of a single uploaded image (5MB) */
  MAX_IMAGE_SIZE: imageConfig.maxFileSize,

  /** Maximum number of images a single player can upload */
  MAX_IMAGES_PER_PLAYER: imageConfig.maxPerPlayer,

  /** Default win target (points needed to win) */
  DEFAULT_WIN_TARGET: gameConfig.defaultWinTarget,

  /** Minimum players required to start a game */
  MIN_PLAYERS: gameConfig.minPlayers,

  /** Maximum players allowed in a game */
  MAX_PLAYERS: gameConfig.maxPlayers,

  /**
   * Calculate minimum deck size based on game parameters
   * Formula: playersNumber × (6 + (winTarget/2)) × 1.3
   */
  getMinDeckSize: gameConfig.getMinDeckSize,
} as const;
