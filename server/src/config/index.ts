/**
 * Centralized Configuration - Single Source of Truth
 *
 * All configurable values in one place, with environment variable support
 */

export const config = {
  // Game Configuration
  game: {
    /** Minimum players required to start a game */
    minPlayers: Number(process.env.MIN_PLAYERS) || 3,

    /** Maximum players allowed in a game */
    maxPlayers: Number(process.env.MAX_PLAYERS) || 20,

    /** Number of cards each player holds */
    handSize: 6,

    /** Maximum deck size (prevents memory issues) */
    maxDeckSize: Number(process.env.MAX_DECK_SIZE) || 1000,

    /** Default win target (points needed to win) */
    defaultWinTarget: 30,

    /** Maximum win target allowed */
    maxWinTarget: Number(process.env.MAX_WIN_TARGET) || 40,

    /** Minimum win target allowed */
    minWinTarget: Number(process.env.MIN_WIN_TARGET) || 10,

    /**
     * Calculate minimum deck size based on game parameters
     * Formula: playersNumber × (6 + (winTarget/2)) × 1.3, rounded up to nearest 10
     * This ensures enough cards for the game duration
     */
    getMinDeckSize: (playersCount: number, winTarget: number): number => {
      const calculated = playersCount * (6 + winTarget / 2) * 1.3;
      // Round up to nearest 10
      return Math.ceil(calculated / 10) * 10;
    },

    /** Maximum disconnection time before cleanup (ms) */
    maxDisconnectedTime: 30 * 60 * 1000, // 30 minutes
  },

  // Image Configuration
  image: {
    /** Maximum file size before compression (5MB) */
    maxFileSize: Number(process.env.MAX_IMAGE_SIZE) || 5 * 1024 * 1024,

    /** Maximum dimension for resized images */
    maxDimension: Number(process.env.MAX_IMAGE_DIMENSION) || 1024,

    /** Target compressed size (~500KB) */
    targetSize: 500 * 1024,

    /** Maximum images per non-admin player */
    maxPerPlayer: Number(process.env.MAX_IMAGES_PER_PLAYER) || 200,

    /** Initial JPEG quality */
    initialQuality: 0.9,

    /** Minimum JPEG quality */
    minQuality: 0.1,

    /** Quality reduction step */
    qualityStep: 0.1,

    /** Base64 size multiplier (for size estimation) */
    base64SizeMultiplier: 1.37,

    /** Parallel batch size for processing */
    parallelBatchSize: 3,
  },

  // Server Configuration
  server: {
    /** Server port */
    port: Number(process.env.PORT) || 3000,

    /** Server URL (auto-detected if not set) */
    url: process.env.SERVER_URL || null,

    /** Allowed CORS origins */
    allowedOrigins: process.env.ALLOWED_ORIGINS?.split(",") || [
      "http://localhost:5174",
      "http://localhost:3000",
    ],
  },

  // Rate Limiting Configuration
  rateLimit: {
    /** API rate limit window (ms) */
    apiWindowMs: 15 * 60 * 1000, // 15 minutes

    /** API max requests per window */
    apiMax: Number(process.env.API_RATE_LIMIT) || 100,

    /** Socket event limit per window - increased to 100 to support bulk image uploads */
    socketMax: Number(process.env.SOCKET_RATE_LIMIT) || 100,

    /** Socket event window (ms) */
    socketWindowMs: 10 * 1000, // 10 seconds
  },

  // Timing Configuration
  timing: {
    /** Reveal phase auto-transition delay (ms) */
    revealDuration: 3000,

    /** Error message display duration (ms) */
    errorDisplayDuration: 5000,

    /** Reconnection delay */
    reconnectionDelay: 1000,

    /** Max reconnection delay */
    maxReconnectionDelay: 30000,

    /** Reconnection backoff multiplier */
    reconnectionBackoff: 2,

    /** Max reconnection attempts */
    maxReconnectionAttempts: 5,
  },

  // Feature Flags
  features: {
    /** Enable periodic cleanup */
    enablePeriodicCleanup: process.env.ENABLE_PERIODIC_CLEANUP !== "false",

    /** Enable detailed logging */
    enableDetailedLogs: process.env.ENABLE_DETAILED_LOGS === "true",
  },

  // Admin Password Configuration
  admin: {
    /** Minimum password length */
    minPasswordLength: Number(process.env.ADMIN_MIN_PASSWORD_LENGTH) || 4,

    /** Maximum password length */
    maxPasswordLength: Number(process.env.ADMIN_MAX_PASSWORD_LENGTH) || 20,
  },
} as const;

// Export individual sections for convenience
export const gameConfig = config.game;
export const imageConfig = config.image;
export const serverConfig = config.server;
export const rateLimitConfig = config.rateLimit;
export const timingConfig = config.timing;
export const featureFlags = config.features;
