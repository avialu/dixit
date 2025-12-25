/**
 * Image processing constants
 * Centralized configuration for image handling
 */

export const IMAGE_CONSTANTS = {
  /** Maximum dimension (width or height) for resized images */
  MAX_DIMENSION: 1024,

  /** Target compressed size in bytes (500KB) */
  TARGET_SIZE: 500 * 1024,

  /** Initial JPEG quality for compression (0-1) */
  INITIAL_QUALITY: 0.9,

  /** Number of images to process in parallel */
  PARALLEL_BATCH_SIZE: 4,

  /** Maximum file size before processing (10MB) */
  MAX_FILE_SIZE: 10 * 1024 * 1024,

  /** Minimum quality threshold for compression (0-1) */
  MIN_QUALITY: 0.1,

  /** Base64 encoding size multiplier (~1.37x binary size) */
  BASE64_SIZE_MULTIPLIER: 1.37,

  /** Quality reduction step during iterative compression */
  QUALITY_STEP: 0.1,

  /** Default win target if not set */
  DEFAULT_WIN_TARGET: 30,
} as const;

/**
 * Calculate minimum deck size required to start the game
 * Formula: playersNumber × (6 + (winTarget/2)) × 1.3, rounded up to nearest 10
 *
 * @param playersCount Number of players in the game
 * @param winTarget Target score to win (defaults to 30 if null)
 * @returns Minimum number of images required (rounded to nearest 10)
 */
export function getMinimumDeckSize(
  playersCount: number,
  winTarget: number | null
): number {
  const target = winTarget ?? IMAGE_CONSTANTS.DEFAULT_WIN_TARGET;
  const calculated = playersCount * (6 + target / 2) * 1.3;
  // Round up to nearest 10
  return Math.ceil(calculated / 10) * 10;
}
