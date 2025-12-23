/**
 * Game Constants - Single Source of Truth
 *
 * All game-related constants defined in one place to prevent inconsistencies.
 */

export const GAME_CONSTANTS = {
  /** Number of cards each player holds during the game */
  HAND_SIZE: 6,

  /** Minimum number of images required to start a game */
  MIN_IMAGES_TO_START: 100,

  /** Maximum size of a single uploaded image (5MB) */
  MAX_IMAGE_SIZE: 5 * 1024 * 1024,

  /** Maximum number of images a single player can upload */
  MAX_IMAGES_PER_PLAYER: 200,

  /** Default win target (points needed to win) */
  DEFAULT_WIN_TARGET: 30,

  /** Minimum players required to start a game */
  MIN_PLAYERS: 3,
} as const;
